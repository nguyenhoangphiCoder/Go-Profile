"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Stage =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "set-password"; email: string | null };

/**
 * Link mời của Supabase trả phiên đăng nhập trong phần #hash của URL (máy chủ không đọc được).
 * Trang này đọc hash, lập phiên đăng nhập trên trình duyệt, rồi cho người dùng đặt mật khẩu
 * trước khi vào khu vực quản trị (lời mời được nhận tự động ở /admin).
 */
export function AcceptInviteForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    // Xoá token khỏi thanh địa chỉ ngay
    window.history.replaceState(null, "", window.location.pathname);

    const run = async () => {
      const errorDescription = hash.get("error_description");
      if (errorDescription) {
        setStage({
          kind: "error",
          message: `Link mời không hợp lệ hoặc đã hết hạn (${errorDescription}). Hãy nhờ người mời gửi lại lời mời.`,
        });
        return;
      }
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setStage({ kind: "error", message: "Không xác thực được link mời. Hãy thử lại." });
          return;
        }
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setStage({
          kind: "error",
          message: "Không tìm thấy phiên đăng nhập. Hãy mở lại link trong email mời.",
        });
        return;
      }
      setStage({ kind: "set-password", email: data.user.email ?? null });
    };
    void run();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) return setFormError("Mật khẩu tối thiểu 8 ký tự.");
    if (password !== confirm) return setFormError("Mật khẩu nhập lại không khớp.");

    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return setFormError(`Không đặt được mật khẩu: ${error.message}`);
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-card shadow-sm space-y-5">
      <div className="text-center space-y-1">
        <span className="text-4xl">✉️</span>
        <h1 className="text-xl font-bold">Nhận lời mời tham gia</h1>
      </div>

      {stage.kind === "loading" && (
        <div className="flex justify-center py-6 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {stage.kind === "error" && (
        <p className="text-sm text-red-600 text-center">{stage.message}</p>
      )}

      {stage.kind === "set-password" && (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Đặt mật khẩu cho tài khoản <strong>{stage.email}</strong> để đăng nhập các lần sau.
          </p>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">Mật khẩu mới</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
              minLength={8}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold">Nhập lại mật khẩu</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
              minLength={8}
            />
          </label>
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Đặt mật khẩu &amp; vào khu vực quản trị
          </button>
        </form>
      )}
    </div>
  );
}
