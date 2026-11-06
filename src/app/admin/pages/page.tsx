import { Metadata } from "next";
import { getPagesList } from "@/features/pages/queries";
import { PagesTable } from "@/features/pages/components/pages-table";
import { PagesHeaderClient } from "@/features/pages/components/pages-header-client";

export const metadata: Metadata = {
  title: "Quản lý trang hồ sơ | Gờ Cafe Admin",
  description: "Danh sách trang hồ sơ và liên kết profile của Gờ Cafe",
};

export const instant = false;

export default async function AdminPagesPage() {
  const pages = await getPagesList();

  return (
    <div className="space-y-6">
      <PagesHeaderClient />
      <PagesTable initialPages={pages} />
    </div>
  );
}
