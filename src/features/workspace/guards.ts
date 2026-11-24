import type { WorkspaceFeatures } from "./types";

export const FEATURE_DISABLED_MESSAGES: Record<keyof WorkspaceFeatures, string> = {
  landing:
    "Tính năng Cấu hình Website & Landing Page hiện chưa được bật cho gói dịch vụ của Workspace này.",
  branches:
    "Tính năng Quản lý Hệ thống Chi nhánh & Bản đồ hiện chưa được bật cho gói dịch vụ của Workspace này.",
  leads:
    "Tính năng Quản lý Khách hàng tiềm năng (Leads) hiện chưa được bật cho gói dịch vụ của Workspace này.",
  tracking:
    "Tính năng Marketing Pixels (GA4 / Meta / TikTok) hiện chưa được bật cho gói dịch vụ của Workspace này.",
  customDomains:
    "Tính năng Tên miền riêng (Custom Domain) hiện chưa được bật cho gói dịch vụ của Workspace này.",
};

/**
 * Kiểm tra workspace hiện tại có được phép sử dụng tính năng `feature` hay không.
 * SuperAdmin luôn được phép truy cập để cấu hình hộ Tenant.
 */
export function canUseWorkspaceFeature(
  ctx: { isPlatformAdmin: boolean; workspace: { features: WorkspaceFeatures } },
  feature: keyof WorkspaceFeatures
): boolean {
  if (ctx.isPlatformAdmin) return true;
  return Boolean(ctx.workspace.features[feature]);
}

/**
 * Kiểm tra hạn mức tài nguyên (quota) trước khi tạo thêm bản ghi.
 * SuperAdmin luôn được bỏ qua giới hạn để hỗ trợ vận hành.
 */
export function checkWorkspaceQuota(params: {
  isPlatformAdmin: boolean;
  current: number;
  max: number;
  adding?: number;
  resourceLabel: string;
}): { ok: true } | { ok: false; error: string } {
  if (params.isPlatformAdmin) return { ok: true };
  const adding = params.adding ?? 1;
  if (params.current + adding > params.max) {
    return {
      ok: false,
      error: `Workspace đã đạt giới hạn tối đa ${params.max} ${params.resourceLabel} theo gói hiện tại. Vui lòng liên hệ SuperAdmin để nâng cấp gói.`,
    };
  }
  return { ok: true };
}
