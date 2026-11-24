"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Search, Navigation, Phone, Clock, List, Map as MapIcon } from "lucide-react";
import type { StoreLocatorBlockPayload } from "@/features/pages/types";
import { normalizeViSearch } from "@/features/branches/geo-utils";
import { PhoneActionButton } from "../phone-action-sheet";
import type { BlockRenderProps } from "../types";

const StoreLocatorMap = dynamic(
  () => import("./store-locator-map").then((m) => m.StoreLocatorMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] flex items-center justify-center bg-zinc-100 text-xs text-zinc-500">
        Đang tải bản đồ chi nhánh...
      </div>
    ),
  }
);

export function StoreLocatorBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as StoreLocatorBlockPayload;
  const allBranches = useMemo(() => ctx.branches || [], [ctx.branches]);

  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const districts = useMemo(() => {
    const set = new Set<string>();
    for (const b of allBranches) {
      if (b.district?.trim()) set.add(b.district.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [allBranches]);

  const filtered = useMemo(() => {
    const q = normalizeViSearch(search);
    return allBranches.filter((b) => {
      if (district !== "all" && b.district.trim() !== district) return false;
      if (!q) return true;
      const hay = normalizeViSearch(`${b.name} ${b.address} ${b.district} ${b.city}`);
      return hay.includes(q);
    });
  }, [allBranches, search, district]);

  const handleSelectFromMap = (id: string) => {
    setSelectedId(id);
    const cardEl = cardRefs.current.get(id);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleSelectFromList = (id: string) => {
    setSelectedId(id);
    setMobileView("map");
  };

  const getMapsHref = (b: {
    maps_url?: string | null;
    lat?: number | null;
    lng?: number | null;
    address: string;
  }) => {
    if (b.maps_url && /^https?:\/\//i.test(b.maps_url)) return b.maps_url;
    if (typeof b.lat === "number" && typeof b.lng === "number") {
      return `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
  };

  return (
    <section
      id={p.anchorId || undefined}
      className="py-6 @min-[48rem]:py-10 space-y-5 scroll-mt-24"
    >
      {(p.title?.trim() || p.subtitle?.trim()) && (
        <div className="space-y-1.5 text-left">
          {p.title?.trim() && (
            <h2
              className="text-2xl @min-[48rem]:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-heading-color)" }}
            >
              {p.title}
            </h2>
          )}
          {p.subtitle?.trim() && (
            <p className="text-sm @min-[48rem]:text-base opacity-75 leading-relaxed">
              {p.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Mobile tab switcher (Bản đồ / Danh sách) */}
      <div className="flex @min-[56rem]:hidden items-center gap-1.5 p-1 rounded-xl border border-zinc-200 bg-zinc-100/80">
        <button
          type="button"
          onClick={() => setMobileView("map")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            mobileView === "map" ? "bg-[#111111] text-white shadow-2xs" : "text-zinc-600"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Bản đồ ({filtered.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileView("list")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            mobileView === "list" ? "bg-[#111111] text-white shadow-2xs" : "text-zinc-600"
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Danh sách ({filtered.length})</span>
        </button>
      </div>

      {/* 2-way Interactive Map <-> List */}
      <div
        className="grid grid-cols-1 @min-[56rem]:grid-cols-12 rounded-3xl border overflow-hidden shadow-xs"
        style={{ borderColor: "var(--gp-surface-border)", backgroundColor: "#FFFFFF" }}
      >
        {/* Map column (Left 60%) */}
        <div
          className={`@min-[56rem]:col-span-7 relative ${
            mobileView === "map" ? "block" : "hidden @min-[56rem]:block"
          }`}
        >
          <StoreLocatorMap
            branches={filtered}
            selectedId={selectedId}
            defaultZoom={p.defaultZoom || 12}
            pinIconUrl={p.pinIconUrl}
            mapStyle={p.mapStyle || "standard"}
            onSelectBranch={handleSelectFromMap}
          />
        </div>

        {/* Search + District + Scrollable List (Right 40%) */}
        <div
          className={`@min-[56rem]:col-span-5 flex flex-col border-t @min-[56rem]:border-t-0 @min-[56rem]:border-l h-[460px] @min-[56rem]:h-[540px] ${
            mobileView === "list" ? "flex" : "hidden @min-[56rem]:flex"
          }`}
          style={{ borderColor: "var(--gp-surface-border)" }}
        >
          {/* Search & District filter */}
          {(p.showSearch !== false || p.showDistrictFilter !== false) && (
            <div
              className="p-3.5 border-b space-y-2.5 shrink-0"
              style={{ borderColor: "var(--gp-surface-border)", backgroundColor: "#F8F7F4" }}
            >
              {p.showSearch !== false && (
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm tên đường, quận (không cần dấu)..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-zinc-300 bg-white text-[#111111] focus:outline-hidden focus:border-[#111111]"
                  />
                </div>
              )}

              {p.showDistrictFilter !== false && districts.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    type="button"
                    onClick={() => setDistrict("all")}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                      district === "all"
                        ? "bg-[#111111] text-white border-[#111111]"
                        : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    Tất cả ({allBranches.length})
                  </button>
                  {districts.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDistrict(d)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                        district === d
                          ? "bg-[#111111] text-white border-[#111111]"
                          : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Branch cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/70">
            {filtered.length === 0 ? (
              <div className="py-12 px-4 text-center text-zinc-500 space-y-1.5">
                <MapPin className="w-7 h-7 mx-auto opacity-30" />
                <p className="text-xs font-semibold text-zinc-700">
                  {allBranches.length === 0
                    ? "Chưa có dữ liệu chi nhánh"
                    : "Không tìm thấy chi nhánh phù hợp"}
                </p>
                <p className="text-[11px]">
                  {allBranches.length === 0
                    ? "Thêm danh sách quán tại mục Hệ thống chi nhánh (/admin/branches)."
                    : "Thử nhập tên đường khác hoặc chọn Tất cả quận."}
                </p>
              </div>
            ) : (
              filtered.map((b) => {
                const isSelected = selectedId === b.id;
                return (
                  <div
                    key={b.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(b.id, el);
                      else cardRefs.current.delete(b.id);
                    }}
                    onClick={() => handleSelectFromList(b.id)}
                    className={`p-4 text-left cursor-pointer transition-colors space-y-2 ${
                      isSelected
                        ? "bg-[#FBF8F1] ring-2 ring-inset ring-[#B88A44]"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#111111] leading-snug">{b.name}</h3>
                      {b.district && (
                        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                          {b.district}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#B88A44] shrink-0 mt-0.5" />
                      <span>{b.address}</span>
                    </p>

                    {b.hours && (
                      <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        <span>{b.hours}</span>
                      </p>
                    )}

                    <div
                      className="flex items-center gap-2 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={ctx.mode === "public" ? getMapsHref(b) : undefined}
                        onClick={ctx.mode === "public" ? undefined : (e) => e.preventDefault()}
                        target={ctx.mode === "public" ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111111] text-white text-[11px] font-semibold hover:bg-zinc-800 transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Chỉ đường</span>
                      </a>
                      {b.phone && ctx.mode === "public" && (
                        <PhoneActionButton
                          targetUrl={`tel:${b.phone}`}
                          label={b.name}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-[#111111] text-[11px] font-semibold hover:bg-zinc-50 transition-colors"
                        >
                          <Phone className="w-3 h-3 text-[#B88A44]" />
                          <span>Gọi / Zalo</span>
                        </PhoneActionButton>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
