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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-muted/40 shadow-sm space-y-4">
        <span className="text-4xl">⚠️</span>
        <h1 className="text-2xl font-bold">Đã xảy ra sự cố</h1>
        <p className="text-muted-foreground text-sm">
          Hệ thống gặp sự cố trong quá trình xử lý yêu cầu. Vui lòng thử lại.
        </p>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    </main>
  );
}

