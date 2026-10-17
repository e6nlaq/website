import NoneStyle from "@/lib/layout";
import { convertMetadata } from "@/lib/metadata";
import { toolMeta } from "@/text/meta";

export const metadata = convertMetadata(toolMeta.tools, "tools");
export default NoneStyle;
