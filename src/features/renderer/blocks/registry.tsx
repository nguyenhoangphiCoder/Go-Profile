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

/**
 * Khai báo tập trung cho từng loại khối.
 * Thêm một loại khối mới:
 *   1. Viết component render trong thư mục này.
 *   2. Thêm schema payload vào `payload-schemas.ts`.
 *   3. Đăng ký vào BLOCK_REGISTRY bên dưới.
 *   4. Mở rộng CHECK constraint `page_blocks.type` trong database.
 */
export interface BlockDefinition {
  type: BlockType;
  label: string;
  /** Có gắn danh sách liên kết (placements) hay không. */
  hasLinks: boolean;
  Render: ComponentType<BlockRenderProps>;
}

export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition> = {
  header: { type: "header", label: "Ảnh đại diện & giới thiệu", hasLinks: false, Render: HeaderBlock },
  image: { type: "image", label: "Ảnh", hasLinks: false, Render: ImageBlock },
  heading: { type: "heading", label: "Tiêu đề mục", hasLinks: false, Render: HeadingBlock },
  text: { type: "text", label: "Đoạn văn", hasLinks: false, Render: TextBlock },
  link_list: { type: "link_list", label: "Danh sách liên kết", hasLinks: true, Render: LinkListBlock },
  social_icons: {
    type: "social_icons",
    label: "Biểu tượng mạng xã hội",
    hasLinks: true,
    Render: SocialIconsBlock,
  },
  spacer: { type: "spacer", label: "Khoảng trống", hasLinks: false, Render: SpacerBlock },
  divider: { type: "divider", label: "Đường kẻ", hasLinks: false, Render: DividerBlock },
};

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return (BLOCK_REGISTRY as Record<string, BlockDefinition>)[type];
}
