import type { ComponentType } from "react";
import type { BlockType } from "@/features/pages/types";
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
  /** Có gắn danh sách liên kết (placements) hay không. */
  hasLinks: boolean;
  /** Payload khi người dùng thêm khối mới. */
  defaultPayload: Record<string, unknown>;
  Render: ComponentType<BlockRenderProps>;
}

export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition> = {
  header: {
    type: "header",
    label: "Ảnh đại diện & giới thiệu",
    hasLinks: false,
    defaultPayload: { title: "", bio: "" },
    Render: HeaderBlock,
  },
  image: { type: "image", label: "Ảnh", hasLinks: false, defaultPayload: { caption: "", alt: "" }, Render: ImageBlock },
  heading: {
    type: "heading",
    label: "Tiêu đề mục",
    hasLinks: false,
    defaultPayload: { text: "Tiêu đề mục mới", level: 2 },
    Render: HeadingBlock,
  },
  text: { type: "text", label: "Đoạn văn", hasLinks: false, defaultPayload: { content: "", align: "center" }, Render: TextBlock },
  link_list: {
    type: "link_list",
    label: "Danh sách liên kết",
    hasLinks: true,
    defaultPayload: { layout: "stack" },
    Render: LinkListBlock,
  },
  social_icons: {
    type: "social_icons",
    label: "Biểu tượng mạng xã hội",
    hasLinks: true,
    defaultPayload: { style: "colored" },
    Render: SocialIconsBlock,
  },
  spacer: { type: "spacer", label: "Khoảng trống", hasLinks: false, defaultPayload: { height: "md" }, Render: SpacerBlock },
  divider: { type: "divider", label: "Đường kẻ", hasLinks: false, defaultPayload: { style: "solid" }, Render: DividerBlock },

  button: {
    type: "button",
    label: "Nút nổi bật",
    hasLinks: true,
    defaultPayload: { size: "lg", emphasis: "accent", subtitle: "" },
    Render: ButtonBlock,
  },
  gallery: {
    type: "gallery",
    label: "Thư viện ảnh",
    hasLinks: false,
    defaultPayload: { images: [], layout: "grid", columns: 2 },
    Render: GalleryBlock,
  },
  menu_card: {
    type: "menu_card",
    label: "Thẻ món",
    hasLinks: false,
    defaultPayload: { title: "", layout: "list", items: [{ name: "Cà phê sữa đá", price: "29.000đ" }] },
    Render: MenuCardBlock,
  },
  accordion: {
    type: "accordion",
    label: "Hỏi đáp / Thông tin",
    hasLinks: false,
    defaultPayload: { items: [{ title: "Giờ mở cửa", content: "7:00 – 22:00 mỗi ngày" }] },
    Render: AccordionBlock,
  },
  video_embed: {
    type: "video_embed",
    label: "Video",
    hasLinks: false,
    defaultPayload: { url: "", caption: "" },
    Render: VideoEmbedBlock,
  },
  map: {
    type: "map",
    label: "Bản đồ / Địa chỉ",
    hasLinks: false,
    defaultPayload: { address: "", label: "Chỉ đường đến quán", showMap: false },
    Render: MapBlock,
  },
};

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return (BLOCK_REGISTRY as Record<string, BlockDefinition>)[type];
}
