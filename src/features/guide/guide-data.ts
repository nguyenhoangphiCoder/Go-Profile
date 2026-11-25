export interface QuickStartStep {
  id: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
}

export interface FormFieldDoc {
  field: string;
  required?: boolean;
  meaning: string;
  example?: string;
}

export interface FormDoc {
  formName: string;
  where: string;
  purpose: string;
  fields: FormFieldDoc[];
  submitNote?: string;
}

export interface MenuGuideSection {
  id: string;
  order: string;
  menuName: string;
  href: string;
  audience: string;
  summary: string;
  steps: { title: string; detail: string }[];
  forms: FormDoc[];
  tips: string[];
}

export interface BlockCatalogItem {
  name: string;
  type: string;
  group: "bio" | "landing" | "conversion";
  desc: string;
  whenToUse: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export const QUICK_START_STEPS: QuickStartStep[] = [
  {
    id: "qs-site",
    title: "Bước 1: Thiết lập Logo, Menu đầu trang & Chân trang (Footer)",
    desc: "Cấu hình 1 lần tại Cấu hình Website — toàn bộ Landing Page dùng chung bộ Menu sẽ tự động đồng bộ.",
    href: "/admin/site",
    cta: "Mở Cấu hình Website",
  },
  {
    id: "qs-media",
    title: "Bước 2: Tải sẵn ảnh thương hiệu & sản phẩm lên Kho hình ảnh",
    desc: "Hệ thống tự động nén sang WebP siêu nhẹ để web mở tức thì trên 4G và hỗ trợ cắt ảnh trực tiếp.",
    href: "/admin/media",
    cta: "Mở Kho hình ảnh",
  },
  {
    id: "qs-page",
    title: "Bước 3: Tạo trang đầu tiên (Bio Link hoặc Landing Page)",
    desc: "Chọn mẫu dựng sẵn (Trang chủ, Nhượng quyền, Menu, Báo giá sỉ...) rồi sửa chữ, ảnh và màu sắc theo ý muốn.",
    href: "/admin/pages",
    cta: "Mở Quản lý trang",
  },
  {
    id: "qs-branches",
    title: "Bước 4: Nhập danh sách chi nhánh lên Bản đồ tương tác 2 chiều",
    desc: "Dán link Google Maps để tự tách tọa độ hoặc Import file CSV hàng loạt hàng chục cửa hàng trong 5 giây.",
    href: "/admin/branches",
    cta: "Mở Hệ thống chi nhánh",
  },
  {
    id: "qs-publish",
    title: "Bước 5: Xem trước 3 màn hình (Mobile / Tablet / Desktop) & Xuất bản",
    desc: "Kiểm tra bố cục ở cột Xem trước bên phải, sau đó bấm nút Xuất bản màu xanh để công khai trang.",
    href: "/admin/pages",
    cta: "Kiểm tra trang",
  },
  {
    id: "qs-leads",
    title: "Bước 6: Bật nhận thông báo Telegram/Webhook & quản lý Leads",
    desc: "Mỗi khi khách điền Form trên web, thông tin tự lưu vào Khách hàng (Leads) và bắn ngay về Telegram/CRM.",
    href: "/admin/leads",
    cta: "Mở Khách hàng (Leads)",
  },
  {
    id: "qs-reports",
    title: "Bước 7: Theo dõi lượt click & tỷ lệ chuyển đổi ở Báo cáo thống kê",
    desc: "Xem chính xác nút nào được bấm nhiều nhất, nguồn quảng cáo (UTM) nào mang về nhiều khách chốt nhất.",
    href: "/admin/reports",
    cta: "Mở Báo cáo thống kê",
  },
];

export const EDITOR_SHORTCUTS = [
  { keys: "Ctrl + S (⌘S)", desc: "Lưu bản nháp hiện tại ngay lập tức" },
  { keys: "Ctrl + Z (⌘Z)", desc: "Hoàn tác (quay lại bước chỉnh sửa trước)" },
  { keys: "Ctrl + Y / Ctrl + Shift + Z", desc: "Làm lại bước vừa hoàn tác" },
  {
    keys: "Bấm trực tiếp trên Khung Xem Trước",
    desc: "Tự động chọn & mở đúng form chỉnh sửa của khối đó ở cột trái",
  },
  { keys: "Kéo biểu tượng 6 chấm (⋮⋮)", desc: "Kéo-thả đổi vị trí các khối nội dung mượt mà" },
];

export const MENU_GUIDES: MenuGuideSection[] = [
  {
    id: "tong-quan-dashboard",
    order: "01",
    menuName: "Bảng điều khiển & Thanh chuyển Workspace",
    href: "/admin",
    audience: "Tất cả vai trò",
    summary:
      "Màn hình tổng quan tình trạng Workspace hiện tại: số trang đang xuất bản, tổng lượt click, tổng khách hàng mới, lối tắt thao tác nhanh và bộ chuyển đổi giữa nhiều Workspace (Đa Tenant).",
    steps: [
      {
        title: "Phân biệt 2 chế độ trang: Profile (Bio Link) vs Landing Page (Website)",
        detail:
          "Trang Profile (Bio Link) hiển thị dạng cột dọc gọn gàng cho điện thoại (gắn TikTok, Facebook, Instagram, QR bàn). Trang Landing Page hiển thị toàn màn hình rộng kèm thanh Menu đầu trang, Footer và Bản đồ chi nhánh như một website hoàn chỉnh.",
      },
      {
        title: "Chuyển đổi Workspace trên Sidebar (góc trên bên trái)",
        detail:
          "Mỗi Workspace là một không gian dữ liệu độc lập hoàn toàn (trang, ảnh, chi nhánh, khách hàng tách biệt 100%). Nếu tài khoản thuộc nhiều Workspace (hoặc là SuperAdmin), bấm vào ô chọn Workspace để chuyển tức thì. Bên dưới hiển thị rõ Vai trò của bạn và Gói dịch vụ (FREE / PRO / ENTERPRISE).",
      },
      {
        title: "Mở nhanh trang công khai ở thanh trên cùng (Topbar)",
        detail:
          "Bấm nút 'Xem trang công khai' ở góc trên phải để mở trực tiếp website thật trên tab mới.",
      },
    ],
    forms: [
      {
        formName: "Modal '+ Tạo mới' Workspace nhanh (chỉ hiện với SuperAdmin)",
        where: "Góc trên Sidebar → cạnh chữ WORKSPACE → bấm '+ Tạo mới'",
        purpose:
          "Tạo nhanh một Workspace mới cho chi nhánh/đối tác mà không cần rời trang đang làm việc.",
        fields: [
          {
            field: "Tên Workspace",
            required: true,
            meaning: "Tên thương hiệu hoặc chi nhánh hiển thị trong hệ thống.",
            example: "Trà Sữa Xanh / Chi nhánh Hà Nội",
          },
          {
            field: "Gói tính năng",
            meaning:
              "Chọn Free / Pro / Enterprise — hệ thống tự điền hạn mức trang, ảnh, chi nhánh và bộ giao diện tương ứng.",
            example: "Pro (30 trang, 500MB ảnh, 100 chi nhánh)",
          },
          {
            field: "Email Chủ sở hữu (tùy chọn)",
            meaning:
              "Nếu email đã có tài khoản → gán làm Owner ngay lập tức; nếu chưa có → tự gửi lời mời. Để trống sẽ gán chính bạn làm Owner.",
            example: "quanly@doitac.com",
          },
          {
            field: "Chuyển ngay sang Workspace mới sau khi tạo",
            meaning: "Tích chọn để tự động chuyển môi trường làm việc sang Workspace vừa tạo.",
          },
        ],
      },
    ],
    tips: [
      "Nếu một số menu trên Sidebar không hiển thị (VD: Chi nhánh hoặc Khách hàng), nghĩa là gói dịch vụ hiện tại của Workspace chưa bật tính năng đó — hãy liên hệ SuperAdmin để bật trong /admin/system.",
    ],
  },
  {
    id: "quan-ly-trang",
    order: "02",
    menuName: "Quản lý trang & Trình thiết kế (Page Editor)",
    href: "/admin/pages",
    audience: "Biên tập viên / Chủ sở hữu / SuperAdmin",
    summary:
      "Nơi tạo mới, chỉnh sửa nội dung, thiết kế kiểu từng khối, chọn màu sắc/font chữ, lưu Mẫu dùng lại, khôi phục lịch sử phiên bản và xuất bản trang ra công khai.",
    steps: [
      {
        title: "Tạo trang mới",
        detail:
          "Vào Quản lý trang → bấm '+ Tạo trang mới' → chọn loại trang (Profile hoặc Landing Page), chọn mẫu dựng sẵn (hoặc Trang trống), nhập tên nội bộ, tiêu đề và đường dẫn (slug) → bấm Lưu tạo trang.",
      },
      {
        title: "Chỉnh sửa nội dung & Kiểu từng khối (cột bên trái)",
        detail:
          "Mỗi khối có 2 tab con: Tab 'Nội dung' (sửa chữ, ảnh, danh sách món, nút bấm...) và Tab 'Kiểu' (chỉnh màu nền tự do, gradient, ảnh nền + lớp phủ mờ, độ rộng, bo góc, viền, đổ bóng, khoảng đệm trên/dưới, font/cỡ chữ tới 72px, hiệu ứng xuất hiện, ID neo #anchor và ẩn trên điện thoại/máy tính).",
      },
      {
        title: "Dùng các nút thao tác nhanh trên mỗi khối & thanh công cụ",
        detail:
          "Trên tiêu đề khối có nút Lên/Xuống, Nhân bản khối (Copy), Ẩn/Hiện khối và Xóa. Trong Tab 'Kiểu' có nút 'Sao chép kiểu' & 'Dán kiểu' để đồng bộ thiết kế giữa các khối trong 1 giây. Trên thanh công cụ trên cùng có nút Hoàn tác (Ctrl+Z), Làm lại (Ctrl+Y), Lịch sử phiên bản (khôi phục bản cũ 1 click), và nút 'Mẫu' (Custom Templates) để lưu/áp dụng/xuất-nhập JSON mẫu trang.",
      },
      {
        title: "Xem trước 3 khung màn hình & Xuất bản",
        detail:
          "Cột bên phải hiển thị trực tiếp trang của bạn. Bấm chuyển qua lại giữa Điện thoại / Máy tính bảng / Máy tính để kiểm tra độ đẹp. Lưu ý: bấm 'Lưu nháp' chỉ lưu riêng cho bạn xem; bấm nút 'Xuất bản' màu xanh dương thì khách truy cập mới thấy bản cập nhật.",
      },
    ],
    forms: [
      {
        formName: "Form Tạo trang mới (/admin/pages/new)",
        where: "Quản lý trang → nút '+ Tạo trang mới'",
        purpose: "Khởi tạo trang Profile hoặc Landing Page mới.",
        fields: [
          {
            field: "Loại trang (Profile / Landing Page)",
            required: true,
            meaning: "Chọn Profile cho Bio Link dọc hoặc Landing Page cho Website đầy đủ.",
          },
          {
            field: "Mẫu dựng sẵn (Template)",
            meaning:
              "Chỉ hiện với Landing Page: chọn 1 trong 5 mẫu có sẵn (Trang chủ, Nhượng quyền, Menu, Báo giá sỉ, Câu chuyện) để có sẵn bố cục đẹp, chỉ việc thay chữ & ảnh.",
          },
          {
            field: "Tên nội bộ",
            required: true,
            meaning: "Tên dùng để bạn phân biệt trong danh sách quản trị (khách không thấy).",
            example: "Landing Nhượng Quyền Tháng 11",
          },
          {
            field: "Đường dẫn (Slug)",
            required: true,
            meaning: "Phần đuôi sau tên miền. Chỉ dùng chữ thường không dấu, số và dấu gạch ngang.",
            example: "nhuong-quyen → web sẽ có link /nhuong-quyen",
          },
        ],
      },
      {
        formName: "Form Kiểu khối — Block Design System v3",
        where: "Trong Page Editor → mở 1 khối → chọn tab 'Kiểu'",
        purpose: "Tùy chỉnh sâu giao diện từng khối mà không cần biết CSS.",
        fields: [
          {
            field: "Sao chép kiểu / Dán kiểu / Đặt lại",
            meaning:
              "Copy toàn bộ cấu hình màu, bo góc, padding, font của khối này sang khối khác trong 1 click.",
          },
          {
            field: "Font chữ, Cỡ chữ (tới 72px) & Màu chữ",
            meaning: "Ghi đè riêng font/cỡ/màu cho Tiêu đề và Nội dung của khối này.",
          },
          {
            field: "Nền tự do (Màu đơn / Gradient 2 màu / Ảnh nền + Lớp phủ tối)",
            meaning:
              "Chọn màu nền bất kỳ, dải chuyển màu theo 3 hướng (→, ↘, ↓), hoặc dán link ảnh nền kèm độ tối lớp phủ 0–90% để chữ nổi bật.",
          },
          {
            field: "Khung, Độ rộng, Bo góc, Viền, Đổ bóng & Đệm Trên/Dưới",
            meaning:
              "Tinh chỉnh độ rộng (Hẹp/Vừa/Rộng/Mặc định), bo góc, viền 1px/2px + màu viền, bóng đổ và khoảng thở trên/dưới độc lập.",
          },
          {
            field: "Hiệu ứng xuất hiện & ID Neo (Anchor ID)",
            meaning:
              "Chọn 1 trong 4 hiệu ứng (Trượt lên, Mờ dần, Phóng nhẹ, Trượt ngang). Đặt ID Neo (VD: bang-gia) để nút trên thanh Menu trỏ '#bang-gia' cuộn mượt thẳng xuống khối này.",
          },
        ],
      },
      {
        formName: "Form SEO & Cài đặt trang (Tab SEO)",
        where: "Page Editor → Tab 'SEO & Cài đặt'",
        purpose:
          "Tối ưu hiển thị khi chia sẻ link lên Facebook/Zalo/Google và chọn bộ Menu áp dụng.",
        fields: [
          {
            field: "Thanh Menu & Footer (Site Shell)",
            meaning:
              "Bật/tắt thanh Menu & Footer trên trang này (tắt nếu làm trang chiến dịch độc lập). Nếu Workspace có nhiều bộ Menu, chọn chính xác bộ Menu muốn gắn cho trang này.",
          },
          {
            field: "Meta Title & Meta Description",
            meaning:
              "Tiêu đề và mô tả hiển thị trên Google Search và thẻ xem trước khi gửi link qua Zalo/Facebook.",
          },
          {
            field: "Ảnh chia sẻ (OG Image)",
            meaning:
              "Ảnh bìa (khuyên dùng tỷ lệ 1200×630) hiện ra khi chia sẻ link lên mạng xã hội.",
          },
        ],
      },
      {
        formName: "Form Khối Đăng ký Khách hàng động (Lead Form Builder)",
        where: "Page Editor → thêm/mở khối 'Form đăng ký (lead_form)'",
        purpose: "Thu thập SĐT, Email và thông tin nhu cầu khách hàng ngay trên Landing Page.",
        fields: [
          {
            field: "Tên form nội bộ",
            required: true,
            meaning: "Tên dùng để lọc và phân loại khách ở mục Khách hàng (Leads).",
            example: "Đăng ký nhượng quyền / Báo giá sỉ cà phê",
          },
          {
            field: "Tự mở Popup sau (giây)",
            meaning:
              "Nhập 0 để chỉ hiện form cố định trên trang. Nhập VD: 10 để tự bật hộp thoại đăng ký sau 10 giây (chỉ hiện 1 lần mỗi phiên để không gây phiền).",
          },
          {
            field: "Tự chuyển hướng sau khi gửi thành công (redirectUrl)",
            meaning:
              "Tùy chọn: sau khi khách bấm Gửi thành công 1.2 giây, tự mở trang Cảm ơn (/cam-on), link tải Catalog PDF hoặc Zalo OA.",
          },
          {
            field: "Trường mở rộng (Custom Fields — tối đa 8 trường)",
            meaning:
              "Tự thêm ô nhập chữ, danh sách chọn (Dropdown — các phương án ngăn cách bằng dấu phẩy) hoặc ô tích chọn (Checkbox) kèm tùy chọn Bắt buộc. Câu trả lời tự động gộp gọn vào hồ sơ khách hàng ở /admin/leads.",
          },
        ],
      },
      {
        formName: "Form Khối Bản đồ Chi nhánh (Store Locator)",
        where: "Page Editor → thêm/mở khối 'Bản đồ chi nhánh (store_locator)'",
        purpose:
          "Hiển thị bản đồ Google Maps tiếng Việt tương tác 2 chiều với danh sách quán của Workspace.",
        fields: [
          {
            field: "Kiểu nền bản đồ",
            meaning: "Chọn Google Maps chuẩn, Ảnh vệ tinh, hoặc Vệ tinh + Tên đường.",
          },
          {
            field: "URL Icon Pin chi nhánh riêng",
            meaning:
              "Dán link logo thương hiệu của bạn để thay thế icon pin mặc định trên bản đồ (White-Label).",
          },
          {
            field: "Mức phóng mặc định & Bộ lọc",
            meaning:
              "Chỉnh độ phóng ban đầu (10–16), bật/tắt ô tìm kiếm không dấu và bộ lọc theo Quận/Huyện.",
          },
        ],
      },
    ],
    tips: [
      "Nhớ bấm nút 'Xuất bản' màu xanh dương sau khi chỉnh sửa xong — nút 'Lưu nháp' chỉ lưu tạm để xem trước, chưa hiển thị cho khách.",
      "Dùng nút 'Mẫu' trên thanh công cụ để lưu bố cục trang bạn ưng ý nhất, sau đó mở trang mới và bấm 'Thay thế toàn bộ' hoặc 'Chèn thêm khối' để nhân bản chỉ trong 3 giây.",
    ],
  },
  {
    id: "cau-hinh-website",
    order: "03",
    menuName: "Cấu hình Website (Đa bộ Menu / Header / Footer / Tích hợp)",
    href: "/admin/site",
    audience: "Biên tập viên / Chủ sở hữu / SuperAdmin",
    summary:
      "Thiết kế khung Website dùng chung cho các Landing Page. Hỗ trợ tạo NHIỀU bộ Menu/Site Shell độc lập trong cùng 1 Workspace (VD: Bộ Menu Website Chính + Bộ Menu Chiến dịch Nhượng quyền riêng).",
    steps: [
      {
        title: "Quản lý nhiều bộ Menu / Site Shell ở thanh trên cùng",
        detail:
          "Bấm chọn bộ Menu đang muốn sửa, hoặc bấm '+ Tạo bộ Menu mới' để tách riêng hoàn toàn Thanh Menu, Logo, Header, Footer và Nút nổi cho từng nhóm trang. Bấm 'Đặt mặc định' cho bộ chính.",
      },
      {
        title: "Tab 1 — Thanh Menu (2 cấp)",
        detail:
          "Bấm '+ Thêm Tab cấp 1' để tạo mục trên thanh điều hướng (trỏ tới 1 Trang có sẵn, 1 ID Neo #bang-gia, hoặc 1 Link ngoài). Bấm '+ Mục con' trên từng tab cha để tạo menu thả xuống cấp 2. Bấm 'Tạo trang mới cho tab' để vừa tạo trang Landing Page vừa gắn lên Menu trong 1 bước.",
      },
      {
        title: "Tab 2 — Header, Nút nổi, Favicon, Pixel & Thông báo Lead",
        detail:
          "Tùy chỉnh toàn diện thanh Navbar (4 bố cục, độ cao, kích thước logo, font/cỡ/màu chữ, kiểu hiệu ứng đang chọn, nền kính mờ/đặc/trong suốt, nút CTA bên phải, thanh thông báo trên cùng Announcement Bar), cụm Nút nổi động, Favicon riêng, Marketing Pixels và Telegram/Webhook nhận Lead.",
      },
      {
        title: "Tab 3 — Chân trang (Footer)",
        detail:
          "Chọn bố cục 1–4 cột hoặc căn giữa, chọn nhanh 1 trong 8 bảng màu dựng sẵn hoặc tự chọn 3 màu (Nền / Chữ / Nhấn), sắp xếp thứ tự cột, điền mô tả và danh sách liên kết nội bộ có gợi ý sẵn.",
      },
    ],
    forms: [
      {
        formName: "Form Thêm / Sửa Tab Menu (Tab 1)",
        where: "Cấu hình Website → Tab 'Thanh Menu (2 cấp)' → '+ Thêm Tab cấp 1' hoặc '+ Mục con'",
        purpose: "Tạo mục điều hướng trên thanh Menu đầu trang.",
        fields: [
          {
            field: "Tên hiển thị trên Menu",
            required: true,
            meaning: "Chữ khách nhìn thấy trên thanh điều hướng.",
            example: "Về chúng tôi / Menu / Nhượng quyền",
          },
          {
            field: "Loại đích đến",
            required: true,
            meaning:
              "Chọn 'Trang trong hệ thống' (chọn từ danh sách trang), 'Neo mục lục (#anchor)' (cuộn tới khối có ID neo), hoặc 'Đường dẫn ngoài (URL)' (VD: link tuyển dụng/Shopee).",
          },
        ],
      },
      {
        formName: "Form Cụm nút liên hệ nổi động (Floating Action Bar — Tab 2)",
        where: "Cấu hình Website → Tab 'Header & Nút nổi' → mục 'Cụm nút liên hệ nổi'",
        purpose: "Hiển thị các nút liên hệ nhanh cố định góc màn hình trên mọi Landing Page.",
        fields: [
          {
            field: "Nút Gọi điện (Hotline) & Nút Nhắn Zalo",
            meaning: "Bật/tắt 2 nút cơ bản và nhập số điện thoại / link zalo.me.",
          },
          {
            field: "Vị trí cụm nút nổi & Nút Lên đầu trang (Back-to-Top)",
            meaning:
              "Chọn đặt góc dưới Phải hoặc góc dưới Trái; tích chọn để hiện nút mũi tên cuộn mượt lên đầu trang.",
          },
          {
            field: "Nút nổi mở rộng (tối đa 6 nút)",
            meaning:
              "Bấm '+ Thêm nút nổi' để gắn thêm Messenger, TikTok, Google Maps hoặc bất kỳ link nào, tự chọn màu nền cho từng nút.",
          },
        ],
      },
      {
        formName: "Form Favicon, Bản quyền, Pixel & Telegram/Webhook (Tab 2)",
        where: "Cấu hình Website → Tab 'Header & Nút nổi' (phần dưới)",
        purpose:
          "Cá nhân hóa nhận diện thương hiệu (White-Label), đo lường quảng cáo và nhận báo Lead tự động.",
        fields: [
          {
            field: "URL Favicon riêng & Dòng bản quyền & Liên kết pháp lý",
            meaning:
              "Gắn icon vuông hiển thị trên tab trình duyệt, sửa dòng © Copyright và thêm tối đa 6 link pháp lý (Điều khoản, Chính sách bảo mật) ở đáy Footer.",
          },
          {
            field: "Google Analytics 4 / Meta Pixel / TikTok Pixel",
            meaning:
              "Dán ID đo lường (GA4 dạng G-XXXX, Meta/TikTok dạng số/ký tự). Hệ thống tự kiểm tra an toàn và tự bắn sự kiện chuyển đổi Lead khi khách gửi form.",
          },
          {
            field: "Telegram Bot Token, Chat ID & Webhook URL (https://)",
            meaning:
              "Cấu hình riêng cho từng Workspace: mỗi khi có khách điền Form, hệ thống bắn tin nhắn ngay về nhóm Telegram của bạn hoặc đẩy JSON sang Make / n8n / Google Sheets / CRM (token được bảo mật tuyệt đối, không bao giờ lộ ra trình duyệt khách).",
          },
        ],
      },
    ],
    tips: [
      "Sau khi chỉnh sửa bất kỳ thông số nào ở Tab 2 (Header/Nút nổi/Favicon/Telegram) hoặc Tab 3 (Footer), hãy kéo xuống bấm nút 'Lưu cấu hình' màu đen ở góc dưới bên phải để áp dụng.",
      "Chọn 'Trang chủ mặc định (/)' ở Tab 2 để khi khách gõ tên miền gốc không cần /slug sẽ tự mở đúng trang chủ của bạn.",
    ],
  },
  {
    id: "he-thong-chi-nhanh",
    order: "04",
    menuName: "Hệ thống chi nhánh (Bản đồ 55+ cửa hàng)",
    href: "/admin/branches",
    audience: "Biên tập viên / Chủ sở hữu / SuperAdmin",
    summary:
      "Quản lý toàn bộ danh sách cửa hàng/chi nhánh của Workspace. Dữ liệu cập nhật ở đây sẽ tự động đồng bộ tức thì lên mọi khối Bản đồ chi nhánh (store_locator) trên các Landing Page.",
    steps: [
      {
        title: "Thêm từng chi nhánh mới",
        detail:
          "Bấm '+ Thêm chi nhánh', điền Tên quán, Địa chỉ, Quận/Huyện, Thành phố. Dán link Google Maps của quán vào ô Link Google Maps để hệ thống tự tách tọa độ kinh độ/vĩ độ (lat/lng), hoặc bấm 'Tìm tọa độ tự động' theo địa chỉ.",
      },
      {
        title: "Nhập hàng loạt bằng file Excel / CSV",
        detail:
          "Bấm nút 'Import CSV' → tải file CSV mẫu về mở bằng Excel/Google Sheets → điền danh sách chi nhánh → lưu dạng UTF-8 CSV → tải lên để nhập cùng lúc hàng chục quán.",
      },
      {
        title: "Ẩn tạm thời hoặc Sửa thông tin quán",
        detail:
          "Nếu 1 cửa hàng tạm đóng sửa chữa, chỉ cần tắt trạng thái 'Đang mở cửa' — quán sẽ tự ẩn khỏi bản đồ công khai mà không mất dữ liệu.",
      },
    ],
    forms: [
      {
        formName: "Form Thêm / Chỉnh sửa chi nhánh",
        where: "Hệ thống chi nhánh → nút '+ Thêm chi nhánh' hoặc nút Sửa (bút chì)",
        purpose: "Lưu thông tin chi tiết và tọa độ bản đồ cho 1 cửa hàng.",
        fields: [
          { field: "Mã quán (tùy chọn)", meaning: "Mã quản lý nội bộ (VD: GC-Q1-01)." },
          {
            field: "Tên chi nhánh",
            required: true,
            meaning: "Tên hiển thị trên danh sách & popup bản đồ.",
            example: "Gờ Café — Nguyễn Huệ",
          },
          {
            field: "Địa chỉ chi tiết",
            required: true,
            meaning: "Số nhà, tên đường đầy đủ.",
            example: "42 Nguyễn Huệ, P. Bến Nghé",
          },
          {
            field: "Quận / Huyện & Thành phố",
            required: true,
            meaning: "Dùng để tạo nút lọc nhanh theo Quận trên bản đồ.",
            example: "Quận 1 / TP.HCM",
          },
          {
            field: "Số điện thoại & Giờ mở cửa",
            meaning: "Hiện nút Gọi/Zalo trực tiếp và khung giờ hoạt động trên thẻ quán.",
            example: "0909 123 456 / 06:30 - 22:00",
          },
          {
            field: "Link Google Maps & Tọa độ (Lat / Lng)",
            meaning:
              "Dán link Google Maps có chứa @10.77...,106.70... hệ thống tự động điền Lat/Lng chính xác để cắm ghim lên bản đồ.",
          },
        ],
      },
    ],
    tips: [
      "Mỗi quán cần có đủ tọa độ Lat và Lng thì mới hiện ghim (Pin) trên bản đồ. Nếu chỉ có địa chỉ chưa có tọa độ, quán vẫn hiện ở danh sách tìm kiếm bên phải.",
    ],
  },
  {
    id: "khach-hang-leads",
    order: "05",
    menuName: "Khách hàng tiềm năng (Leads)",
    href: "/admin/leads",
    audience: "Người xem (chỉ xem) / Biên tập viên / Chủ sở hữu / SuperAdmin",
    summary:
      "Hộp thư quản lý toàn bộ khách hàng đã điền Form đăng ký trên các Landing Page (Nhượng quyền, Báo giá sỉ, Tư vấn...). Tích hợp chống spam 2 lớp (Honeypot + Giới hạn 5 lượt/10 phút/IP).",
    steps: [
      {
        title: "Lọc & tìm kiếm nhanh khách hàng",
        detail:
          "Dùng thanh tìm kiếm không dấu theo Tên, SĐT, Email hoặc Ghi chú. Lọc nhanh theo 4 trạng thái (Mới / Đã liên hệ / Đã chốt / Spam), theo tên Form, theo Trang nguồn và theo Khoảng ngày.",
      },
      {
        title: "Cập nhật trạng thái chăm sóc ngay trên bảng",
        detail:
          "Bấm vào ô Trạng thái của từng khách để đổi trực tiếp từ 'Mới' → 'Đã liên hệ' → 'Đã chốt' (hoặc 'Spam'). Số liệu tỷ lệ chốt ở Báo cáo thống kê sẽ tự động cập nhật theo.",
      },
      {
        title: "Xuất danh sách ra Excel (CSV)",
        detail:
          "Sau khi lọc đúng tập khách mong muốn, bấm nút 'Xuất CSV (Excel)' ở góc trên phải để tải file về máy (đã mã hóa UTF-8 BOM không lỗi font tiếng Việt và chống mã độc công thức Excel).",
      },
    ],
    forms: [
      {
        formName: "Bộ lọc & Quản lý Leads",
        where: "Khách hàng (Leads) → thanh công cụ phía trên bảng",
        purpose: "Tra cứu, phân loại và xuất dữ liệu khách đăng ký.",
        fields: [
          {
            field: "Ô tìm kiếm",
            meaning: "Gõ tên khách, SĐT hoặc từ khóa trong nhu cầu (hỗ trợ gõ không dấu).",
          },
          {
            field: "Lọc Trạng thái / Form / Trang / Từ ngày - Đến ngày",
            meaning: "Thu hẹp danh sách trước khi xử lý hoặc xuất Excel.",
          },
          {
            field: "Cột Ghi chú & Nguồn UTM",
            meaning:
              "Hiển thị đầy đủ câu trả lời từ các Trường mở rộng (Custom Fields) dạng [Tên trường]: Giá trị và nguồn quảng cáo (utm_source / utm_campaign).",
          },
        ],
      },
    ],
    tips: [
      "Mọi khách gửi form đều tự động gắn nguồn UTM nếu bạn chạy quảng cáo có đuôi ?utm_source=facebook&utm_campaign=... trên link Landing Page.",
    ],
  },
  {
    id: "danh-muc-lien-ket-va-media",
    order: "06",
    menuName: "Danh mục liên kết & Kho hình ảnh",
    href: "/admin/links",
    audience: "Biên tập viên / Chủ sở hữu / SuperAdmin",
    summary:
      "Quản lý tập trung toàn bộ đường dẫn (ShopeeFood, GrabFood, Hotline, Mạng xã hội) và kho ảnh của Workspace để dùng lại nhiều nơi mà không cần tải đi tải lại.",
    steps: [
      {
        title: "Danh mục liên kết (/admin/links)",
        detail:
          "Tạo 1 lần cho mỗi đích đến (VD: Link ShopeeFood, Link Tuyển dụng). Sau đó gắn link này vào nhiều trang khác nhau — khi cần đổi URL, chỉ sửa 1 chỗ duy nhất là toàn bộ các trang tự cập nhật và vẫn giữ trọn lịch sử thống kê click.",
      },
      {
        title: "Kho hình ảnh (/admin/media)",
        detail:
          "Tải ảnh trực tiếp từ máy tính. Hệ thống tự động nén sang định dạng WebP siêu nhẹ để tiết kiệm dung lượng gói và giúp web mở nhanh gấp 3–5 lần. Có công cụ cắt ảnh (Crop) ngay khi tải lên.",
      },
    ],
    forms: [
      {
        formName: "Form Thêm / Sửa Liên kết (/admin/links)",
        where: "Danh mục liên kết → nút '+ Thêm liên kết'",
        purpose: "Lưu trữ liên kết dùng chung có theo dõi lượt bấm (click tracking).",
        fields: [
          {
            field: "Nhãn mặc định",
            required: true,
            meaning: "Tên hiển thị trên nút bấm.",
            example: "Đặt món qua ShopeeFood",
          },
          {
            field: "Đường dẫn đích (URL / SĐT / Email)",
            required: true,
            meaning: "Link https://..., tel:0909..., hoặc mailto:...",
            example: "https://shopeefood.vn/...",
          },
          {
            field: "Phân loại",
            meaning: "Liên kết thường (Standard), Mạng xã hội (Social), hoặc Liên hệ (Contact).",
          },
          { field: "Ảnh đại diện mặc định", meaning: "Icon/ảnh nhỏ đi kèm nút bấm (tùy chọn)." },
        ],
      },
    ],
    tips: [
      "Hệ thống có cơ chế bảo vệ chống xóa nhầm: ảnh đang được gắn trên trang đã xuất bản hoặc đang làm Logo sẽ không thể bị xóa cho tới khi bạn gỡ ra khỏi trang đó.",
    ],
  },
  {
    id: "bao-cao-thong-ke",
    order: "07",
    menuName: "Báo cáo thống kê (Click & Chuyển đổi Leads)",
    href: "/admin/reports",
    audience: "Tất cả vai trò",
    summary:
      "Đo lường hiệu quả thực tế của mọi trang Profile và Landing Page theo múi giờ Việt Nam (UTC+7): biểu đồ lượt click theo ngày, xếp hạng nút bấm hiệu quả nhất và phễu chuyển đổi khách hàng (Leads).",
    steps: [
      {
        title: "Chọn khoảng thời gian & bộ lọc",
        detail:
          "Chọn nhanh Hôm nay / 7 ngày qua / 30 ngày qua / Tháng này hoặc chọn ngày tùy chỉnh; có thể lọc sâu theo từng Trang hoặc từng Liên kết cụ thể.",
      },
      {
        title: "Đọc 2 phần báo cáo song song",
        detail:
          "Phần 1 thống kê Lượt bấm liên kết (tổng click, biểu đồ ngày, phân rã theo trang & từng vị trí nút). Phần 2 thống kê Chuyển đổi Leads (tổng khách mới, tỷ lệ đã liên hệ/đã chốt, xếp hạng theo Form và theo nguồn UTM).",
      },
    ],
    forms: [],
    tips: [
      "Lượt xem/bấm trong lúc bạn đang thiết kế ở chế độ Xem trước (Preview) hoặc của bot tìm kiếm sẽ tự động được loại trừ để số liệu báo cáo luôn chính xác 100%.",
    ],
  },
  {
    id: "thanh-vien-workspace",
    order: "08",
    menuName: "Thành viên (Phân quyền trong Workspace)",
    href: "/admin/members",
    audience: "Chủ sở hữu (Owner) / SuperAdmin",
    summary:
      "Mời nhân sự cùng quản trị Workspace hiện tại và phân chia rõ 3 cấp quyền để tránh sửa/xóa nhầm dữ liệu quan trọng.",
    steps: [
      {
        title: "Hiểu rõ 3 vai trò trong Workspace",
        detail:
          "1) Chủ sở hữu (Owner): Toàn quyền trong Workspace, bao gồm mời/gỡ thành viên. 2) Biên tập viên (Editor): Tạo/sửa/xuất bản trang, cấu hình website, chi nhánh, xử lý leads, tải ảnh. 3) Người xem (Viewer): Chỉ xem báo cáo, danh sách trang và danh sách leads — không thể chỉnh sửa hay xóa.",
      },
      {
        title: "Mời thành viên mới & đổi vai trò",
        detail:
          "Nhập Email và chọn Vai trò → bấm 'Gửi lời mời'. Nếu người đó chưa có tài khoản sẽ nhận email kích hoạt; nếu đã có tài khoản sẽ tự vào Workspace ở lần đăng nhập kế tiếp. Bạn có thể đổi vai trò hoặc thu hồi lời mời bất cứ lúc nào.",
      },
    ],
    forms: [
      {
        formName: "Form Mời thành viên mới",
        where: "Thành viên → khung phía trên cùng",
        purpose: "Cấp quyền truy cập Workspace hiện tại cho nhân viên/đối tác.",
        fields: [
          {
            field: "Email thành viên",
            required: true,
            meaning: "Địa chỉ email dùng để đăng nhập hệ thống.",
            example: "marketing@congty.vn",
          },
          {
            field: "Vai trò",
            required: true,
            meaning: "Chọn Người xem, Biên tập viên hoặc Chủ sở hữu.",
          },
        ],
      },
    ],
    tips: [
      "Mỗi Workspace luôn phải còn ít nhất 1 Chủ sở hữu (Owner) — hệ thống sẽ tự chặn nếu bạn vô tình xóa hoặc hạ quyền Chủ sở hữu cuối cùng.",
    ],
  },
  {
    id: "trung-tam-superadmin",
    order: "09",
    menuName: "Quản trị hệ thống — Trung tâm SuperAdmin (Đa Tenant)",
    href: "/admin/system",
    audience: "Chỉ SuperAdmin (Quản trị toàn nền tảng)",
    summary:
      "Bảng điều khiển cao nhất giúp 1 tài khoản SuperAdmin quản lý tập trung toàn bộ Workspaces (Khách hàng/Chi nhánh), toàn bộ Tài khoản người dùng, Tên miền riêng (Custom Domains) và Nhật ký hệ thống (Audit Logs).",
    steps: [
      {
        title: "Tab 1 — Workspaces (Tenants)",
        detail:
          "Xem thống kê toàn nền tảng (Tổng Workspace, Tổng User, Tổng Trang, Tổng Leads). Tạo Workspace mới (tự khởi tạo sẵn 1 bộ Menu mặc định), bấm nút 'Truy cập →' để nhảy thẳng vào quản trị dữ liệu của bất kỳ Tenant nào, Đổi tên, bấm 'Gói & Giới hạn' để bật/tắt từng tính năng (Landing, Chi nhánh, Leads, Tracking, Tên miền riêng) và đặt hạn mức Trang/Ảnh/Chi nhánh/Bộ giao diện, hoặc Lưu trữ/Khôi phục.",
      },
      {
        title: "Tab 2 — Người dùng (Users)",
        detail:
          "Xem toàn bộ tài khoản trên hệ thống. Bấm '+ Tạo tài khoản mới' để cấp ngay tài khoản kèm mật khẩu (đã xác thực sẵn, đăng nhập được ngay không cần chờ email). Trên mỗi tài khoản có thể: Gán thêm/Gỡ khỏi nhiều Workspace với vai trò khác nhau, Đặt lại mật khẩu, Cấp/Gỡ quyền SuperAdmin, hoặc Khóa/Mở khóa đăng nhập.",
      },
      {
        title: "Tab 3 — Tên miền (Custom Domains)",
        detail:
          "Gắn tên miền riêng (VD: go-cafe.com, shop.doitac.vn) cho từng Workspace và chọn Trang chủ mặc định khi khách mở tên miền đó. Có sẵn hướng dẫn trỏ bản ghi DNS (A: 76.76.21.21 / CNAME: cname.vercel-dns.com), nút 'Đổi trang chủ' ngay tại chỗ, Tạm tắt hoặc Xóa.",
      },
      {
        title: "Tab 4 — Nhật ký hệ thống (Audit Logs)",
        detail:
          "Ghi vết tự động mọi thao tác nhạy cảm của SuperAdmin (ai làm, làm lúc mấy giờ, tác động lên Workspace/User/Domain nào) kèm ô tìm kiếm nhanh để kiểm toán bảo mật.",
      },
    ],
    forms: [
      {
        formName: "Form Tạo Workspace (Tab 1) & Form Tạo Tài khoản trực tiếp (Tab 2)",
        where: "Quản trị hệ thống (/admin/system)",
        purpose:
          "Khởi tạo nhanh không gian làm việc và tài khoản bàn giao cho khách hàng / chi nhánh.",
        fields: [
          {
            field: "Tên Workspace + Gói (Free / Pro / Enterprise)",
            required: true,
            meaning:
              "Chọn gói sẽ tự điền sẵn bộ Feature Flags & Hạn mức chuẩn (vẫn chỉnh tay từng số liệu được).",
          },
          {
            field: "Email + Mật khẩu ban đầu (≥ 8 ký tự)",
            required: true,
            meaning:
              "Khi tạo tài khoản ở Tab 2, tài khoản được xác thực email sẵn — gửi email & mật khẩu là nhân sự đăng nhập làm việc ngay.",
          },
          {
            field: "Gán ngay vào Workspace & Vai trò",
            meaning: "Gán luôn người dùng mới vào đúng Workspace cần quản lý ngay trong bước tạo.",
          },
        ],
      },
      {
        formName: "Form Gắn Tên miền riêng (Tab 3 — Tên miền)",
        where: "Quản trị hệ thống → Tab 'Tên miền'",
        purpose:
          "Định tuyến tự động tên miền riêng của từng thương hiệu về đúng trang chủ của Workspace đó.",
        fields: [
          {
            field: "Tên miền",
            required: true,
            meaning:
              "Nhập dạng go-cafe.com hoặc shop.doitac.vn (tự chuẩn hóa chữ thường, tự hỗ trợ cả www.).",
          },
          {
            field: "Thuộc Workspace",
            required: true,
            meaning: "Chọn Workspace sở hữu tên miền này.",
          },
          {
            field: "Trang chủ khi mở tên miền (/)",
            meaning:
              "Chọn 1 trang cụ thể của Workspace đó, hoặc để mặc định (tự lấy Trang chủ trong Cấu hình Website).",
          },
        ],
      },
    ],
    tips: [
      "SuperAdmin có quyền 'Truy cập' vào mọi Workspace và tự động bỏ qua giới hạn Feature Flag/Quota để hỗ trợ cấu hình hộ khách hàng khi cần.",
      "Hệ thống tự động chặn SuperAdmin tự khóa tài khoản hoặc tự gỡ quyền SuperAdmin của chính mình để tránh mất quyền kiểm soát hệ thống.",
    ],
  },
];

export const BLOCK_CATALOG: BlockCatalogItem[] = [
  {
    name: "Hồ sơ đầu trang (Header)",
    type: "header",
    group: "bio",
    desc: "Ảnh đại diện tròn, tên thương hiệu và mô tả ngắn cho trang Bio Link.",
    whenToUse: "Luôn đặt trên cùng của trang Profile / Bio Link.",
  },
  {
    name: "Danh sách liên kết (Link List)",
    type: "link_list",
    group: "bio",
    desc: "Cụm nhiều nút bấm xếp dọc có icon, tự động đếm lượt click qua /r/.",
    whenToUse: "Liệt kê nhanh ShopeeFood, GrabFood, Menu, Website, Zalo.",
  },
  {
    name: "Nút nổi bật (Button)",
    type: "button",
    group: "bio",
    desc: "Một nút kêu gọi hành động lớn có phụ đề và màu sắc tùy biến riêng.",
    whenToUse: "Nhấn mạnh 1 hành động quan trọng nhất (VD: Đặt món ngay, Gọi Hotline).",
  },
  {
    name: "Biểu tượng MXH (Social Icons)",
    type: "social_icons",
    group: "bio",
    desc: "Hàng icon Facebook, TikTok, Instagram, YouTube, Zalo gọn gàng.",
    whenToUse: "Đặt dưới Header hoặc cuối trang Profile.",
  },
  {
    name: "Tiêu đề (Heading) & Đoạn văn (Text)",
    type: "heading / text",
    group: "bio",
    desc: "Chèn tiêu đề phân mục hoặc đoạn văn định dạng Rich Text (in đậm, nghiêng, danh sách).",
    whenToUse: "Tách nhóm nội dung hoặc viết giới thiệu, thông báo.",
  },
  {
    name: "Hình ảnh (Image) & Thư viện ảnh (Gallery)",
    type: "image / gallery",
    group: "bio",
    desc: "Hiển thị 1 ảnh đơn hoặc lưới nhiều ảnh (tối đa 12 ảnh).",
    whenToUse: "Trưng bày không gian quán, món mới, hình ảnh hoạt động.",
  },
  {
    name: "Thẻ món / Thực đơn (Menu Card)",
    type: "menu_card",
    group: "bio",
    desc: "Danh sách món kèm ảnh nhỏ, giá bán và nhãn Hot/Mới.",
    whenToUse: "Hiển thị nhanh các món bán chạy trên trang Profile.",
  },
  {
    name: "Video YouTube / TikTok & Bản đồ đơn",
    type: "video_embed / map",
    group: "bio",
    desc: "Nhúng video YouTube/Shorts/TikTok hoặc bản đồ chỉ đường 1 địa điểm.",
    whenToUse: "Giới thiệu clip review quán hoặc chỉ đường cho 1 chi nhánh lẻ.",
  },
  {
    name: "Khoảng trống (Spacer) & Đường kẻ (Divider)",
    type: "spacer / divider",
    group: "bio",
    desc: "Tạo khoảng thở thẩm mỹ hoặc đường phân cách mảnh giữa các khối.",
    whenToUse: "Giúp trang thoáng mắt, bố cục rõ ràng hơn.",
  },
  {
    name: "Hero Banner / Video (Hero Section)",
    type: "hero_section",
    group: "landing",
    desc: "Banner mở đầu ấn tượng hỗ trợ ảnh nền hoặc Video MP4 tự chạy, lớp phủ tối và 2 nút CTA.",
    whenToUse: "Khối mở đầu bắt buộc cho Trang chủ và các trang Landing Page chiến dịch.",
  },
  {
    name: "Banner Slider (Carousel)",
    type: "banner_slider",
    group: "landing",
    desc: "Trình chiếu nhiều ảnh banner tự chạy kèm tiêu đề, mô tả và nút hành động riêng từng slide.",
    whenToUse: "Chạy nhiều chương trình khuyến mãi, sự kiện hoặc bộ sưu tập món mới.",
  },
  {
    name: "Mục lục neo ngang (TOC Bar)",
    type: "toc_bar",
    group: "landing",
    desc: "Thanh mục lục cuộn nhanh tới các phần trong cùng trang bằng ID Neo (#anchor).",
    whenToUse: "Dùng cho trang dài nhiều phần (VD: Trang Nhượng quyền, Câu chuyện thương hiệu).",
  },
  {
    name: "Dải số liệu nổi bật (Stats Strip)",
    type: "stats_strip",
    group: "landing",
    desc: "Hiển thị 2–4 con số ấn tượng (VD: 55+ Chi nhánh, 100% Cà phê rang mộc, 1M+ Ly/năm).",
    whenToUse: "Tăng độ tin cậy thương hiệu ngay dưới Hero Banner.",
  },
  {
    name: "Ảnh + Văn bản 2 cột (Split Content)",
    type: "split_content",
    group: "landing",
    desc: "Bố cục 2 cột (Ảnh trái – Chữ phải hoặc ngược lại), hỗ trợ ảnh nền trong suốt PNG đẹp mắt.",
    whenToUse: "Giới thiệu câu chuyện, quy trình rang xay, điểm mạnh sản phẩm.",
  },
  {
    name: "Lưới thẻ thông tin (Info Cards)",
    type: "info_cards",
    group: "landing",
    desc: "2–4 cột thẻ nội dung có ảnh/icon, tiêu đề và mô tả ngắn.",
    whenToUse: "Trình bày 4 giá trị cốt lõi, quyền lợi đối tác, quy trình 4 bước.",
  },
  {
    name: "Lưới Sản phẩm / Menu (Product Grid)",
    type: "product_grid",
    group: "landing",
    desc: "Lưới sản phẩm có thanh lọc theo danh mục (Cà phê, Trà sữa, Bánh...) và nút đặt mua.",
    whenToUse: "Trang Thực đơn đồ uống hoặc danh mục sản phẩm đóng gói.",
  },
  {
    name: "Đánh giá khách hàng (Testimonials)",
    type: "testimonials",
    group: "landing",
    desc: "Trích dẫn cảm nhận khách hàng / đối tác kèm ảnh đại diện và số sao đánh giá.",
    whenToUse: "Tạo bằng chứng xã hội (Social Proof) trước khi kêu gọi đăng ký.",
  },
  {
    name: "Hỏi đáp xổ xuống (Accordion / FAQ)",
    type: "accordion",
    group: "landing",
    desc: "Danh sách câu hỏi thường gặp bấm để mở/đóng câu trả lời gọn gàng.",
    whenToUse: "Giải đáp thắc mắc về vốn nhượng quyền, giao hàng, chính sách đại lý.",
  },
  {
    name: "Bảng giá / Gói dịch vụ (Pricing Table)",
    type: "pricing_table",
    group: "conversion",
    desc: "So sánh các gói đầu tư/nhượng quyền/combo kèm danh sách quyền lợi và nút đăng ký.",
    whenToUse: "Trang Nhượng quyền hoặc Báo giá sỉ cà phê.",
  },
  {
    name: "Bản đồ Hệ thống Chi nhánh (Store Locator)",
    type: "store_locator",
    group: "conversion",
    desc: "Bản đồ Google Maps tương tác 2 chiều với danh sách quán, lọc Quận, tìm không dấu, Pin logo riêng.",
    whenToUse: "Trang Danh sách chi nhánh hoặc phần tìm quán gần nhất ở Trang chủ.",
  },
  {
    name: "Form Đăng ký Khách hàng (Lead Form)",
    type: "lead_form",
    group: "conversion",
    desc: "Form tùy biến trường mở rộng (Text/Dropdown/Checkbox), chống spam, Popup hẹn giờ, tự chuyển hướng & báo Telegram.",
    whenToUse: "Đặt ở cuối mọi Landing Page để thu thập khách hàng tiềm năng.",
  },
  {
    name: "Dải kêu gọi hành động (CTA Banner)",
    type: "cta_banner",
    group: "conversion",
    desc: "Khối nhấn mạnh chốt chuyển đổi (3 tông Đen / Vàng / Kem) với 2 nút hành động lớn.",
    whenToUse: "Đặt xen kẽ giữa trang hoặc cuối trang để kéo khách về Form/Hotline.",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Tại sao tôi đã bấm 'Lưu nháp' nhưng mở link trang công khai vẫn thấy nội dung cũ?",
    a: "Nút 'Lưu nháp' chỉ lưu bản chỉnh sửa riêng trong khu vực quản trị để bạn kiểm tra trước. Để khách truy cập thấy phiên bản mới, bạn cần bấm nút 'Xuất bản' màu xanh dương ở góc trên bên phải trình biên tập.",
  },
  {
    q: "Tôi sửa nhầm bố cục hoặc lỡ xóa mất 1 khối quan trọng, làm sao khôi phục lại?",
    a: "Có 2 cách: (1) Nếu vừa thao tác trong phiên hiện tại, bấm Ctrl+Z (hoặc nút Hoàn tác trên thanh công cụ). (2) Nếu đã lỡ xuất bản trước đó, bấm biểu tượng Đồng hồ (Lịch sử phiên bản) trên thanh công cụ để khôi phục bất kỳ bản xuất bản cũ nào về bản nháp chỉ bằng 1 click.",
  },
  {
    q: "Tôi muốn 2 nhóm trang trong cùng 1 Workspace có 2 thanh Menu và Footer khác nhau được không?",
    a: "Hoàn toàn được! Vào Cấu hình Website (/admin/site) → bấm '+ Tạo bộ Menu mới' để thiết kế bộ Menu thứ 2. Sau đó mở trang cần áp dụng → sang tab 'SEO & Cài đặt' → chọn đúng bộ Menu đó ở mục 'Bộ Menu / Website áp dụng cho trang này' rồi Xuất bản.",
  },
  {
    q: "Làm sao để bấm vào 1 mục trên thanh Menu thì trang tự cuộn mượt xuống đúng 1 khối bên dưới?",
    a: "Bước 1: Mở trang trong Page Editor → chọn khối đích → vào tab 'Kiểu' → nhập ID Neo (VD: bang-gia). Bước 2: Vào Cấu hình Website → thêm Tab Menu chọn loại đích là 'Neo mục lục (#anchor)' và nhập #bang-gia.",
  },
  {
    q: "Khách điền Form trên web nhưng tôi không thấy tin nhắn báo về Telegram?",
    a: "Hãy vào Cấu hình Website (/admin/site) → Tab 'Header & Nút nổi' → kéo xuống mục 'Thông báo Khách hàng mới (Telegram / Webhook riêng)' kiểm tra đã điền đúng Bot Token và Chat ID (nhóm thường có dấu trừ phía trước, VD: -100...) và đã bấm 'Lưu cấu hình' hay chưa. Dù chưa cài Telegram, thông tin khách vẫn luôn được lưu an toàn tại mục Khách hàng (Leads).",
  },
  {
    q: "Tại sao tài khoản của nhân viên không nhìn thấy mục 'Hệ thống chi nhánh' hoặc 'Khách hàng' trên Sidebar?",
    a: "Do gói dịch vụ hiện tại của Workspace đang tắt tính năng đó (VD gói Free). Hãy nhờ SuperAdmin vào Quản trị hệ thống (/admin/system) → mở 'Gói & Giới hạn' của Workspace đó và tích bật tính năng tương ứng.",
  },
  {
    q: "Khi gắn Tên miền riêng cho 1 Workspace (VD: doitac.vn), cần làm những bước nào?",
    a: "Bước 1: SuperAdmin vào /admin/system → Tab 'Tên miền' → thêm tên miền và chọn Workspace + Trang chủ mặc định. Bước 2: Tại nhà cung cấp tên miền, trỏ bản ghi A về 76.76.21.21 (cho tên miền gốc) hoặc CNAME về cname.vercel-dns.com (cho tên miền phụ www). Bước 3: Thêm tên miền đó trong Vercel Project Settings → Domains để tự cấp SSL HTTPS.",
  },
  {
    q: "Tôi có thể tái sử dụng thiết kế của trang này sang trang khác mà không phải làm lại từ đầu không?",
    a: "Được! Mở trang mẫu đã thiết kế đẹp → bấm nút 'Mẫu' trên thanh công cụ trên cùng → đặt tên và bấm 'Lưu mẫu'. Sau đó mở trang mới → bấm 'Mẫu' → chọn 'Thay thế toàn bộ' hoặc 'Chèn thêm khối'. Bạn còn có thể bấm 'Xuất JSON' để gửi mẫu cho đồng nghiệp nhập vào máy khác.",
  },
  {
    q: "Quán mới thêm ở Hệ thống chi nhánh nhưng không thấy hiện ghim trên bản đồ?",
    a: "Hãy mở sửa chi nhánh đó và kiểm tra 2 ô Tọa độ (Lat / Lng) đã có số chưa và nút 'Đang mở cửa' có đang bật không. Cách nhanh nhất là dán link Google Maps của quán vào ô Link Google Maps để hệ thống tự tách tọa độ chuẩn.",
  },
  {
    q: "Xuất file CSV từ mục Khách hàng (Leads) mở bằng Excel có bị lỗi font tiếng Việt không?",
    a: "Không! Hệ thống đã tự động chèn mã UTF-8 BOM chuẩn cho Microsoft Excel trên Windows/Mac và tự vô hiệu hóa các ký tự công thức độc hại (=, +, -, @) để bảo vệ máy tính của bạn.",
  },
];
