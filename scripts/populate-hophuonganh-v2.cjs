const { createClient } = require("@supabase/supabase-js");

const url = "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "");

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

async function run() {
  console.log("=== Bắt đầu đồng bộ v2 ===");

  const v_page_hpa = "a4444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const v_rev_hpa2 = "b5555555-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const v_media_hpa_avatar = "e1111111-eeee-eeee-eeee-eeeeeeeeeeee";
  const v_media_hpa_gocafe = "e2222222-eeee-eeee-eeee-eeeeeeeeeeee";
  const v_media_hpa_shopee = "e3333333-eeee-eeee-eeee-eeeeeeeeeeee";
  const v_media_hpa_tiktok = "e4444444-eeee-eeee-eeee-eeeeeeeeeeee";

  const v_link_hpa_chinhanh = "10101010-1010-1010-1010-101010101010";
  const v_link_hpa_ipos     = "20202020-2020-2020-2020-202020202020";
  const v_link_hpa_shopee   = "30303030-3030-3030-3030-303030303030";
  const v_link_hpa_tiktok   = "40404040-4040-4040-4040-404040404040";

  const v_block_hpa_hdr     = "c7777777-cccc-cccc-cccc-cccccccccccc";
  const v_block_hpa_btn1    = "c8888888-cccc-cccc-cccc-cccccccccccc";
  const v_block_hpa_hd2     = "c9999999-cccc-cccc-cccc-cccccccccccc";
  const v_block_hpa_sub     = "caaaaaaa-cccc-cccc-cccc-cccccccccccc";
  const v_block_hpa_btn3    = "cbbbbbbb-cccc-cccc-cccc-cccccccccccc";
  const v_block_hpa_contact = "cccccccc-cccc-cccc-cccc-cccccccccccc";

  const v_plk_hpa_chinhanh  = "dbbbbbbb-dddd-dddd-dddd-dddddddddddd";
  const v_plk_hpa_ipos      = "dccccccc-dddd-dddd-dddd-dddddddddddd";
  const v_plk_hpa_shopee    = "dddddddd-dddd-dddd-dddd-dddddddddddd";
  const v_plk_hpa_tiktok    = "deeeeeee-dddd-dddd-dddd-dddddddddddd";

  // 1. Links với kind: 'standard'
  console.log("1. Insert links...");
  const links = [
    { id: v_link_hpa_chinhanh, default_label: "DANH SÁCH CHI NHÁNH GỜ", target_url: "https://go-cafe.com/danh-sach-chi-nhanh/", kind: "standard", default_media_id: null },
    { id: v_link_hpa_ipos, default_label: "ĐẶT THỨC UỐNG GIAO TẬN NƠI", target_url: "https://order.ipos.vn/?pos_parent=GIOCF&source=DEFAULT", kind: "standard", default_media_id: v_media_hpa_gocafe },
    { id: v_link_hpa_shopee, default_label: "CAFE BỘT TRÊN SHOPEE", target_url: "https://shope.ee/9zXyfhSXgX?share_channel_code=5", kind: "standard", default_media_id: v_media_hpa_shopee },
    { id: v_link_hpa_tiktok, default_label: "CAFE BỘT TRÊN TIKTOKSHOP", target_url: "https://shop.tiktok.com/view/product/1729453798159190795?region=VN&locale=vi-VN", kind: "standard", default_media_id: v_media_hpa_tiktok },
  ];
  for (const l of links) {
    const { error } = await supabase.from("links").upsert(l, { onConflict: "id" });
    if (error) console.log("Link error:", l.default_label, error);
    else console.log("Link OK:", l.default_label);
  }

  // 2. Page links
  console.log("2. Insert page_links...");
  const plks = [
    { id: v_plk_hpa_chinhanh, page_id: v_page_hpa, link_id: v_link_hpa_chinhanh },
    { id: v_plk_hpa_ipos, page_id: v_page_hpa, link_id: v_link_hpa_ipos },
    { id: v_plk_hpa_shopee, page_id: v_page_hpa, link_id: v_link_hpa_shopee },
    { id: v_plk_hpa_tiktok, page_id: v_page_hpa, link_id: v_link_hpa_tiktok },
  ];
  for (const p of plks) {
    const { error } = await supabase.from("page_links").upsert(p, { onConflict: "id" });
    if (error) console.log("Page link error:", p.id, error);
    else console.log("Page link OK");
  }

  // 3. Draft revision 2
  console.log("3. Tạo revision 2 dạng draft...");
  const { error: revErr } = await supabase.from("page_revisions").upsert({
    id: v_rev_hpa2,
    page_id: v_page_hpa,
    revision_no: 2,
    state: "draft",
    lock_version: 1,
    title: "HỒ PHƯỢNG ÁNH",
    description: "*9x- Là Co-founder Gờ càfê- chuỗi cà phê truyền thống đã mở đến chi nhánh thứ 50 tại Sài Gòn.* Gờ không có không gian sang chảnh, vị trí đắc địa hay những thức uống bắt kịp xu hướng. Gờ café chú trọng vào chất lượng cà phê mộc, những trải nghiệm thoải mái, không gian thân thuộc, giá cả phù hợp đủ để khách hàng có thể đến hàng ngày.",
    theme: { preset: "go-original" },
  }, { onConflict: "id" });
  if (revErr) console.log("Rev 2 error:", revErr);
  else console.log("Rev 2 draft OK");

  // 4. Page blocks
  console.log("4. Insert blocks...");
  const blocks = [
    {
      id: v_block_hpa_hdr,
      page_id: v_page_hpa,
      revision_id: v_rev_hpa2,
      type: "header",
      position: 0,
      is_visible: true,
      payload: {
        title: "HỒ PHƯỢNG ÁNH",
        avatarUrl: "/hophuonganh-avatar.jpg",
        bio: "*9x- Là Co-founder Gờ càfê- chuỗi cà phê truyền thống đã mở đến chi nhánh thứ 50 tại Sài Gòn.*\n\nGờ không có không gian sang chảnh, vị trí đắc địa hay những thức uống bắt kịp xu hướng. Gờ café chú trọng vào chất lượng cà phê mộc, những trải nghiệm thoải mái, không gian thân thuộc, giá cả phù hợp đủ để khách hàng có thể đến hàng ngày.",
      },
    },
    {
      id: v_block_hpa_btn1,
      page_id: v_page_hpa,
      revision_id: v_rev_hpa2,
      type: "link_list",
      position: 1,
      is_visible: true,
      payload: { title: "Hệ thống" },
    },
    {
      id: v_block_hpa_hd2,
      page_id: v_page_hpa,
      revision_id: v_rev_hpa2,
      type: "heading",
      position: 2,
      is_visible: true,
      payload: { text: "THEO ĐUỔI CÀ PHÊ MỘC TỪ 2013.", level: 2 },
    },
    {
      id: v_block_hpa_sub,
      page_id: v_page_hpa,
      revision_id: v_rev_hpa2,
      type: "text",
      position: 3,
      is_visible: true,
      payload: {
        content: '*Mua "lẻ" cà phê Gờ*\n*tại các gian hàng dưới đây:*',
        align: "center",
      },
    },
    {
      id: v_block_hpa_btn3,
      page_id: v_page_hpa,
      revision_id: v_rev_hpa2,
      type: "link_list",
      position: 4,
      is_visible: true,
      payload: { title: "Gian hàng trực tuyến" },
    },
    {
      id: v_block_hpa_contact,
      page_id: v_page_hpa,
      revision_id: v_rev_hpa2,
      type: "text",
      position: 5,
      is_visible: true,
      payload: {
        content: "- Việc quan trọng: email anh.ho@go-cafe.com\n- Liên hệ cho thuê mặt bằng:\n0789.12.0006 (Phát Đạt)\n- Liên hệ mua cà phê sỉ:\n0779.20.00.20 (Hoàng Anh)\n- Khiếu nại/ góp ý:\n0345.75.0007",
        align: "center",
      },
    },
  ];
  for (const b of blocks) {
    const { error } = await supabase.from("page_blocks").upsert(b, { onConflict: "id" });
    if (error) console.log("Block error:", b.type, error);
    else console.log("Block OK:", b.type);
  }

  // 5. Placements
  console.log("5. Insert placements...");
  const placements = [
    { page_id: v_page_hpa, revision_id: v_rev_hpa2, block_id: v_block_hpa_btn1, page_link_id: v_plk_hpa_chinhanh, position: 0, resolved_label: "DANH SÁCH CHI NHÁNH GỜ", resolved_media_id: null },
    { page_id: v_page_hpa, revision_id: v_rev_hpa2, block_id: v_block_hpa_btn3, page_link_id: v_plk_hpa_ipos, position: 0, resolved_label: "ĐẶT THỨC UỐNG GIAO TẬN NƠI", resolved_media_id: v_media_hpa_gocafe },
    { page_id: v_page_hpa, revision_id: v_rev_hpa2, block_id: v_block_hpa_btn3, page_link_id: v_plk_hpa_shopee, position: 1, resolved_label: "CAFE BỘT TRÊN SHOPEE", resolved_media_id: v_media_hpa_shopee },
    { page_id: v_page_hpa, revision_id: v_rev_hpa2, block_id: v_block_hpa_btn3, page_link_id: v_plk_hpa_tiktok, position: 2, resolved_label: "CAFE BỘT TRÊN TIKTOKSHOP", resolved_media_id: v_media_hpa_tiktok },
  ];
  for (const pl of placements) {
    const { error } = await supabase.from("revision_link_placements").upsert(pl, { onConflict: "revision_id,page_link_id" });
    if (error) console.log("Placement error:", pl.resolved_label, error);
    else console.log("Placement OK:", pl.resolved_label);
  }

  // 6. Seal revision 2
  console.log("6. Niêm phong revision 2...");
  const { error: sealErr } = await supabase.from("page_revisions").update({
    state: "sealed",
    sealed_at: new Date().toISOString(),
  }).eq("id", v_rev_hpa2);
  if (sealErr) console.log("Seal error:", sealErr);
  else console.log("Seal OK");

  // 7. Update published_revision_id
  console.log("7. Xuất bản trang với revision 2...");
  const { error: pubErr } = await supabase.from("pages").update({
    published_revision_id: v_rev_hpa2,
    status: "published",
    updated_at: new Date().toISOString(),
  }).eq("id", v_page_hpa);
  if (pubErr) console.log("Publish error:", pubErr);
  else console.log("Publish OK");

  // 8. Cập nhật theme của trang /gocafe
  console.log("8. Cập nhật theme /gocafe sang go-original...");
  await supabase.from("page_revisions").update({
    theme: { preset: "go-original" }
  }).eq("page_id", "a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

  console.log("=== THÀNH CÔNG RỰC RỠ! ===");
}

run();
