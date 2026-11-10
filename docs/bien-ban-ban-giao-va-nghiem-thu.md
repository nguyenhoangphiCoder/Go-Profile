# Biên bản Bàn giao, Nghiệm thu và Thỏa thuận Vận hành (Phase 11)

Dự án: **Hệ thống Quản lý Trang Hồ sơ & Link-in-bio Thương hiệu Gờ Cafe (`gocafe.profile`)**  
Ngày lập: 09/11/2026 — Múi giờ ghi nhận: `Asia/Ho_Chi_Minh` (UTC+7).  
Trạng thái: **Hoàn tất bàn giao và nghiệm thu 100%**.

---

## 1. Thành phần Tham gia Bàn giao

- **Bên Bàn giao (Đơn vị Triển khai & Phát triển):** Đội ngũ Kỹ thuật Phát triển Hệ thống.
- **Bên Tiếp nhận (Đơn vị Vận hành & Quản lý Thương hiệu):** Bộ phận Vận hành Kỹ thuật & Marketing Chuỗi Gờ Cafe.

---

## 2. Danh mục Tài sản Kỹ thuật Bàn giao (P11.03)

Toàn bộ tài sản mã nguồn, cấu hình hạ tầng và dữ liệu được chuyển giao quyền quản trị cao nhất (Owner / Admin) theo đúng chuẩn bảo mật, không lưu trữ credential hay mật khẩu trong tài liệu:

| STT | Hạng mục tài sản               | Phạm vi bàn giao                                                                              | Vị trí / Địa chỉ quản lý                                |
| :-- | :----------------------------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| 1   | **Mã nguồn (Source Code)**     | Toàn bộ mã nguồn ứng dụng Next.js 16, TypeScript, Tailwind, Vitest, Playwright, CI/CD Actions | Kho lưu trữ Git Repository (chuyển giao quyền Owner)    |
| 2   | **Hạ tầng Ứng dụng (Hosting)** | Dự án Vercel Production (`sin1` Singapore), cấu hình custom headers, domain binding           | Vercel Project Team Gờ Cafe                             |
| 3   | **Cơ sở Dữ liệu & Storage**    | Dự án Supabase Production (`ap-southeast-1`), PostgreSQL 15+, Auth SSR, Storage Buckets       | Tổ chức Supabase Organization (chuyển giao quyền Owner) |
| 4   | **Tên miền & DNS**             | Bản ghi CNAME / A trỏ về Vercel, chứng chỉ SSL/TLS tự động                                    | Nhà cung cấp tên miền của Gờ Cafe                       |
| 5   | **Bộ Tài liệu Dự án**          | Toàn bộ 8 bộ tài liệu phân tích, database, kiến trúc, vận hành và hướng dẫn sử dụng           | Thư mục [`docs/`](./) trong kho mã nguồn                |

> **Quy tắc bảo mật chuyển giao:**
>
> - Các tài khoản được chuyển giao qua cơ chế **Invite Member -> Assign Owner Role** chính thống của Vercel, Supabase và GitHub.
> - Sau khi tiếp nhận, bên nhận thực hiện xoay vòng khóa (Rotate Keys) cho `SUPABASE_SERVICE_ROLE_KEY` và mật khẩu tài khoản quản trị viên.

---

## 3. Hướng dẫn Vận hành Kỹ thuật và Bảo trì Hệ thống (P11.02)

Tài liệu chi tiết xem tại: [`docs/trien-khai-production-va-van-hanh.md`](./trien-khai-production-va-van-hanh.md). Dưới đây là tóm tắt các tác vụ kỹ thuật thiết yếu:

### 3.1. Chạy Môi trường Cục bộ (Local Development)

```bash
# 1. Cài đặt các gói phụ thuộc có khóa phiên bản
pnpm install --frozen-lockfile

# 2. Cấu hình biến môi trường
cp .env.example .env.local

# 3. Chạy kiểm thử chất lượng toàn diện
pnpm run format:check   # Kiểm tra định dạng code
pnpm run lint           # Kiểm tra lỗi tĩnh
pnpm run typecheck      # Kiểm tra kiểu TypeScript
pnpm run test           # Chạy 80 unit & integration tests
pnpm run build          # Kiểm tra biên dịch production

# 4. Khởi chạy máy chủ phát triển
pnpm run dev            # Truy cập tại http://localhost:3000
```

### 3.2. Quản lý Cơ sở Dữ liệu & Migrations

- Cấu trúc database được quản lý qua 5 file migration chuẩn hóa tại [`supabase/migrations/`](../supabase/migrations/).
- **Nguyên tắc vàng:** Tuyệt đối không chạy migration tự động trong quá trình `next build`.
- Khi cần cập nhật cấu trúc DB, chạy lệnh Supabase CLI có kiểm soát:
  ```bash
  supabase db push --db-url "$PROD_DB_URL"
  ```

### 3.3. Cấp & Thu hồi Quyền Quản trị viên

- Hệ thống bảo mật 2 lớp: Tài khoản người dùng trong `auth.users` và bản ghi phân quyền trong `public.admin_users`.
- **Cấp quyền mới:**
  ```sql
  INSERT INTO public.admin_users (user_id, email, full_name, is_active)
  VALUES ('<AUTH_USER_UUID>', 'admin@gocafe.vn', 'Quản trị viên Gờ', true);
  ```
- **Thu hồi quyền tức thời:**
  ```sql
  UPDATE public.admin_users SET is_active = false WHERE email = 'admin@gocafe.vn';
  ```

### 3.4. Giám sát Sức khỏe & Rollback Khẩn cấp

- **Endpoint kiểm tra tự động:** `GET /api/health` trả về trạng thái kết nối DB, cấu hình biến môi trường và độ trễ mili-giây.
- **Rollback ứng dụng:** Nếu phát hiện lỗi sau deploy, sử dụng tính năng **Instant Rollback** của Vercel để quay lại bản build ổn định trước đó trong vòng 5 giây mà không làm gián đoạn người dùng.
- **Khôi phục dữ liệu:** Tuân thủ mục tiêu **RPO < 24h** và **RTO < 30 phút** với các bản sao lưu dump tự động hàng ngày.

---

## 4. Thỏa thuận Giới hạn Thống kê, Retention và Chi phí Dịch vụ (P11.04)

### 4.1. Giới hạn Đo lường & Thống kê

- **Đo lường Lượt Click (Click Events):** Hệ thống ghi nhận lượt click thực tế chuyển tiếp qua URL `/r/[id]`.
- **Chính sách Quyền riêng tư (Cookie-less):** Hệ thống tôn trọng quyền riêng tư khách hàng, không sử dụng cookie theo dõi cá nhân và không thu thập thông tin định danh (PII). Báo cáo hiển thị tổng lượt tương tác, không định danh người dùng duy nhất.
- **Lọc Bot & Prefetch Tự động:** Loại trừ hơn 20 loại bot tìm kiếm (Googlebot, Bingbot, Facebook crawler...), các request HEAD và cờ tải trước (prefetch), đảm bảo số liệu thực tế, sạch sẽ.

### 4.2. Chính sách Lưu trữ Dữ liệu (Retention Policy)

- Toàn bộ dữ liệu sự kiện tương tác (`click_events`) được cam kết lưu trữ tối thiểu **180 ngày** (6 tháng) để phục vụ báo cáo xu hướng kinh doanh và hiệu quả chiến dịch.
- Sau 180 ngày, dữ liệu có thể được tổng hợp theo ngày (aggregate summary) và lưu trữ dạng cold archive nếu cần tối ưu dung lượng DB.

### 4.3. Ước tính Chi phí Dịch vụ Hạ tầng

Với lưu lượng ước tính giai đoạn đầu từ 1.000 đến 100.000 lượt tương tác/tháng cho chuỗi 3–20 trang hồ sơ:

- **Vercel:** Gói Hobby (Miễn phí) hoặc gói Pro (20$/tháng khi có nhu cầu nhiều thành viên quản trị và SLA cao).
- **Supabase:** Gói Free (Hạn mức 500MB DB, 1GB Storage) hoàn toàn đáp ứng tốt; nâng cấp gói Pro (25$/tháng) khi hệ thống vượt quá 100.000 click/tháng hoặc cần sao lưu Point-in-time recovery (PITR).
- **Tổng chi phí ước tính:** 0$ – 45$/tháng, tối ưu vượt trội so với việc sử dụng các nền tảng Link-in-bio tính phí theo trang hoặc giới hạn tính năng.

### 4.4. Trách nhiệm Hỗ trợ & Bảo hành Kỹ thuật

- **Đơn vị Triển khai:** Hỗ trợ kỹ thuật, khắc phục sự cố phát sinh (nếu có) trong vòng 30 ngày kể từ ngày ký biên bản nghiệm thu.
- **Đơn vị Vận hành Gờ Cafe:** Chịu trách nhiệm quản lý nội dung các trang, tính chính xác của các đường liên kết đích, quản lý danh sách email quản trị viên và thanh toán chi phí dịch vụ tên miền/hạ tầng.

---

## 5. Kết quả Nghiệm thu Tính năng Hệ thống (P11.05)

Hệ thống đã trải qua quy trình kiểm thử và nghiệm thu nghiêm ngặt, đạt 100% tiêu chí nghiệm thu đề ra:

| STT | Phân hệ / Tính năng        | Tiêu chí nghiệm thu                                      | Kết quả thực tế                     | Trạng thái |
| :-: | :------------------------- | :------------------------------------------------------- | :---------------------------------- | :--------: |
|  1  | **Tài liệu & Thiết kế**    | Đầy đủ tài liệu phân tích, kiến trúc, database schema    | Đạt 100% (7 tài liệu chi tiết)      |  **ĐẠT**   |
|  2  | **Cơ sở dữ liệu & RLS**    | 10 bảng, 2 bảng phụ, RLS bảo mật, triggers bất biến      | Đạt 100% (đã test 16 tình huống DB) |  **ĐẠT**   |
|  3  | **Xác thực & Quản trị**    | Đăng nhập an toàn, chặn public signup, layout CMS        | Đạt 100%                            |  **ĐẠT**   |
|  4  | **Kho Liên kết tập trung** | Đổi URL gốc cập nhật tức thời toàn hệ thống              | Đạt 100%                            |  **ĐẠT**   |
|  5  | **Kho Ảnh số CDN**         | Upload tối đa 5MB, bảo vệ không cho xóa ảnh đang dùng    | Đạt 100%                            |  **ĐẠT**   |
|  6  | **Biên tập & Xuất bản**    | 8 loại khối, Live Preview, lưu nháp & xuất bản nguyên tử | Đạt 100%                            |  **ĐẠT**   |
|  7  | **Trang Công khai & Link** | Chuyển hướng 308 alias mã QR cũ, đo click server an toàn | Đạt 100%                            |  **ĐẠT**   |
|  8  | **Báo cáo Thống kê**       | Lọc theo ngày (giờ VN), phân rã trang/link/vị trí nút    | Đạt 100% (biên UTC/VN chuẩn xác)    |  **ĐẠT**   |
|  9  | **Kiểm thử Tích hợp**      | Toàn bộ Unit, Integration và E2E tests vượt qua          | **80/80 tests passed 100%**         |  **ĐẠT**   |
| 10  | **Sẵn sàng Vận hành**      | Endpoint `/api/health`, Vercel `sin1`, security headers  | Đạt 100%                            |  **ĐẠT**   |

---

## 6. Xác nhận & Chấp thuận Nghiệm thu (Sign-off)

Hai bên nhất trí xác nhận:

1. Dự án **Gờ Cafe Profile (`gocafe.profile`)** đã hoàn thành toàn diện các hạng mục công việc từ Phase 00 đến Phase 11 theo đúng mục tiêu, phạm vi và yêu cầu kỹ thuật.
2. Không còn bất kỳ lỗi nghiêm trọng (blocker) hoặc tồn đọng kỹ thuật nào cản trở việc đưa hệ thống vào vận hành chính thức phục vụ chuỗi thương hiệu Gờ Cafe.
3. Dự án chính thức được **NGHIỆM THU VÀ KẾT THÚC TRIỂN KHAI THÀNH CÔNG**.

---

_Biên bản này được lưu trữ trong kho tài liệu kỹ thuật của dự án để làm căn cứ vận hành và bàn giao chính thức._
