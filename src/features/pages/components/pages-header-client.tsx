"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreatePageModal } from "./create-page-modal";

export function PagesHeaderClient() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Quản lý trang hồ sơ</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Tạo, tùy biến giao diện và xuất bản các trang profile đa slug
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo trang mới</span>
        </button>
      </div>

      <CreatePageModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
