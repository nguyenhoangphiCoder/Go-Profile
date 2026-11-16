import { z } from "zod";
import { themeOverridesSchema } from "@/config/theme-tokens";
import { THEME_PRESETS } from "@/config/themes";

export const themePresetConfigSchema = z
  .object({
    preset: z
      .string()
      .max(64)
      .refine((key) => key in THEME_PRESETS, "Mẫu gốc không tồn tại"),
    version: z.literal(2),
    overrides: themeOverridesSchema,
  })
  .strict();

export type ThemePresetConfig = z.infer<typeof themePresetConfigSchema>;

export const saveThemePresetSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng đặt tên cho mẫu").max(60, "Tên mẫu tối đa 60 ký tự"),
  config: themePresetConfigSchema,
});

export type SaveThemePresetInput = z.infer<typeof saveThemePresetSchema>;

export interface SavedThemePreset {
  id: string;
  name: string;
  config: ThemePresetConfig;
  createdAt: string;
}
