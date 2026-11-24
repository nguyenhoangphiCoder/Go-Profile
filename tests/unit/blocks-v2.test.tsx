import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageRenderer } from "@/features/renderer/page-renderer";
import { isSafeMapsUrl, mapsEmbedUrl, parseVideoUrl } from "@/features/renderer/embeds";
import { BLOCK_REGISTRY } from "@/features/renderer/blocks/registry";
import { BLOCK_PAYLOAD_SCHEMAS, BLOCK_TYPES } from "@/features/renderer/blocks/payload-schemas";
import { readBlockStyle } from "@/features/renderer/block-frame";
import { saveDraftSchema } from "@/features/pages/schemas";
import type { RenderBlock } from "@/features/renderer/types";

describe("nhận diện video", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube", "16/9"],
    ["https://youtu.be/dQw4w9WgXcQ?t=10", "youtube", "16/9"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "youtube", "9/16"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "youtube", "16/9"],
    ["https://www.tiktok.com/@gocafe/video/7312345678901234567", "tiktok", "9/16"],
  ])("%s", (url, provider, aspect) => {
    const v = parseVideoUrl(url)!;
    expect(v.provider).toBe(provider);
    expect(v.aspect).toBe(aspect);
    expect(v.embedUrl.startsWith("https://www.")).toBe(true);
  });

  it.each([
    "https://evil.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
    'https://www.youtube.com/watch?v=bad"onload=x',
    "https://www.tiktok.com/@a/video/abc",
    "",
  ])("từ chối %s", (url) => expect(parseVideoUrl(url)).toBeNull());

  it("URL nhúng luôn do hệ thống dựng, không chứa tham số người dùng", () => {
    const v = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&autoplay=1&x=<script>")!;
    expect(v.embedUrl).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0");
  });
});

describe("bản đồ", () => {
  it("chỉ nhận link Google Maps https", () => {
    expect(isSafeMapsUrl("https://maps.app.goo.gl/AbCd123")).toBe(true);
    expect(isSafeMapsUrl("https://www.google.com/maps/place/Go+Cafe")).toBe(true);
    expect(isSafeMapsUrl("https://www.google.com/search?q=x")).toBe(false);
    expect(isSafeMapsUrl("http://maps.app.goo.gl/AbCd123")).toBe(false);
    expect(isSafeMapsUrl("https://goo.gl/xyz")).toBe(false);
    expect(isSafeMapsUrl("https://evil.com/maps")).toBe(false);
  });

  it("địa chỉ được encode khi dựng URL nhúng", () => {
    expect(mapsEmbedUrl('1 "Lê Lợi" & <x>')).not.toMatch(/[<>" ]/);
  });
});

describe("schema khối mới", () => {
  it("26 loại khối đều có renderer, schema và payload mặc định hợp lệ", () => {
    expect(BLOCK_TYPES).toHaveLength(26);
    for (const type of BLOCK_TYPES) {
      const def = BLOCK_REGISTRY[type];
      expect(def).toBeDefined();
      expect(BLOCK_PAYLOAD_SCHEMAS[type].safeParse(def.defaultPayload).success).toBe(true);
    }
  });

  const draft = (type: string, payload: Record<string, unknown>) =>
    saveDraftSchema.safeParse({
      pageId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      expectedDraftVersion: 1,
      title: "T",
      theme: { preset: "go-original" },
      blocks: [{ id: "b", type, position: 0, isVisible: true, payload }],
    });

  it("chặn link video không thuộc whitelist", () => {
    expect(draft("video_embed", { url: "https://evil.com/v.mp4" }).success).toBe(false);
    expect(draft("video_embed", { url: "https://youtu.be/dQw4w9WgXcQ" }).success).toBe(true);
    expect(draft("video_embed", { url: "" }).success).toBe(true);
  });

  it("giới hạn số phần tử", () => {
    expect(draft("gallery", { images: Array.from({ length: 13 }, () => ({})) }).success).toBe(
      false
    );
    expect(
      draft("accordion", {
        items: Array.from({ length: 21 }, () => ({ title: "a", content: "b" })),
      }).success
    ).toBe(false);
  });

  it("blockStyle chỉ nhận giá trị whitelist, áp dụng cho cả khối cũ", () => {
    expect(
      draft("text", { content: "x", blockStyle: { surface: "card", hideOn: ["mobile"] } }).success
    ).toBe(true);
    expect(draft("text", { content: "x", blockStyle: { css: "color:red" } }).success).toBe(false);
    expect(draft("heading", { text: "x", blockStyle: { align: "middle" } }).success).toBe(false);
  });

  it("readBlockStyle bỏ qua dữ liệu hỏng", () => {
    expect(readBlockStyle({ blockStyle: { align: "evil" } })).toBeNull();
    expect(readBlockStyle({ blockStyle: { align: "left" } })).toEqual({ align: "left" });
    expect(readBlockStyle({})).toBeNull();
  });
});

const blocks: RenderBlock[] = [
  {
    id: "btn",
    type: "button",
    payload: { subtitle: "Giảm 20%", blockStyle: { animation: "fade-up", hideOn: ["desktop"] } },
    links: [{ id: "pl-btn", label: "Đặt món ngay", targetUrl: "https://shopeefood.vn" }],
  },
  {
    id: "menu",
    type: "menu_card",
    payload: { title: "Bán chạy", items: [{ name: "Bạc xỉu", price: "35.000đ", badge: "Hot" }] },
    links: [],
  },
  {
    id: "faq",
    type: "accordion",
    payload: { items: [{ title: "Có chỗ đậu xe không?", content: "Có, miễn phí." }] },
    links: [],
  },
  { id: "vid", type: "video_embed", payload: { url: "https://youtu.be/dQw4w9WgXcQ" }, links: [] },
  { id: "map", type: "map", payload: { address: "123 Nguyễn Huệ, Q1", showMap: true }, links: [] },
  {
    id: "gal",
    type: "gallery",
    payload: { images: [{ url: "https://x.supabase.co/a.png", alt: "Quầy bar" }], columns: 3 },
    links: [],
  },
];

describe("hiển thị khối mới", () => {
  it("trang công khai: nút đi qua /r, video/bản đồ dùng iframe whitelist", () => {
    const { container } = render(
      <PageRenderer mode="public" title="Gờ" theme={{ preset: "go-original" }} blocks={blocks} />
    );
    expect(screen.getByText("Đặt món ngay").closest("a")).toHaveAttribute("href", "/r/pl-btn");
    expect(screen.getByText("Bạc xỉu")).toBeInTheDocument();
    expect(screen.getByText("Có chỗ đậu xe không?")).toBeInTheDocument();

    const iframes = Array.from(container.querySelectorAll("iframe")).map((f) =>
      f.getAttribute("src")
    );
    expect(iframes).toEqual([
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
      expect.stringMatching(/^https:\/\/www\.google\.com\/maps\?q=/),
    ]);
    expect(container.querySelector("iframe")).toHaveAttribute("sandbox");
    expect(screen.getByText("Chỉ đường").closest("a")).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/www\.google\.com\/maps\/search\//)
    );
  });

  it("blockStyle được áp dụng qua lớp bao", () => {
    render(<PageRenderer mode="public" title="Gờ" theme={null} blocks={blocks} />);
    const frame = screen.getByText("Đặt món ngay").closest(".gp-anim-fade-up") as HTMLElement;
    expect(frame).not.toBeNull();
    expect(frame.className).toContain("@min-[40rem]:hidden");
  });

  it("bản xem trước: không tạo link và không nhúng bản đồ thật", () => {
    const { container } = render(
      <PageRenderer mode="preview" title="Gờ" theme={null} blocks={blocks} />
    );
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(screen.getByText(/Bản đồ Google Maps hiển thị trên trang thật/)).toBeInTheDocument();
  });

  it("khối trống hiện gợi ý trong preview và ẩn trên trang thật", () => {
    const empty: RenderBlock[] = [
      { id: "e1", type: "button", payload: {}, links: [] },
      { id: "e2", type: "video_embed", payload: { url: "" }, links: [] },
    ];
    const pub = render(<PageRenderer mode="public" title="" theme={null} blocks={empty} />);
    expect(pub.queryByText(/Chưa chọn liên kết/)).toBeNull();
    pub.unmount();
    render(<PageRenderer mode="preview" title="" theme={null} blocks={empty} />);
    expect(screen.getByText(/Chưa chọn liên kết/)).toBeInTheDocument();
    expect(screen.getByText(/Dán link YouTube hoặc TikTok/)).toBeInTheDocument();
  });
});
