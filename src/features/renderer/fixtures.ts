import { THEME_PRESETS } from "@/config/themes";
import type { PageThemeConfig } from "@/features/pages/types";
import type { RenderBlock } from "./types";

/**
 * Dữ liệu mẫu cố định cho test giao diện (Playwright) — đủ 14 loại khối, chỉ dùng ảnh trong
 * thư mục public/ để ảnh chụp không phụ thuộc mạng hay database.
 */
export const FIXTURE_BLOCKS: RenderBlock[] = [
  {
    id: "fx-header",
    type: "header",
    payload: {
      title: "Gờ Cafe",
      bio: "Cà phê rang xay mỗi ngày\n*Mở cửa 7:00 – 22:00*\nHotline: 0909 000 000",
      avatarUrl: "/logo-gocafe.png",
      bannerUrl: "/gogang-header-team.jpg",
    },
    links: [],
  },
  {
    id: "fx-social",
    type: "social_icons",
    payload: { style: "colored" },
    links: [
      { id: "fx-pl-fb", label: "Facebook", targetUrl: "https://facebook.com/gocafe" },
      { id: "fx-pl-tt", label: "TikTok", targetUrl: "https://tiktok.com/@gocafe" },
      { id: "fx-pl-zalo", label: "Zalo", targetUrl: "https://zalo.me/0909000000" },
    ],
  },
  {
    id: "fx-button",
    type: "button",
    payload: { subtitle: "Giảm 20% cho đơn đầu tiên", size: "lg", emphasis: "accent" },
    links: [
      { id: "fx-pl-order", label: "Đặt món ngay", targetUrl: "https://shopeefood.vn/gocafe" },
    ],
  },
  {
    id: "fx-heading",
    type: "heading",
    payload: { text: "Đặt món & cửa hàng", level: 1 },
    links: [],
  },
  {
    id: "fx-links",
    type: "link_list",
    payload: { layout: "stack" },
    links: [
      {
        id: "fx-pl-shopee",
        label: "ShopeeFood",
        targetUrl: "https://shopeefood.vn/gocafe",
        mediaUrl: "/thumb-shopee-circle.png",
      },
      {
        id: "fx-pl-stores",
        label: "Hệ thống cửa hàng",
        targetUrl: "https://gocafe.vn/stores",
        mediaUrl: "/thumb-stores.jpg",
      },
      { id: "fx-pl-menu", label: "Menu đồ uống", targetUrl: "https://gocafe.vn/menu" },
    ],
  },
  {
    id: "fx-text",
    type: "text",
    payload: { content: "Gờ Cafe — điểm hẹn quen thuộc của người Sài Gòn từ 2018." },
    links: [],
  },
  { id: "fx-divider", type: "divider", payload: { style: "dashed" }, links: [] },
  {
    id: "fx-menu",
    type: "menu_card",
    payload: {
      title: "Món bán chạy",
      layout: "list",
      items: [
        {
          name: "Bạc xỉu",
          price: "35.000đ",
          description: "Sữa tươi, cà phê phin",
          badge: "Hot",
          imageUrl: "/thumb-order.webp",
        },
        { name: "Cà phê muối", price: "39.000đ", description: "Kem muối béo nhẹ" },
      ],
    },
    links: [],
  },
  {
    id: "fx-gallery",
    type: "gallery",
    payload: {
      layout: "grid",
      columns: 3,
      images: [
        { url: "/gogang-link-stores.jpg", alt: "Cửa hàng" },
        { url: "/thumb-recruit.webp", alt: "Đội ngũ" },
        { url: "/thumb-stores.jpg", alt: "Không gian" },
      ],
    },
    links: [],
  },
  { id: "fx-spacer", type: "spacer", payload: { height: "md" }, links: [] },
  {
    id: "fx-image",
    type: "image",
    payload: { imageUrl: "/gogang-link-order.webp", caption: "Thực đơn mùa thu" },
    links: [],
  },
  {
    id: "fx-faq",
    type: "accordion",
    payload: {
      items: [
        { title: "Quán có chỗ đậu xe không?", content: "Có, gửi xe máy miễn phí." },
        { title: "Có nhận đặt tiệc không?", content: "Liên hệ hotline để được tư vấn." },
      ],
    },
    links: [],
  },
  {
    id: "fx-video",
    type: "video_embed",
    payload: { url: "https://youtu.be/dQw4w9WgXcQ", caption: "Câu chuyện Gờ Cafe" },
    links: [],
  },
  {
    id: "fx-map",
    type: "map",
    payload: {
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      label: "Chỉ đường đến quán",
      showMap: false,
    },
    links: [],
  },
  {
    id: "fx-mobile-only",
    type: "text",
    payload: {
      content: "Chỉ hiện trên điện thoại",
      blockStyle: { hideOn: ["desktop"], surface: "card" },
    },
    links: [],
  },
  {
    id: "fx-desktop-only",
    type: "text",
    payload: { content: "Chỉ hiện trên máy tính", blockStyle: { hideOn: ["mobile"] } },
    links: [],
  },
];

/** Mỗi mẫu giao diện có sẵn là một fixture, cộng một fixture tuỳ biến v2. */
export const FIXTURE_THEMES: Record<string, PageThemeConfig> = {
  ...Object.fromEntries(Object.keys(THEME_PRESETS).map((key) => [key, { preset: key }])),
  "custom-v2": {
    preset: "minimal-light",
    version: 2,
    overrides: {
      colors: {
        accent: "#b45309",
        surface: "#3b2a20",
        surfaceText: "#ffffff",
        surfaceBorder: "#3b2a20",
      },
      typography: { headingFont: "montserrat", textCase: "normal", baseSize: 15 },
      shape: { radius: "lg", shadow: "md" },
      button: { variant: "outline" },
      spacing: { density: "spacious" },
    },
  },
};

/** Trang fixture chỉ bật ở môi trường dev/test, hoặc khi đặt ENABLE_RENDER_FIXTURES=1. */
export function renderFixturesEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_RENDER_FIXTURES === "1";
}
