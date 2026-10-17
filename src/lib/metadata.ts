import type { Metadata } from "next";
import { isOgImageTarget, ogImageUrl } from "@/lib/og";
import { siteUrl, toolMeta, type ToolKeys } from "@/text/meta";
import type { ToolMeta } from "@/types/meta";

export function convertMetadata(
  key: ToolKeys,
  overrides?: Partial<ToolMeta>
): Metadata {
  const meta: ToolMeta = Object.assign({}, toolMeta[key], overrides);
  const icon = meta.logo ?? "/favicon.svg";
  const title =
    meta.title + (meta.title !== "e6nlaq's Lab" ? " - e6nlaq's Lab" : "");
  const ogImage = key && isOgImageTarget(key) ? ogImageUrl(key) : null;
  const defaultImage = `${siteUrl}/ogp_default.png`;
  return {
    title,
    description: meta.description,
    icons: icon,
    keywords: meta.keywords,
    twitter: {
      title: meta.title,
      description: meta.description,
      card: "summary_large_image",
      site: "ru_milmil",
      images: ogImage ?? defaultImage,
    },
    openGraph: {
      type: "website",
      title: meta.title,
      description: meta.description,
      images: ogImage ?? defaultImage,
    },
    robots: {
      index: meta.index ?? true,
    },
  };
}
