import { supabase } from "./SupabaseClient";

/*************************
 * Sign user in with otp
 * @param email Email address to try sign in
 */
export async function supabaseSignIn(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) throw error;

  return data;
}

/*************************
 * Sign user in with otp code
 * @param email Email address to try sign in
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
 * Sign out the session
 */
export async function supabaseSignOut() {
  const { error } = await supabase.auth.signOut();

  if (error) return error;

  return true;
}

/***********************
 * Handle error logging
 * @param error The error object
 * @param fn The function name
 */
export async function logError(error: any, stack?: string[]) {
  console.error(error, "at", stack);
}
