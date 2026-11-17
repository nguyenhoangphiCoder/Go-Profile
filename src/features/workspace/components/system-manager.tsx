"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Building2, Loader2, Plus, Save } from "lucide-react";
import {
  createWorkspaceAction,
  setWorkspaceArchivedAction,
  updateWorkspaceLimitsAction,
} from "../manage-actions";
import type { WorkspaceOverview } from "../members";
import { GO_CAFE_WORKSPACE_ID } from "../types";

const MB = 1024 * 1024;
const fmtMb = (bytes: number) => `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`;

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function UsageBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden" aria-hidden="true">
      <div
        className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function LimitsEditor({
  ws,
  disabled,
  onSave,
}: {
  ws: WorkspaceOverview;
  disabled: boolean;
  onSave: (maxPages: number, maxMediaMb: number) => void;
}) {
  const [pages, setPages] = useState(String(ws.maxPages));
  const [mediaMb, setMediaMb] = useState(String(Math.round(ws.maxMediaBytes / MB)));
  const changed =
    pages !== String(ws.maxPages) || mediaMb !== String(Math.round(ws.maxMediaBytes / MB));
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="space-y-0.5">
        <span className="text-[10px] text-muted-foreground block">Tối đa trang</span>
        <input
          type="number"
          min={1}
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          className="w-24 px-2 py-1 rounded-lg border border-input bg-background text-xs"
        />
      </label>
      <label className="space-y-0.5">
        <span className="text-[10px] text-muted-foreground block">Dung lượng ảnh (MB)</span>
        <input
          type="number"
          min={10}
          value={mediaMb}
          onChange={(e) => setMediaMb(e.target.value)}
          className="w-28 px-2 py-1 rounded-lg border border-input bg-background text-xs"
        />
      </label>
      <button
        type="button"
        disabled={disabled || !changed}
        onClick={() => onSave(Number(pages), Number(mediaMb))}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
      >
        <Save className="w-3.5 h-3.5" />
        Lưu giới hạn
      </button>
    </div>
  );
}

export function SystemManager({ workspaces }: { workspaces: WorkspaceOverview[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", ownerEmail: "", maxPages: "20", maxMediaMb: "200" });

  const run = (fn: () => Promise<{ success: boolean; error?: string; message?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setNotice(
        res.success
          ? { kind: "ok", text: res.message ?? "Đã cập nhật." }
          : { kind: "error", text: res.error ?? "Có lỗi xảy ra." }
      );
      if (res.success) router.refresh();
    });

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await createWorkspaceAction(form);
      if (res.success) setForm({ name: "", ownerEmail: "", maxPages: "20", maxMediaMb: "200" });
      return res;
    });
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={onCreate}
        className="p-4 md:p-5 rounded-2xl border border-border bg-card space-y-3"
      >
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Tạo workspace mới
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold">Tên workspace</span>
            <input
              required
              maxLength={80}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Gờ Cafe Chi nhánh Quận 7"
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold">Email chủ sở hữu (sẽ nhận lời mời)</span>
            <input
              required
              type="email"
              value={form.ownerEmail}
              onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
              placeholder="quanly@vidu.com"
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold">Tối đa số trang</span>
            <input
              type="number"
              min={1}
              value={form.maxPages}
              onChange={(e) => setForm({ ...form, maxPages: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold">Dung lượng ảnh tối đa (MB)</span>
            <input
              type="number"
              min={10}
              value={form.maxMediaMb}
              onChange={(e) => setForm({ ...form, maxMediaMb: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Tạo &amp; mời chủ sở hữu
        </button>
        {notice && (
          <p
            className={`text-xs ${notice.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}
            role="status"
          >
            {notice.text}
          </p>
        )}
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-bold">Workspace ({workspaces.length})</h2>
        {workspaces.map((ws) => (
          <article
            key={ws.id}
            className={`p-4 rounded-2xl border bg-card space-y-3 ${ws.archivedAt ? "border-dashed opacity-70" : "border-border"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {ws.name}
                  {ws.archivedAt && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 rounded">
                      Đã lưu trữ
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  Chủ sở hữu: {ws.ownerEmails.length ? ws.ownerEmails.join(", ") : "chưa có"}
                  {ws.pendingInvitations > 0 && ` · ${ws.pendingInvitations} lời mời đang chờ`}
                  {` · ${ws.memberCount} thành viên`}
                </p>
              </div>
              {ws.id !== GO_CAFE_WORKSPACE_ID && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    const archive = !ws.archivedAt;
                    if (
                      !archive ||
                      window.confirm(
                        `Lưu trữ "${ws.name}"? Thành viên sẽ không vào được workspace này nữa.`
                      )
                    ) {
                      run(() => setWorkspaceArchivedAction(ws.id, archive));
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
                >
                  {ws.archivedAt ? (
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                  {ws.archivedAt ? "Khôi phục" : "Lưu trữ"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Trang</span>
                  <span className="font-mono">
                    {ws.pageCount} / {ws.maxPages}
                  </span>
                </div>
                <UsageBar used={ws.pageCount} max={ws.maxPages} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Ảnh</span>
                  <span className="font-mono">
                    {fmtMb(ws.mediaBytes)} / {fmtMb(ws.maxMediaBytes)}
                  </span>
                </div>
                <UsageBar used={ws.mediaBytes} max={ws.maxMediaBytes} />
              </div>
            </div>

            <LimitsEditor
              key={`${ws.maxPages}-${ws.maxMediaBytes}`}
              ws={ws}
              disabled={isPending}
              onSave={(maxPages, maxMediaMb) =>
                run(() => updateWorkspaceLimitsAction(ws.id, { maxPages, maxMediaMb }))
              }
            />
          </article>
        ))}
      </section>
    </div>
  );
}
