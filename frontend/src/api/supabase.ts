import { createClient } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";

const SUPABASE_URL = "https://idhysvwggrzhevbcoiiw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7CApDZILJ68KoYRN3ZnTPA_Ohxw4SBQ";
const BUCKET_NAME = "images";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadImageToSupabase(localUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: "base64",
  });

  const ext = localUri.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";

  const fileName = `prediction_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, decode(base64), {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error("Could not get public URL");
  }

  return urlData.publicUrl;
}
