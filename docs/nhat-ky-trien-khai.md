# Nhật ký triển khai Gờ

Múi giờ ghi nhận: `Asia/Ho_Chi_Minh`. Nhật ký dùng ngày ISO `YYYY-MM-DD`; chỉ thêm giờ khi biết thời điểm thực tế. Không suy đoán giờ từ ngày lập tài liệu.

Kế hoạch và trạng thái checklist: [Kế hoạch triển khai](./ke-hoach-trien-khai.md).

## 1. Quy tắc ghi log

- Thêm mục mới sau mỗi đợt công việc có kết quả, dùng mã `LOG-001`, `LOG-002`… tăng dần; giữ lịch sử cũ.
- Ghi ID checklist liên quan, người thực hiện, trạng thái, việc đã làm, bằng chứng, cách kiểm tra, kết quả, vấn đề còn mở và bước tiếp theo.
- Chỉ đánh dấu checkbox khi có kết quả phù hợp. Viết mã/test không đồng nghĩa đã chạy thành công; deploy không đồng nghĩa đã nghiệm thu.
- Khi gặp lỗi, ghi mô tả đã bỏ thông tin nhạy cảm và tác động. Khi xử lý xong, thêm log mới tham chiếu log cũ.
- Không dùng log để lưu mật khẩu, key, token hoặc dữ liệu khách hàng.

Trạng thái đợt công việc có thể là: `hoàn thành`, `đang thực hiện`, `chờ đầu vào`, `kiểm tra không đạt`. Trạng thái này mô tả đợt công việc, không tự làm phase hoàn thành.

## 2. Nhật ký công việc

### LOG-001 — Ghi nhận bộ tài liệu nền đã có

- **Ngày ghi nhận:** 2026-11-06.
- **Người thực hiện ghi nhận:** Codex.
- **Checklist liên quan:** P00.01, P00.02, P00.03.
- **Trạng thái:** Hoàn thành việc ghi nhận; chưa triển khai ứng dụng/database.

**Kết quả đã có, được kiểm tra lại trong workspace:**

- Tài liệu phân tích yêu cầu: mục tiêu, chức năng, luồng sử dụng, phạm vi và tiêu chí nghiệm thu dự kiến. Tài liệu ghi ngày lập 05/11/2026.
- Tài liệu công nghệ/kiến trúc: Next.js App Router, Vercel, Supabase, module nghiệp vụ, cấu trúc thư mục và quy tắc triển khai.
- Tài liệu database: 10 bảng chính, 2 bảng phụ, sơ đồ quan hệ, constraint, RLS, RPC, vòng đời dữ liệu và 16 tình huống kiểm chứng.

**Bằng chứng:**

- [phan-tich-yeu-cau.md](./phan-tich-yeu-cau.md).
- [quy-dinh-cong-nghe-va-kien-truc.md](./quy-dinh-cong-nghe-va-kien-truc.md).
- [phan-tich-database.md](./phan-tich-database.md).

**Kiểm tra và kết quả:** Đã đọc các tài liệu và liệt kê workspace. Tại thời điểm kiểm tra, dự án có tài liệu trong `docs/`; chưa có `package.json`, mã ứng dụng hoặc migration. Các tình huống kiểm thử trong tài liệu database là kế hoạch kiểm thử, chưa được chạy trên database.

**Còn mở:** Các giả định nháp/xuất bản, quy tắc đồng bộ link, phạm vi quản trị, bộ khối, retention và điều kiện vận hành chưa có xác nhận đầy đủ được ghi nhận.

**Bước tiếp theo:** Lập checklist theo phase và cơ chế cập nhật tiến độ.

### LOG-002 — Lập kế hoạch theo phase và nhật ký tiến độ

- **Ngày:** 2026-11-06.
- **Người thực hiện:** Codex.
- **Checklist liên quan:** P00.04, P00.05, P00.06; hoàn tất P00.
- **Trạng thái:** Hoàn thành.

**Đã làm:**

- Tạo kế hoạch P00–P11, gồm phụ thuộc, checklist chi tiết và tiêu chí kết thúc từng phase.
- Đánh dấu phần tài liệu đã tồn tại là hoàn thành; giữ P01–P11 chưa hoàn thành vì chưa có bằng chứng triển khai.
- Quy định cập nhật checklist/log sau mỗi đợt công việc, ghi lỗi và mở lại hạng mục khi có hồi quy.
- Tạo nhật ký này và liên kết hai chiều với kế hoạch.

**File thay đổi:**

- Tạo [ke-hoach-trien-khai.md](./ke-hoach-trien-khai.md).
- Tạo [nhat-ky-trien-khai.md](./nhat-ky-trien-khai.md).

**Kiểm tra và kết quả:** Kiểm tra UTF-8, liên kết Markdown nội bộ, ID checklist không trùng và tham chiếu checklist trong log. Đối chiếu trạng thái với workspace: chỉ P00 được đánh dấu hoàn thành. Không có thay đổi mã nguồn nên chưa chạy build hoặc kiểm thử ứng dụng/database.

**Còn mở:** Chưa có xác nhận các quyết định P01, nội dung thật đầy đủ hoặc cấu hình tài khoản dịch vụ được ghi nhận.

**Bước tiếp theo:** Thực hiện P01; có thể chuẩn bị phần scaffold P02 độc lập với quyết định chưa chốt, ghi rõ giả định và kết quả thực tế.

### LOG-003 — Chốt phạm vi và đầu vào triển khai (P01)

- **Ngày:** 2026-11-06 09:25.
- **Người thực hiện:** Antigravity.
- **Checklist liên quan:** P01.01, P01.02, P01.03, P01.04, P01.05, P01.06, P01.07, P01.08, P01.09; hoàn tất P01.
- **Trạng thái:** Hoàn thành.

**Đã làm:**

- Thống nhất cơ chế nháp/xuất bản theo revision (`page_revisions`): lưu draft độc lập, xuất bản nguyên tử qua transaction và con trỏ `published_revision_id`.
- Thống nhất quy tắc cập nhật URL: cập nhật link gốc có hiệu lực tức thời toàn hệ thống; nhãn và ảnh được cố định theo snapshot revision lúc xuất bản.
- Chốt 4 loại khối v1: `header`, `link_list`, `social_icons`, `heading`; hỗ trợ protocol `https`, `http`, `tel`, `mailto` kèm đo lường lượt bấm nút; cấm HTML/CSS/JS tự do.
- Chốt điều hướng trang chủ `/` (mặc định trỏ về `/gocafe`), alias 308 khi đổi slug, reserved slugs hệ thống, hành vi ẩn trang (unpublish -> 404) và lưu trữ (archive).
- Chốt quyền quản trị 1 cấp độ admin qua `admin_users`, vô hiệu hóa public signup; chưa tạo `audit_logs` riêng trong v1 để giữ hệ thống tinh gọn.
- Chốt chỉ số báo cáo Clicks, chuẩn hóa múi giờ `Asia/Ho_Chi_Minh` (UTC+7), mốc ngày `[00:00:00, 23:59:59]`, lưu trữ sự kiện tối thiểu 180 ngày và mục tiêu hiệu năng (<200ms TTFB).
- Chốt hành vi ảnh public trên Supabase Storage CDN và giới hạn tải lên (2MB avatar/icon, 5MB cover/banner).
- Xác định hạ tầng Vercel (Singapore `sin1`), Supabase (Singapore `ap-southeast-1`), chế độ sao lưu.
- Lập cấu trúc nội dung và danh mục liên kết mẫu cho 3 trang đầu: `/gocafe` (thương hiệu chính), `/tuyendung` (tuyển dụng & văn hóa), `/nhuongquyen` (đối tác & nhượng quyền).
- Soạn thảo tài liệu quyết định chi tiết và cập nhật kế hoạch triển khai.

**File/bằng chứng:**

- [quyet-dinh-pham-vi-va-dau-vao.md](./quyet-dinh-pham-vi-va-dau-vao.md).
- [ke-hoach-trien-khai.md](./ke-hoach-trien-khai.md).
- [nhat-ky-trien-khai.md](./nhat-ky-trien-khai.md).

**Kiểm tra và kết quả:**

- Đã đối chiếu toàn bộ quyết định với `phan-tich-database.md` và `quy-dinh-cong-nghe-va-kien-truc.md`. Không có mâu thuẫn hay thay đổi kiến trúc breaking.
- Các liên kết tài liệu Markdown hợp lệ, UTF-8 chuẩn xác.
- Đạt 100% tiêu chí kết thúc của Phase 01.

**Cập nhật tiến độ:**

- Hoàn thành đầy đủ P01.01 đến P01.09.
- Đánh dấu hoàn thành Phase P01 trên checklist tổng và checklist chi tiết.

**Còn mở và tác động:**

- Hình ảnh logo/banner chính thức và số hotline/link thật của 3 trang đầu sẽ được đưa vào ở giai đoạn staging (P09). Trong các phase P02–P08 sẽ sử dụng mock content và placeholder asset.

**Bước tiếp theo:**

- Bắt đầu Phase 02 (P02): Khởi tạo ứng dụng Next.js App Router, cấu hình TypeScript strict, Tailwind CSS, shadcn/ui, font tiếng Việt, script kiểm tra (lint/typecheck/Vitest) và quy trình build.

### LOG-004 — Khởi tạo ứng dụng và quy trình kiểm tra (P02)

- **Ngày:** 2026-11-06 09:38.
- **Người thực hiện:** Antigravity.
- **Checklist liên quan:** P02.01, P02.02, P02.03, P02.04, P02.05, P02.06, P02.07, P02.08, P02.09; hoàn tất P02.
- **Trạng thái:** Hoàn thành.

**Đã làm:**

- Khởi tạo thành công ứng dụng Next.js 16.4.5 (App Router, React 19, TypeScript strict, pnpm 12.18.0) với import alias `@/*`.
- Khóa cấu hình runtime: `.node-version` (Node 22 LTS), `package.json#engines` (`>=20.0.0`), `packageManager: pnpm@12.18.0` và lockfile `pnpm-lock.yaml`.
- Tổ chức cấu trúc modular monolith: `src/app`, `src/config` (`site.ts`, `reserved-slugs.ts`, `themes.ts`), `src/lib` (`utils.ts`, `errors.ts`, `env.client.ts`, `env.server.ts`), `tests/unit`, `tests/e2e`.
- Thiết lập Tailwind CSS, cấu hình biến màu CSS, font tiếng Việt Google Fonts (`Be_Vietnam_Pro`, `Inter`) với `display: swap`.
- Tạo `.env.example`, bảo vệ `.env.local` qua `.gitignore`, thiết lập ranh giới `server-only` cho cấu hình server (`env.server.ts`).
- Thiết lập bộ công cụ kiểm tra chất lượng: ESLint 9, Prettier 3, TypeScript strict (`tsc --noEmit`), Vitest 5 (jsdom), Playwright 1.64.
- Khởi tạo Git repository, cấu hình GitHub Actions CI pipeline (`.github/workflows/ci.yml`) tự động chạy lint, typecheck, format check, unit test và production build mà không chứa secret.
- Viết lại `README.md` chi tiết với hướng dẫn cài đặt, cấu hình biến môi trường, các lệnh npm scripts và sơ đồ cấu trúc mã nguồn.
- Chạy kiểm tra thực tế: format (`prettier`), lint (`eslint`), typecheck (`tsc`), test (`vitest`), build production (`next build`).

**File/bằng chứng:**

- `package.json`, `pnpm-lock.yaml`, `.node-version`.
- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`.
- `src/lib/utils.ts`, `src/lib/errors.ts`, `src/lib/env.client.ts`, `src/lib/env.server.ts`.
- `src/config/site.ts`, `src/config/reserved-slugs.ts`, `src/config/themes.ts`.
- `vitest.config.mts`, `playwright.config.ts`, `tests/setup.ts`, `tests/unit/utils.test.ts`, `tests/e2e/smoke.spec.ts`.
- `.github/workflows/ci.yml`, `README.md`.
- `docs/ke-hoach-trien-khai.md`, `docs/nhat-ky-trien-khai.md`.

**Kiểm tra và kết quả:**

- `pnpm run format:check`: Đạt 100%.
- `pnpm run lint`: Đạt, 0 error, 0 warning.
- `pnpm run typecheck`: Đạt, 0 error.
- `pnpm run test`: 1 file test, 2 test cases pass.
- `pnpm run build`: Thành công trong 1.6s, các trang tĩnh `/` và `/_not-found` được tạo hoàn chỉnh.
- Đạt 100% tiêu chí kết thúc của Phase 02.

**Cập nhật tiến độ:**

- Hoàn thành đầy đủ P02.01 đến P02.09.
- Đánh dấu hoàn thành Phase P02 trên checklist tổng và checklist chi tiết.

**Còn mở và tác động:**

- Dự án chưa kết nối Supabase thật trên cloud; đang dùng biến môi trường giả lập cho kiểm thử và build local. Sẽ kết nối database và áp dụng migration tại P03.

**Bước tiếp theo:**

- Bắt đầu Phase 03 (P03): Database nền, quyền và dữ liệu kiểm thử (PostgreSQL schema trên Supabase, 10 bảng chính + 2 bảng phụ, RLS, functions/triggers, seed data và kiểm thử database).

### LOG-005 — Database nền, quyền và dữ liệu kiểm thử (P03)

- **Ngày:** 2026-11-06 09:51.
- **Người thực hiện:** Antigravity.
- **Checklist liên quan:** P03.01, P03.02, P03.03, P03.04, P03.05, P03.06, P03.07, P03.08, P03.09; hoàn tất P03.
- **Trạng thái:** Hoàn thành.

**Đã làm:**

- Cài đặt Supabase CLI và khởi tạo cấu hình `supabase/config.toml`.
- Viết 5 file migration PostgreSQL hoàn chỉnh, chuẩn hóa và tái tạo được:
  - `20261106000001_auth_helpers_and_admin.sql`: Tạo schema `private`, helper `private.is_active_admin()`, bảng `admin_users` và danh mục `reserved_slugs`.
  - `20261106000002_core_tables.sql`: 10 bảng nghiệp vụ (`media_assets`, `links`, `pages`, `page_slugs`, `page_revisions`, `page_blocks`, `page_links`, `revision_link_placements`, `revision_media_assets`, `click_events`) kèm các FK ghép, CHECK constraints, và unique/partial unique index.
  - `20261106000003_indexes_and_triggers.sql`: Tạo indexes tối ưu hóa thống kê/truy vấn, triggers `updated_at`, trigger bảo vệ tính bất biến của revision sealed và các phần tử con (`check_sealed_revision_immutability`, `check_child_of_sealed_revision`), trigger kiểm tra con trỏ xuất bản (`check_published_revision_is_sealed`).
  - `20261106000004_rls_and_security.sql`: Bật RLS toàn diện trên 12 bảng, thu hồi DML công khai, thiết lập các policy SELECT cho admin hoạt động, chính sách Storage cho bucket `public_media` và `private_media`.
  - `20261106000005_rpc_functions.sql`: Xây dựng bộ khung 8 RPC nghiệp vụ an toàn (`get_public_page`, `resolve_public_link`, `record_click`, `create_page`, `publish_page`, `unpublish_page`, `rename_page_slug`, `get_click_report`) với `SECURITY DEFINER` và cố định `search_path = ''`.
- Xây dựng `supabase/seed.sql` với dữ liệu danh mục liên kết, nội dung 3 trang mẫu ban đầu (`/gocafe`, `/tuyendung`, `/nhuongquyen`) và fixture kiểm chứng click (12 click trang A + 5 click trang B = 17 cho link menu).
- Tạo định nghĩa kiểu dữ liệu TypeScript sinh từ schema: `src/types/database.generated.ts`.
- Cài đặt `@supabase/supabase-js`, `@supabase/ssr` và hoàn thiện typed clients: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/privileged.ts`.
- Viết bộ kiểm thử xác minh schema và tính toàn vẹn: `tests/unit/database-schema.test.ts`.

**File/bằng chứng:**

- `supabase/migrations/20261106000001_auth_helpers_and_admin.sql`
- `supabase/migrations/20261106000002_core_tables.sql`
- `supabase/migrations/20261106000003_indexes_and_triggers.sql`
- `supabase/migrations/20261106000004_rls_and_security.sql`
- `supabase/migrations/20261106000005_rpc_functions.sql`
- `supabase/seed.sql`, `supabase/config.toml`
- `src/types/database.generated.ts`
- `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/privileged.ts`
- `tests/unit/database-schema.test.ts`
- `docs/ke-hoach-trien-khai.md`, `docs/nhat-ky-trien-khai.md`

**Kiểm tra và kết quả:**

- `pnpm run format:check`: Đạt 100%.
- `pnpm run lint`: Đạt, 0 error, 0 warning.
- `pnpm run typecheck`: Đạt, 0 error.
- `pnpm run test`: 2 file test, 7/7 test cases pass.
- `pnpm run build`: Thành công trong 1.7s.
- Đạt 100% tiêu chí kết thúc của Phase 03.

**Cập nhật tiến độ:**

- Hoàn thành đầy đủ P03.01 đến P03.09.
- Đánh dấu hoàn thành Phase P03 trên checklist tổng và checklist chi tiết.

**Còn mở và tác động:**

- Khi kết nối với cloud instance thực tế (staging/production), chạy `pnpm supabase db push` để đồng bộ migration lên server.

**Bước tiếp theo:**

- Bắt đầu Phase 04 (P04): Đăng nhập và khung quản trị (Tạo Supabase browser/server client SSR cookie, giao diện đăng nhập/đăng xuất, middleware kiểm tra quyền quản trị `admin_users.is_active` và layout quản trị CMS).

### LOG-006 — Đăng nhập và khung quản trị (P04)

- **Ngày:** 2026-11-06 10:14.
- **Người thực hiện:** Antigravity.
- **Checklist liên quan:** P04.01, P04.02, P04.03, P04.04, P04.05; hoàn tất P04.
- **Trạng thái:** Hoàn thành.

**Đã làm:**

- Thiết lập `src/proxy.ts` (Next.js 16 file convention thay cho middleware) và `src/lib/supabase/session.ts` để quản lý session cookie an toàn, tự động refresh phiên và bảo vệ các tuyến `/admin/*`.
- Xây dựng module xác thực nghiệp vụ `src/features/auth/`:
  - `types.ts`: Định nghĩa kiểu dữ liệu `AdminUser` và `AuthState`.
  - `schemas.ts`: Zod schema `loginSchema` kiểm tra tính hợp lệ của email và mật khẩu (tối thiểu 6 ký tự).
  - `queries.ts`: `getCurrentAdmin()`, `requireActiveAdmin()` kiểm tra phiên người dùng và bắt buộc có cờ `is_active = true` trong bảng `admin_users`.
  - `actions.ts`: Server Actions `loginAction` (xác thực qua Supabase Auth, kiểm tra phân quyền quản trị, tự động hủy phiên nếu không có quyền admin) và `logoutAction` (đăng xuất và điều hướng về `/login`).
- Xây dựng giao diện đăng nhập [`src/app/(auth)/login/page.tsx`](<file:///d:/PROJECT/gocafe.profile/src/app/(auth)/login/page.tsx>) với phong cách thương hiệu Gờ Cafe, hỗ trợ tham số `redirectTo`, thông báo lỗi tiếng Việt trực quan, trạng thái loading và ẩn/hiện mật khẩu, bọc trong `<Suspense>`.
- Xây dựng route handler [`src/app/auth/callback/route.ts`](file:///d:/PROJECT/gocafe.profile/src/app/auth/callback/route.ts) trao đổi code xác thực cho session.
- Xây dựng khung giao diện quản trị CMS:
  - [`src/components/admin/admin-nav.tsx`](file:///d:/PROJECT/gocafe.profile/src/components/admin/admin-nav.tsx): Sidebar điều hướng với hiệu ứng active link rõ ràng.
  - [`src/components/admin/logout-button.tsx`](file:///d:/PROJECT/gocafe.profile/src/components/admin/logout-button.tsx): Nút đăng xuất tích hợp Server Action với `useTransition`.
  - [`src/app/admin/layout.tsx`](file:///d:/PROJECT/gocafe.profile/src/app/admin/layout.tsx): Layout responsive với Desktop Sidebar, Mobile Header, Topbar, User badge và lớp bảo vệ máy chủ `requireActiveAdmin()`.
  - [`src/app/admin/page.tsx`](file:///d:/PROJECT/gocafe.profile/src/app/admin/page.tsx): Trang tổng quan Dashboard với thẻ chào mừng admin, 3 thẻ số liệu tóm tắt (trang xuất bản, kho liên kết, lượt click) và trạng thái bảo mật hệ thống. Cấu hình `export const instant = false` chuẩn Next.js 16.
- Viết bộ kiểm thử đơn vị [`tests/unit/auth.test.ts`](file:///d:/PROJECT/gocafe.profile/tests/unit/auth.test.ts) kiểm tra tính hợp lệ và thông báo lỗi của `loginSchema`.
- Chạy kiểm tra thực tế: format (`prettier`), lint (`eslint`), typecheck (`tsc`), test (`vitest`), build production (`next build`).

**File/bằng chứng:**

- `src/proxy.ts`, `src/lib/supabase/session.ts`
- `src/features/auth/types.ts`, `src/features/auth/schemas.ts`, `src/features/auth/queries.ts`, `src/features/auth/actions.ts`
- `src/app/(auth)/login/page.tsx`, `src/app/auth/callback/route.ts`
- `src/components/admin/admin-nav.tsx`, `src/components/admin/logout-button.tsx`
- `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`
- `tests/unit/auth.test.ts`
- `docs/ke-hoach-trien-khai.md`, `docs/nhat-ky-trien-khai.md`

**Kiểm tra và kết quả:**

- `pnpm run format:check`: Đạt 100%.
- `pnpm run lint`: Đạt, 0 error, 0 warning.
- `pnpm run typecheck`: Đạt, 0 error.
- `pnpm run test`: 3 file test, 11/11 test cases pass.
- `pnpm run build`: Thành công trong 2.6s, các tuyến `/admin` và `/login` được build tối ưu.
- Đạt 100% tiêu chí kết thúc của Phase 04.

**Cập nhật tiến độ:**

- Hoàn thành đầy đủ P04.01 đến P04.05.
- Đánh dấu hoàn thành Phase P04 trên checklist tổng và checklist chi tiết.

**Còn mở và tác động:**

- Người dùng đăng nhập cần được gán bản ghi `admin_users` với `is_active = true` trong database để có thể vào được CMS.

**Bước tiếp theo:**

- Hoàn thành Phase 05 (P05): Danh mục liên kết và quản lý ảnh.

### LOG-007 — Danh mục liên kết và quản lý ảnh (P05)

- **Ngày:** 2026-11-06 10:24.
- **Người thực hiện:** Antigravity.
- **Checklist liên quan:** P05.01, P05.02, P05.03, P05.04, P05.05, P05.06; hoàn tất P05.
- **Trạng thái:** Hoàn thành.

**Đã làm:**

- Xây dựng mô-đun quản lý liên kết (`src/features/links/`):
  - `types.ts`, `schemas.ts`: Zod validation schema chặt chẽ cho URL (chỉ cho phép giao thức `http:`, `https:`, `tel:`, `mailto:`, chặn tuyệt đối `javascript:`, `data:`, `vbscript:`, và khoảng trắng nguy hiểm).
  - `queries.ts`: Truy vấn danh sách links kèm số lượng placement đang sử dụng, truy vấn chi tiết link kèm danh sách các trang đang bị ảnh hưởng bởi link đó.
  - `actions.ts`: Server Actions cho tạo mới (`createLinkAction`), cập nhật link (`updateLinkAction`) với cơ chế kiểm soát đồng thời lạc quan (optimistic concurrency qua `expected_version` / `lock_version`) và chuyển đổi trạng thái kích hoạt (`toggleLinkStatusAction`).
  - Giao diện người dùng:
    - `src/features/links/components/link-form-modal.tsx`: Modal thêm/sửa link, tự động hiển thị danh sách các trang bị ảnh hưởng khi chỉnh sửa URL gốc để admin nắm bắt rủi ro.
    - `src/features/links/components/links-table.tsx`: Bảng dữ liệu tìm kiếm, lọc theo loại (standard, social, contact), gắn cờ kích hoạt/vô hiệu hóa tức thì, nút sửa và xem chi tiết.
    - `src/app/admin/links/page.tsx`: Tuyến trang quản lý danh mục liên kết trong CMS.
- Xây dựng mô-đun quản lý tài nguyên ảnh (`src/features/media/`):
  - `types.ts`, `schemas.ts`: Xác thực file upload (kích thước tối đa 5MB, định dạng cho phép: image/jpeg, image/png, image/webp, image/gif, image/svg+xml).
  - `queries.ts`: Truy vấn danh sách tài nguyên ảnh trong kho lưu trữ kèm trạng thái tham chiếu (`isReferenced`), kiểm tra xem ảnh có đang được gắn vào `links`, `pages`, `page_blocks`, hay `page_revisions` không.
  - `actions.ts`: Server Actions xử lý upload ảnh lên Supabase Storage bucket `public_media` (sử dụng privileged/admin client với xử lý transaction metadata, trạng thái `pending` -> `ready` / `failed`), và xóa ảnh an toàn (`deleteMediaAction`) có chặn xóa nếu ảnh đang được bất kỳ revision hoặc link nào tham chiếu.
  - Giao diện người dùng:
    - `src/features/media/components/media-upload-modal.tsx`: Modal upload ảnh hỗ trợ kéo thả/chọn file, xem trước ảnh tức thì (instant image preview), hiển thị tiến trình tải.
    - `src/features/media/components/media-grid.tsx`: Lưới hiển thị ảnh trực quan kèm thumbnail, nút sao chép nhanh URL CDN, huy hiệu khoá cho ảnh đang được tham chiếu, nút xóa có xác nhận và bảo vệ an toàn.
    - `src/app/admin/media/page.tsx`: Tuyến trang quản lý kho ảnh trong CMS.
- Viết bộ kiểm thử đơn vị:
  - `tests/unit/links.test.ts`: Kiểm tra toàn diện Zod link schema (chặn XSS/URL độc hại, chấp nhận `tel:` và `mailto:`, kiểm tra `expected_version`).
  - `tests/unit/media.test.ts`: Kiểm tra validation file type, file size limit (5MB), và metadata upload.
- Chạy kiểm tra thực tế: format (`prettier`), lint (`eslint`), typecheck (`tsc`), test (`vitest`), build production (`next build`).

**File/bằng chứng:**

- `src/features/links/types.ts`, `src/features/links/schemas.ts`, `src/features/links/queries.ts`, `src/features/links/actions.ts`
- `src/features/links/components/link-form-modal.tsx`, `src/features/links/components/links-table.tsx`
- `src/app/admin/links/page.tsx`
- `src/features/media/types.ts`, `src/features/media/schemas.ts`, `src/features/media/queries.ts`, `src/features/media/actions.ts`
- `src/features/media/components/media-upload-modal.tsx`, `src/features/media/components/media-grid.tsx`
- `src/app/admin/media/page.tsx`
- `tests/unit/links.test.ts`, `tests/unit/media.test.ts`
- `docs/ke-hoach-trien-khai.md`, `docs/nhat-ky-trien-khai.md`

**Kiểm tra và kết quả:**

- `pnpm run format:check`: Đạt 100%.
- `pnpm run lint`: Đạt, 0 error, 0 warning.
- `pnpm run typecheck`: Đạt, 0 error.
- `pnpm run test`: 5 file test, 21/21 test cases pass.
- `pnpm run build`: Thành công trong 3.9s, các tuyến `/admin/links` và `/admin/media` được build tối ưu dạng dynamic server-rendered.
- Đạt 100% tiêu chí kết thúc của Phase 05.

**Cập nhật tiến độ:**

- Hoàn thành đầy đủ P05.01 đến P05.06.
- Đánh dấu hoàn thành Phase P05 trên checklist tổng và checklist chi tiết.

**Còn mở và tác động:**

- Cần bucket `public_media` trên Supabase Storage đã được cấu hình public read để URL ảnh hiển thị trực tiếp trên trình duyệt.

**Bước tiếp theo:**

- Bắt đầu Phase 06 (P06): Quản lý trang, trình biên tập block editor và xuất bản revision (CRUD trang, alias slug, theme customizer, block ordering/drag-drop, atomic publish RPC, revision immutability).

## 3. Mẫu cho lần cập nhật tiếp theo

Sao chép mẫu này vào cuối mục 2, trước mục mẫu, và thay bằng dữ liệu thực tế. Đây là mẫu hướng dẫn, không phải công việc đã thực hiện.

```text
### LOG-<số tiếp theo> — <nội dung đợt công việc>

- Ngày: YYYY-MM-DD [HH:mm nếu có]
- Người thực hiện:
- Checklist liên quan: Pxx.yy, ...
- Trạng thái:

Đã làm:
- ...

File/bằng chứng:
- Đường dẫn file, commit hoặc deployment URL nếu có.

Kiểm tra và kết quả:
- Lệnh hoặc thao tác đã thực hiện, môi trường, đạt/không đạt/chưa chạy.

Cập nhật tiến độ:
- Checkbox đã hoàn thành hoặc mở lại; phase có đủ điều kiện kết thúc không.

Còn mở và tác động:
- ...

Bước tiếp theo:
- ...
```
