import type { EditorBlockItem } from "@/features/pages/types";
import type { PublicBlockItem } from "@/features/public/types";
import type { RenderBlock } from "./types";

/** Khối của trang công khai (RPC get_public_page) -> dạng render chung. */
export function fromPublicBlocks(blocks: PublicBlockItem[] | undefined | null): RenderBlock[] {
  return (blocks || [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((b) => ({
      id: b.block_id,
      type: b.type,
      payload: b.payload || {},
      links: (b.links || [])
        .slice()
        .sort((x, y) => x.position - y.position)
        .map((l) => ({
          id: l.page_link_id,
          label: l.label,
          targetUrl: l.target_url,
          mediaUrl: l.media_url,
        })),
    }));
}

/** Khối trong editor (bản nháp chưa lưu) -> dạng render chung. Chỉ lấy khối đang hiển thị. */
export function fromEditorBlocks(blocks: EditorBlockItem[]): RenderBlock[] {
  return blocks
    .filter((b) => b.isVisible)
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((b) => ({
      id: b.id,
      type: b.type,
      payload: (b.payload || {}) as Record<string, unknown>,
      links: (b.placements || [])
        .slice()
        .sort((x, y) => x.position - y.position)
        .map((pl) => ({
          id: pl.id,
          label: pl.labelOverride || pl.defaultLabel || "",
          targetUrl: pl.defaultUrl,
          mediaUrl: pl.mediaOverrideUrl || pl.defaultMediaUrl,
        })),
    }));
}
