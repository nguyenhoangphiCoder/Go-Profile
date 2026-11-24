import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPlatformAuditLogs } from "@/features/workspace/audit";
import { requireWorkspace } from "@/features/workspace/context";
import { getPlatformDomainsOverview } from "@/features/workspace/domains";
import { getWorkspacesOverview } from "@/features/workspace/members";
import { getPlatformUsersOverview } from "@/features/workspace/users";
import { SystemManager } from "@/features/workspace/components/system-manager";

export const metadata: Metadata = {
  title: "Trung tâm SuperAdmin | Gờ Cafe Admin",
};

export const instant = false;

export default async function AdminSystemPage() {
  const ctx = await requireWorkspace();
  if (!ctx.isPlatformAdmin) redirect("/admin");

  const [workspaces, users, auditLogs, domainsData] = await Promise.all([
    getWorkspacesOverview(),
    getPlatformUsersOverview(),
    getPlatformAuditLogs(100),
    getPlatformDomainsOverview(),
  ]);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Trung tâm SuperAdmin</h1>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400">
            Đa Tenant
          </span>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Quản lý tập trung toàn bộ Workspace (Tenant), tài khoản người dùng, phân quyền, gói tính
          năng, tên miền riêng và nhật ký hệ thống.
        </p>
      </div>
      <SystemManager
        workspaces={workspaces}
        users={users}
        auditLogs={auditLogs}
        domains={domainsData.domains}
        pages={domainsData.pages}
        currentUserId={ctx.user.userId}
        activeWorkspaceId={ctx.workspace.id}
      />
    </div>
  );
}
