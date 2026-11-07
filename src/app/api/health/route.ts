import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  timezone: string;
  region: string;
  environment: string;
  checks: {
    env: "ok" | "error";
    database: "ok" | "error";
  };
  latencyMs: number;
}

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();
  let envCheck: "ok" | "error" = "ok";
  let dbCheck: "ok" | "error" = "ok";

  try {
    // 1. Verify environment configuration is loaded
    if (
      !serverEnv.NEXT_PUBLIC_SUPABASE_URL ||
      !serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !serverEnv.SUPABASE_SERVICE_ROLE_KEY
    ) {
      envCheck = "error";
    }

    // 2. Verify lightweight database connectivity via reserved_slugs lookup
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("reserved_slugs").select("slug").limit(1);

    if (error) {
      dbCheck = "error";
    }
  } catch {
    dbCheck = "error";
  }

  const latencyMs = Date.now() - startTime;
  const overallStatus =
    envCheck === "ok" && dbCheck === "ok" ? (latencyMs < 1000 ? "ok" : "degraded") : "error";

  const payload: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    timezone: "Asia/Ho_Chi_Minh",
    region: process.env.VERCEL_REGION || "local-sin1",
    environment: process.env.NODE_ENV || "development",
    checks: {
      env: envCheck,
      database: dbCheck,
    },
    latencyMs,
  };

  return NextResponse.json(payload, {
    status: overallStatus === "error" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
