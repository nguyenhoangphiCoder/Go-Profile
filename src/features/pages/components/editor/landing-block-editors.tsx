"use client";

import Link from "next/link";
import { Plus, Trash2, MapPin, Inbox } from "lucide-react";
import { Select } from "@/components/ui/select";
import type {
  BannerSliderBlockPayload,
  CtaBannerBlockPayload,
  InfoCardsBlockPayload,
  LeadFormBlockPayload,
  PricingTableBlockPayload,
  ProductGridBlockPayload,
  SplitContentBlockPayload,
  StatsStripBlockPayload,
  StoreLocatorBlockPayload,
  TestimonialsBlockPayload,
  TocBarBlockPayload,
} from "../../types";
import { MediaPickerField } from "@/components/admin/media-picker-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

interface LandingEditorProps {
  payload: Record<string, unknown>;
  updatePayload: (patch: Record<string, unknown>) => void;
  availableMedia: {
    id: string;
    originalFilename: string | null;
    publicUrl: string | null;
  }[];
  onMediaAdded?: (newMedia: {
    id: string;
    originalFilename: string | null;
    publicUrl: string | null;
  }) => void;
}

function AnchorIdField({ value, onChange }: { value?: string; onChange: (val: string) => void }) {
  return (
    <div className="pt-2 border-t border-border/50">
      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
        Mã neo mục lục (Anchor ID — tuỳ chọn)
      </label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) =>
          onChange(
            e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9-_]/g, "")
              .slice(0, 64)
          )
        }
        placeholder="VD: bang-gia, quy-trinh (để khớp với Mục lục TOC)"
        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-input bg-background"
      />
    </div>
  );
}

/** 1. TOC Bar Editor */
export function TocBarEditor({ payload, updatePayload }: LandingEditorProps) {
  const p = payload as TocBarBlockPayload;
  const items = p.items || [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">Nhãn mục lục</label>
          <input
            type="text"
            value={p.title || ""}
            onChange={(e) => updatePayload({ title: e.target.value })}
            placeholder="VD: Mục lục"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground self-end pb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={p.sticky !== false}
            onChange={(e) => updatePayload({ sticky: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          <span>Dính thanh mục lục khi cuộn</span>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-muted-foreground">Các mục nhảy ({items.length})</span>
          <button
            type="button"
            onClick={() =>
              updatePayload({ items: [...items, { label: "Mục mới", anchorId: "muc-moi" }] })
            }
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm mục</span>
          </button>
        </div>

        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <input
              type="text"
              value={it.label}
              onChange={(e) =>
                updatePayload({
                  items: items.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                })
              }
              placeholder="Tên mục"
              className="col-span-6 px-2.5 py-1.5 rounded-lg border border-input bg-background"
            />
            <input
              type="text"
              value={it.anchorId}
              onChange={(e) =>
                updatePayload({
                  items: items.map((x, i) =>
                    i === idx
                      ? { ...x, anchorId: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") }
                      : x
                  ),
                })
              }
              placeholder="anchor-id"
              className="col-span-5 px-2.5 py-1.5 font-mono rounded-lg border border-input bg-background"
            />
            <button
              type="button"
              onClick={() => updatePayload({ items: items.filter((_, i) => i !== idx) })}
              className="col-span-1 p-1.5 text-muted-foreground hover:text-red-600 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 2. Stats Strip Editor */
export function StatsStripEditor({ payload, updatePayload }: LandingEditorProps) {
  const p = payload as StatsStripBlockPayload;
  const items = p.items || [];

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-semibold text-muted-foreground mb-1.5">Số cột hiển thị</label>
        <div className="grid grid-cols-2 gap-2">
          {([3, 4] as const).map((cols) => (
            <button
              key={cols}
              type="button"
              onClick={() => updatePayload({ columns: cols })}
              className={`py-1.5 rounded-xl border text-xs cursor-pointer ${
                (p.columns || 3) === cols
                  ? "border-primary bg-primary/10 text-primary font-bold"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cols} cột
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-muted-foreground">Chỉ số ({items.length})</span>
          <button
            type="button"
            onClick={() =>
              updatePayload({
                items: [...items, { value: "100%", label: "Chỉ số mới", sublabel: "" }],
              })
            }
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm chỉ số</span>
          </button>
        </div>

        {items.map((it, idx) => (
          <div key={idx} className="p-2.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
            <div className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={it.value}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x)),
                  })
                }
                placeholder="VD: 55+"
                className="col-span-4 px-2.5 py-1.5 font-bold rounded-lg border border-input bg-background"
              />
              <input
                type="text"
                value={it.label}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                  })
                }
                placeholder="VD: Cửa hàng TP.HCM"
                className="col-span-7 px-2.5 py-1.5 rounded-lg border border-input bg-background"
              />
              <button
                type="button"
                onClick={() => updatePayload({ items: items.filter((_, i) => i !== idx) })}
                className="col-span-1 p-1 text-muted-foreground hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={it.sublabel || ""}
              onChange={(e) =>
                updatePayload({
                  items: items.map((x, i) => (i === idx ? { ...x, sublabel: e.target.value } : x)),
                })
              }
              placeholder="Mô tả phụ (tuỳ chọn)"
              className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background"
            />
          </div>
        ))}
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}

/** 3. Split Content Editor */
export function SplitContentEditor({
  payload,
  updatePayload,
  availableMedia,
  onMediaAdded,
}: LandingEditorProps) {
  const p = payload as SplitContentBlockPayload;

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-semibold text-muted-foreground mb-1.5">Vị trí hình ảnh</label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { key: "left", label: "Ảnh bên Trái" },
              { key: "right", label: "Ảnh bên Phải" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => updatePayload({ imagePosition: opt.key })}
              className={`py-1.5 rounded-xl border text-xs cursor-pointer ${
                (p.imagePosition || "left") === opt.key
                  ? "border-primary bg-primary/10 text-primary font-bold"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Nhãn nhỏ (Eyebrow)</label>
        <input
          type="text"
          value={p.eyebrow || ""}
          onChange={(e) => updatePayload({ eyebrow: e.target.value })}
          placeholder="VD: TRIẾT LÝ KINH DOANH"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Tiêu đề mục (H2)</label>
        <input
          type="text"
          value={p.title || ""}
          onChange={(e) => updatePayload({ title: e.target.value })}
          placeholder="VD: Theo đuổi cà phê mộc từ 2013"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Nội dung chi tiết</label>
        <RichTextEditor
          value={p.content || ""}
          onChange={(html) => updatePayload({ content: html })}
          placeholder="Nhập nội dung giới thiệu..."
        />
      </div>

      <MediaPickerField
        label="Hình ảnh minh họa"
        mediaId={p.mediaId}
        mediaUrl={p.imageUrl}
        availableMedia={availableMedia}
        onMediaAdded={onMediaAdded}
        onChange={(mId, mUrl) =>
          updatePayload({ mediaId: mId || undefined, imageUrl: mUrl || undefined })
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">
            Nút CTA (tuỳ chọn)
          </label>
          <input
            type="text"
            value={p.ctaLabel || ""}
            onChange={(e) => updatePayload({ ctaLabel: e.target.value })}
            placeholder="VD: Tìm hiểu thêm"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">Đường dẫn CTA</label>
          <input
            type="text"
            value={p.ctaHref || ""}
            onChange={(e) => updatePayload({ ctaHref: e.target.value })}
            placeholder="/nhuong-quyen hoặc #lien-he"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}

/** 4. Info Cards / Steps Editor */
export function InfoCardsEditor({ payload, updatePayload }: LandingEditorProps) {
  const p = payload as InfoCardsBlockPayload;
  const items = p.items || [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">Kiểu hiển thị</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                { key: "card", label: "Thẻ thông số" },
                { key: "steps", label: "Quy trình bước" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => updatePayload({ variant: opt.key })}
                className={`py-1.5 px-1 rounded-xl border text-[11px] cursor-pointer ${
                  (p.variant || "card") === opt.key
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">Số cột</label>
          <div className="grid grid-cols-3 gap-1.5">
            {([2, 3, 4] as const).map((cols) => (
              <button
                key={cols}
                type="button"
                onClick={() => updatePayload({ columns: cols })}
                className={`py-1.5 rounded-xl border text-[11px] cursor-pointer ${
                  (p.columns || 3) === cols
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {cols} cột
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Tiêu đề khu vực</label>
        <input
          type="text"
          value={p.title || ""}
          onChange={(e) => updatePayload({ title: e.target.value })}
          placeholder="VD: Thông số tiêu chuẩn cửa hàng"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Mô tả ngắn</label>
        <input
          type="text"
          value={p.subtitle || ""}
          onChange={(e) => updatePayload({ subtitle: e.target.value })}
          placeholder="Mô tả tổng quan (tuỳ chọn)"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-muted-foreground">
            Danh sách thẻ ({items.length})
          </span>
          <button
            type="button"
            onClick={() =>
              updatePayload({
                items: [...items, { badge: "", title: "Tiêu đề mới", description: "" }],
              })
            }
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm thẻ</span>
          </button>
        </div>

        {items.map((it, idx) => (
          <div key={idx} className="p-2.5 rounded-xl border border-border/70 bg-muted/20 space-y-2">
            <div className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={it.badge || ""}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) => (i === idx ? { ...x, badge: e.target.value } : x)),
                  })
                }
                placeholder={(p.variant || "card") === "steps" ? `0${idx + 1}` : "Nhãn nhỏ"}
                className="col-span-4 px-2.5 py-1.5 rounded-lg border border-input bg-background"
              />
              <input
                type="text"
                value={it.title}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)),
                  })
                }
                placeholder="Tiêu đề thẻ"
                className="col-span-7 px-2.5 py-1.5 font-semibold rounded-lg border border-input bg-background"
              />
              <button
                type="button"
                onClick={() => updatePayload({ items: items.filter((_, i) => i !== idx) })}
                className="col-span-1 p-1 text-muted-foreground hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <textarea
              rows={2}
              value={it.description || ""}
              onChange={(e) =>
                updatePayload({
                  items: items.map((x, i) =>
                    i === idx ? { ...x, description: e.target.value } : x
                  ),
                })
              }
              placeholder="Nội dung chi tiết..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background resize-y"
            />
          </div>
        ))}
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}

/** 5. Pricing Table Editor */
export function PricingTableEditor({ payload, updatePayload }: LandingEditorProps) {
  const p = payload as PricingTableBlockPayload;
  const columns = p.columns || ["Từ 20KG", "Từ 10KG", "Từ 5KG"];
  const rows = p.rows || [];

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Tiêu đề bảng giá</label>
        <input
          type="text"
          value={p.title || ""}
          onChange={(e) => updatePayload({ title: e.target.value })}
          placeholder="VD: Bảng báo giá sỉ Cà phê bột"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">
          Ghi chú áp dụng (tuỳ chọn)
        </label>
        <input
          type="text"
          value={p.effectiveNote || ""}
          onChange={(e) => updatePayload({ effectiveNote: e.target.value })}
          placeholder="VD: Áp dụng từ 11/2026 • Giao hàng toàn quốc"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">
          Các cột mức giá (phân cách bằng dấu phẩy)
        </label>
        <input
          type="text"
          value={columns.join(", ")}
          onChange={(e) =>
            updatePayload({
              columns: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 6),
            })
          }
          placeholder="Từ 20KG, Từ 10KG, Từ 5KG"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-muted-foreground">Dòng sản phẩm ({rows.length})</span>
          <button
            type="button"
            onClick={() =>
              updatePayload({
                rows: [
                  ...rows,
                  {
                    name: "Dòng cà phê mới",
                    subtitle: "",
                    prices: columns.map(() => "—"),
                    highlight: false,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm dòng</span>
          </button>
        </div>

        {rows.map((row, rIdx) => (
          <div
            key={rIdx}
            className="p-2.5 rounded-xl border border-border/70 bg-muted/20 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={row.name}
                onChange={(e) =>
                  updatePayload({
                    rows: rows.map((r, i) => (i === rIdx ? { ...r, name: e.target.value } : r)),
                  })
                }
                placeholder="Tên sản phẩm"
                className="flex-1 px-2.5 py-1.5 font-semibold rounded-lg border border-input bg-background"
              />
              <label className="inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(row.highlight)}
                  onChange={(e) =>
                    updatePayload({
                      rows: rows.map((r, i) =>
                        i === rIdx ? { ...r, highlight: e.target.checked } : r
                      ),
                    })
                  }
                />
                <span>Nổi bật</span>
              </label>
              <button
                type="button"
                onClick={() => updatePayload({ rows: rows.filter((_, i) => i !== rIdx) })}
                className="p-1 text-muted-foreground hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              type="text"
              value={row.subtitle || ""}
              onChange={(e) =>
                updatePayload({
                  rows: rows.map((r, i) => (i === rIdx ? { ...r, subtitle: e.target.value } : r)),
                })
              }
              placeholder="Mô tả ngắn (VD: Pha phin đậm vị)"
              className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {columns.map((colName, cIdx) => (
                <div key={cIdx}>
                  <label className="block text-[10px] text-muted-foreground mb-0.5 truncate">
                    {colName}
                  </label>
                  <input
                    type="text"
                    value={row.prices?.[cIdx] || ""}
                    onChange={(e) => {
                      const nextPrices = columns.map((_, j) =>
                        j === cIdx ? e.target.value : row.prices?.[j] || ""
                      );
                      updatePayload({
                        rows: rows.map((r, i) => (i === rIdx ? { ...r, prices: nextPrices } : r)),
                      });
                    }}
                    placeholder="185.000đ"
                    className="w-full px-2 py-1 text-xs font-mono rounded-lg border border-input bg-background"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}

/** 6. Product Grid Editor */
export function ProductGridEditor({
  payload,
  updatePayload,
  availableMedia,
  onMediaAdded,
}: LandingEditorProps) {
  const p = payload as ProductGridBlockPayload;
  const categories = p.categories || [];
  const items = p.items || [];

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Tiêu đề khu vực</label>
        <input
          type="text"
          value={p.title || ""}
          onChange={(e) => updatePayload({ title: e.target.value })}
          placeholder="VD: Danh mục Cà phê & Thức uống"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">
          Nhóm lọc danh mục (phân cách bằng dấu phẩy — tuỳ chọn)
        </label>
        <input
          type="text"
          value={categories.join(", ")}
          onChange={(e) =>
            updatePayload({
              categories: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 12),
            })
          }
          placeholder="Cà phê phin, Cà phê máy, Trà trái cây"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-muted-foreground">Sản phẩm ({items.length})</span>
          <button
            type="button"
            onClick={() =>
              updatePayload({
                items: [
                  ...items,
                  {
                    name: "Sản phẩm mới",
                    category: categories[0] || "",
                    price: "",
                    description: "",
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm sản phẩm</span>
          </button>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.name}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                  })
                }
                placeholder="Tên sản phẩm"
                className="flex-1 px-2.5 py-1.5 font-semibold rounded-lg border border-input bg-background"
              />
              <input
                type="text"
                value={item.price || ""}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) => (i === idx ? { ...x, price: e.target.value } : x)),
                  })
                }
                placeholder="Giá (VD: 125.000đ)"
                className="w-28 px-2.5 py-1.5 rounded-lg border border-input bg-background"
              />
              <button
                type="button"
                onClick={() => updatePayload({ items: items.filter((_, i) => i !== idx) })}
                className="p-1 text-muted-foreground hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={item.category || ""}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) =>
                      i === idx ? { ...x, category: e.target.value } : x
                    ),
                  })
                }
                placeholder="Nhóm (khớp danh mục trên)"
                className="px-2.5 py-1.5 rounded-lg border border-input bg-background"
              />
              <input
                type="text"
                value={item.badge || ""}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) => (i === idx ? { ...x, badge: e.target.value } : x)),
                  })
                }
                placeholder="Nhãn (VD: Bán chạy)"
                className="px-2.5 py-1.5 rounded-lg border border-input bg-background"
              />
            </div>

            <input
              type="text"
              value={item.description || ""}
              onChange={(e) =>
                updatePayload({
                  items: items.map((x, i) =>
                    i === idx ? { ...x, description: e.target.value } : x
                  ),
                })
              }
              placeholder="Mô tả ngắn sản phẩm..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background"
            />

            <input
              type="text"
              value={item.buyUrl || ""}
              onChange={(e) =>
                updatePayload({
                  items: items.map((x, i) => (i === idx ? { ...x, buyUrl: e.target.value } : x)),
                })
              }
              placeholder="Link đặt mua Shopee / TikTok / iPOS (tuỳ chọn)"
              className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background"
            />

            <MediaPickerField
              label="Ảnh sản phẩm"
              mediaId={item.mediaId}
              mediaUrl={item.imageUrl}
              availableMedia={availableMedia}
              onMediaAdded={onMediaAdded}
              onChange={(mId, mUrl) =>
                updatePayload({
                  items: items.map((x, i) =>
                    i === idx ? { ...x, mediaId: mId || undefined, imageUrl: mUrl || undefined } : x
                  ),
                })
              }
            />
          </div>
        ))}
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}

/** 7. Store Locator Editor */
export function StoreLocatorEditor({ payload, updatePayload }: LandingEditorProps) {
  const p = payload as StoreLocatorBlockPayload;

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-foreground">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Khối này tự động đọc danh sách chi nhánh đang mở của workspace.</span>
        </div>
        <Link
          href="/admin/branches"
          target="_blank"
          className="shrink-0 font-semibold text-primary hover:underline"
        >
          Quản lý chi nhánh →
        </Link>
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Tiêu đề khu vực</label>
        <input
          type="text"
          value={p.title || ""}
          onChange={(e) => updatePayload({ title: e.target.value })}
          placeholder="VD: Hệ thống cửa hàng Gờ Café"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Mô tả ngắn</label>
        <input
          type="text"
          value={p.subtitle || ""}
          onChange={(e) => updatePayload({ subtitle: e.target.value })}
          placeholder="VD: Bấm chọn quán trên bản đồ hoặc tìm nhanh theo tên đường, quận"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={p.showSearch !== false}
            onChange={(e) => updatePayload({ showSearch: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          <span>Hiện ô tìm kiếm không dấu</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={p.showDistrictFilter !== false}
            onChange={(e) => updatePayload({ showDistrictFilter: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          <span>Hiện bộ lọc theo Quận</span>
        </label>
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">
          Mức phóng bản đồ mặc định ({p.defaultZoom || 12})
        </label>
        <input
          type="range"
          min={10}
          max={16}
          value={p.defaultZoom || 12}
          onChange={(e) => updatePayload({ defaultZoom: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">Kiểu nền bản đồ</label>
          <Select
            size="sm"
            value={p.mapStyle || "standard"}
            onChange={(v) => updatePayload({ mapStyle: v as "standard" | "satellite" | "hybrid" })}
            options={[
              { value: "standard", label: "Google Maps chuẩn" },
              { value: "satellite", label: "Ảnh vệ tinh" },
              { value: "hybrid", label: "Vệ tinh + Tên đường" },
            ]}
            className="w-full"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">
            URL Icon Pin chi nhánh riêng
          </label>
          <input
            type="text"
            value={p.pinIconUrl || ""}
            onChange={(e) => updatePayload({ pinIconUrl: e.target.value.trim() || undefined })}
            placeholder="Để trống = dùng logo mặc định"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}

/** 8. Lead Form Editor */
export function LeadFormEditor({ payload, updatePayload }: LandingEditorProps) {
  const p = payload as LeadFormBlockPayload;
  const popupDelaySec = typeof p.popupDelaySec === "number" ? p.popupDelaySec : 0;

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-foreground">
          <Inbox className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Khách gửi form sẽ tự lưu bảo mật vào mục Khách hàng.</span>
        </div>
        <Link
          href="/admin/leads"
          target="_blank"
          className="shrink-0 font-semibold text-primary hover:underline"
        >
          Xem Leads →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">
            Tên form nội bộ (để lọc ở /admin/leads)
          </label>
          <input
            type="text"
            value={p.formName || ""}
            onChange={(e) => updatePayload({ formName: e.target.value })}
            placeholder="VD: Đăng ký nhượng quyền"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">
            Nhãn nhỏ (Eyebrow)
          </label>
          <input
            type="text"
            value={p.eyebrow || ""}
            onChange={(e) => updatePayload({ eyebrow: e.target.value })}
            placeholder="VD: TƯ VẤN MIỄN PHÍ"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Tiêu đề Form</label>
        <input
          type="text"
          value={p.title || ""}
          onChange={(e) => updatePayload({ title: e.target.value })}
          placeholder="VD: Đăng ký nhận tư vấn & báo giá"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Mô tả ngắn</label>
        <textarea
          rows={2}
          value={p.subtitle || ""}
          onChange={(e) => updatePayload({ subtitle: e.target.value })}
          placeholder="VD: Để lại SĐT, chuyên viên sẽ liên hệ trong 30 phút."
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">Chữ trên nút gửi</label>
          <input
            type="text"
            value={p.submitLabel || ""}
            onChange={(e) => updatePayload({ submitLabel: e.target.value })}
            placeholder="VD: Gửi yêu cầu tư vấn"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">
            Tự mở Popup sau (giây — 0 là tắt)
          </label>
          <input
            type="number"
            min={0}
            max={120}
            value={popupDelaySec}
            onChange={(e) =>
              updatePayload({
                popupDelaySec: Math.max(0, Math.min(120, Number(e.target.value) || 0)),
              })
            }
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={p.showEmail !== false}
            onChange={(e) => updatePayload({ showEmail: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          <span>Hiện ô nhập Email</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={p.showNote !== false}
            onChange={(e) => updatePayload({ showNote: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          <span>Hiện ô Ghi chú nhu cầu</span>
        </label>
      </div>

      {p.showNote !== false && (
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">
            Gợi ý trong ô ghi chú
          </label>
          <input
            type="text"
            value={p.notePlaceholder || ""}
            onChange={(e) => updatePayload({ notePlaceholder: e.target.value })}
            placeholder="VD: Khu vực dự kiến mở quán, số lượng đặt sỉ..."
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
      )}

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">
          Thông báo sau khi gửi thành công
        </label>
        <input
          type="text"
          value={p.successMessage || ""}
          onChange={(e) => updatePayload({ successMessage: e.target.value })}
          placeholder="Cảm ơn bạn đã để lại thông tin..."
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">
          Tự chuyển hướng sau khi gửi thành công (tùy chọn)
        </label>
        <input
          type="text"
          value={p.redirectUrl || ""}
          onChange={(e) => updatePayload({ redirectUrl: e.target.value.trim() || undefined })}
          placeholder="VD: /cam-on hoặc https://zalo.me/... (để trống = ở lại trang)"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      {/* Nhãn tùy chỉnh cho trường cơ bản */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/60">
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">Nhãn ô Họ tên</label>
          <input
            type="text"
            value={p.fullNameLabel || ""}
            onChange={(e) => updatePayload({ fullNameLabel: e.target.value })}
            placeholder="Họ và tên"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">
            Nhãn ô Số điện thoại
          </label>
          <input
            type="text"
            value={p.phoneLabel || ""}
            onChange={(e) => updatePayload({ phoneLabel: e.target.value })}
            placeholder="Số điện thoại"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
      </div>

      {/* Trường tùy chỉnh mở rộng (Custom Fields) */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-foreground">
            Trường mở rộng ({(p.customFields || []).length}/8)
          </span>
          {(p.customFields || []).length < 8 && (
            <button
              type="button"
              onClick={() =>
                updatePayload({
                  customFields: [
                    ...(p.customFields || []),
                    {
                      id: `cf_${Date.now()}`,
                      label: "Gói quan tâm",
                      type: "select",
                      required: false,
                      options: ["Gói cơ bản", "Gói nhượng quyền"],
                    },
                  ],
                })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold hover:bg-muted cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Thêm trường
            </button>
          )}
        </div>

        {(p.customFields || []).map((field, idx) => {
          const updateField = (patch: Partial<typeof field>) => {
            const next = (p.customFields || []).map((f, i) => (i === idx ? { ...f, ...patch } : f));
            updatePayload({ customFields: next });
          };
          return (
            <div
              key={field.id}
              className="p-2.5 rounded-xl border border-border/70 bg-muted/20 space-y-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField({ label: e.target.value })}
                  placeholder="Tên trường (VD: Khu vực mở quán)"
                  className="sm:col-span-5 px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background"
                />
                <div className="sm:col-span-4">
                  <Select
                    size="sm"
                    value={field.type}
                    onChange={(v) => updateField({ type: v as "text" | "select" | "checkbox" })}
                    options={[
                      { value: "text", label: "Ô nhập chữ" },
                      { value: "select", label: "Danh sách chọn" },
                      { value: "checkbox", label: "Ô tích chọn" },
                    ]}
                    className="w-full"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(field.required)}
                      onChange={(e) => updateField({ required: e.target.checked })}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span>Bắt buộc</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updatePayload({
                        customFields: (p.customFields || []).filter((_, i) => i !== idx),
                      })
                    }
                    aria-label="Xóa trường"
                    className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {field.type === "select" && (
                <input
                  type="text"
                  value={(field.options || []).join(", ")}
                  onChange={(e) =>
                    updateField({
                      options: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Các lựa chọn cách nhau dấu phẩy (VD: TP.HCM, Hà Nội, Đà Nẵng)"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background"
                />
              )}

              {field.type === "text" && (
                <input
                  type="text"
                  value={field.placeholder || ""}
                  onChange={(e) => updateField({ placeholder: e.target.value })}
                  placeholder="Chữ gợi ý (placeholder)..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background"
                />
              )}
            </div>
          );
        })}
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}

/** 9. Banner Slider Editor */
export function BannerSliderEditor({
  payload,
  updatePayload,
  availableMedia,
  onMediaAdded,
}: LandingEditorProps) {
  const p = payload as BannerSliderBlockPayload;
  const slides = p.slides || [];
  const autoPlaySec = typeof p.autoPlaySec === "number" ? p.autoPlaySec : 5;

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-semibold text-muted-foreground mb-1">
          Tự chuyển slide sau (giây — 0 là tắt tự chạy)
        </label>
        <input
          type="number"
          min={0}
          max={30}
          value={autoPlaySec}
          onChange={(e) =>
            updatePayload({ autoPlaySec: Math.max(0, Math.min(30, Number(e.target.value) || 0)) })
          }
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-muted-foreground">
            Danh sách Slide ({slides.length})
          </span>
          <button
            type="button"
            onClick={() =>
              updatePayload({
                slides: [
                  ...slides,
                  { title: "Tiêu đề ưu đãi mới", subtitle: "", ctaLabel: "", ctaHref: "" },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm slide</span>
          </button>
        </div>

        {slides.map((slide, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-muted-foreground">Slide #{idx + 1}</span>
              <button
                type="button"
                onClick={() => updatePayload({ slides: slides.filter((_, i) => i !== idx) })}
                className="p-1 text-muted-foreground hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <MediaPickerField
              label="Ảnh Banner (tỷ lệ ngang 16:9 / 21:9)"
              mediaId={slide.mediaId}
              mediaUrl={slide.imageUrl}
              availableMedia={availableMedia}
              onMediaAdded={onMediaAdded}
              onChange={(mId, mUrl) =>
                updatePayload({
                  slides: slides.map((s, i) =>
                    i === idx ? { ...s, mediaId: mId || undefined, imageUrl: mUrl || undefined } : s
                  ),
                })
              }
            />
            <input
              type="text"
              value={slide.title || ""}
              onChange={(e) =>
                updatePayload({
                  slides: slides.map((s, i) => (i === idx ? { ...s, title: e.target.value } : s)),
                })
              }
              placeholder="Tiêu đề trên ảnh (tuỳ chọn)"
              className="w-full px-2.5 py-1.5 font-semibold rounded-lg border border-input bg-background"
            />
            <input
              type="text"
              value={slide.subtitle || ""}
              onChange={(e) =>
                updatePayload({
                  slides: slides.map((s, i) =>
                    i === idx ? { ...s, subtitle: e.target.value } : s
                  ),
                })
              }
              placeholder="Mô tả ngắn (tuỳ chọn)"
              className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={slide.ctaLabel || ""}
                onChange={(e) =>
                  updatePayload({
                    slides: slides.map((s, i) =>
                      i === idx ? { ...s, ctaLabel: e.target.value } : s
                    ),
                  })
                }
                placeholder="Nút bấm (VD: Xem ngay)"
                className="px-2.5 py-1.5 rounded-lg border border-input bg-background"
              />
              <input
                type="text"
                value={slide.ctaHref || ""}
                onChange={(e) =>
                  updatePayload({
                    slides: slides.map((s, i) =>
                      i === idx ? { ...s, ctaHref: e.target.value } : s
                    ),
                  })
                }
                placeholder="Link (/menu-go-cafe)"
                className="px-2.5 py-1.5 rounded-lg border border-input bg-background"
              />
            </div>
          </div>
        ))}
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}

/** 10. Testimonials Editor */
export function TestimonialsEditor({
  payload,
  updatePayload,
  availableMedia,
  onMediaAdded,
}: LandingEditorProps) {
  const p = payload as TestimonialsBlockPayload;
  const items = p.items || [];

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Tiêu đề khu vực</label>
        <input
          type="text"
          value={p.title || ""}
          onChange={(e) => updatePayload({ title: e.target.value })}
          placeholder="VD: Khách hàng & Đối tác nói gì về Gờ Café"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">Mô tả ngắn</label>
          <input
            type="text"
            value={p.subtitle || ""}
            onChange={(e) => updatePayload({ subtitle: e.target.value })}
            placeholder="VD: Hơn 98% đánh giá 5 sao"
            className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
          />
        </div>
        <div>
          <label className="block font-semibold text-muted-foreground mb-1">
            Số cột trên Desktop
          </label>
          <div className="flex gap-1.5">
            {([2, 3] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updatePayload({ columns: c })}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                  (p.columns || 3) === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                {c} cột
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-muted-foreground">Nhận xét ({items.length})</span>
          <button
            type="button"
            onClick={() =>
              updatePayload({
                items: [
                  ...items,
                  {
                    author: "Khách hàng mới",
                    role: "Chủ quán đối tác",
                    quote: "Cà phê thơm đậm, dịch vụ hỗ trợ rất tận tâm.",
                    rating: 5,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm nhận xét</span>
          </button>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.author}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) => (i === idx ? { ...x, author: e.target.value } : x)),
                  })
                }
                placeholder="Tên khách / đối tác"
                className="flex-1 px-2.5 py-1.5 font-semibold rounded-lg border border-input bg-background"
              />
              <input
                type="number"
                min={1}
                max={5}
                value={item.rating ?? 5}
                onChange={(e) =>
                  updatePayload({
                    items: items.map((x, i) =>
                      i === idx
                        ? { ...x, rating: Math.max(1, Math.min(5, Number(e.target.value) || 5)) }
                        : x
                    ),
                  })
                }
                title="Số sao (1-5)"
                className="w-14 px-2 py-1.5 text-center rounded-lg border border-input bg-background"
              />
              <button
                type="button"
                onClick={() => updatePayload({ items: items.filter((_, i) => i !== idx) })}
                className="p-1 text-muted-foreground hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={item.role || ""}
              onChange={(e) =>
                updatePayload({
                  items: items.map((x, i) => (i === idx ? { ...x, role: e.target.value } : x)),
                })
              }
              placeholder="Vai trò / Chi nhánh (VD: Chủ quán Q. Tân Phú)"
              className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background"
            />
            <textarea
              rows={2}
              value={item.quote}
              onChange={(e) =>
                updatePayload({
                  items: items.map((x, i) => (i === idx ? { ...x, quote: e.target.value } : x)),
                })
              }
              placeholder="Nội dung đánh giá..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background resize-none"
            />
            <MediaPickerField
              label="Ảnh đại diện (tuỳ chọn)"
              mediaId={item.mediaId}
              mediaUrl={item.avatarUrl}
              availableMedia={availableMedia}
              onMediaAdded={onMediaAdded}
              onChange={(mId, mUrl) =>
                updatePayload({
                  items: items.map((x, i) =>
                    i === idx
                      ? { ...x, mediaId: mId || undefined, avatarUrl: mUrl || undefined }
                      : x
                  ),
                })
              }
            />
          </div>
        ))}
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}

/** 11. CTA Banner Editor */
export function CtaBannerEditor({ payload, updatePayload }: LandingEditorProps) {
  const p = payload as CtaBannerBlockPayload;

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Tông màu dải CTA</label>
        <div className="flex gap-1.5">
          {(
            [
              { v: "dark", l: "Đen sang trọng" },
              { v: "gold", l: "Vàng đồng Gờ" },
              { v: "cream", l: "Kem nhạt" },
            ] as const
          ).map(({ v, l }) => (
            <button
              key={v}
              type="button"
              onClick={() => updatePayload({ tone: v })}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                (p.tone || "dark") === v
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-muted-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Nhãn nhỏ (Eyebrow)</label>
        <input
          type="text"
          value={p.eyebrow || ""}
          onChange={(e) => updatePayload({ eyebrow: e.target.value })}
          placeholder="VD: ĐỒNG HÀNH CÙNG GỜ CAFÉ"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Tiêu đề kêu gọi</label>
        <input
          type="text"
          value={p.title || ""}
          onChange={(e) => updatePayload({ title: e.target.value })}
          placeholder="VD: Sẵn sàng mở quán Gờ Café của riêng bạn?"
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div>
        <label className="block font-semibold text-muted-foreground mb-1">Mô tả ngắn</label>
        <textarea
          rows={2}
          value={p.subtitle || ""}
          onChange={(e) => updatePayload({ subtitle: e.target.value })}
          placeholder="Mô tả lợi ích khi bấm nút..."
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <input
          type="text"
          value={p.primaryCtaLabel || ""}
          onChange={(e) => updatePayload({ primaryCtaLabel: e.target.value })}
          placeholder="Nút chính (VD: Đăng ký ngay)"
          className="px-3 py-1.5 rounded-lg border border-input bg-background"
        />
        <input
          type="text"
          value={p.primaryCtaHref || ""}
          onChange={(e) => updatePayload({ primaryCtaHref: e.target.value })}
          placeholder="Link nút chính (#lien-he)"
          className="px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <input
          type="text"
          value={p.secondaryCtaLabel || ""}
          onChange={(e) => updatePayload({ secondaryCtaLabel: e.target.value })}
          placeholder="Nút phụ (VD: Gọi 1900-9246)"
          className="px-3 py-1.5 rounded-lg border border-input bg-background"
        />
        <input
          type="text"
          value={p.secondaryCtaHref || ""}
          onChange={(e) => updatePayload({ secondaryCtaHref: e.target.value })}
          placeholder="Link nút phụ (tel:19009246)"
          className="px-3 py-1.5 rounded-lg border border-input bg-background"
        />
      </div>

      <AnchorIdField value={p.anchorId} onChange={(v) => updatePayload({ anchorId: v })} />
    </div>
  );
}
