"use server";

import { z } from "zod";
import { getCurrentAdmin } from "@/features/auth/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/privileged";
import type { Json } from "@/types/database.generated";
import {
  saveThemePresetSchema,
  themePresetConfigSchema,
  type SaveThemePresetInput,
  type SavedThemePreset,
} from "./schemas";

const SESSION_ERROR = "Phiên đăng nhập đã hết hạn hoặc bạn không có quyền quản trị.";
const MIGRATION_HINT =
  "Chưa có bảng theme_presets. Hãy áp dụng migration 20261116000001_theme_presets.sql.";
const MAX_PRESETS = 50;

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || /theme_presets/.test(error.message ?? "");
}

export async function listThemePresetsAction(): Promise<ActionResult<SavedThemePreset[]>> {
  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: SESSION_ERROR };

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("theme_presets")
    .select("id, name, config, created_at")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(MAX_PRESETS);

  if (error) {
    return { success: false, error: isMissingTable(error) ? MIGRATION_HINT : "Không tải được danh sách mẫu" };
  }

  // Bỏ qua bản ghi không còn hợp lệ với schema hiện tại thay vì làm hỏng cả danh sách
  const presets: SavedThemePreset[] = [];
  for (const row of data ?? []) {
    const parsed = themePresetConfigSchema.safeParse(row.config);
    if (parsed.success) {
      presets.push({ id: row.id, name: row.name, config: parsed.data, createdAt: row.created_at });
    }
  }
  return { success: true, data: presets };
}

export async function saveThemePresetAction(
  input: SaveThemePresetInput
): Promise<ActionResult<SavedThemePreset>> {
  const parsed = saveThemePresetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dữ liệu mẫu không hợp lệ" };
  }

  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: SESSION_ERROR };

  const db = createSupabaseAdminClient();

  const { count, error: countError } = await db
    .from("theme_presets")
    .select("id", { count: "exact", head: true })
    .is("archived_at", null);
  if (countError) {
    return { success: false, error: isMissingTable(countError) ? MIGRATION_HINT : "Không lưu được mẫu" };
  }
  if ((count ?? 0) >= MAX_PRESETS) {
    return { success: false, error: `Tối đa ${MAX_PRESETS} mẫu. Hãy xoá bớt mẫu cũ.` };
  }

  const { data, error } = await db
    .from("theme_presets")
    .insert({
      name: parsed.data.name,
      config: parsed.data.config as unknown as Json,
      created_by: admin.userId,
    })
    .select("id, name, created_at")
    .single();

  if (error || !data) {
    return { success: false, error: isMissingTable(error) ? MIGRATION_HINT : "Không lưu được mẫu" };
  }

  return {
    success: true,
    data: { id: data.id, name: data.name, config: parsed.data.config, createdAt: data.created_at },
  };
}

export async function archiveThemePresetAction(id: string): Promise<ActionResult<null>> {
  if (!z.uuid().safeParse(id).success) return { success: false, error: "ID mẫu không hợp lệ" };

  const admin = await getCurrentAdmin();
  if (!admin) return { success: false, error: SESSION_ERROR };

  const db = createSupabaseAdminClient();
  const { error } = await db
    .from("theme_presets")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .is("archived_at", null);

  if (error) {
    return { success: false, error: isMissingTable(error) ? MIGRATION_HINT : "Không xoá được mẫu" };
  }
  return { success: true, data: null };
}
