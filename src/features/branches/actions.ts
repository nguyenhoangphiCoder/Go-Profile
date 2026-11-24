"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_PAGES_TAG } from "@/features/public/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceForAction } from "@/features/workspace/context";
import {
  canUseWorkspaceFeature,
  checkWorkspaceQuota,
  FEATURE_DISABLED_MESSAGES,
} from "@/features/workspace/guards";
import { FORBIDDEN_ERROR } from "@/features/workspace/types";
import { extractLatLngFromMapsUrl } from "./geo-utils";
import {
  branchInputSchema,
  importBranchesSchema,
  updateBranchSchema,
  type BranchFormInput,
  type ImportBranchesInput,
  type UpdateBranchInput,
} from "./schemas";

function revalidateBranches() {
  revalidatePath("/admin/branches");
  revalidateTag(PUBLIC_PAGES_TAG, "max");
}

function resolveCoords(lat: number | null, lng: number | null, mapsUrl?: string | null) {
  if (lat !== null && lng !== null) return { lat, lng };
  if (mapsUrl) {
    const extracted = extractLatLngFromMapsUrl(mapsUrl);
    if (extracted) return extracted;
  }
  return { lat, lng };
}

export async function createBranchAction(input: BranchFormInput) {
  const parsed = branchInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Thông tin chi nhánh không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
  if (!canUseWorkspaceFeature(ctx, "branches")) {
    return { success: false, error: FEATURE_DISABLED_MESSAGES.branches };
  }

  const supabase = await createSupabaseServerClient();
  const { count: activeBranchCount } = await supabase
    .from("branches")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null);

  const quota = checkWorkspaceQuota({
    isPlatformAdmin: ctx.isPlatformAdmin,
    current: activeBranchCount ?? 0,
    max: ctx.workspace.maxBranches,
    resourceLabel: "chi nhánh",
  });
  if (!quota.ok) return { success: false, error: quota.error };

  const coords = resolveCoords(parsed.data.lat, parsed.data.lng, parsed.data.mapsUrl);

  const { data: lastRow } = await supabase
    .from("branches")
    .select("position")
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null)
    .order("position", { ascending: false })
    .limit(1);

  const nextPos = lastRow && lastRow.length > 0 ? Number(lastRow[0].position) + 1 : 0;

  const { data, error } = await supabase
    .from("branches")
    .insert({
      workspace_id: ctx.workspace.id,
      code: parsed.data.code || null,
      name: parsed.data.name,
      address: parsed.data.address,
      district: parsed.data.district,
      city: parsed.data.city || "TP.HCM",
      phone: parsed.data.phone || null,
      hours: parsed.data.hours || null,
      lat: coords.lat,
      lng: coords.lng,
      maps_url: parsed.data.mapsUrl || null,
      position: nextPos,
      is_active: parsed.data.isActive,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Lỗi tạo chi nhánh:", error);
    return { success: false, error: error.message || "Không thể thêm chi nhánh" };
  }

  revalidateBranches();
  return { success: true, id: data.id };
}

export async function updateBranchAction(input: UpdateBranchInput) {
  const parsed = updateBranchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Thông tin chi nhánh không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
  if (!canUseWorkspaceFeature(ctx, "branches")) {
    return { success: false, error: FEATURE_DISABLED_MESSAGES.branches };
  }

  const supabase = await createSupabaseServerClient();
  const coords = resolveCoords(parsed.data.lat, parsed.data.lng, parsed.data.mapsUrl);

  const { error } = await supabase
    .from("branches")
    .update({
      code: parsed.data.code || null,
      name: parsed.data.name,
      address: parsed.data.address,
      district: parsed.data.district,
      city: parsed.data.city || "TP.HCM",
      phone: parsed.data.phone || null,
      hours: parsed.data.hours || null,
      lat: coords.lat,
      lng: coords.lng,
      maps_url: parsed.data.mapsUrl || null,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    console.error("Lỗi cập nhật chi nhánh:", error);
    return { success: false, error: error.message || "Không thể cập nhật chi nhánh" };
  }

  revalidateBranches();
  return { success: true };
}

export async function toggleBranchActiveAction(branchId: string, isActive: boolean) {
  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("branches")
    .update({ is_active: isActive })
    .eq("id", branchId)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    return { success: false, error: error.message || "Không thể đổi trạng thái chi nhánh" };
  }

  revalidateBranches();
  return { success: true };
}

export async function archiveBranchAction(branchId: string) {
  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("branches")
    .update({ archived_at: new Date().toISOString(), is_active: false })
    .eq("id", branchId)
    .eq("workspace_id", ctx.workspace.id);

  if (error) {
    return { success: false, error: error.message || "Không thể xóa chi nhánh" };
  }

  revalidateBranches();
  return { success: true };
}

export async function importBranchesAction(input: ImportBranchesInput) {
  const parsed = importBranchesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dữ liệu import không hợp lệ",
    };
  }

  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };
  if (!canUseWorkspaceFeature(ctx, "branches")) {
    return { success: false, error: FEATURE_DISABLED_MESSAGES.branches };
  }

  const supabase = await createSupabaseServerClient();
  const { count: activeBranchCount } = await supabase
    .from("branches")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null);

  const quota = checkWorkspaceQuota({
    isPlatformAdmin: ctx.isPlatformAdmin,
    current: activeBranchCount ?? 0,
    max: ctx.workspace.maxBranches,
    adding: parsed.data.rows.length,
    resourceLabel: "chi nhánh",
  });
  if (!quota.ok) return { success: false, error: quota.error };

  const { data: lastRow } = await supabase
    .from("branches")
    .select("position")
    .eq("workspace_id", ctx.workspace.id)
    .is("archived_at", null)
    .order("position", { ascending: false })
    .limit(1);

  const startPos = lastRow && lastRow.length > 0 ? Number(lastRow[0].position) + 1 : 0;

  const insertRows = parsed.data.rows.map((r, idx) => {
    const coords = resolveCoords(r.lat, r.lng, r.mapsUrl);
    return {
      workspace_id: ctx.workspace.id,
      code: r.code || null,
      name: r.name,
      address: r.address,
      district: r.district,
      city: r.city || "TP.HCM",
      phone: r.phone || null,
      hours: r.hours || null,
      lat: coords.lat,
      lng: coords.lng,
      maps_url: r.mapsUrl || null,
      position: startPos + idx,
      is_active: r.isActive,
    };
  });

  const { error } = await supabase.from("branches").insert(insertRows);
  if (error) {
    console.error("Lỗi import chi nhánh:", error);
    return { success: false, error: error.message || "Không thể import danh sách chi nhánh" };
  }

  revalidateBranches();
  return { success: true, count: insertRows.length };
}

interface GoongGeocodeResponse {
  status?: string;
  results?: {
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
    compound?: {
      district?: string;
      province?: string;
    };
  }[];
}

/**
 * Gọi Goong Maps Geocoding API ở phía server (giấu GOONG_API_KEY)
 * để tự động đổi địa chỉ tiếng Việt thành tọa độ lat, lng + Quận/Thành phố.
 */
export async function geocodeBranchAddressAction(rawAddress: string): Promise<
  | {
      success: true;
      lat: number;
      lng: number;
      formattedAddress: string;
      district: string | null;
      city: string | null;
      mapsUrl: string;
    }
  | { success: false; error: string }
> {
  const ctx = await getWorkspaceForAction("editor");
  if (!ctx) return { success: false, error: FORBIDDEN_ERROR };

  const address = rawAddress.trim();
  if (address.length < 4) {
    return { success: false, error: "Vui lòng nhập địa chỉ rõ hơn (ít nhất 4 ký tự)." };
  }

  const apiKey = process.env.GOONG_API_KEY?.trim();

  // 1. Ưu tiên gọi Goong Maps Geocoding API nếu có GOONG_API_KEY
  if (apiKey) {
    try {
      const url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });

      if (res.ok) {
        const data = (await res.json()) as GoongGeocodeResponse;
        const first = data.results?.[0];
        const lat = first?.geometry?.location?.lat;
        const lng = first?.geometry?.location?.lng;

        if (first && typeof lat === "number" && typeof lng === "number") {
          const roundedLat = Number(lat.toFixed(6));
          const roundedLng = Number(lng.toFixed(6));
          return {
            success: true,
            lat: roundedLat,
            lng: roundedLng,
            formattedAddress: first.formatted_address || address,
            district: first.compound?.district?.trim() || null,
            city: first.compound?.province?.trim() || null,
            mapsUrl: `https://maps.google.com/?q=${roundedLat},${roundedLng}`,
          };
        }
      } else {
        console.warn(`Goong Geocoding trả HTTP ${res.status}, chuyển sang Nominatim dự phòng.`);
      }
    } catch (err) {
      console.warn("Goong Geocoding lỗi kết nối, chuyển sang Nominatim dự phòng:", err);
    }
  }

  // 2. Dự phòng miễn phí qua OpenStreetMap Nominatim (khi chưa có Goong REST Key hoặc Goong trả 403)
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=vn&q=${encodeURIComponent(address)}`;
    const nomRes = await fetch(nomUrl, {
      method: "GET",
      headers: { "User-Agent": "GoCafeCMS/1.0 (https://go-cafe.com)" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });

    if (!nomRes.ok) {
      return {
        success: false,
        error:
          "Không thể tra cứu tọa độ lúc này. Bạn có thể dán link Google Maps để tự tách tọa độ.",
      };
    }

    const items = (await nomRes.json()) as {
      lat?: string;
      lon?: string;
      display_name?: string;
      address?: {
        suburb?: string;
        city_district?: string;
        county?: string;
        city?: string;
        state?: string;
      };
    }[];
    const top = items?.[0];
    const latNum = top?.lat ? Number(top.lat) : NaN;
    const lngNum = top?.lon ? Number(top.lon) : NaN;

    if (!top || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return {
        success: false,
        error: "Không tìm thấy tọa độ cho địa chỉ này. Hãy thêm tên Phường / Quận / TP.",
      };
    }

    const roundedLat = Number(latNum.toFixed(6));
    const roundedLng = Number(lngNum.toFixed(6));
    return {
      success: true,
      lat: roundedLat,
      lng: roundedLng,
      formattedAddress: top.display_name || address,
      district: top.address?.city_district || top.address?.county || top.address?.suburb || null,
      city: top.address?.city || top.address?.state || null,
      mapsUrl: `https://maps.google.com/?q=${roundedLat},${roundedLng}`,
    };
  } catch (err) {
    console.error("Lỗi gọi Nominatim Geocoding:", err);
    return { success: false, error: "Không thể kết nối dịch vụ bản đồ lúc này. Vui lòng thử lại." };
  }
}
