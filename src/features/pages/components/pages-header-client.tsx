"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

export function PagesHeaderClient({ canEdit = true }: { canEdit?: boolean }) {
  return (
    <PageHeader
      title="Quản lý trang"
      description="Tạo, chỉnh sửa nội dung và xuất bản các trang Profile & Landing Page."
      action={
        canEdit ? (
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center justify-center gap-2 h-9 px-4 text-[13px] font-semibold text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo trang mới</span>
          </Link>
        ) : undefined
      }
    />
  );
}
