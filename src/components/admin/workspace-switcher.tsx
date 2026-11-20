"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, ShieldCheck } from "lucide-react";
import { switchWorkspaceAction } from "@/features/workspace/actions";
import { ROLE_LABELS, type WorkspaceRole } from "@/features/workspace/types";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";

interface WorkspaceSwitcherProps {
  workspaces: { id: string; name: string }[];
  currentId: string;
  role: WorkspaceRole;
  isPlatformAdmin: boolean;
  compact?: boolean;
}

/** Chọn workspace đang làm việc; hiện vai trò hiệu lực trong workspace đó. */
export function WorkspaceSwitcher({
  workspaces,
  currentId,
  role,
  isPlatformAdmin,
  compact = false,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const current = workspaces.find((w) => w.id === currentId);

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

  const roleBadge = (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
      title={isPlatformAdmin ? "Quản trị hệ thống: toàn quyền mọi workspace" : undefined}
    >
      {isPlatformAdmin && <ShieldCheck className="w-3 h-3 text-foreground" />}
      {isPlatformAdmin ? "Quản trị hệ thống" : ROLE_LABELS[role]}
    </span>
  );

  return (
    <div className={compact ? "min-w-0" : "space-y-1"}>
      {!compact && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
          Workspace
        </span>
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
            options={workspaces.map((w) => ({ value: w.id, label: w.name }))}
            className="min-w-0 flex-1"
          />
        ) : (
          <span className="text-xs font-semibold truncate">{current?.name}</span>
        )}
      </div>
      {!compact && roleBadge}
    </div>
  );
}
