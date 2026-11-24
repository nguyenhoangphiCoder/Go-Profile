import type { ComponentType } from "react";
import type { BlockType, PageKind } from "@/features/pages/types";
import type { BlockRenderProps } from "../types";
import { HeaderBlock } from "./header-block";
import { LinkListBlock } from "./link-list-block";
import {
  DividerBlock,
  HeadingBlock,
  ImageBlock,
  SocialIconsBlock,
  SpacerBlock,
  TextBlock,
} from "./simple-blocks";
import {
  AccordionBlock,
  ButtonBlock,
  GalleryBlock,
  MapBlock,
  MenuCardBlock,
  VideoEmbedBlock,
} from "./v2-blocks";
import { HeroSectionBlock } from "./landing-hero-block";
import { StoreLocatorBlock } from "./store-locator-block";
import { LeadFormBlock } from "./lead-form-block";
import { BannerSliderBlock, CtaBannerBlock, TestimonialsBlock } from "./landing-blocks-p1";
import {
  InfoCardsBlock,
  PricingTableBlock,
  ProductGridBlock,
  SplitContentBlock,
  StatsStripBlock,
  TocBarBlock,
} from "./landing-blocks";

/**
 * Khai báo tập trung cho từng loại khối.
 * Thêm một loại khối mới:
 *   1. Viết component render trong thư mục này.
 *   2. Thêm schema payload vào `payload-schemas.ts`.
 *   3. Đăng ký vào BLOCK_REGISTRY bên dưới (và payload mặc định).
 *   4. Mở rộng CHECK constraint `page_blocks.type` trong database.
 */
export interface BlockDefinition {
  type: BlockType;
  label: string;
  /** Phạm vi hiển thị trong Block Picker: trang Profile, Landing Page hoặc dùng chung cả hai. */
  scopes: PageKind[];
  /** Có gắn danh sách liên kết (placements) hay không. */
  hasLinks: boolean;
  /** Payload khi người dùng thêm khối mới. */
  defaultPayload: Record<string, unknown>;
  Render: ComponentType<BlockRenderProps>;
}

const PROFILE_ONLY: PageKind[] = ["profile"];
const LANDING_ONLY: PageKind[] = ["landing"];
const SHARED_SCOPES: PageKind[] = ["profile", "landing"];

export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition> = {
  header: {
    type: "header",
    label: "Ảnh đại diện & giới thiệu",
    scopes: PROFILE_ONLY,
    hasLinks: false,
    defaultPayload: { title: "", bio: "" },
    Render: HeaderBlock,
  },
  image: {
    type: "image",
    label: "Ảnh",
    scopes: SHARED_SCOPES,
    hasLinks: false,
    defaultPayload: { caption: "", alt: "" },
    Render: ImageBlock,
  },
  heading: {
    type: "heading",
    label: "Tiêu đề mục",
    scopes: SHARED_SCOPES,
    hasLinks: false,
    defaultPayload: { text: "Tiêu đề mục mới", level: 2 },
    Render: HeadingBlock,
  },
  text: {
    type: "text",
    label: "Đoạn văn",
    scopes: SHARED_SCOPES,
    hasLinks: false,
    defaultPayload: { content: "", align: "center" },
    Render: TextBlock,
  },
  link_list: {
    type: "link_list",
    label: "Danh sách liên kết",
    scopes: PROFILE_ONLY,
    hasLinks: true,
    defaultPayload: { layout: "stack" },
    Render: LinkListBlock,
  },
  social_icons: {
    type: "social_icons",
    label: "Biểu tượng mạng xã hội",
    scopes: PROFILE_ONLY,
    hasLinks: true,
    defaultPayload: { style: "colored" },
    Render: SocialIconsBlock,
  },
  spacer: {
    type: "spacer",
    label: "Khoảng trống",
    scopes: SHARED_SCOPES,
    hasLinks: false,
    defaultPayload: { height: "md" },
    Render: SpacerBlock,
  },
  divider: {
    type: "divider",
    label: "Đường kẻ",
    scopes: SHARED_SCOPES,
    hasLinks: false,
    defaultPayload: { style: "solid" },
    Render: DividerBlock,
  },

  button: {
    type: "button",
    label: "Nút nổi bật",
    scopes: SHARED_SCOPES,
    hasLinks: true,
    defaultPayload: { size: "lg", emphasis: "accent", subtitle: "" },
    Render: ButtonBlock,
  },
  gallery: {
    type: "gallery",
    label: "Thư viện ảnh",
    scopes: SHARED_SCOPES,
    hasLinks: false,
    defaultPayload: { images: [], layout: "grid", columns: 2 },
    Render: GalleryBlock,
  },
  menu_card: {
    type: "menu_card",
    label: "Thẻ món",
    scopes: SHARED_SCOPES,
    hasLinks: false,
    defaultPayload: {
      title: "",
      layout: "list",
      items: [{ name: "Cà phê sữa đá", price: "29.000đ" }],
    },
    Render: MenuCardBlock,
  },
  accordion: {
    type: "accordion",
    label: "Hỏi đáp / Thông tin",
    scopes: SHARED_SCOPES,
    hasLinks: false,
    defaultPayload: { items: [{ title: "Giờ mở cửa", content: "7:00 – 22:00 mỗi ngày" }] },
    Render: AccordionBlock,
  },
  video_embed: {
    type: "video_embed",
    label: "Video",
    scopes: SHARED_SCOPES,
    hasLinks: false,
    defaultPayload: { url: "", caption: "" },
    Render: VideoEmbedBlock,
  },
  map: {
    type: "map",
    label: "Bản đồ / Địa chỉ",
    scopes: PROFILE_ONLY,
    hasLinks: false,
    defaultPayload: { address: "", label: "Chỉ đường đến quán", showMap: false },
    Render: MapBlock,
  },
  hero_section: {
    type: "hero_section",
    label: "Banner mở đầu (Hero)",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      layout: "split",
      eyebrow: "GỜ CAFÉ",
      title: "Cà phê nguyên chất — Chuẩn gu mỗi ngày",
      subtitle: "Hệ thống hơn 50 cửa hàng tại TP.HCM & Xưởng rang cung cấp sỉ và lẻ.",
      primaryCtaLabel: "Liên hệ tư vấn",
      primaryCtaHref: "",
    },
    Render: HeroSectionBlock,
  },
  toc_bar: {
    type: "toc_bar",
    label: "Mục lục nhảy mục (TOC)",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      title: "Mục lục",
      sticky: true,
      items: [
        { label: "Triết lý kinh doanh", anchorId: "triet-ly" },
        { label: "Thông số quán", anchorId: "thong-so" },
        { label: "Quy trình hợp tác", anchorId: "quy-trinh" },
      ],
    },
    Render: TocBarBlock,
  },
  stats_strip: {
    type: "stats_strip",
    label: "Dải chỉ số uy tín",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      columns: 3,
      items: [
        { value: "TOP 1", label: "Bán chạy trên Shopee", sublabel: "98% đánh giá 5 sao" },
        { value: "55+", label: "Cửa hàng tại TP.HCM", sublabel: "Mở rộng bền vững từ 2013" },
        { value: "72H", label: "Rang mới giao ngay", sublabel: "100% cà phê mộc nguyên chất" },
      ],
    },
    Render: StatsStripBlock,
  },
  split_content: {
    type: "split_content",
    label: "Khối 2 cột Ảnh – Chữ",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      imagePosition: "left",
      eyebrow: "CÂU CHUYỆN THƯƠNG HIỆU",
      title: "Theo đuổi cà phê mộc từ 2013",
      content:
        "<p>Gờ Café chú trọng vào chất lượng cà phê rang mộc nguyên chất, không gian thân thuộc và mức giá hợp lý để khách hàng có thể ghé mỗi ngày.</p>",
    },
    Render: SplitContentBlock,
  },
  info_cards: {
    type: "info_cards",
    label: "Thẻ thông số / Quy trình",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      title: "Mô hình tinh gọn & bền vững",
      subtitle: "Tiêu chuẩn vận hành đồng bộ trên toàn hệ thống",
      columns: 3,
      variant: "card",
      items: [
        {
          badge: "DIỆN TÍCH",
          title: "60 – 150 m²",
          description: "Tối ưu mặt bằng khu dân cư, văn phòng",
        },
        {
          badge: "PHÂN KHÚC",
          title: "Trung cấp",
          description: "Giá bán hợp lý, tần suất khách quay lại cao",
        },
        {
          badge: "NGUỒN HÀNG",
          title: "Xưởng rang riêng",
          description: "Chủ động chất lượng & biên lợi nhuận",
        },
      ],
    },
    Render: InfoCardsBlock,
  },
  pricing_table: {
    type: "pricing_table",
    label: "Bảng báo giá đa cột",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      title: "Bảng báo giá sỉ Cà phê bột & hạt",
      effectiveNote: "Áp dụng từ tháng 11/2026 • Giá chưa bao gồm VAT",
      columns: ["Từ 20KG", "Từ 10KG", "Từ 5KG"],
      rows: [
        {
          name: "Gu Đậm Truyền Thống (Robusta)",
          subtitle: "Pha phin đậm vị, hậu ngọt",
          prices: ["185.000đ/kg", "195.000đ/kg", "210.000đ/kg"],
          highlight: true,
        },
        {
          name: "Gu Cân Bằng (Robusta + Arabica)",
          subtitle: "Hương thơm thanh, phù hợp pha máy & phin",
          prices: ["215.000đ/kg", "225.000đ/kg", "240.000đ/kg"],
          highlight: false,
        },
      ],
    },
    Render: PricingTableBlock,
  },
  product_grid: {
    type: "product_grid",
    label: "Lưới sản phẩm / Menu",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      title: "Sản phẩm nổi bật",
      subtitle: "Cà phê rang mộc nguyên chất đóng gói tiện lợi",
      categories: ["Cà phê phin", "Cà phê máy"],
      items: [
        {
          name: "Cà phê Gu Truyền Thống 500g",
          category: "Cà phê phin",
          price: "125.000đ",
          badge: "Bán chạy",
          description: "Đậm vị, thơm nồng, chuẩn gu Sài Gòn.",
        },
      ],
    },
    Render: ProductGridBlock,
  },
  store_locator: {
    type: "store_locator",
    label: "Bản đồ hệ thống chi nhánh",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      anchorId: "he-thong-quan",
      title: "Hệ thống cửa hàng Gờ Café",
      subtitle: "Chọn chi nhánh trên bản đồ hoặc tìm nhanh theo tên đường, quận",
      showSearch: true,
      showDistrictFilter: true,
      defaultZoom: 12,
    },
    Render: StoreLocatorBlock,
  },
  lead_form: {
    type: "lead_form",
    label: "Form đăng ký / Nhận báo giá",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      anchorId: "dang-ky-tu-van",
      formName: "Đăng ký tư vấn",
      eyebrow: "TƯ VẤN MIỄN PHÍ",
      title: "Đăng ký nhận thông tin & báo giá",
      subtitle: "Để lại số điện thoại, chuyên viên Gờ Café sẽ liên hệ tư vấn trong vòng 30 phút.",
      submitLabel: "Gửi yêu cầu tư vấn",
      successMessage: "Cảm ơn bạn đã để lại thông tin. Đội ngũ Gờ Café sẽ liên hệ tư vấn sớm nhất.",
      showEmail: true,
      showNote: true,
      notePlaceholder: "VD: Quan tâm mô hình nhượng quyền / Nhận báo giá sỉ cà phê...",
      popupDelaySec: 0,
    },
    Render: LeadFormBlock,
  },
  banner_slider: {
    type: "banner_slider",
    label: "Banner trượt nhiều ảnh (Slider)",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      anchorId: "banner-uu-dai",
      autoPlaySec: 5,
      slides: [
        {
          title: "Ưu đãi Cà phê Rang Mộc 72H",
          subtitle: "Đặt ngay trên Shopee Mall hoặc ghé hơn 55 cửa hàng Gờ Café TP.HCM",
          ctaLabel: "Xem Menu",
          ctaHref: "/menu-go-cafe",
        },
      ],
    },
    Render: BannerSliderBlock,
  },
  testimonials: {
    type: "testimonials",
    label: "Đánh giá khách hàng / Đối tác",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      anchorId: "danh-gia",
      title: "Khách hàng & Đối tác nói gì về Gờ Café",
      subtitle: "Hơn 98% đánh giá 5 sao từ khách hàng thân thiết và chủ quán đối tác",
      columns: 3,
      items: [
        {
          author: "Anh Minh Quân",
          role: "Chủ quán nhượng quyền — Q. Tân Phú",
          quote:
            "Quy trình chuyển giao của Gờ rất gọn, nguồn cà phê từ xưởng rang ổn định nên khách quen quay lại mỗi sáng.",
          rating: 5,
        },
        {
          author: "Chị Hồng Nhung",
          role: "Khách sỉ cà phê — Bình Thạnh",
          quote:
            "Nhập sỉ Gu Truyền Thống 20kg/tháng hơn 1 năm nay, mẻ rang nào cũng thơm đều, khách khen đậm vị.",
          rating: 5,
        },
        {
          author: "Bạn Thanh Tùng",
          role: "Khách hàng Shopee Mall",
          quote:
            "Giao nhanh, ngày rang mới tinh đúng 72H, pha phin ở nhà thơm y như uống ngoài tiệm Gờ.",
          rating: 5,
        },
      ],
    },
    Render: TestimonialsBlock,
  },
  cta_banner: {
    type: "cta_banner",
    label: "Dải kêu gọi hành động (CTA Banner)",
    scopes: LANDING_ONLY,
    hasLinks: false,
    defaultPayload: {
      anchorId: "hanh-dong",
      tone: "dark",
      eyebrow: "ĐỒNG HÀNH CÙNG GỜ CAFÉ",
      title: "Bạn muốn mở quán hoặc nhập sỉ cà phê nguyên chất?",
      subtitle: "Liên hệ ngay đội ngũ Gờ Café để nhận hồ sơ nhượng quyền & mẫu thử miễn phí.",
      primaryCtaLabel: "Đăng ký tư vấn ngay",
      primaryCtaHref: "#lien-he-tu-van",
      secondaryCtaLabel: "Gọi 1900-9246",
      secondaryCtaHref: "tel:19009246",
    },
    Render: CtaBannerBlock,
  },
};

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return (BLOCK_REGISTRY as Record<string, BlockDefinition>)[type];
}

export function getBlocksForPageKind(kind: PageKind): BlockDefinition[] {
  return Object.values(BLOCK_REGISTRY).filter((def) => def.scopes.includes(kind));
}
