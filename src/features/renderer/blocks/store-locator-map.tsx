"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PublicBranchItem } from "@/features/branches/types";

interface StoreLocatorMapProps {
  branches: PublicBranchItem[];
  selectedId: string | null;
  defaultZoom?: number;
  pinIconUrl?: string;
  mapStyle?: "standard" | "satellite" | "hybrid";
  onSelectBranch: (id: string) => void;
}

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009]; // TP.HCM

const MAP_LYRS: Record<"standard" | "satellite" | "hybrid", string> = {
  standard: "m",
  satellite: "s",
  hybrid: "y",
};

function sanitizePinUrl(raw?: string): string {
  const s = (raw || "").trim();
  if (/^https?:\/\/[^\s"'<>]+$/i.test(s) || /^\/[^\s"'<>]*$/.test(s)) return s;
  return "/logo-gocafe.png";
}

function createBranchPinIcon(selected: boolean, pinIconUrl?: string) {
  const size = selected ? 44 : 34;
  const border = selected ? "3px solid #B88A44" : "2px solid #FFFFFF";
  const shadow = selected ? "0 6px 18px rgba(184,138,68,0.6)" : "0 3px 10px rgba(0,0,0,0.35)";
  const safeSrc = escapeHtml(sanitizePinUrl(pinIconUrl));
  return L.divIcon({
    className: "gocafe-map-pin",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#000000;border:${border};box-shadow:${shadow};overflow:hidden;display:flex;align-items:center;justify-content:center;transition:all 150ms ease;"><img src="${safeSrc}" alt="Chi nhánh" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;" /></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function StoreLocatorMap({
  branches,
  selectedId,
  defaultZoom = 12,
  pinIconUrl,
  mapStyle = "standard",
  onSelectBranch,
}: StoreLocatorMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelectBranch);

  useEffect(() => {
    onSelectRef.current = onSelectBranch;
  }, [onSelectBranch]);

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: defaultZoom,
      scrollWheelZoom: false,
    });

    const lyrs = MAP_LYRS[mapStyle] || "m";
    L.tileLayer(`https://mt{s}.google.com/vt/lyrs=${lyrs}&hl=vi&x={x}&y={y}&z={z}`, {
      subdomains: ["0", "1", "2", "3"],
      attribution: "&copy; Google Maps",
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;
    const markers = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
  }, [defaultZoom, mapStyle]);

  // Đồng bộ danh sách marker khi branches hoặc pinIconUrl thay đổi
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const validCoords: [number, number][] = [];

    for (const b of branches) {
      if (typeof b.lat !== "number" || typeof b.lng !== "number") continue;
      validCoords.push([b.lat, b.lng]);

      const marker = L.marker([b.lat, b.lng], {
        icon: createBranchPinIcon(b.id === selectedId, pinIconUrl),
        zIndexOffset: b.id === selectedId ? 1000 : 0,
      }).addTo(map);

      const popupHtml = `
        <div style="min-width:190px;font-family:var(--font-lexend-deca),sans-serif;">
          <div style="font-weight:700;font-size:13px;color:#111111;margin-bottom:4px;">${escapeHtml(b.name)}</div>
          <div style="font-size:12px;color:#52525B;line-height:1.4;">${escapeHtml(b.address)}</div>
          ${b.hours ? `<div style="font-size:11px;color:#B88A44;font-weight:600;margin-top:4px;">${escapeHtml(b.hours)}</div>` : ""}
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.on("click", () => {
        onSelectRef.current(b.id);
      });

      markersRef.current.set(b.id, marker);
    }

    if (validCoords.length === 1) {
      map.setView(validCoords[0], 15, { animate: true });
    } else if (validCoords.length > 1) {
      map.fitBounds(L.latLngBounds(validCoords), { padding: [40, 40], maxZoom: 15 });
    }
  }, [branches, selectedId, pinIconUrl]);

  // Khi bấm chọn thẻ quán bên danh sách -> bản đồ tự bay tới (flyTo) và mở popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    markersRef.current.forEach((m, id) => {
      m.setIcon(createBranchPinIcon(id === selectedId, pinIconUrl));
      m.setZIndexOffset(id === selectedId ? 1000 : 0);
    });

    const target = markersRef.current.get(selectedId);
    if (target) {
      const ll = target.getLatLng();
      map.flyTo(ll, Math.max(map.getZoom(), 15), { duration: 0.65 });
      target.openPopup();
    }
  }, [selectedId, pinIconUrl]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[380px] @min-[56rem]:min-h-[540px] z-0"
      aria-label="Bản đồ hệ thống chi nhánh"
    />
  );
}
