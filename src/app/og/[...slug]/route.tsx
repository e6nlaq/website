import type { ToolKeys } from "@/text/meta";
import { isOgImageTarget, renderOgImage } from "@/lib/og";
import { toolMeta } from "@/text/meta";

export const dynamic = "force-static";
// generateStaticParams に無い slug(/og/wind など)は 404
export const dynamicParams = false;

export function generateStaticParams(): { slug: string[] }[] {
  return (Object.keys(toolMeta) as ToolKeys[])
    .filter((key) => isOgImageTarget(key))
    .map((key) => ({ slug: key.split("/") }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const key = slug.join("/");
  const meta = toolMeta[key as ToolKeys];

  if (!meta || !isOgImageTarget(key)) {
    return new Response("Not Found", { status: 404 });
  }

  return renderOgImage(meta);
}
