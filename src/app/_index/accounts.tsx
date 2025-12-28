import {
    SiCodeforces,
    SiDiscord,
    SiDuolingo,
    SiGithub,
    SiQiita,
    SiScratch,
    SiX,
    SiZenn,
} from "@icons-pack/react-simple-icons";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface AccountsProps {
    node: React.ReactNode;
    key: string;
    id: string;
    href: string;
}

function AtCoder() {
    return (
        <div className="relative h-5 w-5">
            <Image
                src="/atcoder/logo_white.png"
                alt="AtCoder"
                fill
                className="hidden object-contain dark:block"
            />
            <Image
                src="/atcoder/logo_transparent.png"
                alt="AtCoder"
                fill
                className="block object-contain dark:hidden"
            />
        </div>
    );
}

export default function Accounts() {
    const accounts: AccountsProps[] = [
        {
            node: <SiX />,
            key: "x",
            id: "ru_milmil",
            href: "https://x.com/ru_milmil",
        },
        {
            node: <AtCoder />,
            key: "atcoder",
            id: "x__0",
            href: "https://atcoder.jp/users/x__0",
        },
        {
            node: <SiCodeforces />,
            key: "codeforces",
            id: "e6nlaq",
            href: "https://codeforces.com/profile/e6nlaq",
        },
        {
            node: <SiGithub />,
            key: "github",
            id: "e6nlaq",
            href: "https://github.com/e6nlaq",
        },
        {
            node: <SiDiscord />,
            key: "discord",
            id: "e6nlaq",
            href: "https://discord.com/users/1171719078352785452",
        },
        {
            node: <SiQiita />,
            key: "qiita",
            id: "e6nlaq",
            href: "https://qiita.com/e6nlaq",
        },
        {
            node: <SiZenn />,
            key: "zenn",
            id: "e6nlaq",
            href: "https://zenn.dev/e6nlaq",
        },
        {
            node: <SiDuolingo />,
            key: "duolingo",
            id: "e6nlaq",
            href: "https://www.duolingo.com/profile/e6nlaq",
        },
        {
            node: <SiScratch />,
            key: "scratch",
            id: "sakamotor",
            href: "https://scratch.mit.edu/users/sakamotor",
        },
    ];
    return (
        <div className="flex flex-row gap-2 flex-wrap justify-center">
            {accounts.map((account) => (
                <Tooltip key={account.key}>
                    <TooltipTrigger asChild>
                        <Button asChild size="icon-lg" variant="outline">
                            <a
                                href={account.href}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {account.node}
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{account.id}</TooltipContent>
                </Tooltip>
            ))}
        </div>
    );
}
