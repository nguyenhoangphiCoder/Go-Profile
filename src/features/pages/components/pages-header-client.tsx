"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export function PagesHeaderClient() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          Quản lý trang hồ sơ
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Tạo, tùy biến giao diện và xuất bản các trang profile đa slug
        </p>
      </div>
      <Link
        href="/admin/pages/new"
        className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs self-start sm:self-auto"
      >
        <Plus className="w-4 h-4" />
        <span>Tạo trang mới</span>
      </Link>
    </div>
  );
}
