import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageRenderer } from "@/features/renderer/page-renderer";
import { BLOCK_PAYLOAD_SCHEMAS } from "@/features/renderer/blocks/payload-schemas";
import { getBlocksForPageKind } from "@/features/renderer/blocks/registry";
import { LANDING_TEMPLATES } from "@/features/pages/landing-templates";
import type { RenderBlock } from "@/features/renderer/types";

describe("Landing Page Blocks & Templates (Phase 3)", () => {
  it("tất cả 5 Template Gờ Café đều vượt qua Zod payload schema", () => {
    expect(LANDING_TEMPLATES).toHaveLength(5);
    for (const tpl of LANDING_TEMPLATES) {
      for (const blk of tpl.blocks) {
        const schema = BLOCK_PAYLOAD_SCHEMAS[blk.type];
        expect(schema, `Thiếu schema cho khối ${blk.type}`).toBeDefined();
        const res = schema.safeParse(blk.payload);
        expect(res.success, `Template ${tpl.id} khối ${blk.type} không hợp lệ`).toBe(true);
      }
    }
  });

  it("getBlocksForPageKind tách sạch khối riêng Profile và khối riêng Landing", () => {
    const profileTypes = getBlocksForPageKind("profile").map((b) => b.type);
    const landingTypes = getBlocksForPageKind("landing").map((b) => b.type);

    expect(profileTypes).toContain("header");
    expect(profileTypes).toContain("link_list");
    expect(profileTypes).not.toContain("hero_section");
    expect(profileTypes).not.toContain("pricing_table");

    expect(landingTypes).toContain("hero_section");
    expect(landingTypes).toContain("toc_bar");
    expect(landingTypes).toContain("stats_strip");
    expect(landingTypes).toContain("split_content");
    expect(landingTypes).toContain("info_cards");
    expect(landingTypes).toContain("pricing_table");
    expect(landingTypes).toContain("product_grid");
    expect(landingTypes).not.toContain("header");
    expect(landingTypes).not.toContain("link_list");
  });

  it("render đầy đủ 7 section Landing Page với preset go-minimal-luxury và lọc danh mục sản phẩm", () => {
    const blocks: RenderBlock[] = [
      {
        id: "b1",
        type: "hero_section",
        payload: {
          layout: "centered",
          eyebrow: "GỜ CAFÉ",
          title: "Xưởng rang cà phê mộc",
          subtitle: "Rang mới trong 72H",
          anchorId: "hero",
        },
        links: [],
      },
      {
        id: "b2",
        type: "toc_bar",
        payload: {
          title: "Mục lục",
          items: [{ label: "Bảng giá sỉ", anchorId: "bang-gia" }],
        },
        links: [],
      },
      {
        id: "b3",
        type: "stats_strip",
        payload: {
          columns: 3,
          items: [{ value: "55+", label: "Cửa hàng TP.HCM" }],
        },
        links: [],
      },
      {
        id: "b4",
        type: "split_content",
        payload: {
          imagePosition: "left",
          title: "Triết lý cà phê mộc",
          content: "<p>An toàn<script>alert(1)</script></p>",
        },
        links: [],
      },
      {
        id: "b5",
        type: "info_cards",
        payload: {
          title: "Quy trình",
          variant: "steps",
          columns: 2,
          items: [{ badge: "01", title: "Liên hệ", description: "Tư vấn miễn phí" }],
        },
        links: [],
      },
      {
        id: "b6",
        type: "pricing_table",
        payload: {
          anchorId: "bang-gia",
          title: "Bảng báo giá sỉ",
          columns: ["Từ 20KG", "Từ 10KG", "Từ 5KG"],
          rows: [
            {
              name: "Gu Đậm Robusta",
              prices: ["185.000đ", "195.000đ", "210.000đ"],
              highlight: true,
            },
          ],
        },
        links: [],
      },
      {
        id: "b7",
        type: "product_grid",
        payload: {
          title: "Sản phẩm",
          categories: ["Cà phê phin", "Cà phê máy"],
          items: [
            { name: "Phin Đậm 500g", category: "Cà phê phin", price: "125.000đ" },
            { name: "Espresso 500g", category: "Cà phê máy", price: "145.000đ" },
          ],
        },
        links: [],
      },
    ];

    const { container } = render(
      <PageRenderer
        mode="public"
        pageKind="landing"
        title="Xưởng rang"
        theme={{ preset: "go-minimal-luxury" }}
        blocks={blocks}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Xưởng rang cà phê mộc" })).toBeTruthy();
    expect(screen.getByText("55+")).toBeTruthy();
    expect(screen.getByText("Gu Đậm Robusta")).toBeTruthy();
    expect(screen.getByText("185.000đ")).toBeTruthy();
    // Chặn XSS script trong split_content
    expect(container.querySelector("script")).toBeNull();

    // Lọc danh mục trên product_grid
    expect(screen.getByText("Phin Đậm 500g")).toBeTruthy();
    expect(screen.getByText("Espresso 500g")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cà phê máy" }));
    expect(screen.queryByText("Phin Đậm 500g")).toBeNull();
    expect(screen.getByText("Espresso 500g")).toBeTruthy();
  });
});
