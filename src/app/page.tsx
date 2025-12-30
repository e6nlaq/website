import dynamic from "next/dynamic";
import Link from "next/link";
import Icon from "@/assets/icon.svg";
import { Button } from "@/components/ui/button";
import { SpinningText } from "@/components/ui/spinning-text";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Accounts from "./_index/accounts";

const Greet = dynamic(() => import("./_index/greet"));

export default function Page() {
    return (
        <div className="flex flex-col justify-center items-center gap-8">
            <div className="relative flex items-center justify-center w-48 h-48">
                <SpinningText duration={10} reverse={false} radius={5}>
                    e6nlaq • e6nlaq • e6nlaq •
                </SpinningText>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Icon width={48} height={48} className="w-18 h-18" />
                </div>
            </div>

            <Greet />
            <Accounts />

            <div className="flex gap-4 mt-4">
                <Tooltip>
                    <TooltipTrigger>
                        <Button disabled>About Me</Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">工事中</TooltipContent>
                </Tooltip>
                <Button asChild>
                    <Link href="/tools">Tools</Link>
                </Button>
            </div>
        </div>
    );
}
