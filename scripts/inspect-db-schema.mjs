import { createClient } from "@supabase/supabase-js";

const url = "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const supabase = createClient(url, serviceRoleKey);

async function check() {
  const { data: links } = await supabase.from("links").select("*").limit(3);
  console.log("Sample links:", links);

  const { data: pl } = await supabase.from("page_link_placements").select("*").limit(3);
  console.log("Sample placements:", pl);
}

check();
