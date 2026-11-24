import { describe, expect, it } from "vitest";
import { canUseWorkspaceFeature, checkWorkspaceQuota } from "@/features/workspace/guards";
import { normalizeWorkspaceFeatures, PLAN_PRESETS } from "@/features/workspace/types";

describe("Multi-Tenant Feature Flags & Quota Guards (MT-2)", () => {
  it("chuẩn hóa workspace.features an toàn khi dữ liệu null/rỗng/thiếu trường", () => {
    expect(normalizeWorkspaceFeatures(null)).toEqual({
      landing: true,
      branches: true,
      leads: true,
      tracking: true,
      customDomains: false,
    });
    expect(normalizeWorkspaceFeatures({ branches: false, customDomains: true })).toEqual({
      landing: true,
      branches: false,
      leads: true,
      tracking: true,
      customDomains: true,
    });
  });

  it("chặn Tenant gói Free truy cập branches & leads, nhưng vẫn cho phép landing", () => {
    const freeCtx = {
      isPlatformAdmin: false,
      workspace: { features: PLAN_PRESETS.free.features },
    };
    expect(canUseWorkspaceFeature(freeCtx, "landing")).toBe(true);
    expect(canUseWorkspaceFeature(freeCtx, "branches")).toBe(false);
    expect(canUseWorkspaceFeature(freeCtx, "leads")).toBe(false);
    expect(canUseWorkspaceFeature(freeCtx, "customDomains")).toBe(false);
  });

  it("SuperAdmin luôn được phép truy cập mọi tính năng để cấu hình hộ Tenant", () => {
    const superOnFreeCtx = {
      isPlatformAdmin: true,
      workspace: { features: PLAN_PRESETS.free.features },
    };
    expect(canUseWorkspaceFeature(superOnFreeCtx, "branches")).toBe(true);
    expect(canUseWorkspaceFeature(superOnFreeCtx, "leads")).toBe(true);
    expect(canUseWorkspaceFeature(superOnFreeCtx, "customDomains")).toBe(true);
  });

  it("chặn vượt hạn mức max_shells và max_branches với Tenant thường", () => {
    expect(
      checkWorkspaceQuota({
        isPlatformAdmin: false,
        current: 1,
        max: 1,
        resourceLabel: "bộ giao diện (Site Shell)",
      })
    ).toEqual({
      ok: false,
      error: expect.stringMatching(/tối đa 1 bộ giao diện/),
    });

    expect(
      checkWorkspaceQuota({
        isPlatformAdmin: false,
        current: 8,
        max: 10,
        adding: 3,
        resourceLabel: "chi nhánh",
      })
    ).toEqual({
      ok: false,
      error: expect.stringMatching(/tối đa 10 chi nhánh/),
    });

    expect(
      checkWorkspaceQuota({
        isPlatformAdmin: false,
        current: 7,
        max: 10,
        adding: 3,
        resourceLabel: "chi nhánh",
      })
    ).toEqual({ ok: true });
  });

  it("SuperAdmin được bỏ qua giới hạn quota khi cấu hình hộ", () => {
    expect(
      checkWorkspaceQuota({
        isPlatformAdmin: true,
        current: 5,
        max: 1,
        resourceLabel: "bộ giao diện (Site Shell)",
      })
    ).toEqual({ ok: true });
  });
});
