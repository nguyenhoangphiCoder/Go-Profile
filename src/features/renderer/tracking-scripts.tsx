"use client";

import Script from "next/script";
import type { SiteTrackingConfig } from "@/features/site/types";

const GA4_RE = /^G-[A-Z0-9]{4,20}$/i;
const FB_RE = /^[0-9]{5,25}$/;
const TT_RE = /^[A-Z0-9]{6,30}$/i;

/**
 * Nhúng GA4 / Meta Pixel / TikTok Pixel cho trang Landing Page công khai.
 * Mọi ID đều được kiểm tra bằng regex chặt để chống tiêm mã độc (XSS).
 */
export function TrackingScripts({ tracking }: { tracking?: SiteTrackingConfig }) {
  if (!tracking) return null;
  const ga4 = tracking.ga4Id?.trim() || "";
  const fb = tracking.fbPixelId?.trim() || "";
  const tt = tracking.tiktokPixelId?.trim() || "";

  const validGa4 = GA4_RE.test(ga4) ? ga4 : "";
  const validFb = FB_RE.test(fb) ? fb : "";
  const validTt = TT_RE.test(tt) ? tt : "";

  if (!validGa4 && !validFb && !validTt) return null;

  return (
    <>
      {validGa4 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${validGa4}`}
            strategy="afterInteractive"
          />
          <Script id="gp-ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${validGa4}');`}
          </Script>
        </>
      )}

      {validFb && (
        <Script id="gp-fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${validFb}');fbq('track','PageView');`}
        </Script>
      )}

      {validTt && (
        <Script id="gp-tt-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;var n=d.createElement("script");n.type="text/javascript";n.async=!0;n.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(n,a)};ttq.load('${validTt}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}

/** Bắn sự kiện chuyển đổi Lead lên GA4 / Meta Pixel / TikTok Pixel (nếu đang gắn trên trang). */
export function fireLeadConversionEvent(formName: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track?: (...args: unknown[]) => void };
  };
  try {
    w.gtag?.("event", "generate_lead", { form_name: formName });
    w.fbq?.("track", "Lead", { content_name: formName });
    w.ttq?.track?.("SubmitForm", { content_name: formName });
  } catch {
    // ignore third-party pixel errors
  }
}
