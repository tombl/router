#!/usr/bin/env -S deno serve --watch
import { createHttpRouter } from "../http.ts";

const router = createHttpRouter({
  routes: {
    "/": {
      GET(req) {
        return new Response(`Hello, ${req.url}`);
      },
      async POST(req) {
        return new Response(await req.text());
      },
    },
    "/about": new Response("About page content"),
    "/:id": (req) => {
      return new Response(`Hello, ${req.params.id}`);
    },
  },
  notFound(req) {
    return new Response(`Not found: ${new URL(req.url).pathname}`, {
      status: 404,
    });
  },
  wrongMethod(req) {
    return new Response(
      `Method ${req.method} not allowed for ${new URL(req.url).pathname}`,
      { status: 405 },
    );
  },
});

export default router;
