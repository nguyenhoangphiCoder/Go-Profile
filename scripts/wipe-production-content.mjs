import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function wipeProductionContent() {
  console.log("==========================================");
  console.log("FINALIZING PRODUCTION PURGE...");
  console.log("Preserving: admin_users table");
  console.log("==========================================\n");

  const now = new Date().toISOString();

  // 1. Delete click_events
  console.log("1. Clearing click_events...");
  const { error: errClicks } = await supabase.from("click_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (errClicks) console.error("Error clearing click_events:", errClicks.message);
  else console.log("✓ click_events deleted.");

  // 2. Delete page_slugs
  console.log("2. Clearing page_slugs...");
  const { error: errSlugs } = await supabase.from("page_slugs").delete().neq("slug", "__dummy__");
  if (errSlugs) console.error("Error clearing page_slugs:", errSlugs.message);
  else console.log("✓ page_slugs deleted.");

  // 3. Unlink published_revision_id on pages
  console.log("3. Unpublishing and unlinking pages...");
  const { error: errUnlinkRev } = await supabase.from("pages").update({ 
    published_revision_id: null,
    status: "archived",
    archived_at: now
  }).neq("id", "00000000-0000-0000-0000-000000000000");
  if (errUnlinkRev) console.error("Error archiving pages:", errUnlinkRev.message);
  else console.log("✓ All pages archived and unpublished.");

  // 4. Archive page_links
  console.log("4. Archiving page_links...");
  const { error: errPlk } = await supabase.from("page_links").update({
    archived_at: now
  }).neq("id", "00000000-0000-0000-0000-000000000000");
  if (errPlk) console.error("Error archiving page_links:", errPlk.message);
  else console.log("✓ All page_links archived.");

  // 5. Archive links
  console.log("5. Archiving links...");
  const { error: errLinks } = await supabase.from("links").update({
    is_active: false,
    archived_at: now,
    default_media_id: null
  }).neq("id", "00000000-0000-0000-0000-000000000000");
  if (errLinks) console.error("Error archiving links:", errLinks.message);
  else console.log("✓ All links archived.");

  // 6. Archive media_assets
  console.log("6. Archiving media_assets...");
  const { error: errMedia } = await supabase.from("media_assets").update({
    archived_at: now
  }).neq("id", "00000000-0000-0000-0000-000000000000");
  if (errMedia) console.error("Error archiving media_assets:", errMedia.message);
  else console.log("✓ All media_assets archived.");

  // 7. Storage cleanup in public_media bucket
  console.log("7. Cleaning storage files in 'public_media' bucket...");
  const { data: storageFiles } = await supabase.storage.from("public_media").list();
  if (storageFiles && storageFiles.length > 0) {
    const filePaths = storageFiles.map(f => f.name);
    await supabase.storage.from("public_media").remove(filePaths);
    console.log(`✓ Removed ${filePaths.length} files from storage bucket.`);
  } else {
    console.log("✓ Storage bucket is clean.");
  }

  // Verification
  console.log("\n==========================================");
  console.log("VERIFYING ACTIVE APPLICATION DATA AFTER PURGE:");
  console.log("==========================================");

  const { data: activePages } = await supabase.from("pages").select("id").is("archived_at", null);
  console.log(`Active pages in Studio: ${activePages?.length || 0}`);

  const { data: activeSlugs } = await supabase.from("page_slugs").select("slug");
  console.log(`Live public slugs: ${activeSlugs?.length || 0}`);

  const { data: activeLinks } = await supabase.from("links").select("id").is("archived_at", null);
  console.log(`Active links in Studio: ${activeLinks?.length || 0}`);

  const { data: activeMedia } = await supabase.from("media_assets").select("id").is("archived_at", null);
  console.log(`Active media assets: ${activeMedia?.length || 0}`);

  const { count: clicksCount } = await supabase.from("click_events").select("*", { count: "exact", head: true });
  console.log(`Click events remaining: ${clicksCount || 0}`);

  const { data: admins } = await supabase.from("admin_users").select("id, email, is_active");
  console.log(`Admin users preserved: ${admins?.length || 0} (${admins?.[0]?.email})`);
}

wipeProductionContent().catch(console.error);
