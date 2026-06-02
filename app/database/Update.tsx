import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";

/******************************
 * Update.tsx
 * All UPDATE operations. Wrap every mutation here so the diff between
 * insert and update payloads is obvious at the call site.
 *
 * Example:
 *
 *   export async function updateProfile(id: string, patch: Partial<Profile>) {
 *     const { data, error } = await supabase
 *       .from("profiles")
 *       .update(patch)
 *       .eq("id", id)
 *       .select()
 *       .single();
 *     if (error) {
 *       logError(error, ["updateProfile"]);
 *       throw error;
 *     }
 *     return data;
 *   }
 */

export {};
