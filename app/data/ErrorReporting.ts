/******************************
 * Decides whether an error is worth writing to the logs.
 */

/**
 * PostgREST codes meaning "your JWT's claims failed validation" — in practice
 * an expired `exp`. PostgREST v12+ raises PGRST303 for this. PGRST301
 * (undecodable token or bad signature) is deliberately absent: a forged or
 * garbled token is still worth logging.
 */
export const SESSION_EXPIRED_CODES: readonly string[] =
  ["PGRST303"];

/******************************
 * True when the error is a stale access token — typically a tab resumed from
 * the background before supabase-js refreshed it. The refresh follows and the
 * next request succeeds, and every query on the page fails at once, so these
 * are noise rather than signal.
 */
export function isSessionExpired(
  err: unknown,
): boolean {
  const code = (err as { code?: unknown } | null)
    ?.code;
  return (
    typeof code === "string" &&
    SESSION_EXPIRED_CODES.includes(code)
  );
}
