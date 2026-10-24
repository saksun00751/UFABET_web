import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { themePresetScript } from "@/components/providers/theme-preset";
import { DEFAULT_PRESET } from "@/lib/themes";
import { BrandProvider } from "@/components/providers/brand";
import { getBranding } from "@/lib/api/branding";

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBranding();
  return {
    title: { default: b.name, template: `%s · ${b.name}` },
    description: b.desc || "Royal Casino — คาสิโนออนไลน์ระดับพรีเมียม บาคาร่า สล็อต ยิงปลา เกมไพ่ และกีฬา",
    ...(b.logo ? { icons: { icon: b.logo } } : {}),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070708" },
    { media: "(prefers-color-scheme: light)", color: "#F6F0E2" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBranding();
  return (
    <html lang="th" data-theme={DEFAULT_PRESET} className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themePresetScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700;800;900&display=swap"
        />
      </head>
      <body>
        <BrandProvider value={{ name: brand.name, logo: brand.logo }}>
          <Providers>{children}</Providers>
        </BrandProvider>
      </body>
    </html>
  );
}
