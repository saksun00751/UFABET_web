import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { themePresetScript } from "@/components/providers/theme-preset";
import { DEFAULT_PRESET } from "@/lib/themes";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: "Royal Casino — คาสิโนออนไลน์ระดับพรีเมียม บาคาร่า สล็อต ยิงปลา เกมไพ่ และกีฬา",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070708" },
    { media: "(prefers-color-scheme: light)", color: "#F6F0E2" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" data-theme={DEFAULT_PRESET} className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themePresetScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Trirong:wght@400;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
