"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  History,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { switchWorkspaceAction } from "../actions";
import type { PlatformAuditLogItem } from "../audit";
import {
  createWorkspaceAction,
  renameWorkspaceAction,
  setWorkspaceArchivedAction,
  updateWorkspaceLimitsAction,
} from "../manage-actions";
import type { WorkspaceOverview } from "../members";
import {
  GO_CAFE_WORKSPACE_ID,
  PLAN_LABELS,
  PLAN_PRESETS,
  normalizeWorkspaceFeatures,
  type WorkspaceFeatures,
  type WorkspacePlan,
} from "../types";
import type { WorkspaceDomainItem, WorkspacePageOption } from "../domains";
import type { PlatformUserItem } from "../users";
import { SystemAuditTab } from "./system-audit-tab";
import { SystemDomainsTab } from "./system-domains-tab";
import { SystemUsersTab } from "./system-users-tab";

const MB = 1024 * 1024;
const fmtMb = (bytes: number) => `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`;

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

const PLAN_OPTIONS = [
  { value: "free", label: PLAN_LABELS.free },
  { value: "pro", label: PLAN_LABELS.pro },
  { value: "enterprise", label: PLAN_LABELS.enterprise },
];

const PLAN_BADGE_CLASS: Record<WorkspacePlan, string> = {
  free: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  pro: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  enterprise: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const FEATURE_ITEMS: { key: keyof WorkspaceFeatures; label: string }[] = [
  { key: "landing", label: "Landing Page & Menu" },
  { key: "branches", label: "Hệ thống Chi nhánh" },
  { key: "leads", label: "Khách hàng (Leads)" },
  { key: "tracking", label: "Marketing Pixels" },
  { key: "customDomains", label: "Tên miền riêng" },
];

function UsageBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden" aria-hidden="true">
      <div
        className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function WorkspacePlanAndLimitsEditor({
  ws,
  disabled,
  onSave,
}: {
  ws: WorkspaceOverview;
  disabled: boolean;
  onSave: (payload: {
    plan: WorkspacePlan;
    features: WorkspaceFeatures;
    maxPages: number;
    maxMediaMb: number;
    maxBranches: number;
    maxShells: number;
  }) => void;
}) {
  const [plan, setPlan] = useState<WorkspacePlan>(ws.plan ?? "pro");
  const [features, setFeatures] = useState<WorkspaceFeatures>(() =>
    normalizeWorkspaceFeatures(ws.features)
  );
  const [pages, setPages] = useState(String(ws.maxPages ?? 20));
  const [mediaMb, setMediaMb] = useState(String(Math.round((ws.maxMediaBytes ?? 200 * MB) / MB)));
  const [branches, setBranches] = useState(String(ws.maxBranches ?? 100));
  const [shells, setShells] = useState(String(ws.maxShells ?? 10));

  const applyPlanPreset = (nextPlan: WorkspacePlan) => {
    setPlan(nextPlan);
    const preset = PLAN_PRESETS[nextPlan];
    setFeatures({ ...preset.features });
    setPages(String(preset.maxPages));
    setMediaMb(String(preset.maxMediaMb));
    setBranches(String(preset.maxBranches));
    setShells(String(preset.maxShells));
  };

  const toggleFeature = (key: keyof WorkspaceFeatures) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="pt-3 border-t border-border/70 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground block">Gói dịch vụ</span>
          <Select
            value={plan}
            onChange={(v) => applyPlanPreset(v as WorkspacePlan)}
            options={PLAN_OPTIONS}
            size="sm"
            className="w-full"
          />
        </div>
        <label className="space-y-1">
          <span className="text-[11px] text-muted-foreground block">Tối đa trang</span>
          <input
            type="number"
            min={1}
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] text-muted-foreground block">Dung lượng ảnh (MB)</span>
          <input
            type="number"
            min={10}
            value={mediaMb}
            onChange={(e) => setMediaMb(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] text-muted-foreground block">Tối đa chi nhánh</span>
          <input
            type="number"
            min={0}
            value={branches}
            onChange={(e) => setBranches(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] text-muted-foreground block">Tối đa bộ giao diện</span>
          <input
            type="number"
            min={1}
            value={shells}
            onChange={(e) => setShells(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {FEATURE_ITEMS.map((item) => (
            <label
              key={item.key}
              className="inline-flex items-center gap-1.5 text-xs cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={features[item.key]}
                onChange={() => toggleFeature(item.key)}
                className="rounded border-input"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onSave({
              plan,
              features,
              maxPages: Number(pages),
              maxMediaMb: Number(mediaMb),
              maxBranches: Number(branches),
              maxShells: Number(shells),
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 cursor-pointer disabled:opacity-40"
        >
          <Save className="w-3.5 h-3.5" />
          Lưu gói &amp; giới hạn
        </button>
      </div>
    </div>
  );
}

export function SystemManager({
  workspaces = [],
  users = [],
  auditLogs = [],
  domains = [],
  pages = [],
  currentUserId,
  activeWorkspaceId,
}: {
  workspaces: WorkspaceOverview[];
  users: PlatformUserItem[];
  auditLogs: PlatformAuditLogItem[];
  domains?: WorkspaceDomainItem[];
  pages?: WorkspacePageOption[];
  currentUserId: string;
  activeWorkspaceId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (() => {
    const t = searchParams.get("tab");
    return t === "users" || t === "domains" || t === "audit" ? t : "workspaces";
  })();
  const [activeTab, setActiveTabState] = useState<"workspaces" | "users" | "domains" | "audit">(
    initialTab
  );
  const setActiveTab = (tab: "workspaces" | "users" | "domains" | "audit") => {
    setActiveTabState(tab);
    setNotice(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [wsQuery, setWsQuery] = useState("");
  const [expandedWsId, setExpandedWsId] = useState<string | null>(null);
  const [renamingWsId, setRenamingWsId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [archiveTarget, setArchiveTarget] = useState<WorkspaceOverview | null>(null);

  const [form, setForm] = useState({
    name: "",
    ownerEmail: "",
    plan: "pro" as WorkspacePlan,
    maxPages: String(PLAN_PRESETS.pro.maxPages),
    maxMediaMb: String(PLAN_PRESETS.pro.maxMediaMb),
    maxBranches: String(PLAN_PRESETS.pro.maxBranches),
    maxShells: String(PLAN_PRESETS.pro.maxShells),
  });

  const run = (fn: () => Promise<{ success: boolean; error?: string; message?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setNotice(
        res.success
          ? { kind: "ok", text: res.message ?? "Đã cập nhật." }
          : { kind: "error", text: res.error ?? "Có lỗi xảy ra." }
      );
      if (res.success) router.refresh();
    });

  const onSelectCreatePlan = (nextPlan: WorkspacePlan) => {
    const preset = PLAN_PRESETS[nextPlan];
    setForm((prev) => ({
      ...prev,
      plan: nextPlan,
      maxPages: String(preset.maxPages),
      maxMediaMb: String(preset.maxMediaMb),
      maxBranches: String(preset.maxBranches),
      maxShells: String(preset.maxShells),
    }));
  };

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await createWorkspaceAction({
        name: form.name,
        ownerEmail: form.ownerEmail,
        plan: form.plan,
        features: PLAN_PRESETS[form.plan].features,
        maxPages: Number(form.maxPages),
        maxMediaMb: Number(form.maxMediaMb),
        maxBranches: Number(form.maxBranches),
        maxShells: Number(form.maxShells),
      });
      if (res.success) {
        setForm({
          name: "",
          ownerEmail: "",
          plan: "pro",
          maxPages: String(PLAN_PRESETS.pro.maxPages),
          maxMediaMb: String(PLAN_PRESETS.pro.maxMediaMb),
          maxBranches: String(PLAN_PRESETS.pro.maxBranches),
          maxShells: String(PLAN_PRESETS.pro.maxShells),
        });
      }
      return res;
    });
  };

  const onEnterWorkspace = (workspaceId: string) => {
    startTransition(async () => {
      const res = await switchWorkspaceAction(workspaceId);
      if (res.success) {
        router.push("/admin/pages");
        router.refresh();
      } else {
        setNotice({ kind: "error", text: res.error ?? "Không chuyển được workspace." });
      }
    });
  };

  const totalPages = workspaces.reduce((sum, w) => sum + (Number(w.pageCount) || 0), 0);
  const totalLeads = workspaces.reduce((sum, w) => sum + (Number(w.leadCount) || 0), 0);
  const activeWsCount = workspaces.filter((w) => !w.archivedAt).length;

  const q = wsQuery.trim().toLowerCase();
  const filteredWorkspaces = q
    ? workspaces.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.ownerEmails.some((e) => e.toLowerCase().includes(q)) ||
          w.plan.toLowerCase().includes(q)
      )
    : workspaces;

  return (
    <div className="space-y-6">
      {/* Thống kê tổng quan toàn nền tảng */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Workspace hoạt động</span>
            <Building2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold mt-1.5">
            {activeWsCount}
            <span className="text-xs font-normal text-muted-foreground ml-1">
              / {workspaces.length}
            </span>
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tổng tài khoản</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold mt-1.5">{users.length}</p>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tổng số trang</span>
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold mt-1.5">{totalPages}</p>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tổng khách hàng (Leads)</span>
            <History className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold mt-1.5">{totalLeads}</p>
        </div>
      </div>

      {/* Thanh chuyển 3 Tab */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("workspaces")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "workspaces"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Workspaces ({workspaces.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "users"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          Người dùng ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("domains")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "domains"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="w-4 h-4" />
          Tên miền ({domains.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === "audit"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-4 h-4" />
          Nhật ký hệ thống ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: WORKSPACES */}
      {activeTab === "workspaces" && (
        <div className="space-y-6">
          <form
            onSubmit={onCreate}
            className="p-4 md:p-5 rounded-2xl border border-border bg-card space-y-4"
          >
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Tạo Workspace (Tenant) mới
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold">Tên Workspace *</span>
                <input
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Trà Sữa Xanh / Đối tác Nhượng quyền A"
                  className={inputClass}
                />
              </label>

              <div className="space-y-1">
                <span className="text-xs font-semibold block">Gói dịch vụ</span>
                <Select
                  value={form.plan}
                  onChange={(v) => onSelectCreatePlan(v as WorkspacePlan)}
                  options={PLAN_OPTIONS}
                  className="w-full"
                />
              </div>

              <label className="space-y-1">
                <span className="text-xs font-semibold">
                  Email Chủ sở hữu (để trống = bạn làm Owner)
                </span>
                <input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  placeholder="quanly@doitac.com"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold">Tối đa trang</span>
                <input
                  type="number"
                  min={1}
                  value={form.maxPages}
                  onChange={(e) => setForm({ ...form, maxPages: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Dung lượng ảnh (MB)</span>
                <input
                  type="number"
                  min={10}
                  value={form.maxMediaMb}
                  onChange={(e) => setForm({ ...form, maxMediaMb: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Tối đa chi nhánh</span>
                <input
                  type="number"
                  min={0}
                  value={form.maxBranches}
                  onChange={(e) => setForm({ ...form, maxBranches: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Tối đa bộ giao diện</span>
                <input
                  type="number"
                  min={1}
                  value={form.maxShells}
                  onChange={(e) => setForm({ ...form, maxShells: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">
                Hệ thống tự động khởi tạo sẵn 1 bộ Menu/Header/Footer mặc định và gán Owner ngay nếu
                email đã có tài khoản.
              </p>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Tạo Workspace
              </button>
            </div>

            {notice && (
              <p
                className={`text-xs font-medium ${notice.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}
                role="status"
              >
                {notice.text}
              </p>
            )}
          </form>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold">
                Danh sách Workspace ({filteredWorkspaces.length})
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={wsQuery}
                  onChange={(e) => setWsQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc email owner..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {filteredWorkspaces.map((ws) => {
              const isExpanded = expandedWsId === ws.id;
              const isRenaming = renamingWsId === ws.id;
              const isCurrent = ws.id === activeWorkspaceId;

              return (
                <article
                  key={ws.id}
                  className={`p-4 rounded-2xl border bg-card space-y-3 ${
                    ws.archivedAt
                      ? "border-dashed opacity-70"
                      : isCurrent
                        ? "border-primary/40"
                        : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      {isRenaming ? (
                        <div className="flex items-center gap-2 max-w-md">
                          <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            maxLength={80}
                            className="flex-1 px-2.5 py-1 rounded-lg border border-input bg-background text-sm font-semibold"
                            autoFocus
                          />
                          <button
                            type="button"
                            disabled={isPending || !renameValue.trim()}
                            onClick={() =>
                              run(async () => {
                                const res = await renameWorkspaceAction(ws.id, renameValue);
                                if (res.success) setRenamingWsId(null);
                                return res;
                              })
                            }
                            className="p-1.5 rounded-lg bg-primary text-primary-foreground cursor-pointer disabled:opacity-40"
                            title="Lưu tên mới"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingWsId(null)}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted cursor-pointer"
                            title="Hủy"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {ws.name}
                          </h3>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${PLAN_BADGE_CLASS[ws.plan] ?? PLAN_BADGE_CLASS.pro}`}
                          >
                            {ws.plan ?? "pro"}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                              Đang mở
                            </span>
                          )}
                          {ws.archivedAt && (
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              Đã lưu trữ
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-[11px] text-muted-foreground truncate">
                        Chủ sở hữu: {ws.ownerEmails.length ? ws.ownerEmails.join(", ") : "chưa có"}
                        {ws.pendingInvitations > 0 && ` · ${ws.pendingInvitations} lời mời chờ`}
                        {` · ${ws.memberCount ?? 0} thành viên · ${ws.leadCount ?? 0} khách hàng (leads)`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {!ws.archivedAt && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => onEnterWorkspace(ws.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 cursor-pointer disabled:opacity-40"
                        >
                          Truy cập
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setRenamingWsId(ws.id);
                          setRenameValue(ws.name);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Đổi tên
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedWsId(isExpanded ? null : ws.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        Gói &amp; Giới hạn
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {ws.id !== GO_CAFE_WORKSPACE_ID && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            if (ws.archivedAt) {
                              run(() => setWorkspaceArchivedAction(ws.id, false));
                            } else {
                              setArchiveTarget(ws);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
                        >
                          {ws.archivedAt ? (
                            <ArchiveRestore className="w-3.5 h-3.5" />
                          ) : (
                            <Archive className="w-3.5 h-3.5" />
                          )}
                          {ws.archivedAt ? "Khôi phục" : "Lưu trữ"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Thanh đo mức sử dụng */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Trang</span>
                        <span className="font-mono">
                          {ws.pageCount ?? 0} / {ws.maxPages ?? 0}
                        </span>
                      </div>
                      <UsageBar used={ws.pageCount ?? 0} max={ws.maxPages ?? 1} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Dung lượng ảnh</span>
                        <span className="font-mono">
                          {fmtMb(ws.mediaBytes ?? 0)} / {fmtMb(ws.maxMediaBytes ?? 0)}
                        </span>
                      </div>
                      <UsageBar used={ws.mediaBytes ?? 0} max={ws.maxMediaBytes ?? 1} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Chi nhánh</span>
                        <span className="font-mono">
                          {ws.branchCount ?? 0} / {ws.maxBranches ?? 0}
                        </span>
                      </div>
                      <UsageBar used={ws.branchCount ?? 0} max={Math.max(1, ws.maxBranches ?? 0)} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Bộ giao diện</span>
                        <span className="font-mono">
                          {ws.shellCount ?? 0} / {ws.maxShells ?? 1}
                        </span>
                      </div>
                      <UsageBar used={ws.shellCount ?? 0} max={ws.maxShells ?? 1} />
                    </div>
                  </div>

                  {/* Panel chỉnh Gói, Feature Flags & Quota */}
                  {isExpanded && (
                    <WorkspacePlanAndLimitsEditor
                      key={`${ws.id}-${ws.plan}-${ws.maxPages}-${ws.maxMediaBytes}-${ws.maxBranches}-${ws.maxShells}`}
                      ws={ws}
                      disabled={isPending}
                      onSave={(payload) => run(() => updateWorkspaceLimitsAction(ws.id, payload))}
                    />
                  )}
                </article>
              );
            })}
          </section>
        </div>
      )}

      {/* TAB 2: NGƯỜI DÙNG */}
      {activeTab === "users" && (
        <SystemUsersTab users={users} workspaces={workspaces} currentUserId={currentUserId} />
      )}

      {/* TAB 3: TÊN MIỀN RIÊNG (CUSTOM DOMAINS) */}
      {activeTab === "domains" && (
        <SystemDomainsTab domains={domains} workspaces={workspaces} pages={pages} />
      )}

      {/* TAB 4: NHẬT KÝ HỆ THỐNG */}
      {activeTab === "audit" && <SystemAuditTab logs={auditLogs} />}

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title={`Lưu trữ workspace "${archiveTarget?.name ?? ""}"?`}
        description="Thành viên của workspace này sẽ tạm thời không thể truy cập khu vực quản trị cho đến khi được khôi phục."
        confirmLabel="Lưu trữ workspace"
        variant="danger"
        loading={isPending}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (!archiveTarget) return;
          const targetId = archiveTarget.id;
          setArchiveTarget(null);
          run(() => setWorkspaceArchivedAction(targetId, true));
        }}
      />
    </div>
  );
}
