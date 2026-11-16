import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/features/theme-presets/actions", () => ({
  listThemePresetsAction: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: "p1",
        name: "Gờ Tết",
        config: { preset: "go-original", version: 2, overrides: { colors: { accent: "#dc2626" } } },
        createdAt: "2026-11-16",
      },
    ],
  }),
  saveThemePresetAction: vi.fn(),
  archiveThemePresetAction: vi.fn(),
}));

import { ThemeEditor } from "@/features/pages/components/editor/theme-editor";

describe("ThemeEditor v2", () => {
  it("ghi thay đổi dạng v2 và gộp custom v1 cũ vào overrides", () => {
    const onChange = vi.fn();
    render(
      <ThemeEditor
        themeConfig={{ preset: "go-original", custom: { borderRadius: "sm" } }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Royal Blue/ }));
    const next = onChange.mock.calls.at(-1)![0];
    expect(next.version).toBe(2);
    expect(next.custom).toBeUndefined();
    expect(next.overrides.shape).toEqual({ radius: "sm" });
    expect(next.overrides.colors).toMatchObject({ accent: "#2563eb", surface: "#2563eb" });
  });

  it("chọn mẫu mới xoá toàn bộ tuỳ chỉnh", () => {
    const onChange = vi.fn();
    render(<ThemeEditor themeConfig={{ preset: "go-original" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Minimalist Light/ }));
    expect(onChange).toHaveBeenLastCalledWith({ preset: "minimal-light", version: 2, overrides: {} });
  });

  it("hiển thị cảnh báo tương phản và sửa tự động được", () => {
    const onChange = vi.fn();
    render(
      <ThemeEditor
        themeConfig={{
          preset: "minimal-light",
          version: 2,
          overrides: { colors: { text: "#eeeeee" } },
        }}
        onChange={onChange}
      />
    );
    expect(screen.getByText(/Chữ chính trên nền trang/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /Sửa tự động/ })[0]);
    const fixed = onChange.mock.calls.at(-1)![0].overrides.colors.text;
    expect(fixed).not.toBe("#eeeeee");
  });

  it("tải và áp dụng mẫu đã lưu", async () => {
    const onChange = vi.fn();
    render(<ThemeEditor themeConfig={{ preset: "go-original" }} onChange={onChange} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Gờ Tết" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Gờ Tết" }));
    expect(onChange.mock.calls.at(-1)![0].overrides.colors.accent).toBe("#dc2626");
  });

  it("mẫu Beacons ẩn các nhóm không áp dụng được", () => {
    render(<ThemeEditor themeConfig={{ preset: "beacons-dark-card" }} onChange={vi.fn()} />);
    expect(screen.getByText(/Mẫu Beacons dùng bố cục và màu cố định/)).toBeInTheDocument();
    expect(screen.queryByText("Nút liên kết")).not.toBeInTheDocument();
  });
});
