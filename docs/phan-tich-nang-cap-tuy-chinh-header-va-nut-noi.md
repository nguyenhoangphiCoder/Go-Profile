# Phân tích Nâng cấp Tuỳ chỉnh Chuyên sâu Tab "Header & Nút nổi" (`/admin/site`)

> **Phạm vi:** Hệ thống cấu hình vỏ Website (`Site Shell`) tại `/admin/site`  
> **Nguyên tắc kiến trúc:** **0-Migration Database** (mở rộng 100% trên 2 cột JSONB hiện hữu `site_shells.header_config` & `site_shells.floating_contact`), tương thích ngược hoàn toàn với dữ liệu Production, cập nhật tức thì trên khung **Mô phỏng Website (`SiteLivePreview`)** và hỗ trợ **Click-to-Edit**.

---

## 1. Hiện trạng & Chẩn đoán các điểm đang bị "cứng"

Hiện tại, tab **Header & Nút nổi** đã được tổ chức lại thành 6 bước Accordion thu gọn/mở rộng trong Studio toàn màn hình (`/admin/site`). Tuy nhiên, mức độ tuỳ biến thực tế ở tầng render ([`LandingShell`](../src/features/renderer/landing-shell.tsx)) và cấu hình ([`SiteHeaderConfig` & `SiteFloatingContactConfig`](../src/features/site/types.ts)) vẫn còn nhiều ràng buộc cứng:

| Khu vực                    | File liên quan                                | Điểm bị "cứng" hiện tại                                                                                                                                                                                                                                                                                                                                      |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Navbar & Container**     | `landing-shell.tsx`, `types.ts`               | Độ rộng cố định `max-w-[1200px]` (hoặc `1160px` cho pill); chưa có **Preset 1-click**; nền chỉ nhận màu đơn cố định opacity `92%`; không chỉnh được nền **Gradient**, độ mờ kính (`blur`), giãn chữ (`letter-spacing`), màu hover, hay kiểu dropdown cấp 2.                                                                                                  |
| **Mobile Header & Drawer** | `landing-shell.tsx`                           | Mobile Drawer cố định trượt từ bên phải, rộng `82%`, chỉ hiện danh sách link + CTA; không đổi được hướng mở (Trái / Phải / Toàn màn hình), không hiện được Hotline hoặc Mạng xã hội dưới chân menu mobile.                                                                                                                                                   |
| **CTA & Announcement Bar** | `landing-shell.tsx`, `site-config-client.tsx` | Chỉ hỗ trợ **1 nút CTA**, không có icon, không có kích thước hay nút phụ (Outline/Ghost). Thanh thông báo trên cùng chỉ 1 dòng tĩnh, không có nền Gradient, không có nút `×` để khách đóng, không có hiệu ứng chạy chữ (Marquee).                                                                                                                            |
| **Floating Action Bar**    | `landing-shell.tsx`, `site-config-client.tsx` | Cố định dạng cột icon tròn `48px` (`w-12 h-12 rounded-full`); màu nút Gọi (`#111111`) và Zalo (`#0068FF`) bị **hardcode**; chưa có kiểu **Viên thuốc có chữ (Pill)**, chưa có **Thanh đáy Mobile (Sticky Bottom Bar)**, chưa có **Nút gom mở quạt (FAB Speed-Dial)**; không chỉnh được kích thước, khoảng cách lề, hiệu ứng Pulse hay lọc thiết bị hiển thị. |
| **Tiện ích quản trị**      | `site-config-client.tsx`                      | Chưa có nút **Sao chép / Xuất-Nhập cấu hình JSON** giữa các Bộ Menu (Site Shell) hoặc nút **Khôi phục bản đã lưu gần nhất**.                                                                                                                                                                                                                                 |

---

## 2. Kiến trúc Nâng cấp — 4 Nhóm Chức năng (A → D)

### Nhóm A · Navbar & Header Pro _(Ưu tiên P0 — Tác động thị giác mạnh nhất)_

#### A1. Bộ 6 Preset Header 1-Click

Đặt một dải nút chọn nhanh ngay đầu **Bước 2 · Giao diện thanh Menu (Navbar)** giúp người dùng không chuyên thiết kế có ngay phong cách chuẩn trong 1 click, sau đó vẫn chỉnh chi tiết từng thông số bên dưới:

| Preset                     | Phong cách                    | Cấu hình áp dụng                                                                       |
| -------------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| **Gờ Minimal Trắng**       | Sáng, tối giản, viền mảnh     | `classic`, nền `#FFFFFF` (92% glass), chữ `#111111`, nhấn `#B88A44`, CTA đen           |
| **Dark Luxury**            | Tối sang trọng                | `classic`, nền `#0F0F10` (92% glass), chữ `#F5F5F4`, nhấn `#D4AF37`, CTA vàng đồng     |
| **Floating Pill Hiện đại** | Nổi bo tròn giữa màn hình     | `floating-pill`, nền `#FFFFFF` (88% blur-lg), shadow `md`, CTA `full`                  |
| **Editorial Logo Giữa**    | Tạp chí / Thương hiệu cao cấp | `centered-logo`, chữ `uppercase`, `letterSpacing: "0.1em"`, `activeStyle: "underline"` |
| **Warm Espresso**          | Tông cà phê ấm                | `left`, nền gradient `#2B1D14 → #1A120D`, chữ `#FAF3E8`, nhấn `#D4A373`                |
| **Transparent Hero**       | Trong suốt đè lên ảnh bìa     | `transparent-top`, nền `#FFFFFF` khi cuộn, shadow `sm`, `navBorder: false`             |

#### A2. Khung, Nền, Typography & Dropdown nâng cao

- **Độ rộng khung Header (`navMaxWidth`)**:
  - `compact` (`1024px`) · `default` (`1200px`) · `wide` (`1440px`) · `full` (`100%`).
- **Nền nâng cao**:
  - `navBgMode`: `"solid-color" | "gradient"` + `navBgGradientEnd` (màu kết thúc) + `navBgGradientAngle` (`90deg | 135deg | 180deg`).
  - `navBgOpacity`: thanh kéo `50 – 100` (%).
  - `navBlur`: `"none" | "sm" | "md" | "lg"`.
- **Chi tiết chữ & Hover**:
  - `navLetterSpacing`: `"normal" | "wide" | "wider"` (`0 | 0.06em | 0.12em`).
  - `navHoverColor`: màu chữ khi di chuột vào tab (mặc định dùng `navActiveColor`).
  - `dropdownRadius`: `"md" | "xl" | "2xl"` và `dropdownBgColor` riêng cho menu thả xuống cấp 2.
- **Mobile Drawer nâng cao**:
  - `mobileDrawerSide`: `"right" | "left" | "full"` (trượt phải, trượt trái, hoặc phủ toàn màn hình).
  - `mobileDrawerShowContact`: bật/tắt hiển thị nhanh Hotline + các nút Mạng xã hội ở chân menu mobile.

---

### Nhóm B · Dual CTA & Announcement Bar Nâng cao _(Ưu tiên P0)_

#### B1. Hỗ trợ 2 Nút CTA song song (Primary + Secondary)

- **Nút CTA chính (Primary)** — mở rộng từ cấu hình hiện có:
  - Thêm `ctaIcon`: `"none" | "arrow-right" | "phone" | "sparkles" | "calendar" | "shopping-bag" | "message"`.
  - Thêm `ctaSize`: `"sm" | "md" | "lg"` (`h-8 / h-9 / h-10`).
- **Nút CTA phụ (Secondary — tuỳ chọn)**:
  - `ctaSecondaryEnabled`, `ctaSecondaryLabel`, `ctaSecondaryHref`.
  - `ctaSecondaryStyle`: `"outline" | "ghost" | "soft"` (viền mảnh, trong suốt, hoặc nền nhạt 10% theo màu chữ Navbar).
  - Tự động ẩn nút phụ trên mobile hẹp để không làm chật thanh Header, nhưng vẫn hiện đầy đủ trong Mobile Drawer.

#### B2. Announcement Bar (Thanh thông báo trên cùng) linh hoạt

- `announcementBgGradientEnd`: tuỳ chọn pha nền Gradient 2 màu.
- `announcementFontSize`: `11 | 12 | 13 | 14` (px).
- `announcementDismissible`: bật/tắt nút `×` cho phép khách ẩn thanh thông báo (lưu trạng thái tạm trong `sessionStorage` ở chế độ public; trong preview vẫn bấm thử được).
- `announcementMode`: `"static" | "marquee"` — chế độ chạy chữ ngang mượt bằng CSS keyframe (tự dừng khi hover).
- `announcementBadge`: nhãn nổi ngắn đầu dòng (VD: `MỚI`, `ƯU ĐÃI`, `HOT`).

---

### Nhóm C · Floating Action Bar 4 Chế độ _(Ưu tiên P1 — Tối ưu chuyển đổi Mobile)_

Thay vì cố định 1 kiểu cột icon tròn, nâng cấp Cụm nút nổi lên **4 chế độ hiển thị**:

| Chế độ (`style`)        | Mô tả                                                                                                           | Phù hợp nhất cho                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **`icon`** _(mặc định)_ | Cột icon tròn gọn gàng ở góc dưới Trái/Phải                                                                     | Website tối giản, nhiều nội dung                          |
| **`pill`**              | Viên thuốc kèm nhãn chữ rõ ràng (VD: `📞 Gọi ngay`, `💬 Nhắn Zalo`)                                             | Landing Page bán hàng / nhượng quyền cần tăng tỷ lệ bấm   |
| **`bottom-bar`**        | Thanh cố định dưới đáy trên **Mobile** chia đều 2–4 nút ngang; trên Desktop tự fallback sang `icon` hoặc `pill` | F&B, đặt bàn, liên hệ nhanh bằng ngón cái trên điện thoại |
| **`speed-dial`**        | Thu gọn thành 1 nút tròn chính (FAB); bấm mới bung quạt danh sách nút con                                       | Trang có nhiều nút (4–6 nút) muốn tránh che màn hình      |

#### Các tham số tuỳ biến bổ sung cho Floating Bar

- **Bỏ hardcode màu nút mặc định**:
  - `callLabel` (mặc định `"Gọi ngay"`), `callBgColor` (mặc định `#111111`), `callTextColor` (`#FFFFFF`).
  - `zaloLabel` (mặc định `"Nhắn Zalo"`), `zaloBgColor` (mặc định `#0068FF`), `zaloTextColor` (`#FFFFFF`).
- **Kích thước & Vị trí tinh chỉnh**:
  - `size`: `"sm" | "md" | "lg"` (`40px / 48px / 56px`).
  - `bottomOffset`: `12 – 96` (px, mặc định `20px` — hữu ích khi muốn né thanh cookie/chat khác).
  - `sideOffset`: `12 – 48` (px, mặc định `20px`).
- **Hiệu ứng & Hiển thị theo thiết bị**:
  - `pulseCall`: bật hiệu ứng vòng sóng nhẹ (`animate-ping` dịu) quanh nút Hotline.
  - `visibility`: `"all" | "mobile-only" | "desktop-only"`.

---

### Nhóm D · Tiện ích Quản trị & Quy trình Làm việc _(Ưu tiên P2)_

1. **Xuất / Nhập cấu hình Shell (JSON)**: cho phép copy nhanh toàn bộ cấu hình Header + Footer + Floating từ Bộ Menu này sang Bộ Menu khác (hoặc sang Workspace khác) mà không cần cấu hình lại từ đầu.
2. **Nút "Hoàn tác về bản đã lưu"**: reset state cục bộ về `initialData.settings` khi người dùng thử phối màu trên khung mô phỏng nhưng chưa muốn lưu.
3. **Chỉ báo "Có thay đổi chưa lưu" (`isDirty`)**: hiển thị chấm vàng nhỏ trên nút **Lưu cấu hình** ở Top Studio Navbar + hỗ trợ phím tắt `Ctrl+S` tương tự Page Editor.

---

## 3. Thiết kế Schema JSONB Mở rộng (0-Migration & Backward Compatible)

Tất cả các trường mới đều **optional (`?`)** trong [`src/features/site/types.ts`](../src/features/site/types.ts) và được validate chặt bằng Zod trong [`src/features/site/actions.ts`](../src/features/site/actions.ts):

```ts
// Mở rộng vào SiteHeaderConfig (src/features/site/types.ts)
export type SiteNavMaxWidth = "compact" | "default" | "wide" | "full";
export type SiteNavBlur = "none" | "sm" | "md" | "lg";
export type SiteNavLetterSpacing = "normal" | "wide" | "wider";
export type SiteMobileDrawerSide = "right" | "left" | "full";
export type SiteCtaIcon =
  "none" | "arrow-right" | "phone" | "sparkles" | "calendar" | "shopping-bag" | "message";
export type SiteCtaSize = "sm" | "md" | "lg";
export type SiteCtaSecondaryStyle = "outline" | "ghost" | "soft";
export type SiteAnnouncementMode = "static" | "marquee";

export interface SiteHeaderConfigV2Additions {
  // Nhóm A: Navbar Pro
  navMaxWidth?: SiteNavMaxWidth;
  navBgMode?: "solid-color" | "gradient";
  navBgGradientEnd?: string;
  navBgGradientAngle?: 90 | 135 | 180;
  navBgOpacity?: number; // 50..100
  navBlur?: SiteNavBlur;
  navLetterSpacing?: SiteNavLetterSpacing;
  navHoverColor?: string;
  dropdownRadius?: "md" | "xl" | "2xl";
  mobileDrawerSide?: SiteMobileDrawerSide;
  mobileDrawerShowContact?: boolean;

  // Nhóm B: Dual CTA & Announcement Pro
  ctaIcon?: SiteCtaIcon;
  ctaSize?: SiteCtaSize;
  ctaSecondaryEnabled?: boolean;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  ctaSecondaryStyle?: SiteCtaSecondaryStyle;

  announcementBadge?: string;
  announcementBgGradientEnd?: string;
  announcementFontSize?: number; // 11..14
  announcementDismissible?: boolean;
  announcementMode?: SiteAnnouncementMode;
}

// Mở rộng vào SiteFloatingContactConfig (src/features/site/types.ts)
export type SiteFloatingStyle = "icon" | "pill" | "bottom-bar" | "speed-dial";
export type SiteFloatingSize = "sm" | "md" | "lg";
export type SiteFloatingVisibility = "all" | "mobile-only" | "desktop-only";

export interface SiteFloatingContactConfigV2Additions {
  style?: SiteFloatingStyle;
  size?: SiteFloatingSize;
  visibility?: SiteFloatingVisibility;
  bottomOffset?: number; // 12..96
  sideOffset?: number; // 12..48
  pulseCall?: boolean;
  callLabel?: string;
  callBgColor?: string;
  callTextColor?: string;
  zaloLabel?: string;
  zaloBgColor?: string;
  zaloTextColor?: string;
}
```

### Quy tắc Bảo mật & Validate

- Mọi mã màu (`navBgGradientEnd`, `navHoverColor`, `announcementBgGradientEnd`, `callBgColor`, `callTextColor`, `zaloBgColor`, `zaloTextColor`) **bắt buộc** đi qua `isSafeColor()` trước khi đưa vào `style={...}` nhằm chống CSS injection.
- Mọi đường dẫn (`ctaSecondaryHref`) đi qua chuẩn `safeHref` (chỉ cho phép `/...`, `#...`, `https://`, `http://`, `tel:`, `mailto:`).
- Mọi giá trị số (`navBgOpacity`, `announcementFontSize`, `bottomOffset`, `sideOffset`) đều được clamp cứng bằng `Math.min / Math.max` ở cả Zod schema lẫn tầng render.

---

## 4. Nguyên tắc UX giữ cho Panel Trái (`480px`) luôn Gọn gàng

Để thêm nhiều tuỳ chỉnh mà **không quay lại tình trạng rối như cũ**, UI trong tab `Header & Nút nổi` phải tuân thủ 4 nguyên tắc sau:

1. **Giữ nguyên cấu trúc 6 bước Accordion** — không tách thành quá nhiều bước mới; chỉ mở rộng có chọn lọc bên trong Bước 2, 3, 4.
2. **Ẩn nâng cao theo ngữ cảnh (Conditional Disclosure)**:
   - Chỉ hiện ô _Màu kết thúc Gradient & Góc_ khi người dùng chọn `Nền Gradient`.
   - Chỉ hiện cấu hình _Nút CTA phụ_ khi bật toggle `Thêm nút CTA phụ`.
   - Chỉ hiện _Màu nút Gọi / Zalo_ khi nút đó đang bật; dùng sub-toggle `"Tuỳ chỉnh nâng cao (màu, cỡ, lề)"` trong Bước 4 để người dùng cơ bản không bị ngợp.
3. **Tối đa 2 cột trong panel trái** — tuyệt đối không dùng `grid-cols-3` cho các input có text/select; chỉ dùng lưới 3 ô nhỏ cho **Preset thẻ chọn nhanh** (dạng swatch trực quan).
4. **Cập nhật tức thì & Click-to-Edit** — mọi tuỳ chọn mới (Preset, Dual CTA, Marquee, Floating Pill, Mobile Bottom Bar, Speed-Dial) đều phản ánh ngay trên `SiteLivePreview` ở cả 3 chế độ `Điện thoại / Tablet / Máy tính`.

---

## 5. Lộ trình Triển khai & Kiểm thử

### Đợt 1 — Navbar Pro + Dual CTA + Announcement Pro (Nhóm A + B)

- [ ] Cập nhật types ở `src/features/site/types.ts` và Zod schema ở `src/features/site/actions.ts`.
- [ ] Tạo file preset `src/features/site/header-presets.ts` (6 Preset 1-click).
- [ ] Nâng cấp `LandingShell` (`src/features/renderer/landing-shell.tsx`) hỗ trợ: `navMaxWidth`, nền gradient + opacity + blur, `navLetterSpacing`, `navHoverColor`, Mobile Drawer trái/phải/full + contact footer, Dual CTA + icon, Announcement Bar (badge, gradient, nút đóng, CSS marquee).
- [ ] Cập nhật Bước 2 & Bước 3 trong `src/features/site/components/site-config-client.tsx` (kèm cập nhật `liveSiteShell`).

### Đợt 2 — Floating Action Bar 4 Chế độ (Nhóm C)

- [ ] Mở rộng `SiteFloatingContactConfig` & Zod validation.
- [ ] Nâng cấp cụm nút nổi trong `LandingShell` hỗ trợ 4 chế độ (`icon`, `pill`, `bottom-bar` cho `@max-[48rem]`, `speed-dial` có state đóng/mở), tuỳ màu nút Gọi/Zalo, kích thước, khoảng cách lề, hiệu ứng Pulse và lọc thiết bị bằng `@container` query.
- [ ] Cập nhật Bước 4 trong `site-config-client.tsx` với bộ chọn 4 kiểu hiển thị trực quan và nhóm tuỳ chỉnh nâng cao thu gọn.

### Đợt 3 — Tiện ích Studio (Nhóm D)

- [ ] Thêm theo dõi trạng thái `isDirty` + phím tắt `Ctrl+S` + nút **Hoàn tác bản đã lưu** trên Top Studio Navbar.
- [ ] Thêm nút **Xuất / Nhập cấu hình JSON** cho Site Shell.

### Kế hoạch Kiểm thử

- **Unit test (Vitest):** kiểm tra Zod validation các trường mới, chặn mã màu/URL độc hại, đảm bảo dữ liệu cũ (chỉ có trường v1) vẫn parse & render không lỗi.
- **Visual & Responsive test (SiteLivePreview):** kiểm tra đủ 3 khung `375px / 768px / 1280px` cho cả 6 Preset, Dual CTA, Marquee, Mobile Drawer 3 hướng và Floating Bar 4 chế độ.
- **Static checks:** `pnpm typecheck`, `pnpm lint` (0 errors, 0 warnings), `pnpm build`.
