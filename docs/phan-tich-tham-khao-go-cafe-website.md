# Phân tích Chi tiết 3 Trang Tham chiếu `go-cafe.com` & Thiết kế Chuyển đổi sang Platform CMS

> **Phạm vi khảo sát:**
>
> - Trang chủ: `https://go-cafe.com/`
> - Cẩm nang Nhượng quyền: `https://go-cafe.com/nhuong-quyen/`
> - Cà Phê Bột / Xưởng rang: `https://go-cafe.com/xuong-rang-ca-phe/`
> - Kết hợp tham chiếu trang Danh sách chi nhánh: `https://go-cafe.com/danh-sach-chi-nhanh/`

---

## 1. Đánh giá tổng quan website `go-cafe.com` hiện tại

Website hiện tại được xây dựng bằng **WordPress + Elementor + WooCommerce**. Qua rà soát kỹ thuật thực tế, hệ thống cũ tồn tại 5 vấn đề lớn cản trở việc tự vận hành:

1. **Quá nặng & dư thừa chức năng không dùng tới:** Tải toàn bộ WooCommerce và thư viện nhà hàng mẫu (vẫn còn sót form _"Đặt bàn"_ + _"Yêu cầu đặc biệt"_ ẩn trên mọi trang và thẻ `H1: HomePage II` trên trang chủ), trong khi đơn hàng thực tế đã đẩy sang Shopee, TikTok Shop và iPOS.
2. **Khó tự chỉnh sửa nội dung:** Trang _Nhượng quyền_ phải ghép thủ công **116 widget Elementor rời rạc** (79 heading, 19 image, 6 icon-list, 6 image-box...). Khi người không chuyên tự sửa rất dễ lệch căn lề hoặc vỡ hiển thị trên điện thoại.
3. **Chưa có tính tương tác ở trang Chi nhánh:** Bản đồ đang nhúng `<iframe>` Google My Maps tĩnh — không bấm được pin để nhảy sang danh sách bên cạnh, không tìm kiếm lọc theo tên đường/quận đồng bộ với bản đồ.
4. **Thiếu chuẩn hoá hệ thống màu & font:** Font chữ và kích cỡ giữa các trang (_Trang chủ_, _Nhượng quyền_, _Xưởng rang_) chưa thống nhất theo định hướng mới (**Trắng – Đen – Vàng đồng + Lexend Deca**).
5. **Chưa có luồng thu thập khách hàng tiềm năng (Lead) bài bản:** Form liên hệ chung chưa tách rõ theo nhu cầu (_Nhận mẫu thử / Báo giá sỉ / Tư vấn nhượng quyền / Ứng tuyển_) và chưa lưu tập trung để theo dõi chuyển đổi.

---

## 2. Phân tích cấu trúc chi tiết từng trang tham chiếu

### 2.1. Khung điều hướng chung (Site Shell) trên toàn bộ `go-cafe.com`

- **Thanh Menu (Navbar) hỗ trợ 2 cấp (Dropdown):**
  - Cấp 1: _Về Gờ cafe_, _Danh sách chi nhánh_, _Menu_, _Xưởng Rang_, _Tuyển dụng_, _Liên hệ_...
  - Cấp 2 (ví dụ dưới _Tuyển dụng_): _Tại cửa hàng_, _Câu hỏi thường gặp_.
  - Theo yêu cầu mới của Gờ Café, bộ 8 tab đề xuất:
    1. Trang chủ
    2. Về chúng tôi
    3. Hệ thống quán
    4. Menu thức uống
    5. Cà phê rang xay
    6. Dành cho chủ quán _(Nhượng quyền / B2B)_
    7. Tuyển dụng
    8. Liên hệ
- **Chân trang (Footer) 3 cột:**
  - Cột 1: _Thông tin_ (Công ty TNHH Gờ Cafe, GPKD, địa chỉ trụ sở).
  - Cột 2: _Liên kết_ (Công bố sản phẩm, Chính sách, Câu hỏi thường gặp).
  - Cột 3: _Liên hệ_ (Hotline, Email, Mạng xã hội).
- **Cụm nút nổi cố định (Floating Contact):** Nút **Zalo** & **Gọi điện** ở góc dưới phải màn hình.

### 2.2. Trang Nhượng quyền (`go-cafe.com/nhuong-quyen/`)

Đây là mẫu **Landing Page dạng Cẩm nang dài (Long-form Guide)**, gồm 6 lớp nội dung nối tiếp nhau:

| Thứ tự | Phần nội dung trên `go-cafe.com`                                                                                                                             | Đặc điểm hiển thị                                       | Khối tương ứng trong CMS mới      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------- |
| 1      | **Banner mở đầu**: _"Cẩm nang Nhượng quyền thương hiệu — Gờ càfê bắt đầu nhượng quyền từ 2023"_                                                              | Tiêu đề lớn + ảnh thương hiệu sắc nét                   | `hero_section`                    |
| 2      | **Mục lục nhảy mục**: _Về Gờ Càfê → Gờ Càfê nhượng quyền → Cách thức hợp tác → Vận hành_                                                                     | Nhóm liên kết neo bấm vào cuộn thẳng tới phần tương ứng | `toc_bar` _(Mục lục neo)_         |
| 3      | **Triết lý & Tầm nhìn**: _"Cafe không phải là mặt hàng xa xỉ"_, _"Người Việt xứng đáng uống cafe tốt hơn"_                                                   | Bố cục 2 cột Ảnh – Chữ xen kẽ trái/phải                 | `split_content`                   |
| 4      | **Thông số mô hình quán**: _Mức giá (Trung cấp), Không gian mở, Diện tích (60–150m²), Thức uống chủ đạo (Cà phê, Yogurt), Đối tượng khách hàng, Địa điểm mở_ | Lưới thẻ thông số ngắn gọn, dễ quét mắt (2–3 cột)       | `info_cards`                      |
| 5      | **Hỗ trợ, Ràng buộc & Các bước hợp tác**                                                                                                                     | Danh sách có icon / đánh số từng bước 1–2–3–4           | `steps_timeline` / `feature_grid` |
| 6      | **Kêu gọi đăng ký tư vấn nhượng quyền**                                                                                                                      | Form để lại Tên, SĐT, Khu vực dự kiến mở quán           | `lead_form`                       |

### 2.3. Trang Cà Phê Bột / Xưởng rang (`go-cafe.com/xuong-rang-ca-phe/`)

Đây là mẫu **Landing Page Bán hàng B2B/B2C & Báo giá sỉ**, gồm 6 lớp nội dung:

| Thứ tự | Phần nội dung trên `go-cafe.com`                                                                | Đặc điểm hiển thị                                                                                                                    | Khối tương ứng trong CMS mới            |
| ------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| 1      | **Giới thiệu Xưởng rang**: _"Cà phê mộc, không tẩm ướp, rang xay trong vòng 72H"_               | Hero 2 cột (chữ + ảnh xưởng rang / túi cà phê)                                                                                       | `hero_section`                          |
| 2      | **Dải chỉ số uy tín**: _TOP 1 Shopee (98% 5 sao) \| 40+ Cửa hàng TP.HCM \| Có xưởng rang riêng_ | 3–4 cột con số lớn nổi bật (màu vàng đồng nhấn)                                                                                      | `stats_strip`                           |
| 3      | **Cà phê của Gờ được tạo thành từ...**                                                          | Đoạn chữ + 3–4 gạch đầu dòng giá trị cốt lõi + ảnh minh hoạ                                                                          | `split_content`                         |
| 4      | **Bảng Báo Giá Sỉ** _(hiệu lực từ ngày...)_                                                     | Bảng đa cột: `LOẠI CÀ PHÊ` \| `MÔ TẢ` \| `20KG` \| `10KG` \| `5KG` (Cổ điển, Truyền thống, Hiện đại...); vuốt ngang mượt trên mobile | `pricing_table` _(Bảng báo giá đa cột)_ |
| 5      | **Cam kết & Quyền lợi khách hàng**                                                              | Lưới thẻ 2–3 cột với tiêu đề đậm và mô tả ngắn                                                                                       | `feature_grid`                          |
| 6      | **CTA mua lẻ & nhận mẫu thử sỉ**                                                                | Nút dẫn Shopee / TikTok Shop + Form đăng ký nhận mẫu thử miễn phí                                                                    | `button` + `lead_form`                  |

### 2.4. Trang Hệ thống Chi nhánh (`go-cafe.com/danh-sach-chi-nhanh/`)

- **Bố cục 2 cột trên Desktop (xếp dọc trên Mobile):**
  - Cột trái (60%): Bản đồ tương tác **Leaflet + OpenStreetMap** hiển thị cụm pin logo tròn đen của Gờ Café.
  - Cột phải (40%): Ô tìm kiếm theo **tên quán / tên đường / quận** (không phân biệt dấu tiếng Việt) + bộ lọc Quận + danh sách thẻ chi nhánh (Địa chỉ, Giờ mở cửa, SĐT, nút Chỉ đường Google Maps).
- **Đồng bộ 2 chiều:** Bấm pin trên bản đồ → tự cuộn & highlight thẻ quán bên phải; bấm thẻ quán bên phải → bản đồ tự zoom mượt đến đúng pin quán đó.

---

## 3. Đặc tả các Khối Section mới cần xây dựng trong Platform CMS

Để người vận hành tự lắp ghép được **100% các trang trên mà không cần đụng code**, cần bổ sung nhóm Section dành riêng cho `page_kind = 'landing'` (tách biệt với 14 khối của `page_kind = 'profile'`):

| Mã khối (`type`) | Tên hiển thị trong Editor       | Cấu trúc Payload chính                                                                                                                                                      |
| ---------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hero_section`   | **Banner mở đầu (Hero)**        | `eyebrow`, `title`, `subtitle`, `imageUrl`, `layout` (`split` \| `centered` \| `full-bg`), `primaryCta`, `secondaryCta`                                                     |
| `toc_bar`        | **Mục lục nhảy mục (TOC)**      | `title`, `items: [{ label, anchorId }]`, `sticky: boolean`                                                                                                                  |
| `stats_strip`    | **Dải chỉ số nổi bật**          | `items: [{ value, label, sublabel }]`, `columns` (`3` \| `4`)                                                                                                               |
| `split_content`  | **Khối 2 cột Ảnh – Chữ**        | `anchorId`, `imagePosition` (`left` \| `right`), `imageUrl`, `eyebrow`, `title`, `content` (RichText), `cta`                                                                |
| `info_cards`     | **Lưới thẻ thông số / Cam kết** | `anchorId`, `title`, `subtitle`, `columns` (`2` \| `3` \| `4`), `variant` (`card` \| `steps`), `items: [{ badge, title, description, icon }]`                               |
| `pricing_table`  | **Bảng báo giá đa cột**         | `anchorId`, `title`, `effectiveNote`, `columns: string[]` (VD: `["20KG", "10KG", "5KG"]`), `rows: [{ name, subtitle, description, prices: string[], highlight?: boolean }]` |
| `product_grid`   | **Lưới sản phẩm / Menu**        | `anchorId`, `title`, `categories: string[]`, `items: [{ name, category, price, imageUrl, description, buyUrl }]`                                                            |
| `store_locator`  | **Bản đồ hệ thống chi nhánh**   | `title`, `showSearch`, `showDistrictFilter`, `defaultZoom` _(dữ liệu lấy tự động từ bảng `branches`)_                                                                       |
| `lead_form`      | **Form thu thập SĐT / Đăng ký** | `anchorId`, `formName`, `title`, `subtitle`, `submitLabel`, `successMessage`, `fields` (`fullName`, `phone`, `email`, `note`), `enablePopup`                                |

---

## 4. Định hướng Design System cho Website Gờ Café

Dựa đúng yêu cầu thẩm mỹ từ chị Ánh (_"đơn giản, chữ không đuôi Lexend, tông màu trắng, đen, có điểm vàng đồng"_):

| Token                           | Giá trị đề xuất                                                            | Ứng dụng                                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Font chính (Heading & Body)** | `Lexend Deca` _(đã tích hợp sẵn trong hệ thống)_                           | Không chân, hiện đại, cực dễ đọc tiếng Việt ở mọi kích cỡ                                                                 |
| **Nền chính (Background)**      | `#FFFFFF` (xen kẽ section nền nhạt `#F8F7F4`)                              | Tạo độ thoáng, phân tách rõ giữa các section không cần đường kẻ nặng                                                      |
| **Chữ chính & Nút chính**       | `#111111` (Đen than) & `#52525B` (Xám đậm cho mô tả)                       | Tương phản cao, sang trọng, chuẩn WCAG AAA                                                                                |
| **Màu điểm nhấn (Accent)**      | `#B88A44` (Vàng đồng Gờ Café)                                              | Dùng tiết chế cho nhãn nhỏ (`eyebrow`), con số nổi bật (`TOP 1`, `55+`), giá tiền, viền nhấn & đường gạch chân active tab |
| **Bo góc & Khoảng cách**        | Card `rounded-2xl`, Nút `rounded-xl`, khoảng cách section `py-14 md:py-20` | Gọn gàng, tinh tế, tối ưu đọc trên cả Desktop (`max-w-6xl`) lẫn Mobile                                                    |

---

## 5. So sánh nhanh: Website WordPress cũ vs Platform CMS mới

| Tiêu chí                       | WordPress + Elementor cũ (`go-cafe.com`)            | Platform CMS mới (`gocafe.profile` nâng cấp)                                         |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Tốc độ tải trang**           | Nặng (WooCommerce + Elementor + nhiều plugin)       | Cực nhanh (Next.js SSR + Cache Components + CDN ảnh)                                 |
| **Tự thêm/sửa Tab & Nội dung** | Dễ vỡ bố cục trên mobile khi kéo thả Elementor      | Lắp ghép theo Section & Template chuẩn — không bao giờ vỡ layout                     |
| **Bản đồ 55 chi nhánh**        | Iframe tĩnh, không search/nhảy 2 chiều              | Tương tác 2 chiều Map ⇄ List, tìm đường/quận tức thì, phí API 0đ                     |
| **Thu thập & quản lý SĐT**     | Form rời rạc, còn sót form Đặt bàn cũ               | Form chuyên biệt theo từng trang + quản lý tập trung tại `/admin/leads` + xuất Excel |
| **Quản lý Profile + Website**  | Phải dùng 2 hệ thống tách rời (Lnk.Bio + WordPress) | **1 nền tảng duy nhất**, dùng chung kho Ảnh, kho Liên kết, Báo cáo & Phân quyền      |

---

## 6. Checklist chuyển đổi nội dung (Migration Plan)

1. **Bước 1 — Dựng khung & Preset:** Kích hoạt `page_kind = 'landing'` + Preset **Gờ Minimal Luxury** (`#FFFFFF` / `#111111` / `#B88A44` + `Lexend Deca`).
2. **Bước 2 — Cấu hình Site Shell:** Thiết lập 8 tab điều hướng + Footer 3 cột + Nút Zalo/Gọi nổi.
3. **Bước 3 — Chuyển 4 trang trọng tâm trước:**
   - _Trang chủ_ (`/trang-chu`)
   - _Cà phê rang xay_ (`/xuong-rang-ca-phe` — nhập Bảng báo giá sỉ 20kg/10kg/5kg)
   - _Dành cho chủ quán / Nhượng quyền_ (`/nhuong-quyen` — gắn Mục lục neo & Form tư vấn)
   - _Hệ thống quán_ (`/he-thong-quan` — import CSV 55 chi nhánh lên Bản đồ 2 chiều)
4. **Bước 4 — Hoàn thiện 4 trang còn lại:** _Về chúng tôi_, _Menu thức uống_, _Tuyển dụng_, _Liên hệ_.
5. **Bước 5 — Bàn giao & Trỏ tên miền:** Kiểm tra SEO (`metaTitle`, `metaDescription`, `ogImage`), redirect 308 cho các URL cũ từ `go-cafe.com` để không mất thứ hạng Google.
