import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}

const isLocal = SUPABASE_URL.includes("127.0.0.1") || SUPABASE_URL.includes("localhost");
if (!isLocal && !process.argv.includes("--allow-cloud")) {
  console.error(
    `[AN TOÀN] Từ chối chạy seed demo lên DB không phải Local (${SUPABASE_URL}). Chuyển sang Local bằng: pnpm db:local`
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GO_THEME = {
  preset: "go-minimal-luxury",
  version: 2,
  overrides: {},
};

const IMG = {
  logo: "https://go-cafe.com/wp-content/uploads/2018/11/G%E1%BB%9D.png",
  heroHome: "https://go-cafe.com/wp-content/uploads/2018/11/IMG_7728.jpg",
  heroSpace: "https://go-cafe.com/wp-content/uploads/2021/02/MG_2378-scaled.jpg",
  about: "https://go-cafe.com/wp-content/uploads/2018/11/IMG_4943-HDR-1.jpg",
  menuBanner: "https://go-cafe.com/wp-content/uploads/2018/11/IMG_7724.jpg",
  traditionalCoffee:
    "https://go-cafe.com/wp-content/uploads/2017/03/z4428904390446_aaf22da7b8416e3e3e9444d46dc0dc62-750x750.jpg",
  modernCoffee:
    "https://go-cafe.com/wp-content/uploads/2023/05/Cold-Brew-Nhiet-Doi_ly-nhua-1-750x750.png",
  matcha:
    "https://go-cafe.com/wp-content/uploads/2025/08/THUC-UONG-KHAC-Matcha-kem-pho-mai-750x750.jpg",
  fruitTea: "https://go-cafe.com/wp-content/uploads/2018/11/Tra-Dao-Cam_ly-nhua-1-750x750.png",
  yogurt: "https://go-cafe.com/wp-content/uploads/2017/03/Sua-chua-nhiet-doi-750x750.jpg",
  juice: "https://go-cafe.com/wp-content/uploads/2017/03/Nuoc-ep-Cam-Thom-750x750.jpg",
  roastery: "https://go-cafe.com/wp-content/uploads/2025/03/circle-go-cf.png",
  franchise: "https://go-cafe.com/wp-content/uploads/2023/02/GOCAPHE0044-modified-1024x1024.png",
};

async function ensureLogoMedia() {
  const objectPath = "demo/go-cafe-logo.png";
  const { data: existing } = await supabase
    .from("media_assets")
    .select("id")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("object_path", objectPath)
    .maybeSingle();
  if (existing?.id) return existing.id;

  try {
    const res = await fetch(IMG.logo);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    await supabase.storage.from("public_media").upload(objectPath, buf, {
      contentType: "image/png",
      upsert: true,
    });
    const { data: inserted, error } = await supabase
      .from("media_assets")
      .insert({
        workspace_id: WORKSPACE_ID,
        bucket_id: "public_media",
        object_path: objectPath,
        visibility: "public",
        status: "ready",
        original_filename: "go-cafe-logo.png",
        mime_type: "image/png",
        size_bytes: buf.byteLength,
      })
      .select("id")
      .single();
    if (error) {
      console.warn("Bỏ qua logo media_assets:", error.message);
      return null;
    }
    return inserted.id;
  } catch (err) {
    console.warn("Không tải được logo từ go-cafe.com:", err.message);
    return null;
  }
}

async function upsertPublishedLandingPage({ slug, internalName, title, description, blocks }) {
  // Kiểm tra slug đã tồn tại chưa
  const { data: existingSlug } = await supabase
    .from("page_slugs")
    .select("page_id")
    .eq("slug", slug)
    .maybeSingle();

  let pageId = existingSlug?.page_id ?? null;

  if (!pageId) {
    const { data: newPage, error: pageErr } = await supabase
      .from("pages")
      .insert({
        workspace_id: WORKSPACE_ID,
        internal_name: internalName,
        page_kind: "landing",
        status: "published",
      })
      .select("id")
      .single();
    if (pageErr) throw new Error(`Lỗi tạo trang ${slug}: ${pageErr.message}`);
    pageId = newPage.id;

    const { error: slugErr } = await supabase.from("page_slugs").insert({
      page_id: pageId,
      slug,
      is_current: true,
    });
    if (slugErr) throw new Error(`Lỗi tạo slug ${slug}: ${slugErr.message}`);
  } else {
    await supabase
      .from("pages")
      .update({
        internal_name: internalName,
        page_kind: "landing",
        status: "published",
        archived_at: null,
      })
      .eq("id", pageId);
  }

  // Tìm draft hiện có (nếu có) để tái sử dụng, tránh đụng unique constraint uq_page_revisions_draft
  const { data: existingDraft } = await supabase
    .from("page_revisions")
    .select("id, revision_no")
    .eq("page_id", pageId)
    .eq("state", "draft")
    .maybeSingle();

  let rev;
  let nextRevNo;

  if (existingDraft) {
    nextRevNo = existingDraft.revision_no;
    await supabase.from("page_blocks").delete().eq("revision_id", existingDraft.id);
    const { data: updatedRev, error: updErr } = await supabase
      .from("page_revisions")
      .update({
        title,
        description,
        theme: GO_THEME,
        seo: {
          metaTitle: `${title} | Gờ Café`,
          metaDescription: description,
          showSiteShell: true,
          showFooterBadge: false,
        },
      })
      .eq("id", existingDraft.id)
      .select("id")
      .single();
    if (updErr) throw new Error(`Lỗi cập nhật draft revision cho ${slug}: ${updErr.message}`);
    rev = updatedRev;
  } else {
    const { data: latestRev } = await supabase
      .from("page_revisions")
      .select("revision_no")
      .eq("page_id", pageId)
      .order("revision_no", { ascending: false })
      .limit(1)
      .maybeSingle();

    nextRevNo = (latestRev?.revision_no ?? 0) + 1;

    const { data: newRev, error: revErr } = await supabase
      .from("page_revisions")
      .insert({
        page_id: pageId,
        revision_no: nextRevNo,
        state: "draft",
        title,
        description,
        theme: GO_THEME,
        seo: {
          metaTitle: `${title} | Gờ Café`,
          metaDescription: description,
          showSiteShell: true,
          showFooterBadge: false,
        },
      })
      .select("id")
      .single();
    if (revErr) throw new Error(`Lỗi tạo revision cho ${slug}: ${revErr.message}`);
    rev = newRev;
  }

  // 2. Nạp danh sách blocks
  if (blocks.length > 0) {
    const blockRows = blocks.map((b, idx) => ({
      page_id: pageId,
      revision_id: rev.id,
      type: b.type,
      position: idx,
      is_visible: true,
      payload: b.payload,
    }));
    const { error: blkErr } = await supabase.from("page_blocks").insert(blockRows);
    if (blkErr) throw new Error(`Lỗi nạp blocks cho ${slug}: ${blkErr.message}`);
  }

  // 3. Niêm phong revision -> sealed và trỏ published_revision_id
  const { error: sealErr } = await supabase
    .from("page_revisions")
    .update({ state: "sealed", sealed_at: new Date().toISOString() })
    .eq("id", rev.id);
  if (sealErr) throw new Error(`Lỗi niêm phong revision ${slug}: ${sealErr.message}`);

  const { error: pubErr } = await supabase
    .from("pages")
    .update({ published_revision_id: rev.id, status: "published" })
    .eq("id", pageId);
  if (pubErr) throw new Error(`Lỗi cập nhật published_revision_id ${slug}: ${pubErr.message}`);

  // 4. Tạo luôn 1 bản draft mới (nextRevNo + 1) để mở Editor sửa được ngay
  const { data: draftRev, error: dRevErr } = await supabase
    .from("page_revisions")
    .insert({
      page_id: pageId,
      revision_no: nextRevNo + 1,
      state: "draft",
      title,
      description,
      theme: GO_THEME,
      seo: {
        metaTitle: `${title} | Gờ Café`,
        metaDescription: description,
        showSiteShell: true,
        showFooterBadge: false,
      },
    })
    .select("id")
    .single();
  if (!dRevErr && draftRev && blocks.length > 0) {
    await supabase.from("page_blocks").insert(
      blocks.map((b, idx) => ({
        page_id: pageId,
        revision_id: draftRev.id,
        type: b.type,
        position: idx,
        is_visible: true,
        payload: b.payload,
      }))
    );
  }

  console.log(`  ✓ Đã xuất bản Landing Page: /${slug} (${blocks.length} khối)`);
  return pageId;
}

const DEMO_BRANCHES = [
  {
    name: "Gờ Café — 1C Thoại Ngọc Hầu (Trụ sở)",
    address: "1C Thoại Ngọc Hầu, P. Hoà Thạnh, Q. Tân Phú, TP.HCM",
    district: "Quận Tân Phú",
    city: "TP.HCM",
    lat: 10.7785,
    lng: 106.6406,
    phone: "19009246",
    hours: "06:30 – 22:00",
    maps_url: "https://maps.google.com/?q=10.7785,106.6406",
  },
  {
    name: "Gờ Café — 535 Kênh Tân Hoá",
    address: "535 Kênh Tân Hoá, P. Hoà Thạnh, Q. Tân Phú, TP.HCM",
    district: "Quận Tân Phú",
    city: "TP.HCM",
    lat: 10.7749,
    lng: 106.6378,
    phone: "19009246",
    hours: "06:30 – 22:00",
    maps_url: "https://maps.google.com/?q=10.7749,106.6378",
  },
  {
    name: "Gờ Café — Trương Vĩnh Ký",
    address: "212 Trương Vĩnh Ký, P. Tân Sơn Nhì, Q. Tân Phú, TP.HCM",
    district: "Quận Tân Phú",
    city: "TP.HCM",
    lat: 10.7932,
    lng: 106.6327,
    phone: "19009246",
    hours: "06:30 – 22:00",
    maps_url: "https://maps.google.com/?q=10.7932,106.6327",
  },
  {
    name: "Gờ Café — Ấp Bắc (Tân Bình)",
    address: "28 Ấp Bắc, P. 13, Q. Tân Bình, TP.HCM",
    district: "Quận Tân Bình",
    city: "TP.HCM",
    lat: 10.8021,
    lng: 106.6431,
    phone: "19009246",
    hours: "06:30 – 22:00",
    maps_url: "https://maps.google.com/?q=10.8021,106.6431",
  },
  {
    name: "Gờ Café — Bàu Cát",
    address: "96 Bàu Cát, P. 14, Q. Tân Bình, TP.HCM",
    district: "Quận Tân Bình",
    city: "TP.HCM",
    lat: 10.7918,
    lng: 106.6462,
    phone: "19009246",
    hours: "06:30 – 22:00",
    maps_url: "https://maps.google.com/?q=10.7918,106.6462",
  },
  {
    name: "Gờ Café — Võ Văn Tần (Quận 3)",
    address: "184 Võ Văn Tần, P. 5, Q. 3, TP.HCM",
    district: "Quận 3",
    city: "TP.HCM",
    lat: 10.7743,
    lng: 106.6889,
    phone: "19009246",
    hours: "06:30 – 22:30",
    maps_url: "https://maps.google.com/?q=10.7743,106.6889",
  },
  {
    name: "Gờ Café — Nguyễn Đình Chiểu (Quận 1)",
    address: "42 Nguyễn Đình Chiểu, P. Đa Kao, Q. 1, TP.HCM",
    district: "Quận 1",
    city: "TP.HCM",
    lat: 10.7885,
    lng: 106.6987,
    phone: "19009246",
    hours: "06:30 – 22:00",
    maps_url: "https://maps.google.com/?q=10.7885,106.6987",
  },
  {
    name: "Gờ Café — Sư Vạn Hạnh (Quận 10)",
    address: "618 Sư Vạn Hạnh, P. 10, Q. 10, TP.HCM",
    district: "Quận 10",
    city: "TP.HCM",
    lat: 10.7704,
    lng: 106.6697,
    phone: "19009246",
    hours: "06:30 – 22:30",
    maps_url: "https://maps.google.com/?q=10.7704,106.6697",
  },
  {
    name: "Gờ Café — Phan Xích Long (Phú Nhuận)",
    address: "168 Phan Xích Long, P. 2, Q. Phú Nhuận, TP.HCM",
    district: "Quận Phú Nhuận",
    city: "TP.HCM",
    lat: 10.7995,
    lng: 106.6894,
    phone: "19009246",
    hours: "06:30 – 22:30",
    maps_url: "https://maps.google.com/?q=10.7995,106.6894",
  },
  {
    name: "Gờ Café — D2 Nguyễn Gia Trí (Bình Thạnh)",
    address: "115 Nguyễn Gia Trí, P. 25, Q. Bình Thạnh, TP.HCM",
    district: "Quận Bình Thạnh",
    city: "TP.HCM",
    lat: 10.8037,
    lng: 106.7152,
    phone: "19009246",
    hours: "06:30 – 22:30",
    maps_url: "https://maps.google.com/?q=10.8037,106.7152",
  },
  {
    name: "Gờ Café — Phan Văn Trị (Gò Vấp)",
    address: "366 Phan Văn Trị, P. 5, Q. Gò Vấp, TP.HCM",
    district: "Quận Gò Vấp",
    city: "TP.HCM",
    lat: 10.8264,
    lng: 106.6881,
    phone: "19009246",
    hours: "06:30 – 22:00",
    maps_url: "https://maps.google.com/?q=10.8264,106.6881",
  },
  {
    name: "Gờ Café — Nguyễn Thị Thập (Quận 7)",
    address: "420 Nguyễn Thị Thập, P. Tân Quy, Q. 7, TP.HCM",
    district: "Quận 7",
    city: "TP.HCM",
    lat: 10.7396,
    lng: 106.7091,
    phone: "19009246",
    hours: "06:30 – 22:00",
    maps_url: "https://maps.google.com/?q=10.7396,106.7091",
  },
];

async function seedBranches() {
  const { data: existing } = await supabase
    .from("branches")
    .select("name")
    .eq("workspace_id", WORKSPACE_ID)
    .is("archived_at", null);
  const existingNames = new Set((existing || []).map((b) => b.name));

  const toInsert = DEMO_BRANCHES.filter((b) => !existingNames.has(b.name)).map((b, idx) => ({
    workspace_id: WORKSPACE_ID,
    ...b,
    position: existingNames.size + idx,
    is_active: true,
  }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("branches").insert(toInsert);
    if (error) throw new Error(`Lỗi nạp chi nhánh: ${error.message}`);
  }
  console.log(`  ✓ Hệ thống chi nhánh: đã có ${existingNames.size + toInsert.length} cửa hàng TP.HCM`);
}

async function seedSampleLeads(pageMap) {
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WORKSPACE_ID);

  if ((count ?? 0) > 0) {
    console.log(`  ✓ Leads mẫu: đã có sẵn ${count} bản ghi`);
    return;
  }

  const { error } = await supabase.from("leads").insert([
    {
      workspace_id: WORKSPACE_ID,
      page_id: pageMap["nhuong-quyen"],
      form_name: "Đăng ký tư vấn nhượng quyền",
      full_name: "Trần Minh Quân",
      phone: "0909123456",
      email: "minhquan.tran@example.com",
      note: "Mình có mặt bằng 90m² góc 2 mặt tiền tại Quận Tân Phú, muốn nhận hồ sơ nhượng quyền Gờ Café.",
      status: "new",
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "nhuong-quyen-2026",
    },
    {
      workspace_id: WORKSPACE_ID,
      page_id: pageMap["xuong-rang-ca-phe"],
      form_name: "Nhận mẫu thử cà phê sỉ",
      full_name: "Lê Thị Hồng Nhung",
      phone: "0938777888",
      email: "nhung.coffee@example.com",
      note: "Quán mình tiêu thụ khoảng 40kg/tháng, xin gửi mẫu thử Gu Truyền Thống và Gu Hiện Đại.",
      status: "contacted",
      utm_source: "google",
      utm_medium: "organic",
      utm_campaign: "xuong-rang-si",
    },
    {
      workspace_id: WORKSPACE_ID,
      page_id: pageMap["go-cafe"],
      form_name: "Đăng ký tư vấn Gờ Café",
      full_name: "Phạm Quốc Bảo",
      phone: "0988456789",
      note: "Đặt tiệc trà & cà phê mang đi cho sự kiện công ty 50 người tại Quận 3.",
      status: "converted",
      utm_source: "zalo",
      utm_medium: "oa",
    },
  ]);
  if (error) throw new Error(`Lỗi nạp leads mẫu: ${error.message}`);
  console.log("  ✓ Đã nạp 3 khách hàng (Leads) mẫu cho /admin/leads");
}

async function main() {
  console.log("🚀 Đang giả lập toàn bộ website go-cafe.com lên Local Docker DB...\n");

  const logoMediaId = await ensureLogoMedia();

  // 1. Tạo & xuất bản 7 Landing Page mô phỏng go-cafe.com
  const pagesSpec = [
    {
      slug: "go-cafe",
      internalName: "Gờ Café — Trang chủ (Mô phỏng go-cafe.com)",
      title: "Gờ Café — Cà phê Truyền Thống cho mọi ngày",
      description:
        "Gờ café là chuỗi cửa hàng cà phê TRUYỀN THỐNG. Chú trọng chất lượng cà phê, trải nghiệm thoải mái, không gian thân thuộc và giá cả phù hợp mỗi ngày.",
      blocks: [
        {
          type: "hero_section",
          payload: {
            anchorId: "dau-trang",
            layout: "full-bg",
            eyebrow: "CHUỖI CÀ PHÊ TRUYỀN THỐNG • TỪ 2018",
            title: "Cà phê thật cho mỗi ngày thân thuộc",
            subtitle:
              "Gờ café chú trọng vào chất lượng cà phê rang mộc nguyên chất, trải nghiệm thoải mái, không gian mở thân thuộc và mức giá hợp lý đủ để bạn ghé mỗi ngày.",
            imageUrl: IMG.heroHome,
            primaryCtaLabel: "Khám phá Menu",
            primaryCtaHref: "/menu-go-cafe",
            secondaryCtaLabel: "Tìm chi nhánh gần bạn",
            secondaryCtaHref: "/danh-sach-chi-nhanh",
            videoUrl: "https://go-cafe.com/wp-content/uploads/2021/05/go-coffee-20s-fix-2.mp4",
            overlayOpacity: 50,
            height: "tall",
          },
        },
        {
          type: "stats_strip",
          payload: {
            anchorId: "con-so-noi-bat",
            columns: 4,
            items: [
              { value: "TOP 1", label: "Shopee Cà phê rang xay", sublabel: "98% đánh giá 5 sao" },
              { value: "55+", label: "Cửa hàng tại TP.HCM", sublabel: "Không gian mở thân thuộc" },
              { value: "72H", label: "Rang mới đóng gói", sublabel: "100% hạt mộc không tẩm" },
              { value: "1900 9246", label: "Tổng đài CSKH", sublabel: "Hỗ trợ 07:30 – 16:30" },
            ],
          },
        },
        {
          type: "split_content",
          payload: {
            anchorId: "cau-chuyen-go",
            imagePosition: "right",
            eyebrow: "VỀ GỜ CAFÉ",
            title: "Cafe không phải là mặt hàng xa xỉ — Người Việt xứng đáng uống cafe tốt hơn",
            content:
              "<p>Không phải những cửa hàng sang chảnh hay chạy theo thức uống trào lưu nhất thời, <strong>Gờ café</strong> tập trung trọn vẹn vào từng ly cà phê truyền thống đậm đà, sạch và đồng nhất.</p><p>Mỗi hạt cà phê được tuyển chọn kỹ lưỡng từ vùng nguyên liệu Tây Nguyên, rang mộc tại xưởng riêng của Gờ và phục vụ trong không gian mở thoáng đãng, gần gũi với nhịp sống Sài Gòn.</p>",
            imageUrl: IMG.about,
            ctaLabel: "Đọc câu chuyện Gờ Café",
            ctaHref: "/ve-chung-toi",
            blockStyle: { surface: "cream" },
          },
        },
        {
          type: "product_grid",
          payload: {
            anchorId: "menu-noi-bat",
            title: "Menu Thức Uống Đặc Trưng",
            subtitle: "6 nhóm thức uống tươi mới được pha chế chuẩn vị tại toàn bộ hệ thống Gờ Café",
            categories: [
              "Cà phê truyền thống",
              "Cà phê hiện đại",
              "Cacao / Matcha",
              "Trà trái cây",
              "Sữa chua",
              "Nước ép",
            ],
            items: [
              {
                name: "Cà Phê Sữa Đá Gờ",
                category: "Cà phê truyền thống",
                price: "29.000đ",
                badge: "Bán chạy",
                description: "Cà phê phin rang mộc đậm đà hòa quyện sữa đặc béo thơm chuẩn gu Sài Gòn.",
                imageUrl: IMG.traditionalCoffee,
                buyUrl: "/menu-go-cafe",
              },
              {
                name: "Cold Brew Nhiệt Đới",
                category: "Cà phê hiện đại",
                price: "39.000đ",
                badge: "Yêu thích",
                description: "Ủ lạnh 18 giờ thanh mát kết hợp hương trái cây nhiệt đới sảng khoái.",
                imageUrl: IMG.modernCoffee,
                buyUrl: "/menu-go-cafe",
              },
              {
                name: "Matcha Kem Phô Mai",
                category: "Cacao / Matcha",
                price: "42.000đ",
                badge: "Mới",
                description: "Trà xanh Nhật Bản thơm dịu phủ lớp kem phô mai mặn béo mịn màng.",
                imageUrl: IMG.matcha,
                buyUrl: "/menu-go-cafe",
              },
              {
                name: "Trà Đào Cam Sả",
                category: "Trà trái cây",
                price: "38.000đ",
                description: "Hồng trà ủ mới cùng đào miếng giòn ngọt, cam vàng tươi và sả thơm dịu.",
                imageUrl: IMG.fruitTea,
                buyUrl: "/menu-go-cafe",
              },
              {
                name: "Sữa Chua Nhiệt Đới",
                category: "Sữa chua",
                price: "39.000đ",
                description: "Sữa chua lên men tự nhiên sánh mịn kết hợp mứt trái cây chua ngọt dịu nhẹ.",
                imageUrl: IMG.yogurt,
                buyUrl: "/menu-go-cafe",
              },
              {
                name: "Nước Ép Cam Thơm",
                category: "Nước ép",
                price: "38.000đ",
                description: "100% trái cây tươi ép lạnh mỗi ngày, không đường tinh luyện, giàu vitamin C.",
                imageUrl: IMG.juice,
                buyUrl: "/menu-go-cafe",
              },
            ],
          },
        },
        {
          type: "split_content",
          payload: {
            anchorId: "xuong-rang",
            imagePosition: "left",
            eyebrow: "XƯỞNG RANG CÀ PHÊ GỜ",
            title: "Cà phê mộc không tẩm ướp — Rang mới trong vòng 72 giờ",
            content:
              "<p>Xưởng rang riêng của Gờ Café cung cấp cà phê hạt/bột sỉ cho hơn <strong>55 cửa hàng trong chuỗi</strong> và hàng trăm đối tác chủ quán trên toàn quốc.</p><ul><li>100% hạt cà phê chọn lọc, không đậu nành, không hương liệu.</li><li>Hồ sơ rang chuẩn hóa bằng máy rang công nghiệp hiện đại.</li><li>Chính sách giá sỉ linh hoạt theo mức <strong>5KG – 10KG – 20KG</strong>.</li></ul>",
            imageUrl: IMG.roastery,
            ctaLabel: "Xem Bảng Báo Giá Sỉ",
            ctaHref: "/xuong-rang-ca-phe",
            blockStyle: { surface: "dark" },
          },
        },
        {
          type: "split_content",
          payload: {
            anchorId: "nhuong-quyen-go",
            imagePosition: "right",
            eyebrow: "HỢP TÁC NHƯỢNG QUYỀN TỪ 2023",
            title: "Đồng hành mở quán Gờ Café tinh gọn, bền vững",
            content:
              "<p>Mô hình quán <strong>60–150m²</strong> không gian mở, tối ưu chi phí đầu tư ban đầu và quy trình vận hành tinh gọn đã được kiểm chứng qua hơn 55 điểm bán tại TP.HCM.</p><p>Gờ Café chuyển giao trọn gói công thức pha chế, nguồn nguyên liệu từ xưởng rang riêng, đào tạo nhân sự và đồng hành vận hành dài hạn.</p>",
            imageUrl: IMG.franchise,
            ctaLabel: "Xem Cẩm nang Nhượng quyền",
            ctaHref: "/nhuong-quyen",
            blockStyle: { surface: "cream" },
          },
        },
        {
          type: "testimonials",
          payload: {
            anchorId: "danh-gia",
            title: "Khách hàng & Đối tác nói gì về Gờ Café",
            subtitle: "Hơn 98% đánh giá 5 sao trên Shopee Mall và sự tin tưởng từ các chủ quán đối tác",
            columns: 3,
            items: [
              {
                author: "Anh Minh Quân",
                role: "Chủ quán nhượng quyền — Q. Tân Phú",
                quote:
                  "Quy trình chuyển giao của Gờ rất tinh gọn, cà phê rang mộc từ xưởng ổn định nên khách quen quay lại uống mỗi sáng.",
                rating: 5,
              },
              {
                author: "Chị Hồng Nhung",
                role: "Khách sỉ cà phê — Bình Thạnh",
                quote:
                  "Nhập sỉ Gu Truyền Thống 20kg/tháng hơn 1 năm nay, mẻ rang nào cũng thơm đều, khách khen đậm vị Sài Gòn.",
                rating: 5,
              },
              {
                author: "Bạn Thanh Tùng",
                role: "Khách hàng Shopee Mall",
                quote:
                  "Giao nhanh, ngày rang mới tinh trong 72H, pha phin ở nhà thơm y như ngồi uống ngoài cửa hàng Gờ.",
                rating: 5,
              },
            ],
          },
        },
        {
          type: "cta_banner",
          payload: {
            anchorId: "hanh-dong",
            tone: "gold",
            eyebrow: "ĐỒNG HÀNH CÙNG GỜ CAFÉ",
            title: "Sẵn sàng mở quán hoặc nhập sỉ cà phê nguyên chất?",
            subtitle: "Nhận ngay bộ hồ sơ nhượng quyền & mẫu thử cà phê rang mộc 72H hoàn toàn miễn phí.",
            primaryCtaLabel: "Xem Cẩm nang Nhượng quyền",
            primaryCtaHref: "/nhuong-quyen",
            secondaryCtaLabel: "Gọi 1900-9246",
            secondaryCtaHref: "tel:19009246",
          },
        },
        {
          type: "lead_form",
          payload: {
            anchorId: "lien-he-tu-van",
            formName: "Đăng ký tư vấn Gờ Café",
            eyebrow: "LIÊN HỆ NHANH",
            title: "Nhận tư vấn Nhượng quyền hoặc Báo giá sỉ Cà phê",
            subtitle:
              "Để lại thông tin của bạn, đội ngũ Gờ Café sẽ liên hệ tư vấn trực tiếp qua điện thoại hoặc Zalo.",
            submitLabel: "Gửi yêu cầu ngay",
            successMessage:
              "Cảm ơn bạn đã liên hệ Gờ Café! Chuyên viên sẽ gọi lại hỗ trợ trong giờ làm việc (07:30 – 16:30).",
            showEmail: true,
            showNote: true,
            notePlaceholder: "VD: Tư vấn nhượng quyền / Nhận mẫu thử cà phê sỉ / Đặt đơn nhóm...",
            popupDelaySec: 0,
          },
        },
      ],
    },
    {
      slug: "ve-chung-toi",
      internalName: "Gờ Café — Về chúng tôi",
      title: "Về Gờ Café",
      description:
        "Câu chuyện thương hiệu Gờ Café — chuỗi cửa hàng cà phê truyền thống thân thuộc tại TP.HCM.",
      blocks: [
        {
          type: "hero_section",
          payload: {
            anchorId: "ve-go",
            layout: "split",
            eyebrow: "CÂU CHUYỆN THƯƠNG HIỆU",
            title: "Gờ Café — Chuỗi cửa hàng cà phê truyền thống",
            subtitle:
              "Không chạy theo hào nhoáng nhất thời, Gờ Café xây dựng điểm hẹn thân thuộc mỗi ngày với ly cà phê thật, sạch và giá hợp lý cho người Việt.",
            imageUrl: IMG.about,
            primaryCtaLabel: "Xem hệ thống chi nhánh",
            primaryCtaHref: "/danh-sach-chi-nhanh",
            secondaryCtaLabel: "Khám phá Xưởng Rang",
            secondaryCtaHref: "/xuong-rang-ca-phe",
          },
        },
        {
          type: "info_cards",
          payload: {
            anchorId: "gia-tri-cot-loi",
            title: "3 Giá trị cốt lõi của Gờ Café",
            subtitle: "Điều giữ chân khách hàng quay lại mỗi sáng",
            columns: 3,
            variant: "card",
            items: [
              {
                badge: "01",
                title: "Chất lượng cà phê thật",
                description:
                  "Hạt cà phê tuyển chọn rang mộc tại xưởng riêng, giữ trọn hương vị đậm đà tự nhiên, nói không với hương liệu hóa học.",
              },
              {
                badge: "02",
                title: "Không gian mở thân thuộc",
                description:
                  "Thiết kế thoáng đãng, thoải mái trò chuyện, làm việc hay ghé mua mang đi nhanh chóng mà không gò bó.",
              },
              {
                badge: "03",
                title: "Giá hợp lý mỗi ngày",
                description:
                  "Tối ưu quy trình từ xưởng rang đến quầy pha chế để mỗi ly cà phê ngon luôn ở mức giá dễ tiếp cận hàng ngày.",
              },
            ],
          },
        },
        {
          type: "split_content",
          payload: {
            anchorId: "khong-gian",
            imagePosition: "left",
            eyebrow: "TRẢI NGHIỆM TẠI QUÁN",
            title: "Từ ly cà phê sáng đầu ngày đến buổi hẹn chiều cuối tuần",
            content:
              "<p>Gờ Café phục vụ từ 06:30 sáng tại hơn 55 cửa hàng khắp các quận TP.HCM. Ngoài cà phê phin và cà phê máy chuẩn gu, thực đơn còn có trà trái cây tươi, sữa chua và nước ép phục vụ mọi thành viên.</p>",
            imageUrl: IMG.heroSpace,
            ctaLabel: "Xem Menu thức uống",
            ctaHref: "/menu-go-cafe",
          },
        },
      ],
    },
    {
      slug: "danh-sach-chi-nhanh",
      internalName: "Gờ Café — Danh sách chi nhánh",
      title: "Danh sách chi nhánh Gờ Café",
      description:
        "Tìm cửa hàng Gờ Café gần nhất tại TP.HCM trên bản đồ tương tác 2 chiều, tra cứu theo tên đường và quận.",
      blocks: [
        {
          type: "hero_section",
          payload: {
            anchorId: "dau-trang",
            layout: "centered",
            eyebrow: "HỆ THỐNG CỬA HÀNG",
            title: "Tìm Gờ Café gần bạn nhất",
            subtitle:
              "Bấm chọn biểu tượng Gờ trên bản đồ hoặc nhập tên đường, quận không dấu để tra cứu địa chỉ và mở chỉ đường Google Maps tức thì.",
            primaryCtaLabel: "Xem trên bản đồ",
            primaryCtaHref: "#he-thong-quan",
            secondaryCtaLabel: "Hotline 1900-9246",
            secondaryCtaHref: "tel:19009246",
          },
        },
        {
          type: "store_locator",
          payload: {
            anchorId: "he-thong-quan",
            title: "Bản đồ Hệ thống Cửa hàng Gờ Café",
            subtitle: "Đồng bộ 2 chiều giữa Bản đồ & Danh sách — bấm thẻ quán để phóng tới vị trí",
            showSearch: true,
            showDistrictFilter: true,
            defaultZoom: 12,
          },
        },
      ],
    },
    {
      slug: "menu-go-cafe",
      internalName: "Gờ Café — Menu thức uống",
      title: "Menu Thức Uống Gờ Café",
      description:
        "Thực đơn 6 nhóm thức uống tại Gờ Café: Cà phê truyền thống, Cà phê hiện đại, Cacao/Matcha, Trà trái cây, Sữa chua, Nước ép.",
      blocks: [
        {
          type: "hero_section",
          payload: {
            anchorId: "dau-trang",
            layout: "split",
            eyebrow: "THỰC ĐƠN TẠI CỬA HÀNG",
            title: "Menu Gờ Café — Tươi mới mỗi ngày",
            subtitle:
              "Đa dạng lựa chọn từ Cà phê phin đậm đà, Cold Brew hiện đại đến Matcha kem phô mai, Trà trái cây và Nước ép tươi.",
            imageUrl: IMG.menuBanner,
            primaryCtaLabel: "Tìm quán gần bạn",
            primaryCtaHref: "/danh-sach-chi-nhanh",
            secondaryCtaLabel: "Mua cà phê mang về",
            secondaryCtaHref: "/xuong-rang-ca-phe",
          },
        },
        {
          type: "product_grid",
          payload: {
            anchorId: "thuc-don",
            title: "Tất cả thức uống",
            subtitle: "Chọn nhóm thức uống bên dưới để lọc nhanh",
            categories: [
              "Cà phê truyền thống",
              "Cà phê hiện đại",
              "Cacao / Matcha",
              "Trà trái cây",
              "Sữa chua",
              "Nước ép",
            ],
            items: [
              {
                name: "Cà Phê Đen Đá",
                category: "Cà phê truyền thống",
                price: "25.000đ",
                badge: "Kinh điển",
                description: "Đậm vị Robusta rang mộc nguyên chất, hậu ngọt dễ chịu.",
                imageUrl: IMG.traditionalCoffee,
              },
              {
                name: "Cà Phê Sữa Đá Gờ",
                category: "Cà phê truyền thống",
                price: "29.000đ",
                badge: "Bán chạy",
                description: "Tỷ lệ cà phê phin và sữa đặc cân bằng chuẩn vị Sài Gòn.",
                imageUrl: IMG.traditionalCoffee,
              },
              {
                name: "Bạc Xỉu Đá",
                category: "Cà phê truyền thống",
                price: "32.000đ",
                description: "Thơm béo sữa tươi kết hợp cốt cà phê phin dịu nhẹ.",
                imageUrl: IMG.traditionalCoffee,
              },
              {
                name: "Cold Brew Nhiệt Đới",
                category: "Cà phê hiện đại",
                price: "39.000đ",
                badge: "Yêu thích",
                description: "Cà phê ủ lạnh 18H kết hợp nước ép trái cây nhiệt đới thanh mát.",
                imageUrl: IMG.modernCoffee,
              },
              {
                name: "Matcha Kem Phô Mai",
                category: "Cacao / Matcha",
                price: "42.000đ",
                badge: "Mới",
                description: "Matcha Nhật Bản nguyên chất cùng lớp foam phô mai béo mặn.",
                imageUrl: IMG.matcha,
              },
              {
                name: "Trà Đào Cam Sả",
                category: "Trà trái cây",
                price: "38.000đ",
                badge: "Bán chạy",
                description: "Hồng trà ủ lạnh thơm thanh cùng đào miếng giòn và cam tươi.",
                imageUrl: IMG.fruitTea,
              },
              {
                name: "Sữa Chua Nhiệt Đới",
                category: "Sữa chua",
                price: "39.000đ",
                description: "Sữa chua lên men sánh mịn cùng topping trái cây nhiệt đới.",
                imageUrl: IMG.yogurt,
              },
              {
                name: "Nước Ép Cam Thơm",
                category: "Nước ép",
                price: "38.000đ",
                description: "Ép lạnh 100% cam vàng và thơm chín tự nhiên, không đường.",
                imageUrl: IMG.juice,
              },
            ],
          },
        },
      ],
    },
    {
      slug: "xuong-rang-ca-phe",
      internalName: "Gờ Café — Xưởng Rang & Báo Giá Sỉ",
      title: "Xưởng Rang Cà Phê Gờ — Báo Giá Sỉ",
      description:
        "Cà phê mộc không tẩm ướp, rang mới trong 72H. TOP 1 Shopee với 98% đánh giá 5 sao. Bảng báo giá sỉ 20KG / 10KG / 5KG.",
      blocks: [
        {
          type: "hero_section",
          payload: {
            anchorId: "dau-trang",
            layout: "split",
            eyebrow: "XƯỞNG RANG CÀ PHÊ GỜ",
            title: "Cà phê mộc, không tẩm ướp — Rang xay mới trong 72H",
            subtitle:
              "Nguồn cà phê ổn định cho hơn 55 cửa hàng Gờ Café và hàng trăm chủ quán toàn quốc. Hỗ trợ gửi mẫu thử miễn phí trước khi nhập sỉ.",
            imageUrl: IMG.roastery,
            primaryCtaLabel: "Xem Bảng Báo Giá Sỉ",
            primaryCtaHref: "#bang-bao-gia",
            secondaryCtaLabel: "Đăng ký nhận mẫu thử",
            secondaryCtaHref: "#nhan-mau-thu",
          },
        },
        {
          type: "stats_strip",
          payload: {
            anchorId: "uy-tin",
            columns: 3,
            items: [
              { value: "TOP 1", label: "Bán chạy Shopee", sublabel: "98% đánh giá 5 sao thực tế" },
              { value: "55+ CỬA HÀNG", label: "Chuỗi Gờ Café", sublabel: "Kiểm chứng chất lượng mỗi ngày" },
              { value: "RANG RIÊNG", label: "Xưởng rang chủ động", sublabel: "Hạt mới rang trong vòng 72H" },
            ],
          },
        },
        {
          type: "pricing_table",
          payload: {
            anchorId: "bang-bao-gia",
            title: "BẢNG BÁO GIÁ SỈ CÀ PHÊ RANG MỘC",
            effectiveNote: "Áp dụng cho đại lý & chủ quán • Hỗ trợ xay miễn phí theo máy/phin",
            columns: ["20KG / đơn", "10KG / đơn", "5KG / đơn"],
            rows: [
              {
                name: "Gu Cổ Điển (Robusta Đậm)",
                subtitle: "100% Robusta rang vừa đậm • Pha phin",
                prices: ["175.000đ/kg", "185.000đ/kg", "195.000đ/kg"],
                highlight: false,
              },
              {
                name: "Gu Truyền Thống (Best Seller)",
                subtitle: "80% Robusta + 20% Arabica • Pha phin & Pha máy",
                prices: ["195.000đ/kg", "205.000đ/kg", "215.000đ/kg"],
                highlight: true,
              },
              {
                name: "Gu Hiện Đại (Cân Bằng Hương)",
                subtitle: "50% Robusta + 50% Arabica Cầu Đất • Espresso / Cold Brew",
                prices: ["225.000đ/kg", "235.000đ/kg", "245.000đ/kg"],
                highlight: false,
              },
              {
                name: "Arabica Cầu Đất 100%",
                subtitle: "Chế biến ướt • Hương hoa quả, chua thanh hậu ngọt",
                prices: ["275.000đ/kg", "285.000đ/kg", "295.000đ/kg"],
                highlight: false,
              },
            ],
          },
        },
        {
          type: "info_cards",
          payload: {
            anchorId: "cam-ket",
            title: "Cam kết & Quyền lợi Khách hàng Sỉ",
            subtitle: "Đồng hành cùng chủ quán tối ưu chất lượng ly cà phê và biên lợi nhuận",
            columns: 3,
            variant: "card",
            items: [
              {
                badge: "CAM KẾT",
                title: "100% Cà phê mộc nguyên chất",
                description:
                  "Đầy đủ giấy công bố sản phẩm, kiểm nghiệm ATVSTP, hoàn tiền nếu phát hiện pha trộn bắp/đậu nành.",
              },
              {
                badge: "QUYỀN LỢI",
                title: "Đổi trả linh hoạt & Tư vấn gu",
                description:
                  "Hỗ trợ test mẫu miễn phí, căn chỉnh máy xay/pha phù hợp khẩu vị khách hàng tại khu vực quán.",
              },
              {
                badge: "GIAO HÀNG",
                title: "Giao nhanh nội thành & Toàn quốc",
                description:
                  "Rang mới theo lịch đặt, giao trong ngày tại TP.HCM và gửi chành xe/chuyển phát nhanh toàn quốc.",
              },
            ],
          },
        },
        {
          type: "testimonials",
          payload: {
            anchorId: "danh-gia",
            title: "Khách hàng & Đối tác nói gì về Gờ Café",
            subtitle: "Hơn 98% đánh giá 5 sao trên Shopee Mall và sự tin tưởng từ các chủ quán đối tác",
            columns: 3,
            items: [
              {
                author: "Anh Minh Quân",
                role: "Chủ quán nhượng quyền — Q. Tân Phú",
                quote:
                  "Quy trình chuyển giao của Gờ rất tinh gọn, cà phê rang mộc từ xưởng ổn định nên khách quen quay lại uống mỗi sáng.",
                rating: 5,
              },
              {
                author: "Chị Hồng Nhung",
                role: "Khách sỉ cà phê — Bình Thạnh",
                quote:
                  "Nhập sỉ Gu Truyền Thống 20kg/tháng hơn 1 năm nay, mẻ rang nào cũng thơm đều, khách khen đậm vị Sài Gòn.",
                rating: 5,
              },
              {
                author: "Bạn Thanh Tùng",
                role: "Khách hàng Shopee Mall",
                quote:
                  "Giao nhanh, ngày rang mới tinh trong 72H, pha phin ở nhà thơm y như ngồi uống ngoài cửa hàng Gờ.",
                rating: 5,
              },
            ],
          },
        },
        {
          type: "cta_banner",
          payload: {
            anchorId: "hanh-dong",
            tone: "gold",
            eyebrow: "ĐỒNG HÀNH CÙNG GỜ CAFÉ",
            title: "Sẵn sàng mở quán hoặc nhập sỉ cà phê nguyên chất?",
            subtitle: "Nhận ngay bộ hồ sơ nhượng quyền & mẫu thử cà phê rang mộc 72H hoàn toàn miễn phí.",
            primaryCtaLabel: "Xem Cẩm nang Nhượng quyền",
            primaryCtaHref: "/nhuong-quyen",
            secondaryCtaLabel: "Gọi 1900-9246",
            secondaryCtaHref: "tel:19009246",
          },
        },
        {
          type: "lead_form",
          payload: {
            anchorId: "nhan-mau-thu",
            formName: "Nhận mẫu thử cà phê sỉ",
            eyebrow: "DÀNH CHO CHỦ QUÁN",
            title: "Đăng ký nhận Mẫu thử & Báo giá sỉ chi tiết",
            subtitle: "Nhập SĐT và sản lượng dự kiến để xưởng rang Gờ Café gửi mẫu thử tận nơi.",
            submitLabel: "Đăng ký nhận mẫu thử",
            showEmail: true,
            showNote: true,
            notePlaceholder: "VD: Quán pha phin hay pha máy, sản lượng dự kiến kg/tháng...",
            popupDelaySec: 0,
          },
        },
      ],
    },
    {
      slug: "nhuong-quyen",
      internalName: "Gờ Café — Cẩm nang Nhượng quyền",
      title: "Cẩm nang Nhượng quyền Gờ Café",
      description:
        "Thông tin đầy đủ về mô hình nhượng quyền Gờ Café từ 2023: triết lý, thông số mặt bằng 60-150m², quy trình hợp tác 4 bước.",
      blocks: [
        {
          type: "hero_section",
          payload: {
            anchorId: "dau-trang",
            layout: "split",
            eyebrow: "NHƯỢNG QUYỀN THƯƠNG HIỆU TỪ 2023",
            title: "Cẩm nang Nhượng quyền Thương hiệu Gờ Café",
            subtitle:
              "Mô hình quán cà phê truyền thống tinh gọn, chi phí hợp lý và vận hành chuẩn hóa đã chứng minh hiệu quả tại hơn 55 điểm bán TP.HCM.",
            imageUrl: IMG.franchise,
            primaryCtaLabel: "Đăng ký nhận hồ sơ",
            primaryCtaHref: "#dang-ky-nhuong-quyen",
            secondaryCtaLabel: "Xem thông số quán",
            secondaryCtaHref: "#thong-so-quan",
          },
        },
        {
          type: "toc_bar",
          payload: {
            title: "Mục lục nhanh",
            sticky: true,
            items: [
              { label: "Triết lý Gờ Café", anchorId: "triet-ly" },
              { label: "Thông số mô hình quán", anchorId: "thong-so-quan" },
              { label: "4 Bước hợp tác", anchorId: "quy-trinh-hop-tac" },
              { label: "Đăng ký tư vấn", anchorId: "dang-ky-nhuong-quyen" },
            ],
          },
        },
        {
          type: "split_content",
          payload: {
            anchorId: "triet-ly",
            imagePosition: "right",
            eyebrow: "VỀ GỜ CÀFÊ",
            title: "Người Việt xứng đáng uống cà phê tốt hơn với mức giá hợp lý",
            content:
              "<p>Gờ Café không bán mô hình chạy theo xu hướng ngắn hạn. Chúng tôi xây dựng chuỗi cửa hàng cà phê hằng ngày — nơi khách hàng quay lại 4–6 lần mỗi tuần nhờ chất lượng đồ uống ổn định và không gian gần gũi.</p>",
            imageUrl: IMG.about,
          },
        },
        {
          type: "info_cards",
          payload: {
            anchorId: "thong-so-quan",
            title: "Thông số Mô hình Quán Nhượng quyền",
            subtitle: "Tiêu chuẩn mặt bằng và vận hành tối ưu điểm hòa vốn",
            columns: 3,
            variant: "card",
            items: [
              {
                badge: "DIỆN TÍCH",
                title: "60m² – 150m²",
                description: "Ưu tiên mặt bằng thông thoáng, không gian mở, có chỗ để xe thuận tiện.",
              },
              {
                badge: "PHÂN KHÚC",
                title: "Giá trung cấp (25K – 45K)",
                description: "Phù hợp dân văn phòng, cư dân khu vực và khách ghé uống hằng ngày.",
              },
              {
                badge: "SẢN PHẨM",
                title: "Cà phê • Trà • Sữa chua",
                description: "Thực đơn tinh gọn, nguyên liệu đồng bộ 100% từ xưởng rang Gờ Café.",
              },
            ],
          },
        },
        {
          type: "info_cards",
          payload: {
            anchorId: "quy-trinh-hop-tac",
            title: "4 Bước Hợp tác Nhượng quyền",
            subtitle: "Minh bạch từ khảo sát mặt bằng đến ngày khai trương",
            columns: 4,
            variant: "steps",
            items: [
              {
                badge: "Bước 1",
                title: "Đăng ký & Tư vấn",
                description: "Gửi thông tin khu vực, ngân sách và nhận bộ hồ sơ tài chính dự kiến.",
              },
              {
                badge: "Bước 2",
                title: "Khảo sát mặt bằng",
                description: "Đội ngũ Gờ trực tiếp thẩm định lưu lượng khách và tính khả thi.",
              },
              {
                badge: "Bước 3",
                title: "Thiết kế & Đào tạo",
                description: "Thi công theo chuẩn nhận diện Gờ Café và đào tạo pha chế – vận hành.",
              },
              {
                badge: "Bước 4",
                title: "Khai trương & Đồng hành",
                description: "Hỗ trợ nhân sự vận hành tuần đầu và cung ứng nguyên liệu xuyên suốt.",
              },
            ],
          },
        },
        {
          type: "testimonials",
          payload: {
            anchorId: "danh-gia",
            title: "Khách hàng & Đối tác nói gì về Gờ Café",
            subtitle: "Hơn 98% đánh giá 5 sao trên Shopee Mall và sự tin tưởng từ các chủ quán đối tác",
            columns: 3,
            items: [
              {
                author: "Anh Minh Quân",
                role: "Chủ quán nhượng quyền — Q. Tân Phú",
                quote:
                  "Quy trình chuyển giao của Gờ rất tinh gọn, cà phê rang mộc từ xưởng ổn định nên khách quen quay lại uống mỗi sáng.",
                rating: 5,
              },
              {
                author: "Chị Hồng Nhung",
                role: "Khách sỉ cà phê — Bình Thạnh",
                quote:
                  "Nhập sỉ Gu Truyền Thống 20kg/tháng hơn 1 năm nay, mẻ rang nào cũng thơm đều, khách khen đậm vị Sài Gòn.",
                rating: 5,
              },
              {
                author: "Bạn Thanh Tùng",
                role: "Khách hàng Shopee Mall",
                quote:
                  "Giao nhanh, ngày rang mới tinh trong 72H, pha phin ở nhà thơm y như ngồi uống ngoài cửa hàng Gờ.",
                rating: 5,
              },
            ],
          },
        },
        {
          type: "cta_banner",
          payload: {
            anchorId: "hanh-dong",
            tone: "gold",
            eyebrow: "ĐỒNG HÀNH CÙNG GỜ CAFÉ",
            title: "Sẵn sàng mở quán hoặc nhập sỉ cà phê nguyên chất?",
            subtitle: "Nhận ngay bộ hồ sơ nhượng quyền & mẫu thử cà phê rang mộc 72H hoàn toàn miễn phí.",
            primaryCtaLabel: "Xem Cẩm nang Nhượng quyền",
            primaryCtaHref: "/nhuong-quyen",
            secondaryCtaLabel: "Gọi 1900-9246",
            secondaryCtaHref: "tel:19009246",
          },
        },
        {
          type: "lead_form",
          payload: {
            anchorId: "dang-ky-nhuong-quyen",
            formName: "Đăng ký tư vấn nhượng quyền",
            eyebrow: "NHẬN HỒ SƠ NHƯỢNG QUYỀN",
            title: "Đăng ký tư vấn mở quán Gờ Café",
            subtitle: "Điền thông tin bên dưới để nhận bảng dự toán đầu tư & lịch hẹn khảo sát.",
            submitLabel: "Gửi đăng ký nhượng quyền",
            showEmail: true,
            showNote: true,
            notePlaceholder: "VD: Quận/Tỉnh dự kiến mở, diện tích mặt bằng hiện có...",
            popupDelaySec: 0,
          },
        },
      ],
    },
    {
      slug: "qa",
      internalName: "Gờ Café — Câu hỏi thường gặp",
      title: "Câu hỏi thường gặp (Q&A)",
      description: "Giải đáp các câu hỏi phổ biến về sản phẩm, đặt bàn, tuyển dụng và nhượng quyền Gờ Café.",
      blocks: [
        {
          type: "hero_section",
          payload: {
            anchorId: "dau-trang",
            layout: "centered",
            eyebrow: "HỖ TRỢ KHÁCH HÀNG",
            title: "Câu hỏi thường gặp",
            subtitle: "Tổng hợp giải đáp nhanh về cửa hàng, thực đơn, cà phê rang xay và chính sách hợp tác.",
          },
        },
        {
          type: "accordion",
          payload: {
            items: [
              {
                title: "Gờ Café có nhận đặt bàn trước cho nhóm đông không?",
                content:
                  "Gờ Café nhận đặt bàn trước với nhóm từ 15 khách trở lên qua tổng đài 1900-9246 (07:30 – 16:30). Nhóm dưới 15 khách vui lòng ghé trực tiếp cửa hàng gần nhất.",
              },
              {
                title: "Cà phê tại Gờ Café có tẩm hương liệu hay bơ không?",
                content:
                  "Hoàn toàn không. 100% cà phê của Gờ được rang mộc tại xưởng riêng, đóng gói mới trong vòng 72 giờ và có đầy đủ giấy công bố chất lượng.",
              },
              {
                title: "Tôi muốn ứng tuyển làm việc tại cửa hàng Gờ Café thì đăng ký ở đâu?",
                content:
                  "Bạn có thể bấm vào mục Tuyển dụng → Tại cửa hàng trên thanh menu để xem các vị trí đang mở và nộp hồ sơ trực tuyến.",
              },
              {
                title: "Đặt sỉ cà phê hạt/bột tối thiểu bao nhiêu kg?",
                content:
                  "Xưởng rang Gờ Café có mức giá sỉ ưu đãi ngay từ 5KG, 10KG và 20KG/đơn. Bạn có thể đăng ký nhận mẫu thử miễn phí tại trang Xưởng Rang.",
              },
            ],
          },
        },
        {
          type: "testimonials",
          payload: {
            anchorId: "danh-gia",
            title: "Khách hàng & Đối tác nói gì về Gờ Café",
            subtitle: "Hơn 98% đánh giá 5 sao trên Shopee Mall và sự tin tưởng từ các chủ quán đối tác",
            columns: 3,
            items: [
              {
                author: "Anh Minh Quân",
                role: "Chủ quán nhượng quyền — Q. Tân Phú",
                quote:
                  "Quy trình chuyển giao của Gờ rất tinh gọn, cà phê rang mộc từ xưởng ổn định nên khách quen quay lại uống mỗi sáng.",
                rating: 5,
              },
              {
                author: "Chị Hồng Nhung",
                role: "Khách sỉ cà phê — Bình Thạnh",
                quote:
                  "Nhập sỉ Gu Truyền Thống 20kg/tháng hơn 1 năm nay, mẻ rang nào cũng thơm đều, khách khen đậm vị Sài Gòn.",
                rating: 5,
              },
              {
                author: "Bạn Thanh Tùng",
                role: "Khách hàng Shopee Mall",
                quote:
                  "Giao nhanh, ngày rang mới tinh trong 72H, pha phin ở nhà thơm y như ngồi uống ngoài cửa hàng Gờ.",
                rating: 5,
              },
            ],
          },
        },
        {
          type: "cta_banner",
          payload: {
            anchorId: "hanh-dong",
            tone: "gold",
            eyebrow: "ĐỒNG HÀNH CÙNG GỜ CAFÉ",
            title: "Sẵn sàng mở quán hoặc nhập sỉ cà phê nguyên chất?",
            subtitle: "Nhận ngay bộ hồ sơ nhượng quyền & mẫu thử cà phê rang mộc 72H hoàn toàn miễn phí.",
            primaryCtaLabel: "Xem Cẩm nang Nhượng quyền",
            primaryCtaHref: "/nhuong-quyen",
            secondaryCtaLabel: "Gọi 1900-9246",
            secondaryCtaHref: "tel:19009246",
          },
        },
        {
          type: "lead_form",
          payload: {
            anchorId: "gui-cau-hoi",
            formName: "Câu hỏi khách hàng Q&A",
            title: "Cần hỗ trợ thêm?",
            subtitle: "Để lại câu hỏi, bộ phận CSKH Gờ Café sẽ phản hồi bạn sớm nhất.",
            submitLabel: "Gửi câu hỏi",
            showEmail: true,
            showNote: true,
            popupDelaySec: 0,
          },
        },
      ],
    },
  ];

  const pageMap = {};
  for (const spec of pagesSpec) {
    pageMap[spec.slug] = await upsertPublishedLandingPage(spec);
  }

  // 2. Cấu hình Site Shell mặc định trong bảng public.site_shells
  let { data: defaultShell } = await supabase
    .from("site_shells")
    .select("id")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("is_default", true)
    .maybeSingle();

  const shellPayload = {
    workspace_id: WORKSPACE_ID,
    name: "Website Gờ Café",
    is_default: true,
    site_name: "Gờ cafe",
    logo_media_id: logoMediaId,
    header_config: {
      sticky: true,
      hideSiteName: true,
      homePageSlug: "go-cafe",
      ctaEnabled: true,
      ctaLabel: "Nhượng quyền",
      ctaHref: "/nhuong-quyen",
      copyrightText: "Copyright © 2025 Gờ cafe.",
      navFont: "lexend-deca",
      navFontSize: 13,
      navBgColor: "#FFFFFF",
      navTextColor: "#111111",
      navActiveColor: "#B88A44",
      socialLinks: {
        facebook: "https://www.facebook.com/gocafe.vn",
        tiktok: "https://www.tiktok.com/@gocafe.vn",
        shopee: "https://shopee.vn/gocafe",
      },
    },
    footer_columns: [
      {
        title: "Thông tin",
        description:
          "Công ty TNHH Gờ Cafe\nĐiện thoại: 1900-9246\nEmail: info@go-cafe.com\nĐịa chỉ: 1C Thoại Ngọc Hầu, P. Hoà Thạnh, Q. Tân Phú, HCM\nĐịa chỉ giao dịch: 535 Kênh Tân Hoá, P. Hoà Thạnh, Q. Tân Phú, HCM",
        links: [],
      },
      {
        title: "Liên kết",
        links: [
          { label: "Về Gờ cafe", href: "/ve-chung-toi" },
          { label: "Cà Phê Bột / Xưởng Rang", href: "/xuong-rang-ca-phe" },
          { label: "Nhượng quyền", href: "/nhuong-quyen" },
          { label: "Danh sách chi nhánh", href: "/danh-sach-chi-nhanh" },
          { label: "Câu hỏi thường gặp", href: "/qa" },
        ],
      },
      {
        title: "Liên hệ",
        description: "Giờ làm việc văn phòng: 07:30 – 16:30 (Thứ 2 – Thứ 7)",
        links: [
          { label: "Hotline: 1900-9246", href: "tel:19009246" },
          { label: "Zalo CSKH: 0779 200 020", href: "https://zalo.me/0779200020" },
          { label: "Email: info@go-cafe.com", href: "mailto:info@go-cafe.com" },
        ],
      },
    ],
    floating_contact: {
      enabled: true,
      showCall: true,
      phone: "19009246",
      showZalo: true,
      zaloUrl: "https://zalo.me/0779200020",
    },
    default_theme: {
      copyrightText: "Copyright © 2025 Gờ cafe.",
    },
  };

  if (defaultShell?.id) {
    const { error: settingsErr } = await supabase
      .from("site_shells")
      .update(shellPayload)
      .eq("id", defaultShell.id);
    if (settingsErr) throw new Error(`Lỗi cập nhật site_shells: ${settingsErr.message}`);
  } else {
    const { data: createdShell, error: settingsErr } = await supabase
      .from("site_shells")
      .insert(shellPayload)
      .select("id")
      .single();
    if (settingsErr || !createdShell) {
      throw new Error(`Lỗi tạo site_shells: ${settingsErr?.message}`);
    }
    defaultShell = createdShell;
  }
  console.log("  ✓ Đã cấu hình Site Shell mặc định (Website Gờ Café)");

  // 3. Làm mới Menu 2 cấp cho bộ Website Gờ Café
  await supabase.from("site_nav_items").delete().eq("shell_id", defaultShell.id);

  const topNavItems = [
    { label: "Trang chủ", target_type: "page", target_page_id: pageMap["go-cafe"], position: 0 },
    { label: "Về Gờ cafe", target_type: "page", target_page_id: pageMap["ve-chung-toi"], position: 1 },
    {
      label: "Danh sách chi nhánh",
      target_type: "page",
      target_page_id: pageMap["danh-sach-chi-nhanh"],
      position: 2,
    },
    { label: "Menu", target_type: "page", target_page_id: pageMap["menu-go-cafe"], position: 3 },
    {
      label: "Xưởng Rang",
      target_type: "page",
      target_page_id: pageMap["xuong-rang-ca-phe"],
      position: 4,
    },
    {
      label: "Tuyển dụng",
      target_type: "url",
      target_value: "https://gocafe.hronline.vn/onStart%3dJobs",
      position: 5,
    },
    { label: "Câu hỏi thường gặp", target_type: "page", target_page_id: pageMap["qa"], position: 6 },
  ];

  const { data: insertedTop, error: navErr } = await supabase
    .from("site_nav_items")
    .insert(
      topNavItems.map((item) => ({
        workspace_id: WORKSPACE_ID,
        shell_id: defaultShell.id,
        parent_id: null,
        is_visible: true,
        ...item,
      }))
    )
    .select("id, label");
  if (navErr) throw new Error(`Lỗi tạo menu cấp 1: ${navErr.message}`);

  const tuyenDungParent = (insertedTop || []).find((i) => i.label === "Tuyển dụng");
  if (tuyenDungParent) {
    const { error: subErr } = await supabase.from("site_nav_items").insert([
      {
        workspace_id: WORKSPACE_ID,
        shell_id: defaultShell.id,
        parent_id: tuyenDungParent.id,
        label: "Tại cửa hàng",
        target_type: "url",
        target_value: "https://gocafe.hronline.vn/onStart%3dJobs",
        position: 0,
        is_visible: true,
      },
      {
        workspace_id: WORKSPACE_ID,
        shell_id: defaultShell.id,
        parent_id: tuyenDungParent.id,
        label: "Hợp tác Nhượng quyền",
        target_type: "page",
        target_page_id: pageMap["nhuong-quyen"],
        position: 1,
        is_visible: true,
      },
    ]);
    if (subErr) throw new Error(`Lỗi tạo menu cấp 2: ${subErr.message}`);
  }
  console.log("  ✓ Đã thiết lập thanh Menu 2 cấp (7 mục cha + 2 mục con dưới Tuyển dụng)");

  // 4. Nạp 12 chi nhánh TP.HCM & 3 Leads mẫu
  await seedBranches();
  await seedSampleLeads(pageMap);

  console.log("\n🎉 HOÀN TẤT GIẢ LẬP WEBSITE GO-CAFE.COM TRÊN LOCAL!");
  console.log("👉 Mở ngay trên trình duyệt:");
  console.log("   - Trang chủ:           http://localhost:3000/go-cafe");
  console.log("   - Về Gờ cafe:          http://localhost:3000/ve-chung-toi");
  console.log("   - Danh sách chi nhánh: http://localhost:3000/danh-sach-chi-nhanh");
  console.log("   - Menu thức uống:      http://localhost:3000/menu-go-cafe");
  console.log("   - Xưởng Rang (Báo giá):http://localhost:3000/xuong-rang-ca-phe");
  console.log("   - Nhượng quyền:        http://localhost:3000/nhuong-quyen");
  console.log("   - Câu hỏi thường gặp:  http://localhost:3000/qa");
  console.log("   - Quản trị CMS:        http://localhost:3000/admin/pages");
}

main().catch((err) => {
  console.error("❌ Lỗi seed demo go-cafe.com:", err);
  process.exit(1);
});
