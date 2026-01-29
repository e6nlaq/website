import { Elysia } from "elysia";

const app = new Elysia({ prefix: "/teapot" }).get("/", ({ status }) => {
    return status(418, "418 I'm a teapot!!!!");
});

export const GET = app.fetch;
export const POST = app.fetch;
