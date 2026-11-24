"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Info,
  Loader2,
  PauseCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import type { WorkspaceDomainItem, WorkspacePageOption } from "../domains";
import {
  deleteWorkspaceDomainAction,
  toggleWorkspaceDomainAction,
  upsertWorkspaceDomainAction,
} from "../domains-actions";
import type { WorkspaceOverview } from "../members";

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function SystemDomainsTab({
  domains,
  workspaces,
  pages,
}: {
  domains: WorkspaceDomainItem[];
  workspaces: WorkspaceOverview[];
  pages: WorkspacePageOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceDomainItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHomePageId, setEditHomePageId] = useState<string>("");

  const activeWorkspaces = workspaces.filter((w) => !w.archivedAt);
  const [form, setForm] = useState({
    domain: "",
    workspaceId: activeWorkspaces[0]?.id ?? "",
    homePageId: "",
  });

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

  const wsPages = pages.filter((p) => p.workspaceId === form.workspaceId);
  const workspaceOptions = activeWorkspaces.map((w) => ({ value: w.id, label: w.name }));
  const pageOptions = [
    { value: "", label: "— Tự dùng Trang chủ mặc định của Workspace —" },
    ...wsPages.map((p) => ({
      value: p.id,
      label: `${p.name}${p.slug ? ` (/${p.slug})` : ""}`,
      description: p.status === "published" ? "Đang xuất bản" : "Bản nháp",
    })),
  ];

  const onCreate = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await upsertWorkspaceDomainAction({
        domain: form.domain,
        workspaceId: form.workspaceId,
        homePageId: form.homePageId || null,
        isActive: true,
      });
      if (res.success) {
        setForm((prev) => ({ ...prev, domain: "", homePageId: "" }));
      }
      return res;
    });
  };

  return (
    <div className="space-y-5">
      {/* Form thêm tên miền mới */}
      <form
        onSubmit={onCreate}
        className="p-4 md:p-5 rounded-2xl border border-border bg-card space-y-4"
      >
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Gắn tên miền riêng (Custom Domain) cho Workspace
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold">Tên miền *</span>
            <input
              required
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              placeholder="VD: go-cafe.com hoặc shop.doitac.vn"
              className={inputClass}
            />
          </label>

          <div className="space-y-1">
            <span className="text-xs font-semibold block">Thuộc Workspace *</span>
            <Select
              value={form.workspaceId}
              onChange={(v) => setForm({ ...form, workspaceId: v, homePageId: "" })}
              options={workspaceOptions}
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold block">Trang chủ khi mở tên miền (/)</span>
            <Select
              value={form.homePageId}
              onChange={(v) => setForm({ ...form, homePageId: v })}
              options={pageOptions}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            Hệ thống tự chuẩn hóa chữ thường và hỗ trợ cả <code>www.</code> lẫn tên miền gốc.
          </p>
          <button
            type="submit"
            disabled={isPending || !form.workspaceId || !form.domain.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Thêm tên miền
          </button>
        </div>

        {notice && (
          <p
            className={`text-xs font-medium ${notice.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}
            role="status"
          >
            {notice.text}
          </p>
        )}
      </form>

      {/* Hướng dẫn cấu hình DNS */}
      <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] space-y-2 text-xs">
        <p className="font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
          <Info className="w-4 h-4 shrink-0" />
          Hướng dẫn trỏ DNS về hệ thống (Vercel)
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>
            <strong>Tên miền gốc</strong> (VD: <code>doitac.vn</code>): tạo bản ghi{" "}
            <code>A</code> trỏ về <code>76.76.21.21</code>.
          </li>
          <li>
            <strong>Tên miền phụ</strong> (VD: <code>www.doitac.vn</code> hoặc{" "}
            <code>menu.doitac.vn</code>): tạo bản ghi <code>CNAME</code> trỏ về{" "}
            <code>cname.vercel-dns.com</code>.
          </li>
          <li>
            Sau đó vào <strong>Vercel → Project Settings → Domains</strong> thêm tên miền tương ứng
            để tự động cấp chứng chỉ SSL (HTTPS).
          </li>
        </ul>
      </div>

      {/* Danh sách tên miền */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold">Tên miền đã gắn ({domains.length})</h3>

        {domains.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border bg-card text-center space-y-2">
            <Globe className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-sm font-medium">Chưa có tên miền riêng nào</p>
            <p className="text-xs text-muted-foreground">
              Thêm tên miền cho từng Workspace để khách truy cập vào <code>https://tenmien.vn/</code>{" "}
              tự động mở đúng trang chủ của thương hiệu đó.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {domains.map((item) => (
              <article
                key={item.id}
                className={`p-4 rounded-2xl border bg-card flex flex-wrap items-center justify-between gap-3 ${
                  item.isActive ? "border-border" : "border-dashed opacity-70"
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a
                      href={`https://${item.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold hover:underline inline-flex items-center gap-1"
                    >
                      {item.domain}
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-zinc-500/15 text-zinc-600"
                      }`}
                    >
                      {item.isActive ? "Đang hoạt động" : "Đang tạm tắt"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Workspace: <strong className="text-foreground">{item.workspaceName}</strong>
                    {" · "}
                    Trang chủ:{" "}
                    {item.homePageName ? (
                      <span className="text-foreground font-medium">
                        {item.homePageName}
                        {item.homePageSlug && (
                          <span className="font-mono text-[11px] text-muted-foreground ml-1">
                            (/{item.homePageSlug})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span>Mặc định của Workspace</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {editingId === item.id ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Select
                        size="sm"
                        value={editHomePageId}
                        onChange={setEditHomePageId}
                        options={[
                          { value: "", label: "— Mặc định của Workspace —" },
                          ...pages
                            .filter((p) => p.workspaceId === item.workspaceId)
                            .map((p) => ({
                              value: p.id,
                              label: `${p.name}${p.slug ? ` (/${p.slug})` : ""}`,
                            })),
                        ]}
                        className="w-56"
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          run(async () => {
                            const res = await upsertWorkspaceDomainAction({
                              id: item.id,
                              workspaceId: item.workspaceId,
                              domain: item.domain,
                              homePageId: editHomePageId || null,
                              isActive: item.isActive,
                            });
                            if (res.success) setEditingId(null);
                            return res;
                          })
                        }
                        className="p-1.5 rounded-lg bg-primary text-primary-foreground cursor-pointer disabled:opacity-40"
                        title="Lưu trang chủ"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted cursor-pointer"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setEditingId(item.id);
                          setEditHomePageId(item.homePageId ?? "");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Đổi trang chủ
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          run(() => toggleWorkspaceDomainAction(item.id, !item.isActive))
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
                      >
                        {item.isActive ? (
                          <>
                            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                            Tạm tắt
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Kích hoạt
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-600 text-xs hover:bg-red-500/10 cursor-pointer disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Xóa tên miền "${deleteTarget?.domain ?? ""}"?`}
        description="Tên miền này sẽ không còn tự động trỏ về trang chủ của workspace nữa."
        confirmLabel="Xóa tên miền"
        variant="danger"
        loading={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          const id = deleteTarget.id;
          setDeleteTarget(null);
          run(() => deleteWorkspaceDomainAction(id));
        }}
      />
    </div>
  );
}
