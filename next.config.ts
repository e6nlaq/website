import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        disableStaticImages: true,
        remotePatterns: [
            new URL("https://e6nlaq.github.io/**"),
            new URL("https://maji-alarm.vercel.app/**"),
            new URL("https://study-typing.vercel.app/**"),
        ],
    },
    turbopack: {
        rules: {
            "*.svg": {
                loaders: ["@svgr/webpack"],
                as: "*.js",
            },
        },
    },
};

export default nextConfig;
