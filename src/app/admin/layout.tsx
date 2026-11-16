import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/features/workspace/context";

export const instant = false;

/**
 * Mọi trang /admin cần đăng nhập. Quyền theo workspace được kiểm tra ở từng khu vực
 * (requireWorkspace) — người chưa thuộc workspace nào vẫn vào được /admin/no-workspace.
 */
export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect("/login");
  return <>{children}</>;
}
