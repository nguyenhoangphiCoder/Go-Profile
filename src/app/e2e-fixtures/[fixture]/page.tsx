import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageRenderer } from "@/features/renderer/page-renderer";
import {
  FIXTURE_BLOCKS,
  FIXTURE_THEMES,
  renderFixturesEnabled,
} from "@/features/renderer/fixtures";

/**
 * Trang dữ liệu mẫu cho test giao diện tự động (tests/e2e/visual.spec.ts).
 * Không đọc database. Tắt trên production trừ khi đặt ENABLE_RENDER_FIXTURES=1.
 */
export const metadata: Metadata = {
  title: "Render fixture",
  robots: { index: false, follow: false },
};

interface FixturePageProps {
  params: Promise<{ fixture: string }>;
}

// Giống trang [slug]: không stream khung trang trước, để notFound() trả đúng mã 404
export const instant = false;

export function generateStaticParams() {
  return Object.keys(FIXTURE_THEMES).map((fixture) => ({ fixture }));
}

export default async function RenderFixturePage({ params }: FixturePageProps) {
  const { fixture } = await params;
  const theme = FIXTURE_THEMES[fixture];
  if (!renderFixturesEnabled() || !theme) notFound();

  return <PageRenderer mode="public" title="Gờ Cafe" theme={theme} blocks={FIXTURE_BLOCKS} />;
}
