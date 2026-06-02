import { supabase } from "./SupabaseClient";
import { logError } from "./Auth";

/******************************
 * Fetch.tsx
 * All SELECT queries live here. Components must NEVER call `supabase.from(...)`
 * directly — wrap every query in a function exported from this file so query
 * shapes can be audited in one place and so RLS errors land in `logError()`.
 *
 * Example:
 *
 *   export async function fetchProfile(id: string) {
 *     const { data, error } = await supabase
 *       .from("profiles")
 *       .select("*")
 *       .eq("id", id)
 *       .maybeSingle();
 *     if (error) {
 *       logError(error, ["fetchProfile"]);
 *       throw error;
 *     }
 *     return data;
 *   }
 */

export {};
