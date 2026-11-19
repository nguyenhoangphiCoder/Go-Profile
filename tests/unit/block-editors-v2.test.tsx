import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/features/media/actions", () => ({ uploadMediaDirectAction: vi.fn() }));

import { BlockItemEditor } from "@/features/pages/components/editor/block-item-editor";
import { BLOCK_REGISTRY } from "@/features/renderer/blocks/registry";
import type { BlockType, EditorBlockItem } from "@/features/pages/types";

const links = [
  {
    id: "l1",
    defaultLabel: "ShopeeFood",
    targetUrl: "https://shopeefood.vn/go",
    kind: "standard" as const,
    defaultMediaId: null,
  },
];

function renderEditor(type: BlockType, onUpdateBlock = vi.fn()) {
  const block: EditorBlockItem = {
    id: "b1",
    type,
    position: 0,
    isVisible: true,
    payload: structuredClone(BLOCK_REGISTRY[type].defaultPayload),
    placements: [],
  };
  render(
    <BlockItemEditor
      block={block}
      index={0}
      totalBlocks={1}
      availableLinks={links}
      availableMedia={[]}
      onUpdateBlock={onUpdateBlock}
      onMoveUp={vi.fn()}
      onMoveDown={vi.fn()}
      onDelete={vi.fn()}
    />
  );
  return onUpdateBlock;
}

describe("form chỉnh sửa khối mới", () => {
  it.each(["button", "gallery", "menu_card", "accordion", "video_embed", "map"] as BlockType[])(
    "render được form khối %s kèm phần Kiểu khối",
    (type) => {
      renderEditor(type);
      expect(screen.getByText("Kiểu khối")).toBeInTheDocument();
    }
  );

  it("nút nổi bật: chọn liên kết tạo đúng một placement", () => {
    const onUpdate = renderEditor("button");
    fireEvent.change(screen.getByRole("combobox", { name: "Liên kết của nút" }), {
      target: { value: "l1" },
    });
    const updated = onUpdate.mock.calls.at(-1)![0] as EditorBlockItem;
    expect(updated.placements).toHaveLength(1);
    expect(updated.placements![0]).toMatchObject({
      linkId: "l1",
      defaultLabel: "ShopeeFood",
      position: 0,
    });
  });

  it("hỏi đáp: thêm mục mới", () => {
    const onUpdate = renderEditor("accordion");
    fireEvent.click(screen.getByRole("button", { name: /Thêm mục/ }));
    const items = (
      (onUpdate.mock.calls.at(-1)![0] as EditorBlockItem).payload as Record<string, unknown>
    ).items as unknown[];
    expect(items).toHaveLength(2);
  });

  it("kiểu khối: bật 'Thẻ nổi' ghi blockStyle, tắt lại thì xoá", () => {
    const onUpdate = renderEditor("map");
    fireEvent.click(screen.getByRole("button", { name: "Kiểu khối" }));
    fireEvent.click(screen.getByRole("button", { name: "Thẻ nổi" }));
    expect(
      ((onUpdate.mock.calls.at(-1)![0] as EditorBlockItem).payload as Record<string, unknown>)
        .blockStyle
    ).toEqual({ surface: "card" });
  });
});
