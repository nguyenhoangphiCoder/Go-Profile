import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/features/media/actions", () => ({ uploadMediaDirectAction: vi.fn() }));

import { PageRenderer } from "@/features/renderer/page-renderer";
import { BlockItemEditor } from "@/features/pages/components/editor/block-item-editor";
import { reorderByInsertion } from "@/features/pages/components/editor/reorder";
import type { EditorBlockItem } from "@/features/pages/types";
import type { RenderBlock } from "@/features/renderer/types";

const blocks: RenderBlock[] = [
  { id: "b-head", type: "heading", payload: { text: "Tiêu đề A" }, links: [] },
  { id: "b-text", type: "text", payload: { content: "Đoạn văn B" }, links: [] },
];

describe("chọn khối trên bản xem trước", () => {
  it("bấm vào khối gọi onSelectBlock với đúng id", () => {
    const onSelect = vi.fn();
    render(
      <PageRenderer mode="preview" title="" theme={null} blocks={blocks} onSelectBlock={onSelect} />
    );
    fireEvent.click(screen.getByText("Đoạn văn B"));
    expect(onSelect).toHaveBeenCalledWith("b-text");
  });

  it("phím Enter cũng chọn được (truy cập bằng bàn phím)", () => {
    const onSelect = vi.fn();
    render(
      <PageRenderer mode="preview" title="" theme={null} blocks={blocks} onSelectBlock={onSelect} />
    );
    fireEvent.keyDown(screen.getByRole("button", { name: /Chỉnh sửa khối: Tiêu đề mục/ }), {
      key: "Enter",
    });
    expect(onSelect).toHaveBeenCalledWith("b-head");
  });

  it("khối đang chọn được đánh dấu", () => {
    render(
      <PageRenderer
        mode="preview"
        title=""
        theme={null}
        blocks={blocks}
        selectedBlockId="b-head"
        onSelectBlock={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /Tiêu đề mục/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /Đoạn văn/ })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("trang công khai không có lớp bao chọn khối, kể cả khi lỡ truyền onSelectBlock", () => {
    const { container } = render(
      <PageRenderer mode="public" title="" theme={null} blocks={blocks} onSelectBlock={vi.fn()} />
    );
    expect(container.querySelector("[data-block-selectable]")).toBeNull();
  });
});

describe("form khối phản hồi khi được chọn", () => {
  const block: EditorBlockItem = {
    id: "b1",
    type: "heading",
    position: 0,
    isVisible: true,
    payload: { text: "Xin chào", level: 2 },
  };
  const baseProps = {
    block,
    index: 0,
    totalBlocks: 1,
    availableLinks: [],
    availableMedia: [],
    onUpdateBlock: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    onDelete: vi.fn(),
  };
  const isOpen = () => screen.queryByText("Kiểu khối") !== null;

  it("thu gọn bằng tiêu đề không bị tự mở lại; chọn từ preview thì mở ra", () => {
    const { rerender } = render(<BlockItemEditor {...baseProps} />);
    expect(isOpen()).toBe(true);

    fireEvent.click(screen.getByText(/Tiêu đề mục \(Heading\)/));
    rerender(<BlockItemEditor {...baseProps} isSelected selectToken={0} />);
    expect(isOpen()).toBe(false);

    rerender(<BlockItemEditor {...baseProps} isSelected selectToken={1} />);
    expect(isOpen()).toBe(true);
  });

  it("bấm tiêu đề khối báo onSelect", () => {
    const onSelect = vi.fn();
    render(<BlockItemEditor {...baseProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/Tiêu đề mục \(Heading\)/));
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("kéo thả sắp xếp khối", () => {
  const list = ["A", "B", "C", "D"].map((id, position) => ({ id, position }));
  const ids = (xs: { id: string }[]) => xs.map((x) => x.id).join("");

  it("kéo xuống, kéo lên, kéo về cuối", () => {
    expect(ids(reorderByInsertion(list, 0, 2))).toBe("BACD");
    expect(ids(reorderByInsertion(list, 3, 1))).toBe("ADBC");
    expect(ids(reorderByInsertion(list, 0, 4))).toBe("BCDA");
    expect(ids(reorderByInsertion(list, 2, 0))).toBe("CABD");
  });

  it("thả tại chỗ cũ không đổi gì; position luôn liên tục", () => {
    expect(reorderByInsertion(list, 1, 1)).toBe(list);
    expect(reorderByInsertion(list, 1, 2)).toBe(list);
    expect(reorderByInsertion(list, 9, 0)).toBe(list);
    expect(reorderByInsertion(list, 3, 0).map((x) => x.position)).toEqual([0, 1, 2, 3]);
  });
});
