# Project: React Starter

A Transform Creative starter template for React + Supabase + Vercel projects.

## Stack

- **React 19** + **React Router v7** (SSR-first, `react-router-serve`)
- **TypeScript** throughout (strict, `~/*` alias → `./app/*`)
- **Supabase** (auth, database, storage, edge functions, pgmq queue)
- **Vite 7** + **Tailwind CSS 4** (used sparingly — prefer custom CSS variables)
- **Vercel** (web deployment)
- **Vitest** + React Testing Library (baseline test setup)
- **Stripe** (embedded checkout via `stripe-checkout` edge function)
- **react-email** (transactional templates rendered in `email-handler` edge function)

## Replace before shipping

When bootstrapping a new project from this template, update:

- [ ] `supabase/config.toml` — set `project_id` to the new project slug
- [ ] `package.json` — replace `<PROJECT_REF>` placeholders in the `deploy:*` scripts
- [ ] `app/data/BrandConfig.tsx` — set `site_name`, `legal_entity_name`, copy
- [ ] `app/app.css` — set the accent color and font family if changing brand
- [ ] `.env.example` → `.env.local` with real values for each env var
- [ ] `app/data/Objects.tsx` — update `CONTACT.orgEmail`
- [ ] `vercel.json` — extend the CSP `connect-src` / `img-src` for any extra services
- [ ] `supabase/templates/magic_link.html` — re-render via `npm run render-auth-emails` after editing `MagicLinkEmail.tsx`
- [ ] `app/routes.ts` and `app/routes/IndexRoute.tsx` — replace the placeholder landing page

---

## Project Structure

```text
/app
├── /routes          - Page-level route components (file-based routing target)
├── /presentation    - UI components, organized by feature
│   ├── /authentication
│   └── /elements    - Reusable UI primitives (see list below)
├── /database        - All Supabase queries / mutations
│   ├── SupabaseClient.tsx, Auth.tsx, Storage.tsx, Functions.tsx
│   ├── Fetch.tsx, Insert.tsx, Update.tsx, Delete.tsx, Helper.tsx
├── /data            - Types, constants, shared utilities
├── /setup           - SQL functions used in migrations
├── root.tsx         - Root layout, shared context, ErrorBoundary, modal mounts
├── routes.ts        - Route config
└── app.css          - Global styles, CSS variables, utility classes
/supabase
├── config.toml
├── templates/       - Auth email HTML (re-rendered from react-email templates)
└── functions/
    ├── stripe-checkout/
    ├── email-handler/
    ├── moderate-image/
    └── _shared/emails/   - react-email npm workspace
```

---

## File & Component Structure

Every component follows the pattern in `app/data/ExampleComponent.tsx`:

```tsx
import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";

export interface MyComponentProps {
  // props here
}

/******************************
 * MyComponent
 * One-line description — what this component does and any non-obvious behaviour.
 */
export function MyComponent({}: MyComponentProps) {
  const context: SharedContextProps =
    useOutletContext();
  return <div />;
}
```

Rules:

- Always export a `Props` interface for every component
- Use `useOutletContext<SharedContextProps>()` to read global context
- Block-comment header on every top-level function with trailing asterisks
- Named exports only (no default exports — routes are the exception)
- Import types with `import type` where possible

---

## Routing

React Router v7 file-based routing in `/app/routes/` configured via `routes.ts`.

| Route             | File                      |
| ----------------- | ------------------------- |
| `/`               | `IndexRoute.tsx`          |
| `/authentication` | `AuthenticationRoute.tsx` |

Add new routes by adding a file in `app/routes/` and registering it in `routes.ts`.

---

## Global Context (`SharedContextProps`)

Provided at `root.tsx` via `<Outlet context={...}>`. Access in any route or component:

```tsx
const context: SharedContextProps =
  useOutletContext();
const {
  session,
  popAlert,
  isMobile,
  brandConfig,
} = context;
```

Key fields:

- `session` — Supabase auth session (null if unauthenticated)
- `brandConfig` — BrandCopy resolved once via `getBrandConfig()`
- `popAlert(header, body?, isError?)` — fire a toast
- `isMobile` — true if the user agent looks mobile
- `paymentStepper` / `setPaymentStepper` — PaymentStepper state (modal is mounted at root)
- `aalCurrent`, `aalNext`, `refreshAal` — Supabase Authenticator Assurance Level (MFA)

---

## Database Layer

All Supabase operations live in `/app/database/`. Components never call `supabase.from(...)` directly — every query is wrapped here so RLS errors land in `logError()` and payload shapes stay consistent.

| File                 | Purpose                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `SupabaseClient.tsx` | Client init (reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)                   |
| `Auth.tsx`           | Sign in/out, OTP, TOTP MFA enrollment, `logError`, `insertLog`                      |
| `Storage.tsx`        | Storage upload, public URL helper, delete                                           |
| `Functions.tsx`      | Edge function invocation wrappers (`invokeStripeCheckout`, `invokeModerationCheck`) |
| `Fetch.tsx`          | SELECT queries (stub — add your own)                                                |
| `Insert.tsx`         | INSERT (stub)                                                                       |
| `Update.tsx`         | UPDATE (stub)                                                                       |
| `Delete.tsx`         | DELETE (stub)                                                                       |
| `Helper.tsx`         | Shared data transforms                                                              |

---

## Styling

Hybrid system — prefer custom CSS variables and utility classes before reaching for Tailwind.

### CSS variables (defined in `app.css`)

- **Colors:** `--txt`, `--bkg`, `--accent`, `--secondary`, `--safe`, `--danger`, `--warning`
- **Fluid typography:** `--text-hero`, `--text-h1..h5`, `--text-sm`, `--text-xsm` (all `clamp()`-based)
- **Fluid spacing:** `--space-5`, `--space-10`, `--space-20`, `--space-30`
- **Borders:** `--border` (12.5px), `--border-lg` (25px)

### Utility classes

- Layout: `.row`, `.col`, `.middle`, `.between`, `.center`, `.grid-150/250/350`, `.wrap`
- Sizing: `.w-10..w-100`, `.h-100`, `.dvh-50..dvh-100`
- Spacing: `.m-5/10/20`, `.p-5/10/20`, plus axis-specific (`.mt-*`, `.pb-*`, etc.)
- Display: `.accent`, `.secondary`, `.bkg`, `.txt`, `.outline`, `.outline-accent`
- Shadows: `.s-5`, `.s-10`
- Animation: `.fade-sm`, `.fade-md`, `.btn-breathe`, `.skeleton`
- UI: `.modal-bkg`, `.menu`, `.pill`, `.carousel`

### Component-level CSS

Place a `.css` file alongside the component (`LabelInput.css`, `FramedAvatar.css`) for component-specific styles.

### Responsive design

- Layout breakpoint at **1200px** (`.shrink-wrap`, `.shrink-hide`)
- Typography and spacing use `clamp()` for fluid scaling
- Use `isMobile` from context for JS-driven mobile logic

---

## Animation

- **GSAP** — Primary animation library. SSR-safe (`noExternal` in `vite.config.ts`). Use `useGSAP()` and timelines for complex sequences.
- **Framer Motion** — Component-level layout transitions.
- **react-transition-group** — Enter/exit lifecycle animations.
- **CSS keyframes** — `fadeIn`, `fadeOut`, `breathe`, `spin-pause`, `skeleton-shimmer`.

---

## Elements

Reusable UI primitives in `/app/presentation/elements/`:

`Alert`, `AnimatedText`, `Banner`, `Carousel`, `Checkbox`, `ContactBlock`, `ContextModal`, `ErrorLabel`, `ExpandableCard`, `FeatureButton`, `FramedAvatar`, `Icon`, `Loading`, `NavBar`, `PillToggle`, `PopUpModal`, `SlideOutModal`, `Table`, `Tooltip`, `TypeInput`, `AddressFields`, `ImageHandler`, `LabelInput`, `TCFreeType` (Quill), `PaymentStepper`.

---

## PaymentStepper

3-step Stripe checkout flow mounted at root level. Trigger from anywhere:

```tsx
context.setPaymentStepper({
  active: true,
  cart: [
    {
      product: { name: "T-shirt", amount: 2500 },
      quantity: 1,
    },
  ],
  successUrl: "/checkout/success",
});
```

The modal hits the `stripe-checkout` edge function which creates an embedded Stripe Checkout session.

---

## Edge Functions

| Function          | Purpose                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `stripe-checkout` | Creates Stripe embedded checkout session, optional Upstash rate limiting |
| `email-handler`   | Drains `general_email_queue`, sends via react-email + Resend             |
| `moderate-image`  | Google Vision SafeSearch on uploads, quarantine → destination bucket     |

Deploy via `npm run deploy:<function-name>` after replacing `<PROJECT_REF>` in `package.json`.

---

## React Email

Templates live in `supabase/functions/_shared/emails/templates/`:

- `MagicLinkEmail` — Supabase magic-link OTP
- `WelcomeEmail` — post-signup welcome
- `ErrorLogEmail` — admin error digest
- `PaymentReceiptEmail` — post-checkout receipt
- `_EmailComponents.tsx` — shared `EmailButton`, `EmailFooter`, `EmailWrapper`

Preview locally: `npm run email` (opens http://localhost:3000).
Re-render `supabase/templates/magic_link.html` after changes: `npm run render-auth-emails`.

---

## Forms

- Use `LabelInput` for all text inputs (supports `outline`, `error`, async select)
- Use `react-select` (wrapped in `LabelInput`) for dropdowns
- Validate with **Zod** schemas (import `z` from `~/data/zod` to keep the JIT off for CSP)
- Display errors with `ErrorLabel`

---

## Environment Variables

See `.env.example` for the full list. The critical ones:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
BRAND_NAME=
RESEND_API_KEY=             # email-handler
STRIPE_SECRET_KEY=          # stripe-checkout
GOOGLE_VISION_API_KEY=      # moderate-image
```

---

## Commands

```bash
npm run dev              # Start dev server (Vite + RR)
npm run build            # Production build
npm run start            # Serve the production build
npm run typecheck        # React Router typegen + tsc
npm run lint             # ESLint
npm run format           # Prettier
npm run test             # Vitest
npm run email            # react-email preview server
npm run render-auth-emails  # Re-render supabase/templates/magic_link.html
```

---

## Rules

- Never use default exports (route files are the exception — React Router requires them)
- Never query Supabase directly in components — use `/app/database/` functions
- Always type `useOutletContext()` with `SharedContextProps`
- Always define a `Props` interface for every component
- Follow the comment block structure from `ExampleComponent.tsx`
- Prefer CSS variables and utility classes over inline styles or arbitrary Tailwind values
- Use `~/*` path alias instead of relative imports where possible
- Never use `opacity` in styling unless explicitly required — prefer the `var(--accent-(sm|md|lg))` classes
- Prefer **Luxon** for all date/time over native JS `Date`
- Never use `<span>` — default to `<div>` (or the most appropriate element), and wrap raw text in `<p>` or `<h*>`
- Don't deploy edge functions automatically — the developer does this manually

---

## Appendix — Multi-brand pattern (optional)

`BrandConfig.tsx` ships with a single-brand default. If a project needs to serve multiple brands on different domains (Transform Creative does this for Ping-pong-a-thon / Pong Strong), extend `getBrandConfig()` to switch on `window.location.hostname` / port:

```tsx
const BRAND_A: BrandCopy = {
  site_name: "Brand A",
  origin_site: "brand_a" /* ... */,
};
const BRAND_B: BrandCopy = {
  site_name: "Brand B",
  origin_site: "brand_b" /* ... */,
};

export function getBrandConfig(): BrandCopy {
  if (typeof window === "undefined")
    return BRAND_A;
  const { hostname, port } = window.location;
  if (
    hostname.includes("brand-b") ||
    port === "5174"
  )
    return BRAND_B;
  return BRAND_A;
}
```

Keep `origin_site` as the database-facing identifier so rows can be scoped per brand.
