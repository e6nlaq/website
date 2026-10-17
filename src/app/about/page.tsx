import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { convertMetadata } from "@/lib/metadata";
import { toolMeta } from "@/text/meta";

export const metadata = convertMetadata(toolMeta.about, "about");

export default function About() {
  return (
    <div className="flex flex-wrap w-full justify-center gap-8">
      <Card>
        <CardHeader>
          <CardTitle>About e6nlaq</CardTitle>
          <CardDescription>e6nlaqとは?</CardDescription>
        </CardHeader>
        <CardContent>
          <p>日本の学生プログラマーです。</p>
          <p>競技プログラミングやWeb開発を主力として活動しています。</p>
          <p>C++,TS大好きさ</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>About the Lab</CardTitle>
          <CardDescription>このサイトはなに?</CardDescription>
        </CardHeader>
        <CardContent>
          <p>私のポートフォリオ兼ツール置き場(実験場)です。</p>
          <p>ツールはご自由に使ってください。もちろん無料。</p>
          <p>ただあんまメンテナンスしないかも…</p>
          <p>バグ報告はIssueまでお願いします。</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>連絡先</CardDescription>
        </CardHeader>
        <CardContent>
          <p>XかDiscordのDMまでお願いします。</p>
          <p>Discordは基本48時間以内に応答できるはずです。</p>
          <p>Xはスパムに入ってたら見逃しちゃうかも…</p>
        </CardContent>
      </Card>
    </div>
  );
}
