# Hướng dẫn Sử dụng Hệ thống Quản trị CMS Gờ Cafe Profile

Tài liệu hướng dẫn dành cho Quản trị viên và Đội ngũ Vận hành / Marketing của chuỗi Gờ Cafe.  
Múi giờ chuẩn hệ thống: `Asia/Ho_Chi_Minh` (UTC+7).

---

## 1. Đăng nhập và Khung quản trị

### 1.1. Truy cập hệ thống

- **Địa chỉ đăng nhập:** `https://profile.gocafe.vn/login` (hoặc `http://localhost:3000/login` trên môi trường nội bộ).
- **Tài khoản:** Được cấp phát bởi Quản trị viên kỹ thuật (Public Signup bị tắt để đảm bảo an toàn tuyệt đối cho thương hiệu).
- **Điều kiện đăng nhập hợp lệ:** Tài khoản phải được kích hoạt cờ `is_active = true` trong danh sách `admin_users`.

### 1.2. Tổng quan Bảng điều khiển (Dashboard)

Tại trang `/admin`, hệ thống cung cấp các chỉ số nhanh:

- **Số trang công khai đang hoạt động:** Tổng số trang profile đã xuất bản (`published`).
- **Tổng số liên kết trong kho:** Số lượng link chiến dịch, mạng xã hội, hotline, đặt hàng.
- **Tổng lượt tương tác (Clicks):** Tổng số lượt nhấp chuột hợp lệ do khách hàng thực hiện.
- **Trạng thái bảo mật:** Phiên làm việc SSR, xác thực bảo vệ dữ liệu.

---

## 2. Quản lý Kho Liên kết tập trung (`/admin/links`)

Hệ thống quản lý liên kết theo mô hình **Kho tập trung**. Một liên kết (ví dụ: Link ShopeeFood, Hotline, Fanpage) có thể được gắn vào nhiều trang khác nhau cùng lúc.

### 2.1. Thêm mới liên kết

1. Nhấp nút **+ Thêm liên kết**.
2. Nhập các thông tin:
   - **Tên hiển thị nội bộ:** Tên dễ nhận biết (ví dụ: _Đặt hàng ShopeeFood - Chi nhánh Q1_).
   - **Loại liên kết (Kind):**
     - `standard`: Liên kết web thông thường (`https://...`).
     - `social`: Liên kết mạng xã hội (TikTok, Facebook, Instagram...).
     - `contact`: Hotline hoặc Email (`tel:1900xxxx`, `mailto:...`).
   - **URL đích (Target URL):** Địa chỉ đích khi người dùng nhấp vào. Hệ thống tự động kiểm tra định dạng an toàn, chặn các mã độc hại (`javascript:`, `data:`).
   - **Ảnh đại diện mặc định (Thumbnail):** Chọn từ kho ảnh hoặc nhập URL icon.
3. Nhấp **Lưu liên kết**.

### 2.2. Chỉnh sửa URL gốc & Hiệu ứng Lan tỏa tức thì

- Khi một đối tác giao hàng đổi domain hoặc hotline thay đổi, bạn chỉ cần sửa **Target URL** tại kho liên kết này một lần duy nhất.
- **Cơ chế cập nhật:** Thay đổi URL đích sẽ có **hiệu lực tức thời** trên toàn bộ các trang đang đặt liên kết đó mà **không cần phải biên tập hay xuất bản lại từng trang**.
- Hệ thống hiển thị rõ ràng danh sách các trang đang sử dụng liên kết này trước khi bạn bấm lưu.

### 2.3. Bật / Tắt liên kết

- Bạn có thể tạm ẩn một liên kết (ví dụ: chương trình khuyến mãi đã hết hạn) bằng nút gạt **Hoạt động / Tạm dừng**.
- Khi tắt, khách bấm vào nút trên trang sẽ nhận thông báo liên kết tạm dừng phục vụ hoặc được điều hướng an toàn.

---

## 3. Quản lý Kho Hình ảnh số (`/admin/media`)

Kho ảnh lưu trữ tập trung trên Supabase Storage CDN tốc độ cao, hỗ trợ tải trước và phục vụ người dùng di động tối ưu.

### 3.1. Tải ảnh lên

1. Nhấp nút **+ Tải ảnh lên**.
2. Kéo thả hoặc chọn tệp từ máy tính:
   - Định dạng hỗ trợ: `PNG`, `JPG`, `JPEG`, `WEBP`, `SVG`.
   - Giới hạn dung lượng: Tối đa **5MB** cho mỗi ảnh.
3. Ảnh sau khi tải lên sẽ hiển thị ngay trong lưới ảnh kèm đường dẫn CDN tối ưu.

### 3.2. Cơ chế Bảo vệ An toàn — Chống xóa nhầm ảnh đang dùng

- Hệ thống tự động theo dõi xem ảnh có đang được gắn vào bất kỳ Trang (`pages`), Khối (`page_blocks`), Liên kết (`links`) hay Bản lưu trữ (`page_revisions`) nào không.
- Nếu ảnh đang được sử dụng, nút Xóa sẽ tự động khóa lại kèm huy hiệu bảo vệ. Bạn không thể vô tình xóa nhầm ảnh đang hiển thị cho khách hàng.

---

## 4. Quản lý Trang Hồ sơ (`/admin/pages`)

### 4.1. Tạo trang mới

1. Nhấp nút **+ Tạo trang mới**.
2. Điền **Tên trang** (ví dụ: _Tuyển dụng Gờ Cafe_).
3. Hệ thống sẽ tự động đề xuất **Đường dẫn (Slug)** tương ứng (ví dụ: `tuyendung`).
4. Nhấp **Tạo trang** — hệ thống sẽ tự động khởi tạo bản nháp đầu tiên với khối Header mặc định.

### 4.2. Đổi Slug và Bảo vệ Mã QR đã in (Redirect 308)

- Khi bạn đổi slug của trang (ví dụ từ `ca-phe-go` sang `gocafe`), slug cũ sẽ tự động được lưu thành **Alias Chuyển hướng vĩnh viễn (HTTP 308)**.
- **Ý nghĩa thực tế:** Tất cả các ấn phẩm in ấn, tem ly cà phê, standee để bàn có in mã QR cũ **vẫn quét và mở trang bình thường 100%**, không bao giờ bị lỗi 404.

### 4.3. Nhân bản (Duplicate) & Lưu trữ (Archive)

- **Nhân bản:** Tạo bản sao của trang hiện tại với toàn bộ khối, vị trí nút bấm và giao diện để nhanh chóng tạo chiến dịch mới.
- **Lưu trữ (Archive):** Ẩn trang khỏi danh sách quản lý CMS. Lưu ý: Toàn bộ lịch sử nhấp chuột (click events) trong quá khứ vẫn được bảo toàn nguyên vẹn 100% trong báo cáo thống kê.

---

## 5. Trình biên tập Khối (Block Editor) & Cơ chế Xuất bản

Khi bấm vào một trang trong danh sách, bạn sẽ vào giao diện **Trình biên tập chi tiết**:

### 5.1. Bố cục 2 cột trực quan

- **Cột trái:** Danh sách các khối nội dung, công cụ thêm khối, bộ chọn Theme và cài đặt SEO.
- **Cột phải:** Màn hình **Live Preview** thời gian thực mô phỏng giao diện điện thoại thông minh (iPhone/Android) hoặc máy tính. Xem trước giao diện thực tế với màu sắc, font chữ và hình ảnh trung thực.

### 5.2. Các loại khối nội dung hỗ trợ

1. **Khối Header:** Ảnh bìa (Banner), Ảnh đại diện (Avatar), Tên thương hiệu/chi nhánh, Dòng mô tả ngắn (Bio).
2. **Khối Danh sách liên kết (Link List):** Các nút bấm chính (Menu, Đặt hàng, Khuyến mãi).
   - Chọn link từ Kho liên kết chung.
   - Có thể ghi đè (override) nhãn hiển thị hoặc icon riêng cho từng trang.
   - Sắp xếp thứ tự nút bằng nút Mũi tên Lên/Xuống.
3. **Khối Biểu tượng Mạng xã hội (Social Icons):** Hàng icon liên kết tròn gọn gàng (Facebook, TikTok, Instagram, Zalo, YouTube).
4. **Khối Tiêu đề nhóm (Heading):** Chia tách các phân mục (ví dụ: _Hệ thống Cửa hàng_, _Tuyển dụng_).
5. **Khối Văn bản (Text):** Dòng thông báo, địa chỉ hoặc ghi chú ngắn.
6. **Khối Hình ảnh (Image):** Banner quảng bá món mới, poster tuyển dụng.
7. **Khối Khoảng cách (Spacer) & Đường kẻ (Divider):** Giúp tạo khoảng thở và phân cách thẩm mỹ cho bố cục.

### 5.3. Tùy chỉnh Giao diện (Theme)

- Hệ thống áp dụng **Bộ giao diện chuẩn thương hiệu duy nhất của Gờ Cafe (Gờ Signature - Chuẩn Beacons Official)**:
  - Tông màu nền xám cà phê kết hợp hiệu ứng quầng sáng mờ nghệ thuật (Ambient Blurred Background).
  - Khung thẻ và nút bấm viền liền chuẩn Beacons, tối ưu hiển thị trên mọi thiết bị di động.
  - Hỗ trợ công cụ pha màu tự do (Color Picker) và bảng màu gợi ý để bạn có thể tinh chỉnh màu điểm nhấn, màu nút hoặc kiểu dáng khi cần.

### 5.4. Cấu hình SEO & Chia sẻ Mạng xã hội

- Tùy chỉnh **Tiêu đề trang (Meta Title)**, **Mô tả (Meta Description)** và **Ảnh đại diện chia sẻ (OG Image)**.
- Khi gửi link trên Zalo, Facebook, iMessage, link sẽ hiển thị thẻ xem trước (rich card preview) đẹp mắt, chuyên nghiệp.

### 5.5. Cơ chế Bản nháp & Xuất bản Nguyên tử (Atomic Publish)

- **Lưu nháp (Save Draft):** Mọi chỉnh sửa được lưu vào bản nháp độc lập. Khách hàng đang xem trang công khai hoàn toàn **không bị ảnh hưởng**.
- **Chống xung đột (Optimistic Locking):** Nếu có 2 quản trị viên cùng mở chỉnh sửa một trang, hệ thống sẽ cảnh báo xung đột phiên bản khi lưu, tránh ghi đè mất dữ liệu của nhau.
- **Xuất bản (Publish):** Khi đã ưng ý trên màn hình Live Preview, bấm **Xuất bản**.
  - Toàn bộ khối, nút bấm, nhãn và theme sẽ được niêm phong (**sealed revision**) và hoán đổi tức thì.
  - Quá trình diễn ra trong mili-giây, bảo đảm không có trạng thái lỗi giao diện dở dang.

---

## 6. Xem Báo cáo Thống kê & Phân tích (`/admin/reports`)

Hệ thống ghi nhận lượt click trực tiếp phía máy chủ (Server-side tracking), loại trừ bot tự động, cho số liệu chính xác và trung thực nhất.

### 6.1. Bộ lọc Thời gian & Đối tượng

- **Chọn nhanh (Preset):** _Hôm nay_, _7 ngày qua_, _30 ngày qua_, _Tháng này_.
- **Tùy chỉnh ngày:** Chọn khoảng ngày Từ ngày - Đến ngày theo giờ Việt Nam (`UTC+7`).
- **Lọc theo Trang:** Xem hiệu quả của riêng trang `/gocafe`, `/tuyendung` hoặc `/nhuongquyen`.
- **Lọc theo Liên kết:** Xem một đường link cụ thể được bấm bao nhiêu lần trên tất cả các trang.

### 6.2. Các thẻ Chỉ số Tổng quan (KPIs)

- **Tổng lượt Click:** Tổng số lần khách hàng nhấp vào các nút liên kết.
- **Số trang có tương tác:** Số lượng trang profile có phát sinh tương tác.
- **Số liên kết được quan tâm:** Số nút bấm nhận được tương tác trong khoảng thời gian chọn.

### 6.3. Biểu đồ Thời gian (Timeline Chart)

- Biểu đồ cột hiển thị xu hướng nhấp chuột theo từng ngày.
- Rê chuột vào từng cột để xem chính xác số lượt click của ngày đó.

### 6.4. Các bảng Phân rã Dữ liệu

1. **Phân rã theo Trang:** Trang nào đang thu hút lượng truy cập và tương tác cao nhất.
2. **Phân rã theo Liên kết:** Món nào, kênh giao hàng nào (ShopeeFood, Grab, GoFood) được khách hàng chọn nhiều nhất.
3. **Phân rã theo Vị trí Nút (Placement):** Đo lường hiệu quả vị trí nút (Nút số #1 ở đầu trang có tỉ lệ click cao hơn nút số #5 hay không), giúp bạn tối ưu lại thứ tự sắp xếp liên kết trên trang.

---

## 7. Xử lý Tình huống Thường gặp (FAQ)

| Tình huống                                                             | Cách xử lý                                                                                                                                               |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Đã bấm lưu nháp nhưng vào trang xem bằng điện thoại chưa thấy đổi?** | Bản lưu nháp chỉ hiển thị trên màn hình **Live Preview** trong CMS. Để trang công khai cập nhật, bạn cần nhấn nút **Xuất bản (Publish)**.                |
| **Quét mã QR cũ trên ly có bị lỗi khi đổi tên trang không?**           | Không. Hệ thống tự động tạo chuyển hướng vĩnh viễn (308 redirect) từ slug cũ sang slug mới, mã QR cũ vẫn hoạt động vĩnh viễn.                            |
| **Một liên kết bị đổi địa chỉ web thì làm thế nào?**                   | Vào menu **Liên kết (`/admin/links`)**, bấm Sửa liên kết đó và đổi URL mới. Tất cả các trang đang đặt liên kết này sẽ tự động nhận URL mới ngay lập tức. |
| **Lượt click trên Live Preview có bị tính vào báo cáo không?**         | Không. Hệ thống loại trừ hoàn toàn các thao tác xem trước của admin, chỉ ghi nhận tương tác từ khách hàng thật qua link rút gọn `/r/...`.                |
