import { createClient } from "@supabase/supabase-js";

const url = "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "");

const supabase = createClient(url, serviceRoleKey);

async function check() {
  const { data: pages } = await supabase.from("pages").select("id, internal_name, status, published_revision_id");
  console.log("Pages:", pages);

  const { data: slugs } = await supabase.from("page_slugs").select("*");
  console.log("Slugs:", slugs);
}

check();
