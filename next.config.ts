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
};

export default nextConfig;
