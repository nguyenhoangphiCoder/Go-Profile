import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-linear-to-b from-blue-50/50 to-white">
      <div className="max-w-md w-full p-8 rounded-2xl border border-blue-100 bg-white shadow-sm space-y-4">
        <span className="text-4xl">☕</span>
        <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy trang</h1>
        <p className="text-muted-foreground text-sm">
          Đường dẫn bạn truy cập không tồn tại hoặc trang chưa được xuất bản.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
