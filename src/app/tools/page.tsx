"use client";

import {
    ImageOffIcon,
    SquareArrowOutUpRightIcon as PopupIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item";
import { type ToolKeys, toolMeta } from "@/text/meta";
import type { ToolMeta } from "@/types/meta";

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
        <Card className="w-full py-16">
            <CardContent className="px-12">
                <div className="flex flex-col gap-y-4">
                    <div className="flex items-center gap-x-4">
                        <h2 className="text-3xl font-black">{title}</h2>
                        <p className="text-xs">{description}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {children}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ToolItem({
    name,
    description,
    icon,
    href,
}: {
    name: string;
    description: string;
    icon?: string;
    href: string;
}) {
    const outerLink = href.startsWith("http");
    const LinkComponent = outerLink ? "a" : Link;

    return (
        <Item asChild variant="outline">
            <LinkComponent
                href={href}
                target={outerLink ? "_blank" : undefined}
                rel={outerLink ? "noopener noreferrer" : undefined}
            >
                {icon !== undefined ? (
                    <ItemMedia variant="image">
                        <Image
                            src={icon}
                            alt={name}
                            width={128}
                            height={128}
                            className="object-cover"
                        />
                    </ItemMedia>
                ) : (
                    <ItemMedia variant="icon">
                        <ImageOffIcon className="w-12 h-12" />
                    </ItemMedia>
                )}
                <ItemContent>
                    <ItemTitle>
                        {name}{" "}
                        {outerLink && <PopupIcon className="inline w-3 h-3" />}
                    </ItemTitle>
                    <ItemDescription className="text-pretty">
                        {description}
                    </ItemDescription>
                </ItemContent>
            </LinkComponent>
        </Item>
    );
}

export default function Tools() {
    const math: ToolKeys[] = ["tools/mod"];
    return (
        <div className="flex flex-col items-start w-full gap-y-8">
            <Store title="Math" description="数学系">
                {math.map((k) => (
                    <ToolItem
                        name={toolMeta[k].title}
                        description={toolMeta[k].description}
                        icon={(toolMeta[k] as ToolMeta).logo}
                        href={`/${k}`}
                        key={k}
                    />
                ))}
            </Store>
            <Store title="Script" description="ユーザースクリプト">
                <ToolItem
                    name="AtCoder AWC Tab"
                    description="AtCoderのナビゲーションバーに今日のAWCへのリンクを追加する"
                    href="https://greasyfork.org/ja/scripts/566748-atcoder-awc-tab"
                />
            </Store>
            <Store title="Classic" description="旧作たち">
                <ToolItem
                    name="rinu.jp Checker"
                    description="rinu.jpに特定ツールが仕込まれているかチェックする"
                    icon="https://e6nlaq.github.io/rinucf-checker/img/favicon.png"
                    href="https://e6nlaq.github.io/rinucf-checker"
                />
                <ToolItem
                    name="School Hit"
                    description="学校で日にちから指名される確率を計算する"
                    href="https://e6nlaq.github.io/school-hits"
                    icon="https://e6nlaq.github.io/school-hits/favicon.png"
                />
                <ToolItem
                    name="Study Typing"
                    description="学習向け単語タイピングサイト"
                    href="https://study-typing.vercel.app"
                    icon="https://study-typing.vercel.app/icon.svg"
                />
                <ToolItem
                    name="Aqua"
                    description={"Fast, short, and easy. を謳うクセ強自作言語"}
                    href="https://e6nlaq.github.io/aqua"
                    icon="https://e6nlaq.github.io/aqua/image/aqua.svg"
                />
                <ToolItem
                    name="Maji Alarm"
                    description="ガチのマジで絶対起こすアラーム"
                    href="https://maji-alarm.vercel.app/"
                    icon="https://maji-alarm.vercel.app/favicon.svg"
                />
                <ToolItem
                    name="e6nlaq.github.io"
                    description="旧サイト on GitHub Pages"
                    href="https://e6nlaq.github.io"
                    icon="https://e6nlaq.github.io/image/icon.png"
                />
            </Store>
        </div>
    );
}
