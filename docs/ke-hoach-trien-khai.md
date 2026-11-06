# Kế hoạch triển khai theo phase

Ngày lập và cập nhật gần nhất: 06/11/2026 — múi giờ `Asia/Ho_Chi_Minh`.  
Hiện trạng: Đã có tài liệu phân tích; chưa có mã nguồn ứng dụng, migration hoặc hạ tầng triển khai trong workspace.

Tài liệu căn cứ:

- [Phân tích yêu cầu](./phan-tich-yeu-cau.md).
- [Công nghệ và kiến trúc](./quy-dinh-cong-nghe-va-kien-truc.md).
- [Phân tích database](./phan-tich-database.md).
- [Quyết định phạm vi và đầu vào](./quyet-dinh-pham-vi-va-dau-vao.md).
- [Nhật ký triển khai](./nhat-ky-trien-khai.md).

## 1. Quy tắc theo dõi tiến độ

- `[ ]`: chưa hoàn thành; bao gồm cả đang làm hoặc đang chờ. Ghi trạng thái cụ thể trong nhật ký, không đánh dấu trước.
- `[x]`: đã hoàn thành và có bằng chứng là file, kết quả kiểm tra hoặc kết quả vận hành thực tế.
- Chỉ đánh dấu phase hoàn thành ở danh sách tổng khi **tất cả hạng mục bắt buộc và tiêu chí kết thúc** của phase đã đạt.
- Sau mỗi đợt công việc, cập nhật checklist liên quan, ngày cập nhật và thêm một mục nhật ký: đã làm gì, file thay đổi, đã kiểm tra gì, kết quả và việc tiếp theo.
- Nếu mới viết test nhưng chưa chạy được, chỉ ghi đã viết; tiêu chí “kiểm thử đạt” vẫn để trống. Lỗi hoặc thiếu cấu hình phải được ghi rõ.
- Nếu phát hiện hồi quy, mở lại checkbox liên quan, cập nhật trạng thái phase và ghi lý do; giữ nguyên lịch sử cũ.
- Nếu hạng mục được loại khỏi phạm vi, ghi quyết định và lý do, cập nhật kế hoạch cùng tiêu chí kết thúc. Không đánh dấu `[x]` cho việc bị bỏ qua.
- Không ghi secret, token, mật khẩu hoặc dữ liệu người dùng thật trong kế hoạch/nhật ký.

Đây là kế hoạch thực hiện và ghi nhận tiến độ, không tự khởi chạy các phase. Chưa chốt thời hạn cố định vì còn phụ thuộc phạm vi, dữ liệu đầu vào và tài khoản dịch vụ. Khi bắt đầu mỗi phase, ghi người thực hiện và ước lượng sau khi rõ đầu vào.

## 2. Checklist tổng các phase

- [x] **P00 — Tài liệu nền và cơ chế theo dõi.** Hoàn thành bộ tài liệu kỹ thuật ban đầu; các quyết định nghiệp vụ còn mở chuyển sang P01.
- [x] **P01 — Chốt phạm vi và đầu vào triển khai.** Đã chốt toàn bộ quyết định kỹ thuật, quy tắc URL/revision, loại khối, giao thức, phân quyền, retention và nội dung 3 trang đầu tại docs/quyet-dinh-pham-vi-va-dau-vao.md.
- [x] **P02 — Khởi tạo ứng dụng và quy trình kiểm tra.** Đã khởi tạo Next.js App Router (React 19, TypeScript strict), pnpm, Tailwind CSS, font tiếng Việt, script kiểm tra (lint/typecheck/Vitest/Playwright), CI workflow và build production thành công.
- [x] **P03 — Database nền, quyền và dữ liệu kiểm thử.** Đã hoàn thành 5 file migrations (10 bảng chính, 2 bảng phụ, FK ghép, constraints deferred, indexes, triggers bảo vệ sealed revision, RLS, storage policies, bộ khung 8 RPC nghiệp vụ), seed.sql, database.generated.ts và kiểm thử schema đạt 100%.
- [ ] **P04 — Đăng nhập và khung quản trị.** Chưa thực hiện.
- [ ] **P05 — Danh mục liên kết và quản lý ảnh.** Chưa thực hiện.
- [ ] **P06 — Quản lý trang, trình biên tập và xuất bản.** Chưa thực hiện.
- [ ] **P07 — Trang công khai và ghi nhận click.** Chưa thực hiện.
- [ ] **P08 — Báo cáo thống kê.** Chưa thực hiện.
- [ ] **P09 — Kiểm thử tích hợp và nghiệm thu trên staging.** Chưa thực hiện.
- [ ] **P10 — Triển khai production và xác minh vận hành.** Chưa thực hiện.
- [ ] **P11 — Bàn giao và kết thúc triển khai.** Chưa thực hiện.

Thứ tự mặc định: P00 → P01 → P02 → P03 → P04 → P05 → P06 → P07 → P08 → P09 → P10 → P11. Có thể chuẩn bị công việc độc lập sớm hơn, nhưng không đánh dấu một phase xong khi điều kiện phụ thuộc chưa đạt.

## 3. Checklist chi tiết và tiêu chí kết thúc

### P00 — Tài liệu nền và cơ chế theo dõi

Mục tiêu: Có cơ sở thống nhất để xây ứng dụng và theo dõi tiến độ thực tế. Không đồng nghĩa khách đã duyệt toàn bộ giả định.

- [x] P00.01 — Có tài liệu mục tiêu, chức năng, luồng sử dụng và tiêu chí nghiệm thu dự kiến.
- [x] P00.02 — Có quy định Next.js, Vercel, Supabase và cấu trúc thư mục.
- [x] P00.03 — Có phân tích bảng, quan hệ, constraint, RLS, RPC và kiểm thử database.
- [x] P00.04 — Có kế hoạch các phase, checklist và điều kiện hoàn thành.
- [x] P00.05 — Có nhật ký ghi nhận hiện trạng, công việc đã làm và bước tiếp theo.
- [x] P00.06 — Đã kiểm tra các file tài liệu tồn tại, liên kết nội bộ và trạng thái mô tả khớp workspace.

**Tiêu chí kết thúc:** Bộ tài liệu đọc được, có liên kết tới nhau; phân biệt rõ phần đã hoàn thành, giả định và phần chưa triển khai. Bằng chứng: các file trong `docs/` và mục LOG-001, LOG-002 của nhật ký.

### P01 — Chốt phạm vi và đầu vào triển khai

Phụ thuộc: P00. Mục tiêu: Giải quyết quyết định ảnh hưởng schema, giao diện và vận hành trước phần triển khai phụ thuộc vào chúng.

- [x] P01.01 — Chốt nháp/xuất bản và quy tắc URL cập nhật tập trung, nhãn/ảnh theo revision.
- [x] P01.02 — Chốt loại khối, mức trang trí, mẫu giao diện và protocol link; xác định có đo nút điện thoại/email hay không.
- [x] P01.03 — Chốt trang chủ `/`, quy tắc đổi slug/alias và hành vi ẩn/archive.
- [x] P01.04 — Chốt số tài khoản, quyền quản trị và cách cấp/thu hồi; xác định audit/lịch sử URL có trong bản đầu không.
- [x] P01.05 — Chốt chỉ số báo cáo, múi giờ, thời hạn lưu click, lưu lượng dự kiến và mục tiêu thời gian phản hồi.
- [x] P01.06 — Chốt việc ảnh public còn mở qua URL khi trang bị ẩn; quy định dung lượng/định dạng upload.
- [x] P01.07 — Xác định chủ sở hữu tài khoản Vercel/Supabase, repository, tên miền, chi phí và trách nhiệm sao lưu.
- [x] P01.08 — Lập danh sách nội dung, ảnh và link cần cung cấp cho 3 trang đầu; ghi rõ phần còn thiếu.
- [x] P01.09 — Ghi quyết định và cập nhật tài liệu yêu cầu, kiến trúc, database nếu có thay đổi.

**Tiêu chí kết thúc:** Các quyết định ảnh hưởng bản đầu có câu trả lời được ghi nhận; mục ngoài phạm vi được nêu rõ. Bằng chứng: [docs/quyet-dinh-pham-vi-va-dau-vao.md](./quyet-dinh-pham-vi-va-dau-vao.md) và mục LOG-003 trong nhật ký.

### P02 — Khởi tạo ứng dụng và quy trình kiểm tra

Phụ thuộc: P01 cho lựa chọn đã chốt; có thể chuẩn bị scaffold trước với giả định được ghi rõ.

- [x] P02.01 — Khởi tạo Next.js App Router, React, TypeScript strict, pnpm và alias `@/*`.
- [x] P02.02 — Khóa Node.js/pnpm tương thích; commit lockfile và cấu hình runtime thống nhất.
- [x] P02.03 — Tổ chức `src/app`, `features`, `components`, `lib`, `config` theo kiến trúc; chỉ tạo phần thực sự dùng.
- [x] P02.04 — Thiết lập Tailwind/shadcn và nền giao diện responsive; cấu hình font hỗ trợ tiếng Việt.
- [x] P02.05 — Tạo `.env.example`, kiểm tra biến môi trường phía server/client, `.gitignore` và ranh giới `server-only`.
- [x] P02.06 — Thiết lập lint, format, typecheck, Vitest và Playwright; chuẩn hóa script kiểm tra.
- [x] P02.07 — Thiết lập Git/repository nếu chưa có và CI chạy kiểm tra/build, không đưa secret vào repository.
- [x] P02.08 — Viết README hướng dẫn cài, chạy local, kiểm tra và cấu hình môi trường.
- [x] P02.09 — Chạy cài đặt có lockfile, lint, typecheck và production build thành công; ghi lệnh/kết quả vào nhật ký.

**Tiêu chí kết thúc:** Có thể dựng ứng dụng từ checkout sạch theo README; các kiểm tra nền đạt. Không đánh đồng build thành công với các chức năng đã hoạt động. Bằng chứng: mã nguồn scaffold, cấu hình test, CI workflow và mục LOG-004 trong nhật ký.

### P03 — Database nền, quyền và dữ liệu kiểm thử

Phụ thuộc: P01, P02. Mục tiêu: Có schema tái tạo được và ranh giới dữ liệu an toàn.

- [x] P03.01 — Thiết lập Supabase local hoặc development riêng, staging tách production; ghi phiên bản PostgreSQL thực tế.
- [x] P03.02 — Viết migration cho 10 bảng chính, 2 bảng phụ theo phân tích đã chốt.
- [x] P03.03 — Thêm PK, FK ghép, CHECK, unique/partial unique, index và constraint deferred cần thiết.
- [x] P03.04 — Thêm trigger thời gian/version, bảo vệ revision sealed và kiểm tra con trỏ công khai cùng trang.
- [x] P03.05 — Thiết lập helper quyền, RLS, revoke/grant mặc định và chính sách Storage theo bucket.
- [x] P03.06 — Thêm bộ khung RPC nghiệp vụ với kiểm tra quyền; chỉ cấp EXECUTE cho RPC đã có xử lý an toàn.
- [x] P03.07 — Tạo seed giả lập, reserved slugs và quy trình bootstrap quản trị không chứa credential thật.
- [x] P03.08 — Sinh `database.generated.ts` từ schema; không sửa tay.
- [x] P03.09 — Reset database kiểm thử từ migration/seed thành công; kiểm tra FK chéo trang, quyền mặc định và trạng thái sealed.

**Tiêu chí kết thúc:** Schema và chính sách nền tái tạo được trên database sạch, các kiểm tra cấu trúc/quyền nền đạt. RPC chức năng đầy đủ và kiểm thử nghiệp vụ được hoàn thiện tại P04–P08; chưa đánh dấu chúng đã đạt chỉ vì có schema. Bằng chứng: 5 file migrations trong `supabase/migrations/`, `supabase/seed.sql`, `src/types/database.generated.ts`, `tests/unit/database-schema.test.ts` và mục LOG-005 trong nhật ký.

### P04 — Đăng nhập và khung quản trị

Phụ thuộc: P03.

- [ ] P04.01 — Tạo Supabase browser/server client theo SSR cookie; xử lý refresh phiên và callback cần dùng.
- [ ] P04.02 — Xây đăng nhập, đăng xuất và trạng thái phiên hết hạn; không mở đăng ký công khai.
- [ ] P04.03 — Kiểm tra Auth và `admin_users.is_active` tại từng action/query/RPC có quyền quản trị.
- [ ] P04.04 — Tạo layout/menu quản trị, trạng thái tải, lỗi và thông báo thao tác.
- [ ] P04.05 — Kiểm thử khách chưa đăng nhập, tài khoản không có admin và quản trị bị vô hiệu hóa; gọi trực tiếp Data API/RPC vẫn bị chặn.

**Tiêu chí kết thúc:** Quản trị hợp lệ đăng nhập được; các nhóm không có quyền không thể đọc nháp, sửa dữ liệu hoặc xem báo cáo. Có bằng chứng kiểm thử ở API/database, ngoài kiểm tra giao diện.

### P05 — Danh mục liên kết và quản lý ảnh

Phụ thuộc: P04.

- [ ] P05.01 — Hoàn thiện RPC và UI thêm/sửa/tìm kiếm/vô hiệu hóa link; kiểm tra URL, kind và expected version.
- [ ] P05.02 — Hiển thị các trang bị ảnh hưởng khi đổi URL gốc; giữ ID lịch sử.
- [ ] P05.03 — Xây upload ảnh, metadata, giới hạn file và trạng thái pending/ready/failed.
- [ ] P05.04 — Quản lý ảnh private/public và tạo bản public bất biến để xuất bản; không overwrite asset đang dùng.
- [ ] P05.05 — Kiểm soát xóa ảnh theo tham chiếu; có quy trình đối soát/dọn object mồ côi có thể retry.
- [ ] P05.06 — Kiểm thử quyền upload/xóa, URL nguy hiểm, xung đột cập nhật và các lỗi copy/upload dở.

**Tiêu chí kết thúc:** Danh mục và ảnh sử dụng được trong quản trị; file chưa hợp lệ không thể trở thành tài nguyên ready; không xóa nhầm tài nguyên được tham chiếu.

### P06 — Quản lý trang, trình biên tập và xuất bản

Phụ thuộc: P05.

- [ ] P06.01 — Hoàn thiện RPC/UI tạo, liệt kê, nhân bản, archive trang và đổi slug/alias.
- [ ] P06.02 — Xây trình biên tập các khối đã chốt; cấu hình theme riêng từng trang, không nhận HTML/CSS/JS tùy ý.
- [ ] P06.03 — Chọn link chung, ghi đè nhãn/ảnh, sắp xếp khối/link bằng kéo thả và bàn phím.
- [ ] P06.04 — Lưu draft theo expected version; đồng bộ block/placement/media trong transaction, báo conflict khi cần.
- [ ] P06.05 — Preview riêng tư trên điện thoại/máy tính, không ghi thống kê công khai.
- [ ] P06.06 — Hoàn thiện publish/unpublish: khóa đúng thứ tự, resolve nhãn/ảnh, seal revision và đổi con trỏ nguyên tử.
- [ ] P06.07 — Bảo đảm gỡ link trong draft không archive vị trí vẫn có trong bản công khai.
- [ ] P06.08 — Kiểm thử rollback publish, sửa đồng thời, trùng slug/alias, clone ID mới và bất biến revision sealed.

**Tiêu chí kết thúc:** Người quản trị tạo và biên tập trang được; draft không ảnh hưởng bản công khai; publish áp dụng đồng thời nội dung/theme/thứ tự link, lỗi không gây dữ liệu dở dang.

### P07 — Trang công khai và ghi nhận click

Phụ thuộc: P06.

- [ ] P07.01 — Hoàn thiện RPC DTO công khai và route `[slug]`, chỉ trả revision công khai và dữ liệu được phép.
- [ ] P07.02 — Render các khối/theme responsive, metadata SEO/chia sẻ và trang chủ theo quyết định P01.
- [ ] P07.03 — Xử lý 404, alias đến slug hiện tại, trang ngừng xuất bản và link inactive.
- [ ] P07.04 — Hoàn thiện resolve/record click phía server; xác minh nguồn, event ID idempotent, không cho browser ghi trực tiếp.
- [ ] P07.05 — Xây `/r/{pageLinkId}`, redirect tạm thời, no-store và không prefetch; chỉ dùng URL đã quản lý.
- [ ] P07.06 — Khi resolve đã thành công nhưng ghi click lỗi, vẫn mở đích và log lỗi; xử lý race theo hợp đồng database.
- [ ] P07.07 — Loại preview, HEAD và bot nhận biết được; triển khai luồng tel/mailto nếu đã nằm trong phạm vi.
- [ ] P07.08 — Kiểm thử không lộ draft qua slug/alias/RPC, retry event, URL không hợp lệ và hành vi lỗi thống kê.

**Tiêu chí kết thúc:** Trang đã xuất bản hiển thị đúng; click được gán đúng nguồn và giữ trải nghiệm mở link khi riêng bước ghi thống kê lỗi. Các giới hạn đo lường được mô tả rõ.

### P08 — Báo cáo thống kê

Phụ thuộc: P07.

- [ ] P08.01 — Hoàn thiện RPC tổng hợp theo thời gian, trang, link và vị trí; kiểm tra quyền quản trị.
- [ ] P08.02 — Xây bộ lọc ngày/trang/link, tổng click và các phân rã cần thiết; biểu đồ nếu đã chốt trong phạm vi.
- [ ] P08.03 — Chuyển ngày theo `Asia/Ho_Chi_Minh`, dùng khoảng `[from, to)` và snapshot nhất quán cho tổng/phân rã.
- [ ] P08.04 — Giữ dữ liệu báo cáo khi đổi slug, gỡ link, inactive/archive; không nhầm click với người duy nhất.
- [ ] P08.05 — Kiểm chứng fixture 12 click trang A + 5 click trang B = 17 cho cùng link và các biên ngày UTC/Việt Nam.
- [ ] P08.06 — Đo truy vấn bằng dữ liệu giả phù hợp tải đã chốt; điều chỉnh index theo kết quả, ghi số đo thực tế.

**Tiêu chí kết thúc:** Báo cáo trả đúng dữ liệu kiểm soát và đạt mục tiêu phản hồi đã chốt; chỉ người có quyền đọc được. Không thêm CSV, người duy nhất hoặc bảng tổng hợp nếu chưa có phạm vi tương ứng.

### P09 — Kiểm thử tích hợp và nghiệm thu staging

Phụ thuộc: P04–P08 và staging đã cấu hình.

- [ ] P09.01 — Chạy đầy đủ 16 tình huống trong mục 11 của tài liệu database; ghi kết quả từng nhóm và lỗi còn mở.
- [ ] P09.02 — Chạy E2E đăng nhập → tạo trang → upload → chọn link → preview → publish → mở link → xem báo cáo.
- [ ] P09.03 — Kiểm tra ranh giới Auth/RLS/RPC/Storage, secret trong bundle/log và nội dung đầu vào không tin cậy.
- [ ] P09.04 — Kiểm tra responsive, bàn phím, thông báo lỗi và các trình duyệt mục tiêu đã thống nhất.
- [ ] P09.05 — Kiểm tra build production, lỗi runtime, truy vấn chậm và giới hạn upload/report.
- [ ] P09.06 — Nhập/chỉnh 3 trang đầu trên staging bằng nội dung được cung cấp; ghi rõ nếu còn dùng nội dung giả.
- [ ] P09.07 — Đối chiếu tiêu chí nghiệm thu yêu cầu, sửa lỗi chặn phát hành và chạy lại kiểm tra bị ảnh hưởng.
- [ ] P09.08 — Ghi nhận kết quả duyệt staging, nội dung/phạm vi còn thiếu và quyết định đủ điều kiện phát hành.

**Tiêu chí kết thúc:** Các luồng trong phạm vi và kiểm tra bắt buộc đều đạt; không còn lỗi chặn phát hành. Kết quả có bằng chứng, không chỉ ghi “đã test”.

### P10 — Triển khai production và xác minh vận hành

Phụ thuộc: P09, quyền truy cập dịch vụ và quyết định phát hành đã được ghi nhận.

- [ ] P10.01 — Cấu hình Vercel production và Supabase production riêng; kiểm tra region, quota và gói dịch vụ phù hợp.
- [ ] P10.02 — Đặt biến môi trường đúng scope, Auth redirect URL và tên miền/HTTPS; Preview không dùng secret production.
- [ ] P10.03 — Thiết lập và kiểm tra khôi phục database/Storage ở môi trường tách biệt; ghi người phụ trách và mục tiêu phục hồi.
- [ ] P10.04 — Chuẩn bị migration tương thích ngược, bản phát hành và phương án rollback ứng dụng/phục hồi dữ liệu.
- [ ] P10.05 — Áp dụng migration production có kiểm soát, bootstrap quản trị và deploy bản đã kiểm tra; không migrate trong build.
- [ ] P10.06 — Đưa 3 trang thật lên production sau khi nội dung được duyệt; kiểm tra URL, ảnh và link thực tế.
- [ ] P10.07 — Kiểm tra nhanh sau deploy: quyền, trang công khai, draft, publish, redirect và báo cáo; phân biệt click kiểm thử nếu có.
- [ ] P10.08 — Theo dõi log, lỗi ghi click, dung lượng/băng thông và thời gian phản hồi trong khoảng theo dõi đã thống nhất.

**Tiêu chí kết thúc:** Website dùng được trên tên miền thật; dữ liệu/quyền được xác minh; cơ chế sao lưu/khôi phục đã kiểm tra; không còn lỗi vận hành chặn bàn giao.

### P11 — Bàn giao và kết thúc triển khai

Phụ thuộc: P10.

- [ ] P11.01 — Hoàn thiện hướng dẫn tạo/nhân bản trang, biên tập, xuất bản, đổi link và xem báo cáo.
- [ ] P11.02 — Hoàn thiện hướng dẫn kỹ thuật: chạy local, migration, deploy, rollback, cấp/thu hồi quản trị, sao lưu/khôi phục.
- [ ] P11.03 — Bàn giao quyền sở hữu repository, Vercel, Supabase và tên miền đúng người; không lưu credential trong tài liệu.
- [ ] P11.04 — Chốt giới hạn thống kê, retention, chi phí dịch vụ và trách nhiệm hỗ trợ/vận hành.
- [ ] P11.05 — Thực hiện buổi hướng dẫn/nghiệm thu, ghi nhận kết quả và danh sách việc còn lại nếu có.
- [ ] P11.06 — Cập nhật toàn bộ checklist và nhật ký cuối đợt; phân biệt lỗi cần xử lý với yêu cầu mở rộng sau bàn giao.

**Tiêu chí kết thúc:** Người nhận tự thực hiện được tác vụ quản trị chính; có tài liệu, quyền truy cập và kết quả nghiệm thu được ghi nhận.

## 4. Việc tiếp theo

P00, P01, P02 và P03 đã hoàn thành. Toàn bộ schema cơ sở dữ liệu PostgreSQL trên Supabase (10 bảng chính, 2 bảng phụ, FK ghép, constraints, trigger bảo vệ revision sealed, RLS, Storage policies, bộ khung 8 RPC nghiệp vụ), seed data và typed clients đã được thiết lập hoàn chỉnh và kiểm thử đạt 100%.

Bước tiếp theo là P04: Đăng nhập và khung quản trị (Tạo Supabase browser/server client SSR cookie, giao diện đăng nhập/đăng xuất, middleware kiểm tra quyền quản trị `admin_users.is_active` và layout quản trị CMS).

Mỗi đợt thực hiện tiếp theo phải dùng ID checklist như `P04.01`, `P04.02`, `P06.06` trong nhật ký để truy ngược việc làm với kế hoạch.
