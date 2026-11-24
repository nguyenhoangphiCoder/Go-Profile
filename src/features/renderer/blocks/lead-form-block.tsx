"use client";

import { useState, useEffect, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send, X, Sparkles } from "lucide-react";
import type { LeadFormBlockPayload } from "@/features/pages/types";
import type { BlockRenderProps } from "../types";
import { tint } from "../primitives";
import { fireLeadConversionEvent } from "../tracking-scripts";

interface FormBodyProps {
  payload: LeadFormBlockPayload;
  pageSlug?: string;
  mode: "public" | "preview";
  inModal?: boolean;
  onSuccess?: () => void;
}

function LeadFormInner({ payload, pageSlug, mode, inModal, onSuccess }: FormBodyProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string | boolean>>({});
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const showEmail = payload.showEmail !== false;
  const showNote = payload.showNote !== false;
  const customFields = (payload.customFields || []).filter((f) => f.label?.trim());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "preview") {
      setSubmitted(true);
      return;
    }

    if (!fullName.trim() || !phone.trim()) {
      setError("Vui lòng nhập đầy đủ họ tên và số điện thoại.");
      return;
    }

    for (const field of customFields) {
      const val = customValues[field.id];
      if (field.required) {
        if (field.type === "checkbox" ? val !== true : !String(val || "").trim()) {
          setError(`Vui lòng điền/chọn mục "${field.label}".`);
          return;
        }
      }
    }

    const customLines = customFields
      .map((field) => {
        const val = customValues[field.id];
        if (field.type === "checkbox") {
          return val ? `[${field.label}]: Có` : null;
        }
        const text = String(val || "").trim();
        return text ? `[${field.label}]: ${text}` : null;
      })
      .filter(Boolean);

    const combinedNote = [...customLines, showNote && note.trim() ? note.trim() : null]
      .filter(Boolean)
      .join("\n")
      .slice(0, 2000);

    setSubmitting(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: pageSlug || window.location.pathname.replace(/^\/+/, "") || "home",
          formName: payload.formName?.trim() || payload.title?.trim() || "Form liên hệ",
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: showEmail ? email.trim() : "",
          note: combinedNote,
          website,
          utmSource: params.get("utm_source") || "",
          utmMedium: params.get("utm_medium") || "",
          utmCampaign: params.get("utm_campaign") || "",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error || "Không thể gửi thông tin lúc này. Vui lòng thử lại.");
        return;
      }

      setSubmitted(true);
      fireLeadConversionEvent(payload.formName?.trim() || payload.title?.trim() || "Form liên hệ");
      setFullName("");
      setPhone("");
      setEmail("");
      setNote("");
      setCustomValues({});
      onSuccess?.();

      const redirectUrl = payload.redirectUrl?.trim();
      if (redirectUrl && (/^https?:\/\//i.test(redirectUrl) || redirectUrl.startsWith("/"))) {
        window.setTimeout(() => {
          window.location.assign(redirectUrl);
        }, 1200);
      }
    } catch {
      setError("Mất kết nối mạng. Vui lòng thử lại sau ít phút.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-6 text-center space-y-3">
        <div
          className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.14)", color: "#059669" }}
        >
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold" style={{ color: "var(--gp-text)" }}>
          {mode === "preview" ? "Xem trước trạng thái gửi thành công" : "Đã nhận thông tin!"}
        </h3>
        <p className="text-sm opacity-75 max-w-md mx-auto">
          {mode === "preview"
            ? "Ở trang công khai, thông tin khách hàng sẽ được gửi về mục Khách hàng (/admin/leads)."
            : payload.successMessage?.trim() ||
              "Cảm ơn bạn đã để lại thông tin. Đội ngũ Gờ Café sẽ liên hệ tư vấn sớm nhất."}
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer transition-opacity hover:opacity-80"
          style={{ borderColor: tint(18), color: "var(--gp-text)" }}
        >
          Gửi yêu cầu khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      {/* Honeypot chống bot — ẩn khỏi người dùng thật */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className={`grid grid-cols-1 ${inModal ? "" : "@min-[40rem]:grid-cols-2"} gap-3`}>
        <div>
          <label className="block text-xs font-semibold mb-1.5 opacity-80">
            {payload.fullNameLabel?.trim() || "Họ và tên"} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={payload.fullNamePlaceholder?.trim() || "VD: Nguyễn Văn An"}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-transparent focus:outline-none focus:ring-2 transition-shadow"
            style={{
              borderColor: tint(18),
              color: "var(--gp-text)",
              backgroundColor: tint(3),
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 opacity-80">
            {payload.phoneLabel?.trim() || "Số điện thoại"} <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={payload.phonePlaceholder?.trim() || "VD: 0909 123 456"}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-transparent focus:outline-none focus:ring-2 transition-shadow"
            style={{
              borderColor: tint(18),
              color: "var(--gp-text)",
              backgroundColor: tint(3),
            }}
          />
        </div>
      </div>

      {showEmail && (
        <div>
          <label className="block text-xs font-semibold mb-1.5 opacity-80">
            {payload.emailLabel?.trim() || "Email (không bắt buộc)"}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={payload.emailPlaceholder?.trim() || "email@example.com"}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-transparent focus:outline-none focus:ring-2 transition-shadow"
            style={{
              borderColor: tint(18),
              color: "var(--gp-text)",
              backgroundColor: tint(3),
            }}
          />
        </div>
      )}

      {customFields.map((field) => (
        <div key={field.id}>
          {field.type === "checkbox" ? (
            <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={customValues[field.id] === true}
                onChange={(e) =>
                  setCustomValues((prev) => ({ ...prev, [field.id]: e.target.checked }))
                }
                className="w-4 h-4 rounded"
              />
              <span>
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </span>
            </label>
          ) : (
            <>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {field.type === "select" ? (
                <select
                  value={String(customValues[field.id] || "")}
                  onChange={(e) =>
                    setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-transparent focus:outline-none focus:ring-2 transition-shadow"
                  style={{
                    borderColor: tint(18),
                    color: "var(--gp-text)",
                    backgroundColor: tint(3),
                  }}
                >
                  <option value="">-- Chọn {field.label} --</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt} className="text-black">
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={String(customValues[field.id] || "")}
                  onChange={(e) =>
                    setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-transparent focus:outline-none focus:ring-2 transition-shadow"
                  style={{
                    borderColor: tint(18),
                    color: "var(--gp-text)",
                    backgroundColor: tint(3),
                  }}
                />
              )}
            </>
          )}
        </div>
      ))}

      {showNote && (
        <div>
          <label className="block text-xs font-semibold mb-1.5 opacity-80">
            {payload.noteLabel?.trim() || "Nhu cầu tư vấn"}
          </label>
          <textarea
            rows={inModal ? 2 : 3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              payload.notePlaceholder?.trim() ||
              "VD: Tôi muốn tìm hiểu nhượng quyền tại TP.HCM / Nhận bảng giá sỉ cà phê..."
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-transparent focus:outline-none focus:ring-2 transition-shadow resize-none"
            style={{
              borderColor: tint(18),
              color: "var(--gp-text)",
              backgroundColor: tint(3),
            }}
          />
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60 cursor-pointer"
        style={{
          backgroundColor: "var(--gp-btn-bg, #111111)",
          color: "var(--gp-btn-text, #FFFFFF)",
        }}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        <span>
          {submitting ? "Đang gửi..." : payload.submitLabel?.trim() || "Đăng ký tư vấn ngay"}
        </span>
      </button>
    </form>
  );
}

export function LeadFormBlock({ block, ctx }: BlockRenderProps) {
  const p = block.payload as LeadFormBlockPayload;
  const popupDelaySec = typeof p.popupDelaySec === "number" ? p.popupDelaySec : 0;
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (ctx.mode !== "public" || popupDelaySec <= 0) return;
    const storageKey = `gp_lead_popup:${ctx.currentSlug || "page"}:${block.id}`;
    try {
      if (sessionStorage.getItem(storageKey) === "1") return;
    } catch {
      // ignore storage errors
    }

    const timer = window.setTimeout(() => {
      setPopupOpen(true);
      try {
        sessionStorage.setItem(storageKey, "1");
      } catch {
        // ignore
      }
    }, popupDelaySec * 1000);

    return () => window.clearTimeout(timer);
  }, [ctx.mode, ctx.currentSlug, block.id, popupDelaySec]);

  return (
    <>
      <section
        id={p.anchorId || undefined}
        className="w-full scroll-mt-24 rounded-3xl border p-6 @min-[48rem]:p-10"
        style={{
          borderColor: tint(14),
          backgroundColor: tint(4),
        }}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            {p.eyebrow && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--gp-accent, #B88A44) 16%, transparent)",
                  color: "var(--gp-accent, #B88A44)",
                }}
              >
                <Sparkles className="w-3 h-3" />
                {p.eyebrow}
              </span>
            )}
            <h2
              className="text-2xl @min-[48rem]:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--gp-font-heading)", color: "var(--gp-text)" }}
            >
              {p.title?.trim() || "Đăng ký nhận tư vấn & báo giá"}
            </h2>
            {p.subtitle && <p className="text-sm opacity-75 leading-relaxed">{p.subtitle}</p>}
            {ctx.mode === "preview" && popupDelaySec > 0 && (
              <p className="text-[11px] font-medium text-amber-600">
                (Đang bật tự động hiện Popup sau {popupDelaySec} giây trên trang công khai)
              </p>
            )}
          </div>

          <LeadFormInner payload={p} pageSlug={ctx.currentSlug} mode={ctx.mode} />
        </div>
      </section>

      {/* Auto-Popup Modal (chỉ chạy ở trang công khai khi popupDelaySec > 0) */}
      {popupOpen && ctx.mode === "public" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={p.title || "Đăng ký tư vấn"}
          onClick={() => setPopupOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border p-6 shadow-2xl relative"
            style={{
              backgroundColor: "var(--gp-bg, #FFFFFF)",
              color: "var(--gp-text, #111111)",
              borderColor: tint(16),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPopupOpen(false)}
              aria-label="Đóng hộp thoại"
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 mb-5 pr-6">
              {p.eyebrow && (
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--gp-accent, #B88A44)" }}
                >
                  {p.eyebrow}
                </p>
              )}
              <h3 className="text-xl font-bold" style={{ fontFamily: "var(--gp-font-heading)" }}>
                {p.title?.trim() || "Đăng ký nhận tư vấn"}
              </h3>
              {p.subtitle && <p className="text-xs opacity-75">{p.subtitle}</p>}
            </div>

            <LeadFormInner payload={p} pageSlug={ctx.currentSlug} mode="public" inModal />
          </div>
        </div>
      )}
    </>
  );
}
