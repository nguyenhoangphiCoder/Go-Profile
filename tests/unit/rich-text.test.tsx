import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  countRichTextStats,
  isRichTextHtml,
  sanitizeRichTextHtml,
  toEditorHtml,
} from "@/lib/rich-text";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

describe("rich-text sanitizer & helpers", () => {
  it("nhận diện đúng HTML định dạng vs văn bản thuần cũ", () => {
    expect(isRichTextHtml("Xin chào Gờ Cafe")).toBe(false);
    expect(isRichTextHtml("<p><strong>Gờ Cafe</strong> rất ngon</p>")).toBe(true);
  });

  it("lọc sạch script, event handler, javascript: và giữ lại định dạng hợp lệ", () => {
    const dirty =
      '<p onclick="alert(1)"><strong style="color: #EE4D2D; font-size: 18px; background: url(javascript:x)">Gờ Cafe</strong>' +
      '<script>alert(1)</script><a href="javascript:alert(2)">xấu</a>' +
      '<a href="https://go-cafe.com">tốt</a></p>';
    const clean = sanitizeRichTextHtml(dirty);

    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("javascript:");
    expect(clean).toContain("color: #EE4D2D");
    expect(clean).toContain("font-size: 18px");
    expect(clean).toContain('href="https://go-cafe.com"');
    expect(clean).toContain('rel="noopener noreferrer"');
  });

  it("chuyển văn bản thuần có xuống dòng sang thẻ <p> an toàn", () => {
    expect(toEditorHtml("Dòng 1\nDòng 2")).toBe("<p>Dòng 1</p><p>Dòng 2</p>");
  });

  it("đếm đúng số từ và ký tự hiển thị không tính thẻ HTML", () => {
    expect(countRichTextStats("<p><strong>Gờ Cafe</strong> mộc mạc</p>")).toEqual({
      words: 4,
      chars: 15,
    });
  });
});

describe("RichTextEditor", () => {
  it("hiển thị đầy đủ thanh công cụ định dạng và thanh thống kê từ/ký tự", () => {
    render(
      <RichTextEditor
        value="<p><strong>Gờ Cafe</strong> chú trọng cà phê mộc.</p>"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Chọn font chữ")).toBeInTheDocument();
    expect(screen.getByLabelText("Chọn cỡ chữ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "In đậm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "In nghiêng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gạch chân" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chèn liên kết" })).toBeInTheDocument();
    expect(screen.getByText(/7 từ • 29 ký tự/)).toBeInTheDocument();
    expect(screen.getByText(/Chỉnh sửa trực tiếp/)).toBeInTheDocument();
  });
});
