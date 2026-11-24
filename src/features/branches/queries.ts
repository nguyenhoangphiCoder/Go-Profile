import { cacheLife, cacheTag } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicAnonClient, PUBLIC_PAGES_TAG } from "@/features/public/queries";
import { requireWorkspace } from "@/features/workspace/context";
import type { BranchItem, PublicBranchItem } from "./types";

interface BranchRow {
  id: string;
  code: string | null;
  name: string;
  address: string;
  district: string;
  city: string;
  phone: string | null;
  hours: string | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  position: number;
  is_active: boolean;
  updated_at: string;
}

export async function getBranchesList(): Promise<BranchItem[]> {
  const { workspace } = await requireWorkspace();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("branches")
    .select(
      "id, code, name, address, district, city, phone, hours, lat, lng, maps_url, position, is_active, updated_at"
    )
    .eq("workspace_id", workspace.id)
    .is("archived_at", null)
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Lỗi tải danh sách chi nhánh:", error.message || error);
    return [];
  }

  return ((data || []) as unknown as BranchRow[]).map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    address: b.address,
    district: b.district,
    city: b.city,
    phone: b.phone,
    hours: b.hours,
    lat: b.lat,
    lng: b.lng,
    mapsUrl: b.maps_url,
    position: b.position,
    isActive: b.is_active,
    updatedAt: b.updated_at,
  }));
}

/**
 * Lấy danh sách chi nhánh đang hoạt động cho khối `store_locator` trên trang công khai.
 * Dùng Next.js `"use cache"` + tag `PUBLIC_PAGES_TAG` để phản hồi cực nhanh.
 */
export async function fetchPublicBranches(workspaceId: string): Promise<PublicBranchItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_PAGES_TAG);

  const supabase = getPublicAnonClient();
  const { data, error } = await supabase.rpc("get_public_branches", {
    p_workspace_id: workspaceId,
  });

  if (error || !Array.isArray(data)) {
    if (error) console.error("Lỗi RPC get_public_branches:", error.message || error);
    return [];
  }

  return data as unknown as PublicBranchItem[];
}
