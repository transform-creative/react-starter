import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";

/******************************
 * Delete.tsx
 * All DELETE operations. Be conservative — prefer soft deletes (a `deleted_at`
 * column) wherever you can avoid hard deletes.
 *
 * Example:
 *
 *   export async function deleteProfile(id: string) {
 *     const { error } = await supabase
 *       .from("profiles")
 *       .delete()
 *       .eq("id", id);
 *     if (error) {
 *       logError(error, ["deleteProfile"]);
 *       throw error;
 *     }
 *   }
 */

export {};
