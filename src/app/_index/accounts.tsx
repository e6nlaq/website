"use client";

import {
  SiCodeforces,
  SiDiscord,
  SiGithub,
  SiGreasyfork,
  SiQiita,
  SiScratch,
  SiX,
  SiYoutube,
  SiZenn,
} from "@icons-pack/react-simple-icons";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "cn";

interface AccountsProps {
  node: React.ReactNode;
  id: string;
  href: string;
  label: string;
}

function AtCoderIcon() {
  return (
    <div className="relative h-5 w-5">
      <Image
        src="/atcoder/logo_white.png"
        alt=""
        fill
        className="hidden object-contain dark:block"
        sizes="20px"
      />
      <Image
        src="/atcoder/logo_transparent.png"
        alt="AtCoder"
        fill
        className="block object-contain dark:hidden"
        sizes="20px"
      />
    </div>
  );
}

const accounts: AccountsProps[] = [
  {
    node: <SiX />,
    id: "ru_milmil",
    href: "https://x.com/ru_milmil",
    label: "X (@ru_milmil)",
  },
  {
    node: <AtCoderIcon />,
    id: "x__0",
    href: "https://atcoder.jp/users/x__0",
    label: "AtCoder (x__0)",
  },
  {
    node: <SiCodeforces />,
    id: "e6nlaq",
    href: "https://codeforces.com/profile/e6nlaq",
    label: "Codeforces (e6nlaq)",
  },
  {
    node: <SiGithub />,
    id: "e6nlaq",
    href: "https://github.com/e6nlaq",
    label: "GitHub (e6nlaq)",
  },
  {
    node: <SiGreasyfork />,
    id: "1572416-e6nlaq",
    href: "https://greasyfork.org/ja/users/1572416-e6nlaq",
    label: "Greasy Fork (e6nlaq)",
  },
  {
    node: <SiYoutube />,
    id: "e6nlaq",
    href: "https://www.youtube.com/@e6nlaq",
    label: "YouTube (@e6nlaq)",
  },
  {
    node: <SiDiscord />,
    id: "e6nlaq",
    href: "https://discord.com/users/1171719078352785452",
    label: "Discord (e6nlaq)",
  },
  {
    node: <SiQiita />,
    id: "e6nlaq",
    href: "https://qiita.com/e6nlaq",
    label: "Qiita (e6nlaq)",
  },
  {
    node: <SiZenn />,
    id: "e6nlaq",
    href: "https://zenn.dev/e6nlaq",
    label: "Zenn (e6nlaq)",
  },
  {
    node: <SiScratch />,
    id: "sakamotor",
    href: "https://scratch.mit.edu/users/sakamotor",
    label: "Scratch (sakamotor)",
  },
];

export default function Accounts() {
  return (
    <div className="flex flex-row gap-2 flex-wrap justify-center">
      {accounts.map((account) => (
        <Tooltip key={account.label}>
          <TooltipTrigger
            render={
              <a
                href={account.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={account.label}
                className={cn(
                  buttonVariants({
                    size: "icon-lg",
                    variant: "outline",
                  })
                )}
              >
                {account.node}
              </a>
            }
          />
          <TooltipContent side="bottom" className="font-code font-semibold">
            {account.id}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
