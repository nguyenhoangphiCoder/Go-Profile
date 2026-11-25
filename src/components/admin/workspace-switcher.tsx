"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Plus, ShieldCheck, X } from "lucide-react";
import { switchWorkspaceAction } from "@/features/workspace/actions";
import { createWorkspaceAction } from "@/features/workspace/manage-actions";
import {
  PLAN_LABELS,
  PLAN_PRESETS,
  ROLE_LABELS,
  type WorkspacePlan,
  type WorkspaceRole,
} from "@/features/workspace/types";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";

interface WorkspaceSwitcherProps {
  workspaces: { id: string; name: string; plan?: WorkspacePlan }[];
  currentId: string;
  currentPlan?: WorkspacePlan;
  role: WorkspaceRole;
  isPlatformAdmin: boolean;
  compact?: boolean;
}

const PLAN_BADGE_CLASS: Record<WorkspacePlan, string> = {
  free: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  pro: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  enterprise: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const PLAN_OPTIONS = [
  { value: "free", label: PLAN_LABELS.free },
  { value: "pro", label: PLAN_LABELS.pro },
  { value: "enterprise", label: PLAN_LABELS.enterprise },
];

/** Chọn workspace đang làm việc; hiện vai trò, gói dịch vụ và nút tạo nhanh cho SuperAdmin. */
export function WorkspaceSwitcher({
  workspaces,
  currentId,
  currentPlan = "pro",
  role,
  isPlatformAdmin,
  compact = false,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<WorkspacePlan>("pro");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [autoSwitch, setAutoSwitch] = useState(true);

  const current = workspaces.find((w) => w.id === currentId);
  const activePlan = current?.plan ?? currentPlan;

  const onChange = (id: string) => {
    startTransition(async () => {
      const res = await switchWorkspaceAction(id);
      if (res.success) {
        router.refresh();
      } else {
        toast.error(res.error || "Không thể chuyển workspace");
      }
    });
  };

  const onQuickCreate = (e: FormEvent) => {
    e.preventDefault();
    const preset = PLAN_PRESETS[plan];
    startTransition(async () => {
      const res = await createWorkspaceAction({
        name,
        ownerEmail,
        plan,
        features: preset.features,
        maxPages: preset.maxPages,
        maxMediaMb: preset.maxMediaMb,
        maxBranches: preset.maxBranches,
        maxShells: preset.maxShells,
      });
      if (!res.success) {
        toast.error(res.error || "Không tạo được workspace");
        return;
      }
      toast.success(res.message || `Đã tạo workspace "${name}"`);
      setModalOpen(false);
      setName("");
      setOwnerEmail("");
      setPlan("pro");

      if (autoSwitch && res.workspaceId) {
        await switchWorkspaceAction(res.workspaceId);
      }
      router.refresh();
    });
  };

  return (
    <div className={compact ? "min-w-0" : "space-y-1.5"}>
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </span>
          {isPlatformAdmin && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              title="Tạo Workspace mới nhanh"
            >
              <Plus className="w-3 h-3" />
              Tạo mới
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 min-w-0">
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-muted-foreground" />
        ) : (
          <Building2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        )}
        {workspaces.length > 1 ? (
          <Select
            size="sm"
            value={currentId}
            onChange={onChange}
            disabled={isPending}
            ariaLabel="Chọn workspace"
            options={workspaces.map((w) => ({
              value: w.id,
              label: w.name,
              description: w.plan ? `Gói ${w.plan.toUpperCase()}` : undefined,
            }))}
            className="min-w-0 flex-1"
          />
        ) : (
          <span className="text-xs font-semibold truncate">{current?.name}</span>
        )}
      </div>

      {!compact && (
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground truncate"
            title={isPlatformAdmin ? "SuperAdmin: toàn quyền mọi workspace" : undefined}
          >
            {isPlatformAdmin && <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0" />}
            <span className="truncate">{isPlatformAdmin ? "SuperAdmin" : ROLE_LABELS[role]}</span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide shrink-0 ${PLAN_BADGE_CLASS[activePlan]}`}
          >
            {activePlan}
          </span>
        </div>
      )}

      {/* Modal tạo Workspace nhanh cho SuperAdmin */}
      {modalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-create-ws-title"
            onClick={() => !isPending && setModalOpen(false)}
          >
            <form
              onSubmit={onQuickCreate}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="quick-create-ws-title" className="text-base font-bold">
                    Tạo Workspace mới
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Khởi tạo không gian dữ liệu độc lập cho thương hiệu / đối tác mới.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setModalOpen(false)}
                  aria-label="Đóng"
                  className="p-1.5 -mt-1 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="space-y-1 block">
                  <span className="text-xs font-semibold">Tên Workspace *</span>
                  <input
                    required
                    maxLength={80}
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Trà Sữa Xanh / Chi nhánh Hà Nội"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>

                <div className="space-y-1">
                  <span className="text-xs font-semibold block">Gói tính năng</span>
                  <Select
                    value={plan}
                    onChange={(v) => setPlan(v as WorkspacePlan)}
                    options={PLAN_OPTIONS}
                    className="w-full"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Gói <strong>{plan.toUpperCase()}</strong>: tối đa {PLAN_PRESETS[plan].maxPages}{" "}
                    trang, {PLAN_PRESETS[plan].maxMediaMb} MB ảnh, {PLAN_PRESETS[plan].maxBranches}{" "}
                    chi nhánh, {PLAN_PRESETS[plan].maxShells} bộ giao diện.
                  </p>
                </div>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold">
                    Email Chủ sở hữu (tùy chọn — để trống sẽ gán cho bạn)
                  </span>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="quanly@doitac.com"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSwitch}
                    onChange={(e) => setAutoSwitch(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span>Chuyển ngay sang Workspace mới sau khi tạo</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Tạo Workspace
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </div>
  );
}
