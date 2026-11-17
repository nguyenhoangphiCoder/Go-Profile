import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/features/workspace/context";
import { getWorkspacesOverview } from "@/features/workspace/members";
import { SystemManager } from "@/features/workspace/components/system-manager";

export const metadata: Metadata = {
  title: "Quản trị hệ thống | Gờ Cafe Admin",
};

export const instant = false;

export default async function AdminSystemPage() {
  const ctx = await requireWorkspace();
  if (!ctx.isPlatformAdmin) redirect("/admin");
  const workspaces = await getWorkspacesOverview();

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Quản trị hệ thống</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Tạo workspace cho chi nhánh / đối tác, đặt giới hạn và theo dõi mức sử dụng.
        </p>
      </div>
      <SystemManager workspaces={workspaces} />
    </div>
  );
}
