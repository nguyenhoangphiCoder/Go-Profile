import { Metadata } from "next";
import { requireWorkspace } from "@/features/workspace/context";
import { hasRole } from "@/features/workspace/types";
import { getPagesList } from "@/features/pages/queries";
import { PagesTable } from "@/features/pages/components/pages-table";
import { PagesHeaderClient } from "@/features/pages/components/pages-header-client";

export const metadata: Metadata = {
  title: "Quản lý trang hồ sơ | Gờ Cafe Admin",
  description: "Danh sách trang hồ sơ và liên kết profile của Gờ Cafe",
};

export const instant = false;

export default async function AdminPagesPage() {
  const { role } = await requireWorkspace();
  const pages = await getPagesList();
  const canEdit = hasRole(role, "editor");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PagesHeaderClient canEdit={canEdit} />
      <PagesTable initialPages={pages} canEdit={canEdit} />
    </div>
  );
}
