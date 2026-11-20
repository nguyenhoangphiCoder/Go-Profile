"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev.slice(-3), { id, variant, message }]);
      window.setTimeout(() => dismiss(id), 3800);
    },
    [dismiss]
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== "undefined" &&
        toasts.length > 0 &&
        createPortal(
          <div
            aria-live="polite"
            className="fixed bottom-4 right-4 z-[120] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className="pointer-events-auto flex items-start gap-2.5 px-3.5 py-3 rounded-xl border border-border bg-card text-card-foreground shadow-lg shadow-black/10 text-[13px] animate-in fade-in-0 slide-in-from-bottom-2 duration-150"
              >
                {t.variant === "success" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
                {t.variant === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                {t.variant === "info" && (
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                )}
                <span className="flex-1 leading-snug font-medium">{t.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Đóng thông báo"
                  className="p-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

const NOOP_TOAST: ToastContextValue = {
  success: () => {},
  error: () => {},
  info: () => {},
};

export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? NOOP_TOAST;
}
