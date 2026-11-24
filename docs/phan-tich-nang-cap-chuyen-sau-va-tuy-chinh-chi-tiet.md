# Phân tích Chuyên sâu & Đề xuất Nâng cấp Chức năng + Tùy chỉnh Chi tiết (Phase D — Enterprise Builder)

> **Dự án:** `gocafe.profile` (Platform CMS Dual-Mode + Multi-Tenant + SuperAdmin + Hyper-Customizable v3)  
> **Ngày lập:** 2026-11-24  
> **Bối cảnh hiện tại:** Hệ thống đã hoàn thiện 100% nền tảng cốt lõi (26 loại khối, Multi-Site Shell, Đa Tenant + SuperAdmin Control Center, Custom Domains, Block Design System v3, Floating Action Bar động, White-Label Admin & Map, Dynamic Lead Form + Telegram/Webhook riêng, Custom Templates, 329/329 tests PASS, 0 lỗi lint/typecheck).  
> **Mục tiêu tài liệu:** Phân tích chi tiết các nâng cấp **chuyên sâu ở mức vi mô (granular customization)** và **tính năng tăng trưởng kinh doanh (Growth / Marketing / CRM / Enterprise)**, phân loại rõ hạng mục **0-migration** và **cần migration nhỏ** để ra quyết định triển khai tối ưu.

---

## 1. Ma trận Đánh giá Ưu tiên (Impact vs. Effort)

| Nhóm | Chủ đề nâng cấp | Giá trị kinh doanh | Độ phức tạp | Migration DB | Đề xuất thứ tự |
| :---: | --- | :---: | :---: | :---: | :---: |
| **D1** | Tùy chỉnh vi mô các khối sẵn có (`ProductGrid`, `BannerSlider`, `PricingTable`) | Rất cao | Thấp | **0 migration** | **Ưu tiên 1** |
| **D2** | 4 Khối chuyển đổi cao (`Countdown`, `LogoMarquee`, `BeforeAfter`, `ComparisonTable`) | Rất cao | Trung bình | **1 migration nhỏ** *(mở rộng CHECK `block_type`)* | **Ưu tiên 2** |
| **D3** | Công cụ Marketing tại điểm bán (Branded QR Generator, Promo Popup, UTM Builder) | Rất cao (F&B/Chuỗi) | Thấp–TB | **0 migration** | **Ưu tiên 1** |
| **D4** | SEO Kỹ thuật Pro (`noindex`, Canonical, JSON-LD Rich Snippets) & Đa ngôn ngữ (`VI/EN`) | Cao | Trung bình | **0 migration** | **Ưu tiên 2** |
| **D5** | CRM Mini cho Leads (Kanban, Phân công Sale, Ghi chú nội bộ, Auto-Responder Email) | Cao | Trung bình | **1 migration nhỏ** | **Ưu tiên 3** |
| **D6** | Enterprise CMS (Hẹn giờ Xuất bản/Ẩn, Khóa mật khẩu trang, Thư mục Kho Media) | Trung bình–Cao | Trung bình | **1 migration nhỏ** | **Ưu tiên 4** |

---

## 2. Phân tích Chi tiết từng Nhóm Nâng cấp

---

### Nhóm D1 — Tùy chỉnh Vi mô các Khối Sẵn có *(0 migration — JSONB Payload)*

#### 2.1. Khối `product_grid` (Menu đồ uống / Danh mục sản phẩm)
- **Hiện trạng (`src/features/renderer/blocks/landing-blocks.tsx`):** Đang cố định lưới 3 cột, tỷ lệ ảnh `aspect-square`, kiểu thẻ cố định, bấm vào sản phẩm chưa có hộp xem chi tiết (chỉ có link `buyUrl`).
- **Tùy chỉnh chuyên sâu đề xuất:**
  - `columns?: 2 | 3 | 4` — tùy chọn số cột hiển thị trên Desktop (Mobile tự co 1–2 cột).
  - `imageAspect?: "square" | "4/3" | "3/4"` — phù hợp cả ly nước vuông (1:1), bánh/combo ngang (4:3) lẫn chai/túi cà phê đứng (3:4).
  - `cardStyle?: "minimal" | "bordered" | "elevated"` — tối giản không viền / có viền / đổ bóng nổi.
  - `badgeColor?: string` — đổi màu nhãn nổi bật (`Best Seller`, `Mới`, `-20%`) theo từng sản phẩm hoặc toàn khối.
  - `enableQuickView?: boolean` — khi bật, bấm vào thẻ món sẽ mở **Modal Xem chi tiết món** (ảnh phóng to, mô tả đầy đủ, giá, nút Đặt hàng / Gọi ngay).
  - `ctaLabel?: string` — đổi chữ nút hành động chung (VD: *"Đặt ngay"*, *"Xem chi tiết"*, *"Nhận báo giá"*).

#### 2.2. Khối `banner_slider` (Slider Quảng cáo / Hero Carousel)
- **Hiện trạng (`src/features/renderer/blocks/landing-blocks-p1.tsx`):** Cố định tỷ lệ `21/9`, chữ luôn nằm góc dưới trái, luôn hiện mũi tên và chấm tròn.
- **Tùy chỉnh chuyên sâu đề xuất:**
  - `aspectRatio?: "21/9" | "16/9" | "4/3" | "screen"` — linh hoạt từ banner ngang gọn đến full-screen hero.
  - `contentAlign?: "bottom-left" | "center" | "left-center"` — đặt chữ ở giữa hoặc góc dưới trái.
  - `overlayOpacity?: number` (`0–85%`) — thanh trượt điều chỉnh độ tối nền để chữ luôn dễ đọc trên mọi ảnh sáng/tối.
  - `showArrows?: boolean`, `showDots?: boolean` — bật/tắt điều hướng thủ công.
  - `pauseOnHover?: boolean` — tạm dừng tự chạy khi khách rê chuột đọc nội dung.

#### 2.3. Khối `pricing_table` (Bảng giá / Gói Nhượng quyền)
- **Hiện trạng (`src/features/renderer/blocks/landing-blocks.tsx`):** Chỉ hiển thị 1 danh sách gói phẳng; bấm nút CTA đi tới link tĩnh.
- **Tùy chỉnh chuyên sâu đề xuất:**
  - **Chuyển đổi nhóm bảng giá (Toggle Tabs):** Cho phép tạo 2 nhóm (VD: *"Mô hình Kiosk"* ↔ *"Mô hình Cửa hàng tiêu chuẩn"* hoặc *"Theo tháng"* ↔ *"Theo năm -20%"*).
  - **Gói nổi bật (`highlightColor` + `highlightLabel`):** Tự đặt nhãn (*"Phổ biến nhất"*, *"Hoàn vốn nhanh"*) và màu viền/nút riêng.
  - **Liên kết thông minh với Lead Form:** Khi nút CTA của gói trỏ `#anchor-form` kèm `prefillPackage`, tự động cuộn xuống Form và **điền sẵn tên gói khách vừa chọn** vào ô Ghi chú/Trường tùy chỉnh.

---

### Nhóm D2 — 4 Khối Chuyển đổi Cao Mới *(1 migration mở rộng `CHECK (type IN (...))`)*

| Loại khối (`type`) | Mục đích & Ứng dụng thực tế | Cấu trúc tùy chỉnh chính |
| --- | --- | --- |
| `countdown_timer` | Đếm ngược khai trương chi nhánh mới, Flash Sale, hạn nhận ưu đãi nhượng quyền | `targetIso` (ngày giờ đích), `title`, `subtitle`, `expiredMode` (`hide` \| `show_message`), `expiredMessage`, `tone` (`dark` \| `gold` \| `light`), `ctaLabel` / `ctaHref` |
| `logo_marquee` | Dải logo đối tác, báo chí, thương hiệu đồng hành chạy ngang vô tận | `title`, `speed` (`slow` \| `normal` \| `fast`), `grayscale` (bật đen trắng, hover lên màu), `logoHeight` (`28–64px`), `items[]` (`imageUrl`, `alt`, `href`) |
| `before_after` | Thanh kéo so sánh 2 ảnh Trước / Sau (thi công quán, bao bì mới, setup quầy bar) | `beforeImageUrl`, `beforeLabel`, `afterImageUrl`, `afterLabel`, `initialPosition` (`10–90%`), `aspectRatio` |
| `comparison_table` | Bảng so sánh chi tiết tiêu chí giữa 2–4 gói dịch vụ / mô hình nhượng quyền | `title`, `columns[]` (tên gói + highlight), `rows[]` (tên tiêu chí + giá trị `✓` / `✗` / text cho từng cột) |

- **Lưu ý DB:** Cần 1 migration 0-downtime mở rộng ràng buộc `CHECK` trên `page_blocks.type` từ 26 lên **30 loại khối** và đồng bộ `BLOCK_TYPES`, `BLOCK_REGISTRY`, `BLOCK_PAYLOAD_SCHEMAS`.

---

### Nhóm D3 — Công cụ Marketing & Chuyển đổi tại Điểm bán *(0 migration)*

#### 3.1. Trình tạo Mã QR Thương hiệu (Branded QR Generator)
- **Bài toán thực tế (F&B / Chuỗi cửa hàng):** Mỗi quán cần in mã QR đặt tại quầy thu ngân, bàn uống nước, standee (trỏ về Bio Link / Menu / Đánh giá / Form nhượng quyền).
- **Thiết kế chi tiết:**
  - Tích hợp nút **"Mã QR"** ngay trên từng dòng trang tại `/admin/pages` và từng chi nhánh tại `/admin/branches`.
  - Mở Modal cho phép tùy chỉnh:
    - **URL đích** (tự điền link trang công khai + cho phép gắn sẵn UTM `?utm_source=standee&utm_campaign=quan1`).
    - **Màu mã QR (`fgColor`) & Màu nền (`bgColor`)**.
    - **Chèn Logo thương hiệu ở giữa** (tự lấy logo của Site Shell mặc định hoặc tắt/chọn ảnh khác).
    - **Khung chữ bên dưới** (VD: *"Quét xem Menu Gờ Café"*).
    - Tải ngay file **PNG độ phân giải cao (1024×1024px)** hoặc **SVG vector** để gửi xưởng in không bị vỡ nét.
  - **Kỹ thuật:** Render 100% client-side qua thư viện nhẹ (`qrcode`) + Canvas, **0 tải lên server, 0 migration**.

#### 3.2. Popup Khuyến mãi / Voucher Toàn trang (Site-Wide Promo Popup)
- **Khác biệt với Lead Popup:** Dùng để hiển thị **ảnh banner khuyến mãi, mã giảm giá, thông báo khai trương** (không ép khách điền form ngay).
- **Cấu trúc lưu trong `site_shells.header_config.promoPopup`:**
  - `enabled`, `imageUrl`, `title`, `description`, `couponCode` (có nút 1 click **Sao chép mã**!), `ctaLabel`, `ctaHref`.
  - `delaySec` (`0–30s`), `frequency` (`once_session` \| `once_day` \| `always`), `excludeSlugs` (không hiện trên trang cảm ơn).

#### 3.3. Trình tạo Link UTM nhanh (UTM Link Builder)
- Đặt ngay trong Modal chia sẻ của `/admin/pages`: chọn nhanh nguồn (`facebook`, `tiktok`, `zalo`, `standee`, `email`), chiến dịch (`khai-truong-q7`, `nhuong-quyen-t11`) → sinh link hoàn chỉnh + nút Copy + nút Tạo QR từ chính link UTM đó.
- Dữ liệu UTM tự động chảy thẳng về `/admin/leads` và biểu đồ nguồn ở `/admin/reports`.

---

### Nhóm D4 — SEO Kỹ thuật Pro & Đa ngôn ngữ *(0 migration — `pages.seo` & `site_shells`)*

#### 4.1. SEO Kỹ thuật trên từng trang (`seo-editor.tsx` + `[slug]/page.tsx`)
- `noIndex?: boolean` — tự động xuất `robots: { index: false, follow: false }` trong `generateMetadata()` và loại trang đó khỏi `sitemap.xml` (cực kỳ cần thiết cho trang `/cam-on`, trang nội bộ, trang chiến dịch ẩn).
- `canonicalUrl?: string` — tránh trùng lặp nội dung SEO khi chạy nhiều biến thể Landing Page.
- **Tự động sinh JSON-LD Structured Data (`<script type="application/ld+json">`):**
  - Nếu trang có khối `store_locator` → tự sinh schema `CafeOrCoffeeShop` / `LocalBusiness` từ danh sách chi nhánh thật.
  - Nếu trang có khối `accordion` → tự sinh schema `FAQPage` (hiển thị câu hỏi xổ xuống ngay trên kết quả Google Search).
  - Nếu trang có khối `product_grid` → tự sinh schema `ItemList` / `Product`.

#### 4.2. Chuyển đổi Đa ngôn ngữ (`VI / EN` Switcher)
- Trong Tab SEO của mỗi trang, cho phép chọn **"Trang phiên bản ngôn ngữ khác"** (`alternateLocaleSlug`, `locale: "vi" | "en"`).
- Trên Navbar (`LandingShell`), nếu trang hiện tại có gắn cặp ngôn ngữ, tự động hiện nút chuyển gọn **`VI | EN`** ở góc phải và gắn thẻ `<link rel="alternate" hreflang="..." />` chuẩn SEO quốc tế.

---

### Nhóm D5 — CRM Mini cho Quản lý Khách hàng (`/admin/leads`) *(1 migration nhỏ)*

- **Migration đề xuất (`leads`):**
  - Thêm `assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL` (nhân viên phụ trách).
  - Thêm `internal_notes jsonb NOT NULL DEFAULT '[]'::jsonb` (mảng lịch sử ghi chú chăm sóc: `{ id, authorEmail, content, createdAt }`).
- **Nâng cấp Giao diện `/admin/leads`:**
  - **Nút chuyển chế độ xem `Bảng` ↔ `Kanban Board`:** Kéo-thả hoặc bấm chuyển nhanh giữa 4 cột (*Mới → Đã liên hệ → Đã chốt → Spam*).
  - **Drawer Chi tiết khách hàng:** Bấm vào 1 Lead mở ngăn kéo bên phải hiển thị đầy đủ câu trả lời các trường Custom Fields, nguồn UTM, chọn nhân viên phụ trách, và dòng thời gian ghi chú chăm sóc (VD: *"Đã gọi lần 1 — hẹn gửi bảng giá chiều nay"*).
- **Email xác nhận tự động (Auto-Responder):**
  - Cấu hình mẫu email cảm ơn (tiêu đề, nội dung, link brochure/PDF) trong `/admin/site`; khi khách gửi form có điền email, server tự gửi email xác nhận qua Resend API (nếu có cấu hình `RESEND_API_KEY`).

---

### Nhóm D6 — Quản trị Doanh nghiệp (Enterprise CMS) *(1 migration nhỏ)*

1. **Hẹn giờ Xuất bản & Tự động Ẩn trang:**
   - Thêm `scheduled_publish_at timestamptz` và `scheduled_unpublish_at timestamptz` trên `pages`.
   - RPC `get_public_page` kiểm tra mốc thời gian trực tiếp trong SQL (không cần cron phức tạp): trang tự động hiển thị đúng giờ mở bán và tự động ẩn khi hết hạn chiến dịch!
2. **Khóa mật khẩu từng trang (Password-Protected Pages):**
   - Thêm `access_password_hash text` trên `pages`.
   - Khi trang có đặt mật khẩu, khách truy cập thấy màn hình nhập mã truy cập tối giản; nhập đúng sẽ lưu cookie `HttpOnly` ngắn hạn để xem nội dung (dùng cho báo giá sỉ, hồ sơ nhượng quyền mật, tài liệu nội bộ).
3. **Thư mục / Nhãn cho Kho hình ảnh (`/admin/media`):**
   - Thêm `folder text DEFAULT 'chung'` và `tags text[] DEFAULT '{}'` trên `media_assets`.
   - Cho phép lọc nhanh theo thư mục (*Logo*, *Banner*, *Sản phẩm*, *Chi nhánh*) ngay trong cả `/admin/media` lẫn `MediaPickerField` khi đang thiết kế trang.

---

## 3. Lộ trình Triển khai Đề xuất (Tối ưu ROI nhanh nhất)

Nếu triển khai theo hướng **nhanh có giá trị thực tế nhất, ít rủi ro DB nhất**, khuyến nghị đi theo thứ tự sau:

1. **Đợt 1 (0 migration — 100% FE/BE):** **Nhóm D3 (Branded QR Generator + Promo Popup + UTM Builder)** + **Nhóm D1 (Tùy chỉnh vi mô Product Grid / Banner Slider / Pricing Table)** + **Nhóm D4 (SEO Pro: `noindex`, Canonical, JSON-LD, `VI/EN`)**.
2. **Đợt 2 (1 migration nhỏ):** **Nhóm D2 (4 khối chuyển đổi cao mới: Countdown, Logo Marquee, Before/After, Comparison Table)**.
3. **Đợt 3 (1 migration nhỏ):** **Nhóm D5 (CRM Mini: Kanban, Sale phụ trách, Ghi chú chăm sóc)** & **Nhóm D6 (Hẹn giờ chiến dịch, Khóa mật khẩu, Thư mục Kho ảnh)**.

---

*Tài liệu này là cơ sở để chốt phạm vi trước khi lập Checklist triển khai từng chặng (D1 → D6).*
