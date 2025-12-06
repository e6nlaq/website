import { Noto_Sans_JP, Source_Code_Pro } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import { Nav } from "@/components/nav";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialogProvider } from "@/hooks/useConfirm";
import { convertMetadata } from "@/lib/metadata";
import { toolMeta } from "@/text/meta";

const _notoSans = Noto_Sans_JP({
    subsets: ["latin"],
});

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
});

export const metadata = convertMetadata(
    Object.assign({}, toolMeta[""], {
        title: "e6nlaq's Lab",
    })
);

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const buildYear = new Date().getFullYear();

    return (
        <html lang="ja" suppressHydrationWarning className="hidden-scrollbar">
            <body className={`${lineSeed.className} $antialiased `}>
                <Analytics />
                <SpeedInsights />

                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TooltipProvider delayDuration={100}>
                        <ConfirmDialogProvider>
                            <div className="min-h-screen flex flex-col">
                                <Nav />

                                <div className="flex justify-center items-center w-screen py-16 px-4">
                                    {children}
                                    <Toaster richColors />
                                </div>
                                <footer className="mt-auto">
                                    <div className="flex justify-center items-center py-4">
                                        <p
                                            className={`${sourceCodePro.className}  text-sm`}
                                        >
                                            (C) {buildYear} e6nlaq
                                            <span>{" - "}</span>
                                            <a
                                                href="https://github.com/e6nlaq/website"
                                                className="text-sky-500 font-semibold"
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
