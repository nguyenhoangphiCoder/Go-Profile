"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Phone, MessageCircle, Copy, Check, X } from "lucide-react";

export interface ParsedPhone {
  /** Chuỗi dùng cho tel:... (chỉ giữ chữ số và dấu + ở đầu). */
  dialNumber: string;
  /** Chuỗi dùng cho https://zalo.me/... */
  zaloNumber: string;
  /** Chuỗi hiển thị dễ đọc (VD: 0779 200 020). */
  display: string;
}

/** Tách và chuẩn hoá số điện thoại từ URL `tel:...` hoặc chuỗi số thô. */
export function parsePhoneTarget(targetUrl: string): ParsedPhone {
  const raw = targetUrl.replace(/^tel:/i, "").trim();
  const hasPlus = raw.startsWith("+");
  const digitsOnly = raw.replace(/\D/g, "");
  const dialNumber = hasPlus ? `+${digitsOnly}` : digitsOnly;

  // Zalo nhận tốt nhất dạng 0xxxxxxxxx cho số VN (+84 / 84 -> 0)
  let zaloNumber = digitsOnly;
  if (digitsOnly.startsWith("84") && digitsOnly.length >= 10 && digitsOnly.length <= 11) {
    zaloNumber = `0${digitsOnly.slice(2)}`;
  }

  // Format hiển thị đẹp cho số VN 10 chữ số (0xxx xxx xxx)
  let display = raw || dialNumber;
  if (/^0\d{9}$/.test(zaloNumber) && !raw.includes(".") && !raw.includes(" ")) {
    display = `${zaloNumber.slice(0, 4)} ${zaloNumber.slice(4, 7)} ${zaloNumber.slice(7)}`;
  }

  return { dialNumber, zaloNumber, display };
}

/**
 * Tạo URL Zalo an toàn từ số/link Zalo tuỳ chỉnh (nếu có), hoặc fallback về số điện thoại gốc.
 * Hỗ trợ: "0901234567", "+84901234567", "zalo.me/gocafe", "https://zalo.me/gocafe".
 */
export function resolveZaloHref(defaultZaloNumber: string, customTarget?: string | null): string {
  const trimmed = (customTarget || "").trim();
  if (!trimmed) return `https://zalo.me/${defaultZaloNumber}`;

  // Trường hợp nhập URL zalo.me (có hoặc không có https://)
  const urlCandidate = /^zalo\.me\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
  if (/^https?:\/\//i.test(urlCandidate)) {
    try {
      const parsed = new URL(urlCandidate);
      if (parsed.hostname.toLowerCase() === "zalo.me" && parsed.pathname.length > 1) {
        return `https://zalo.me${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Fallback bên dưới
    }
    return `https://zalo.me/${defaultZaloNumber}`;
  }

  // Trường hợp nhập số điện thoại khác
  const parsedPhone = parsePhoneTarget(trimmed);
  if (parsedPhone.zaloNumber.length >= 6) {
    return `https://zalo.me/${parsedPhone.zaloNumber}`;
  }

  return `https://zalo.me/${defaultZaloNumber}`;
}

function trackPhoneClickOnce(linkId: string | undefined, trackedRef: { current: boolean }) {
  if (!linkId || trackedRef.current) return;
  trackedRef.current = true;
  const url = `/r/${linkId}?track=1`;
  try {
    void fetch(url, { method: "GET", keepalive: true }).catch(() => {});
  } catch {
    // Bỏ qua lỗi mạng để không cản trở thao tác gọi / mở Zalo
  }
}

function PhoneActionModal({
  phone,
  zaloTarget,
  heading,
  onClose,
}: {
  phone: ParsedPhone;
  zaloTarget?: string | null;
  heading?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const zaloHref = resolveZaloHref(phone.zaloNumber, zaloTarget);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phone.zaloNumber || phone.dialNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback cho trình duyệt webview không hỗ trợ navigator.clipboard
      try {
        const ta = document.createElement("textarea");
        ta.value = phone.zaloNumber || phone.dialNumber;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Không làm gì nếu bị chặn hoàn toàn
      }
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Liên hệ ${phone.display}`}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#181a1d] text-white border border-white/10 shadow-2xl p-5 pb-7 sm:pb-5 space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh kéo trên mobile + nút đóng */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-neutral-400 truncate">{heading || "Chọn cách liên hệ"}</p>
            <p className="text-xl font-extrabold tracking-wide text-white mt-0.5 tabular-nums">
              {phone.display}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 hành động chính: Gọi điện & Nhắn Zalo */}
        <div className="space-y-2.5">
          <a
            href={`tel:${phone.dialNumber}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2.5 w-full min-h-[50px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm transition-all shadow-sm"
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span>Gọi điện ngay</span>
          </a>

          <a
            href={zaloHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center gap-2.5 w-full min-h-[50px] px-4 py-3 rounded-2xl bg-[#0068FF] hover:bg-[#0058d9] active:scale-[0.99] text-white font-bold text-sm transition-all shadow-sm"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Nhắn Zalo</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-white/8 hover:bg-white/14 active:scale-[0.99] text-neutral-200 font-semibold text-xs transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300">Đã sao chép số điện thoại</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span>Sao chép số điện thoại</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Nút liên kết dạng số điện thoại (`tel:...`) trên trang công khai:
 * bấm vào mở bảng chọn Gọi điện / Nhắn Zalo / Sao chép số và ghi nhận lượt click ngầm.
 */
export function PhoneActionButton({
  linkId,
  targetUrl,
  zaloTarget,
  label,
  className,
  style,
  title,
  children,
}: {
  linkId?: string;
  targetUrl: string;
  zaloTarget?: string | null;
  label?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const trackedRef = useRef(false);
  const phone = parsePhoneTarget(targetUrl);
  const firstLine = label?.split("\n")[0]?.trim();

  const handleOpen = () => {
    trackPhoneClickOnce(linkId, trackedRef);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`${className || ""} cursor-pointer`}
        style={style}
        title={title}
      >
        {children}
      </button>
      {open && (
        <PhoneActionModal
          phone={phone}
          zaloTarget={zaloTarget}
          heading={firstLine}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Liên kết số điện thoại nằm trong đoạn văn bản/Bio (Lnk.Bio format):
 * bấm vào mở cùng bảng chọn Gọi điện / Nhắn Zalo / Sao chép số.
 */
export function PhoneInlineLink({
  phoneText,
  accentColor,
}: {
  phoneText: string;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const phone = parsePhoneTarget(phoneText);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:underline font-bold cursor-pointer bg-transparent border-0 p-0 inline"
        style={{ color: accentColor }}
      >
        {phoneText}
      </button>
      {open && (
        <PhoneActionModal
          phone={phone}
          heading="Liên hệ qua số điện thoại"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
