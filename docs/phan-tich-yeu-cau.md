# Phân tích yêu cầu hệ thống trang thông tin Gờ

Ngày lập: 05/11/2026  
Trạng thái: Tài liệu phân tích để thống nhất phạm vi; chưa phải toàn bộ cam kết triển khai.

## 1. Mục tiêu

Xây dựng một website dùng chung tên miền, cho phép người quản trị tự tạo nhiều trang thông tin với đường dẫn riêng. Mỗi trang có nội dung và giao diện độc lập, chọn các liên kết từ danh mục chung để hiển thị, đồng thời thống kê số lần bấm liên kết theo từng trang.

Ví dụ đường dẫn minh họa:

- `tenmien.vn/gocafe`: trang thương hiệu.
- `tenmien.vn/hophuonganh`: trang cá nhân.
- `tenmien.vn/tuyendung`: trang tuyển dụng.

Đây là một hệ thống quản trị nhiều trang. Không cần xây dựng hay triển khai một website riêng cho mỗi đường dẫn.

## 2. Căn cứ và mức độ xác nhận

### 2.1. Yêu cầu khách hàng đã nêu

1. Website chung có danh mục một số đường link.
2. Người quản trị tự tạo nhiều đường dẫn riêng, khác nhau ở phần đuôi.
3. Mỗi trang được thay đổi nội dung, trang trí, màu sắc, cỡ chữ và font chữ.
4. Mỗi trang được kết nối với các link trong danh mục theo thứ tự tùy thích.
5. Có báo cáo số lượng click vào link, phân biệt theo từng đường dẫn trang.

### 2.2. Bối cảnh từ trao đổi trước

- Ban đầu dự kiến có 3 trang, sau đó có thể tự tạo thêm.
- Hình tham khảo là các trang hồ sơ / tập hợp liên kết: trang cá nhân, trang thương hiệu và trang đội ngũ.
- Các ảnh giúp định hướng hình thức; không mặc định toàn bộ tính năng của các nền tảng trong ảnh đều thuộc phạm vi.

### 2.3. Giả định phục vụ phân tích

- Một tổ chức quản lý website; chưa mở đăng ký công khai cho người ngoài.
- Khách truy cập không cần đăng nhập để xem trang và mở liên kết.
- Người quản trị thao tác qua giao diện, không sửa mã nguồn.
- Danh mục liên kết là kho dùng chung, mỗi trang chọn một tập liên kết để hiển thị.
- Trang chủ, cơ chế nhiều tài khoản, cách tính click và mức độ thiết kế tự do chưa được khách chốt.

Các đề xuất bên dưới cần phân biệt với yêu cầu đã xác nhận, nhất là khi dùng tài liệu để báo giá hoặc nghiệm thu.

## 3. Đối tượng sử dụng và quyền truy cập

### Khách truy cập

- Mở đường dẫn được chia sẻ hoặc quét mã QR bên ngoài hệ thống.
- Xem nội dung và các liên kết đã được xuất bản.
- Bấm liên kết để mở website đích, gọi điện hoặc thực hiện hành động được cấu hình.
- Không có quyền sửa nội dung hoặc xem báo cáo nội bộ.

### Người quản trị

- Quản lý danh mục liên kết chung.
- Tạo, chỉnh sửa, nhân bản và quản lý trạng thái trang.
- Chọn liên kết cho trang và sắp xếp thứ tự.
- Chỉnh nội dung, hình ảnh và thiết lập giao diện riêng.
- Xem báo cáo theo trang và theo liên kết.

### Phân quyền mở rộng

Nếu có nhiều nhân sự, có thể bổ sung quyền chủ sở hữu, biên tập và chỉ xem báo cáo. Không mặc định đưa phân quyền chi tiết vào bản đầu tiên khi chưa có nhu cầu cụ thể.

## 4. Các khái niệm quan trọng

- **Trang:** một hồ sơ thông tin công khai, có nội dung và giao diện riêng.
- **Slug:** phần đuôi xác định trang, ví dụ `gocafe` trong `/gocafe`.
- **Liên kết gốc:** mục nằm trong danh mục chung, chứa tên và địa chỉ đích.
- **Liên kết trên trang:** một lần gắn liên kết gốc vào một trang, có thứ tự và cấu hình hiển thị riêng.
- **Khối nội dung:** một phần như tiêu đề, văn bản, ảnh hoặc danh sách liên kết.
- **Click:** sự kiện hệ thống ghi nhận khi người dùng đi qua điểm chuyển hướng được quản lý để mở liên kết.

Phân biệt liên kết gốc và liên kết trên trang là điều kiện để vừa tái sử dụng link vừa báo cáo chính xác nguồn phát sinh click.

## 5. Phân tích chức năng

### 5.1. Danh mục liên kết dùng chung

Chức năng cần có:

- Thêm, sửa, tìm kiếm và vô hiệu hóa liên kết.
- Nhập tên, địa chỉ đích và ảnh / biểu tượng nếu có.
- Xem liên kết đang được dùng ở những trang nào.
- Chọn liên kết có sẵn khi biên tập trang.

Đề xuất dữ liệu mỗi liên kết:

- Mã liên kết cố định.
- Tên mặc định.
- URL đích.
- Mô tả ngắn, ảnh hoặc biểu tượng tùy chọn.
- Trạng thái hoạt động.
- Thời điểm tạo và cập nhật.

Chưa cần mặc định có nhiều cấp danh mục. Nhãn hoặc nhóm liên kết chỉ nên thêm nếu số lượng thực tế cần đến.

**Quy tắc cập nhật đề xuất:** URL được quản lý tập trung. Khi đổi URL gốc, các trang đang dùng liên kết nhận đích mới. Tên và ảnh trên từng trang được phép ghi đè; nếu chưa ghi đè thì dùng giá trị mặc định.

Trước khi lưu thay đổi URL gốc, giao diện cần cho biết số trang bị ảnh hưởng. Đây là quy tắc đề xuất cần khách xác nhận, vì một cách hiểu khác là mỗi trang giữ một bản sao độc lập.

**Quy tắc xóa đề xuất:** liên kết đang được sử dụng không bị xóa vĩnh viễn ngay. Ưu tiên vô hiệu hóa hoặc yêu cầu gỡ khỏi các trang trước; giữ định danh phục vụ báo cáo lịch sử.

### 5.2. Quản lý trang và đường dẫn

- Tạo trang với tên nội bộ và slug.
- Kiểm tra slug hợp lệ và không trùng.
- Nhân bản nội dung và giao diện từ một trang có sẵn.
- Lưu nháp, xuất bản và ngừng hiển thị.
- Đổi slug và quản lý chuyển hướng từ đường dẫn cũ.
- Xem trước trên điện thoại và máy tính.

Quy tắc slug đề xuất:

- Chuẩn hóa chữ thường, bỏ khoảng trắng đầu cuối.
- Bản đầu tiên sử dụng chữ Latin không dấu, số và dấu gạch ngang.
- Không cho trùng các tuyến hệ thống như `admin`, `api`, `login`, `assets` và tuyến chuyển hướng click.
- Không phân biệt hai slug chỉ khác chữ hoa / thường.
- Kiểm tra trùng cả slug hiện tại và đường dẫn cũ đang được giữ để chuyển hướng.
- Trang không tồn tại hoặc chưa công khai hiển thị trạng thái 404 phù hợp.

Slug có thể đổi, nhưng mã định danh trang phải giữ nguyên để báo cáo lịch sử không bị chia thành hai trang.

Trang chủ `/` cần chốt riêng: mở trang thương hiệu mặc định, trang giới thiệu chung hay danh sách các trang được chọn. Không tự công khai toàn bộ danh sách trang quản trị.

### 5.3. Biên tập nội dung

Các loại khối phù hợp với ảnh tham khảo:

- Hồ sơ: ảnh đại diện, tên, chức danh hoặc mô tả ngắn.
- Ảnh bìa hoặc hình ảnh độc lập.
- Tiêu đề và đoạn văn bản.
- Danh sách các liên kết được chọn từ danh mục.
- Liên kết mạng xã hội.
- Khoảng cách và đường phân cách.

Người quản trị có thể thêm, sửa, ẩn, xóa và đổi thứ tự khối. Liên kết trong một danh sách có thứ tự riêng.

Phạm vi soạn thảo văn bản nên hỗ trợ xuống dòng, đậm, nghiêng và liên kết; không cần mở toàn bộ HTML tùy ý. Việc này giúp nội dung ổn định và dễ hiển thị trên nhiều kích thước màn hình.

### 5.4. Chọn và sắp xếp liên kết theo trang

Luồng đề xuất:

1. Mở trang cần sửa.
2. Bấm thêm liên kết từ danh mục.
3. Tìm và chọn một hoặc nhiều liên kết.
4. Chỉnh tên hiển thị hoặc ảnh nếu cần.
5. Kéo đổi thứ tự.
6. Xem trước và xuất bản.

Ví dụ cùng liên kết tuyển dụng có thể nằm đầu trang `/tuyendung` và cuối trang `/gocafe`. Thứ tự ở một trang không ảnh hưởng trang khác.

Đề xuất bản đầu tiên không gắn trùng cùng liên kết trong một danh sách. Nếu cần xuất hiện nhiều vị trí trên một trang, mỗi vị trí phải có định danh riêng để phân biệt lượt bấm.

### 5.5. Trang trí độc lập

Mỗi trang có bộ cấu hình riêng:

- Màu nền, ảnh nền hoặc nền chuyển màu.
- Màu chữ, màu nút và màu viền.
- Font chữ từ danh sách có hỗ trợ tiếng Việt.
- Cỡ chữ theo nhóm: tên trang, tiêu đề, nội dung và nút.
- Kiểu nút, độ bo góc và khoảng cách.
- Hình dạng và kích thước ảnh đại diện.
- Bố cục phần đầu và chiều rộng nội dung.

Đề xuất dùng bộ mẫu làm điểm khởi đầu, sau đó chỉnh cấu hình và sắp xếp khối. Đây là mức tự trang trí phù hợp nhu cầu hiện tại.

**Thiết kế tự do như Canva không được mặc định bao gồm:** kéo từng phần tử tới tọa độ bất kỳ, chồng lớp, chỉnh từng điểm trên màn hình và tải font tùy ý cần một bộ biên tập khác với chi phí triển khai lớn hơn.

Nhân bản trang phải tạo bản cấu hình độc lập. Nếu có mẫu dùng chung, cần phân biệt rõ “áp dụng bản sao của mẫu” và “đồng bộ theo mẫu”; bản đầu tiên nên dùng bản sao để tránh thay đổi ngoài ý muốn.

### 5.6. Lưu nháp và xuất bản

Đề xuất giữ riêng phiên bản đang biên tập và phiên bản công khai:

- Lưu nháp không thay đổi nội dung khách đang xem.
- Xem trước dùng dữ liệu nháp và chỉ dành cho người có quyền.
- Xuất bản cập nhật nội dung, thứ tự liên kết và giao diện cùng lúc.
- Ngừng xuất bản chặn hiển thị công khai nhưng giữ dữ liệu quản trị.

Lưu ý: nếu URL liên kết gốc đồng bộ tập trung, đổi URL sẽ ảnh hưởng cả trang đã xuất bản. Cần ghi rõ ngoại lệ này trong giao diện và xác nhận quy tắc với khách. Nếu mọi thay đổi đều phải qua xuất bản, hệ thống phải lưu thêm phiên bản liên kết, làm tăng phạm vi.

## 6. Phân tích báo cáo lượt bấm

### 6.1. Câu hỏi báo cáo phải trả lời

- Trong khoảng thời gian được chọn, mỗi trang có bao nhiêu lượt bấm?
- Trong một trang, từng liên kết được bấm bao nhiêu lần?
- Cùng một liên kết xuất hiện ở nhiều trang, mỗi trang đóng góp bao nhiêu lượt bấm?
- Lượt bấm thay đổi theo ngày như thế nào?

Ví dụ kiểm chứng: cùng một link Shopee được bấm 12 lần từ `/gocafe` và 5 lần từ `/hophuonganh`. Báo cáo phải thể hiện riêng 12 và 5 theo trang, đồng thời tổng của liên kết là 17 trong cùng phạm vi lọc.

### 6.2. Cơ chế ghi nhận đề xuất

1. Nút trên trang trỏ tới tuyến chuyển hướng của hệ thống, gắn với vị trí liên kết trên trang.
2. Máy chủ xác minh vị trí này thuộc trang hợp lệ và đang công khai.
3. Hệ thống đọc URL đích từ dữ liệu đã quản lý.
4. Ghi sự kiện với mã trang, mã liên kết và mã vị trí.
5. Chuyển người dùng sang địa chỉ đích bằng chuyển hướng tạm thời.

Không nhận trực tiếp một URL đích bất kỳ từ tham số để chuyển hướng. Mục tiêu là chỉ chuyển tới các liên kết đã được quản trị cấu hình.

Điểm chuyển hướng không được cache theo cách bỏ qua bước ghi nhận click. Nếu lưu thống kê gặp lỗi, ưu tiên người dùng vẫn mở được link và ghi nhận lỗi vận hành để xử lý.

### 6.3. Định nghĩa chỉ số

- **Tổng click:** số sự kiện hợp lệ được ghi nhận; một người bấm nhiều lần có thể tạo nhiều click.
- **Click theo trang:** nhóm sự kiện theo mã trang nguồn.
- **Click theo liên kết:** nhóm theo mã liên kết gốc, có thể lọc thêm trang nguồn.
- **Click theo vị trí:** nhóm theo lần gắn liên kết nếu cùng link xuất hiện nhiều nơi.

Không gọi tổng click là số người truy cập hoặc số khách hàng. Số người duy nhất cần cơ chế nhận diện bổ sung và vẫn chỉ là ước tính.

Tỷ lệ bấm trên lượt xem chỉ có ý nghĩa nếu triển khai thêm đo lượt xem trang. Đây chưa phải yêu cầu khách đã xác nhận.

### 6.4. Quy tắc và giới hạn cần công bố

- Thống kê là số sự kiện hệ thống ghi nhận, không đảm bảo tương đương tuyệt đối số lần người thật chủ động bấm.
- Bot, công cụ kiểm tra link và tải trước có thể tạo sự kiện; cần có quy tắc loại trừ cơ bản và ghi rõ giới hạn.
- Không ghi lượt bấm từ màn hình xem trước của quản trị vào báo cáo công khai.
- Dùng định danh sự kiện để tránh đếm hai lần khi cơ chế lưu thử lại cùng một sự kiện.
- Nếu có hàng đợi, báo cáo có thể trễ; thời gian cập nhật cần được chốt.
- Lưu thời gian sự kiện theo UTC; mặc định hiển thị báo cáo theo `Asia/Ho_Chi_Minh`.
- Bộ lọc ngày cần chuyển đổi theo múi giờ hiển thị, dùng khoảng từ đầu ngày bắt đầu đến trước đầu ngày sau ngày kết thúc.

### 6.5. Dữ liệu lịch sử

- Đổi slug không đổi mã trang, vì vậy lịch sử vẫn gắn đúng trang.
- Đổi tên link không tạo link mới.
- Đổi URL cùng link làm báo cáo cộng chung trước và sau thay đổi; cần lịch sử thay đổi hoặc phiên bản đích nếu khách muốn tách.
- Với link được tái sử dụng cho mục đích hoàn toàn khác, nên tạo mục mới để báo cáo có ý nghĩa.
- Khi gỡ link khỏi trang, báo cáo cũ vẫn giữ được quan hệ và tên nhận diện.
- Đề xuất xóa mềm trang, link và vị trí liên kết để bảo toàn báo cáo.

### 6.6. Giao diện báo cáo tối thiểu

- Lọc thời gian và chọn trang hoặc tất cả trang.
- Tổng click trong phạm vi đã chọn.
- Danh sách link và số click tương ứng.
- Phân rã theo trang nguồn khi xem một link dùng chung.
- Biểu đồ lượt bấm theo ngày nếu cần theo dõi xu hướng.

Xuất CSV, thống kê thiết bị, nguồn truy cập và số người duy nhất là phần mở rộng, chưa mặc định nằm trong phạm vi.

## 7. Luồng sử dụng chính

### Luồng A — Tạo trang mới

Đăng nhập → tạo trang → nhập tên và slug → chọn mẫu → chỉnh nội dung và giao diện → chọn link → sắp xếp → xem trước → xuất bản → lấy đường dẫn chia sẻ.

### Luồng B — Cập nhật liên kết dùng chung

Mở danh mục → chọn link → xem các trang đang dùng → sửa URL → kiểm tra địa chỉ → lưu → các vị trí liên quan sử dụng URL mới theo quy tắc đồng bộ đã thống nhất.

### Luồng C — Thay phong cách một trang

Mở trang → sửa màu, font, ảnh hoặc kiểu nút → xem trước trên các kích thước → lưu nháp → xuất bản. Các trang khác không đổi.

### Luồng D — Xem hiệu quả liên kết

Mở báo cáo → chọn khoảng ngày → chọn trang → xem click từng link → chuyển sang xem cùng link trên các trang khác để so sánh.

## 8. Mô hình dữ liệu đề xuất

Đây là mô hình khái niệm, chưa khóa công nghệ hoặc thiết kế cơ sở dữ liệu cuối cùng.

### Các thực thể

- `AdminUser`: tài khoản quản trị và trạng thái truy cập.
- `Page`: mã trang, slug, tên, trạng thái, thời điểm tạo và cập nhật.
- `PageRevision`: nội dung, cấu hình giao diện, phiên bản và trạng thái nháp / công khai.
- `PageBlock`: loại khối, nội dung và thứ tự trong phiên bản trang.
- `Link`: danh mục liên kết gốc, tên mặc định, URL, ảnh và trạng thái.
- `PageLink`: định danh vị trí link thuộc trang, tham chiếu link gốc và trạng thái lưu trữ.
- `RevisionLinkPlacement`: vị trí trong phiên bản cụ thể, thứ tự, khối chứa và phần ghi đè tên / ảnh.
- `MediaAsset`: ảnh đã tải lên, loại tệp, dung lượng, kích thước và nơi lưu.
- `ClickEvent`: mã sự kiện, trang, link, vị trí và thời điểm; phiên bản xuất bản nếu cần đối chiếu.
- `SlugRedirect`: slug cũ và mã trang đích.
- `AuditLog`: lịch sử các thay đổi quan trọng nếu đưa vào phạm vi triển khai.

### Quan hệ và ràng buộc

- Một trang có nhiều phiên bản, nhưng chỉ một phiên bản công khai tại một thời điểm.
- Một link gốc có thể xuất hiện ở nhiều trang.
- Một vị trí link có định danh ổn định qua các lần xuất bản để không làm phân mảnh báo cáo.
- Thứ tự và nhãn ghi đè nằm trong phiên bản; sửa nháp không làm thay đổi bản công khai.
- Click tham chiếu mã trang và link ổn định, không chỉ lưu chuỗi slug.
- Bản công khai chỉ nhận các vị trí thuộc đúng trang và phiên bản đang hoạt động.

Nếu bỏ cơ chế nháp / xuất bản độc lập, mô hình có thể đơn giản hơn. Cần quyết định trước khi triển khai để tránh sửa lại cấu trúc dữ liệu.

## 9. Kiến trúc triển khai

### Các thành phần

- Giao diện công khai: đọc bản đã xuất bản và hiển thị theo slug.
- Giao diện quản trị: danh mục link, trình biên tập, quản lý trang và báo cáo.
- Máy chủ ứng dụng: xác thực, kiểm tra dữ liệu, xuất bản và chuyển hướng link.
- Cơ sở dữ liệu: lưu trang, liên kết, cấu hình và thống kê.
- Kho ảnh: lưu tài nguyên tải lên, có cơ chế tối ưu kích thước.

Với phạm vi hiện tại, có thể dùng một ứng dụng thống nhất cho các thành phần web và API. Chưa có cơ sở để bắt buộc chia nhiều dịch vụ độc lập.

### Hiệu năng và mở rộng

- Cache nội dung trang công khai và xóa cache khi xuất bản hoặc cập nhật dữ liệu chung có liên quan.
- Không cache tuyến click theo cách làm mất sự kiện.
- Tối ưu ảnh đại diện và ảnh bìa, tải ảnh theo kích thước hiển thị.
- Đánh chỉ mục theo slug và các trường lọc sự kiện như trang, link và thời gian.
- Chỉ bổ sung bảng tổng hợp theo ngày hoặc hàng đợi khi lượng sự kiện thực tế cần đến.

Không cam kết tải đồng thời, dung lượng hay số trang “không giới hạn” khi chưa có thông tin lưu lượng và hạ tầng. Giao diện có thể cho tạo thêm trang, còn hạn mức vận hành cần chốt cụ thể.

## 10. Chất lượng, bảo vệ dữ liệu và vận hành

- Bắt buộc xác thực với mọi thao tác quản trị; kiểm tra quyền ở máy chủ.
- Chỉ cho phép các loại URL cần dùng, chặn giao thức thực thi mã; `https`, `http`, `tel`, `mailto` cần quy tắc kiểm tra riêng.
- Không cho nhập mã JavaScript, HTML hoặc CSS tùy ý trong bản đầu tiên.
- Làm sạch nội dung soạn thảo trước khi hiển thị.
- Giới hạn loại và dung lượng ảnh tải lên; kiểm tra nội dung tệp thay vì chỉ tin phần mở rộng.
- Dùng HTTPS; quản lý phiên đăng nhập và bí mật cấu hình phù hợp môi trường triển khai.
- Không mặc định lưu IP đầy đủ chỉ để đếm click. Nếu dùng thông tin mạng để lọc bot hoặc giới hạn tần suất, cần quy định mục đích và thời hạn lưu.
- Xác định thời hạn lưu sự kiện chi tiết, dữ liệu tổng hợp và bản sao lưu trước khi vận hành.
- Có sao lưu dữ liệu và ảnh, cùng quy trình kiểm tra khôi phục.
- Kiểm tra hiển thị tiếng Việt, điều hướng bằng bàn phím, độ tương phản và kích thước vùng bấm trên điện thoại.
- Tiêu đề, mô tả và ảnh chia sẻ được cấu hình riêng cho từng trang nếu nằm trong phạm vi bàn giao.

## 11. Phạm vi đề xuất cho phiên bản đầu

### Chức năng trực tiếp đáp ứng yêu cầu

- Quản trị danh mục liên kết chung.
- Tạo nhiều trang theo slug riêng.
- Chỉnh nội dung và giao diện độc lập.
- Chọn link và thay đổi thứ tự trên từng trang.
- Báo cáo tổng click và click từng link, phân biệt trang nguồn.

### Chức năng hỗ trợ nên đưa vào báo giá

- Đăng nhập quản trị.
- Tải và quản lý ảnh.
- Mẫu giao diện ban đầu, khởi tạo 3 trang theo nội dung được cung cấp.
- Xem trước và hiển thị thích ứng điện thoại / máy tính.
- Nháp và xuất bản.
- Nhân bản trang.
- Giữ đường dẫn cũ khi đổi slug.
- Hướng dẫn quản trị và thiết lập sao lưu.

### Chưa mặc định bao gồm

- Trình thiết kế tự do như Canva.
- Đăng ký tài khoản công khai cho nhiều khách hàng khác nhau.
- Phân quyền nhân sự chi tiết và quy trình duyệt nội dung nhiều cấp.
- Tên miền riêng cho từng trang.
- Quản lý đơn hàng, thanh toán, ứng viên hoặc biểu mẫu nghiệp vụ ngay trong hệ thống.
- Gửi email / thông báo hàng loạt.
- Đo người dùng duy nhất, chuyển đổi mua hàng hoặc kết quả sau khi khách rời website.
- Xuất báo cáo nâng cao, tích hợp hệ thống bên ngoài.
- Đa ngôn ngữ, tải font tùy ý hoặc mã tùy chỉnh.

## 12. Tiêu chí nghiệm thu dự kiến

Các tiêu chí sau là cơ sở để chốt kiểm thử, chưa thay thế phạm vi hợp đồng.

1. Tạo và xuất bản 3 trang với slug khác nhau; mỗi URL hiển thị đúng nội dung.
2. Tạo thêm trang qua quản trị mà không sửa mã nguồn hoặc triển khai lại ứng dụng.
3. Không thể lưu slug trùng hoặc trùng tuyến hệ thống.
4. Đổi màu, font, cỡ chữ và ảnh một trang không ảnh hưởng trang khác.
5. Gắn cùng link vào hai trang và đặt thứ tự khác nhau; kết quả công khai đúng từng trang.
6. Sửa URL gốc cập nhật các trang theo đúng quy tắc đồng bộ được duyệt.
7. Với dữ liệu kiểm thử có kiểm soát, link nhận 12 click ở trang A và 5 click ở trang B; báo cáo thể hiện 12, 5 và tổng 17 trong cùng khoảng lọc, sau thời gian xử lý đã thống nhất.
8. Đổi slug vẫn giữ lịch sử báo cáo; đường dẫn cũ chuyển hướng đúng nếu tính năng được chọn.
9. Gỡ link khỏi trang không làm mất số liệu lịch sử.
10. Lượt bấm trong bản xem trước quản trị không cộng vào báo cáo.
11. Người chưa đăng nhập không sửa trang hoặc truy cập báo cáo nội bộ.
12. Với cơ chế nháp / xuất bản, lưu nháp không làm thay đổi bản công khai; xuất bản áp dụng đồng thời nội dung và giao diện.
13. Trang dùng được trên điện thoại và máy tính, không tràn ngang hoặc che khuất nút chính.
14. Khi tuyến chuyển hướng hoạt động nhưng nơi ghi thống kê tạm lỗi, link vẫn mở được; lỗi được ghi lại để vận hành xử lý.

## 13. Điểm cần khách xác nhận

Ưu tiên chốt trước thiết kế và báo giá:

1. **Mức độ trang trí:** chỉnh theo mẫu và khối hay kéo thả tự do từng phần tử?
2. **Danh mục dùng chung:** đổi URL gốc có cập nhật ngay mọi trang đang dùng không?
3. **Nội dung:** cần những loại khối nào ngoài ảnh, văn bản và nút liên kết?
4. **Nháp / xuất bản:** có cần chuẩn bị thay đổi trước khi công khai không?
5. **Báo cáo:** chỉ tổng click hay cần người duy nhất, lượt xem và xuất Excel / CSV?
6. **Thời gian báo cáo:** cần cập nhật ngay hay chấp nhận độ trễ được thống nhất?
7. **Tài khoản:** một người quản trị hay nhiều người với quyền khác nhau?
8. **Trang chủ:** khách mở tên miền gốc sẽ thấy gì?
9. **Đổi / ẩn trang:** có giữ đường dẫn cũ và cần xử lý link đã chia sẻ thế nào?
10. **Quy mô:** dự kiến số trang, số link, lượt truy cập và thời gian lưu thống kê?
11. **Bàn giao:** bên nào cung cấp tên miền, hosting, hình ảnh và nội dung 3 trang đầu?
12. **Vận hành:** ai phụ trách sao lưu, cập nhật và hỗ trợ sau bàn giao?

## 14. Lộ trình triển khai đề xuất

### Bước 1 — Chốt phạm vi

Xác nhận các điểm ở mục 13, danh sách tính năng bàn giao và tiêu chí nghiệm thu. Chốt quy tắc đồng bộ link và báo cáo trước khi thiết kế dữ liệu.

### Bước 2 — Thiết kế trải nghiệm

Thiết kế mẫu 3 trang, màn hình danh mục liên kết, trình biên tập và báo cáo. Dùng nội dung thực tế để kiểm tra độ dài văn bản, chất lượng ảnh và trải nghiệm điện thoại.

### Bước 3 — Xây chức năng cốt lõi

Triển khai quản trị, danh mục, trang theo slug, trình biên tập, cấu hình giao diện và xuất bản.

### Bước 4 — Ghi nhận và báo cáo

Triển khai chuyển hướng, sự kiện click, bộ lọc và tổng hợp. Kiểm chứng cùng link trên nhiều trang, đổi slug và gỡ link.

### Bước 5 — Hoàn thiện và bàn giao

Nhập 3 trang đầu, kiểm tra quyền truy cập, hiển thị và báo cáo; cấu hình tên miền, sao lưu; hướng dẫn khách tự tạo trang mới và cập nhật nội dung.

Chưa ước lượng thời gian hoặc chi phí cố định khi các lựa chọn ảnh hưởng lớn đến phạm vi chưa được xác nhận.

## 15. Mô tả ngắn để đưa vào đề xuất khách hàng

Xây dựng website thông tin dùng chung tên miền, cho phép tự tạo nhiều trang với đường dẫn riêng. Mỗi trang được chỉnh nội dung, màu sắc, font, cỡ chữ và cách trình bày độc lập; lựa chọn liên kết từ danh mục chung và sắp xếp theo ý muốn. Hệ thống có báo cáo lượt bấm từng liên kết, phân biệt theo trang phát sinh. Ban đầu thiết lập 3 trang; về sau có thể tạo thêm qua giao diện quản trị trong hạn mức vận hành đã thống nhất.
