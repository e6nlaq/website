import { Source_Code_Pro } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    const buildTime = new Date();
    const buildYear = buildTime
        .toLocaleDateString("ja-JP", {
            timeZone: "Asia/Tokyo",
        })
        .substring(0, 4);

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
                                <Nav fontClass={sourceCodePro.className} />

                                <main className="flex justify-center items-center w-screen py-16 px-4 grow">
                                    {children}
                                    <Toaster richColors />
                                </main>
                                <footer className="mt-auto">
                                    <div className="flex flex-col justify-center items-center py-4">
                                        <p
                                            className={`${sourceCodePro.className}  text-sm`}
                                        >
                                            (C){" "}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span>{buildYear}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {buildTime.toLocaleString(
                                                        "ja-JP",
                                                        {
                                                            timeZone:
                                                                "Asia/Tokyo",
                                                        }
                                                    )}
                                                    (UTC+9)
                                                </TooltipContent>
                                            </Tooltip>{" "}
                                            e6nlaq
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
