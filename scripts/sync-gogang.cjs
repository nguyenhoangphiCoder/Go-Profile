const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const url = "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "");

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

async function run() {
  console.log("=== Bắt đầu tạo trang & theme beacons.ai/gogang (Revision 4) ===");

  const v_page_gogang = "a5555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const v_rev_gogang = "baaaaaaa-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  // 1. Ensure page exists
  console.log("1. Upserting page...");
  const { error: pageErr } = await supabase.from("pages").upsert(
    {
      id: v_page_gogang,
      internal_name: "Gờ Gang (@gogang) - Tuyển dụng & Đặt món",
      status: "published",
    },
    { onConflict: "id" }
  );
  if (pageErr) console.log("Page err:", pageErr);
  else console.log("Page OK");

  // 2. Upsert page slug 'gogang'
  console.log("2. Upserting page slug 'gogang'...");
  const { error: slugErr } = await supabase.from("page_slugs").upsert(
    {
      slug: "gogang",
      page_id: v_page_gogang,
      is_current: true,
    },
    { onConflict: "slug" }
  );
  if (slugErr) console.log("Slug err:", slugErr);
  else console.log("Slug OK");

  // 3. Create Revision 4 (draft first)
  console.log("3. Creating Revision 4...");
  const { error: revErr } = await supabase.from("page_revisions").upsert(
    {
      id: v_rev_gogang,
      page_id: v_page_gogang,
      revision_no: 4,
      state: "draft",
      lock_version: 1,
      title: "gocafe.com (@gogang)",
      description: "Chuỗi 45+ quán cà phê tại Sài Gòn. Zalo: 079.970.9246.",
      theme: {
        preset: "beacons-portrait-card",
        fontFamily: "be-vietnam-pro",
        borderRadius: "full",
        backgroundImage: "/gogang-bg-source.png",
      },
      seo: {
        metaTitle: "gocafe.com (@gogang) | Xem tin tuyển dụng, Đặt Gờ giao tận nơi",
        metaDescription: "Chuỗi 45+ quán cà phê tại Sài Gòn. Zalo: 079.970.9246.",
      },
    },
    { onConflict: "id" }
  );
  if (revErr) {
    console.log("Rev err:", revErr);
    return;
  }
  console.log("Rev OK");

  // 4. Blocks with distinct IDs
  const v_block_hdr = "84444444-0000-0000-0000-000000000001";
  const v_block_social = "84444444-0000-0000-0000-000000000002";
  const v_block_links = "84444444-0000-0000-0000-000000000003";

  const blocks = [
    {
      id: v_block_hdr,
      page_id: v_page_gogang,
      revision_id: v_rev_gogang,
      type: "header",
      position: 0,
      is_visible: true,
      payload: {
        title: "gogang",
        bio: "Chuỗi 45+ quán cà phê tại Sài Gòn.\nZalo: 079.970.9246.",
        bannerUrl: "/gogang-bg-source.png",
        avatarUrl: "/gogang-header-team.jpg",
      },
    },
    {
      id: v_block_social,
      page_id: v_page_gogang,
      revision_id: v_rev_gogang,
      type: "social_icons",
      position: 1,
      is_visible: true,
      payload: {
        style: "monochrome",
      },
    },
    {
      id: v_block_links,
      page_id: v_page_gogang,
      revision_id: v_rev_gogang,
      type: "link_list",
      position: 2,
      is_visible: true,
      payload: {
        layout: "stack",
      },
    },
  ];

  console.log("4. Upserting blocks...");
  for (const b of blocks) {
    const { error } = await supabase.from("page_blocks").upsert(b, { onConflict: "id" });
    if (error) console.log("Block err:", b.type, error);
    else console.log("Block OK:", b.type);
  }

  // 5. Links data
  const linksData = [
    // Social links
    {
      id: "71111111-0000-0000-0000-000000000001",
      label: "TikTok",
      target_url: "https://tiktok.com/@gogang1",
      kind: "standard",
      media_id: null,
    },
    {
      id: "71111111-0000-0000-0000-000000000002",
      label: "Facebook",
      target_url: "https://www.facebook.com/ViecLamGocafe",
      kind: "standard",
      media_id: null,
    },
    {
      id: "71111111-0000-0000-0000-000000000003",
      label: "Chat",
      target_url: "https://zalo.me/0799709246",
      kind: "standard",
      media_id: null,
    },
    // 7 Main links
    {
      id: "72222222-0000-0000-0000-000000000001",
      label: "Xem tin tuyển dụng\nXem chi nhánh thiếu, ca thiếu tại đây hoặc add Zép 079.970.9246.",
      target_url: "https://zalo.me/g/7lhrulho8wookdw0olbu",
      kind: "standard",
      media_id: "e5555555-0000-0000-0000-000000000003",
    },
    {
      id: "72222222-0000-0000-0000-000000000002",
      label: "Đặt Gờ giao tận nơi",
      target_url: "https://order.ipos.vn/?pos_parent=GIOCF&source=DEFAULT",
      kind: "standard",
      media_id: "e5555555-0000-0000-0000-000000000004",
    },
    {
      id: "72222222-0000-0000-0000-000000000003",
      label: "Danh sách chi nhánh Gờ",
      target_url: "https://go-cafe.com/danh-sach-chi-nhanh/",
      kind: "standard",
      media_id: "e5555555-0000-0000-0000-000000000005",
    },
    {
      id: "72222222-0000-0000-0000-000000000004",
      label: "Fanpage tuyển dụng",
      target_url: "https://www.facebook.com/share/1HFdrxb4Lw/",
      kind: "standard",
      media_id: "e5555555-0000-0000-0000-000000000006",
    },
    {
      id: "72222222-0000-0000-0000-000000000005",
      label: "Fanpage Gờ cafe",
      target_url: "https://www.facebook.com/gocafecom",
      kind: "standard",
      media_id: "e5555555-0000-0000-0000-000000000007",
    },
    {
      id: "72222222-0000-0000-0000-000000000006",
      label: "TikTok Gờ Gang",
      target_url: "https://www.tiktok.com/@gogangtuyendung?_r=1&_t=ZS-93CDDc85GQn",
      kind: "standard",
      media_id: "e5555555-0000-0000-0000-000000000008",
    },
    {
      id: "72222222-0000-0000-0000-000000000007",
      label: "Tiktok Gờ cafe",
      target_url: "https://www.tiktok.com/@gocafe.official",
      kind: "standard",
      media_id: "e5555555-0000-0000-0000-000000000009",
    },
  ];

  console.log("5. Upserting links...");
  for (const l of linksData) {
    const { error } = await supabase.from("links").upsert(
      {
        id: l.id,
        default_label: l.label,
        target_url: l.target_url,
        kind: l.kind,
        default_media_id: l.media_id,
        is_active: true,
      },
      { onConflict: "id" }
    );
    if (error) console.log("Link err:", l.label, error);
    else console.log("Link OK:", l.label.slice(0, 25));
  }

  // 6. Page links
  console.log("6. Upserting page_links...");
  const pageLinksData = linksData.map((l, idx) => ({
    id: `73333333-0000-0000-0000-${String(idx + 1).padStart(12, "0")}`,
    page_id: v_page_gogang,
    link_id: l.id,
  }));

  for (const pl of pageLinksData) {
    const { error } = await supabase.from("page_links").upsert(pl, { onConflict: "id" });
    if (error) console.log("PageLink err:", pl.id, error);
  }
  console.log("PageLinks OK");

  // 7. Link placements
  console.log("7. Upserting placements...");
  const socialPlacements = pageLinksData.slice(0, 3).map((pl, idx) => ({
    id: `75555555-0000-0000-0000-${String(idx + 1).padStart(12, "0")}`,
    page_id: v_page_gogang,
    revision_id: v_rev_gogang,
    block_id: v_block_social,
    page_link_id: pl.id,
    position: idx,
    resolved_label: linksData[idx].label,
    resolved_media_id: linksData[idx].media_id,
  }));

  const mainPlacements = pageLinksData.slice(3).map((pl, idx) => ({
    id: `75555555-0000-0000-0000-${String(idx + 10).padStart(12, "0")}`,
    page_id: v_page_gogang,
    revision_id: v_rev_gogang,
    block_id: v_block_links,
    page_link_id: pl.id,
    position: idx,
    resolved_label: linksData[idx + 3].label,
    resolved_media_id: linksData[idx + 3].media_id,
  }));

  const allPlacements = [...socialPlacements, ...mainPlacements];
  for (const plc of allPlacements) {
    const { error } = await supabase.from("revision_link_placements").upsert(plc, { onConflict: "id" });
    if (error) console.log("Placement err:", plc.id, error);
    else console.log("Placement OK:", plc.id);
  }
  console.log("Placements OK");

  // 8. Seal revision
  console.log("8. Sealing revision...");
  const { error: sealErr } = await supabase
    .from("page_revisions")
    .update({ state: "sealed", sealed_at: new Date().toISOString() })
    .eq("id", v_rev_gogang);
  if (sealErr) console.log("Seal err:", sealErr);
  else console.log("Seal OK");

  // 9. Update published revision
  console.log("9. Updating published revision on page...");
  const { error: pubErr } = await supabase
    .from("pages")
    .update({ published_revision_id: v_rev_gogang, status: "published" })
    .eq("id", v_page_gogang);
  if (pubErr) console.log("Pub err:", pubErr);
  else console.log("Pub OK! Hoàn tất thiết lập trang gogang!");
}

run();
