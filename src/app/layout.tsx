import { Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics, SpeedInsights } from "@/components/analytics";
import "./globals.css";
import localFont from "next/font/local";
import { Nav } from "@/components/nav";
import { PwaRegister } from "@/components/pwa-register";
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDialogProvider } from "@/hooks/useConfirm";
import { convertMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import type { Metadata, Viewport } from "next";

const lineSeed = localFont({
  src: [
    {
      path: "../font/seed/LINESeedJP_OTF_Bd.woff2",
      weight: "700",
    },
    {
      path: "../font/seed/LINESeedJP_OTF_Eb.woff2",
      weight: "800",
    },
    {
      path: "../font/seed/LINESeedJP_OTF_Rg.woff2",
      weight: "400",
    },
    {
      path: "../font/seed/LINESeedJP_OTF_Th.woff2",
      weight: "100",
    },
  ],
  variable: "--font-line-seed",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  ...convertMetadata("", {
    title: "e6nlaq's Lab",
  }),
  appleWebApp: {
    capable: true,
    title: "e6nlaq's Lab",
    statusBarStyle: "default",
  },
  // Next.js は標準名の mobile-web-app-capable しか出力しないため、
  // 古い iOS 向けに Apple 独自のメタタグも併記する
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const buildTime = new Date();
const buildYear = buildTime
  .toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  })
  .substring(0, 4);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={cn(
        "hidden-scrollbar",
        "font-sans",
        lineSeed.variable,
        geistMono.variable
      )}
    >
      <body className={`${lineSeed.className} antialiased`}>
        <PwaRegister />
        <Analytics />
        <SpeedInsights />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={100}>
            <ConfirmDialogProvider>
              <div className="min-h-svh flex flex-col">
                <Nav />

                <main className="flex justify-center items-center w-screen py-16 px-4 grow">
                  {children}
                  <Toaster richColors />
                </main>
                <footer className="mt-auto">
                  <div className="flex flex-col justify-center items-center py-4">
                    <p className="font-code text-sm">
                      (C){" "}
                      <Tooltip>
                        <TooltipTrigger render={<span>{buildYear}</span>} />
                        <TooltipContent className="font-code tabular-nums">
                          {buildTime.toLocaleString("ja-JP", {
                            timeZone: "Asia/Tokyo",
                          })}
                          (UTC+9)
                        </TooltipContent>
                      </Tooltip>{" "}
                      e6nlaq
                      {" - "}
                      <a
                        href="https://github.com/e6nlaq/website"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        Source
                      </a>
                    </p>
                  </div>
                </footer>
              </div>
            </ConfirmDialogProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
