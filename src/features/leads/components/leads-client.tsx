"use client";

import { useState, useMemo } from "react";
import {
  Inbox,
  Search,
  Download,
  Phone,
  Mail,
  Trash2,
  Calendar,
  ExternalLink,
  Tag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { LeadItem, LeadStatus } from "../types";
import { updateLeadStatusAction, deleteLeadAction } from "../actions";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { normalizeViSearch } from "@/features/branches/geo-utils";

interface LeadsClientProps {
  initialLeads: LeadItem[];
  canEdit: boolean;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string; badgeClass: string }[] = [
  {
    value: "new",
    label: "Mới",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  {
    value: "contacted",
    label: "Đã liên hệ",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  {
    value: "converted",
    label: "Đã chốt",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  {
    value: "spam",
    label: "Spam",
    badgeClass: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
  },
];

function getStatusLabel(status: LeadStatus) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

function escapeCsvCell(value: string | null | undefined): string {
  let s = (value ?? "").replace(/\r?\n/g, " ");
  // Chống lỗ hổng CSV Formula Injection khi mở bằng Excel / Google Sheets
  if (/^[=+\-@\t\r]/.test(s.trimStart())) {
    s = `'${s}`;
  }
  if (/[",]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function LeadsClient({ initialLeads, canEdit }: LeadsClientProps) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
  };

  const formNames = useMemo(
    () => Array.from(new Set(leads.map((l) => l.formName).filter(Boolean))).sort(),
    [leads]
  );

  const pageOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of leads) {
      if (l.pageId && l.pageName) {
        map.set(l.pageId, l.pageSlug ? `${l.pageName} (/${l.pageSlug})` : l.pageName);
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [leads]);

  const counts = useMemo(() => {
    const c = { all: leads.length, new: 0, contacted: 0, converted: 0, spam: 0 };
    for (const l of leads) {
      c[l.status] += 1;
    }
    return c;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = normalizeViSearch(search);
    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return leads.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (formFilter !== "all" && item.formName !== formFilter) return false;
      if (pageFilter !== "all" && item.pageId !== pageFilter) return false;
      if (fromTs || toTs) {
        const ts = new Date(item.createdAt).getTime();
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
      }
      if (!q) return true;
      const hay = normalizeViSearch(
        `${item.fullName} ${item.phone} ${item.email || ""} ${item.note || ""} ${item.formName} ${item.pageName || ""} ${item.utmSource || ""} ${item.utmCampaign || ""}`
      );
      return hay.includes(q);
    });
  }, [leads, search, statusFilter, formFilter, pageFilter, fromDate, toDate]);

  const handleStatusChange = async (id: string, nextStatus: LeadStatus) => {
    setUpdatingId(id);
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, status: nextStatus } : l)));
    const res = await updateLeadStatusAction(id, nextStatus);
    setUpdatingId(null);
    if (!res.success) {
      setLeads(prev);
      showNotice("error", res.error || "Không thể cập nhật trạng thái");
      return;
    }
    showNotice("success", `Đã chuyển trạng thái sang "${getStatusLabel(nextStatus)}"`);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteLeadAction(deleteTarget.id);
    setDeleting(false);
    if (!res.success) {
      showNotice("error", res.error || "Không thể xóa bản ghi");
      return;
    }
    setLeads((cur) => cur.filter((l) => l.id !== deleteTarget.id));
    setDeleteTarget(null);
    showNotice("success", "Đã xóa bản ghi khách hàng");
  };

  const handleExportCsv = () => {
    if (filteredLeads.length === 0) {
      showNotice("error", "Không có dữ liệu phù hợp để xuất");
      return;
    }
    const headers = [
      "Thời gian",
      "Họ và tên",
      "Số điện thoại",
      "Email",
      "Nhu cầu / Ghi chú",
      "Trạng thái",
      "Tên Form",
      "Trang nguồn",
      "UTM Source",
      "UTM Medium",
      "UTM Campaign",
    ];
    const rows = filteredLeads.map((l) =>
      [
        formatDateTime(l.createdAt),
        l.fullName,
        // Thêm dấu ' trước SĐT nếu cần? Không cần trong CSV chuẩn khi có dấu ngoặc kép, giữ sạch SĐT
        l.phone,
        l.email || "",
        l.note || "",
        getStatusLabel(l.status),
        l.formName,
        l.pageSlug ? `/${l.pageSlug}` : l.pageName || "",
        l.utmSource || "",
        l.utmMedium || "",
        l.utmCampaign || "",
      ]
        .map(escapeCsvCell)
        .join(",")
    );

    // UTF-8 BOM (\uFEFF) để Microsoft Excel mở tiếng Việt có dấu hoàn hảo
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `gocafe-leads-${dateStamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice("success", `Đã xuất ${filteredLeads.length} khách hàng ra file CSV`);
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
            notice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-300"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {notice.text}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[11px] opacity-70 hover:opacity-100 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Inbox className="w-6 h-6 text-amber-600" />
            <span>Khách hàng tiềm năng (Leads)</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý toàn bộ yêu cầu tư vấn nhượng quyền, báo giá sỉ gửi từ các Landing Page.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Xuất CSV / Excel ({filteredLeads.length})</span>
        </button>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "Tất cả", count: counts.all },
          { key: "new", label: "Mới", count: counts.new },
          { key: "contacted", label: "Đã liên hệ", count: counts.contacted },
          { key: "converted", label: "Đã chốt", count: counts.converted },
          { key: "spam", label: "Spam", count: counts.spam },
        ].map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  active ? "bg-background/20 text-background" : "bg-muted text-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl border border-border bg-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, SĐT, email, ghi chú, UTM..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <Select
          value={formFilter}
          onChange={setFormFilter}
          options={[
            { value: "all", label: "Tất cả Form" },
            ...formNames.map((f) => ({ value: f, label: f })),
          ]}
        />

        <Select
          value={pageFilter}
          onChange={setPageFilter}
          options={[{ value: "all", label: "Tất cả Trang nguồn" }, ...pageOptions]}
        />

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="Từ ngày"
            className="w-1/2 px-2 py-2 text-[11px] rounded-xl border border-input bg-background"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="Đến ngày"
            className="w-1/2 px-2 py-2 text-[11px] rounded-xl border border-input bg-background"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-2">
            <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-foreground">Chưa có dữ liệu khách hàng</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Thêm khối <strong>Form đăng ký / Nhận báo giá</strong> vào Landing Page để bắt đầu thu
              thập thông tin khách hàng tự động.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Khách hàng</th>
                  <th className="py-3 px-4 font-semibold">Nhu cầu & Ghi chú</th>
                  <th className="py-3 px-4 font-semibold">Nguồn / Form</th>
                  <th className="py-3 px-4 font-semibold">Thời gian</th>
                  <th className="py-3 px-4 font-semibold w-44">Trạng thái</th>
                  {canEdit && <th className="py-3 px-4 font-semibold text-right w-16">Xóa</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/20 transition-colors align-top">
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="font-bold text-sm text-foreground">{lead.fullName}</div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1 font-mono font-semibold text-foreground hover:text-primary"
                        >
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </a>
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex items-center gap-1 hover:text-primary"
                          >
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {lead.note ? (
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {lead.note}
                        </p>
                      ) : (
                        <span className="text-muted-foreground/60 italic">Không có ghi chú</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted font-semibold text-foreground">
                        <Tag className="w-3 h-3 text-amber-600" />
                        {lead.formName}
                      </div>
                      {lead.pageSlug && (
                        <div>
                          <a
                            href={`/${lead.pageSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <span>/{lead.pageSlug}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {(lead.utmSource || lead.utmMedium || lead.utmCampaign) && (
                        <div className="text-[10px] font-mono text-muted-foreground">
                          UTM:{" "}
                          {[lead.utmSource, lead.utmMedium, lead.utmCampaign]
                            .filter(Boolean)
                            .join(" / ")}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(lead.createdAt)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {canEdit ? (
                        <Select
                          value={lead.status}
                          disabled={updatingId === lead.id}
                          onChange={(val) => handleStatusChange(lead.id, val as LeadStatus)}
                          options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                        />
                      ) : (
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            STATUS_OPTIONS.find((o) => o.value === lead.status)?.badgeClass || ""
                          }`}
                        >
                          {getStatusLabel(lead.status)}
                        </span>
                      )}
                    </td>

                    {canEdit && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(lead)}
                          aria-label={`Xóa ${lead.fullName}`}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa bản ghi khách hàng?"
        description={
          deleteTarget
            ? `Bạn chắc chắn muốn xóa vĩnh viễn yêu cầu của "${deleteTarget.fullName}" (${deleteTarget.phone})?`
            : ""
        }
        confirmLabel="Xóa vĩnh viễn"
        variant="danger"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
