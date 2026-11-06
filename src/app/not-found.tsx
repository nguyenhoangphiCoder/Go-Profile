import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-muted/40 shadow-sm space-y-4">
        <span className="text-4xl">☕</span>
        <h1 className="text-2xl font-bold">Không tìm thấy trang</h1>
        <p className="text-muted-foreground text-sm">
          Đường dẫn bạn truy cập không tồn tại hoặc trang chưa được xuất bản.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}

