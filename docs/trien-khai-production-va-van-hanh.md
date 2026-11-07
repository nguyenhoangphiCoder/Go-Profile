# Sổ tay Triển khai Production và Xác minh Vận hành (Phase 10)

Ngày cập nhật: 07/11/2026 — Múi giờ `Asia/Ho_Chi_Minh`.  
Trạng thái: Đã thiết lập cấu hình, quy trình vận hành và kiểm thử sẵn sàng Production (Production Readiness).

---

## 1. Cấu hình Hạ tầng Production (P10.01)

### 1.1. Vercel Production

- **Framework:** Next.js 16 App Router (Node.js Runtime `>= 20.0.0`, `pnpm@12.18.0`).
- **Khu vực (Function Region):** `sin1` (Singapore) — được cố định trong [`vercel.json`](../vercel.json) để tối ưu độ trễ cho người dùng tại Việt Nam.
- **Bảo mật HTTP Headers (`vercel.json`):**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - Tuyến `/r/*` và `/admin/*` luôn có `Cache-Control: no-store` và `X-Robots-Tag: noindex, nofollow`.

### 1.2. Supabase Production

- **Khu vực (Database & Storage Region):** `ap-southeast-1` (Singapore) — đặt cùng khu vực với Vercel `sin1` để giảm thiểu độ trễ truy vấn DB (< 15ms nội mạng khu vực).
- **Tách biệt môi trường:**
  - `local`: Supabase CLI / Development instance.
  - `preview / staging`: Dự án Supabase Staging riêng, dùng dữ liệu giả lập (`supabase/seed.sql`).
  - `production`: Dự án Supabase Production độc lập, tuyệt đối không dùng chung database hoặc secret với Staging/Preview.
- **Quota và Gói dịch vụ:**
  - Khởi điểm với lưu lượng 1.000 – 50.000 clicks/tháng và 3–10 trang thương hiệu: đáp ứng hoàn toàn trên hạ tầng tiêu chuẩn, giám sát ngưỡng 500MB Database và 1GB Storage.

---

## 2. Biến môi trường, Tên miền HTTPS và Auth Redirect (P10.02)

### 2.1. Phân tách Scope Biến Môi trường trên Vercel

| Tên biến                        | Scope: Production                   | Scope: Preview                       | Ranh giới truy cập                        |
| :------------------------------ | :---------------------------------- | :----------------------------------- | :---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL Supabase **Production**         | URL Supabase **Staging**             | Client & Server                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/Anon Key **Production** | Publishable/Anon Key **Staging**     | Client & Server                           |
| `NEXT_PUBLIC_SITE_URL`          | `https://profile.gocafe.vn`         | `https://<branch>-gocafe.vercel.app` | Client & Server                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service Role Key **Production**     | Service Role Key **Staging**         | **Server-Only** (`src/lib/env.server.ts`) |

> **Quy tắc bắt buộc:** Môi trường `Preview` trên Vercel tuyệt đối không được gắn `SUPABASE_SERVICE_ROLE_KEY` hoặc URL của `Production`.

### 2.2. Cấu hình Tên miền, HTTPS và Supabase Auth Redirect

- **Tên miền chính:** Cấu hình DNS bản ghi `CNAME` / `A` trỏ về Vercel, bật tự động cấp chứng chỉ SSL/TLS (HTTPS bắt buộc).
- **Supabase Auth Configuration (Production):**
  - Disable Public Signups (Tắt tự đăng ký công khai, chỉ quản trị viên được mời hoặc tạo từ Dashboard).
  - **Site URL:** `https://profile.gocafe.vn`
  - **Redirect URLs cho phép:** `https://profile.gocafe.vn/auth/callback` (không mở wildcard `*` trên môi trường Production).

---

## 3. Chiến lược Sao lưu (Backup) và Khôi phục (Restore) (P10.03)

### 3.1. Trách nhiệm và Mục tiêu Phục hồi

- **Người phụ trách vận hành:** Quản trị viên Kỹ thuật hệ thống Gờ Cafe.
- **RPO (Recovery Point Objective):** Tối đa 24 giờ (sao lưu hàng ngày) hoặc 0 giờ trước mỗi đợt migration (chạy pre-migration dump).
- **RTO (Recovery Time Objective):** Dưới 30 phút để khôi phục schema + dữ liệu cốt lõi sang instance mới.

### 3.2. Quy trình Sao lưu Định kỳ và Trước Phát hành

1. **Sao lưu Database (Schema & Data):**
   ```bash
   # Sao lưu toàn bộ cấu trúc và dữ liệu nghiệp vụ trước khi nâng cấp
   supabase db dump --db-url "$PROD_DB_URL" -f backups/pre_release_schema.sql
   supabase db dump --db-url "$PROD_DB_URL" --data-only -f backups/pre_release_data.sql
   ```
2. **Sao lưu Storage (`public_media` & `private_media`):**
   - Đồng bộ định kỳ các object từ bucket `public_media` về kho lưu trữ sao lưu độc lập.

### 3.3. Quy trình Kiểm tra Khôi phục trên Môi trường Tách biệt

- Khởi tạo database kiểm thử sạch, nạp lại `supabase/full_schema_migration.sql` và file backup dữ liệu.
- Xác nhận toàn bộ 10 bảng chính, 2 bảng phụ, 8 hàm RPC, các ràng buộc `DEFERRABLE INITIALLY DEFERRED` và RLS policies hoạt động nguyên vẹn 100%.

---

## 4. Quy trình Migration Tương thích ngược và Phương án Rollback (P10.04 & P10.05)

### 4.1. Nguyên tắc Migration Production Có Kiểm Soát

- **Tuyệt đối không chạy migration tự động bên trong lệnh `next build` của Vercel** để tránh khóa bảng (table lock) hoặc làm hỏng DB khi build thử nghiệm.
- Mọi thay đổi schema tuân thủ quy tắc **Expand-and-Contract (Tương thích ngược)**:
  1. Thêm cột/bảng/hàm mới tương thích với cả code cũ và code mới.
  2. Chạy kiểm tra migration trên Staging trước, sau đó áp dụng lên Production qua CLI:
     ```bash
     supabase db push --db-url "$PROD_DB_URL"
     ```
  3. Deploy phiên bản ứng dụng mới lên Vercel Production.

### 4.2. Bootstrap Quản trị viên Đầu tiên trên Production (P10.05)

Sau khi tạo tài khoản quản trị trong Supabase Auth Dashboard (nhận `<AUTH_USER_UUID>`), kích hoạt quyền quản trị bằng câu lệnh SQL:

```sql
INSERT INTO public.admin_users (user_id, email, full_name, is_active)
VALUES ('<AUTH_USER_UUID>', 'admin@gocafe.vn', 'Quản trị viên Gờ Cafe', true)
ON CONFLICT (user_id) DO UPDATE SET is_active = true, updated_at = now();
```

### 4.3. Phương án Rollback (Ứng dụng & Dữ liệu)

1. **Rollback Ứng dụng (Tức thì < 1 phút):**
   - Sử dụng tính năng **Instant Rollback** trên Vercel Dashboard để chuyển con trỏ tên miền về bản Deployment ổn định ngay trước đó.
2. **Phục hồi Dữ liệu / Schema:**
   - Do các migration được viết idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`) và tương thích ngược, bản code trước đó vẫn hoạt động bình thường mà không cần xóa bảng.
   - Trong trường hợp sự cố dữ liệu nghiêm trọng, khôi phục từ bản dump `pre_release_data.sql` đã tạo ở bước P10.03.

---

## 5. Khởi tạo 3 Trang Thương hiệu Thật trên Production (P10.06)

Sử dụng file [`supabase/production_bootstrap.sql`](../supabase/production_bootstrap.sql) (đã tách riêng hoàn toàn khỏi `supabase/seed.sql` để **không chèn bất kỳ dữ liệu `click_events` giả lập nào** vào môi trường Production):

1. **Trang chủ thương hiệu (`/gocafe`):**
   - Tiêu đề: _Gờ Cafe - Cà phê đậm chất Sài Gòn_
   - Giao diện: Theme `go-original`
   - Liên kết: ShopeeFood, GrabFood, Menu PDF, Google Maps, Hotline CSKH (`tel:1900123456`).
2. **Trang Tuyển dụng (`/tuyendung`):**
   - Tiêu đề: _Gia đình Gờ Cafe Tuyển Dụng_
   - Giao diện: Theme `coffee-morning`
   - Liên kết: Form ứng tuyển Barista, Email HR (`mailto:hr@gocafe.vn`), Xem Menu sản phẩm.
3. **Trang Nhượng quyền (`/nhuongquyen`):**
   - Tiêu đề: _Hợp tác Nhượng quyền Thương hiệu Gờ Cafe_
   - Giao diện: Theme `modern-clean`
   - Liên kết: Hồ sơ nhượng quyền PDF, Hotline tư vấn 24/7.

---

## 6. Kiểm tra Sau Deploy (Smoke Test) và Giám sát Vận hành (P10.07 & P10.08)

### 6.1. Kiểm tra Nhanh Sau Deploy (P10.07)

Sử dụng công cụ xác minh tự động [`src/lib/production-verify.ts`](../src/lib/production-verify.ts) và endpoint [`/api/health`](../src/app/api/health/route.ts):

1. **Health Check (`/api/health`):** Trả về HTTP 200, `status: "ok"`, xác nhận biến môi trường và kết nối Supabase PostgreSQL hoạt động bình thường.
2. **Trang công khai (`/`, `/gocafe`, `/tuyendung`, `/nhuongquyen`):** Hiển thị đúng phiên bản đã niêm phong (`sealed`), metadata SEO OpenGraph đầy đủ.
3. **Bảo vệ tuyến quản trị (`/admin`):** Khách chưa đăng nhập bị chuyển hướng `307` về `/login`.
4. **Chuyển hướng đo lường (`/r/{pageLinkId}`):**
   - Khi kiểm tra bằng Smoke Test script, request gắn `User-Agent: Gocafe-Production-SmokeTest/1.0 (Bot)` để bộ lọc bot tự động loại trừ, **không làm bẩn số liệu click thật trên Production**.
   - Header trả về luôn có `Cache-Control: no-store`.

### 6.2. Giám sát Log, Dung lượng và Hiệu năng (P10.08)

- **Theo dõi Log ứng dụng (Vercel Logs):**
  - Giám sát các lỗi `[Redirect Click Error]` hoặc `[Record Click Warning]` tại tuyến `/r/[id]`.
  - Xác nhận cơ chế **Resilient Redirect**: ngay cả khi DB ghi click gặp sự cố tạm thời, khách hàng vẫn được chuyển hướng tới trang đích mượt mà.
- **Chỉ số Hiệu năng Thực tế:**
  - Thời gian phản hồi `/api/health` và trang công khai `/[slug]`: đạt mục tiêu `< 200ms` TTFB.
  - Thời gian xử lý chuyển hướng `/r/[id]`: `< 150ms`.
  - Truy vấn báo cáo `/admin/reports`: `< 500ms` nhờ bộ chỉ mục `(page_id, occurred_at DESC)` và `(link_id, occurred_at DESC)`.
