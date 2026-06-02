import { supabase } from "./SupabaseClient";

/******************************
 * Functions.tsx
 * Client-side wrappers around Supabase edge functions. Keep request and
 * response shapes here so components never invoke `supabase.functions.invoke`
 * directly.
 */

/*************************************
 * Invoke the stripe-checkout edge function.
 * Returns the embedded checkout client secret.
 */
export async function invokeStripeCheckout(
  body: Record<string, unknown>,
): Promise<{ clientSecret: string }> {
  const { data, error } = await supabase.functions.invoke("stripe-checkout", {
    body,
  });
  if (error) throw error;
  return data;
}

export interface ModerationResult {
  approved: true;
  publicUrl: string;
}

export interface ModerationRejection {
  approved: false;
  reason: string;
}

/*************************************
 * Invoke the moderate-image edge function.
 * Uploads must already be in the quarantine bucket. This function runs the
 * SafeSearch check, then moves approved files to `destinationBucket` or
 * deletes them on rejection.
 */
export async function invokeModerationCheck(body: {
  quarantinePath: string;
  destinationBucket: string;
  destinationPath: string;
}): Promise<ModerationResult | ModerationRejection> {
  const { data, error } = await supabase.functions.invoke("moderate-image", {
    body,
  });
  if (error) throw error;
  return data as ModerationResult | ModerationRejection;
}
