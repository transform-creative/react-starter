import { supabase } from "./SupabaseClient";

/*************************
 * Sign user in with otp
 * @param email Email address to try sign in
 * @param originSite Optional brand identifier stored in user metadata on first signup
 */
export async function supabaseSignIn(
  email: string,
  originSite?: string,
) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: true,
      data: originSite ? { origin_site: originSite } : undefined,
    },
  });

  if (error) throw error;

  return data;
}

/*************************
 * Verify the OTP code emailed to the user.
 */
export async function SignInWithOtp(email: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email,
    token: otp,
    type: "email",
  });

  if (error) throw error;

  return data;
}

/***************************
 * Sign out the current session.
 */
export async function supabaseSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) return error;
  return true;
}

/***************************
 * Begin TOTP factor enrollment. Returns the factor id plus the
 * provisioning URI / shared secret / inline QR markup.
 * On `mfa_factor_name_conflict` we unenrol the unverified factor that
 * shares the friendly name and retry once — verified factors are never
 * touched.
 */
export async function enrollTotp(friendlyName?: string, issuer?: string) {
  const first = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
    issuer,
  });

  if (!first.error) return first.data;
  if (first.error.code !== "mfa_factor_name_conflict") throw first.error;

  const list = await supabase.auth.mfa.listFactors();
  const conflict = (list.data?.all ?? []).find(
    (f) =>
      f.factor_type === "totp" &&
      f.status !== "verified" &&
      f.friendly_name === friendlyName,
  );
  if (conflict) {
    await supabase.auth.mfa.unenroll({ factorId: conflict.id });
  }

  const retry = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
    issuer,
  });

  if (retry.error) throw retry.error;
  return retry.data;
}

/***************************
 * Create a verification challenge for an enrolled TOTP factor.
 */
export async function challengeTotp(factorId: string) {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error) throw error;
  return data;
}

/***************************
 * Verify a user-supplied TOTP code against an open challenge.
 * On success the session is upgraded to AAL2 automatically.
 */
export async function verifyTotp(
  factorId: string,
  challengeId: string,
  code: string,
) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });
  if (error) throw error;
  return data;
}

/***************************
 * List all MFA factors enrolled by the current user.
 */
export async function listMfaFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data;
}

/***************************
 * Unenroll an MFA factor by id.
 */
export async function unenrollFactor(factorId: string) {
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  return data;
}

/***************************
 * Read the current and required Authenticator Assurance Level for the session.
 *  - currentLevel === "aal2" → MFA is satisfied for this session
 *  - currentLevel === "aal1" && nextLevel === "aal2" → factor enrolled but challenge required
 *  - both "aal1" → no factor enrolled
 */
export async function getAal() {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data;
}

/***********************
 * Handle error logging
 * @param err The error object or message
 * @param stack Optional call stack hints (function names)
 */
export async function logError(err: any, stack?: string[]) {
  insertLog(err?.message || String(err), "error", {
    stack: stack?.toString(),
  });
  return true;
}

/****************************
 * Insert logs into the database via the `insert-logs` edge function.
 * In development, logs print to the console instead.
 */
export async function insertLog(
  event_type: string,
  severity: "info" | "warning" | "error" | "critical",
  metadata: Object,
) {
  if (process.env.NODE_ENV === "development") {
    console.info(severity, event_type, metadata);
    return;
  }

  await supabase.functions.invoke("insert-logs", {
    body: { event_type, severity, metadata },
  });
}
