#!/usr/bin/env -S deno serve --watch
import { Router } from "../http.ts";

const router = new Router();

router.get("/", (req) => {
  return new Response(`Hello, ${req.url}`);
});

router.post("/", async (req) => {
  return new Response(await req.text());
});

router.get("/:id", (req) => {
  return new Response(`Hello, ${req.params.id}`);
});

export default router;
