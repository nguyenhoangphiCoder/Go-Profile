import { getLinks } from "@/features/links/queries";
import { LinksTable } from "@/features/links/components/links-table";

export const instant = false;

export default async function AdminLinksPage() {
  const links = await getLinks();

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Danh mục liên kết chung</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Quản lý tập trung các liên kết (Website, Hotline, Email) được tái sử dụng trên toàn bộ các
          trang hồ sơ Gờ Cafe.
        </p>
      </div>

      {/* Table */}
      <LinksTable initialLinks={links} />
    </div>
  );
}
