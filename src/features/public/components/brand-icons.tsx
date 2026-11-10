import { Phone, Mail, MapPin, Globe, Coffee, ShoppingBag, Share2 } from "lucide-react";
import React from "react";

export function TikTokIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.58a8.3 8.3 0 0 0 4.9 1.57V6.69z" />
    </svg>
  );
}

export function ZaloIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 4C12.95 4 4 12.28 4 22.5C4 28.32 6.94 33.51 11.59 36.96L9.64 43.1C9.42 43.78 10.15 44.34 10.74 43.94L18.06 39.08C19.96 39.69 21.95 40.02 24 40.02C35.05 40.02 44 32.74 44 22.5C44 12.28 35.05 4 24 4Z"
        fill="#0068FF"
      />
      <path
        d="M34.5 18H28.8C28.36 18 28 18.36 28 18.8V26.2C28 26.64 28.36 27 28.8 27H34.5C34.94 27 35.3 26.64 35.3 26.2V18.8C35.3 18.36 34.94 18 34.5 18ZM25.2 26.5H23.5L20.2 20.3V26.5H18.7V17.5H20.4L23.7 23.7V17.5H25.2V26.5ZM17.1 27H12.2C11.8 27 11.5 26.7 11.5 26.3C11.5 26.1 11.6 25.9 11.7 25.8L15.4 20.2H12.4C12 20.2 11.6 19.8 11.6 19.4C11.6 19 12 18.6 12.4 18.6H16.8C17.2 18.6 17.5 18.9 17.5 19.3C17.5 19.5 17.4 19.7 17.3 19.8L13.6 25.4H17.1C17.5 25.4 17.9 25.8 17.9 26.2C17.9 26.6 17.5 27 17.1 27Z"
        fill="white"
      />
    </svg>
  );
}

export function ShopeeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.78 7.39a1.14 1.14 0 0 0-.96-.49h-3.15A4.67 4.67 0 0 0 12 3a4.67 4.67 0 0 0-3.67 3.9H5.18a1.14 1.14 0 0 0-.96.49 1.17 1.17 0 0 0-.17 1.07l2.25 10.5A2.32 2.32 0 0 0 8.56 21h6.88a2.32 2.32 0 0 0 2.26-2.04l2.25-10.5a1.17 1.17 0 0 0-.17-1.07zM12 4.75a2.92 2.92 0 0 1 2.35 2.15H9.65A2.92 2.92 0 0 1 12 4.75zm3.44 14.21a.58.58 0 0 1-.56.54H8.56a.58.58 0 0 1-.56-.54L5.86 8.65h12.28z" />
      <path d="M13.82 12.5a2.23 2.23 0 0 0-1.82-.9 2.45 2.45 0 0 0-2.43 2.45c0 1.93 2.5 2.05 2.5 3.12 0 .42-.36.73-.87.73a1.5 1.5 0 0 1-1.35-.85.38.38 0 0 0-.52-.16l-.8.47a.38.38 0 0 0-.15.51 2.8 2.8 0 0 0 2.76 1.58 2.27 2.27 0 0 0 2.34-2.28c0-2-2.5-2.12-2.5-3.21 0-.37.31-.65.75-.65a1.34 1.34 0 0 1 1.15.68.38.38 0 0 0 .5.16l.82-.47a.38.38 0 0 0 .17-.49 2.56 2.56 0 0 0-.54-.6z" />
    </svg>
  );
}

export function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function ChatBubbleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 9h-2V9h2v2zm-4 0H8V9h2v2zm8 0h-2V9h2v2z" />
    </svg>
  );
}

export function BeaconsLogoIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="7" cy="8" r="3.2" fill="currentColor" />
      <circle cx="17" cy="8" r="3.2" fill="currentColor" />
      <circle cx="12" cy="16" r="3.2" fill="currentColor" />
    </svg>
  );
}

export function resolveSmartIcon(
  url: string = "",
  label: string = "",
  kind: string = "standard",
  className = "w-5 h-5"
): React.ReactNode {
  const normUrl = url.toLowerCase();
  const normLabel = label.toLowerCase();

  if (normUrl.includes("tiktok.com") || normLabel.includes("tiktok")) {
    return <TikTokIcon className={className} />;
  }
  if (normLabel === "chat" || normLabel.includes("chat") || normLabel.includes("message")) {
    return <ChatBubbleIcon className={className} />;
  }
  if (normUrl.includes("zalo.me") || normUrl.includes("0779200020") || normLabel.includes("zalo")) {
    return <ZaloIcon className={className} />;
  }
  if (
    normUrl.includes("shopee.vn") ||
    normUrl.includes("shopeefood") ||
    normLabel.includes("shopee")
  ) {
    return <ShopeeIcon className={className} />;
  }
  if (normUrl.includes("facebook.com") || normLabel.includes("facebook")) {
    return <FacebookIcon className={className} />;
  }
  if (normUrl.includes("instagram.com") || normLabel.includes("instagram")) {
    return <InstagramIcon className={className} />;
  }
  if (
    normUrl.includes("maps.google") ||
    normUrl.includes("google.com/maps") ||
    normLabel.includes("chi nhánh") ||
    normLabel.includes("cửa hàng") ||
    normLabel.includes("địa chỉ")
  ) {
    return <MapPin className={className} />;
  }
  if (normUrl.startsWith("tel:") || normLabel.includes("hotline") || normLabel.includes("gọi")) {
    return <Phone className={className} />;
  }
  if (normUrl.startsWith("mailto:") || normLabel.includes("email")) {
    return <Mail className={className} />;
  }
  if (
    normLabel.includes("menu") ||
    normLabel.includes("cà phê") ||
    normLabel.includes("roastery")
  ) {
    return <Coffee className={className} />;
  }
  if (
    normLabel.includes("mua") ||
    normLabel.includes("sản phẩm") ||
    normLabel.includes("đặt hàng")
  ) {
    return <ShoppingBag className={className} />;
  }
  if (kind === "contact") {
    return <Phone className={className} />;
  }
  if (kind === "social") {
    return <Share2 className={className} />;
  }
  return <Globe className={className} />;
}
