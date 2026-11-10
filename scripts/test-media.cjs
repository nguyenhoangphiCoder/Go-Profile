const { createClient } = require("@supabase/supabase-js");
const supabase = createClient("https://iuoxkoburrtmjajfrsdb.supabase.co", (process.env.SUPABASE_SERVICE_ROLE_KEY || ""));

async function test() {
  const res = await supabase.from("media_assets").upsert({
    id: "e5555555-0000-0000-0000-000000000001",
    bucket_id: "public_media",
    object_path: "gogang-bg-source.png",
    visibility: "public",
    status: "ready",
    mime_type: "image/png",
    original_filename: "gogang-bg-source.png"
  });
  console.log("Media asset result:", res);
}
test();
