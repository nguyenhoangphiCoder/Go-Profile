import { redirect } from "next/navigation";
import Link from "next/link";
import { Coffee, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { fetchPublicPage } from "@/features/public/queries";

export const instant = false;

export default async function HomePage() {
  const defaultPage = await fetchPublicPage(siteConfig.defaultSlug);
  if (defaultPage.found && !defaultPage.is_alias) {
    redirect(`/${defaultPage.slug || siteConfig.defaultSlug}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Coffee className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{siteConfig.name}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{siteConfig.description}</p>
        </div>
        <div className="pt-2">
          <Link
            href={`/${siteConfig.defaultSlug}`}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span>Khám phá Gờ Cafe ({siteConfig.defaultSlug})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
