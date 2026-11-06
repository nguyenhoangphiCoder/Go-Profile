# Tài liệu quyết định phạm vi và đầu vào triển khai (Phase 01)

Ngày lập: 06/11/2026 — múi giờ `Asia/Ho_Chi_Minh`.  
Trạng thái: Đã thống nhất quyết định kỹ thuật và phạm vi phiên bản đầu (v1).  
Căn cứ:

- [Phân tích yêu cầu](./phan-tich-yeu-cau.md)
- [Quy định công nghệ và kiến trúc](./quy-dinh-cong-nghe-va-kien-truc.md)
- [Phân tích và thiết kế database](./phan-tich-database.md)
- [Kế hoạch triển khai](./ke-hoach-trien-khai.md)

---

## 1. Quyết định về cơ chế nháp, xuất bản và đồng bộ liên kết (P01.01)

1. **Cơ chế nháp và xuất bản (Draft & Publish):**
   - Áp dụng nguyên vẹn mô hình phiên bản (`page_revisions`): mỗi trang lưu trữ nhiều revision lịch sử.
   - Bảng `pages` lưu con trỏ `published_revision_id` trỏ vào bản đang hoạt động công khai.
   - Người quản trị thao tác, sửa đổi nội dung, đổi vị trí, đổi theme trên bản nháp (draft) mà không làm ảnh hưởng tới trang công khai đang hiển thị.
   - Thao tác xuất bản (publish) thực hiện trong 1 database transaction: niêm phong revision (`is_sealed = true`, cập nhật `published_at`), gán con trỏ `published_revision_id = new_revision_id`.
   - Ẩn trang (unpublish): Đặt `published_revision_id = NULL`. Khi đó, người ngoài truy cập slug sẽ nhận kết quả 404/trang thông báo chưa xuất bản, nhưng toàn bộ lịch sử revision và thống kê click vẫn được bảo toàn.

2. **Quy tắc cập nhật URL tập trung:**
   - Cập nhật URL gốc tại bảng `links` sẽ có hiệu lực ngay lập tức cho toàn bộ các trang đang tham chiếu đến link đó.
   - Không bắt buộc người quản trị phải xuất bản lại từng trang khi chỉ muốn đổi địa chỉ đích của một liên kết chung (ví dụ đổi đường dẫn ShopeeFood hoặc đổi link Zalo).

3. **Quy tắc nhãn (label) và hình ảnh:**
   - Nhãn ghi đè (`override_label`) và ảnh đại diện/icon liên kết được chốt cố định theo từng revision tại thời điểm xuất bản (`revision_link_placements`).
   - Việc đổi nhãn mặc định của link trong kho chung không tự động làm thay đổi giao diện của các revision đã xuất bản (tránh vỡ bố cục ngoài ý muốn).

---

## 2. Quyết định loại khối, giao diện và protocol link (P01.02)

1. **Bộ khối (Block Types) phiên bản đầu (v1):**
   - `header`: Ảnh đại diện/avatar, tiêu đề chính (title), mô tả ngắn (bio/subtitle).
   - `link_list`: Danh sách các nút liên kết (dạng thẻ button hoặc icon kèm mô tả).
   - `social_icons`: Nhóm icon mạng xã hội nhanh (Facebook, Instagram, TikTok, Zalo, YouTube, Website).
   - `heading`: Đề mục phân cách các nhóm liên kết (ví dụ: "Đặt món", "Liên hệ & Cửa hàng").
   - _Ngoài phạm vi v1:_ Khối nhúng video YouTube/TikTok trực tiếp, khối accordion, khối form đăng ký nhúng iframe.

2. **Mức độ trang trí và giao diện:**
   - Cung cấp các Theme Preset tối ưu sẵn cho thương hiệu F&B: _Gờ Original (Dark/Warm)_, _Minimalist Light_, _Modern Clean_, _Vibrant Contrast_.
   - Cho phép tùy biến có kiểm soát trên từng trang:
     - Kiểu nền: Màu đơn sắc (solid) hoặc dải màu (gradient).
     - Màu thẻ liên kết, màu chữ, độ bo góc (`none`, `sm`, `md`, `full`).
     - Font chữ tối ưu tiếng Việt: Inter, Be Vietnam Pro, Montserrat.
   - **Bảo mật:** Nghiêm cấm hoàn toàn việc cho phép nhập mã HTML, CSS tùy ý hoặc JavaScript tùy biến trong giao diện để triệt tiêu nguy cơ XSS.

3. **Giao thức liên kết (Protocols) và đo lường:**
   - Hỗ trợ các giao thức: `https://`, `http://`, `tel:`, `mailto:`.
   - **Đo lường `tel:` và `mailto:`:** Có nằm trong phạm vi đo lường.
     - Luồng thực hiện: Trình duyệt gửi tín hiệu ghi nhận sự kiện qua endpoint cùng origin (`/r/{pageLinkId}` hoặc POST API beacon), sau đó mở trực tiếp giao thức trên trình duyệt khách (`window.location.href = tel:...` hoặc thẻ link mở trực tiếp).
     - Ghi chú định nghĩa: Đây là số liệu "lượt bấm vào nút gọi/gửi email", không thể khẳng định người dùng đã hoàn thành cuộc gọi điện thoại hay đã gửi email.

---

## 3. Quyết định trang chủ, slug/alias và ẩn/archive (P01.03)

1. **Trang chủ `/`:**
   - Trong bảng cấu hình hệ thống, cho phép chỉ định một trang mặc định (default page) hoặc chuyển hướng `/` về slug chính của thương hiệu (mặc định ban đầu là `/gocafe`).
   - Nếu chưa cấu hình trang chủ, `/` hiển thị giao diện giới thiệu ngắn gọn của hệ thống hoặc điều hướng về trang đầu tiên được xuất bản.

2. **Quy tắc slug và alias:**
   - Mỗi trang sở hữu 1 slug chính (`is_primary = true`) và danh sách các slug phụ/alias cũ (`is_primary = false`).
   - Khi đổi slug chính, slug cũ tự động được chuyển thành alias và thực hiện redirect (308/301) về slug mới, đảm bảo các mã QR đã in hoặc link đã chia sẻ không bị gãy (404).
   - Danh sách `reserved_slugs` bị cấm: `admin`, `api`, `login`, `r`, `auth`, `static`, `_next`, `dashboard`, `settings`, `assets`, `favicon.ico`.

3. **Hành vi ẩn (Unpublish) và lưu trữ (Archive):**
   - **Ẩn trang (Unpublish):** Trang trả về mã 404 cho khách truy cập. Dữ liệu nháp, revision và thống kê click được giữ nguyên vẹn.
   - **Lưu trữ (Archive):** Đánh dấu `is_archived = true`, ẩn khỏi danh sách trang hoạt động trong CMS, ngừng hiển thị công khai. Tuyệt đối không xóa cứng (hard delete) các bản ghi để giữ tính toàn vẹn cho báo cáo click lịch sử.

---

## 4. Quyết định tài khoản, phân quyền và lịch sử (P01.04)

1. **Số lượng tài khoản và phân quyền:**
   - Phiên bản v1 phục vụ nội bộ tổ chức Gờ Cafe, phân quyền 1 cấp độ: Tất cả tài khoản được kích hoạt trong `admin_users` đều có quyền quản trị viên đầy đủ.
   - Vô hiệu hóa tính năng tự do đăng ký tài khoản (disable public registration).
   - Cấp tài khoản: Mời qua email (Supabase Auth Invite) hoặc tạo tài khoản từ Supabase dashboard, sau đó gán vào bảng `admin_users`.
   - Thu hồi quyền: Đổi cờ `is_active = false` trong bảng `admin_users`. Ngay lập tức người này sẽ bị từ chối mọi thao tác Server Action, Data API và RPC thông qua RLS và helper `is_admin()`.

2. **Audit Log và lịch sử thao tác:**
   - _Ngoài phạm vi v1:_ Không tạo bảng `audit_logs` riêng biệt để ghi nhận từng thay đổi nhỏ nhằm tránh phình to schema và độ phức tạp.
   - Mỗi bảng nghiệp vụ đều lưu `created_at`, `updated_at`, `updated_by` để phục vụ truy vết cơ bản.
   - Không lưu bảng lịch sử thay đổi URL của `links` trong v1; chỉ lưu URL hiện hành.

---

## 5. Quyết định chỉ số báo cáo, múi giờ và vận hành (P01.05)

1. **Chỉ số báo cáo v1:**
   - Tổng lượt click toàn hệ thống và theo từng trang.
   - Lượt click chi tiết theo từng liên kết và vị trí đặt trên trang.
   - Phân bố lượt click theo thời gian (theo ngày, tuần, tháng).
   - **Định danh số liệu:** Báo cáo ghi nhận rõ là "Lượt click" (Clicks), không cam kết tính "Người dùng duy nhất" (Unique Visitors) vì không lưu vết fingerprint/IP để đảm bảo quyền riêng tư và tối ưu tốc độ.

2. **Múi giờ kinh doanh:**
   - Chuẩn hóa toàn bộ báo cáo hiển thị theo múi giờ Việt Nam: `Asia/Ho_Chi_Minh` (UTC+7).
   - Mốc tính ngày bắt đầu từ `00:00:00` và kết thúc lúc `23:59:59` giờ Việt Nam (tương ứng `17:00:00 UTC` ngày hôm trước đến `16:59:59 UTC` ngày hiện tại).

3. **Thời hạn lưu trữ (Data Retention):**
   - Lưu trữ chi tiết toàn bộ sự kiện click (`click_events`) tối thiểu 180 ngày (6 tháng) đến 1 năm.
   - Khi dung lượng vượt 500MB (ngưỡng free tier), kích hoạt job tổng hợp theo ngày (`daily_click_summaries`) và dọn dẹp click chi tiết quá hạn.

4. **Mục tiêu hiệu năng và lưu lượng:**
   - Lưu lượng dự kiến ban đầu: 1.000 đến 50.000 click/tháng cho 3-10 trang ban đầu.
   - Thời gian phản hồi trang công khai: TTFB < 200ms, FCP < 800ms nhờ cơ chế Server Rendering và Edge Caching của Vercel.
   - Thời gian chuyển hướng click `/r/{id}`: < 150ms.
   - Thời gian truy vấn báo cáo trong CMS: < 500ms.

---

## 6. Quyết định quản lý media và ảnh tải lên (P01.06)

1. **Truy cập ảnh công khai:**
   - Chấp nhận tính chất của Object Storage CDN: Ảnh đã tải lên bucket public của Supabase Storage vẫn có thể truy cập qua direct URL nếu người dùng đã lưu URL trước đó, ngay cả khi trang chứa ảnh bị ẩn hoặc chuyển sang trạng thái nháp.
   - Khi ẩn trang, các liên kết đến ảnh trên giao diện HTML bị gỡ bỏ hoàn toàn.

2. **Quy định tệp tải lên:**
   - Định dạng hợp lệ: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`.
   - Giới hạn dung lượng:
     - Avatar, icon liên kết: Tối đa 2MB.
     - Ảnh bìa, banner: Tối đa 5MB.
   - Kiểm tra MIME type thực tế ở server, tự động làm sạch SVG để tránh chèn script độc hại.

---

## 7. Trách nhiệm hạ tầng, tài khoản và sao lưu (P01.07)

1. **Hạ tầng triển khai:**
   - **Hosting ứng dụng:** Vercel (khu vực Singapore `sin1` để tối ưu độ trễ cho người dùng Việt Nam).
   - **Database & Storage:** Supabase (khu vực Singapore `ap-southeast-1`).
   - **Mã nguồn:** Quản lý tập trung trên Git repository.
   - **Tên miền:** Cấu hình DNS trỏ về Vercel, bật tự động cấp chứng chỉ SSL/TLS (HTTPS).

2. **Chi phí và sao lưu:**
   - Giai đoạn đầu sử dụng gói Free Tier của Vercel và Supabase, đủ đáp ứng vượt mức nhu cầu 3-10 trang ban đầu.
   - Trách nhiệm sao lưu:
     - Supabase tự động sao lưu định kỳ hàng ngày.
     - Trước mỗi đợt migration cấu trúc lớn, chạy script xuất schema và backup dữ liệu độc lập.

---

## 8. Danh mục nội dung khởi tạo cho 3 trang đầu tiên (P01.08)

1. **Trang 1: Trang thương hiệu chính (`/gocafe`):**
   - Tiêu đề: _Gờ Cafe - Cà phê đậm chất Sài Gòn_
   - Mô tả: _Hệ thống cà phê mang đi & không gian trải nghiệm mộc mạc, gần gũi. Mở cửa từ 6:00 - 22:30 hàng ngày._
   - Khối liên kết:
     - Đặt món qua ShopeeFood (Link Delivery)
     - Đặt món qua GrabFood (Link Delivery)
     - Xem Thực đơn đầy đủ (Link Menu Web/PDF)
     - Tìm cửa hàng gần nhất (Google Maps)
     - Hotline hỗ trợ khách hàng (`tel:1900xxxx`)
     - Fanpage Facebook & Kênh TikTok

2. **Trang 2: Trang Tuyển dụng & Đội ngũ (`/tuyendung`):**
   - Tiêu đề: _Gia đình Gờ Cafe Tuyển Dụng_
   - Mô tả: _Cơ hội nghề nghiệp dành cho các bạn trẻ đam mê ngành F&B, Barista và dịch vụ khách hàng chuyên nghiệp._
   - Khối liên kết:
     - Đăng ký ứng tuyển Barista Part-time / Full-time (Link Form)
     - Tuyển Dụng Cửa Hàng Trưởng / Quản Lý Ca (Link JD)
     - Zalo kết nối phòng Nhân sự (Link Zalo)
     - Email tiếp nhận hồ sơ (`mailto:hr@gocafe.vn`)

3. **Trang 3: Trang Hợp tác & Nhượng quyền (`/nhuongquyen`):**
   - Tiêu đề: _Hợp tác nhượng quyền thương hiệu Gờ Cafe_
   - Mô tả: _Mô hình kinh doanh cà phê tinh gọn, tối ưu chi phí đầu tư và khả năng thu hồi vốn nhanh._
   - Khối liên kết:
     - Tải hồ sơ nhượng quyền & Chính sách hợp tác (Link PDF Drive)
     - Đăng ký tư vấn mô hình nhượng quyền (Link Form)
     - Hotline phòng phát triển kinh doanh (`tel:090xxxxxxx`)
     - Zalo trao đổi trực tiếp với đại diện thương hiệu

_Lưu ý:_ Trong quá trình phát triển (P02 - P08), sử dụng dữ liệu mẫu và ảnh mockup chuẩn kích thước cho 3 trang này. Khi nghiệm thu trên Staging/Production (P09 - P10), người quản trị sẽ cập nhật ảnh logo và số điện thoại/link thật.

---

## 9. Đánh giá tác động tới tài liệu hiện hữu (P01.09)

- Toàn bộ các quyết định trên hoàn toàn nhất quán với thiết kế 10 bảng nghiệp vụ + 2 bảng phụ trong [phan-tich-database.md](./phan-tich-database.md).
- Không phát sinh thay đổi phá vỡ (breaking changes) nào đối với kiến trúc đã đề ra trong [quy-dinh-cong-nghe-va-kien-truc.md](./quy-dinh-cong-nghe-va-kien-truc.md).
- Hoàn thành đầy đủ các tiêu chí kết thúc của Phase 01 (`P01.01` đến `P01.09`).
