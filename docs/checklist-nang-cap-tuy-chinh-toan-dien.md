# Checklist Triển khai & Nhật ký Thực hiện: Nâng cấp Hệ thống "Tùy chỉnh Mọi Thứ" (Hyper-Customizable Platform CMS)

> **Dự án:** `gocafe.profile`  
> **Môi trường:** Cô lập 100% trên **Local Docker DB** (`http://127.0.0.1:54321`), ưu tiên tối đa **0-migration** (lưu trong JSONB có Zod schema chặt).  
> **Quy tắc bắt buộc:** Sau mỗi chặng chạy `pnpm typecheck`, `pnpm lint`, `vitest` (và `pnpm build` ở chặng cuối), đánh dấu `[x]`, ghi Execution Log và **dừng chờ nghiệm thu** trước khi sang chặng kế tiếp.

---

## Bảng Tổng quan Tiến độ

| Chặng | Tên giai đoạn | Trạng thái | Ngày hoàn thành |
| :---: | --- | :---: | :---: |
| **C1** | Tùy chỉnh Khối Toàn Diện (Block Design System v3, Anchor ID, Duplicate & Copy/Paste Style) | Hoàn thành (Đã nghiệm thu) | 2026-11-24 |
| **C2** | Tùy chỉnh Nhận diện Website, Nút Nổi Động & White-Label (Favicon, Copyright, Map Pin, Admin Brand) | Hoàn thành (Đã nghiệm thu) | 2026-11-24 |
| **C3** | Tùy chỉnh Form Khách hàng Động (Dynamic Lead Form Builder & Webhook/Telegram riêng theo Tenant) | Hoàn thành (Đã nghiệm thu) | 2026-11-24 |
| **C4** | Nâng cấp Trải nghiệm Thiết kế (Preview 3 màn hình, Undo/Redo, Custom Templates) | Hoàn thành (Chờ nghiệm thu) | 2026-11-24 |

---

## Chặng C1 — Tùy chỉnh Khối Toàn Diện (Block Design System v3 — 0 migration)

### 1.1. Schema, Renderer & Hiệu ứng (`blockStyleSchema`, `BlockFrame`, `renderer.css`)
- [x] Mở rộng `blockStyleSchema` (`src/features/renderer/blocks/payload-schemas.ts`):
  - [x] Nền khối tự do: `bgColor` (màu đơn), `bgGradientFrom` / `bgGradientTo` / `bgGradientDir`, `bgImageUrl` + `bgOverlayOpacity` (`0–90%`).
  - [x] Khung & Bố cục: `maxWidth` (`sm | md | lg | full`), `radius` (`none | md | xl | 2xl | 3xl`), `borderWidth` (`0 | 1 | 2`), `borderColor`, `shadow` (`none | sm | md | lg`).
  - [x] Khoảng đệm độc lập: `paddingTop` & `paddingBottom` (`none | sm | md | lg | xl`) bên cạnh `paddingY` cũ (tương thích ngược 100%).
  - [x] Cỡ chữ & Hiệu ứng: mở rộng `titleFontSize` lên `10–72px`, mở rộng `animation` thành `none | fade-up | fade-in | zoom-in | slide-left`.
  - [x] ID Neo (`anchorId`): chuẩn hóa slug (`^[a-z0-9-]+$`) để menu `#anchorId` cuộn mượt tới đúng khối.
- [x] Cập nhật `BlockFrame` (`src/features/renderer/block-frame.tsx`) & `src/features/renderer/renderer.css`:
  - [x] Render `id={style.anchorId}` kèm `scroll-mt-24` (không bị Sticky Navbar che khi cuộn).
  - [x] Hỗ trợ đầy đủ màu nền, gradient, ảnh nền + lớp phủ mờ, độ rộng, bo góc, viền, đổ bóng và 4 hiệu ứng CSS.

### 1.2. Giao diện Chỉnh sửa Kiểu Khối & Thao tác Nhanh trên Editor
- [x] Nâng cấp panel **Kiểu khối** (`BlockStyleEditor` trong `block-editors-v2.tsx`):
  - [x] Thêm chọn nhanh Nền (Trong suốt / Thẻ nổi / Kem nhạt / Đen sang trọng / **Màu đơn / Gradient 2 màu / Ảnh nền + Overlay**).
  - [x] Thêm thanh chọn Độ rộng, Bo góc, Viền, Đổ bóng, Khoảng đệm Trên/Dưới độc lập, 4 hiệu ứng xuất hiện.
  - [x] Mở rộng Font/Cỡ chữ Tiêu đề lên `72px` cho toàn bộ khối Landing Page và ô nhập **ID Neo (`#...`)**.
- [x] Nâng cấp **Page Editor** (`block-editors-v2.tsx` & `block-item-editor.tsx`):
  - [x] Đã có sẵn nút **Nhân bản khối (Duplicate)** 1 click.
  - [x] Thêm thanh **Sao chép kiểu (Copy Style)**, **Dán kiểu (Paste Style)** và **Đặt lại kiểu** ngay trong panel `Kiểu khối`.

### Kiểm chứng Chặng C1
- [x] Bổ sung unit test `tests/unit/block-style-v3.test.tsx` cho `blockStyleSchema` v3 & `BlockFrame`.
- [x] `pnpm typecheck` (0 lỗi) + `pnpm lint` (0 lỗi, 0 cảnh báo) + `vitest` (**35/35 tests pass**).
- [x] **Check list & Ghi log Chặng C1 — Dừng chờ nghiệm thu.**

---

## Chặng C2 — Tùy chỉnh Nhận diện Website, Nút Nổi Động & White-Label (0 migration)

- [x] **Floating Action Bar động:** Mở rộng `floating_contact` hỗ trợ danh sách nút nổi mở rộng (tối đa 6 nút: Điện thoại, Zalo, Messenger, TikTok, Maps, Link tùy chỉnh), vị trí Trái/Phải, màu từng nút, và bật/tắt nút **Lên đầu trang (Back-to-Top)**.
- [x] **Favicon & Bản quyền riêng:** Cho phép nhập `faviconUrl` (hiển thị trên `Metadata.icons` trang công khai `/` và `/[slug]` theo từng Site Shell), tùy chỉnh `copyrightText` và các link pháp lý cuối trang (`legalLinks`).
- [x] **White-Label Bản đồ & Admin:**
  - [x] Cho phép `store_locator` chọn **Icon Pin bản đồ riêng** (`pinIconUrl`) và chọn kiểu bản đồ (`standard | satellite | hybrid`).
  - [x] Sidebar Admin (`admin/(dashboard)/layout.tsx`) tự động hiển thị tên & logo của Workspace/Site Shell mặc định thay vì hardcode Gờ Cafe cho mọi Tenant.
- [x] Kiểm chứng (`typecheck`, `lint`, `vitest`) & Ghi log Chặng C2 — **Dừng chờ nghiệm thu.**

---

## Chặng C3 — Tùy chỉnh Form Khách hàng Động (Dynamic Lead Form Builder — 0 migration)

- [x] Mở rộng `lead_form` payload: đổi nhãn/placeholder trường mặc định, hỗ trợ thêm tối đa 8 **trường tùy chỉnh (Custom Fields: `text`, `select` dropdown, `checkbox` + `required`)**, tự động gộp dữ liệu trường mở rộng gọn gàng vào `note` để hiển thị tại `/admin/leads` và CSV export.
- [x] Hỗ trợ hành động sau khi gửi form: thông điệp cảm ơn tùy chỉnh hoặc **tự động chuyển hướng URL** (`redirectUrl` an toàn).
- [x] Cấu hình **Telegram Bot Token / Chat ID** & **Webhook URL** riêng theo từng Workspace/Site Shell trong `/admin/site` (kèm chặn SSRF cho Webhook và tự động loại bỏ `leadNotifications` khỏi payload công khai tại `fetchPublicPage` để tuyệt đối không lộ token).
- [x] Kiểm chứng (`typecheck`, `lint`, `vitest`) & Ghi log Chặng C3 — **Dừng chờ nghiệm thu.**

---

## Chặng C4 — Nâng cấp Trải nghiệm Thiết kế (Editor Power-Ups)

- [x] Chế độ **Xem trước 3 khung màn hình** ngay trong Page Editor: Mobile / Tablet / Desktop (đã tích hợp sẵn và hoạt động đồng bộ).
- [x] Hỗ trợ **Undo / Redo** (`Ctrl+Z` / `Ctrl+Y` + nút trên thanh công cụ `useUndoHistory`) trong phiên chỉnh sửa bản nháp.
- [x] Hỗ trợ **Lưu trang hiện tại thành Mẫu riêng (Custom Templates)** tại `custom-templates-modal.tsx`: lưu toàn bộ khối + theme vào kho mẫu riêng, áp dụng 1 click (**Chèn thêm khối** hoặc **Thay thế toàn bộ**), hỗ trợ **Xuất / Nhập file JSON** để chia sẻ giữa các thiết bị/nhân sự.
- [x] Kiểm chứng tổng thể (`pnpm typecheck` 0 lỗi, `pnpm lint` 0 lỗi 0 cảnh báo, toàn bộ `vitest` **39/39 file — 329/329 tests PASS**, `pnpm build` **35/35 routes**) & Ghi log Chặng C4.

---

## Nhật ký Thực hiện (Execution Log)

### 2026-11-24 — Hoàn thành Chặng C1 (Block Design System v3 — 0 migration)
- **Files cập nhật / tạo mới:**
  - `src/features/pages/types.ts`, `src/features/renderer/blocks/payload-schemas.ts`
  - `src/features/renderer/block-frame.tsx`, `src/features/renderer/renderer.css`
  - `src/features/pages/components/editor/block-editors-v2.tsx`
  - `tests/unit/block-style-v3.test.tsx`
- **Kết quả kiểm chứng (Node 24):**
  - `pnpm typecheck`: **0 lỗi** · `pnpm lint`: **0 lỗi, 0 cảnh báo**.
  - `vitest` (`block-style-v3.test.tsx`, `blocks-v2.test.tsx`, `block-editors-v2.test.tsx`): **35/35 tests pass**.
- **Trạng thái:** Đã hoàn tất Chặng C1, dừng chờ nghiệm thu trước khi triển khai Chặng C2.

### 2026-11-24 — Hoàn thành Chặng C2 (Floating Action Bar động, Favicon/Copyright & White-Label Admin/Bản đồ)
- **Files cập nhật:**
  - `src/features/site/types.ts`, `src/features/site/schemas.ts`, `src/features/site/components/site-config-client.tsx`
  - `src/features/renderer/landing-shell.tsx`, `src/app/page.tsx`, `src/app/[slug]/page.tsx`
  - `src/app/admin/(dashboard)/layout.tsx`
  - `src/features/pages/types.ts`, `src/features/renderer/blocks/payload-schemas.ts`, `src/features/renderer/blocks/store-locator-map.tsx`, `src/features/renderer/blocks/store-locator-block.tsx`, `src/features/pages/components/editor/landing-block-editors.tsx`
- **Kết quả kiểm chứng (Node 24):**
  - `pnpm typecheck`: **0 lỗi** · `pnpm lint`: **0 lỗi, 0 cảnh báo**.
  - `vitest` (`block-style-v3.test.tsx`, `blocks-v2.test.tsx`): **26/26 tests pass**.
- **Trạng thái:** Đã hoàn tất Chặng C2, dừng chờ nghiệm thu trước khi triển khai Chặng C3.

### 2026-11-24 — Hoàn thành Chặng C3 (Dynamic Lead Form Builder & Telegram/Webhook riêng theo Tenant)
- **Files cập nhật:**
  - `src/features/pages/types.ts`, `src/features/renderer/blocks/payload-schemas.ts`
  - `src/features/pages/components/editor/landing-block-editors.tsx`, `src/features/renderer/blocks/lead-form-block.tsx`
  - `src/features/site/types.ts`, `src/features/site/schemas.ts`, `src/features/site/components/site-config-client.tsx`
  - `src/app/api/leads/route.ts`, `src/features/public/queries.ts` (strip `leadNotifications` khỏi payload công khai)
- **Kết quả kiểm chứng (Node 24):**
  - `pnpm typecheck`: **0 lỗi** · `pnpm lint`: **0 lỗi, 0 cảnh báo**.
  - `vitest` (`leads-schemas.test.ts`, `block-style-v3.test.tsx`, `blocks-v2.test.tsx`): **29/29 tests pass**.
- **Trạng thái:** Đã hoàn tất Chặng C3, dừng chờ nghiệm thu trước khi triển khai Chặng C4.

### 2026-11-24 — Hoàn thành Chặng C4 (Custom Templates Modal + Kiểm chứng tổng thể 4/4 Chặng)
- **Files tạo mới / cập nhật:**
  - `src/features/pages/components/editor/custom-templates-modal.tsx`
  - `src/features/pages/components/editor/page-editor.tsx` (tích hợp nút **"Mẫu"** + `<CustomTemplatesModal />` cùng Preview 3 màn hình & Undo/Redo có sẵn)
- **Kết quả kiểm chứng tổng thể (Local Docker DB + Node 24):**
  - `pnpm typecheck`: **0 lỗi**.
  - `pnpm lint`: **0 lỗi, 0 cảnh báo**.
  - `pnpm exec vitest run`: **39/39 test files — 329/329 tests PASS (100%)**.
  - `pnpm build`: **35/35 routes** build production thành công (Next.js 16.4.5 Turbopack).
- **Trạng thái:** Hoàn tất trọn bộ **4/4 Chặng (C1 → C4)** nâng cấp hệ thống "Tùy chỉnh mọi thứ" (0-migration, chạy ổn định 100% trên Local Docker DB).
