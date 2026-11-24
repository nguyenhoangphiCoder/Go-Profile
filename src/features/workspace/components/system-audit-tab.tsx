"use client";

import { useState } from "react";
import { History, Search } from "lucide-react";
import type { PlatformAuditLogItem } from "../audit";

const ACTION_LABELS: Record<string, { label: string; tone: string }> = {
  "workspace.create": { label: "Tạo Workspace", tone: "bg-emerald-500/10 text-emerald-700" },
  "workspace.rename": { label: "Đổi tên Workspace", tone: "bg-blue-500/10 text-blue-700" },
  "workspace.update_limits": { label: "Cập nhật Gói/Hạn mức", tone: "bg-indigo-500/10 text-indigo-700" },
  "workspace.archive": { label: "Lưu trữ Workspace", tone: "bg-amber-500/10 text-amber-700" },
  "workspace.restore": { label: "Khôi phục Workspace", tone: "bg-emerald-500/10 text-emerald-700" },
  "user.create": { label: "Tạo tài khoản", tone: "bg-emerald-500/10 text-emerald-700" },
  "user.reset_password": { label: "Đặt lại mật khẩu", tone: "bg-amber-500/10 text-amber-700" },
  "user.ban": { label: "Khóa tài khoản", tone: "bg-red-500/10 text-red-700" },
  "user.unban": { label: "Mở khóa tài khoản", tone: "bg-emerald-500/10 text-emerald-700" },
  "user.grant_superadmin": { label: "Cấp SuperAdmin", tone: "bg-purple-500/10 text-purple-700" },
  "user.revoke_superadmin": { label: "Gỡ SuperAdmin", tone: "bg-red-500/10 text-red-700" },
  "user.assign_workspace": { label: "Gán Workspace", tone: "bg-blue-500/10 text-blue-700" },
  "user.remove_workspace": { label: "Gỡ khỏi Workspace", tone: "bg-amber-500/10 text-amber-700" },
  "domain.create": { label: "Thêm tên miền", tone: "bg-emerald-500/10 text-emerald-700" },
  "domain.update": { label: "Cập nhật tên miền", tone: "bg-blue-500/10 text-blue-700" },
  "domain.toggle": { label: "Bật/tắt tên miền", tone: "bg-amber-500/10 text-amber-700" },
  "domain.delete": { label: "Xóa tên miền", tone: "bg-red-500/10 text-red-700" },
};

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function summarizeMetadata(meta: Record<string, unknown>): string {
  const pairs = Object.entries(meta)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
  return pairs.join(" · ");
}

export function SystemAuditTab({ logs }: { logs: PlatformAuditLogItem[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = q
    ? logs.filter((l) => {
        const metaStr = summarizeMetadata(l.metadata).toLowerCase();
        const label = ACTION_LABELS[l.action]?.label.toLowerCase() ?? "";
        return (
          (l.actorEmail ?? "").toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          label.includes(q) ||
          metaStr.includes(q)
        );
      })
    : logs;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo email người thao tác, hành động, chi tiết..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Hiển thị {filtered.length} / {logs.length} bản ghi gần nhất
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border bg-card text-center space-y-2">
          <History className="w-8 h-8 text-muted-foreground/60 mx-auto" />
          <p className="text-sm font-medium">Chưa có nhật ký nào</p>
          <p className="text-xs text-muted-foreground">
            Mọi thao tác tạo Workspace, phân quyền, đổi mật khẩu hoặc khóa tài khoản của SuperAdmin
            sẽ tự động được ghi lại tại đây.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3.5 font-semibold">Thời gian</th>
                  <th className="py-2.5 px-3.5 font-semibold">Người thực hiện</th>
                  <th className="py-2.5 px-3.5 font-semibold">Hành động</th>
                  <th className="py-2.5 px-3.5 font-semibold">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {filtered.map((item) => {
                  const badge = ACTION_LABELS[item.action] ?? {
                    label: item.action,
                    tone: "bg-muted text-foreground",
                  };
                  const detail = summarizeMetadata(item.metadata);
                  return (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                        {formatTime(item.createdAt)}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-medium">
                        {item.actorEmail ?? "(Hệ thống)"}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.tone}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-muted-foreground max-w-md truncate" title={detail}>
                        {detail || item.targetId || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
