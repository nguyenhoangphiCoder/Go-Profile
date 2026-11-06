import { describe, it, expect, vi } from "vitest";
import {
  isBotUserAgent,
  isPrefetchRequest,
  shouldSkipClickTracking,
} from "@/features/public/bot-detector";

vi.mock("@/lib/supabase/privileged", () => ({
  createSupabaseAdminClient: () => ({
    rpc: vi.fn((fnName: string) => {
      if (fnName === "resolve_public_link") {
        return Promise.resolve({
          data: {
            valid: true,
            target_url: "https://shopee.vn/gocafe",
            revision_id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
            kind: "standard",
          },
          error: null,
        });
      }
      if (fnName === "record_click") {
        return Promise.reject(new Error("Database connection timeout simulation"));
      }
      return Promise.resolve({ data: null, error: null });
    }),
  }),
}));

import { resolveAndRecordClick } from "@/features/public/queries";

describe("Phase 07 — Public & Click Tracking Validation", () => {
  describe("Bot & Crawler Detection (P07.07)", () => {
    it("nhận diện chính xác các bot và crawler tìm kiếm phổ biến", () => {
      const botUAs = [
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Twitterbot/1.0",
        "TelegramBot (like TwitterBot)",
        "WhatsApp/2.21.12.21 A",
        "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
        "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
        "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
        "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
      ];

      for (const ua of botUAs) {
        expect(isBotUserAgent(ua)).toBe(true);
      }
    });

    it("không đánh dấu nhầm trình duyệt của người dùng thực là bot", () => {
      const realUAs = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0",
      ];

      for (const ua of realUAs) {
        expect(isBotUserAgent(ua)).toBe(false);
      }
    });

    it("xử lý an toàn khi User-Agent bị rỗng hoặc undefined", () => {
      expect(isBotUserAgent(null)).toBe(false);
      expect(isBotUserAgent(undefined)).toBe(false);
      expect(isBotUserAgent("")).toBe(false);
    });
  });

  describe("Prefetch & Preview Detection (P07.05, P07.07)", () => {
    it("phát hiện yêu cầu prefetch từ các header đặc trưng", () => {
      const headersWithPurpose = new Headers({ purpose: "prefetch" });
      expect(isPrefetchRequest(headersWithPurpose)).toBe(true);

      const headersWithSecPurpose = new Headers({ "sec-purpose": "prefetch" });
      expect(isPrefetchRequest(headersWithSecPurpose)).toBe(true);

      const headersWithXMoz = new Headers({ "x-moz": "prefetch" });
      expect(isPrefetchRequest(headersWithXMoz)).toBe(true);

      const headersWithPreview = new Headers({ "x-purpose": "preview" });
      expect(isPrefetchRequest(headersWithPreview)).toBe(true);
    });

    it("xác nhận false đối với yêu cầu điều hướng thông thường", () => {
      const normalHeaders = new Headers({
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0",
      });
      expect(isPrefetchRequest(normalHeaders)).toBe(false);
    });
  });

  describe("Quyết định bỏ qua click tracking (shouldSkipClickTracking)", () => {
    it("bỏ qua ghi nhận click khi phương thức HTTP là HEAD", () => {
      const headers = new Headers();
      expect(shouldSkipClickTracking("HEAD", headers, "Mozilla/5.0")).toBe(true);
      expect(shouldSkipClickTracking("head", headers, "Mozilla/5.0")).toBe(true);
    });

    it("bỏ qua ghi nhận click khi request là prefetch", () => {
      const headers = new Headers({ purpose: "prefetch" });
      expect(shouldSkipClickTracking("GET", headers, "Mozilla/5.0")).toBe(true);
    });

    it("bỏ qua ghi nhận click khi request đến từ bot", () => {
      const headers = new Headers();
      expect(
        shouldSkipClickTracking(
          "GET",
          headers,
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        )
      ).toBe(true);
    });

    it("ghi nhận click bình thường cho người dùng thực duyệt web qua GET", () => {
      const headers = new Headers({ accept: "text/html" });
      const realUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36";
      expect(shouldSkipClickTracking("GET", headers, realUA)).toBe(false);
    });
  });

  describe("Khả năng phục hồi khi lỗi ghi click (P07.06)", () => {
    it("vẫn trả về target_url mở đích thành công ngay cả khi record_click gặp lỗi hoặc ném ngoại lệ", async () => {
      const fakePageLinkId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      // skipTracking = false sẽ kích hoạt record_click, vốn đang giả lập ném lỗi
      const res = await resolveAndRecordClick(fakePageLinkId, false);

      expect(res.valid).toBe(true);
      expect(res.targetUrl).toBe("https://shopee.vn/gocafe");
      expect(res.kind).toBe("standard");
    });
  });
});
