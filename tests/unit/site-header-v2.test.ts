import { describe, expect, it } from "vitest";
import {
  saveSiteSettingsSchema,
  siteFloatingContactSchema,
  siteHeaderConfigSchema,
} from "@/features/site/schemas";
import { SITE_HEADER_PRESETS } from "@/features/site/header-presets";

describe("Site Header & Floating Bar v2 Schemas + Presets", () => {
  it("tương thích ngược 100% với payload v1 tối giản và tự điền mặc định v2", () => {
    const parsed = saveSiteSettingsSchema.parse({
      siteName: "GỜ CAFÉ",
      headerConfig: {
        sticky: true,
        navLayout: "classic",
      },
      floatingContact: {
        enabled: true,
        phone: "0779200020",
      },
    });

    expect(parsed.headerConfig.navMaxWidth).toBe("default");
    expect(parsed.headerConfig.navBgMode).toBe("solid-color");
    expect(parsed.headerConfig.navBgOpacity).toBe(92);
    expect(parsed.headerConfig.navBlur).toBe("md");
    expect(parsed.headerConfig.ctaIcon).toBe("none");
    expect(parsed.headerConfig.ctaSecondaryEnabled).toBe(false);
    expect(parsed.headerConfig.announcementMode).toBe("static");
    expect(parsed.floatingContact.style).toBe("icon");
    expect(parsed.floatingContact.size).toBe("md");
    expect(parsed.floatingContact.visibility).toBe("all");
    expect(parsed.floatingContact.bottomOffset).toBe(20);
  });

  it("chấp nhận đầy đủ cấu hình v2 (Navbar Pro, Dual CTA, Marquee, Floating 4 chế độ)", () => {
    const res = saveSiteSettingsSchema.safeParse({
      siteName: "Gờ Luxury",
      headerConfig: {
        navLayout: "floating-pill",
        navMaxWidth: "wide",
        navBgMode: "gradient",
        navBgColor: "#2B1D14",
        navBgGradientEnd: "#1A120D",
        navBgGradientAngle: 135,
        navBgOpacity: 88,
        navBlur: "lg",
        navLetterSpacing: "wider",
        dropdownRadius: "2xl",
        mobileDrawerSide: "left",
        mobileDrawerShowContact: true,
        ctaEnabled: true,
        ctaLabel: "Nhượng quyền",
        ctaHref: "/nhuong-quyen",
        ctaIcon: "sparkles",
        ctaSize: "lg",
        ctaSecondaryEnabled: true,
        ctaSecondaryLabel: "Xem Menu",
        ctaSecondaryHref: "/menu",
        ctaSecondaryStyle: "outline",
        announcementEnabled: true,
        announcementBadge: "HOT",
        announcementText: "Miễn phí mẫu thử rang mộc 72H",
        announcementBgColor: "#111111",
        announcementBgGradientEnd: "#B88A44",
        announcementFontSize: 13,
        announcementDismissible: true,
        announcementMode: "marquee",
      },
      floatingContact: {
        enabled: true,
        position: "left",
        style: "bottom-bar",
        size: "lg",
        visibility: "all",
        bottomOffset: 32,
        sideOffset: 24,
        pulseCall: true,
        showCall: true,
        phone: "19009246",
        callLabel: "Gọi đặt bàn",
        callIconUrl: "/icons/hotline.png",
        callBgColor: "#B88A44",
        callTextColor: "#FFFFFF",
        showZalo: true,
        zaloUrl: "0779200020",
        zaloLabel: "Chat Zalo",
        zaloIconUrl: "https://cdn.example.com/zalo.png",
        zaloBgColor: "#0068FF",
        zaloTextColor: "#FFFFFF",
        customButtons: [
          {
            id: "btn-1",
            label: "Shopee",
            href: "https://shopee.vn/gocafe",
            icon: "shopee",
            imageUrl: "https://cdn.example.com/shopee.png",
            bgColor: "#EE4D2D",
            textColor: "#FFFFFF",
          },
        ],
      },
    });

    expect(res.success).toBe(true);
  });

  it("chặn mã màu độc hại, URL javascript: và giá trị vượt ngưỡng", () => {
    const badColor = siteHeaderConfigSchema.safeParse({
      navBgGradientEnd: "red; background:url(javascript:alert(1))",
    });
    expect(badColor.success).toBe(false);

    const badHref = siteHeaderConfigSchema.safeParse({
      ctaSecondaryHref: "javascript:alert(1)",
    });
    expect(badHref.success).toBe(false);

    const badOpacity = siteHeaderConfigSchema.safeParse({
      navBgOpacity: 20,
    });
    expect(badOpacity.success).toBe(false);

    const badOffset = siteFloatingContactSchema.safeParse({
      bottomOffset: 200,
    });
    expect(badOffset.success).toBe(false);
  });

  it("tất cả 6 Preset Header 1-click đều hợp lệ với Zod schema", () => {
    expect(SITE_HEADER_PRESETS).toHaveLength(6);
    for (const preset of SITE_HEADER_PRESETS) {
      const parsed = siteHeaderConfigSchema.safeParse(preset.config);
      expect(parsed.success, `Preset "${preset.id}" không hợp lệ`).toBe(true);
    }
  });
});
