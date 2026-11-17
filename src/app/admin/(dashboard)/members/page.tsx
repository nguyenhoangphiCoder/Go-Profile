import type { Metadata } from "next";
import { requireWorkspace } from "@/features/workspace/context";
import { getWorkspaceMembers } from "@/features/workspace/members";
import { MembersManager } from "@/features/workspace/components/members-manager";

export const metadata: Metadata = {
  title: "Thành viên | Gờ Cafe Admin",
};

export const instant = false;

export default async function AdminMembersPage() {
  const ctx = await requireWorkspace("owner");
  const { members, invitations } = await getWorkspaceMembers(ctx.workspace.id);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Thành viên</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Mời người cùng quản lý workspace <strong>{ctx.workspace.name}</strong> và phân quyền.
        </p>
      </div>
      <MembersManager members={members} invitations={invitations} currentUserId={ctx.user.userId} />
    </div>
  );
}
