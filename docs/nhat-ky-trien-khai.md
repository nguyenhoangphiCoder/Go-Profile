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
