import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageRenderer } from "@/features/renderer/page-renderer";
import { fromEditorBlocks, fromPublicBlocks } from "@/features/renderer/adapters";
import { resolveSpacerHeight } from "@/features/renderer/blocks/simple-blocks";
import { BLOCK_REGISTRY } from "@/features/renderer/blocks/registry";
import { BLOCK_PAYLOAD_SCHEMAS, BLOCK_TYPES } from "@/features/renderer/blocks/payload-schemas";
import { saveDraftSchema } from "@/features/pages/schemas";
import type { EditorBlockItem } from "@/features/pages/types";
import type { PublicBlockItem } from "@/features/public/types";

const publicBlocks: PublicBlockItem[] = [
  {
    block_id: "b-links",
    type: "link_list",
    position: 2,
    payload: { layout: "stack" },
    links: [
      {
        page_link_id: "pl-2",
        position: 1,
        label: "Đặt món\nGiao tận nơi",
        kind: "standard",
        target_url: "https://example.com/2",
      },
      {
        page_link_id: "pl-1",
        position: 0,
        label: "Menu",
        kind: "standard",
        target_url: "https://example.com/1",
      },
    ],
  },
  {
    block_id: "b-header",
    type: "header",
    position: 0,
    payload: { title: "Gờ Cafe", bio: "Cà phê ngon" },
    links: [],
  },
];

const editorBlocks: EditorBlockItem[] = [
  {
    id: "e-hidden",
    type: "text",
    position: 0,
    isVisible: false,
    payload: { content: "Ẩn" },
  },
  {
    id: "e-links",
    type: "link_list",
    position: 1,
    isVisible: true,
    payload: { layout: "grid" },
    placements: [
      {
        id: "tmp-1",
        linkId: "l-1",
        position: 0,
        labelOverride: "Nhãn ghi đè",
        defaultLabel: "Nhãn gốc",
        defaultUrl: "https://example.com",
        defaultKind: "standard",
        defaultMediaUrl: null,
      },
    ],
  },
];

describe("renderer adapters", () => {
  it("fromPublicBlocks sắp xếp khối và liên kết theo position", () => {
    const out = fromPublicBlocks(publicBlocks);
    expect(out.map((b) => b.id)).toEqual(["b-header", "b-links"]);
    expect(out[1].links.map((l) => l.id)).toEqual(["pl-1", "pl-2"]);
  });

  it("fromEditorBlocks bỏ khối ẩn và ưu tiên nhãn ghi đè", () => {
    const out = fromEditorBlocks(editorBlocks);
    expect(out).toHaveLength(1);
    expect(out[0].links[0].label).toBe("Nhãn ghi đè");
  });
});

describe("registry", () => {
  it("mọi loại khối đều có component render và schema payload", () => {
    for (const type of BLOCK_TYPES) {
      expect(BLOCK_REGISTRY[type]?.Render).toBeTypeOf("function");
      expect(BLOCK_PAYLOAD_SCHEMAS[type]).toBeDefined();
    }
  });

  it("khoảng trống hỗ trợ cả cỡ chữ (sm..xl) lẫn số px cũ", () => {
    expect(resolveSpacerHeight("md")).toBe(20);
    expect(resolveSpacerHeight("xl")).toBe(48);
    expect(resolveSpacerHeight(24)).toBe(24);
    expect(resolveSpacerHeight(99999)).toBe(200);
    expect(resolveSpacerHeight(undefined)).toBe(16);
  });
});

describe("PageRenderer", () => {
  it("chế độ public: liên kết đi qua /r/{pageLinkId} để ghi nhận click", () => {
    const { container } = render(
      <PageRenderer
        mode="public"
        title="Gờ Cafe"
        theme={{ preset: "go-original" }}
        blocks={fromPublicBlocks(publicBlocks)}
      />
    );
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/r/pl-1", "/r/pl-2"]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gờ Cafe");
  });

  it("chế độ preview: không tạo thẻ <a> (không rời khỏi editor)", () => {
    const { container } = render(
      <PageRenderer
        mode="preview"
        title="Gờ Cafe"
        theme={{ preset: "go-original" }}
        blocks={fromEditorBlocks(editorBlocks)}
      />
    );
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(screen.getByText("Nhãn ghi đè")).toBeInTheDocument();
  });

  it("preview trang rỗng hiển thị hướng dẫn thêm khối", () => {
    render(<PageRenderer mode="preview" title="" theme={null} blocks={[]} />);
    expect(screen.getByText(/Chưa có khối nội dung nào/)).toBeInTheDocument();
  });

  it("áp dụng bo góc và bố cục lưới tuỳ chỉnh lên trang công khai", () => {
    const { container } = render(
      <PageRenderer
        mode="public"
        title="Gờ"
        theme={{ preset: "go-original", custom: { borderRadius: "sm" } }}
        blocks={[
          {
            id: "b",
            type: "link_list",
            payload: { layout: "grid" },
            links: [{ id: "pl", label: "Menu", targetUrl: "https://x.y" }],
          },
        ]}
      />
    );
    const link = container.querySelector("a")!;
    expect(link.className).toContain("rounded-xl");
    expect(link.parentElement!.className).toContain("grid-cols-2");
  });

  it.each(["go-original", "beacons-dark-card", "beacons-portrait-card"])(
    "render được với preset %s",
    (preset) => {
      render(
        <PageRenderer
          mode="public"
          title="Gờ Cafe"
          theme={{ preset }}
          blocks={fromPublicBlocks(publicBlocks)}
        />
      );
      expect(screen.getAllByText(/Menu/).length).toBeGreaterThan(0);
    }
  );
});

describe("saveDraftSchema kiểm tra payload theo loại khối", () => {
  const base = {
    pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    expectedDraftVersion: 1,
    title: "Trang",
    theme: { preset: "go-original" },
  };
  const block = (type: string, payload: Record<string, unknown>) => ({
    id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    type,
    position: 0,
    isVisible: true,
    payload,
  });

  it("vẫn chấp nhận giá trị cũ (layout: list) và trường phụ", () => {
    const res = saveDraftSchema.safeParse({
      ...base,
      blocks: [block("link_list", { layout: "list", legacyFlag: true })],
    });
    expect(res.success).toBe(true);
  });

  it("chặn trường sai kiểu", () => {
    const res = saveDraftSchema.safeParse({
      ...base,
      blocks: [block("heading", { text: { evil: true } })],
    });
    expect(res.success).toBe(false);
  });

  it("chặn nội dung quá dài", () => {
    const res = saveDraftSchema.safeParse({
      ...base,
      blocks: [block("header", { bio: "x".repeat(6000) })],
    });
    expect(res.success).toBe(false);
  });
});
