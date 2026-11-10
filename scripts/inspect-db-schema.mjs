import { createClient } from "@supabase/supabase-js";

const url = "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const supabase = createClient(url, serviceRoleKey);

async function check() {
  const { data: media, error } = await supabase.from("media_assets").select("id, object_path, original_filename, size_bytes");
  if (error) console.error("Error fetching media:", error);
  console.log("Media assets in DB:", media?.length, media?.map(m => m.original_filename || m.object_path));
}

check();
