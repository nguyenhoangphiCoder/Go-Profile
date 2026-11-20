"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailPlus, RotateCw, Trash2, UserMinus } from "lucide-react";
import { Select } from "@/components/ui/select";
import {
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
  updateMemberRoleAction,
} from "../manage-actions";
import type { InvitationItem, MemberItem } from "../members";
import { ROLE_LABELS, type WorkspaceRole } from "../types";

const ROLES: WorkspaceRole[] = ["owner", "editor", "viewer"];

const ROLE_HINTS: Record<WorkspaceRole, string> = {
  owner: "Toàn quyền, kể cả mời / xoá thành viên",
  editor: "Tạo, sửa, xuất bản trang, liên kết, ảnh",
  viewer: "Chỉ xem trang, liên kết, ảnh, báo cáo",
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

export function MembersManager({
  members,
  invitations,
  currentUserId,
}: {
  members: MemberItem[];
  invitations: InvitationItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

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

  const onInvite = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const res = await inviteMemberAction({ email, role });
      if (res.success) setEmail("");
      return res;
    });
  };

  return (
    <div className="space-y-6">
      {/* Mời thành viên */}
      <form
        onSubmit={onInvite}
        className="p-4 md:p-5 rounded-2xl border border-border bg-card space-y-3"
      >
        <h2 className="text-sm font-bold flex items-center gap-2">
          <MailPlus className="w-4 h-4 text-primary" />
          Mời thành viên
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@vidu.com"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Select
            value={role}
            onChange={(v) => setRole(v as WorkspaceRole)}
            ariaLabel="Vai trò"
            options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
            className="sm:min-w-36"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Gửi lời mời
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {ROLE_HINTS[role]}. Lời mời có hạn 7 ngày.
        </p>
        {notice && (
          <p
            className={`text-xs ${notice.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}
            role="status"
          >
            {notice.text}
          </p>
        )}
      </form>

      {/* Thành viên */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <h2 className="px-4 py-3 text-sm font-bold border-b border-border">
          Thành viên ({members.length})
        </h2>
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.userId} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium block truncate">
                  {m.email ?? m.userId}
                  {m.userId === currentUserId && (
                    <span className="ml-1.5 text-[11px] text-muted-foreground">(bạn)</span>
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Tham gia {formatDate(m.joinedAt)}
                </span>
              </div>
              <Select
                value={m.role}
                disabled={isPending}
                size="sm"
                ariaLabel={`Vai trò của ${m.email ?? m.userId}`}
                onChange={(v) =>
                  run(() =>
                    updateMemberRoleAction({
                      userId: m.userId,
                      role: v as WorkspaceRole,
                    })
                  )
                }
                options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                className="min-w-32"
              />
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  const self = m.userId === currentUserId;
                  if (
                    window.confirm(
                      self
                        ? "Rời khỏi workspace này? Bạn sẽ mất quyền truy cập."
                        : `Xoá ${m.email ?? "thành viên"} khỏi workspace?`
                    )
                  ) {
                    run(() => removeMemberAction(m.userId));
                  }
                }}
                className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer disabled:opacity-40"
                aria-label={`Xoá ${m.email ?? "thành viên"}`}
              >
                <UserMinus className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Lời mời đang chờ */}
      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <h2 className="px-4 py-3 text-sm font-bold border-b border-border">
          Lời mời đang chờ ({invitations.length})
        </h2>
        {invitations.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">
            Không có lời mời nào đang chờ.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {invitations.map((i) => (
              <li key={i.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium block truncate">{i.email}</span>
                  <span
                    className={`text-[11px] ${i.isExpired ? "text-amber-600" : "text-muted-foreground"}`}
                  >
                    {ROLE_LABELS[i.role]} ·{" "}
                    {i.isExpired ? "Đã hết hạn" : `Hết hạn ${formatDate(i.expiresAt)}`}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => inviteMemberAction({ email: i.email, role: i.role }))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs hover:bg-muted cursor-pointer disabled:opacity-40"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Gửi lại
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => revokeInvitationAction(i.id))}
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer disabled:opacity-40"
                  aria-label={`Thu hồi lời mời ${i.email}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
