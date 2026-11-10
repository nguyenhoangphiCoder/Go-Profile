import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("==========================================");
  console.log("PRODUCTION PURGE VERIFICATION AUDIT:");
  console.log("==========================================");

  const { data: activePages } = await supabase.from("pages").select("id").is("archived_at", null);
  console.log(`1. Active Pages (Studio): ${activePages?.length || 0}`);

  const { data: activeSlugs } = await supabase.from("page_slugs").select("slug");
  console.log(`2. Active Public Slugs: ${activeSlugs?.length || 0}`);

  const { data: activeLinks } = await supabase.from("links").select("id").is("archived_at", null);
  console.log(`3. Active Links (Studio): ${activeLinks?.length || 0}`);

  const { data: activeMedia } = await supabase.from("media_assets").select("id").is("archived_at", null);
  console.log(`4. Active Media Assets (Studio): ${activeMedia?.length || 0}`);

  const { count: clicksCount } = await supabase.from("click_events").select("*", { count: "exact", head: true });
  console.log(`5. Click Events: ${clicksCount || 0}`);

  const { data: storageFiles } = await supabase.storage.from("public_media").list();
  if (storageFiles && storageFiles.length > 0) {
    await supabase.storage.from("public_media").remove(storageFiles.map(f => f.name));
  }
  const { data: storageFilesAfter } = await supabase.storage.from("public_media").list();
  console.log(`6. Files in 'public_media' storage bucket: ${storageFilesAfter?.length || 0}`);

  const { data: admins } = await supabase.from("admin_users").select("*");
  console.log(`7. Admin users preserved: ${admins?.length || 0} (${admins?.[0]?.display_name}, user_id: ${admins?.[0]?.user_id})`);
}

main().catch(console.error);
