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
  allowedDevOrigins: ["192.168.0.8"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
