import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";

/******************************
 * Insert.tsx
 * All INSERT operations. Same rule as Fetch — never insert from a component,
 * always wrap here so payload shapes stay consistent.
 *
 * Example:
 *
 *   export async function insertProfile(profile: Partial<Profile>) {
 *     const { data, error } = await supabase
 *       .from("profiles")
 *       .insert(profile)
 *       .select()
 *       .single();
 *     if (error) {
 *       logError(error, ["insertProfile"]);
 *       throw error;
 *     }
 *     return data;
 *   }
 */

export {};
