"use client";

import { useState, useEffect } from "react";
import {
  X,
  Search,
  FileText,
  Link2,
  MousePointerClick,
  Heading,
  AlignLeft,
  Image as ImageIcon,
  Images,
  UtensilsCrossed,
  ListCollapse,
  Share2,
  PlaySquare,
  MapPin,
  Maximize2,
  Minus,
  Sparkles,
  ListOrdered,
  BarChart2,
  Columns2,
  LayoutGrid,
  Table2,
  ShoppingBag,
  Inbox,
  MessageSquareQuote,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { BlockType, PageKind } from "../../types";
import { BLOCK_REGISTRY } from "@/features/renderer/blocks/registry";

interface BlockCatalogItem {
  type: BlockType;
  label: string;
  description: string;
  Icon: LucideIcon;
  toneClass: string;
}

interface BlockCatalogGroup {
  title: string;
  items: BlockCatalogItem[];
}

const BLOCK_GROUPS: BlockCatalogGroup[] = [
  {
    title: "Section Landing Page",
    items: [
      {
        type: "hero_section",
        label: "Banner mở đầu (Hero)",
        description: "Tiêu đề H1 lớn, mô tả, ảnh nổi bật & 2 nút kêu gọi hành động",
        Icon: Sparkles,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "toc_bar",
        label: "Mục lục nhảy mục (TOC)",
        description: "Thanh mục lục dính giúp nhảy nhanh tới các phần trong trang dài",
        Icon: ListOrdered,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "stats_strip",
        label: "Dải chỉ số uy tín",
        description: "Nổi bật các con số ấn tượng (TOP 1 Shopee, 55+ cửa hàng, 72H...)",
        Icon: BarChart2,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "split_content",
        label: "Khối 2 cột Ảnh – Chữ",
        description: "Giới thiệu triết lý, câu chuyện thương hiệu kèm ảnh trái/phải",
        Icon: Columns2,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "info_cards",
        label: "Thẻ thông số / Quy trình",
        description: "Trình bày thông số quán, cam kết hoặc các bước hợp tác",
        Icon: LayoutGrid,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "pricing_table",
        label: "Bảng báo giá đa cột",
        description: "Bảng giá sỉ nhiều mức (20KG / 10KG / 5KG) có highlight bán chạy",
        Icon: Table2,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "product_grid",
        label: "Lưới sản phẩm / Menu",
        description: "Trưng bày sản phẩm, đồ uống có nút lọc theo danh mục",
        Icon: ShoppingBag,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "store_locator",
        label: "Bản đồ hệ thống chi nhánh",
        description: "Bản đồ 55+ quán tương tác 2 chiều Map ⇄ List, tìm tên đường/quận không dấu",
        Icon: MapPin,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "lead_form",
        label: "Form đăng ký / Nhận báo giá",
        description: "Thu thập thông tin khách hàng nhượng quyền, báo giá sỉ (hỗ trợ tự mở Popup)",
        Icon: Inbox,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "banner_slider",
        label: "Banner trượt nhiều ảnh (Slider)",
        description: "Chạy slide nhiều chương trình ưu đãi, ảnh không gian hoặc sản phẩm mới",
        Icon: Images,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "testimonials",
        label: "Đánh giá khách hàng / Đối tác",
        description: "Trích dẫn nhận xét 5 sao từ khách hàng Shopee hoặc chủ quán nhượng quyền",
        Icon: MessageSquareQuote,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
      {
        type: "cta_banner",
        label: "Dải kêu gọi hành động (CTA)",
        description: "Dải màu nổi bật (Đen / Vàng đồng / Kem) chốt hành động cuối trang",
        Icon: Megaphone,
        toneClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      },
    ],
  },
  {
    title: "Cơ bản",
    items: [
      {
        type: "header",
        label: "Avatar & Bio",
        description: "Ảnh đại diện, ảnh bìa, tên và giới thiệu ngắn đầu trang",
        Icon: FileText,
        toneClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
      {
        type: "link_list",
        label: "Danh sách liên kết",
        description: "Nhóm các nút link xếp chồng hoặc lưới 2 cột",
        Icon: Link2,
        toneClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      },
      {
        type: "button",
        label: "Nút nổi bật (CTA)",
        description: "Nút kêu gọi hành động lớn kèm dòng phụ, SĐT / Zalo",
        Icon: MousePointerClick,
        toneClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      },
    ],
  },
  {
    title: "Văn bản & Hình ảnh",
    items: [
      {
        type: "heading",
        label: "Tiêu đề mục",
        description: "Phân tách các phần nội dung trên trang",
        Icon: Heading,
        toneClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      },
      {
        type: "text",
        label: "Đoạn văn bản",
        description: "Giới thiệu thương hiệu, thông báo, thông tin liên hệ",
        Icon: AlignLeft,
        toneClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      },
      {
        type: "image",
        label: "Ảnh / Banner",
        description: "Hiển thị 1 hình ảnh lớn kèm chú thích và link",
        Icon: ImageIcon,
        toneClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
      {
        type: "gallery",
        label: "Thư viện ảnh",
        description: "Bộ sưu tập nhiều ảnh dạng lưới hoặc trượt ngang",
        Icon: Images,
        toneClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      },
    ],
  },
  {
    title: "Bán hàng & Tương tác",
    items: [
      {
        type: "menu_card",
        label: "Thẻ món (Menu)",
        description: "Danh sách sản phẩm, đồ uống kèm giá và hình ảnh",
        Icon: UtensilsCrossed,
        toneClass: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      },
      {
        type: "accordion",
        label: "Hỏi đáp (FAQ)",
        description: "Danh sách câu hỏi mở rộng / thu gọn tiết kiệm chỗ",
        Icon: ListCollapse,
        toneClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      },
      {
        type: "social_icons",
        label: "Mạng xã hội",
        description: "Hàng icon Facebook, TikTok, Instagram, Zalo...",
        Icon: Share2,
        toneClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
      },
      {
        type: "video_embed",
        label: "Video YouTube / TikTok",
        description: "Nhúng video phát trực tiếp ngay trên trang",
        Icon: PlaySquare,
        toneClass: "bg-red-500/10 text-red-600 dark:text-red-400",
      },
      {
        type: "map",
        label: "Bản đồ / Địa chỉ",
        description: "Địa chỉ quán kèm nút mở Google Maps chỉ đường",
        Icon: MapPin,
        toneClass: "bg-green-500/10 text-green-600 dark:text-green-400",
      },
    ],
  },
  {
    title: "Bố cục",
    items: [
      {
        type: "spacer",
        label: "Khoảng cách",
        description: "Tạo khoảng trống thoáng giữa các khối",
        Icon: Maximize2,
        toneClass: "bg-slate-500/10 text-slate-500",
      },
      {
        type: "divider",
        label: "Đường kẻ ngang",
        description: "Đường phân cách tinh tế giữa các mục",
        Icon: Minus,
        toneClass: "bg-slate-500/10 text-slate-500",
      },
    ],
  },
];

export interface BlockPickerModalProps {
  isOpen: boolean;
  pageKind?: PageKind;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
}

export function BlockPickerModal({
  isOpen,
  pageKind = "profile",
  onClose,
  onSelect,
}: BlockPickerModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filteredGroups = BLOCK_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => {
      const def = BLOCK_REGISTRY[it.type];
      if (def && !def.scopes.includes(pageKind)) return false;
      return (
        !q ||
        it.label.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.type.includes(q)
      );
    }),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Thêm khối nội dung"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-border bg-card text-card-foreground shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Thêm khối nội dung</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chọn loại khối muốn thêm vào trang của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nhanh loại khối (VD: nút, ảnh, menu, bản đồ...)"
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Categorized blocks */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {filteredGroups.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">
              Không tìm thấy loại khối phù hợp với &quot;{query}&quot;.
            </p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.title} className="space-y-2.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.items.map(({ type, label, description, Icon, toneClass }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        onSelect(type);
                        setQuery("");
                        onClose();
                      }}
                      className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 text-left transition-all cursor-pointer group shadow-2xs"
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 group-hover:scale-105 transition-transform ${toneClass}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground">{label}</div>
                        <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                          {description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
