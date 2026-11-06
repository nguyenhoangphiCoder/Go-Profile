# Gờ Cafe Profile

Hệ thống hồ sơ liên kết (profile link) và trang thông tin thương hiệu đa slug dành cho Gờ Cafe. Dự án được xây dựng theo kiến trúc Modular Monolith trên nền tảng **Next.js App Router (React 19, TypeScript)** và **Supabase (PostgreSQL, Auth, Storage)**.

---

## 1. Yêu cầu môi trường

- **Node.js:** `>= 20.0.0` (khuyến nghị phiên bản LTS Node 22 ghi trong `.node-version`)
- **Package Manager:** `pnpm >= 9.0.0` (phiên bản chuẩn `12.18.0`)

---

## 2. Cài đặt và cấu hình

### Bước 1: Sao chép repository và cài đặt dependencies

```bash
git clone <repository-url>
cd gocafe.profile
pnpm install --frozen-lockfile
```

### Bước 2: Cấu hình biến môi trường

Sao chép tệp mẫu `.env.example` thành `.env.local`:

```bash
cp .env.example .env.local
```

Cập nhật các biến môi trường tương ứng với dự án Supabase:

```env
# Client & Server
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Server-Only
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

---

## 3. Các lệnh thực thi (NPM Scripts)

| Lệnh                    | Mục đích                                                      |
| :---------------------- | :------------------------------------------------------------ |
| `pnpm run dev`          | Khởi chạy máy chủ phát triển cục bộ (`http://localhost:3000`) |
| `pnpm run build`        | Tạo bản build production tối ưu với Turbopack                 |
| `pnpm run start`        | Chạy ứng dụng production đã build                             |
| `pnpm run typecheck`    | Kiểm tra kiểu dữ liệu TypeScript (`tsc --noEmit`)             |
| `pnpm run lint`         | Chạy ESLint kiểm tra quy chuẩn mã nguồn                       |
| `pnpm run format`       | Tự động định dạng mã nguồn bằng Prettier                      |
| `pnpm run format:check` | Kiểm tra định dạng mã nguồn                                   |
| `pnpm run test`         | Chạy bộ kiểm thử đơn vị với Vitest                            |
| `pnpm run test:watch`   | Chạy Vitest ở chế độ theo dõi thay đổi                        |
| `pnpm run test:e2e`     | Chạy kiểm thử luồng người dùng với Playwright                 |

---

## 4. Cấu trúc thư mục mã nguồn

```text
├── docs/                             # Tài liệu phân tích, kiến trúc và nhật ký triển khai
├── public/                           # Tài nguyên tĩnh
├── src/
│   ├── app/                          # Next.js App Router (layouts, pages, routes)
│   │   ├── (public)/                 # Tuyến công khai (/, /[slug])
│   │   ├── (auth)/                   # Tuyến đăng nhập (/login)
│   │   ├── admin/                    # Khu vực quản trị CMS
│   │   └── r/[pageLinkId]/route.ts   # Chuyển hướng và ghi nhận click
│   ├── features/                     # Module nghiệp vụ (pages, links, media, analytics)
│   ├── components/                   # UI components dùng chung (shadcn/ui, shared)
│   ├── lib/                          # Tiện ích hạ tầng (Supabase client, env, utils, errors)
│   ├── config/                       # Cấu hình tĩnh (siteConfig, themes, reserved-slugs)
│   └── types/                        # TypeScript types và Supabase generated types
├── tests/
│   ├── unit/                         # Kiểm thử đơn vị (Vitest)
│   └── e2e/                          # Kiểm thử đầu-cuối (Playwright)
├── .github/workflows/ci.yml          # Quy trình CI tự động kiểm tra mã nguồn và build
├── .env.example                      # Mẫu biến môi trường
├── .node-version                     # Phiên bản Node.js chuẩn hóa
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

---

## 5. Tài liệu kỹ thuật chi tiết

- [Phân tích yêu cầu](./docs/phan-tich-yeu-cau.md)
- [Quy định công nghệ và kiến trúc](./docs/quy-dinh-cong-nghe-va-kien-truc.md)
- [Phân tích và thiết kế database](./docs/phan-tich-database.md)
- [Quyết định phạm vi và đầu vào (Phase 01)](./docs/quyet-dinh-pham-vi-va-dau-vao.md)
- [Kế hoạch triển khai](./docs/ke-hoach-trien-khai.md)
- [Nhật ký triển khai](./docs/nhat-ky-trien-khai.md)
