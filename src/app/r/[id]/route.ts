import { NextRequest, NextResponse } from "next/server";
import { resolveAndRecordClick } from "@/features/public/queries";
import { shouldSkipClickTracking } from "@/features/public/bot-detector";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest, { params }: RouteProps) {
  const { id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
    return new NextResponse("Liên kết không hợp lệ", { status: 404 });
  }

  const userAgent = req.headers.get("user-agent");
  const skipTracking = shouldSkipClickTracking(req.method, req.headers, userAgent);

  const result = await resolveAndRecordClick(id, skipTracking);

  if (!result.valid || !result.targetUrl) {
    return new NextResponse("Liên kết không tồn tại hoặc đã ngừng hoạt động", {
      status: 404,
      headers: NO_CACHE_HEADERS,
    });
  }

  // Chuyển hướng tạm thời HTTP 307 bảo toàn method và không lưu cache (P07.05)
  return NextResponse.redirect(result.targetUrl, {
    status: 307,
    headers: NO_CACHE_HEADERS,
  });
}

export async function HEAD(req: NextRequest, { params }: RouteProps) {
  const { id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
    return new NextResponse(null, { status: 404 });
  }

  // Phương thức HEAD: luôn bỏ qua việc ghi nhận click (P07.07)
  const result = await resolveAndRecordClick(id, true);

  if (!result.valid || !result.targetUrl) {
    return new NextResponse(null, { status: 404, headers: NO_CACHE_HEADERS });
  }

  return new NextResponse(null, {
    status: 307,
    headers: {
      ...NO_CACHE_HEADERS,
      Location: result.targetUrl,
    },
  });
}
