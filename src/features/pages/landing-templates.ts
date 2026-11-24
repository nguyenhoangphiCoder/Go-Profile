import type { BlockType } from "./types";

export type LandingTemplateId =
  "brand-home" | "franchise-guide" | "roastery-wholesale" | "store-system" | "blank";

export interface LandingTemplateBlockSpec {
  type: BlockType;
  payload: Record<string, unknown>;
}

export interface LandingTemplateDefinition {
  id: LandingTemplateId;
  name: string;
  badge: string;
  description: string;
  suggestedSlug: string;
  blocks: LandingTemplateBlockSpec[];
}

export const LANDING_TEMPLATES: LandingTemplateDefinition[] = [
  {
    id: "brand-home",
    name: "Trang chủ thương hiệu Gờ Café",
    badge: "5 section",
    description:
      "Hero Banner, Dải chỉ số uy tín, 2 khối Ảnh–Chữ (Về Gờ & Xưởng rang), Lưới sản phẩm.",
    suggestedSlug: "trang-chu",
    blocks: [
      {
        type: "hero_section",
        payload: {
          layout: "split",
          eyebrow: "GỜ CAFÉ • TỪ 2013",
          title: "Cà phê nguyên chất — Chuẩn gu mỗi ngày",
          subtitle:
            "Chuỗi hơn 55 cửa hàng cà phê truyền thống tại TP.HCM & Xưởng rang mộc cung cấp sỉ và lẻ toàn quốc.",
          primaryCtaLabel: "Khám phá hệ thống quán",
          primaryCtaHref: "/he-thong-quan",
          secondaryCtaLabel: "Báo giá sỉ cà phê",
          secondaryCtaHref: "/xuong-rang-ca-phe",
          anchorId: "dau-trang",
        },
      },
      {
        type: "stats_strip",
        payload: {
          anchorId: "chi-so",
          columns: 3,
          items: [
            {
              value: "TOP 1",
              label: "Bán chạy trên Shopee",
              sublabel: "98% đánh giá 5 sao từ khách hàng",
            },
            {
              value: "55+",
              label: "Cửa hàng tại TP.HCM",
              sublabel: "Mở rộng bền vững từ năm 2013",
            },
            {
              value: "72H",
              label: "Rang mới giao ngay",
              sublabel: "100% cà phê mộc không tẩm trộn",
            },
          ],
        },
      },
      {
        type: "split_content",
        payload: {
          anchorId: "ve-chung-toi",
          imagePosition: "left",
          eyebrow: "VỀ CHÚNG TÔI",
          title: "Theo đuổi cà phê mộc và trải nghiệm thân thuộc",
          content:
            "<p>Gờ Café không chạy theo không gian cầu kỳ hay thức uống trào lưu nhất thời. Chúng tôi tập trung vào <strong>chất lượng cà phê rang mộc nguyên chất</strong>, không gian thoải mái và mức giá hợp lý để khách hàng có thể ghé thưởng thức mỗi ngày.</p>",
          ctaLabel: "Tìm hiểu nhượng quyền",
          ctaHref: "/nhuong-quyen",
        },
      },
      {
        type: "split_content",
        payload: {
          anchorId: "xuong-rang",
          imagePosition: "right",
          eyebrow: "XƯỞNG RANG GỜ CAFÉ",
          title: "Chủ động chất lượng từ nông trại đến ly cà phê",
          content:
            "<p>Hạt cà phê tuyển chọn từ vùng nguyên liệu Tây Nguyên, rang mộc theo công thức riêng kiểm soát nhiệt độ chuẩn xác, đóng gói van một chiều giữ trọn hương thơm.</p>",
          ctaLabel: "Xem bảng giá sỉ 20kg / 10kg / 5kg",
          ctaHref: "/xuong-rang-ca-phe",
        },
      },
      {
        type: "product_grid",
        payload: {
          anchorId: "san-pham",
          title: "Sản phẩm nổi bật",
          subtitle: "Đặt mua cà phê rang xay chính hãng Gờ Café",
          categories: ["Cà phê phin", "Cà phê máy"],
          items: [
            {
              name: "Cà phê Gu Truyền Thống 500g",
              category: "Cà phê phin",
              price: "125.000đ",
              badge: "Bán chạy",
              description: "Robusta rang mộc đậm đà, hậu ngọt sâu, chuẩn gu phin Sài Gòn.",
            },
            {
              name: "Cà phê Gu Cân Bằng 500g",
              category: "Cà phê máy",
              price: "145.000đ",
              badge: "Ưa chuộng",
              description: "Phối trộn Robusta & Arabica, hương thơm thanh, lớp crema dày.",
            },
            {
              name: "Cà phê Arabica Cầu Đất 500g",
              category: "Cà phê máy",
              price: "185.000đ",
              description: "100% Arabica vùng Cầu Đất, chua thanh nhẹ, hương hoa quả tự nhiên.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "franchise-guide",
    name: "Cẩm nang Nhượng quyền",
    badge: "6 section",
    description:
      "Hero, Mục lục nhảy mục (TOC), Triết lý 2 cột, Thông số quán, Quy trình 4 bước & FAQ.",
    suggestedSlug: "nhuong-quyen",
    blocks: [
      {
        type: "hero_section",
        payload: {
          layout: "centered",
          eyebrow: "DÀNH CHO CHỦ QUÁN & ĐỐI TÁC",
          title: "Hợp tác Nhượng quyền Thương hiệu Gờ Café",
          subtitle:
            "Mô hình quán cà phê truyền thống tinh gọn, chi phí đầu tư tối ưu, chủ động nguồn hàng từ xưởng rang riêng và đồng hành vận hành trọn vòng đời.",
          primaryCtaLabel: "Xem quy trình hợp tác",
          primaryCtaHref: "#quy-trinh",
          secondaryCtaLabel: "Hotline: 1900 9246",
          secondaryCtaHref: "tel:19009246",
          anchorId: "dau-trang",
        },
      },
      {
        type: "toc_bar",
        payload: {
          title: "Cẩm nang",
          sticky: true,
          items: [
            { label: "Triết lý kinh doanh", anchorId: "triet-ly" },
            { label: "Thông số quán chuẩn", anchorId: "thong-so" },
            { label: "Quy trình 4 bước", anchorId: "quy-trinh" },
            { label: "Câu hỏi thường gặp", anchorId: "faq" },
          ],
        },
      },
      {
        type: "split_content",
        payload: {
          anchorId: "triet-ly",
          imagePosition: "left",
          eyebrow: "01 • TRIẾT LÝ KINH DOANH",
          title: "Tập trung vào khách hàng quay lại mỗi ngày",
          content:
            "<p>Thay vì đầu tư nặng vào mặt bằng đắt đỏ và trang trí ngắn hạn, Gờ Café xây dựng mô hình <strong>điểm bán tinh gọn</strong> với chất lượng cà phê ổn định, giúp đối tác tối ưu chi phí cố định và thu hồi vốn bền vững.</p>",
        },
      },
      {
        type: "info_cards",
        payload: {
          anchorId: "thong-so",
          title: "Thông số tiêu chuẩn cửa hàng",
          subtitle: "Khung tiêu chuẩn đã được kiểm chứng qua hơn 55 chi nhánh thực tế",
          columns: 4,
          variant: "card",
          items: [
            {
              badge: "DIỆN TÍCH",
              title: "60 – 150 m²",
              description: "Khu dân cư, văn phòng, góc 2 mặt tiền hoặc hẻm lớn",
            },
            {
              badge: "PHÂN KHÚC",
              title: "Trung cấp",
              description: "Giá bán vừa túi tiền, phục vụ nhu cầu uống hằng ngày",
            },
            {
              badge: "NGUỒN HÀNG",
              title: "Xưởng rang riêng",
              description: "Cung ứng trực tiếp, đảm bảo chất lượng & giá vốn tốt",
            },
            {
              badge: "VẬN HÀNH",
              title: "Quy trình chuẩn hóa",
              description: "Đào tạo pha chế, quản lý tồn kho & kiểm soát chất lượng",
            },
          ],
        },
      },
      {
        type: "info_cards",
        payload: {
          anchorId: "quy-trinh",
          title: "Quy trình 4 bước hợp tác",
          subtitle: "Minh bạch, rõ ràng từ khâu khảo sát đến ngày khai trương",
          columns: 4,
          variant: "steps",
          items: [
            {
              badge: "01",
              title: "Đăng ký & Tư vấn",
              description: "Trao đổi định hướng, ngân sách dự kiến và khu vực mục tiêu.",
            },
            {
              badge: "02",
              title: "Khảo sát mặt bằng",
              description: "Đội ngũ Gờ trực tiếp thẩm định lưu lượng khách và phương án thiết kế.",
            },
            {
              badge: "03",
              title: "Thi công & Đào tạo",
              description: "Triển khai setup quầy bar, đào tạo nhân sự pha chế và quản lý.",
            },
            {
              badge: "04",
              title: "Khai trương & Đồng hành",
              description: "Hỗ trợ truyền thông mở bán và kiểm tra chất lượng định kỳ.",
            },
          ],
        },
      },
      {
        type: "accordion",
        payload: {
          items: [
            {
              title: "Chưa có kinh nghiệm kinh doanh F&B có làm được không?",
              content:
                "Hoàn toàn được. Gờ Café cung cấp trọn bộ quy trình vận hành, đào tạo nhân sự từ cơ bản và hỗ trợ giám sát trong giai đoạn đầu.",
            },
            {
              title: "Thời gian setup một cửa hàng mất bao lâu?",
              content: "Trung bình từ 30 đến 45 ngày kể từ khi chốt mặt bằng và bản vẽ thiết kế.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "roastery-wholesale",
    name: "Xưởng rang / Báo giá sỉ",
    badge: "5 section",
    description:
      "Hero Xưởng rang, Dải chỉ số (TOP 1 / 55+ / 72H), Bảng báo giá sỉ 20KG/10KG/5KG & Cam kết.",
    suggestedSlug: "xuong-rang-ca-phe",
    blocks: [
      {
        type: "hero_section",
        payload: {
          layout: "split",
          eyebrow: "XƯỞNG RANG CÀ PHÊ GỜ",
          title: "Cà phê rang mộc giá sỉ — Trực tiếp từ xưởng",
          subtitle:
            "Chuyên cung cấp cà phê hạt & bột rang mộc cho quán cà phê, văn phòng và đại lý. Rang mới theo đơn, gửi mẫu thử miễn phí.",
          primaryCtaLabel: "Xem bảng báo giá sỉ",
          primaryCtaHref: "#bang-gia",
          secondaryCtaLabel: "Zalo tư vấn: 0779.20.00.20",
          secondaryCtaHref: "tel:0779200020",
          anchorId: "dau-trang",
        },
      },
      {
        type: "stats_strip",
        payload: {
          anchorId: "uy-tin",
          columns: 3,
          items: [
            { value: "TOP 1", label: "Cà phê bột trên Shopee", sublabel: "Hơn 98% đánh giá 5 sao" },
            {
              value: "55+",
              label: "Cửa hàng Gờ sử dụng",
              sublabel: "Chất lượng đồng nhất mỗi ngày",
            },
            { value: "72H", label: "Cam kết rang mới", sublabel: "Không hàng tồn kho lâu ngày" },
          ],
        },
      },
      {
        type: "pricing_table",
        payload: {
          anchorId: "bang-gia",
          title: "Bảng báo giá sỉ Cà phê hạt & bột",
          effectiveNote: "Đơn vị: VNĐ/kg • Hỗ trợ xay theo cỡ phin hoặc máy miễn phí",
          columns: ["Từ 20KG", "Từ 10KG", "Từ 5KG"],
          rows: [
            {
              name: "Gu Đậm Truyền Thống (100% Robusta)",
              subtitle: "Pha phin đậm vị, đắng êm, hậu ngọt",
              prices: ["185.000đ", "195.000đ", "210.000đ"],
              highlight: true,
            },
            {
              name: "Gu Cân Bằng (70% Robusta – 30% Arabica)",
              subtitle: "Phù hợp pha máy Espresso & cà phê sữa đá",
              prices: ["215.000đ", "225.000đ", "240.000đ"],
              highlight: false,
            },
            {
              name: "Gu Thơm Thanh (100% Arabica Cầu Đất)",
              subtitle: "Hương hoa quả, vị chua thanh tinh tế",
              prices: ["285.000đ", "295.000đ", "315.000đ"],
              highlight: false,
            },
          ],
        },
      },
      {
        type: "info_cards",
        payload: {
          anchorId: "cam-ket",
          title: "Cam kết & Quyền lợi đối tác sỉ",
          columns: 3,
          variant: "card",
          items: [
            {
              badge: "CAM KẾT 01",
              title: "100% Rang mộc nguyên chất",
              description: "Không bơ, không hương liệu, không độn đậu nành hay bắp.",
            },
            {
              badge: "CAM KẾT 02",
              title: "Gửi mẫu thử miễn phí",
              description: "Test trực tiếp gu vị tại quán trước khi chốt đơn số lượng lớn.",
            },
            {
              badge: "CAM KẾT 03",
              title: "Đồng hành chỉnh gu",
              description: "Hỗ trợ tư vấn công thức pha chế, cỡ xay và bảo quản tối ưu.",
            },
          ],
        },
      },
      {
        type: "product_grid",
        payload: {
          anchorId: "danh-muc",
          title: "Các dòng cà phê đóng gói",
          categories: ["Pha phin", "Pha máy"],
          items: [
            {
              name: "Gờ Robusta Đậm Vị (Túi 1KG)",
              category: "Pha phin",
              price: "210.000đ",
              badge: "Phổ biến",
              description: "Rang vừa đậm, tối ưu cho cà phê đá và cà phê sữa đá.",
            },
            {
              name: "Gờ Espresso Blend (Túi 1KG)",
              category: "Pha máy",
              price: "240.000đ",
              description: "Lớp crema dày mịn, cân bằng hương và vị cho quán pha máy.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "store-system",
    name: "Hệ thống chi nhánh",
    badge: "2 section",
    description:
      "Hero gọn + Bản đồ 55+ quán tương tác 2 chiều Map ⇄ List, tìm tên đường/quận không dấu.",
    suggestedSlug: "he-thong-quan",
    blocks: [
      {
        type: "hero_section",
        payload: {
          layout: "centered",
          eyebrow: "HỆ THỐNG CỬA HÀNG GỜ CAFÉ",
          title: "Tìm quán Gờ gần bạn nhất",
          subtitle:
            "Hơn 55 chi nhánh phủ khắp các quận TP.HCM — không gian thân thuộc, cà phê rang mộc chuẩn gu mỗi ngày.",
          anchorId: "dau-trang",
        },
      },
      {
        type: "store_locator",
        payload: {
          anchorId: "ban-do-chi-nhanh",
          title: "Bản đồ & Danh sách chi nhánh",
          subtitle: "Bấm vào pin trên bản đồ hoặc tìm nhanh tên đường, quận bên danh sách",
          showSearch: true,
          showDistrictFilter: true,
          defaultZoom: 12,
        },
      },
    ],
  },
  {
    id: "blank",
    name: "Trang trống (Tự lắp ghép)",
    badge: "1 section",
    description: "Khởi tạo gọn với 1 Banner mở đầu, bạn tự thêm các Section theo ý muốn.",
    suggestedSlug: "trang-moi",
    blocks: [],
  },
];

export function getLandingTemplate(id?: string | null): LandingTemplateDefinition | undefined {
  return LANDING_TEMPLATES.find((t) => t.id === id);
}
