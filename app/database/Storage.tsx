import { supabase } from "./SupabaseClient";

/******************************
 * Bucket constants — override per-project. Used by ImageHandler and the
 * `moderate-image` edge function.
 */
export const AVATAR_BUCKET = "profile_images";
export const QUARANTINE_BUCKET = "quarantine_images";

/*************************************
 * Upload a file to a Supabase storage bucket.
 */
export async function uploadStorageFile(
  bucket: string,
  filePath: string,
  file: File,
  options?: { upsert?: boolean; cacheControl?: string },
): Promise<{ path: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: options?.cacheControl ?? "3600",
      upsert: options?.upsert ?? false,
    });

  if (error) throw error;
  return data;
}

/*************************************
 * Get the public URL of a file in a storage bucket.
 */
export function getStoragePublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/*************************************
 * Delete a file from a Supabase storage bucket.
 */
export async function deleteStorageFile(bucket: string, filePath: string) {
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) throw error;
}
