import type { Metadata } from "next";
import {
  Be_Vietnam_Pro,
  Cormorant_Garamond,
  Dancing_Script,
  Great_Vibes,
  Inter,
  Josefin_Sans,
  Lexend_Deca,
  Lobster,
  Lora,
  Merriweather,
  Montserrat,
  Pacifico,
  Patrick_Hand,
  Playfair_Display,
  Quicksand,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const lexendDeca = Lexend_Deca({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-lexend-deca",
  display: "swap",
});

// Font tuỳ chọn cho trang công khai: không preload để không làm chậm các trang không dùng tới.
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair-display",
  display: "swap",
  preload: false,
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-cormorant-garamond",
  display: "swap",
  preload: false,
});

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});

const dancingScript = Dancing_Script({
  subsets: ["latin", "vietnamese"],
  variable: "--font-dancing-script",
  display: "swap",
  preload: false,
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-pacifico",
  display: "swap",
  preload: false,
});

const lobster = Lobster({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-lobster",
  display: "swap",
  preload: false,
});

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-patrick-hand",
  display: "swap",
  preload: false,
});

const josefinSans = Josefin_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-josefin-sans",
  display: "swap",
  preload: false,
});

const quicksand = Quicksand({
  subsets: ["latin", "vietnamese"],
  variable: "--font-quicksand",
  display: "swap",
  preload: false,
});

const merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-merriweather",
  display: "swap",
  preload: false,
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-great-vibes",
  display: "swap",
  preload: false,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
});

const FONT_VARIABLES = [
  beVietnamPro.variable,
  inter.variable,
  lexendDeca.variable,
  montserrat.variable,
  josefinSans.variable,
  quicksand.variable,
  spaceGrotesk.variable,
  playfairDisplay.variable,
  cormorantGaramond.variable,
  lora.variable,
  merriweather.variable,
  dancingScript.variable,
  greatVibes.variable,
  pacifico.variable,
  lobster.variable,
  patrickHand.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Gờ Cafe Profile",
  description: "Hệ thống liên kết và hồ sơ thương hiệu Gờ Cafe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${FONT_VARIABLES} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
