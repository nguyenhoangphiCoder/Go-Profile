# Checklist Triển khai & Nhật ký Thực hiện: Platform CMS (`Profile` + `Landing Page`)

> **Dự án:** `gocafe.profile`  
> **Tài liệu tham chiếu:**
>
> - [Đặc tả Tổng thể Platform CMS](./dac-ta-tong-the-platform-cms-profile-va-landing-page.md)
> - [Phân tích & Thiết kế Database](./phan-tich-database-nang-cap-platform-cms.md)

---

## Quy tắc bắt buộc sau khi hoàn thành mỗi Phase (Definition of Done)

Sau khi kết thúc **mỗi Phase**, bắt buộc phải thực hiện đủ 3 bước sau trước khi chuyển sang Phase kế tiếp:

1. **Kiểm chứng kỹ thuật (Verify):**
   - Nếu có thay đổi DB: chạy `pnpm db:reset` trên **Local Docker DB** (`pnpm db:status` = `[LOCAL DOCKER]`) không lỗi.
   - Chạy kiểm tra code: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, và `pnpm test` (trên Node 24 qua `fnm`).
   - Kiểm tra hoạt động thực tế trên giao diện (`http://localhost:3000`) cả Desktop và Mobile.
2. **Cập nhật Checklist:** Đánh dấu `[x]` toàn bộ các mục đã hoàn thành và cập nhật trạng thái trong **Bảng tổng quan tiến độ**.
3. **Ghi Nhật ký thực hiện (Execution Log):** Thêm 1 mục mới vào phần [Nhật ký thực hiện](#nhật-ký-thực-hiện-execution-log) gồm: ngày giờ, danh sách file/migration thay đổi, kết quả verify, và các lưu ý cần biết.

---

## Bảng Tổng quan Tiến độ

|    Phase    | Tên giai đoạn                                                               |   Trạng thái   | Ngày hoàn thành |
| :---------: | --------------------------------------------------------------------------- | :------------: | :-------------: |
| **Phase 0** | Thiết lập môi trường Local Docker DB & Tài liệu đặc tả                      | **Hoàn thành** |   2026-11-23    |
| **Phase 1** | Nền tảng tách biệt `Profile` vs `Landing Page` & Preset _Gờ Minimal Luxury_ | **Hoàn thành** |   2026-11-23    |
| **Phase 2** | Site Shell dùng chung: Menu 2 cấp, Footer 3 cột & Nút nổi                   | **Hoàn thành** |   2026-11-23    |
| **Phase 3** | Bộ 7 Section Landing Page & 4 Template dựng sẵn Gờ Café                     | **Hoàn thành** |   2026-11-23    |
| **Phase 4** | Hệ thống 55+ Chi nhánh & Bản đồ tương tác 2 chiều (`store_locator`)         | **Hoàn thành** |   2026-11-23    |
| **Phase 5** | Thu thập & Quản lý Khách hàng tiềm năng (`Leads`) + Chuẩn hóa Go-live       | **Hoàn thành** |   2026-11-23    |

---

## Phase 0 — Thiết lập Môi trường Cô lập (Local Docker DB) & Đặc tả

- [x] Khảo sát thực tế `go-cafe.com` (Trang chủ, Nhượng quyền, Xưởng rang, Chi nhánh) và xuất tài liệu đặc tả tổng thể.
- [x] Phân tích thiết kế Database mở rộng (2 bảng sửa + 4 bảng mới + RLS + RPC + 4 file migration).
- [x] Cài đặt Docker Desktop (WSL 2), chuyển `Disk image location` sang `D:\DockerData\DockerDesktopWSL`.
- [x] Khởi chạy Supabase Local (`http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`, Mailpit `http://127.0.0.1:54324`), sửa `supabase/seed.sql` tương thích workspace & sealed revision trigger.
- [x] Sao lưu `.env.local` (Cloud) -> `.env.cloud.local`, tạo `.env.docker.local`, script chuyển DB (`scripts/switch-db.mjs`), script tạo Admin Local (`scripts/create-local-admin.mjs`) và 7 lệnh `db:*` trong `package.json`.

---

## Phase 1 — Nền tảng tách biệt `Profile` vs `Landing Page` & Preset _Gờ Minimal Luxury_

### Database & Backend

- [x] Tạo migration `20261124000001_landing_pages_foundation.sql`:
  - [x] Thêm cột `pages.page_kind text NOT NULL DEFAULT 'profile' CHECK (page_kind IN ('profile', 'landing'))` + index `(workspace_id, page_kind) WHERE archived_at IS NULL`.
  - [x] Mở rộng `page_blocks_type_check` thêm 9 loại khối Landing Page (`hero_section`, `toc_bar`, `stats_strip`, `split_content`, `info_cards`, `pricing_table`, `product_grid`, `store_locator`, `lead_form`).
  - [x] Cập nhật RPC `create_page(...)` nhận tham số `p_page_kind text DEFAULT 'profile'`.
  - [x] Cập nhật RPC `get_public_page(p_slug)` trả thêm `page_kind` và `workspace_id`.
- [x] Chạy `pnpm db:reset` kiểm chứng migration + `seed.sql` sạch lỗi trên Local Docker DB.

### Types, Theme & Block Registry

- [x] Cập nhật kiểu dữ liệu (`PageKind = "profile" | "landing"`) trong tầng types & actions (`createPageAction`, `getPageForEditor`, `getPublicPageBySlug`).
- [x] Bổ sung `scopes: ("profile" | "landing")[]` vào `BLOCK_REGISTRY` để tách Block Picker theo loại trang.
- [x] Thêm theme preset **`go-minimal-luxury`** (`Lexend Deca`, nền `#FFFFFF` / `#F8F7F4`, chữ `#111111` / `#52525B`, nhấn vàng đồng `#B88A44`, nút `#111111`) vào `theme-tokens.ts`.

### Admin UI & Public Renderer

- [x] Cập nhật `/admin/pages`: thêm tab lọc `Tất cả | Profile | Landing Page` + badge nhận diện từng loại trang.
- [x] Xây dựng **Wizard tạo trang mới 2 bước**: Bước 1 chọn loại (`Profile` / `Landing Page`) → Bước 2 chọn Mẫu dựng sẵn.
- [x] Cập nhật trình biên tập (`PageEditor`):
  - [x] Lọc Block Picker theo `page_kind`.
  - [x] Với `landing`: khung Preview mặc định Desktop (zoom tự co vừa màn hình), có nút chuyển nhanh `Desktop (1280px) / Tablet (768px) / Mobile (375px)`.
- [x] Cập nhật Public Renderer (`/[slug]`): `profile` giữ nguyên khung dọc `max-w: 420–620px`; `landing` render full-width responsive (`max-w: 1200–1280px`).

### Kiểm chứng Phase 1

- [x] `pnpm db:reset` + `pnpm typecheck` + `pnpm lint` + `pnpm format:check` + `pnpm test` pass 100%.
- [ ] Test thực tế: Trang Profile cũ hiển thị & chỉnh sửa 100% như trước; tạo mới, auto-save, xuất bản được 1 Landing Page với preset _Gờ Minimal Luxury_.
- [x] **Check list & Ghi log Phase 1.**

---

## Phase 2 — Site Shell dùng chung: Menu 2 cấp, Footer 3 cột & Nút nổi

### Database & Backend

- [x] Tạo migration `20261124000002_site_shell.sql`:
  - [x] Tạo bảng `workspace_site_settings` (kèm FK `logo_media_id` + trigger chống chéo workspace).
  - [x] Tạo bảng `site_nav_items` (kèm `CHECK` chống tự trỏ, trigger giới hạn tối đa 2 cấp + kiểm tra cùng workspace).
  - [x] Bật RLS (`can_read_workspace` / `can_edit_workspace`) cho cả 2 bảng.
  - [x] Cập nhật RPC `get_public_page(p_slug)` trả kèm object `site_shell` (chỉ khi `page_kind = 'landing'`, tự lọc tab ẩn / trang đã archive và resolve sẵn `target_slug`).
- [x] Xây dựng Server Actions + Zod schemas cho `/admin/site` (cập nhật Site Settings, CRUD + kéo thả sắp xếp Menu 2 cấp, nút "Tạo trang mới cho tab này", gọi `revalidateTag(PUBLIC_PAGES_TAG)`).

### Admin UI & Public Site Shell

- [x] Thêm mục **Cấu hình Website (`/admin/site`)** vào Admin Sidebar.
- [x] Xây dựng UI quản lý **Menu 2 cấp** (thêm tab cha, thêm mục con dropdown, chọn đích Trang / Neo / URL, bật/tắt hiển thị, đổi thứ tự).
- [x] Xây dựng UI cấu hình **Header (Logo, Sticky, CTA phải)**, **Footer 3 cột**, và **Nút nổi Gọi / Zalo**.
- [x] Xây dựng Public `LandingShell`: Navbar dính đầu trang + Dropdown 2 cấp (Desktop) + Drawer trượt (Mobile) + Footer 3 cột + Cụm nút nổi Zalo/Gọi (dùng lại `PhoneActionSheet`).
- [x] Thêm công tắc bật/tắt Site Shell riêng trên từng Landing Page (nếu cần trang chiến dịch không hiện Menu).

### Kiểm chứng Phase 2

- [x] `pnpm db:reset` + `pnpm typecheck` + `pnpm lint` + `pnpm format:check` + `pnpm test` pass 100%.
- [ ] Test thực tế: Thêm/sửa/kéo thả 8 tab Gờ Café (có dropdown 2 cấp) → mọi Landing Page cập nhật đồng bộ ngay lập tức trên Desktop & Mobile.
- [x] **Check list & Ghi log Phase 2.**

---

## Phase 3 — Bộ 7 Section Landing Page & 4 Template dựng sẵn Gờ Café

### Zod Schemas, Editors & Renderers cho 7 Section mới

- [x] `hero_section`: Banner mở đầu (3 layout `split | centered | full-bg`, eyebrow, title `H1`, subtitle, ảnh/crop, 2 nút CTA).
- [x] `toc_bar`: Thanh mục lục nhảy mục (`sticky`, bấm cuộn mượt tới `anchorId` của các section bên dưới).
- [x] `stats_strip`: Dải chỉ số uy tín (`3 | 4` cột — VD: `TOP 1 Shopee`, `55+ Cửa hàng`, `Rang mới 72H`).
- [x] `split_content`: Khối 2 cột Ảnh – Chữ (đảo vị trí ảnh Trái/Phải, RichText HTML, CTA).
- [x] `info_cards`: Thẻ thông số / Quy trình (`2 | 3 | 4` cột, variant `card | steps`).
- [x] `pricing_table`: Bảng báo giá đa cột (`20KG | 10KG | 5KG`, highlight dòng nổi bật, cuộn ngang mượt trên Mobile).
- [x] `product_grid`: Lưới sản phẩm / Menu (lọc theo danh mục `categories`, ảnh, giá, mô tả, badge, nút mua/xem).
- [x] Hỗ trợ trường `anchorId` chung cho mọi Landing Section để liên kết mượt với `toc_bar` và Menu.

### Bộ Mẫu dựng sẵn (Templates) trong Wizard

- [x] Template 1: **Trang chủ thương hiệu Gờ Café**
- [x] Template 2: **Cẩm nang Nhượng quyền** (có `toc_bar` + `info_cards` + `split_content`)
- [x] Template 3: **Xưởng rang / Báo giá sỉ Cà phê bột** (có `stats_strip` + `pricing_table` 20kg/10kg/5kg)
- [x] Template 4: **Trang trống** (tự lắp ghép tự do)

### Kiểm chứng Phase 3

- [x] `pnpm typecheck` + `pnpm lint` + `pnpm format:check` + `pnpm test` (bổ sung unit test cho 7 schema & renderer mới) pass 100%.
- [ ] Test thực tế: Tạo thử 3 trang mẫu (_Trang chủ_, _Nhượng quyền_, _Xưởng rang_) từ Wizard, kiểm tra hiển thị đẹp trên Desktop (1280px) & Mobile (375px), kiểm tra tự động khóa ảnh trong Media khi xóa.
- [x] **Check list & Ghi log Phase 3.**

---

## Phase 4 — Hệ thống 55+ Chi nhánh & Bản đồ tương tác 2 chiều (`store_locator`)

### Database & Backend

- [x] Tạo migration `20261124000003_branches.sql`:
  - [x] Tạo bảng `public.branches` (ràng buộc `lat`/`lng`, `is_active`, `archived_at`, index lọc).
  - [x] Bật RLS (`can_read_workspace` / `can_edit_workspace`).
  - [x] Tạo RPC công khai `public.get_public_branches(p_workspace_id uuid)`.
- [x] Xây dựng Server Actions quản lý chi nhánh (CRUD, ẩn/hiện, import hàng loạt CSV/Excel, utility tự tách `lat, lng` từ link Google Maps).

### Admin UI (`/admin/branches`)

- [x] Thêm mục **Chi nhánh (`/admin/branches`)** vào Admin Sidebar.
- [x] Xây dựng bảng quản lý chi nhánh (tìm kiếm, lọc theo quận, thêm/sửa/ẩn, dán link Maps tự điền tọa độ).
- [x] Xây dựng modal **Import CSV/Excel** có bước xem trước & báo lỗi tọa độ trước khi lưu.

### Public Block `store_locator` & Template Hệ thống quán

- [x] Cài đặt Leaflet (+ marker cluster) cho bản đồ OpenStreetMap (0đ phí API), load động (`next/dynamic`, `ssr: false`).
- [x] Xây dựng khối `store_locator`:
  - [x] Desktop 2 cột: Trái (60%) Bản đồ pin logo Gờ Café | Phải (40%) Ô search không dấu (tên đường/quận) + lọc Quận + danh sách cuộn.
  - [x] Mobile: Tab chuyển đổi gọn giữa _Bản đồ_ và _Danh sách_.
  - [x] **Đồng bộ 2 chiều:** Bấm pin trên bản đồ → danh sách tự cuộn & highlight thẻ quán; bấm thẻ quán → bản đồ tự `flyTo` & mở popup.
  - [x] Nút **Chỉ đường Google Maps** & nút **Gọi / Zalo** trên mỗi thẻ quán.
- [x] Thêm Template 5 trong Wizard: **Hệ thống chi nhánh**.

### Kiểm chứng Phase 4

- [x] `pnpm db:reset` + `pnpm typecheck` + `pnpm lint` + `pnpm format:check` + `pnpm test` pass 100%.
- [ ] Test thực tế: Import dữ liệu mẫu nhiều chi nhánh TP.HCM, kiểm tra search không dấu (_"ap bac"_, _"tan phu"_), bấm đồng bộ 2 chiều Map ⇄ List trên cả Desktop & Mobile.
- [x] **Check list & Ghi log Phase 4.**

---

## Phase 5 — Thu thập & Quản lý Khách hàng tiềm năng (`Leads`) + Chuẩn hóa Go-live

### Database & API chống spam

- [x] Tạo migration `20261124000004_leads.sql`:
  - [x] Tạo bảng `public.leads` (`status`, UTM fields, `ip_hash`, index lọc & rate-limit).
  - [x] Bật RLS: **chặn 100% `anon`** (kể cả `INSERT`), mở `SELECT` cho `viewer` và `SELECT/UPDATE/DELETE` cho `editor/owner`.
- [x] Xây dựng Route Handler `POST /api/leads`:
  - [x] Validate Zod + chuẩn hóa SĐT Việt Nam.
  - [x] Chống spam: Honeypot field ẩn + Rate Limit theo `ip_hash` (SHA-256).
  - [x] Lưu bằng `service_role` kèm `utm_source / utm_medium / utm_campaign`.
  - [x] (Tuỳ chọn) Gửi thông báo tức thì qua Telegram Bot / Email nếu workspace có cấu hình.

### Public Block `lead_form` & Admin UI (`/admin/leads`)

- [x] Xây dựng khối `lead_form` (hỗ trợ nhúng trực tiếp trên trang & tuỳ chọn Popup sau `N` giây).
- [x] Thêm mục **Khách hàng (`/admin/leads`)** vào Admin Sidebar:
  - [x] Danh sách Leads kèm bộ lọc theo Trang, Tên form, Trạng thái (`Mới / Đã liên hệ / Chốt / Spam`), khoảng ngày.
  - [x] Đổi trạng thái nhanh & nút **Xuất file CSV/Excel** (chuẩn UTF-8 BOM mở đẹp trên Excel tiếng Việt).

### Hoàn thiện SEO & Kiểm tra Go-live Production

- [x] Kiểm tra `sitemap.xml`, `Open Graph`, thẻ `H1` duy nhất, redirect `308` giữ nguyên các URL cũ từ `go-cafe.com`.
- [x] Chạy toàn bộ test suite (`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`).
- [x] Kiểm tra danh sách 4 migration sẵn sàng áp dụng lên Supabase Cloud (0-downtime).
- [x] **Check list & Ghi log Phase 5.**

---

## Nhật ký Thực hiện (Execution Log)

### [Phase 0] — 2026-11-23 14:36 (+07:00) — Hoàn thành

- **Mục tiêu:** Cô lập hoàn toàn môi trường DB local bằng Docker (Supabase Local) và hoàn thiện bộ tài liệu phân tích kiến trúc & DB.
- **Thay đổi đã thực hiện:**
  - Chuyển dữ liệu Docker Desktop (`Disk image location`) từ ổ `C:` sang `D:\DockerData\DockerDesktopWSL` (giải phóng ~6.8 GB ổ C).
  - Khởi chạy thành công cụm Supabase Local trên Docker (12/12 migrations + `seed.sql` nạp sạch).
  - Cập nhật [supabase/seed.sql](../supabase/seed.sql): bổ sung `workspace_id` mặc định (`00000000-0000-4000-8000-000000000001`) và đổi thứ tự niêm phong (`draft` → insert blocks/placements → `sealed`) để tương thích trigger bảo vệ revision.
  - Tạo [scripts/switch-db.mjs](../scripts/switch-db.mjs) và [scripts/create-local-admin.mjs](../scripts/create-local-admin.mjs), cập nhật [package.json](../package.json) với 7 script `db:*`.
  - Sao lưu `.env.local` (Cloud) → `.env.cloud.local`, chuyển `.env.local` sang `.env.docker.local` (`http://127.0.0.1:54321`), tạo tài khoản Admin Local (`admin@gocafe.local`) và bucket `public_media`.
  - Xuất bộ tài liệu: [dac-ta-tong-the-platform-cms-profile-va-landing-page.md](./dac-ta-tong-the-platform-cms-profile-va-landing-page.md), [phan-tich-database-nang-cap-platform-cms.md](./phan-tich-database-nang-cap-platform-cms.md), và file checklist này.
- **Kết quả kiểm chứng:**
  - `pnpm db:status`: `DB hiện tại: [LOCAL DOCKER] -> http://127.0.0.1:54321`
  - `pnpm db:seed-admin`: Tạo thành công `admin@gocafe.local` + quyền `owner` workspace Gờ Cafe + bucket `public_media`.
  - `git status`: Toàn bộ `.env*.local` được `.gitignore` ẩn an toàn.
- **Lưu ý cho Phase tiếp theo:** Luôn đảm bảo `pnpm db:status` là `[LOCAL DOCKER]` trước khi chạy `pnpm db:reset` và phát triển Phase 1.

### [Phase 1 — Database & Backend] — 2026-11-23 14:48 (+07:00) — Hoàn thành phần DB

- **Mục tiêu:** Tạo migration nền tảng tách biệt `profile` vs `landing`, mở rộng 9 loại khối Landing Page, cập nhật RPC `create_page` & `get_public_page`.
- **Thay đổi đã thực hiện:**
  - Tạo mới [supabase/migrations/20261124000001_landing_pages_foundation.sql](../supabase/migrations/20261124000001_landing_pages_foundation.sql):
    - Thêm `public.pages.page_kind` (`DEFAULT 'profile'`, `CHECK (page_kind IN ('profile', 'landing'))`) + partial index `idx_pages_workspace_kind_active`.
    - Mở rộng `page_blocks_type_check` lên 23 loại khối (14 cũ + 9 Landing Page sections).
    - Thay thế chữ ký 4 tham số bằng bản 5 tham số `create_page(..., p_page_kind text DEFAULT 'profile')` (tránh ambiguous overload PostgREST); khi tạo `'landing'` tự gắn preset `'go-minimal-luxury'` và block khởi tạo `'hero_section'`.
    - Cập nhật `get_public_page(p_slug)` trả thêm `page_kind` và `workspace_id`.
- **Kết quả kiểm chứng (trên Local Docker DB):**
  - `pnpm db:status` → `[LOCAL DOCKER] -> http://127.0.0.1:54321`.
  - `pnpm db:reset` → 13/13 migrations + `seed.sql` + `create-local-admin.mjs` thành công 100%.
  - Smoke test RPC trực tiếp: `get_public_page('gocafe')` trả đúng `page_kind: 'profile'`, `workspace_id`; `create_page` 4 tham số tạo đúng `profile`; `create_page` 5 tham số (`'landing'`) tạo đúng `landing` với preset `'go-minimal-luxury'` và block `'hero_section'`.
- **Bước tiếp theo:** Triển khai tiếp phần `Types, Theme & Block Registry` + `Admin UI & Public Renderer` của Phase 1.

### [Phase 1 — Types, Theme & Block Registry] — 2026-11-23 14:58 (+07:00) — Hoàn thành phần Core

- **Mục tiêu:** Đưa `PageKind = "profile" | "landing"` vào toàn bộ tầng types/schemas/queries/actions, gắn `scopes` cho `BLOCK_REGISTRY`, và bổ sung preset _Gờ Minimal Luxury_.
- **Thay đổi đã thực hiện:**
  - [src/types/database.generated.ts](../src/types/database.generated.ts): Bổ sung cột `pages.page_kind` và tham số `create_page.p_page_kind`.
  - [src/features/pages/types.ts](../src/features/pages/types.ts) & [src/features/public/types.ts](../src/features/public/types.ts): Thêm `PageKind`, gắn `pageKind` vào `PageListItem`, `PageEditorData.page`, và `page_kind`/`workspace_id` vào `PublicPageDTO`.
  - [src/features/pages/schemas.ts](../src/features/pages/schemas.ts): Thêm `pageKindSchema` (`"profile" | "landing"`) vào `createPageSchema` (mặc định `"profile"`) và thêm `"lexend-deca"` vào `legacyThemeCustomSchema`.
  - [src/features/pages/queries.ts](../src/features/pages/queries.ts) & [src/features/pages/actions.ts](../src/features/pages/actions.ts): Đọc/truyền `page_kind` trong `getPagesList`, `getPageEditorData`, `getNewPageEditorData`, `createPageAction` và `duplicatePageAction` (nhân bản giữ nguyên loại trang).
  - [src/config/themes.ts](../src/config/themes.ts) & [src/config/theme-tokens.ts](../src/config/theme-tokens.ts): Thêm preset **`go-minimal-luxury`** (`Lexend Deca`, `#FFFFFF`, `#111111`, nhấn vàng đồng `#B88A44`, nút `#111111` cao `48px`).
  - [src/features/renderer/blocks/registry.tsx](../src/features/renderer/blocks/registry.tsx): Thêm `scopes: PageKind[]` cho toàn bộ 14 khối hiện tại + helper `getBlocksForPageKind(kind)`.
- **Kết quả kiểm chứng:**
  - `pnpm typecheck`: Pass (0 errors).
  - `pnpm lint`: Pass (0 errors).
  - `vitest` (Node 24): **51/51 tests passed** (`theme-tokens`, `renderer`, `public-slug-gate`).
- **Bước tiếp theo:** Triển khai phần cuối của Phase 1 — `Admin UI & Public Renderer` (lọc `Profile / Landing` ở `/admin/pages`, Wizard tạo trang 2 bước, lọc Block Picker + Preview Desktop/Tablet/Mobile, và Renderer full-width).

### [Phase 1 — Admin UI, Public Renderer & Hoàn tất Phase 1] — 2026-11-23 15:06 (+07:00) — Hoàn thành Phase 1

- **Mục tiêu:** Hoàn thiện giao diện phân loại `Profile / Landing`, Wizard tạo trang 2 bước, khối mở đầu `hero_section`, Preview Desktop/Tablet/Mobile, lọc Block Picker theo `page_kind`, và Public Renderer full-width.
- **Thay đổi đã thực hiện:**
  - [src/features/pages/components/pages-table.tsx](../src/features/pages/components/pages-table.tsx): Thêm tab lọc `Tất cả | Profile | Landing Page` kèm số đếm và badge nhận diện loại trang trên từng dòng.
  - [src/features/pages/components/create-page-modal.tsx](../src/features/pages/components/create-page-modal.tsx): Nâng cấp thành **Wizard 2 bước** (Bước 1 chọn `Trang Profile` / `Landing Page`; Bước 2 nhập tên nội bộ, slug, tiêu đề).
  - [src/features/renderer/blocks/landing-hero-block.tsx](../src/features/renderer/blocks/landing-hero-block.tsx), [payload-schemas.ts](../src/features/renderer/blocks/payload-schemas.ts), [registry.tsx](../src/features/renderer/blocks/registry.tsx), [block-item-editor.tsx](../src/features/pages/components/editor/block-item-editor.tsx): Bổ sung khối `hero_section` (`split | centered | full-bg`, eyebrow, `H1`, subtitle, ảnh banner, 2 nút CTA) phạm vi `["landing"]`.
  - [src/features/pages/components/editor/block-picker-modal.tsx](../src/features/pages/components/editor/block-picker-modal.tsx): Lọc khối theo `BLOCK_REGISTRY[type].scopes.includes(pageKind)`.
  - [src/features/pages/components/editor/live-preview.tsx](../src/features/pages/components/editor/live-preview.tsx) & [page-editor.tsx](../src/features/pages/components/editor/page-editor.tsx): Với `landing`, mặc định Preview Desktop (`1280px` tự co scale vừa khung), hỗ trợ chuyển nhanh `Điện thoại (375) / Tablet (768) / Máy tính (1280)`.
  - [src/features/renderer/page-renderer.tsx](../src/features/renderer/page-renderer.tsx) & [public-page-view.tsx](../src/features/public/components/public-page-view.tsx): `landing` render full-width responsive `max-w-[1200px]`, giữ nguyên 100% layout `profile` cũ.
- **Kết quả kiểm chứng:**
  - `pnpm db:reset`: 13/13 migrations + `seed.sql` + `admin@gocafe.local` pass 100% trên Local Docker DB.
  - `pnpm typecheck`: Pass (0 errors).
  - `pnpm lint`: Pass (0 errors, 0 warnings mới).
  - `vitest` (Node 24): **51/51 tests passed** (`theme-tokens`, `renderer`, `public-slug-gate`).
- **Bước tiếp theo:** Test thực tế trên `http://localhost:3000` (tạo 1 Landing Page với preset _Gờ Minimal Luxury_), sau đó chuyển sang **Phase 2 — Site Shell (Menu 2 cấp, Footer 3 cột & Nút nổi)**.

### [Phase 2 — Chặng 2A: Database & Backend Site Shell] — 2026-11-23 15:21 (+07:00) — Chờ nghiệm thu

- **Mục tiêu:** Xây dựng hạ tầng DB & Backend cho Site Shell dùng chung (Header/Menu 2 cấp, Footer 3 cột, Nút nổi Zalo/Gọi) trước khi làm giao diện `/admin/site` và `LandingShell`.
- **Thay đổi đã thực hiện:**
  - Tạo migration [supabase/migrations/20261124000002_site_shell.sql](../supabase/migrations/20261124000002_site_shell.sql):
    - Bảng `public.workspace_site_settings` (1–1 `workspaces`, FK `logo_media_id`, trigger chống logo chéo workspace, RLS `can_read_workspace`/`can_edit_workspace`).
    - Bảng `public.site_nav_items` (Menu 2 cấp, `CHECK` chống tự trỏ & rỗng đích, trigger giới hạn tối đa 2 cấp + kiểm tra cùng workspace, RLS).
    - Cập nhật RPC `public.get_public_page(p_slug)` trả kèm `site_shell` cho trang `'landing'` (tự lọc tab ẩn / trang chưa published, resolve sẵn `target_slug` trong 1 round-trip; `'profile'` giữ `site_shell = null`).
  - Cập nhật [src/types/database.generated.ts](../src/types/database.generated.ts) & [src/features/public/types.ts](../src/features/public/types.ts).
  - Xây dựng module Backend `src/features/site/`: [types.ts](../src/features/site/types.ts), [schemas.ts](../src/features/site/schemas.ts), [queries.ts](../src/features/site/queries.ts), [actions.ts](../src/features/site/actions.ts) (gồm `saveSiteSettingsAction`, CRUD & reorder `site_nav_items`, và `createPageAndLinkNavAction` tạo đồng thời Landing Page mới gắn vào tab).
- **Kết quả kiểm chứng:**
  - `pnpm db:reset` (Local Docker): **14/14 migrations + `seed.sql` + `admin@gocafe.local` pass 100%**.
  - Smoke test DB & RPC: Trigger chặn lồng menu cấp 3 hoạt động chuẩn; Profile trả `site_shell = null`; Landing Page trả đủ `site_shell.settings` & `site_shell.nav_items` kèm `target_slug`.
  - `pnpm typecheck`: **0 errors** | `pnpm lint`: **0 errors, 0 warnings mới** | `vitest` (Node 24): **51/51 tests passed**.
- **Bước tiếp theo (sau nghiệm thu Chặng 2A):** Chặng 2B — Admin UI `/admin/site` & Public `LandingShell` (Navbar dính 2 cấp + Drawer Mobile + Footer 3 cột + Nút nổi Zalo/Gọi).

### [Phase 2 — Chặng 2B: Admin UI `/admin/site` & Public `LandingShell`] — 2026-11-23 15:27 (+07:00) — Hoàn thành Phase 2 (Chờ nghiệm thu)

- **Mục tiêu:** Xây dựng giao diện tự quản lý Menu 2 cấp / Header / Footer 3 cột / Nút nổi tại `/admin/site` và lớp vỏ `LandingShell` dùng chung cho mọi Landing Page.
- **Thay đổi đã thực hiện:**
  - [src/components/admin/admin-nav.tsx](../src/components/admin/admin-nav.tsx): Thêm mục **Cấu hình Website (`/admin/site`)** vào Admin Sidebar.
  - [src/app/admin/(dashboard)/site/page.tsx](<../src/app/admin/(dashboard)/site/page.tsx>) & [src/features/site/components/site-config-client.tsx](../src/features/site/components/site-config-client.tsx): Giao diện 3 tab (_Thanh Menu 2 cấp_, _Header & Nút nổi_, _Footer 3 cột_) hỗ trợ thêm tab cha/con, đổi thứ tự, ẩn/hiện, xóa, và tạo nhanh Landing Page mới gắn thẳng vào tab.
  - [src/features/renderer/landing-shell.tsx](../src/features/renderer/landing-shell.tsx): Navbar dính đầu trang + Dropdown 2 cấp (Desktop) + Drawer trượt (Mobile) + Footer 3 cột + Cụm nút nổi Gọi điện (dùng lại `PhoneActionButton`) & Nhắn Zalo.
  - [src/features/pages/types.ts](../src/features/pages/types.ts), [schemas.ts](../src/features/pages/schemas.ts), [seo-editor.tsx](../src/features/pages/components/editor/seo-editor.tsx), [page-editor.tsx](../src/features/pages/components/editor/page-editor.tsx), [public-page-view.tsx](../src/features/public/components/public-page-view.tsx): Bổ sung công tắc bật/tắt Site Shell riêng trên từng Landing Page (`seo.showSiteShell`).
- **Kết quả kiểm chứng:**
  - `pnpm typecheck`: **0 errors** | `pnpm lint`: **0 errors, 0 warnings mới** | `vitest` (Node 24): **51/51 tests passed**.
- **Bước tiếp theo (sau nghiệm thu Phase 2):** Sang **Phase 3 — Bộ 7 Section Landing Page & 4 Template dựng sẵn Gờ Café**.

### [Phase 3 — Chặng 3A: Bộ 7 Section Landing Page] — 2026-11-23 15:52 (+07:00) — Chờ nghiệm thu

- **Mục tiêu:** Hoàn thiện toàn bộ 7 Section Landing Page (`hero_section`, `toc_bar`, `stats_strip`, `split_content`, `info_cards`, `pricing_table`, `product_grid`) kèm `anchorId` chung, Zod validation, Renderer chuẩn _Gờ Minimal Luxury_, Form Editor và Block Picker.
- **Thay đổi đã thực hiện:**
  - [src/features/pages/types.ts](../src/features/pages/types.ts) & [src/features/renderer/blocks/payload-schemas.ts](../src/features/renderer/blocks/payload-schemas.ts): Bổ sung 6 `BlockType` mới, 6 interface payload và Zod schemas tương ứng.
  - [src/features/renderer/blocks/landing-blocks.tsx](../src/features/renderer/blocks/landing-blocks.tsx): Xây dựng 6 component render (`TocBarBlock`, `StatsStripBlock`, `SplitContentBlock`, `InfoCardsBlock`, `PricingTableBlock`, `ProductGridBlock`) hỗ trợ `@container` responsive, lọc danh mục sản phẩm, bảng giá cuộn ngang trên Mobile kèm highlight bán chạy.
  - [src/features/renderer/blocks/registry.tsx](../src/features/renderer/blocks/registry.tsx): Đăng ký 6 khối mới với `scopes: ["landing"]` và dữ liệu mẫu Gờ Café.
  - [src/features/pages/components/editor/landing-block-editors.tsx](../src/features/pages/components/editor/landing-block-editors.tsx), [block-item-editor.tsx](../src/features/pages/components/editor/block-item-editor.tsx), [block-picker-modal.tsx](../src/features/pages/components/editor/block-picker-modal.tsx): Xây dựng 6 form editor trực quan, thêm `anchorId` cho cả 7 section và nhóm "Section Landing Page" trong Block Picker.
- **Kết quả kiểm chứng:**
  - `pnpm typecheck`: **0 errors** | `pnpm lint`: **0 errors, 0 warnings mới** | `vitest` (Node 24): **51/51 tests passed**.
- **Bước tiếp theo (sau nghiệm thu Chặng 3A):** Chặng 3B — Bộ 4 Template dựng sẵn Gờ Café trong Wizard (_Trang chủ_, _Cẩm nang Nhượng quyền_, _Xưởng rang / Báo giá sỉ 20kg/10kg/5kg_, _Trang trống_) + unit tests cho 7 section mới.

### [Phase 3 — Chặng 3B: Bộ 4 Template Gờ Café & Unit Tests] — 2026-11-23 16:04 (+07:00) — Hoàn thành Phase 3 (Chờ nghiệm thu)

- **Mục tiêu:** Xây dựng 4 mẫu dựng sẵn (Template) cho Landing Page trong Wizard tạo trang + bổ sung unit test cho 7 Section mới và nâng cấp mô phỏng Navbar/Footer trực tiếp trong LivePreview kèm cấu hình Font/Size/Color cho Navbar.
- **Thay đổi đã thực hiện:**
  - [src/features/pages/landing-templates.ts](../src/features/pages/landing-templates.ts): Định nghĩa 4 mẫu dựng sẵn chuẩn _Gờ Minimal Luxury_: **Trang chủ thương hiệu Gờ Café** (5 section), **Cẩm nang Nhượng quyền** (6 section gồm `toc_bar`, `info_cards` card/steps, `accordion`), **Xưởng rang / Báo giá sỉ** (5 section gồm `stats_strip`, `pricing_table` 20KG/10KG/5KG), và **Trang trống**.
  - [src/features/pages/schemas.ts](../src/features/pages/schemas.ts), [actions.ts](../src/features/pages/actions.ts), [create-page-modal.tsx](../src/features/pages/components/create-page-modal.tsx): Gắn chọn Template vào Bước 2 của Wizard tạo Landing Page và tự nạp toàn bộ khối mẫu vào bản nháp ngay khi khởi tạo.
  - Bổ sung nâng cấp theo yêu cầu nghiệm thu: mô phỏng trực tiếp `LandingShell` (Navbar 2 cấp + Footer 3 cột) ngay trong `LivePreview` của Editor, và cho phép cấu hình **Font chữ, Cỡ chữ (11–20px) & 3 màu Navbar** trong `/admin/site`.
  - [tests/unit/landing-blocks.test.tsx](../tests/unit/landing-blocks.test.tsx): Unit test kiểm chứng Zod schema cả 4 Template, tách scope Profile/Landing, render 7 section, chống XSS và lọc danh mục sản phẩm.
- **Kết quả kiểm chứng:**
  - `pnpm typecheck`: **0 errors** | `pnpm lint`: **0 errors, 0 warnings mới** | `vitest` (Node 24): **54/54 tests passed (4 files)**.
- **Bước tiếp theo (sau nghiệm thu Phase 3):** Sang **Phase 4 — Hệ thống 55+ Chi nhánh & Bản đồ tương tác 2 chiều (`store_locator`)**.

### [Phase 4 — Chặng 4A: Database & Backend Hệ thống Chi nhánh] — 2026-11-23 16:48 (+07:00) — Chờ nghiệm thu

- **Mục tiêu:** Tạo bảng `public.branches`, RLS, RPC công khai `get_public_branches` và tầng Backend (`geo-utils` tách tọa độ Google Maps + parser CSV xem trước lỗi, Zod schemas, queries, actions) trước khi xây giao diện `/admin/branches` và bản đồ 2 chiều Leaflet.
- **Thay đổi đã thực hiện:**
  - Tạo migration [supabase/migrations/20261124000003_branches.sql](../supabase/migrations/20261124000003_branches.sql): Bảng `public.branches` (ràng buộc tọa độ `lat/lng`, `is_active`, `archived_at`, 2 partial index), RLS `can_read_workspace`/`can_edit_workspace`, và RPC công khai `public.get_public_branches(p_workspace_id)`.
  - Cập nhật [src/types/database.generated.ts](../src/types/database.generated.ts) & [src/features/public/queries.ts](../src/features/public/queries.ts) (export `getPublicAnonClient`).
  - Xây dựng module `src/features/branches/`: [types.ts](../src/features/branches/types.ts), [geo-utils.ts](../src/features/branches/geo-utils.ts) (`normalizeViSearch`, `extractLatLngFromMapsUrl`, `parseBranchesCsv`), [schemas.ts](../src/features/branches/schemas.ts), [queries.ts](../src/features/branches/queries.ts) (`getBranchesList`, `fetchPublicBranches` có `"use cache"`), [actions.ts](../src/features/branches/actions.ts) (CRUD, ẩn/hiện, xóa mềm, import hàng loạt CSV).
  - Bổ sung [tests/unit/branches-utils.test.ts](../tests/unit/branches-utils.test.ts).
- **Kết quả kiểm chứng:**
  - `pnpm db:reset` (Local Docker): **15/15 migrations + `seed.sql` + `admin@gocafe.local` pass 100%**.
  - Smoke test DB & RPC: Chặn tọa độ rác (`lat = 120`), RLS chặn `anon` đọc trực tiếp, `get_public_branches` chỉ trả chi nhánh `is_active = true`.
  - `pnpm typecheck`: **0 errors** | `pnpm lint`: **0 errors** | `vitest` (Node 24): **57/57 tests passed (5 files)**.
- **Bước tiếp theo (sau nghiệm thu Chặng 4A):** Chặng 4B — Giao diện `/admin/branches` (CRUD + Import CSV xem trước lỗi) + Khối `store_locator` (Leaflet bản đồ tương tác 2 chiều Map ⇄ List + Template 5 _Hệ thống chi nhánh_).

### [Phase 4 — Chặng 4B: Admin `/admin/branches`, Bản đồ 2 chiều Leaflet & Template 5] — 2026-11-23 17:00 (+07:00) — Hoàn thành Phase 4 (Chờ nghiệm thu)

- **Mục tiêu:** Xây dựng trang quản trị chi nhánh `/admin/branches` (CRUD + Import CSV xem trước lỗi + tự tách tọa độ link Maps), khối bản đồ 2 chiều `store_locator` (Leaflet 0đ API key) và Template 5 _Hệ thống chi nhánh_.
- **Thay đổi đã thực hiện:**
  - Cài đặt `leaflet@1.9.4` & `@types/leaflet@1.9.22` (tải động `next/dynamic`, `ssr: false`).
  - [src/components/admin/admin-nav.tsx](../src/components/admin/admin-nav.tsx), [src/app/admin/(dashboard)/branches/page.tsx](<../src/app/admin/(dashboard)/branches/page.tsx>), [src/features/branches/components/branches-client.tsx](../src/features/branches/components/branches-client.tsx): Trang quản lý chi nhánh có tìm kiếm không dấu, lọc Quận, thêm/sửa/ẩn/xóa, dán link Google Maps tự tách `lat, lng`, và modal Import CSV có tải file mẫu & bảng xem trước lỗi.
  - [src/features/renderer/blocks/store-locator-map.tsx](../src/features/renderer/blocks/store-locator-map.tsx) & [store-locator-block.tsx](../src/features/renderer/blocks/store-locator-block.tsx): Bản đồ Carto Voyager + pin tròn đen chữ G vàng đồng, đồng bộ 2 chiều Map ⇄ List (bấm pin cuộn & tô nổi thẻ quán; bấm thẻ quán bản đồ `flyTo` & mở popup), tìm kiếm không dấu, lọc Quận, tab chuyển Bản đồ/Danh sách trên Mobile, nút Chỉ đường & Gọi/Zalo.
  - Nối dữ liệu `branches` vào `PageRenderer`, `PublicPageView`, `src/app/[slug]/page.tsx` (chỉ tải khi trang có khối `store_locator`), `LivePreview`, `StoreLocatorEditor`, `BlockPickerModal` và thêm **Template 5 (_Hệ thống chi nhánh_)** vào [landing-templates.ts](../src/features/pages/landing-templates.ts).
- **Kết quả kiểm chứng:**
  - `pnpm typecheck`: **0 errors** | `pnpm lint`: **0 errors, 0 warnings mới** | `vitest` (Node 24): **57/57 tests passed (5 files)**.
- **Bước tiếp theo (sau nghiệm thu Phase 4):** Sang **Phase 5 — Thu thập & Quản lý Khách hàng tiềm năng (`Leads`) + Chuẩn hóa SEO & Go-live**.

### [Phase 5 — Chặng 5A: Database `leads` & API Chống Spam] — 2026-11-23 17:14 (+07:00) — Chờ nghiệm thu

- **Mục tiêu:** Xây dựng hạ tầng Database `public.leads` bảo mật tuyệt đối (RLS chặn 100% `anon`), tầng Backend `src/features/leads/` và Route Handler `POST /api/leads` chống spam (Honeypot + Rate-Limit `ip_hash` + chuẩn hóa SĐT VN + Telegram alert tuỳ chọn).
- **Thay đổi đã thực hiện:**
  - Tạo migration [supabase/migrations/20261124000004_leads.sql](../supabase/migrations/20261124000004_leads.sql): Bảng `public.leads` (có `status`, `utm_source/medium/campaign`, `ip_hash`, 2 index lọc/rate-limit, trigger kiểm tra `page_id` cùng workspace), RLS chặn toàn bộ `anon` (kể cả `INSERT`), mở `SELECT` cho `can_read_workspace` và `UPDATE/DELETE` cho `can_edit_workspace`.
  - Cập nhật [src/types/database.generated.ts](../src/types/database.generated.ts).
  - Xây dựng module `src/features/leads/`: [types.ts](../src/features/leads/types.ts), [schemas.ts](../src/features/leads/schemas.ts) (`normalizeVnPhone`, `isValidVnPhone`, `submitLeadSchema` kèm honeypot `website`), [queries.ts](../src/features/leads/queries.ts) (`getLeadsList`), [actions.ts](../src/features/leads/actions.ts) (`updateLeadStatusAction`, `deleteLeadAction`).
  - Xây dựng API [src/app/api/leads/route.ts](../src/app/api/leads/route.ts) (`POST /api/leads`): Validate Zod, Honeypot trả 200 im lặng cho bot, tra cứu `pageSlug` → trang published trên server, Rate Limit 5 yêu cầu / 10 phút theo `SHA-256(IP)`, ghi bằng `service_role`, hỗ trợ bắn Telegram Bot không chặn phản hồi qua `LEADS_TELEGRAM_BOT_TOKEN` & `LEADS_TELEGRAM_CHAT_ID`.
  - Bổ sung unit test [tests/unit/leads-schemas.test.ts](../tests/unit/leads-schemas.test.ts).
- **Kết quả kiểm chứng:**
  - `pnpm db:reset` (Local Docker): **16/16 migrations + `seed.sql` + `admin@gocafe.local` pass 100%**.
  - Smoke test RLS trực tiếp trên Local Docker DB: `anon INSERT` bị chặn (`42501`), `anon SELECT` trả `0` dòng, `service_role INSERT` thành công, Admin (`admin@gocafe.local`) `SELECT` & `UPDATE` trạng thái thành công.
  - `pnpm typecheck`: **0 errors** | `pnpm lint`: **0 errors, 0 warnings mới** | `vitest` (Node 24): **60/60 tests passed (6 files)**.
- **Bước tiếp theo (sau nghiệm thu Chặng 5A):** Chặng 5B — Khối công khai `lead_form` (nhúng trực tiếp & tuỳ chọn Popup sau `N` giây) + Giao diện Admin `/admin/leads` (lọc đa tiêu chí, đổi trạng thái, xuất CSV UTF-8 BOM mở đẹp trên Excel) + Kiểm tra SEO & `pnpm build` sẵn sàng Go-live.

### [Phase 5 — Chặng 5B: Khối `lead_form`, Admin `/admin/leads`, SEO & Build Go-live] — 2026-11-23 17:24 (+07:00) — Hoàn thành toàn bộ 5 Phase

- **Mục tiêu:** Hoàn thiện khối công khai `lead_form` (inline + tuỳ chọn tự mở Popup), trang quản trị `/admin/leads` (lọc đa tiêu chí, đổi trạng thái, xuất CSV UTF-8 BOM), kiểm tra chuẩn SEO và chạy Production Build (`pnpm build`) sẵn sàng Go-live.
- **Thay đổi đã thực hiện:**
  - [src/features/renderer/blocks/lead-form-block.tsx](../src/features/renderer/blocks/lead-form-block.tsx): Xây dựng khối `lead_form` chuẩn _Gờ Minimal Luxury_ (hỗ trợ nhúng trực tiếp + tuỳ chọn tự mở Popup sau `popupDelaySec` giây, lưu `sessionStorage` để không gây phiền, trường honeypot ẩn `website`, tự đọc `utm_source/medium/campaign` từ URL và gửi về `POST /api/leads`).
  - Nối `lead_form` và `currentSlug` xuyên suốt [src/features/pages/types.ts](../src/features/pages/types.ts), [src/features/renderer/types.ts](../src/features/renderer/types.ts), [page-renderer.tsx](../src/features/renderer/page-renderer.tsx), [public-page-view.tsx](../src/features/public/components/public-page-view.tsx), [live-preview.tsx](../src/features/pages/components/editor/live-preview.tsx), [payload-schemas.ts](../src/features/renderer/blocks/payload-schemas.ts), [registry.tsx](../src/features/renderer/blocks/registry.tsx), [landing-block-editors.tsx](../src/features/pages/components/editor/landing-block-editors.tsx), [block-item-editor.tsx](../src/features/pages/components/editor/block-item-editor.tsx) và [block-picker-modal.tsx](../src/features/pages/components/editor/block-picker-modal.tsx).
  - [src/components/admin/admin-nav.tsx](../src/components/admin/admin-nav.tsx), [src/app/admin/(dashboard)/leads/page.tsx](<../src/app/admin/(dashboard)/leads/page.tsx>), [src/features/leads/components/leads-client.tsx](../src/features/leads/components/leads-client.tsx): Trang quản trị Khách hàng tiềm năng (`/admin/leads`) có tab đếm theo trạng thái, tìm kiếm không dấu, lọc Form / Trang nguồn / Khoảng ngày, đổi trạng thái nhanh qua `<Select>`, xóa an toàn qua `<ConfirmDialog>`, và xuất file **CSV UTF-8 BOM (`\uFEFF`)** mở chuẩn tiếng Việt trên Excel.
  - Kiểm tra SEO & định tuyến: [sitemap.ts](../src/app/sitemap.ts) tự xuất cả Profile & Landing Page đã xuất bản; [src/app/[slug]/page.tsx](../src/app/[slug]/page.tsx) xuất đủ Open Graph / Twitter Card; mỗi Landing Page có duy nhất 1 thẻ `H1` tại `hero_section`; redirect `308` cho alias hoạt động qua `public-slug-gate.ts`.
- **Kết quả kiểm chứng tổng thể (Node 24):**
  - `pnpm typecheck`: **0 errors**
  - `pnpm lint`: **0 errors, 0 warnings mới**
  - `vitest`: **60/60 tests passed (6 files)**
  - `pnpm build` (Next.js 16.4.5 Turbopack): **Thành công 34/34 routes** (bao gồm `/admin/site`, `/admin/branches`, `/admin/leads`, `/api/leads`, `/[slug]`, `/sitemap.xml`).
- **Danh sách 5 migration mới sẵn sàng áp dụng lên Supabase Cloud (0-downtime, không đụng dữ liệu Profile cũ):**
  1. `20261124000001_landing_pages_foundation.sql`
  2. `20261124000002_site_shell.sql`
  3. `20261124000003_branches.sql`
  4. `20261124000004_leads.sql`
  5. `20261124000005_landing_blocks_p1.sql`

### [Gói Nâng cấp Sau Nghiệm thu — P0 + P1 + P2 & Demo `go-cafe.com`] — 2026-11-24 10:26 (+07:00) — Hoàn thành 100%

- **Mục tiêu:** Hoàn thiện toàn bộ các hạng mục nâng cấp Landing Page (P0, P1, P2), trang Hướng dẫn sử dụng `/admin/guide` cho người mới, và bộ dữ liệu giả lập `go-cafe.com`.
- **Thay đổi đã thực hiện:**
  - **P0:** Nâng cấp `hero_section` (video nền MP4, độ tối lớp phủ, chiều cao, sửa tương phản CTA trên nền tối); nền xen kẽ cho từng section (`Kem nhạt #F8F7F4` / `Đen sang trọng #111111`); chọn **Trang chủ mặc định (`/`)** trong `/admin/site` & `src/app/page.tsx`; công tắc **Chỉ hiện Logo** & hàng **Mạng xã hội** ở Footer; sửa khung cắt ảnh PNG tròn & thẻ sản phẩm `1:1`; đổi bản đồ sang nền Google Maps tiếng Việt + pin logo **Gờ càfê** chính thức.
  - **P1:** Migration [20261124000005_landing_blocks_p1.sql](../supabase/migrations/20261124000005_landing_blocks_p1.sql) bổ sung 3 section mới (`banner_slider`, `testimonials`, `cta_banner`) tại [landing-blocks-p1.tsx](../src/features/renderer/blocks/landing-blocks-p1.tsx); **Lịch sử phiên bản & Khôi phục 1 click** ([revision-history-modal.tsx](../src/features/pages/components/editor/revision-history-modal.tsx)); **Tự động nén ảnh WebP** khi tải lên ([image-compress.ts](../src/lib/image-compress.ts)); trang **Hướng dẫn sử dụng (`/admin/guide`)** ([guide-client.tsx](../src/features/guide/components/guide-client.tsx)).
  - **P2:** **Tracking & Pixel Quảng cáo** (GA4 / Meta Pixel / TikTok Pixel — validate regex chống XSS) tại [tracking-scripts.tsx](../src/features/renderer/tracking-scripts.tsx), tự bắn sự kiện `Lead` khi gửi form thành công; **Báo cáo chuyển đổi Landing Page (Leads)** trong `/admin/reports` ([leads-report-section.tsx](../src/features/reports/components/leads-report-section.tsx)).
  - **Demo `go-cafe.com`:** [scripts/seed-go-cafe-demo.mjs](../scripts/seed-go-cafe-demo.mjs) (`pnpm db:seed-gocafe`).
- **Kết quả kiểm chứng (Node 24):**
  - `pnpm db:reset` + `pnpm db:seed-gocafe`: **17/17 migrations + demo 7 trang + 12 chi nhánh + 3 Leads pass 100%**.
  - `pnpm typecheck`: **0 errors** | `pnpm lint`: **0 errors** | `vitest`: **60/60 tests passed** | `pnpm build`: **35/35 routes thành công**.
