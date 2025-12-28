import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/teapot");

app.get("/", (c) => {
    c.status(418);
    return c.text(
        "418 I'm a teapot\nティーポットになっちゃった!\n\n余談ですが、このページを作るためだけにHonoを導入しました。\nそれだけの価値はありましたでしょうか...?\n\ne6nlaq 2025/12/18"
    );
});

export const GET = handle(app);
export const POST = handle(app);
