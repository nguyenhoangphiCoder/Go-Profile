# Checklist Triển khai & Nhật ký Thực hiện: Nâng cấp Đa Tenant (Multi-Tenant) & SuperAdmin

> **Dự án:** `gocafe.profile`  
> **Môi trường phát triển:** Cô lập 100% trên **Local Docker DB** (`http://127.0.0.1:54321`, kiểm tra bằng `pnpm db:status` = `[LOCAL DOCKER]`).  
> **Mục tiêu:** Nâng cấp hệ thống thành nền tảng **Multi-Tenant CMS** hoàn chỉnh với **1 tài khoản SuperAdmin** quản lý tập trung toàn bộ Workspaces (Tenant), Người dùng (Users), Phân quyền, Gói tính năng (Feature Flags), Tên miền riêng (Custom Domains) và Nhật ký kiểm toán (Audit Logs).

---

## Quy tắc bắt buộc sau khi hoàn thành mỗi Chặng (Definition of Done)

Sau khi kết thúc **mỗi chặng**, bắt buộc thực hiện đủ 3 bước và **dừng chờ nghiệm thu** trước khi sang chặng kế tiếp:
1. **Kiểm chứng kỹ thuật (Verify):**
   - Nếu có thay đổi DB: chạy `pnpm db:reset` + `pnpm db:seed-gocafe` trên **Local Docker DB** không lỗi + smoke test RLS / phân quyền.
   - Chạy kiểm tra code trên Node 24 (`fnm use 24`): `pnpm typecheck`, `pnpm lint`, `vitest` (toàn bộ unit tests), và `pnpm build` ở chặng cuối.
2. **Cập nhật Checklist:** Đánh dấu `[x]` toàn bộ mục đã hoàn thành và cập nhật trạng thái trong **Bảng Tổng quan Tiến độ**.
3. **Ghi Nhật ký thực hiện (Execution Log):** Bổ sung đầy đủ ngày giờ, file/migration thay đổi, kết quả kiểm chứng và lưu ý vào mục cuối file.

---

## Bảng Tổng quan Tiến độ

| Chặng | Tên giai đoạn | Trạng thái | Ngày hoàn thành |
| :---: | --- | :---: | :---: |
| **MT-1** | Database Multi-Tenant & Trung tâm SuperAdmin (`/admin/system`: Workspaces + Users + Audit Logs) | Hoàn thành (Đã nghiệm thu) | 2026-11-24 |
| **MT-2** | Trải nghiệm Đa Tenant: Tạo Workspace nhanh, Feature Flags theo gói & Onboarding | Hoàn thành (Đã nghiệm thu) | 2026-11-24 |
| **MT-3** | Định tuyến Tên miền riêng theo Tenant (`Custom Domains`) & Kiểm chứng Go-live | Hoàn thành (Chờ nghiệm thu) | 2026-11-24 |

---

## Chặng MT-1 — Database Multi-Tenant & Trung tâm SuperAdmin (`/admin/system`)

### 1.1. Database & Bảo mật RLS (0-downtime)
- [x] Tạo migration `supabase/migrations/20261124000007_multitenant_superadmin.sql`:
  - [x] Mở rộng bảng `public.workspaces`:
    - [x] Cột `plan text NOT NULL DEFAULT 'pro' CHECK (plan IN ('free', 'pro', 'enterprise'))`.
    - [x] Cột `features jsonb NOT NULL DEFAULT '{"landing":true,"branches":true,"leads":true,"tracking":true,"customDomains":false}'::jsonb`.
    - [x] Cột `max_branches integer NOT NULL DEFAULT 100 CHECK (max_branches >= 0)`.
    - [x] Cột `max_shells integer NOT NULL DEFAULT 10 CHECK (max_shells >= 1)`.
  - [x] Tạo bảng `public.workspace_domains` (`id`, `workspace_id`, `domain text UNIQUE`, `home_page_id`, `is_active`, `created_at`, `updated_at`) kèm RLS (`private.can_read_workspace` / `private.is_active_admin`).
  - [x] Tạo bảng `public.platform_audit_logs` (`id`, `actor_user_id`, `actor_email`, `action`, `target_type`, `target_id`, `metadata jsonb`, `created_at`) kèm RLS (chỉ `private.is_active_admin()` được đọc, ghi bằng `service_role`).
- [x] Cập nhật `src/types/database.generated.ts` và `src/features/workspace/types.ts` (bổ sung `plan`, `features`, `maxBranches`, `maxShells`).
- [x] Chạy `pnpm db:reset` + smoke test RLS trên Local Docker DB (đảm bảo user thường bị chặn đọc `platform_audit_logs`, chỉ SuperAdmin đọc được).

### 1.2. Backend SuperAdmin (Workspaces, Global Users & Audit Logs)
- [x] Xây dựng helper `logPlatformAudit(...)` ghi nhật ký tự động cho mọi hành động nhạy cảm của SuperAdmin.
- [x] Nâng cấp quản lý **Workspaces** (`src/features/workspace/manage-actions.ts` & `members.ts`):
  - [x] Khi tạo Workspace mới: tự khởi tạo luôn 1 `site_shells` mặc định, cho chọn Gói (`free | pro | enterprise`) + Feature Flags + Owner (tự gán nếu email đã tồn tại hoặc tạo lời mời).
  - [x] Thêm `renameWorkspaceAction(workspaceId, name)`.
  - [x] Nâng cấp `updateWorkspaceLimitsAction`: cập nhật `plan`, `features`, `maxPages`, `maxMediaMb`, `maxBranches`, `maxShells`.
  - [x] Mở rộng `getWorkspacesOverview()`: trả kèm số liệu thực tế (`pageCount`, `branchCount`, `leadCount`, `shellCount`, `memberCount`, `mediaBytes`).
- [x] Xây dựng module quản lý **Toàn bộ Người dùng (Global Users)** cho SuperAdmin (`src/features/workspace/users-actions.ts`):
  - [x] `getPlatformUsersOverview()`: liệt kê toàn bộ `auth.users` kèm trạng thái SuperAdmin (`admin_users`), trạng thái khóa (`banned_until`), và danh sách Workspace + Role của từng người.
  - [x] `createPlatformUserAction({ email, password, displayName, isSuperAdmin, workspaceId, role })`: tạo tài khoản trực tiếp (email xác thực sẵn, không phụ thuộc SMTP) và gán ngay vào Workspace.
  - [x] `resetPlatformUserPasswordAction(userId, newPassword)`: đặt lại mật khẩu cho người dùng.
  - [x] `togglePlatformUserBanAction(userId, banned)`: khóa / mở khóa đăng nhập (chặn SuperAdmin tự khóa chính mình).
  - [x] `toggleSuperAdminAction(userId, makeSuperAdmin)`: cấp / gỡ quyền SuperAdmin (`admin_users`, chặn tự gỡ quyền của chính mình).
  - [x] `assignUserToWorkspaceAction(userId, workspaceId, role)` & `removeUserFromWorkspaceAction(userId, workspaceId)`: gán / đổi vai trò / gỡ User khỏi bất kỳ Workspace nào.
- [x] Xây dựng query `getPlatformAuditLogs(limit = 100)` đọc nhật ký hệ thống.

### 1.3. Giao diện Trung tâm SuperAdmin (`/admin/system` — 3 Tab)
- [x] Nâng cấp `/admin/system` thành giao diện 3 Tab trực quan:
  - [x] **Tab 1 — Workspaces (Tenants):** Thống kê tổng quan toàn nền tảng (Tổng Tenant / Tổng User / Tổng Trang / Tổng Leads), form tạo Workspace mới kèm chọn Gói, danh sách thẻ Workspace có nút **"Truy cập →"** (1 click chuyển `gp_ws`), Đổi tên, Chỉnh gói & Bật/tắt tính năng, Lưu trữ / Khôi phục.
  - [x] **Tab 2 — Người dùng (Users):** Ô tìm kiếm theo email/tên, nút **"+ Tạo tài khoản mới"** (Email + Mật khẩu + chọn Workspace & Role), bảng danh sách tài khoản với các thao tác: Gán/Sửa Workspace & Role, Đổi mật khẩu, Bật/Tắt SuperAdmin, Khóa/Mở khóa tài khoản.
  - [x] **Tab 3 — Nhật ký hệ thống (Audit Logs):** Bảng theo dõi lịch sử thao tác quản trị (thời gian, người thực hiện, hành động, chi tiết).

### Kiểm chứng Chặng MT-1
- [x] `pnpm db:reset` + `pnpm db:seed-gocafe` + `pnpm typecheck` + `pnpm lint` + `vitest` pass 100%.
- [x] Smoke test thực tế: SuperAdmin tạo User mới + Workspace mới → đăng nhập bằng User mới chỉ thấy đúng Workspace của mình (không thấy dữ liệu Gờ Café và bị chặn đọc `platform_audit_logs`).
- [x] **Check list & Ghi log Chặng MT-1 — Dừng chờ nghiệm thu.**

---

## Chặng MT-2 — Trải nghiệm Đa Tenant, Tạo Workspace nhanh & Feature Flags

### 2.1. Tạo Workspace nhanh từ Sidebar & Chuyển đổi mượt
- [x] Cập nhật `WorkspaceSwitcher` trên Sidebar Admin:
  - [x] Hiển thị rõ badge `SuperAdmin` và tên Gói (`Free / Pro / Enterprise`) của Workspace đang chọn.
  - [x] Thêm nút **"+ Tạo mới"** ngay trên khối Workspace (với SuperAdmin — mở modal tạo nhanh không cần rời trang hiện tại, tùy chọn tự động chuyển ngay vào Workspace mới).
- [x] Nâng cấp trang `/admin/no-workspace`: giao diện rõ ràng hơn cho user chưa thuộc workspace nào (hiển thị email hiện tại để gửi cho SuperAdmin/Owner cấp quyền, kèm nút kiểm tra lại).

### 2.2. Áp dụng Feature Flags & Quota theo từng Tenant
- [x] Cập nhật `AdminNav` (Sidebar) đọc `workspace.features`:
  - [x] Tự động ẩn các mục **Cấu hình Website (`/admin/site`)** nếu `features.landing = false`.
  - [x] Tự động ẩn **Hệ thống chi nhánh (`/admin/branches`)** nếu `features.branches = false`.
  - [x] Tự động ẩn **Khách hàng (`/admin/leads`)** nếu `features.leads = false`.
- [x] Chặn truy cập trực tiếp ở tầng Server Page (`FeatureLockedNotice`) & Server Action khi tính năng bị tắt hoặc vượt hạn mức (`max_branches`, `max_shells`) với thông báo tiếng Việt thân thiện *(SuperAdmin vẫn có quyền truy cập để cấu hình hộ)*.

### Kiểm chứng Chặng MT-2
- [x] `pnpm typecheck` + `pnpm lint` + `vitest` (bổ sung unit test `tests/unit/workspace-guards.test.ts` cho Feature Flags & Quota) pass 100%.
- [x] **Check list & Ghi log Chặng MT-2 — Dừng chờ nghiệm thu.**

---

## Chặng MT-3 — Tên miền riêng theo Tenant (`Custom Domains`) & Kiểm chứng Go-live

### 3.1. Quản lý Tên miền riêng trong `/admin/system`
- [x] Thêm **Tab 3 — Tên miền (Domains)** tại `/admin/system`:
  - [x] Thêm / Bật-tắt / Xóa bản ghi `workspace_domains` (`domain` chuẩn hóa chữ thường không `http://`, chọn `Workspace`, chọn `Trang chủ mặc định` từ danh sách trang của workspace đó).
  - [x] Hiển thị hướng dẫn trỏ DNS (`A` / `CNAME` về Vercel) dễ hiểu cho quản trị viên.

### 3.2. Định tuyến Đa Tenant theo `Host` header
- [x] Cập nhật `src/app/page.tsx`:
  - [x] Đọc `x-forwarded-host` / `host` từ `headers()` (bỏ `:port`, chuẩn hóa chữ thường, tự động hỗ trợ cả `www.` và tên miền gốc).
  - [x] Tra cứu bảng `public.workspace_domains` (`is_active = true`) → nếu khớp tên miền của Tenant nào thì render đúng `home_page_id` (hoặc `homePageSlug` của bộ `site_shells` mặc định thuộc Workspace đó).
  - [x] Nếu không khớp tên miền riêng nào (VD: `localhost:3000`) → giữ nguyên cơ chế fallback hiện tại (mở `homePageSlug` mặc định của hệ thống hoặc `/login`).
- [x] Bổ sung unit test `tests/unit/workspace-domains.test.ts` cho hàm chuẩn hóa `Host` & tra cứu ứng viên Tenant Domain.

### 3.3. Kiểm chứng tổng thể & Sẵn sàng Go-live
- [x] Chạy đầy đủ: `pnpm db:reset` (19/19 migrations) + `pnpm db:seed-gocafe` + `pnpm typecheck` + `pnpm lint` + `vitest` + `pnpm build` (35/35 routes trên Node 24).
- [x] Cập nhật danh sách 7 migration mới sẵn sàng áp dụng lên Supabase Cloud (0-downtime).
- [x] **Check list & Ghi log Chặng MT-3.**

---

## Nhật ký Thực hiện (Execution Log)

### 2026-11-24 — Hoàn thành Chặng MT-1 (Database Multi-Tenant & Trung tâm SuperAdmin `/admin/system`)
- **Migration mới:** `supabase/migrations/20261124000007_multitenant_superadmin.sql` (thêm `plan`, `features`, `max_branches`, `max_shells` vào `workspaces`; tạo `workspace_domains` và `platform_audit_logs` kèm RLS `private.is_active_admin()` / `private.can_read_workspace()`).
- **Files cập nhật / tạo mới:**
  - `src/types/database.generated.ts`, `src/features/workspace/types.ts`, `src/features/workspace/context.ts`, `src/features/workspace/schemas.ts`
  - `src/features/workspace/audit.ts`, `src/features/workspace/users.ts`, `src/features/workspace/users-actions.ts`, `src/features/workspace/manage-actions.ts`, `src/features/workspace/members.ts`
  - `src/app/admin/(dashboard)/system/page.tsx`, `src/features/workspace/components/system-manager.tsx`, `src/features/workspace/components/system-users-tab.tsx`, `src/features/workspace/components/system-audit-tab.tsx`
  - `tests/unit/workspace-manage.test.ts`
- **Kết quả kiểm chứng (Local Docker DB + Node 24):**
  - `pnpm db:reset`: **19/19 migrations** thành công, `pnpm db:seed-gocafe`: thành công.
  - `pnpm typecheck`: **0 lỗi**. `pnpm lint`: **0 lỗi**.
  - `vitest` (`tests/unit/workspace-manage.test.ts`): **16/16 tests pass**.
  - **RLS Smoke Test thực tế:** User thường (`smoke-mt1@test.local`) chỉ đọc được đúng 1 workspace của mình (`userWorkspaces: 1`), bị chặn hoàn toàn `platform_audit_logs` (`0` dòng) và không thấy trang của Gờ Café (`0` trang); SuperAdmin (`admin@gocafe.local`) đọc đủ toàn bộ workspace và audit logs.
- **Trạng thái:** Đã hoàn tất Chặng MT-1, dừng chờ nghiệm thu trước khi triển khai Chặng MT-2.

### 2026-11-24 — Hoàn thành Chặng MT-2 (Tạo Workspace nhanh từ Sidebar, Feature Flags & Quota theo gói)
- **Files cập nhật / tạo mới:**
  - `src/features/workspace/guards.ts`, `src/components/admin/feature-locked-notice.tsx`
  - `src/components/admin/workspace-switcher.tsx`, `src/components/admin/admin-nav.tsx`, `src/app/admin/(dashboard)/layout.tsx`
  - `src/app/admin/no-workspace/page.tsx`
  - `src/app/admin/(dashboard)/site/page.tsx`, `src/app/admin/(dashboard)/branches/page.tsx`, `src/app/admin/(dashboard)/leads/page.tsx`
  - `src/features/site/actions.ts`, `src/features/branches/actions.ts`
  - `tests/unit/workspace-guards.test.ts`
- **Kết quả kiểm chứng (Node 24):**
  - `pnpm typecheck`: **0 lỗi** · `pnpm lint`: **0 lỗi**.
  - `vitest` (`workspace-guards.test.ts` + `workspace-manage.test.ts`): **21/21 tests pass**.
- **Trạng thái:** Đã hoàn tất Chặng MT-2, dừng chờ nghiệm thu trước khi triển khai Chặng MT-3.

### 2026-11-24 — Hoàn thành Chặng MT-3 (Tên miền riêng theo Tenant `Custom Domains` & Kiểm chứng Go-live)
- **Files cập nhật / tạo mới:**
  - `src/features/workspace/domain-utils.ts`, `src/features/workspace/domains.ts`, `src/features/workspace/domains-actions.ts`
  - `src/features/workspace/components/system-domains-tab.tsx`, `src/features/workspace/components/system-manager.tsx`, `src/features/workspace/components/system-audit-tab.tsx`, `src/app/admin/(dashboard)/system/page.tsx`
  - `src/app/page.tsx` (định tuyến `/` theo `Host` header qua `resolveTenantHomeSlugByHost`)
  - `tests/unit/workspace-domains.test.ts`
- **Kết quả kiểm chứng tổng thể (Local Docker DB + Node 24):**
  - `pnpm db:reset`: **19/19 migrations** thành công · `pnpm db:seed-gocafe`: thành công.
  - `pnpm typecheck`: **0 lỗi** · `pnpm lint`: **0 lỗi**.
  - `vitest` (`workspace-domains.test.ts` + `workspace-guards.test.ts` + `workspace-manage.test.ts`): **24/24 tests pass**.
  - `pnpm build`: **35/35 routes** build thành công (Next.js 16.4.5 Turbopack).
- **Danh sách 7 Migration mới sẵn sàng Go-live lên Supabase Cloud (0-downtime):**
  1. `20261124000001_landing_pages_foundation.sql`
  2. `20261124000002_site_shell.sql`
  3. `20261124000003_branches.sql`
  4. `20261124000004_leads.sql`
  5. `20261124000005_landing_blocks_p1.sql`
  6. `20261124000006_multi_site_shells.sql`
  7. `20261124000007_multitenant_superadmin.sql`
- **Trạng thái:** Hoàn tất toàn bộ 3/3 chặng nâng cấp Đa Tenant & SuperAdmin trên Local Docker DB (chưa đụng Production Cloud DB / Git push).
