# Kế hoạch nâng cấp: Tùy biến giao diện và tự thiết kế trang

Ngày lập: 16/11/2026 — múi giờ `Asia/Ho_Chi_Minh`.
Trạng thái: Đề xuất (chưa triển khai).
Căn cứ:

- [Quyết định phạm vi và đầu vào](./quyet-dinh-pham-vi-va-dau-vao.md) (phạm vi v1)
- [Quy định công nghệ và kiến trúc](./quy-dinh-cong-nghe-va-kien-truc.md)
- [Phân tích và thiết kế database](./phan-tich-database.md)

Mục tiêu: người dùng có thể **tự thiết kế trang theo ý thích** (màu, font, nền, kiểu nút, bố cục, từng khối) và trang **tự thích ứng** với nhiều màn hình, chế độ sáng/tối và nội dung khác nhau. Đồng thời vẫn giữ nguyên nguyên tắc bảo mật của v1: không cho nhập HTML/CSS/JS tùy ý.

---

## 1. Hiện trạng và giới hạn

| Hạng mục | Hiện trạng v1 | Giới hạn khi muốn cho người dùng tự thiết kế |
| --- | --- | --- |
| Theme | 3 preset cố định trong [themes.ts](../src/config/themes.ts); phần `custom` gồm khoảng 13 thuộc tính | Mỗi thuộc tính mới phải sửa tay `resolveTheme()` từng dòng; không có khái niệm "kiểu nút", "khoảng cách", "bóng đổ", "cỡ chữ" |
| Font | Enum cố định `inter`, `be-vietnam-pro`, `montserrat` | Không chọn được font tiêu đề riêng, cỡ chữ, độ đậm |
| Nền | Màu, `backgroundGradient` (**chuỗi CSS tự do**), ảnh, blur | Gradient nhận chuỗi tự do nên khó dựng giao diện chọn và khó kiểm soát giá trị |
| Khối (block) | 8 loại, CHECK cứng trong bảng `page_blocks` | Payload gần như không có tuỳ chọn style riêng cho từng khối |
| Renderer | **2 bộ render tách biệt**: [live-preview.tsx](../src/features/pages/components/editor/live-preview.tsx) (~830 dòng) và [public-page-view.tsx](../src/features/public/components/public-page-view.tsx) (~640 dòng) | Mỗi tùy chọn mới phải code 2 lần; bản xem trước và trang thật dễ hiển thị lệch nhau |
| Validate | `theme.custom` và `payload` là `z.record(z.string(), z.any())` trong [schemas.ts](../src/features/pages/schemas.ts) | Càng mở nhiều tùy chọn, càng dễ lọt giá trị rác hoặc nguy hiểm vào DB |
| Phân quyền | Một cấp: mọi tài khoản trong `admin_users` là quản trị viên | Chưa có khái niệm "người dùng sở hữu trang của riêng mình" |
| Điểm thuận lợi | `page_revisions.schema_version`, cơ chế nháp/xuất bản, theme lưu dạng `jsonb` | Có thể nâng cấp dần mà không phá dữ liệu cũ |

**Kết luận:** muốn mở rộng tùy biến một cách bền vững thì phải xử lý **renderer trùng lặp** và **cấu trúc theme** trước. Làm hai việc này xong, việc thêm tùy chọn mới chỉ còn là việc thêm cấu hình.

---

## 2. Nguyên tắc thiết kế

1. **Tùy biến có cấu trúc, không tùy biến tự do.** Người dùng chọn giá trị từ các ô điều khiển (color picker, slider, dropdown). Hệ thống tự sinh CSS từ các giá trị đó. Không có ô "Custom CSS".
2. **Một nguồn render duy nhất.** Bản xem trước trong editor và trang công khai dùng chung một component.
3. **Design token và CSS variables.** Theme được lưu thành một tập token, render thành biến `--gp-*` ở gốc trang. Mọi component đều đọc biến này.
4. **Mỗi loại khối tự khai báo đủ thông tin trong một chỗ duy nhất.** Thông tin gồm: schema, giá trị mặc định, phần render, phần editor. Thêm một loại khối mới chỉ cần thêm 1 thư mục.
5. **Có phiên bản (version) và tự chuyển đổi dữ liệu.** Mọi thay đổi cấu trúc theme/payload đều tăng `schema_version` và có hàm chuyển đổi từ bản cũ, để dữ liệu đã xuất bản không bị vỡ.
6. **Trang tự thích ứng mặc định.** Responsive theo container, tự đảm bảo độ tương phản chữ/nền, tôn trọng `prefers-reduced-motion`.

---

## 3. Kiến trúc đề xuất

### 3.1. Hợp nhất renderer và khai báo khối tập trung (Block Registry)

Cấu trúc thư mục đề xuất:

```text
src/features/renderer/
  page-renderer.tsx          # Component dùng chung cho preview + public
  theme-to-css-vars.ts       # tokens -> CSS variables
  blocks/
    registry.ts              # Map type -> BlockDefinition
    header/
      schema.ts              # zod schema của payload
      render.tsx             # Hiển thị (server-safe, không dùng hook client)
      editor.tsx             # Form chỉnh sửa trong admin
    link-list/
    image/
    ...
```

Kiểu khai báo của một khối:

```ts
// src/features/renderer/blocks/registry.ts
import type { z } from "zod";
import type { ComponentType } from "react";

export interface BlockDefinition<P> {
  type: string;
  label: string;                 // "Ảnh", "Danh sách liên kết"...
  icon: ComponentType;
  payloadSchema: z.ZodType<P>;   // validate chặt từng trường
  defaults: P;
  Render: ComponentType<{ payload: P; style: BlockStyle; ctx: RenderContext }>;
  Editor: ComponentType<{ value: P; onChange: (p: P) => void }>;
  migrate?: (raw: unknown, fromVersion: number) => P;
}
```

Những gì cần làm:

- `PageRenderer` nhận `{ theme, blocks, mode: "preview" | "public" }`. Ở chế độ `preview` thì bọc thêm lớp kéo thả/chọn khối; ở chế độ `public` thì render thuần, không thêm gì.
- `LivePreview` và `PublicPageView` chỉ còn là lớp vỏ gọi `PageRenderer`.
- `saveDraftSchema.blocks` validate payload qua `registry[type].payloadSchema`, thay cho `z.record(z.any())`.

### 3.2. Theme v2: Design tokens

Thay cấu trúc phẳng hiện tại bằng một cây token:

```ts
export interface ThemeTokensV2 {
  version: 2;
  colors: {
    background: string;   // #RRGGBB
    surface: string;      // nền thẻ/nút
    text: string;
    textMuted: string;
    accent: string;
    border: string;
  };
  background: {
    type: "solid" | "gradient" | "image";
    gradient?: { kind: "linear" | "radial"; angle: number; stops: { color: string; at: number }[] };
    imageMediaId?: string;        // chỉ nhận ảnh từ media_assets
    overlay?: { color: string; opacity: number };
    blur?: 0 | 4 | 8 | 16;
  };
  typography: {
    bodyFont: FontId;             // danh sách font cho phép (whitelist)
    headingFont: FontId;
    baseSize: 14 | 15 | 16 | 17 | 18;
    headingWeight: 500 | 600 | 700 | 800;
    letterSpacing: "tight" | "normal" | "wide";
  };
  shape: {
    radius: "none" | "sm" | "md" | "lg" | "full";
    borderWidth: 0 | 1 | 2;
    shadow: "none" | "sm" | "md" | "lg" | "glow";
  };
  button: {
    variant: "filled" | "outline" | "soft" | "glass" | "underline";
    iconPosition: "left" | "right" | "none";
    hoverEffect: "none" | "lift" | "scale" | "shine";
  };
  layout: {
    maxWidth: 420 | 520 | 640;
    density: "compact" | "comfortable" | "spacious";
    align: "center" | "left";
  };
  colorScheme: "fixed" | "auto";  // auto: tôn trọng light/dark của thiết bị
  darkOverrides?: Partial<ThemeTokensV2["colors"]>;
}
```

Chuyển token thành CSS variables, gắn ở phần tử gốc của trang:

```ts
export function themeToCssVars(t: ThemeTokensV2): React.CSSProperties {
  return {
    "--gp-bg": t.colors.background,
    "--gp-surface": t.colors.surface,
    "--gp-text": t.colors.text,
    "--gp-accent": t.colors.accent,
    "--gp-radius": RADIUS_MAP[t.shape.radius],
    "--gp-shadow": SHADOW_MAP[t.shape.shadow],
    "--gp-font-body": FONT_MAP[t.typography.bodyFont],
    "--gp-gap": DENSITY_MAP[t.layout.density],
    // ...
  } as React.CSSProperties;
}
```

Component chỉ dùng class kiểu `bg-[var(--gp-surface)] rounded-[var(--gp-radius)]`, không cần `style={...}` rải rác. Hiện [public-page-view.tsx](../src/features/public/components/public-page-view.tsx) đang có khoảng 9 chỗ inline style.

**Chuyển đổi dữ liệu:** viết `migrateThemeV1toV2(old: PageThemeConfig): ThemeTokensV2`. Hàm này chạy khi đọc theme (lazy migration) và được dùng trong script chuyển đổi hàng loạt. Preset cũ (`go-original`, `beacons-*`) được chuyển thành preset v2 tương đương.

### 3.3. Style riêng cho từng khối

Mỗi block có thêm trường `style`, tách khỏi `payload`. Tất cả đều là giá trị trong whitelist:

```ts
export interface BlockStyle {
  width?: "full" | "content";
  align?: "left" | "center" | "right";
  paddingY?: "none" | "sm" | "md" | "lg";
  surface?: "inherit" | "transparent" | "accent" | "custom";
  customSurface?: string;          // #RRGGBB, chỉ dùng khi surface = "custom"
  buttonVariant?: ThemeTokensV2["button"]["variant"];  // ghi đè theme
  animation?: "none" | "fade-up" | "pulse";
  hideOn?: ("mobile" | "desktop")[];
}
```

Lưu ở cột mới `page_blocks.style jsonb` (xem mục 5).

### 3.4. Bổ sung loại khối mới (v2)

Danh sách xếp theo mức ưu tiên cho thương hiệu F&B:

| Khối | Mô tả | Lưu ý |
| --- | --- | --- |
| `button` | Một nút CTA lớn, nổi bật (đặt món, gọi điện) | Dùng chung cơ chế đo click `/r/{id}` |
| `gallery` | Lưới hoặc carousel ảnh | Ảnh chỉ lấy từ `media_assets` |
| `video_embed` | YouTube / TikTok | **Whitelist domain**, render `iframe` có `sandbox` và `loading="lazy"` |
| `menu_card` | Thẻ món: ảnh, tên, giá, nhãn "Bán chạy" | Rất phù hợp quán cafe |
| `accordion` | FAQ, giờ mở cửa, chính sách | Text thuần, không nhận HTML |
| `map` | Địa chỉ + nút mở Google Maps | Mở link ngoài, không nhúng API key |
| `countdown` | Đếm ngược khuyến mãi | Render phía client |
| `columns` | Chia 2 cột chứa các khối con | Làm sau cùng vì cần lưu dạng cây (nested) |

Mỗi khối mới chỉ cần: thêm thư mục trong `blocks/`, đăng ký vào `registry.ts`, cập nhật CHECK constraint trong DB.

### 3.5. Trải nghiệm editor

1. **Thư viện mẫu (Template gallery):** chọn mẫu hoàn chỉnh (theme + bộ khối mẫu), sau đó sửa tiếp.
2. **Lưu theme thành preset riêng:** nút "Lưu thành mẫu của tôi" ghi vào bảng `theme_presets`, dùng lại được cho các trang khác.
3. **Bảng điều khiển theme chia nhóm:** Màu sắc · Nền · Chữ · Hình khối · Nút · Bố cục. Mỗi nhóm có nút "Khôi phục mặc định".
4. **Bộ chọn màu thông minh:**
   - Tự gợi ý bảng màu từ ảnh avatar/banner (trích màu chủ đạo).
   - **Kiểm tra độ tương phản WCAG** giữa chữ và nền; cảnh báo khi dưới 4.5:1 và gợi ý màu thay thế.
5. **Xem trước theo thiết bị:** chuyển Mobile / Tablet / Desktop, Sáng / Tối.
6. **Hoàn tác / làm lại (Undo/Redo)** cho toàn bộ trạng thái editor (lịch sử khoảng 50 bước).
7. **Chọn khối trực tiếp trên preview:** click vào khối trong preview để mở form chỉnh sửa của khối đó.
8. **Sao chép khối / sao chép trang.**

### 3.6. Khả năng thích ứng (Adaptive)

- **Container queries** (Tailwind v4 có sẵn `@container`) để khối tự đổi bố cục theo độ rộng khung, không phụ thuộc màn hình. Ví dụ: `link_list` dạng grid tự chuyển từ 2 cột về 1 cột.
- **Tự tính màu chữ trên nền:** hàm `getReadableTextColor(bg)` thay cho việc khai báo cứng `textOnCard` trong `PRIMARY_COLOR_PALETTE`.
- **Chế độ sáng/tối tự động:** khi `colorScheme = "auto"` thì dùng `@media (prefers-color-scheme: dark)` kết hợp `darkOverrides`.
- **Giảm chuyển động:** tắt animation khi người xem bật `prefers-reduced-motion`.
- **Font:** tải qua `next/font` theo danh sách whitelist, subset `vietnamese`, chỉ nạp font mà trang thực sự dùng.
- **Ảnh nền:** dùng `next/image` với `sizes` phù hợp; tạo ảnh blur placeholder.

### 3.7. Bảo mật khi mở rộng tùy biến

| Rủi ro | Biện pháp |
| --- | --- |
| Chèn CSS qua giá trị màu/gradient | Màu validate bằng regex `^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$`; gradient dựng từ `stops` có cấu trúc, **bỏ hẳn chuỗi `backgroundGradient` tự do** |
| Ảnh từ domain lạ / tracking pixel | Ảnh chỉ tham chiếu `media_assets.id`, không nhận URL ngoài |
| Nhúng iframe độc hại | Whitelist domain (`youtube.com`, `youtube-nocookie.com`, `tiktok.com`) + parse ID video + thuộc tính `sandbox` |
| Văn bản chứa HTML | Tiếp tục render text thuần (đã có `renderLnkBioFormattedText`) |
| Payload phình to | Giới hạn số khối mỗi trang (ví dụ 100), độ dài text, số stop gradient (tối đa 5) |
| Giá trị lạ gửi trực tiếp vào server action | Toàn bộ schema dùng `.strict()`, validate ở server action trước khi ghi DB |

---

## 4. Lộ trình triển khai theo giai đoạn

> Thời lượng là **ước tính** cho 1 lập trình viên quen dự án, chưa gồm thời gian duyệt thiết kế.

### Giai đoạn 1 — Nền móng: hợp nhất renderer (≈ 4–6 ngày)

Giao diện bên ngoài không thay đổi, chỉ tái cấu trúc bên trong.

- [x] Tạo `src/features/renderer/` và `PageRenderer` dùng chung (16/11/2026).
- [x] Chuyển 8 khối hiện có sang Block Registry: render + schema payload. _Phần form chỉnh sửa (editor) của từng khối vẫn nằm trong `block-item-editor.tsx`, sẽ tách dần._
- [x] Thay phần render trong `LivePreview` và `PublicPageView` bằng `PageRenderer`.
- [x] Thay `payload: z.record(z.any())` bằng validate theo từng loại khối (`renderer/blocks/payload-schemas.ts`), giới hạn 32 KB/khối và 200 khối/trang.
- [x] Test cho adapter, registry, chế độ public/preview, validate payload (`tests/unit/renderer.test.tsx`).
- [ ] So sánh ảnh chụp trang thật trước/sau bằng Playwright trên bản deploy preview.

**Thay đổi hiển thị có chủ đích khi hợp nhất** (trước đây preview và trang thật lệch nhau):

| Hạng mục | Trước | Sau |
| --- | --- | --- |
| Bo góc nút, kính mờ, bố cục lưới, nền mờ (`backgroundVariant`) | Chỉ hiện trong preview, trang thật bỏ qua | Trang thật áp dụng đúng như đã chọn |
| Khối khoảng trống (`height: "sm".."xl"`) | Trang thật cao 0px (lỗi) | 10 / 20 / 32 / 48 px như preview |
| Kiểu đường kẻ (nét đứt, chấm) | Trang thật luôn nét liền | Áp dụng đúng kiểu |
| Huy hiệu "@gocafe.official" + dấu tích xanh | Chỉ có trong preview | Bỏ (trang thật chưa từng có) |
| Bố cục đáp ứng | Theo độ rộng màn hình (`sm:`) | Theo độ rộng khung (container query), preview 375px giống điện thoại thật |

**Kết quả:** từ giai đoạn này, mỗi tính năng mới chỉ cần code 1 lần.

### Giai đoạn 2 — Theme v2 và CSS variables (≈ 4–5 ngày)

- [ ] Định nghĩa `ThemeTokensV2` + zod schema `.strict()`.
- [ ] Viết `themeToCssVars()` và chuyển component sang dùng `var(--gp-*)`.
- [ ] Viết `migrateThemeV1toV2()` và script chuyển đổi dữ liệu (chạy thử trên bản backup production).
- [ ] Chuyển 3 preset hiện có sang v2; bổ sung các preset đã nêu trong phạm vi v1 nhưng chưa làm (Minimalist Light, Modern Clean, Vibrant Contrast).
- [ ] Tăng `schema_version` lên 2 cho revision mới.

### Giai đoạn 3 — Editor tùy biến (≈ 6–8 ngày)

- [ ] Bảng điều khiển theme chia nhóm (mục 3.5).
- [ ] Kiểm tra tương phản WCAG và gợi ý màu.
- [ ] Trích bảng màu từ ảnh avatar/banner.
- [ ] Xem trước theo thiết bị và sáng/tối.
- [ ] Undo/Redo.
- [ ] Bảng `theme_presets` + "Lưu thành mẫu của tôi" + thư viện mẫu.

### Giai đoạn 4 — Style từng khối và khối mới (≈ 6–10 ngày)

- [ ] Cột `page_blocks.style` + `BlockStyle` + form style chung cho mọi khối.
- [ ] Khối `button`, `gallery`, `menu_card`, `accordion`, `video_embed`, `map`.
- [ ] Animation nhẹ, `hideOn` theo thiết bị.
- [ ] (Sau cùng) khối `columns` lồng nhau.

### Giai đoạn 5 (tùy chọn) — Mở cho nhiều người dùng tự quản trang (≈ 10–15 ngày)

Chỉ cần nếu "người dùng" là **khách hàng bên ngoài** tự đăng ký và tự thiết kế trang của họ, không phải nhân viên quản trị nội bộ. Đây là thay đổi lớn về mô hình:

- [ ] Bảng `workspaces` + `workspace_members (role: owner | editor | viewer)`.
- [ ] Thêm `workspace_id` cho `pages`, `links`, `media_assets`, `theme_presets`.
- [ ] Viết lại toàn bộ **RLS policy** theo `workspace_id` thay cho `is_admin()`.
- [ ] Bật đăng ký công khai + xác thực email + giới hạn (quota) số trang, dung lượng media.
- [ ] Trang quản trị hệ thống (super admin) tách biệt.
- [ ] Rà soát lại [quyết định phạm vi P01.04](./quyet-dinh-pham-vi-va-dau-vao.md) (hiện đang tắt đăng ký công khai).

---

## 5. Thay đổi database

Tạo migration mới, ví dụ `supabase/migrations/20261120000001_customization_v2.sql`:

```sql
-- 1. Style riêng cho từng khối
ALTER TABLE public.page_blocks
  ADD COLUMN IF NOT EXISTS style jsonb NOT NULL DEFAULT '{}'::jsonb
  CHECK (jsonb_typeof(style) = 'object');

-- 2. Mở rộng loại khối
ALTER TABLE public.page_blocks DROP CONSTRAINT IF EXISTS page_blocks_type_check;
ALTER TABLE public.page_blocks ADD CONSTRAINT page_blocks_type_check CHECK (type IN (
  'header','image','heading','text','link_list','social_icons','spacer','divider',
  'button','gallery','video_embed','menu_card','accordion','map','countdown'
));

-- 3. Preset giao diện do người dùng lưu
CREATE TABLE IF NOT EXISTS public.theme_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
  tokens jsonb NOT NULL CHECK (jsonb_typeof(tokens) = 'object'),
  schema_version integer NOT NULL DEFAULT 2,
  is_system boolean NOT NULL DEFAULT false,
  thumbnail_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

ALTER TABLE public.theme_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY theme_presets_admin_all ON public.theme_presets
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
```

> Kiểm tra tên CHECK constraint thực tế trong DB trước khi `DROP` (`\d page_blocks`). Sau khi migrate, nhớ cập nhật [database.generated.ts](../src/types/database.generated.ts) và các RPC xuất bản trong `20261106000005_rpc_functions.sql` để sao chép cột `style` khi tạo revision mới.

---

## 6. Danh sách file bị ảnh hưởng

| File | Thay đổi |
| --- | --- |
| [src/config/themes.ts](../src/config/themes.ts) | Thêm token v2, preset v2, hàm migrate; `resolveTheme` gọn lại thành deep-merge có validate |
| [src/features/pages/types.ts](../src/features/pages/types.ts) | `BlockType`, `BlockStyle`, `PageThemeConfig` v2 |
| [src/features/pages/schemas.ts](../src/features/pages/schemas.ts) | Schema chặt theo registry và theme v2 |
| [src/features/pages/actions.ts](../src/features/pages/actions.ts) | Lưu/đọc `style`, `schema_version` |
| [live-preview.tsx](../src/features/pages/components/editor/live-preview.tsx) | Rút gọn, dùng `PageRenderer` |
| [public-page-view.tsx](../src/features/public/components/public-page-view.tsx) | Rút gọn, dùng `PageRenderer` |
| [theme-editor.tsx](../src/features/pages/components/editor/theme-editor.tsx) | Viết lại theo nhóm token |
| [block-item-editor.tsx](../src/features/pages/components/editor/block-item-editor.tsx) | Lấy editor từ registry + form style chung |
| [page-editor.tsx](../src/features/pages/components/editor/page-editor.tsx) | Undo/Redo, chế độ thiết bị, chọn khối trên preview |
| `supabase/migrations/*` | Migration mục 5 |
| `tests/unit/*` | Test cho registry, migrate theme, validate, tương phản |

---

## 7. Kiểm thử và nghiệm thu

- [ ] Toàn bộ trang đang xuất bản hiển thị **giống hệt** trước nâng cấp (snapshot / so sánh ảnh chụp bằng Playwright).
- [ ] Revision cũ (`schema_version = 1`) vẫn render đúng mà không cần xuất bản lại.
- [ ] Preview trong editor và trang công khai giống nhau ở mọi tổ hợp theme.
- [ ] Gửi payload chứa `url(javascript:...)`, `</style>`, màu sai định dạng, domain iframe lạ → server từ chối.
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95 với mỗi preset.
- [ ] Hiển thị đúng ở 320px, 375px, 768px, 1280px; sáng và tối.
- [ ] Thống kê click không bị phân mảnh sau khi đổi khối/theme (giữ nguyên `page_link_id`).

---

## 8. Rủi ro và cách giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
| --- | --- | --- |
| Tái cấu trúc renderer làm lệch giao diện trang đang chạy | Cao | Làm giai đoạn 1 tách riêng, có snapshot test, deploy preview trên Vercel trước |
| Migrate theme sai làm vỡ trang | Trung bình | Lazy migration + giữ nguyên dữ liệu v1; chạy thử trên bản backup (`scripts/backup-production.mjs`) |
| Quá nhiều tùy chọn khiến người dùng rối | Trung bình | Mặc định dùng template; ẩn các tùy chọn nâng cao trong mục "Nâng cao" |
| Font/ảnh làm chậm trang | Trung bình | Whitelist font, subset tiếng Việt, `next/image`, giới hạn dung lượng upload |
| Giai đoạn 5 (đa người dùng) thay đổi bảo mật | Cao | Làm sau cùng, review RLS riêng, viết test phân quyền cho từng bảng |

---

## 9. Đề xuất thứ tự ưu tiên

1. **Bắt buộc làm trước:** Giai đoạn 1 và 2. Nếu chưa có hai giai đoạn này, mọi tính năng tùy biến sau đều tốn gấp đôi công sức và dễ lỗi.
2. **Giá trị thấy ngay với người dùng:** Giai đoạn 3 (editor) và khối `button`, `gallery`, `menu_card` trong giai đoạn 4.
3. **Chỉ làm khi có nhu cầu kinh doanh rõ ràng:** Giai đoạn 5 (cho khách hàng bên ngoài tự tạo trang).
