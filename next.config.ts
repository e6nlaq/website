import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        disableStaticImages: true,
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
