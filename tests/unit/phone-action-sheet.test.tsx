import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  parsePhoneTarget,
  resolveZaloHref,
  PhoneActionButton,
} from "@/features/renderer/phone-action-sheet";

describe("parsePhoneTarget", () => {
  it("chuẩn hoá số điện thoại Việt Nam thành tel, zalo.me và định dạng hiển thị", () => {
    expect(parsePhoneTarget("tel:0779200020")).toEqual({
      dialNumber: "0779200020",
      zaloNumber: "0779200020",
      display: "0779 200 020",
    });

    expect(parsePhoneTarget("tel:+84779200020")).toEqual({
      dialNumber: "+84779200020",
      zaloNumber: "0779200020",
      display: "0779 200 020",
    });

    expect(parsePhoneTarget("0779.200.020")).toEqual({
      dialNumber: "0779200020",
      zaloNumber: "0779200020",
      display: "0779.200.020",
    });
  });

  it("hỗ trợ số Zalo riêng hoặc link Zalo OA và chặn URL không an toàn", () => {
    expect(resolveZaloHref("0779200020", "")).toBe("https://zalo.me/0779200020");
    expect(resolveZaloHref("0779200020", "0901.234.567")).toBe("https://zalo.me/0901234567");
    expect(resolveZaloHref("0779200020", "+84901234567")).toBe("https://zalo.me/0901234567");
    expect(resolveZaloHref("0779200020", "zalo.me/gocafe")).toBe("https://zalo.me/gocafe");
    expect(resolveZaloHref("0779200020", "https://zalo.me/gocafe")).toBe("https://zalo.me/gocafe");
    expect(resolveZaloHref("0779200020", "javascript:alert(1)")).toBe("https://zalo.me/0779200020");
  });
});

describe("PhoneActionButton", () => {
  const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));

  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("mở bảng chọn Gọi điện & Nhắn Zalo khi bấm và gửi tracking click 1 lần", () => {
    render(
      <PhoneActionButton
        linkId="11111111-1111-4111-8111-111111111111"
        targetUrl="tel:0779200020"
        label={"Liên hệ mua sỉ\n0779200020"}
      >
        Liên hệ mua sỉ 0779200020
      </PhoneActionButton>
    );

    fireEvent.click(screen.getByRole("button", { name: /Liên hệ mua sỉ/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/r/11111111-1111-4111-8111-111111111111?track=1",
      expect.objectContaining({ method: "GET", keepalive: true })
    );

    const callLink = screen.getByRole("link", { name: /Gọi điện ngay/i });
    expect(callLink).toHaveAttribute("href", "tel:0779200020");

    const zaloLink = screen.getByRole("link", { name: /Nhắn Zalo/i });
    expect(zaloLink).toHaveAttribute("href", "https://zalo.me/0779200020");
    expect(zaloLink).toHaveAttribute("target", "_blank");

    expect(screen.getByRole("button", { name: /Sao chép số điện thoại/i })).toBeInTheDocument();
  });
});
