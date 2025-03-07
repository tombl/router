import { assertEquals } from "jsr:@std/assert";
import { Router } from "./http.ts";

Deno.test("HTTP router handles basic routes with different methods", async () => {
  const router = new Router();

  router.get("hello", (_req) => new Response("GET hello"));
  router.post("hello", (_req) => new Response("POST hello"));
  router.put("hello", (_req) => new Response("PUT hello"));

  // Test GET request
  const getReq = new Request("https://example.com/hello", { method: "GET" });
  const getRes = await router.fetch(getReq);
  assertEquals(await getRes.text(), "GET hello");

  // Test POST request
  const postReq = new Request("https://example.com/hello", { method: "POST" });
  const postRes = await router.fetch(postReq);
  assertEquals(await postRes.text(), "POST hello");

  // Test PUT request
  const putReq = new Request("https://example.com/hello", { method: "PUT" });
  const putRes = await router.fetch(putReq);
  assertEquals(await putRes.text(), "PUT hello");
});

Deno.test("HTTP router handles parameters in routes", async () => {
  const router = new Router();

  router.get("user/:id", (req) => {
    return new Response(`User ID: ${req.params.id}`);
  });

  router.get("post/:year/:month/:slug", (req) => {
    const { year, month, slug } = req.params;
    return new Response(`Post: ${slug} from ${month}/${year}`);
  });

  // Test simple parameter
  const userReq = new Request("https://example.com/user/123", {
    method: "GET",
  });
  const userRes = await router.fetch(userReq);
  assertEquals(await userRes.text(), "User ID: 123");

  // Test multiple parameters
  const postReq = new Request("https://example.com/post/2023/06/hello-world", {
    method: "GET",
  });
  const postRes = await router.fetch(postReq);
  assertEquals(await postRes.text(), "Post: hello-world from 06/2023");
});

Deno.test("HTTP router handles 404 not found", async () => {
  const router = new Router();

  router.get("home", () => new Response("Home"));

  const req = new Request("https://example.com/unknown", { method: "GET" });
  const res = await router.fetch(req);

  assertEquals(res.status, 404);
});

Deno.test("HTTP router handles 405 method not allowed", async () => {
  const router = new Router();

  router.get("api", () => new Response("GET API"));
  // Only define GET, not POST

  const req = new Request("https://example.com/api", { method: "POST" });
  const res = await router.fetch(req);

  assertEquals(res.status, 405);
});

Deno.test("HTTP router with custom not found handler", async () => {
  const router = new Router({
    notFound: () => new Response("Custom not found page", { status: 404 }),
  });

  router.get("home", () => new Response("Home"));

  const req = new Request("https://example.com/unknown", { method: "GET" });
  const res = await router.fetch(req);

  assertEquals(res.status, 404);
  assertEquals(await res.text(), "Custom not found page");
});

Deno.test("HTTP router allows async handlers", async () => {
  const router = new Router();

  router.get("async", async (_req) => {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));
    return new Response("Async response");
  });

  const req = new Request("https://example.com/async", { method: "GET" });
  const res = await router.fetch(req);

  assertEquals(await res.text(), "Async response");
});

Deno.test("HTTP router allows splat routes", async () => {
  const router = new Router();

  router.get("files/*", (req) => {
    return new Response(`File: ${req.params["*"]}`);
  });

  const req = new Request("https://example.com/files/documents/report.pdf", {
    method: "GET",
  });
  const res = await router.fetch(req);

  assertEquals(await res.text(), "File: documents/report.pdf");
});

Deno.test("HTTP router invalidates routes when adding new ones", async () => {
  const router = new Router();

  router.get("test", () => new Response("Original"));

  // First request should use original handler
  const req1 = new Request("https://example.com/test", { method: "GET" });
  const res1 = await router.fetch(req1);
  assertEquals(await res1.text(), "Original");

  // Add a new route which should invalidate the router
  router.get("test", () => new Response("Updated"));

  // Second request should use updated handler
  const req2 = new Request("https://example.com/test", { method: "GET" });
  const res2 = await router.fetch(req2);
  assertEquals(await res2.text(), "Updated");
});
