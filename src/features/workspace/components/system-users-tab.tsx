"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Loader2,
  Lock,
  Plus,
  Search,
  Shield,
  ShieldOff,
  Unlock,
  UserPlus,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import type { WorkspaceOverview } from "../members";
import { ROLE_LABELS, type WorkspaceRole } from "../types";
import type { PlatformUserItem } from "../users";
import {
  assignUserToWorkspaceAction,
  createPlatformUserAction,
  removeUserFromWorkspaceAction,
  resetPlatformUserPasswordAction,
  togglePlatformUserBanAction,
  toggleSuperAdminAction,
} from "../users-actions";

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

const ROLE_OPTIONS = [
  { value: "owner", label: "Chủ sở hữu (Owner)" },
  { value: "editor", label: "Biên tập viên (Editor)" },
  { value: "viewer", label: "Người xem (Viewer)" },
];

export function SystemUsersTab({
  users,
  workspaces,
  currentUserId,
}: {
  users: PlatformUserItem[];
  workspaces: WorkspaceOverview[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    displayName: "",
    workspaceId: workspaces[0]?.id ?? "",
    role: "owner" as WorkspaceRole,
    isSuperAdmin: false,
  });

  // Per-user inline dialogs/panels
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [assignUserId, setAssignUserId] = useState<string | null>(null);
  const [assignWsId, setAssignWsId] = useState(workspaces[0]?.id ?? "");
  const [assignRole, setAssignRole] = useState<WorkspaceRole>("editor");

  const [confirmState, setConfirmState] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    variant: "default" | "danger";
    onConfirm: () => Promise<{ success: boolean; error?: string; message?: string }>;
  } | null>(null);

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
      const res = await createPlatformUserAction({
        email: createForm.email,
        password: createForm.password,
        displayName: createForm.displayName,
        workspaceId: createForm.workspaceId || undefined,
        role: createForm.role,
        isSuperAdmin: createForm.isSuperAdmin,
      });
      if (res.success) {
        setCreateForm({
          email: "",
          password: "",
          displayName: "",
          workspaceId: workspaces[0]?.id ?? "",
          role: "owner",
          isSuperAdmin: false,
        });
        setShowCreate(false);
      }
      return res;
    });
  };

  const activeWorkspaces = workspaces.filter((w) => !w.archivedAt);
  const workspaceOptions = [
    { value: "", label: "— Chưa gán Workspace —" },
    ...activeWorkspaces.map((w) => ({ value: w.id, label: w.name })),
  ];
  const assignWorkspaceOptions = activeWorkspaces.map((w) => ({ value: w.id, label: w.name }));

  const q = query.trim().toLowerCase();
  const filteredUsers = q
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.displayName ?? "").toLowerCase().includes(q) ||
          u.memberships.some((m) => m.workspaceName.toLowerCase().includes(q))
      )
    : users;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo email, tên hiển thị hoặc workspace..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Tạo tài khoản mới
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium ${
            notice.kind === "ok"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
          }`}
        >
          {notice.text}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={onCreate}
          className="p-4 md:p-5 rounded-2xl border border-border bg-card space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Tạo tài khoản trực tiếp (không cần chờ email xác thực)
            </h3>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold">Email đăng nhập *</span>
              <input
                required
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="nhanvien@congty.com"
                className={inputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold">Mật khẩu ban đầu (≥ 8 ký tự) *</span>
              <input
                required
                type="password"
                minLength={8}
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Nhập mật khẩu..."
                className={inputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold">Tên hiển thị</span>
              <input
                maxLength={80}
                value={createForm.displayName}
                onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
                className={inputClass}
              />
            </label>
            <div className="space-y-1">
              <span className="text-xs font-semibold block">Gán ngay vào Workspace</span>
              <Select
                value={createForm.workspaceId}
                onChange={(v) => setCreateForm({ ...createForm, workspaceId: v })}
                options={workspaceOptions}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold block">Vai trò trong Workspace</span>
              <Select
                value={createForm.role}
                onChange={(v) => setCreateForm({ ...createForm, role: v as WorkspaceRole })}
                options={ROLE_OPTIONS}
                disabled={!createForm.workspaceId}
                className="w-full"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createForm.isSuperAdmin}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, isSuperAdmin: e.target.checked })
                  }
                  className="rounded border-input"
                />
                <span>Cấp quyền SuperAdmin toàn hệ thống</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3.5 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Tạo tài khoản
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Tổng số tài khoản: <strong className="text-foreground">{filteredUsers.length}</strong>
        </p>

        {filteredUsers.map((u) => {
          const isSelf = u.userId === currentUserId;
          return (
            <article
              key={u.userId}
              className={`p-4 rounded-2xl border bg-card space-y-3 ${
                u.isBanned ? "border-red-500/40 bg-red-500/[0.02]" : "border-border"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold truncate">{u.email}</span>
                    {u.displayName && (
                      <span className="text-xs text-muted-foreground">({u.displayName})</span>
                    )}
                    {isSelf && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                        Bạn
                      </span>
                    )}
                    {u.isSuperAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        <Shield className="w-3 h-3" />
                        SuperAdmin
                      </span>
                    )}
                    {u.isBanned && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-700 dark:text-red-400">
                        Đã khóa
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Tạo ngày: {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    {u.lastSignInAt
                      ? ` · Đăng nhập gần nhất: ${new Date(u.lastSignInAt).toLocaleString("vi-VN")}`
                      : " · Chưa đăng nhập lần nào"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setAssignUserId(assignUserId === u.userId ? null : u.userId);
                      setResetUserId(null);
                      if (!assignWsId && activeWorkspaces[0]) setAssignWsId(activeWorkspaces[0].id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Gán Workspace
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      setResetUserId(resetUserId === u.userId ? null : u.userId);
                      setAssignUserId(null);
                      setNewPassword("");
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Đổi mật khẩu
                  </button>

                  {!isSelf && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        setConfirmState({
                          title: u.isSuperAdmin
                            ? `Gỡ quyền SuperAdmin của ${u.email}?`
                            : `Cấp quyền SuperAdmin cho ${u.email}?`,
                          description: u.isSuperAdmin
                            ? "Tài khoản này sẽ chỉ còn truy cập được các Workspace mà họ là thành viên."
                            : "Tài khoản này sẽ có toàn quyền quản trị tất cả Workspace, Người dùng và Cấu hình hệ thống.",
                          confirmLabel: u.isSuperAdmin ? "Gỡ SuperAdmin" : "Cấp SuperAdmin",
                          variant: u.isSuperAdmin ? "danger" : "default",
                          onConfirm: () => toggleSuperAdminAction(u.userId, !u.isSuperAdmin),
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
                    >
                      {u.isSuperAdmin ? (
                        <ShieldOff className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <Shield className="w-3.5 h-3.5" />
                      )}
                      {u.isSuperAdmin ? "Gỡ SuperAdmin" : "Cấp SuperAdmin"}
                    </button>
                  )}

                  {!isSelf && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        setConfirmState({
                          title: u.isBanned
                            ? `Mở khóa tài khoản ${u.email}?`
                            : `Khóa tài khoản ${u.email}?`,
                          description: u.isBanned
                            ? "Người dùng sẽ có thể đăng nhập lại vào hệ thống."
                            : "Người dùng sẽ bị chặn đăng nhập ngay lập tức trên toàn bộ hệ thống.",
                          confirmLabel: u.isBanned ? "Mở khóa" : "Khóa tài khoản",
                          variant: u.isBanned ? "default" : "danger",
                          onConfirm: () => togglePlatformUserBanAction(u.userId, !u.isBanned),
                        })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer disabled:opacity-40 ${
                        u.isBanned
                          ? "border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                          : "border-red-500/30 text-red-600 hover:bg-red-500/10"
                      }`}
                    >
                      {u.isBanned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {u.isBanned ? "Mở khóa" : "Khóa"}
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách Workspace đã gán */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1">Workspace:</span>
                {u.memberships.length === 0 ? (
                  <span className="text-[11px] italic text-muted-foreground">
                    {u.isSuperAdmin ? "Toàn quyền mọi Workspace (SuperAdmin)" : "Chưa thuộc Workspace nào"}
                  </span>
                ) : (
                  u.memberships.map((m) => (
                    <span
                      key={m.workspaceId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/40 text-[11px]"
                    >
                      <span className="font-medium">{m.workspaceName}</span>
                      <span className="text-muted-foreground">· {ROLE_LABELS[m.role]}</span>
                      <button
                        type="button"
                        disabled={isPending}
                        title={`Gỡ khỏi ${m.workspaceName}`}
                        onClick={() =>
                          setConfirmState({
                            title: `Gỡ ${u.email} khỏi "${m.workspaceName}"?`,
                            description:
                              "Tài khoản này sẽ không còn quyền truy cập dữ liệu của workspace trên.",
                            confirmLabel: "Gỡ thành viên",
                            variant: "danger",
                            onConfirm: () => removeUserFromWorkspaceAction(u.userId, m.workspaceId),
                          })
                        }
                        className="p-0.5 rounded-full hover:bg-red-500/15 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Panel gán Workspace */}
              {assignUserId === u.userId && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex flex-wrap items-end gap-2.5">
                  <div className="min-w-[200px] flex-1 space-y-1">
                    <span className="text-[11px] font-semibold block">Chọn Workspace</span>
                    <Select
                      value={assignWsId}
                      onChange={setAssignWsId}
                      options={assignWorkspaceOptions}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                  <div className="min-w-[170px] space-y-1">
                    <span className="text-[11px] font-semibold block">Vai trò</span>
                    <Select
                      value={assignRole}
                      onChange={(v) => setAssignRole(v as WorkspaceRole)}
                      options={ROLE_OPTIONS}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isPending || !assignWsId}
                    onClick={() =>
                      run(async () => {
                        const res = await assignUserToWorkspaceAction({
                          userId: u.userId,
                          workspaceId: assignWsId,
                          role: assignRole,
                        });
                        if (res.success) setAssignUserId(null);
                        return res;
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    Lưu phân quyền
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignUserId(null)}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {/* Panel đổi mật khẩu */}
              {resetUserId === u.userId && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex flex-wrap items-end gap-2.5">
                  <label className="min-w-[240px] flex-1 space-y-1">
                    <span className="text-[11px] font-semibold block">
                      Mật khẩu mới cho {u.email} (≥ 8 ký tự)
                    </span>
                    <input
                      type="password"
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-xs"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={isPending || newPassword.length < 8}
                    onClick={() =>
                      run(async () => {
                        const res = await resetPlatformUserPasswordAction({
                          userId: u.userId,
                          newPassword,
                        });
                        if (res.success) {
                          setResetUserId(null);
                          setNewPassword("");
                        }
                        return res;
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    Cập nhật mật khẩu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetUserId(null);
                      setNewPassword("");
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={confirmState?.confirmLabel}
        variant={confirmState?.variant ?? "default"}
        loading={isPending}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (!confirmState) return;
          const action = confirmState.onConfirm;
          setConfirmState(null);
          run(action);
        }}
      />
    </div>
  );
}
