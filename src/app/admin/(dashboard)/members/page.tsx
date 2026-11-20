import type { Metadata } from "next";
import { requireWorkspace } from "@/features/workspace/context";
import { getWorkspaceMembers } from "@/features/workspace/members";
import { MembersManager } from "@/features/workspace/components/members-manager";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Thành viên | Gờ Cafe Admin",
};

export const instant = false;

export default async function AdminMembersPage() {
  const ctx = await requireWorkspace("owner");
  const { members, invitations } = await getWorkspaceMembers(ctx.workspace.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Thành viên"
        description={`Mời người cùng quản lý workspace "${ctx.workspace.name}" và phân quyền truy cập.`}
      />
      <MembersManager members={members} invitations={invitations} currentUserId={ctx.user.userId} />
    </div>
  );
}
