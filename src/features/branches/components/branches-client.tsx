"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Upload,
  Search,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  Compass,
} from "lucide-react";
import type { BranchItem, ParsedBranchCsvRow } from "../types";
import {
  archiveBranchAction,
  createBranchAction,
  geocodeBranchAddressAction,
  importBranchesAction,
  toggleBranchActiveAction,
  updateBranchAction,
} from "../actions";
import { extractLatLngFromMapsUrl, normalizeViSearch, parseBranchesCsv } from "../geo-utils";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

interface BranchesClientProps {
  initialBranches: BranchItem[];
  canEdit: boolean;
}

const SAMPLE_CSV = [
  "Tên chi nhánh,Địa chỉ,Quận,Thành phố,SĐT,Giờ mở cửa,Link Maps,Lat,Lng",
  '"Gờ Café Ấp Bắc","320 Ấp Bắc, P.13",Tân Bình,TP.HCM,0779200020,06:30 - 22:00,"https://maps.google.com/?q=10.8021,106.6412",10.8021,106.6412',
  '"Gờ Café Phan Xích Long","168 Phan Xích Long, P.7",Phú Nhuận,TP.HCM,0779200020,06:30 - 22:30,"https://maps.google.com/?q=10.7995,106.6901",10.7995,106.6901',
  '"Gờ Café Nguyễn Gia Trí","92 Nguyễn Gia Trí, P.25",Bình Thạnh,TP.HCM,0779200020,06:30 - 22:30,"https://maps.google.com/?q=10.8038,106.7152",10.8038,106.7152',
].join("\n");

export function BranchesClient({ initialBranches, canEdit }: BranchesClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");

  // Modal Add/Edit
  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; branch: BranchItem } | null
  >(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("TP.HCM");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState("06:30 – 22:00");
  const [mapsUrl, setMapsUrl] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [geocoding, setGeocoding] = useState(false);

  // Modal Import CSV
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const parsedCsv: ParsedBranchCsvRow[] = useMemo(() => parseBranchesCsv(csvText), [csvText]);
  const validCsvRows = parsedCsv.filter((r) => !r.error);
  const errorCsvRows = parsedCsv.filter((r) => Boolean(r.error));

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<BranchItem | null>(null);

  const districts = useMemo(() => {
    const set = new Set<string>();
    for (const b of initialBranches) {
      if (b.district?.trim()) set.add(b.district.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [initialBranches]);

  const filtered = useMemo(() => {
    const q = normalizeViSearch(search);
    return initialBranches.filter((b) => {
      if (districtFilter !== "all" && b.district.trim() !== districtFilter) return false;
      if (!q) return true;
      const hay = normalizeViSearch(
        `${b.name} ${b.address} ${b.district} ${b.code || ""} ${b.phone || ""}`
      );
      return hay.includes(q);
    });
  }, [initialBranches, search, districtFilter]);

  const openCreate = () => {
    setName("");
    setCode("");
    setAddress("");
    setDistrict("");
    setCity("TP.HCM");
    setPhone("");
    setHours("06:30 – 22:00");
    setMapsUrl("");
    setLat("");
    setLng("");
    setFormModal({ mode: "create" });
  };

  const openEdit = (b: BranchItem) => {
    setName(b.name);
    setCode(b.code || "");
    setAddress(b.address);
    setDistrict(b.district);
    setCity(b.city || "TP.HCM");
    setPhone(b.phone || "");
    setHours(b.hours || "");
    setMapsUrl(b.mapsUrl || "");
    setLat(b.lat !== null ? String(b.lat) : "");
    setLng(b.lng !== null ? String(b.lng) : "");
    setFormModal({ mode: "edit", branch: b });
  };

  const handleMapsUrlChange = (val: string) => {
    setMapsUrl(val);
    const coords = extractLatLngFromMapsUrl(val);
    if (coords) {
      setLat(String(coords.lat));
      setLng(String(coords.lng));
      toast.info(`Đã tự động tách tọa độ: ${coords.lat}, ${coords.lng}`);
    }
  };

  const handleGeocodeAddress = async () => {
    const base = address.trim();
    if (base.length < 4) {
      toast.error("Vui lòng nhập địa chỉ cửa hàng trước khi lấy tọa độ.");
      return;
    }
    const lower = normalizeViSearch(base);
    const parts = [base];
    if (district.trim() && !lower.includes(normalizeViSearch(district))) {
      parts.push(district.trim());
    }
    if (city.trim() && !lower.includes(normalizeViSearch(city))) {
      parts.push(city.trim());
    }

    setGeocoding(true);
    try {
      const res = await geocodeBranchAddressAction(parts.join(", "));
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setLat(String(res.lat));
      setLng(String(res.lng));
      if (!mapsUrl.trim()) setMapsUrl(res.mapsUrl);
      if (!district.trim() && res.district) setDistrict(res.district);
      if (!city.trim() && res.city) setCity(res.city);
      toast.success(`Đã lấy tọa độ Goong: ${res.lat}, ${res.lng} (${res.formattedAddress})`);
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formModal) return;

    startTransition(async () => {
      const payload = {
        code: code || null,
        name,
        address,
        district,
        city,
        phone: phone || null,
        hours: hours || null,
        mapsUrl: mapsUrl || null,
        lat: lat.trim() === "" ? null : lat,
        lng: lng.trim() === "" ? null : lng,
      };

      const res =
        formModal.mode === "create"
          ? await createBranchAction(payload)
          : await updateBranchAction({ ...payload, id: formModal.branch.id });

      if (res.success) {
        toast.success(
          formModal.mode === "create" ? `Đã thêm chi nhánh "${name}"` : "Đã cập nhật chi nhánh"
        );
        setFormModal(null);
        router.refresh();
      } else {
        toast.error(res.error || "Không thể lưu chi nhánh");
      }
    });
  };

  const handleToggleActive = (b: BranchItem) => {
    startTransition(async () => {
      const res = await toggleBranchActiveAction(b.id, !b.isActive);
      if (res.success) {
        router.refresh();
      } else {
        toast.error(res.error || "Không thể đổi trạng thái");
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const res = await archiveBranchAction(target.id);
      setDeleteTarget(null);
      if (res.success) {
        toast.success(`Đã xóa chi nhánh "${target.name}"`);
        router.refresh();
      } else {
        toast.error(res.error || "Không thể xóa chi nhánh");
      }
    });
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob(["\uFEFF" + SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau-chi-nhanh-gocafe.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ""));
    reader.readAsText(file, "utf-8");
  };

  const handleConfirmImport = () => {
    if (validCsvRows.length === 0) return;
    startTransition(async () => {
      const res = await importBranchesAction({
        rows: validCsvRows.map((r) => ({
          code: r.code || null,
          name: r.name,
          address: r.address,
          district: r.district,
          city: r.city,
          phone: r.phone || null,
          hours: r.hours || null,
          mapsUrl: r.mapsUrl || null,
          lat: r.lat,
          lng: r.lng,
          isActive: true,
        })),
      });
      if (res.success) {
        toast.success(`Đã import thành công ${res.count} chi nhánh!`);
        setImportOpen(false);
        setCsvText("");
        router.refresh();
      } else {
        toast.error(res.error || "Import thất bại");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên quán, tên đường, quận (không dấu)..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-border bg-card focus:outline-hidden focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={districtFilter}
              onChange={setDistrictFilter}
              options={[
                { value: "all", label: `Tất cả quận (${initialBranches.length})` },
                ...districts.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm chi nhánh</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-xs font-semibold text-muted-foreground">
                <th className="py-3 px-4">Chi nhánh & Địa chỉ</th>
                <th className="py-3 px-3 hidden sm:table-cell">Quận</th>
                <th className="py-3 px-3 hidden md:table-cell">Tọa độ (Map)</th>
                <th className="py-3 px-3 hidden lg:table-cell">Giờ & SĐT</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto opacity-30 mb-2" />
                    <p className="text-sm font-semibold text-foreground">Chưa có chi nhánh nào</p>
                    <p className="text-xs mt-0.5">
                      Thêm từng chi nhánh hoặc dùng nút &quot;Import CSV&quot; để nạp nhanh 55+
                      quán.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{b.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{b.address}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs hidden sm:table-cell">
                      {b.district || "—"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] hidden md:table-cell">
                      {b.lat !== null && b.lng !== null ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <Compass className="w-3.5 h-3.5" />
                          {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-amber-600">Chưa có tọa độ</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-xs text-muted-foreground hidden lg:table-cell">
                      <div>{b.hours || "—"}</div>
                      {b.phone && <div className="font-mono text-[11px]">{b.phone}</div>}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge tone={b.isActive ? "success" : "warning"}>
                        {b.isActive ? "Đang mở" : "Tạm ẩn"}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {b.mapsUrl && (
                          <a
                            href={b.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Mở Google Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(b)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                              title={b.isActive ? "Tạm ẩn trên bản đồ" : "Hiện lại trên bản đồ"}
                            >
                              {b.isActive ? (
                                <Eye className="w-3.5 h-3.5" />
                              ) : (
                                <EyeOff className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(b)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(b)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ADD / EDIT BRANCH */}
      {formModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <h3 className="text-sm font-bold text-foreground">
                {formModal.mode === "create" ? "Thêm chi nhánh mới" : "Chỉnh sửa chi nhánh"}
              </h3>
              <button
                type="button"
                onClick={() => setFormModal(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Tên chi nhánh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Gờ Café Ấp Bắc"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Mã quán (tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: GO-01"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Địa chỉ đầy đủ <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={geocoding || address.trim().length < 4}
                    onClick={handleGeocodeAddress}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {geocoding ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Compass className="w-3 h-3" />
                    )}
                    <span>{geocoding ? "Đang tìm tọa độ..." : "Tự lấy tọa độ (Goong)"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: 535 Kênh Tân Hoá, P. Hoà Thạnh, Q. Tân Phú"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="VD: Tân Bình"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Thành phố
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="TP.HCM"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0779200020"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Giờ mở cửa
                  </label>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="06:30 – 22:00"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Link Google Maps (dán link sẽ tự tách tọa độ lat/lng)
                </label>
                <input
                  type="text"
                  value={mapsUrl}
                  onChange={(e) => handleMapsUrlChange(e.target.value)}
                  placeholder="https://www.google.com/maps/place/.../@10.8021,106.6412,17z"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Vĩ độ (Lat)
                  </label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="VD: 10.8021"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Kinh độ (Lng)
                  </label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="VD: 106.6412"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-input bg-background"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setFormModal(null)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-border hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim() || !address.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{formModal.mode === "create" ? "Thêm chi nhánh" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT CSV */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Import nhanh danh sách chi nhánh (CSV)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tải file mẫu hoặc dán trực tiếp từ Excel/Google Sheets. Tự động tách tọa độ từ
                  link Maps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file CSV mẫu (3 quán)</span>
              </button>
              <button
                type="button"
                onClick={() => setCsvText(SAMPLE_CSV)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                <span>Điền sẵn dữ liệu mẫu</span>
              </button>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold hover:opacity-90 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn file .csv</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Dán nội dung CSV (có dòng tiêu đề ở dòng 1)..."
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-input bg-background shrink-0"
            />

            {parsedCsv.length > 0 && (
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hợp lệ: {validCsvRows.length}
                  </span>
                  {errorCsvRows.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Lỗi (sẽ bỏ qua): {errorCsvRows.length}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-border overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 text-[11px]">
                      <tr>
                        <th className="py-1.5 px-2.5">Dòng</th>
                        <th className="py-1.5 px-2.5">Tên quán</th>
                        <th className="py-1.5 px-2.5">Quận</th>
                        <th className="py-1.5 px-2.5">Tọa độ</th>
                        <th className="py-1.5 px-2.5">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {parsedCsv.slice(0, 50).map((r) => (
                        <tr key={r.lineNumber} className={r.error ? "bg-red-500/5" : ""}>
                          <td className="py-1.5 px-2.5 font-mono">{r.lineNumber}</td>
                          <td className="py-1.5 px-2.5 font-medium">{r.name || "—"}</td>
                          <td className="py-1.5 px-2.5">{r.district || "—"}</td>
                          <td className="py-1.5 px-2.5 font-mono text-[11px]">
                            {r.lat !== null && r.lng !== null
                              ? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`
                              : "—"}
                          </td>
                          <td className="py-1.5 px-2.5">
                            {r.error ? (
                              <span className="text-red-600 font-medium">{r.error}</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60 shrink-0">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-border hover:bg-muted cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isPending || validCsvRows.length === 0}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Import {validCsvRows.length} chi nhánh hợp lệ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      <ConfirmDialog
        open={deleteTarget !== null}
        variant="danger"
        title="Xóa chi nhánh?"
        description={
          deleteTarget
            ? `Chi nhánh "${deleteTarget.name}" sẽ bị ẩn khỏi danh sách và bản đồ công khai.`
            : ""
        }
        confirmLabel="Xóa"
        loading={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
