"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, ShieldCheck } from "lucide-react";
import { switchWorkspaceAction } from "@/features/workspace/actions";
import { ROLE_LABELS, type WorkspaceRole } from "@/features/workspace/types";

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
  const [isPending, startTransition] = useTransition();
  const current = workspaces.find((w) => w.id === currentId);

  const onChange = (id: string) => {
    startTransition(async () => {
      const res = await switchWorkspaceAction(id);
      if (res.success) router.refresh();
      else alert(res.error);
    });
  };

  const roleBadge = (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400"
      title={isPlatformAdmin ? "Quản trị hệ thống: toàn quyền mọi workspace" : undefined}
    >
      {isPlatformAdmin && <ShieldCheck className="w-3 h-3" />}
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
          <select
            value={currentId}
            onChange={(e) => onChange(e.target.value)}
            disabled={isPending}
            aria-label="Chọn workspace"
            className="min-w-0 flex-1 truncate text-xs font-semibold bg-transparent border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs font-semibold truncate">{current?.name}</span>
        )}
      </div>
      {!compact && roleBadge}
    </div>
  );
}
