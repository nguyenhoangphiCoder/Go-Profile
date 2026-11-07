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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-linear-to-b from-blue-50/70 via-white to-white">
      <div className="max-w-md w-full p-8 rounded-3xl border border-blue-100 bg-white shadow-lg shadow-blue-500/5 space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
          <Coffee className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{siteConfig.name}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{siteConfig.description}</p>
        </div>
        <div className="pt-2">
          <Link
            href={`/${siteConfig.defaultSlug}`}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-colors"
          >
            <span>Khám phá Gờ Cafe ({siteConfig.defaultSlug})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
