"use client";

import { ChevronDown } from "lucide-react";
import { Source_Code_Pro } from "next/font/google";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toolMeta } from "@/text/meta";

const sourceCodePro = Source_Code_Pro({
    subsets: ["latin"],
});

function Store({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children?: ReactNode;
}) {
    return (
        <div className="w-full px-8 *:my-4">
            <div className="flex items-center *:mr-4">
                <h2 className={`text-3xl font-bold ${sourceCodePro.className}`}>
                    {title}
                </h2>
                <p className="text-xs">{description}</p>
            </div>
            <div className="flex flex-wrap *:mr-8 *:mb-8">{children}</div>
        </div>
    );
}

function Item({
    name,
    description,
    url,
}: {
    name: string;
    description: string | ReactNode;
    url: string;
}) {
    return (
        <Link href={url}>
            <Card className="min-w-52">
                <CardHeader>
                    <CardTitle>
                        <span className={sourceCodePro.className}>{name}</span>
                    </CardTitle>
                </CardHeader>
                <CardFooter>
                    <CardDescription>{description}</CardDescription>
                </CardFooter>
            </Card>
        </Link>
    );
}

type ToolUrls = keyof typeof toolMeta;

export default function Home() {
    const [greeting, setGreeting] = useState("\u200b");
    const tech: ToolUrls[] = ["mod"];
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour <= 4) setGreeting("こんばんは");
        else if (hour <= 8) setGreeting("おはようございます");
        else if (hour <= 16) setGreeting("こんにちは");
        else setGreeting("こんばんは");
    });

    return (
        <div className="flex flex-col items-center *:my-10 w-full mx-16">
            <h1 className="text-6xl font-black inline-block text-transparent bg-clip-text bg-linear-to-br from-sky-400 from-0% via-fuchsia-500 via-100%">
                {greeting}
            </h1>

            <div className="flex flex-col items-center">
                <p>Labへようこそ!</p>
                <p>いっぱいツールを公開するよ</p>
            </div>

            <ChevronDown />
            <Store title="Accounts" description="生活拠点">
                <Item
                    name="X (@ru_milmil)"
                    description="たまに呟く...?"
                    url="https://x.com/ru_milmil"
                />
                <Item
                    name="GitHub (@e6nlaq)"
                    description="いろいろ作ってる"
                    url="https://github.com/e6nlaq"
                />
                <Item
                    name="AtCoder (@x__0)"
                    description="こつこつ競プロ"
                    url="https://atcoder.jp/users/x__0"
                />
                <Item
                    name="Discord (@e6nlaq)"
                    description="フレリクはご自由に(たぶん通す)"
                    url="https://discord.com/users/1171719078352785452"
                />
                <Item
                    name="Qiita (@e6nlaq)"
                    description="書くことがない..."
                    url="https://qiita.com/e6nlaq"
                />
                <Item
                    name="Duolingo (@e6nlaq)"
                    description="あいむ　すたでぃーんぐ　いんぐりっしゅ"
                    url="https://www.duolingo.com/profile/e6nlaq"
                />
                <Item
                    name="Scratch (@sakamotor)"
                    description="遺産"
                    url="https://scratch.mit.edu/users/sakamotor"
                />
            </Store>

            <Separator />

            <Store title="Tech" description="技術系">
                {tech.map((k) => (
                    <Item
                        name={toolMeta[k].title}
                        description={toolMeta[k].description}
                        url={`/${k}`}
                        key={k}
                    />
                ))}
            </Store>

            <Store title="Classic" description="旧作たち">
                <Item
                    name="rinu.jp Checker"
                    description="rinu.jpに特定ツールが仕込まれているかチェックするサイト"
                    url="https://e6nlaq.github.io/rinucf-checker"
                />
                <Item
                    name="School Hit"
                    description="学校で日にちから指名される確率を計算するサイト"
                    url="https://e6nlaq.github.io/school-hits"
                />
                <Item
                    name="Study Typing"
                    description="学習単語タイピングサイト"
                    url="https://study-typing.vercel.app"
                />
                <Item
                    name="Aqua"
                    description="Fast, short, and easy."
                    url="https://e6nlaq.github.io/aqua"
                />
                <Item
                    name="e6nlaq.github.io"
                    description="旧サイト"
                    url="https://e6nlaq.github.io"
                />
            </Store>
        </div>
    );
}
