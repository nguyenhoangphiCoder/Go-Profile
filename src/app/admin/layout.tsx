import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/features/workspace/context";
import { acceptPendingInvitations } from "@/features/workspace/invitations";

export const instant = false;

/**
 * Mọi trang /admin cần đăng nhập. Quyền theo workspace được kiểm tra ở từng khu vực
 * (requireWorkspace) — người chưa thuộc workspace nào vẫn vào được /admin/no-workspace.
 */
export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Nhận lời mời mới (người đã đăng nhập được mời thêm vào workspace khác) trước khi đọc ngữ cảnh
  await acceptPendingInvitations();
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");
  return <>{children}</>;
}
