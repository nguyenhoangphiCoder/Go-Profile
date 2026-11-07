"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ghi log lỗi không nhạy cảm
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-linear-to-b from-blue-50/50 to-white">
      <div className="max-w-md w-full p-8 rounded-2xl border border-blue-100 bg-white shadow-sm space-y-4">
        <span className="text-4xl">⚠️</span>
        <h1 className="text-2xl font-bold text-slate-900">Đã xảy ra sự cố</h1>
        <p className="text-muted-foreground text-sm">
          Hệ thống gặp sự cố trong quá trình xử lý yêu cầu. Vui lòng thử lại.
        </p>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
          >
            Thử lại
          </button>
        </div>
      </div>
    </main>
  );
}
