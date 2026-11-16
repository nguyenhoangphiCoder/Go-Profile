"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { MediaPickerField } from "@/components/admin/media-picker-field";
import { isSafeMapsUrl, parseVideoUrl } from "@/features/renderer/embeds";
import type {
  AccordionBlockPayload,
  BlockStyle,
  ButtonBlockPayload,
  EditorBlockItem,
  GalleryBlockPayload,
  GalleryImageItem,
  LinkPlacementItem,
  MapBlockPayload,
  MenuCardBlockPayload,
  MenuCardItem,
  VideoEmbedBlockPayload,
} from "../../types";

type MediaOption = { id: string; originalFilename: string | null; publicUrl: string | null };

export interface V2EditorProps {
  block: EditorBlockItem;
  updatePayload: (partial: Record<string, unknown>) => void;
  onUpdateBlock: (updated: EditorBlockItem) => void;
  availableLinks: {
    id: string;
    defaultLabel: string;
    targetUrl: string;
    kind: "standard" | "social" | "contact";
    defaultMediaId: string | null;
    defaultMediaUrl?: string | null;
  }[];
  availableMedia: MediaOption[];
  onMediaAdded?: (m: MediaOption) => void;
}

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block font-semibold text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block font-semibold text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`min-h-9 px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
              value === o.value
                ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Danh sách phần tử có thêm / xoá / đổi thứ tự (dùng cho thư viện ảnh, thẻ món, hỏi đáp). */
function ItemList<T>({
  items,
  max,
  addLabel,
  onChange,
  makeItem,
  renderItem,
}: {
  items: T[];
  max: number;
  addLabel: string;
  onChange: (items: T[]) => void;
  makeItem: () => T;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="p-2.5 rounded-xl border border-border bg-background space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">
              #{i + 1}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 cursor-pointer"
                aria-label="Lên"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 cursor-pointer"
                aria-label="Xuống"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                aria-label="Xoá"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {renderItem(
            item,
            (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))),
            i
          )}
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          onClick={() => onChange([...items, makeItem()])}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border hover:bg-muted text-muted-foreground font-medium cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {addLabel} ({items.length}/{max})
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ButtonBlockEditor({
  block,
  updatePayload,
  onUpdateBlock,
  availableLinks,
}: V2EditorProps) {
  const p = block.payload as ButtonBlockPayload;
  const current = block.placements?.[0];

  const selectLink = (linkId: string) => {
    const link = availableLinks.find((l) => l.id === linkId);
    if (!link) {
      onUpdateBlock({ ...block, placements: [] });
      return;
    }
    const placement: LinkPlacementItem = {
      id: crypto.randomUUID(),
      linkId: link.id,
      position: 0,
      labelOverride: current?.labelOverride ?? null,
      defaultLabel: link.defaultLabel,
      defaultUrl: link.targetUrl,
      defaultKind: link.kind,
      defaultMediaUrl: link.defaultMediaUrl,
    };
    onUpdateBlock({ ...block, placements: [placement] });
  };

  return (
    <div className="space-y-3.5">
      <Field
        label="Liên kết của nút"
        hint="Lượt bấm được ghi nhận vào báo cáo như danh sách liên kết."
      >
        <select
          value={current?.linkId || ""}
          onChange={(e) => selectLink(e.target.value)}
          className={inputClass}
        >
          <option value="">-- Chọn liên kết --</option>
          {availableLinks.map((l) => (
            <option key={l.id} value={l.id}>
              {l.defaultLabel} ({l.targetUrl})
            </option>
          ))}
        </select>
      </Field>
      {current && (
        <Field label="Chữ trên nút (để trống = nhãn gốc)">
          <input
            type="text"
            maxLength={100}
            placeholder={current.defaultLabel}
            value={current.labelOverride || ""}
            onChange={(e) =>
              onUpdateBlock({
                ...block,
                placements: [{ ...current, labelOverride: e.target.value || null }],
              })
            }
            className={inputClass}
          />
        </Field>
      )}
      <Field label="Dòng phụ dưới nút (tuỳ chọn)">
        <input
          type="text"
          maxLength={120}
          placeholder="VD: Giảm 20% cho đơn đầu tiên"
          value={p.subtitle || ""}
          onChange={(e) => updatePayload({ subtitle: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Choice
        label="Kích thước"
        value={p.size ?? "lg"}
        options={[
          { value: "md", label: "Vừa" },
          { value: "lg", label: "Lớn" },
        ]}
        onChange={(size) => updatePayload({ size })}
      />
      <Choice
        label="Màu nút"
        value={p.emphasis ?? "accent"}
        options={[
          { value: "accent", label: "Màu nhấn" },
          { value: "surface", label: "Màu nút liên kết" },
        ]}
        onChange={(emphasis) => updatePayload({ emphasis })}
      />
    </div>
  );
}

export function GalleryBlockEditor({
  block,
  updatePayload,
  availableMedia,
  onMediaAdded,
}: V2EditorProps) {
  const p = block.payload as GalleryBlockPayload;
  return (
    <div className="space-y-3.5">
      <Choice
        label="Kiểu hiển thị"
        value={p.layout ?? "grid"}
        options={[
          { value: "grid", label: "Lưới" },
          { value: "carousel", label: "Trượt ngang" },
        ]}
        onChange={(layout) => updatePayload({ layout })}
      />
      {(p.layout ?? "grid") === "grid" && (
        <Choice
          label="Số cột"
          value={p.columns ?? 2}
          options={[
            { value: 2, label: "2 cột" },
            { value: 3, label: "3 cột" },
          ]}
          onChange={(columns) => updatePayload({ columns })}
        />
      )}
      <ItemList<GalleryImageItem>
        items={p.images || []}
        max={12}
        addLabel="Thêm ảnh"
        onChange={(images) => updatePayload({ images })}
        makeItem={() => ({})}
        renderItem={(img, update) => (
          <div className="space-y-2">
            <MediaPickerField
              label="Ảnh"
              mediaId={img.mediaId}
              mediaUrl={img.url}
              onChange={(mediaId, url) =>
                update({ mediaId: mediaId || undefined, url: url || undefined })
              }
              availableMedia={availableMedia}
              onMediaAdded={onMediaAdded}
            />
            <input
              type="text"
              maxLength={200}
              placeholder="Mô tả ảnh (cho người khiếm thị)"
              value={img.alt || ""}
              onChange={(e) => update({ alt: e.target.value })}
              className={inputClass}
            />
          </div>
        )}
      />
    </div>
  );
}

export function MenuCardBlockEditor({
  block,
  updatePayload,
  availableMedia,
  onMediaAdded,
}: V2EditorProps) {
  const p = block.payload as MenuCardBlockPayload;
  return (
    <div className="space-y-3.5">
      <Field label="Tiêu đề nhóm món (tuỳ chọn)">
        <input
          type="text"
          maxLength={120}
          placeholder="VD: Món bán chạy"
          value={p.title || ""}
          onChange={(e) => updatePayload({ title: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Choice
        label="Bố cục"
        value={p.layout ?? "list"}
        options={[
          { value: "list", label: "Danh sách" },
          { value: "grid", label: "Lưới 2 cột" },
        ]}
        onChange={(layout) => updatePayload({ layout })}
      />
      <ItemList<MenuCardItem>
        items={p.items || []}
        max={30}
        addLabel="Thêm món"
        onChange={(items) => updatePayload({ items })}
        makeItem={() => ({ name: "" })}
        renderItem={(item, update) => (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <input
                type="text"
                maxLength={120}
                placeholder="Tên món"
                value={item.name}
                onChange={(e) => update({ name: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                maxLength={40}
                placeholder="Giá"
                value={item.price || ""}
                onChange={(e) => update({ price: e.target.value })}
                className={inputClass}
              />
            </div>
            <input
              type="text"
              maxLength={300}
              placeholder="Mô tả ngắn"
              value={item.description || ""}
              onChange={(e) => update({ description: e.target.value })}
              className={inputClass}
            />
            <input
              type="text"
              maxLength={30}
              placeholder="Nhãn nổi bật (VD: Bán chạy, Mới)"
              value={item.badge || ""}
              onChange={(e) => update({ badge: e.target.value })}
              className={inputClass}
            />
            <MediaPickerField
              label="Ảnh món (tuỳ chọn)"
              mediaId={item.mediaId}
              mediaUrl={item.imageUrl}
              onChange={(mediaId, url) =>
                update({ mediaId: mediaId || undefined, imageUrl: url || undefined })
              }
              availableMedia={availableMedia}
              onMediaAdded={onMediaAdded}
            />
          </div>
        )}
      />
    </div>
  );
}

export function AccordionBlockEditor({ block, updatePayload }: V2EditorProps) {
  const p = block.payload as AccordionBlockPayload;
  return (
    <ItemList
      items={p.items || []}
      max={20}
      addLabel="Thêm mục"
      onChange={(items) => updatePayload({ items })}
      makeItem={() => ({ title: "", content: "" })}
      renderItem={(item, update) => (
        <div className="space-y-2">
          <input
            type="text"
            maxLength={200}
            placeholder="Câu hỏi / tiêu đề"
            value={item.title}
            onChange={(e) => update({ title: e.target.value })}
            className={inputClass}
          />
          <textarea
            rows={3}
            maxLength={3000}
            placeholder="Nội dung trả lời"
            value={item.content}
            onChange={(e) => update({ content: e.target.value })}
            className={inputClass}
          />
        </div>
      )}
    />
  );
}

export function VideoBlockEditor({ block, updatePayload }: V2EditorProps) {
  const p = block.payload as VideoEmbedBlockPayload;
  const url = p.url || "";
  const video = parseVideoUrl(url);
  return (
    <div className="space-y-3.5">
      <Field
        label="Link video YouTube hoặc TikTok"
        hint={
          url && !video
            ? "⚠ Link chưa đúng định dạng YouTube / TikTok — trang sẽ không lưu được."
            : video
              ? `✓ Nhận diện: ${video.provider === "youtube" ? "YouTube" : "TikTok"} (${video.id})`
              : "VD: https://youtu.be/xxxx hoặc https://www.tiktok.com/@gocafe/video/123..."
        }
      >
        <input
          type="url"
          maxLength={500}
          placeholder="https://"
          value={url}
          onChange={(e) => updatePayload({ url: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Chú thích (tuỳ chọn)">
        <input
          type="text"
          maxLength={300}
          value={p.caption || ""}
          onChange={(e) => updatePayload({ caption: e.target.value })}
          className={inputClass}
        />
      </Field>
    </div>
  );
}

export function MapBlockEditor({ block, updatePayload }: V2EditorProps) {
  const p = block.payload as MapBlockPayload;
  const badUrl = Boolean(p.mapsUrl) && !isSafeMapsUrl(p.mapsUrl);
  return (
    <div className="space-y-3.5">
      <Field label="Địa chỉ">
        <input
          type="text"
          maxLength={300}
          placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP.HCM"
          value={p.address || ""}
          onChange={(e) => updatePayload({ address: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Tiêu đề">
        <input
          type="text"
          maxLength={80}
          value={p.label || ""}
          onChange={(e) => updatePayload({ label: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field
        label="Link Google Maps của quán (tuỳ chọn)"
        hint={
          badUrl
            ? "⚠ Chỉ nhận link Google Maps (https://maps.app.goo.gl/... hoặc https://www.google.com/maps/...)"
            : "Để trống sẽ tự tìm theo địa chỉ."
        }
      >
        <input
          type="url"
          maxLength={500}
          placeholder="https://maps.app.goo.gl/..."
          value={p.mapsUrl || ""}
          onChange={(e) => updatePayload({ mapsUrl: e.target.value })}
          className={inputClass}
        />
      </Field>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={Boolean(p.showMap)}
          onChange={(e) => updatePayload({ showMap: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        <span className="font-medium">Hiển thị bản đồ nhúng phía trên</span>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kiểu khối (áp dụng cho mọi loại khối)
// ---------------------------------------------------------------------------

export function BlockStyleEditor({
  block,
  updatePayload,
}: Pick<V2EditorProps, "block" | "updatePayload">) {
  const style = ((block.payload as { blockStyle?: BlockStyle }).blockStyle ?? {}) as BlockStyle;
  const set = (patch: Partial<BlockStyle>) => {
    const next: BlockStyle = { ...style, ...patch };
    for (const key of Object.keys(next) as (keyof BlockStyle)[]) {
      const v = next[key];
      if (v === undefined || (Array.isArray(v) && v.length === 0)) delete next[key];
    }
    updatePayload({ blockStyle: Object.keys(next).length > 0 ? next : undefined });
  };
  const hide = style.hideOn ?? [];
  const toggleHide = (d: "mobile" | "desktop") =>
    set({ hideOn: hide.includes(d) ? hide.filter((x) => x !== d) : [...hide, d] });
  const active = Object.keys(style).length > 0;

  return (
    <details className="group rounded-xl border border-border/80 bg-muted/20" open={active}>
      <summary className="flex items-center justify-between px-3 py-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <span className="font-semibold text-muted-foreground">
          Kiểu khối {active && <span className="text-primary">• đã tuỳ chỉnh</span>}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-3 pb-3 space-y-3">
        <Choice
          label="Căn lề"
          value={style.align}
          options={[
            { value: "left", label: "Trái" },
            { value: "center", label: "Giữa" },
            { value: "right", label: "Phải" },
          ]}
          onChange={(align) => set({ align: style.align === align ? undefined : align })}
        />
        <Choice
          label="Khoảng đệm trên/dưới"
          value={style.paddingY ?? "none"}
          options={[
            { value: "none", label: "Không" },
            { value: "sm", label: "Nhỏ" },
            { value: "md", label: "Vừa" },
            { value: "lg", label: "Lớn" },
          ]}
          onChange={(paddingY) => set({ paddingY: paddingY === "none" ? undefined : paddingY })}
        />
        <Choice
          label="Nền khối"
          value={style.surface ?? "none"}
          options={[
            { value: "none", label: "Trong suốt" },
            { value: "card", label: "Thẻ nổi" },
          ]}
          onChange={(surface) => set({ surface: surface === "none" ? undefined : surface })}
        />
        <Choice
          label="Hiệu ứng xuất hiện"
          value={style.animation ?? "none"}
          options={[
            { value: "none", label: "Không" },
            { value: "fade-up", label: "Trượt lên" },
          ]}
          onChange={(animation) => set({ animation: animation === "none" ? undefined : animation })}
        />
        <div className="space-y-1.5">
          <span className="block font-semibold text-muted-foreground">Ẩn trên thiết bị</span>
          <div className="flex gap-3">
            {(
              [
                ["mobile", "Điện thoại"],
                ["desktop", "Máy tính / tablet"],
              ] as const
            ).map(([d, label]) => (
              <label key={d} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hide.includes(d)}
                  onChange={() => toggleHide(d)}
                  className="w-4 h-4 rounded"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}
