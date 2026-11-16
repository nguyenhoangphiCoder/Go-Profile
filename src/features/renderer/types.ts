import type { ThemePreset } from "@/config/themes";
import type { BlockType } from "@/features/pages/types";

/**
 * Dữ liệu chuẩn hoá mà bộ render dùng chung (PageRenderer) nhận vào.
 * Cả trang công khai (PublicPageDTO) lẫn bản xem trước trong editor (EditorBlockItem)
 * đều được chuyển về dạng này qua `adapters.ts`, để một khối chỉ cần render một lần.
 */
export interface RenderLink {
  /** page_link_id ở trang công khai; id placement ở editor. Dùng làm key và cho /r/{id}. */
  id: string;
  label: string;
  targetUrl: string;
  mediaUrl?: string | null;
}

export interface RenderBlock {
  id: string;
  type: BlockType;
  payload: Record<string, unknown>;
  links: RenderLink[];
}

/** "public": trang thật (link có href, ảnh ưu tiên tải). "preview": khung xem trước trong editor. */
export type RenderMode = "public" | "preview";

/** Biến thể bố cục do preset quyết định. */
export type LayoutVariant = "standard" | "beacons-card" | "beacons-portrait";

export interface RenderContext {
  mode: RenderMode;
  theme: ThemePreset;
  variant: LayoutVariant;
  pageTitle: string;
}

export interface BlockRenderProps {
  block: RenderBlock;
  ctx: RenderContext;
}
