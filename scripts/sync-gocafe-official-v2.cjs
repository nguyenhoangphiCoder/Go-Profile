const { createClient } = require("@supabase/supabase-js");

const url = "https://iuoxkoburrtmjajfrsdb.supabase.co";
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "");

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

async function run() {
  console.log("=== Bắt đầu đồng bộ Revision 13 (chuẩn xác 100% từng pixel) ===");

  const v_page_gocafe = "a1111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const v_rev_gocafe13 = "d1111111-2222-3333-4444-777777777777";

  // 1. Tạo Revision 13 draft
  console.log("1. Tạo Revision 13 (draft)...");
  const { error: revErr } = await supabase.from("page_revisions").upsert(
    {
      id: v_rev_gocafe13,
      page_id: v_page_gocafe,
      revision_no: 13,
      state: "draft",
      lock_version: 1,
      title: "gocafe.official",
      description:
        "Gờ café là chuỗi cửa hàng cà phê TRUYỀN THỐNG, không phải các cửa hàng có không gian sang chảnh...",
      theme: {
        preset: "beacons-dark-card",
        fontFamily: "be-vietnam-pro",
        borderRadius: "md",
      },
      seo: {
        metaTitle: "gocafe.official (@gocafe.official) | Gờ Cafe",
        metaDescription:
          "Gờ café là chuỗi cửa hàng cà phê TRUYỀN THỐNG, không phải các cửa hàng có không gian sang chảnh, vị trí đắc địa hay bắt kịp các thức uống theo thời...",
      },
    },
    { onConflict: "id" }
  );
  if (revErr) {
    console.log("Rev 13 error:", revErr);
    return;
  }
  console.log("Rev 13 draft OK");

  // 2. Blocks
  const v_block_hdr = "82222222-0000-0000-0000-000000000021";
  const v_block_social = "82222222-0000-0000-0000-000000000022";
  const v_block_bio = "82222222-0000-0000-0000-000000000023";
  const v_block_links = "82222222-0000-0000-0000-000000000024";
  const v_block_si_hd = "82222222-0000-0000-0000-000000000025";
  const v_block_si_text = "82222222-0000-0000-0000-000000000026";

  const blocks = [
    {
      id: v_block_hdr,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
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
      revision_id: v_rev_gocafe13,
      type: "social_icons",
      position: 1,
      is_visible: true,
      payload: {
        style: "monochrome",
      },
    },
    {
      id: v_block_bio,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      type: "text",
      position: 2,
      is_visible: true,
      payload: {
        align: "center",
        content:
          "**Về Gờ cà phê**\n\nGờ café là chuỗi cửa hàng cà phê TRUYỀN THỐNG, không phải các cửa hàng có không gian sang chảnh, vị trí đắc địa hay bắt kịp các thức uống theo thời, Gờ café chú trọng vào chất lượng cà phê, những trải nghiệm thoải mái, không gian thân thuộc, giá cả phù hợp đủ để khách hàng có thể đến hàng ngày.",
      },
    },
    {
      id: v_block_links,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
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
      revision_id: v_rev_gocafe13,
      type: "heading",
      position: 4,
      is_visible: true,
      payload: {
        level: 2,
        text: "LIÊN HỆ MUA CÀ PHÊ SỈ CHO QUÁN QUA ☎ ZALO:\n0779.20.00.20",
      },
    },
    {
      id: v_block_si_text,
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      type: "text",
      position: 5,
      is_visible: true,
      payload: {
        align: "left",
        content:
          "Ngoài việc có hơn 50 quán cà phê nguyên chất tại HCM, Gờ cafe còn có xưởng rang SỈ và LẺ với lượt bán đang đứng top trên các sàn thương mại Shopee, Tiktokshop. Toàn bộ cà phê ở Gờ đều là CÀ PHÊ MỘC, không tẩm ướp và được rang xay tiêu chuẩn trong 72H làm việc trước khi giao cho vận chuyển.\n\n• Công thức rang độc quyền.\n• Có đầy đủ chứng nhận An toàn thực phẩm.\n• Có giấy kiểm nghiệm, độc quyền thương hiệu.\n• Xưởng rang công suất lớn, tiết kiệm chi phí nhân công.\n• Nguồn cà phê tại Cư Mgar Dak Lak, và Cầu Đất. 2 vùng cà phê nổi tiếng của Việt Nam.\n• Luôn rang tươi mới mỗi ngày.\n• Chỉ bán cà phê mộc, nói không với tẩm trộn.\n\nGờ có bán sỉ cho các chủ quán cà phê với chính sách ưu đãi:\n• Có nhận mẫu thử miễn phí.\n• Có hướng dẫn pha chế.",
      },
    },
  ];

  console.log("2. Upsert blocks...");
  for (const b of blocks) {
    const { error } = await supabase.from("page_blocks").upsert(b, { onConflict: "id" });
    if (error) console.log("Block error:", b.type, error);
    else console.log("Block OK:", b.type);
  }

  // 3. Link placements
  const placements = [
    // Social icons
    {
      id: "83333333-0000-0000-0000-000000000021",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      block_id: v_block_social,
      page_link_id: "81111111-0000-0000-0000-000000000006", // TikTok
      position: 0,
      resolved_label: "TikTok",
      resolved_media_id: null,
    },
    {
      id: "83333333-0000-0000-0000-000000000022",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      block_id: v_block_social,
      page_link_id: "81111111-0000-0000-0000-000000000007", // Facebook
      position: 1,
      resolved_label: "Facebook",
      resolved_media_id: null,
    },
    {
      id: "83333333-0000-0000-0000-000000000023",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      block_id: v_block_social,
      page_link_id: "81111111-0000-0000-0000-000000000008", // Zalo / Chat
      position: 2,
      resolved_label: "Chat",
      resolved_media_id: null,
    },
    // Links list
    {
      id: "83333333-0000-0000-0000-000000000024",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000001", // iPOS
      position: 0,
      resolved_label: "Đặt thức uống tận nơi\nMua 1 tặng 1",
      resolved_media_id: "92222222-9999-4999-9999-999999999995",
    },
    {
      id: "83333333-0000-0000-0000-000000000025",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000002", // Shopee
      position: 1,
      resolved_label: "Cà phê bột trên SHOPEE",
      resolved_media_id: "92222222-9999-4999-9999-999999999996",
    },
    {
      id: "83333333-0000-0000-0000-000000000026",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000003", // TikTok
      position: 2,
      resolved_label: "Cà phê bột trên TIKTOK",
      resolved_media_id: "92222222-9999-4999-9999-999999999997",
    },
    {
      id: "83333333-0000-0000-0000-000000000027",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000004", // Stores
      position: 3,
      resolved_label: "Danh sách các quán Gờ",
      resolved_media_id: "92222222-9999-4999-9999-999999999998",
    },
    {
      id: "83333333-0000-0000-0000-000000000028",
      page_id: v_page_gocafe,
      revision_id: v_rev_gocafe13,
      block_id: v_block_links,
      page_link_id: "81111111-0000-0000-0000-000000000005", // Recruit
      position: 4,
      resolved_label: "Đăng ký ứng tuyển",
      resolved_media_id: "92222222-9999-4999-9999-999999999999",
    },
  ];

  console.log("3. Upsert placements...");
  for (const pl of placements) {
    const { error } = await supabase.from("revision_link_placements").upsert(pl, { onConflict: "id" });
    if (error) console.log("Placement error:", pl.id, error);
    else console.log("Placement OK:", pl.id);
  }

  // 4. Seal Revision 13
  console.log("4. Seal Revision 13...");
  const { error: sealErr } = await supabase
    .from("page_revisions")
    .update({ state: "sealed", sealed_at: new Date().toISOString() })
    .eq("id", v_rev_gocafe13);
  if (sealErr) console.log("Seal error:", sealErr);
  else console.log("Seal OK");

  // 5. Publish Revision 13 to pages
  console.log("5. Publish Revision 13...");
  const { error: pageErr } = await supabase
    .from("pages")
    .update({ published_revision_id: v_rev_gocafe13, status: "published" })
    .eq("id", v_page_gocafe);
  if (pageErr) console.log("Page error:", pageErr);
  else console.log("Page OK");

  console.log("=== Hoàn tất Revision 13! ===");
}

run();
