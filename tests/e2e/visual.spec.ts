import { expect, test, type Page } from "@playwright/test";

/**
 * Test giao diện trang công khai bằng ảnh chụp, trên dữ liệu mẫu cố định (/e2e-fixtures/*).
 * Ảnh chuẩn nằm trong tests/e2e/visual.spec.ts-snapshots/.
 * Khi thay đổi giao diện có chủ đích: `pnpm test:visual:update` rồi xem lại ảnh trước khi commit.
 */

const FIXTURES = [
  "go-original",
  "beacons-dark-card",
  "beacons-portrait-card",
  "minimal-light",
  "modern-clean",
  "vibrant-contrast",
  "custom-v2",
];

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  desktop: { width: 1280, height: 900 },
} as const;

async function openFixture(page: Page, fixture: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const res = await page.goto(`/e2e-fixtures/${fixture}`);
  expect(res?.status(), "trang fixture phải bật (ENABLE_RENDER_FIXTURES=1)").toBe(200);
  await page.evaluate(() => document.fonts.ready);
  // Ảnh lazy-load: cuộn hết trang rồi chờ mọi ảnh tải xong
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true }))
      )
    );
    window.scrollTo(0, 0);
  });
}

for (const [device, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`Ảnh chụp giao diện — ${device}`, () => {
    test.use({ viewport, deviceScaleFactor: 1 });

    for (const fixture of FIXTURES) {
      test(fixture, async ({ page }) => {
        await openFixture(page, fixture);
        await expect(page).toHaveScreenshot(`${fixture}-${device}.png`, {
          fullPage: true,
          // Nội dung iframe (YouTube) tải từ mạng ngoài — che đi để ảnh ổn định
          mask: [page.locator("iframe")],
        });
      });
    }
  });
}

test.describe("Chức năng trang công khai (dữ liệu mẫu)", () => {
  test("liên kết đi qua /r/{id} để ghi nhận click và mở tab mới", async ({ page }) => {
    await openFixture(page, "go-original");
    const order = page.getByRole("link", { name: /Đặt món ngay/ });
    await expect(order).toHaveAttribute("href", "/r/fx-pl-order");
    await expect(order).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: /ShopeeFood/ })).toHaveAttribute(
      "href",
      "/r/fx-pl-shopee"
    );
  });

  test("ẩn/hiện khối theo thiết bị", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await openFixture(page, "go-original");
    await expect(page.getByText("Chỉ hiện trên điện thoại")).toBeVisible();
    await expect(page.getByText("Chỉ hiện trên máy tính")).toBeHidden();

    await page.setViewportSize(VIEWPORTS.desktop);
    await expect(page.getByText("Chỉ hiện trên điện thoại")).toBeHidden();
    await expect(page.getByText("Chỉ hiện trên máy tính")).toBeVisible();
  });

  test("video nhúng chỉ dùng domain whitelist và có sandbox", async ({ page }) => {
    await openFixture(page, "go-original");
    const iframes = page.locator("iframe");
    await expect(iframes).toHaveCount(1);
    await expect(iframes.first()).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"
    );
    await expect(iframes.first()).toHaveAttribute("sandbox", /allow-scripts/);
  });

  test("hỏi đáp mở ra khi bấm", async ({ page }) => {
    await openFixture(page, "go-original");
    const answer = page.getByText("Có, gửi xe máy miễn phí.");
    await expect(answer).toBeHidden();
    await page.getByText("Quán có chỗ đậu xe không?").click();
    await expect(answer).toBeVisible();
  });

  test("bản đồ mở Google Maps theo địa chỉ", async ({ page }) => {
    await openFixture(page, "go-original");
    await expect(page.getByRole("link", { name: /Chỉ đường đến quán/ })).toHaveAttribute(
      "href",
      /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=123/
    );
  });

  test("không có lỗi JavaScript khi tải trang", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const fixture of FIXTURES) await openFixture(page, fixture);
    expect(errors).toEqual([]);
  });

  test("fixture không tồn tại hiện trang 404 và có noindex", async ({ page }) => {
    // Với trình duyệt thường, Next.js stream metadata nên mã HTTP có thể là 200 (soft 404);
    // điều quan trọng là có thẻ noindex và giao diện "không tìm thấy".
    await page.goto("/e2e-fixtures/khong-ton-tai");
    await expect(page.getByText("Không tìm thấy trang")).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
  });
});
