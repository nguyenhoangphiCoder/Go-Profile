import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { blockStyleSchema } from "@/features/renderer/blocks/payload-schemas";
import { BlockFrame } from "@/features/renderer/block-frame";

describe("Block Design System v3 (Chặng C1)", () => {
  it("chấp nhận đầy đủ thuộc tính tùy chỉnh nền, gradient, ảnh, viền, bóng, anchorId và titleFontSize 72px", () => {
    const parsed = blockStyleSchema.safeParse({
      align: "center",
      paddingTop: "lg",
      paddingBottom: "xl",
      maxWidth: "lg",
      bgColor: "#111111",
      bgGradientFrom: "#111111",
      bgGradientTo: "#B88A44",
      bgGradientDir: "to-br",
      bgImageUrl: "https://example.com/bg.webp",
      bgOverlayOpacity: 45,
      radius: "3xl",
      borderWidth: 2,
      borderColor: "#E4E4E7",
      shadow: "lg",
      animation: "zoom-in",
      titleFontSize: 64,
      anchorId: "bang-gia-nhuong-quyen",
    });
    expect(parsed.success).toBe(true);
  });

  it("chặn URL ảnh nền độc hại (javascript:) và anchorId không hợp lệ", () => {
    expect(
      blockStyleSchema.safeParse({ bgImageUrl: "javascript:alert(1)" }).success
    ).toBe(false);
    expect(
      blockStyleSchema.safeParse({ anchorId: "Bang Gia!" }).success
    ).toBe(false);
    expect(
      blockStyleSchema.safeParse({ titleFontSize: 120 }).success
    ).toBe(false);
  });

  it("BlockFrame render đúng id, scroll-mt-24, gradient, bo góc, bóng và hiệu ứng", () => {
    const { container } = render(
      <BlockFrame
        index={1}
        style={{
          anchorId: "bang-gia",
          maxWidth: "md",
          radius: "3xl",
          shadow: "lg",
          borderWidth: 2,
          borderColor: "#B88A44",
          bgGradientFrom: "#111111",
          bgGradientTo: "#333333",
          bgGradientDir: "to-r",
          animation: "slide-left",
          paddingTop: "lg",
          paddingBottom: "md",
        }}
      >
        <div>Nội dung khối</div>
      </BlockFrame>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.id).toBe("bang-gia");
    expect(wrapper.className).toContain("scroll-mt-24");
    expect(wrapper.className).toContain("max-w-4xl");
    expect(wrapper.className).toContain("rounded-3xl");
    expect(wrapper.className).toContain("shadow-xl");
    expect(wrapper.className).toContain("border-2");
    expect(wrapper.className).toContain("gp-anim-slide-left");
    expect(wrapper.style.backgroundImage).toContain("linear-gradient(90deg");
  });
});
