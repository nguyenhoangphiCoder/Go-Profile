const { createClient } = require("@supabase/supabase-js");

const url = "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "");

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

async function run() {
  console.log("=== Bắt đầu đồng bộ trang Gờ Cafe Official (beacons-dark-card v12) ===");

  const v_page_gocafe = "a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const v_rev_gocafe12 = "d1111111-2222-3333-4444-666666666666";

  // 1. Media assets with bucket_id: 'public_media'
  const mediaItems = [
    {
      id: "92222222-9999-4999-9999-999999999993",
      bucket_id: "public_media",
      object_path: "beacons-banner-real.jpg",
      mime_type: "image/jpeg",
      size_bytes: 891834,
      visibility: "public",
      status: "ready",
      original_filename: "beacons-banner-real.jpg",
    },
    {
      id: "92222222-9999-4999-9999-999999999994",
      bucket_id: "public_media",
      object_path: "beacons-avatar-real.png",
      mime_type: "image/png",
      size_bytes: 23402,
      visibility: "public",
      status: "ready",
      original_filename: "beacons-avatar-real.png",
    },
    {
      id: "92222222-9999-4999-9999-999999999995",
      bucket_id: "public_media",
      object_path: "thumb-order.webp",
      mime_type: "image/webp",
      size_bytes: 13894,
      visibility: "public",
      status: "ready",
      original_filename: "thumb-order.webp",
    },
    {
      id: "92222222-9999-4999-9999-999999999996",
      bucket_id: "public_media",
      object_path: "thumb-shopee.jpg",
      mime_type: "image/jpeg",
      size_bytes: 12226,
      visibility: "public",
      status: "ready",
      original_filename: "thumb-shopee.jpg",
    },
    {
      id: "92222222-9999-4999-9999-999999999997",
      bucket_id: "public_media",
      object_path: "thumb-tiktok.jpg",
      mime_type: "image/jpeg",
      size_bytes: 17386,
      visibility: "public",
      status: "ready",
      original_filename: "thumb-tiktok.jpg",
    },
    {
      id: "92222222-9999-4999-9999-999999999998",
      bucket_id: "public_media",
      object_path: "thumb-stores.jpg",
      mime_type: "image/jpeg",
      size_bytes: 22184,
      visibility: "public",
      status: "ready",
      original_filename: "thumb-stores.jpg",
    },
    {
      id: "92222222-9999-4999-9999-999999999999",
      bucket_id: "public_media",
      object_path: "thumb-recruit.webp",
      mime_type: "image/webp",
      size_bytes: 19212,
      visibility: "public",
      status: "ready",
      original_filename: "thumb-recruit.webp",
    },
  ];

  console.log("1. Upsert media assets...");
  for (const m of mediaItems) {
    const { error } = await supabase.from("media_assets").upsert(m, { onConflict: "id" });
    if (error) console.log("Media error:", m.object_path, error);
    else console.log("Media OK:", m.object_path);
  }

  // 2. Links
  const links = [
    {
      id: "80000000-0000-0000-0000-000000000001",
      default_label: "Đặt thức uống tận nơi\nMua 1 tặng 1",
      target_url: "https://order.ipos.vn/?pos_parent=GIOCF&source=DEFAULT",
      kind: "standard",
      default_media_id: "92222222-9999-4999-9999-999999999995",
    },
    {
      id: "80000000-0000-0000-0000-000000000002",
      default_label: "Cà phê bột trên SHOPEE",
      target_url: "https://shope.ee/9zXyfhSXgX?share_channel_code=5",
      kind: "standard",
      default_media_id: "92222222-9999-4999-9999-999999999996",
    },
    {
      id: "80000000-0000-0000-0000-000000000003",
      default_label: "Cà phê bột trên TIKTOK",
      target_url: "https://shop.tiktok.com/view/product/1729453798159190795?region=VN&locale=vi-VN",
      kind: "standard",
      default_media_id: "92222222-9999-4999-9999-999999999997",
    },
    {
      id: "80000000-0000-0000-0000-000000000004",
      default_label: "Danh sách các quán Gờ",
      target_url: "https://go-cafe.com/danh-sach-chi-nhanh/",
      kind: "standard",
      default_media_id: "92222222-9999-4999-9999-999999999998",
    },
    {
      id: "80000000-0000-0000-0000-000000000005",
      default_label: "Đăng ký ứng tuyển",
      target_url: "https://zalo.me/gocafe",
      kind: "standard",
      default_media_id: "92222222-9999-4999-9999-999999999999",
    },
    // Social links
    {
      id: "80000000-0000-0000-0000-000000000006",
      default_label: "TikTok",
      target_url: "https://www.tiktok.com/@gocafe.official",
      kind: "social",
      default_media_id: null,
    },
    {
      id: "80000000-0000-0000-0000-000000000007",
      default_label: "Facebook",
      target_url: "https://www.facebook.com/gocafecantho/",
      kind: "social",
      default_media_id: null,
    },
    {
      id: "80000000-0000-0000-0000-000000000008",
      default_label: "Zalo",
      target_url: "https://zalo.me/0779200020",
      kind: "social",
      default_media_id: null,
    },
  ];

  console.log("2. Upsert links...");
  for (const l of links) {
    const { error } = await supabase.from("links").upsert(l, { onConflict: "id" });
    if (error) console.log("Link error:", l.default_label, error);
    else console.log("Link OK:", l.default_label);
  }

  // 3. Page links
  const pageLinks = [
    { id: "81111111-0000-0000-0000-000000000001", page_id: v_page_gocafe, link_id: "80000000-0000-0000-0000-000000000001" },
    { id: "81111111-0000-0000-0000-000000000002", page_id: v_page_gocafe, link_id: "80000000-0000-0000-0000-000000000002" },
    { id: "81111111-0000-0000-0000-000000000003", page_id: v_page_gocafe, link_id: "80000000-0000-0000-0000-000000000003" },
    { id: "81111111-0000-0000-0000-000000000004", page_id: v_page_gocafe, link_id: "80000000-0000-0000-0000-000000000004" },
    { id: "81111111-0000-0000-0000-000000000005", page_id: v_page_gocafe, link_id: "80000000-0000-0000-0000-000000000005" },
    { id: "81111111-0000-0000-0000-000000000006", page_id: v_page_gocafe, link_id: "80000000-0000-0000-0000-000000000006" },
    { id: "81111111-0000-0000-0000-000000000007", page_id: v_page_gocafe, link_id: "80000000-0000-0000-0000-000000000007" },
    { id: "81111111-0000-0000-0000-000000000008", page_id: v_page_gocafe, link_id: "80000000-0000-0000-0000-000000000008" },
  ];

  console.log("3. Upsert page_links...");
  for (const pl of pageLinks) {
    const { error } = await supabase.from("page_links").upsert(pl, { onConflict: "id" });
    if (error) console.log("Page link error:", pl.id, error);
    else console.log("Page link OK:", pl.id);
  }

  // 4. Create Revision 12 in draft state
  console.log("4. Tạo Revision 12 (draft)...");
  const { error: revErr } = await supabase.from("page_revisions").upsert(
    {
      id: v_rev_gocafe12,
      page_id: v_page_gocafe,
      revision_no: 12,
      state: "draft",
      lock_version: 1,
      title: "gocafe.official",
      description:
        "Gờ Cà Phê là chuỗi cà phê pha phin truyền thống mang phong cách hiện đại, phục vụ nhanh với tiêu chí: Ngon - Sạch - Giá hợp lý. Với hơn 40 cửa hàng tại TP.HCM, Gờ là điểm hẹn quen thuộc cho những ai yêu thích hương vị cà phê đậm đà.",
      theme: {
        preset: "beacons-dark-card",
        fontFamily: "be-vietnam-pro",
        borderRadius: "md",
      },
      seo: {
        metaTitle: "gocafe.official (@gocafe.official) | Gờ Cafe",
        metaDescription:
          "Gờ Cà Phê là chuỗi cà phê pha phin truyền thống mang phong cách hiện đại, phục vụ nhanh với tiêu chí: Ngon - Sạch - Giá hợp lý. Với hơn 40 cửa hàng tại TP.HCM, Gờ là điểm hẹn quen thuộc cho những ai yêu thích hương vị cà phê đậm đà.",
      },
    },
    { onConflict: "id" }
  );
  if (revErr) {
    console.log("Rev 12 error:", revErr);
    return;
  }
  console.log("Rev 12 draft OK");

  // 5. Blocks
  const v_block_hdr = "82222222-0000-0000-0000-000000000011";
  const v_block_social = "82222222-0000-0000-0000-000000000012";
  const v_block_bio = "82222222-0000-0000-0000-000000000013";
  const v_block_links = "82222222-0000-0000-0000-000000000014";
  const v_block_si_hd = "82222222-0000-0000-0000-000000000015";
  const v_block_si_text = "82222222-0000-0000-0000-000000000016";

  const blocks = [
    {
      id: v_block_hdr,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      type: "header",
      position: 0,
      is_visible: true,
      payload: {
        title: "gocafe.official",
        bannerUrl: "/beacons-banner-real.jpg",
        avatarUrl: "/beacons-avatar-real.png",
      },
    },
    {
      id: v_block_social,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      type: "social_icons",
      position: 1,
      is_visible: true,
      payload: {
        style: "outline",
      },
    },
    {
      id: v_block_bio,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      type: "text",
      position: 2,
      is_visible: true,
      payload: {
        align: "left",
        content:
          "**Về Gờ cà phê**\n\nGờ Cà Phê là chuỗi cà phê pha phin truyền thống mang phong cách hiện đại, phục vụ nhanh với tiêu chí: Ngon - Sạch - Giá hợp lý. Với hơn 40 cửa hàng tại TP.HCM, Gờ là điểm hẹn quen thuộc cho những ai yêu thích hương vị cà phê đậm đà.",
      },
    },
    {
      id: v_block_links,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      type: "link_list",
      position: 3,
      is_visible: true,
      payload: {
        layout: "list",
      },
    },
    {
      id: v_block_si_hd,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      type: "heading",
      position: 4,
      is_visible: true,
      payload: {
        level: 2,
        text: "LIÊN HỆ MUA CÀ PHÊ SỈ CHO QUÁN QUA ☎ ZALO: 0779.20.00.20",
      },
    },
    {
      id: v_block_si_text,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      type: "text",
      position: 5,
      is_visible: true,
      payload: {
        align: "left",
        content:
          "Cà phê sạch, rang mộc 100%, hạt sàn 18 chuẩn xuất khẩu chất lượng cao.\n\n• Công thức rang độc quyền, vị đậm đà không gắt.\n• Cung cấp cà phê hạt, bột xay sẵn phù hợp pha phin, pha máy.\n• Đóng gói theo yêu cầu: 250g, 500g, 1kg.\n• Chiết khấu cao theo sản lượng hàng tháng.\n• Hỗ trợ tư vấn menu, kỹ thuật pha chế và vận hành quán.\n• Giao hàng nhanh toàn quốc, miễn phí vận chuyển nội thành TP.HCM từ số lượng quy định.\n• Xuất hóa đơn VAT đầy đủ theo yêu cầu.\n• Hỗ trợ công nợ linh hoạt cho đối tác lâu dài.\n\n**Cung cấp cà phê sỉ cho quán, chuỗi đồ uống, đại lý và doanh nghiệp:**\n• Có nhận mẫu thử miễn phí.\n• Hỗ trợ test mẫu trực tiếp tại quán.",
      },
    },
  ];

  console.log("5. Upsert blocks...");
  for (const b of blocks) {
    const { error } = await supabase.from("page_blocks").upsert(b, { onConflict: "id" });
    if (error) console.log("Block error:", b.type, error);
    else console.log("Block OK:", b.type);
  }

  // 6. Link placements with page_id: v_page_gocafe
  const placements = [
    // Social icons block
    {
      id: "83333333-0000-0000-0000-000000000011",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      block_id: v_block_social,
      page_link_id: "81111111-0000-0000-0000-000000000006", // TikTok
      position: 0,
      resolved_label: "TikTok",
      resolved_media_id: null,
    },
    {
      id: "83333333-0000-0000-0000-000000000012",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      block_id: v_block_social,
      page_link_id: "81111111-0000-0000-0000-000000000007", // Facebook
      position: 1,
      resolved_label: "Facebook",
      resolved_media_id: null,
    },
    {
      id: "83333333-0000-0000-0000-000000000013",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      block_id: v_block_social,
      page_link_id: "81111111-0000-0000-0000-000000000008", // Zalo
      position: 2,
      resolved_label: "Zalo",
      resolved_media_id: null,
    },
    // Link list block
    {
      id: "83333333-0000-0000-0000-000000000014",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000001", // iPOS
      position: 0,
      resolved_label: "Đặt thức uống tận nơi\nMua 1 tặng 1",
      resolved_media_id: "92222222-9999-4999-9999-999999999995",
    },
    {
      id: "83333333-0000-0000-0000-000000000015",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000002", // Shopee
      position: 1,
      resolved_label: "Cà phê bột trên SHOPEE",
      resolved_media_id: "92222222-9999-4999-9999-999999999996",
    },
    {
      id: "83333333-0000-0000-0000-000000000016",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000003", // TikTok
      position: 2,
      resolved_label: "Cà phê bột trên TIKTOK",
      resolved_media_id: "92222222-9999-4999-9999-999999999997",
    },
    {
      id: "83333333-0000-0000-0000-000000000017",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000004", // Stores
      position: 3,
      resolved_label: "Danh sách các quán Gờ",
      resolved_media_id: "92222222-9999-4999-9999-999999999998",
    },
    {
      id: "83333333-0000-0000-0000-000000000018",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe12,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000005", // Recruit
      position: 4,
      resolved_label: "Đăng ký ứng tuyển",
      resolved_media_id: "92222222-9999-4999-9999-999999999999",
    },
  ];

  console.log("6. Upsert link placements...");
  for (const pl of placements) {
    const { error } = await supabase.from("revision_link_placements").upsert(pl, { onConflict: "id" });
    if (error) console.log("Placement error:", pl.id, error);
    else console.log("Placement OK:", pl.id);
  }

  // 7. Seal revision 12
  console.log("7. Seal revision 12...");
  const { error: sealErr } = await supabase
    .from("page_revisions")
    .update({ state: "sealed", sealed_at: new Date().toISOString() })
    .eq("id", v_rev_gocafe12);
  if (sealErr) console.log("Seal error:", sealErr);
  else console.log("Seal OK");

  // 8. Publish revision 12 to pages
  console.log("8. Set published_revision_id to revision 12...");
  const { error: pageErr } = await supabase
    .from("pages")
    .update({ published_revision_id: v_rev_gocafe12, status: "published" })
    .eq("id", v_page_gocafe);
  if (pageErr) console.log("Page update error:", pageErr);
  else console.log("Page update OK");

  // 9. Verify get_public_page
  console.log("9. Verify get_public_page('gocafe')...");
  const { data: pubData, error: pubDataErr } = await supabase.rpc("get_public_page", { p_slug: "gocafe" });
  if (pubDataErr) console.log("Verify error:", pubDataErr);
  else {
    console.log("Verify SUCCESS! Blocks count:", pubData?.blocks?.length);
    console.log("Blocks summary:", (pubData?.blocks || []).map(b => `${b.type} (links: ${b.links?.length || 0})`));
  }

  console.log("=== Hoàn tất đồng bộ! ===");
}

run();
