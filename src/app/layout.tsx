import { Source_Code_Pro } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics, SpeedInsights } from "@/components/analytics";
import "./globals.css";
import localFont from "next/font/local";
import { Nav } from "@/components/nav";
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDialogProvider } from "@/hooks/useConfirm";
import { convertMetadata } from "@/lib/metadata";
import { toolMeta } from "@/text/meta";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { Viewport } from "next";

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
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-code",
});

export const metadata = convertMetadata(
  Object.assign({}, toolMeta[""], {
    title: "e6nlaq's Lab",
  })
);

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
      className={cn("hidden-scrollbar", "font-sans")}
    >
      <body
        className={`${lineSeed.className} ${sourceCodePro.variable} antialiased `}
      >
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
                <Nav fontClass={sourceCodePro.className} />

                <main className="flex justify-center items-center w-screen py-16 px-4 grow">
                  {children}
                  <Toaster richColors />
                </main>
                <footer className="mt-auto">
                  <div className="flex flex-col justify-center items-center py-4">
                    <p className={`${sourceCodePro.className}  text-sm`}>
                      (C){" "}
                      <Tooltip>
                        <TooltipTrigger render={<span>{buildYear}</span>} />
                        <TooltipContent>
                          {buildTime.toLocaleString("ja-JP", {
                            timeZone: "Asia/Tokyo",
                          })}
                          (UTC+9)
                        </TooltipContent>
                      </Tooltip>{" "}
                      e6nlaq
                      <a
                        href="https://github.com/e6nlaq/website"
                        className={cn(buttonVariants({ variant: "link" }))}
                        target="_blank"
                        rel="noreferrer"
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
