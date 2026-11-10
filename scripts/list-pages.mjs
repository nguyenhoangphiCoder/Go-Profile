import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data: pages, error } = await supabase.from("pages").select("id, slug, title, is_active, active_revision_id, theme");
  console.log("Pages:", pages, error);
}

main();
