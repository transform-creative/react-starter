# Security Policy

## Reporting a vulnerability

Email **support@transformcreative.com.au** with a description, reproduction steps, and supporting evidence. Please do not open a public GitHub issue for vulnerabilities.

We aim to acknowledge reports within 2 business days.

---

## Patch SLA

Aligned with the Australian Signals Directorate **Essential Eight — Maturity Level 1** "Patch Applications" mitigation.

| Severity | SLA from disclosure / fix availability |
|----------|----------------------------------------|
| Critical | 48 hours |
| High     | 2 weeks |
| Medium   | 1 month |
| Low      | Best effort, next quarterly cycle |

Vulnerabilities are surfaced by:

- **Dependabot** — weekly grouped PRs across the npm manifest, GitHub Actions, and the `supabase/functions/_shared/emails` ecosystem
- **PR Quality Gate** (`.github/workflows/pr-quality-gate.yml`) — `npm audit --production --audit-level=high`, Gitleaks, ESLint, and `tsc --noEmit` on every PR
- **Daily Vulnerability Scan** (`.github/workflows/daily-vuln-scan.yml`) — scheduled `npm audit` plus OSV Scanner; opens a GitHub issue on findings
- **Supabase advisor** — DB-side security lints; review quarterly

---

## Authentication

End-user authentication is **email one-time-password** (OTP) via Supabase Auth (`signInWithOtp`). No passwords are stored.

For projects that need elevated controls, MFA helpers are wired up in `app/database/Auth.tsx`:
- `enrollTotp`, `challengeTotp`, `verifyTotp` — TOTP enrolment + verification
- `getAal` — read Authenticator Assurance Level for the current session
- `listMfaFactors`, `unenrollFactor` — factor management

Enforce MFA at the DB level via an `is_admin()` SECURITY DEFINER function in RLS policies — not just in the UI — so it cannot be bypassed by a malicious client. See `app/setup/SqlFunctions/is_admin.sql` for the starting point.

---

## Transport & headers

`vercel.json` ships with a strict baseline:

- HSTS (`max-age=63072000; includeSubDomains; preload`)
- CSP with `'unsafe-inline'` only for scripts/styles, `frame-ancestors 'none'`, `object-src 'none'`
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricting camera, microphone, geolocation, and payment to `self` + Stripe

When adding a new third-party origin (analytics, fonts, CDN), update `vercel.json` `connect-src` / `img-src` / `script-src` as appropriate.

---

## Image uploads

The `moderate-image` edge function runs server-side Google Vision SafeSearch on every upload:

1. Client uploads to the private `quarantine_images` bucket
2. Edge function validates magic-byte MIME type and size (20 MiB cap)
3. SafeSearch flags `LIKELY` or `VERY_LIKELY` for adult/violence → reject + delete
4. Approved files move to the destination bucket; rejected files are removed

This is wired through `ImageHandler`'s optional `moderationFn` prop — opt in per upload site by passing `invokeModerationCheck` from `database/Functions.tsx`.

---

## Secrets

- All `.env` variants are gitignored
- Gitleaks runs on every PR via the quality gate workflow
- Server-side secrets (Stripe, Vision, Resend, Upstash, Supabase service role) belong in Supabase function secrets (`supabase secrets set`), not in `.env.local`
- Client-bundled vars must use the `VITE_` prefix; everything else stays server-side

---

## Logging

Errors flow through `logError()` in `database/Auth.tsx`, which writes to the `insert-logs` edge function. Avoid `console.error` in shipped code — it doesn't reach the audit log.
