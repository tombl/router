import { assertEquals } from "jsr:@std/assert";
import { createHttpRouter } from "./http.ts";

Deno.test("HTTP router handles basic routes with different methods", async () => {
  const router = createHttpRouter({
    routes: {
      "/hello": {
        GET: (_req) => new Response("GET hello"),
        POST: (_req) => new Response("POST hello"),
        PUT: (_req) => new Response("PUT hello"),
      },
    },
  });

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
  const router = createHttpRouter({
    routes: {
      "/user/:id": (req) => {
        return new Response(`User ID: ${req.params.id}`);
      },
      "/post/:year/:month/:slug": (req) => {
        const { year, month, slug } = req.params;
        return new Response(`Post: ${slug} from ${month}/${year}`);
      },
    },
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
  const router = createHttpRouter({
    routes: {
      "/home": () => new Response("Home"),
    },
  });

  const req = new Request("https://example.com/unknown", { method: "GET" });
  const res = await router.fetch(req);

  assertEquals(res.status, 404);
});

Deno.test("HTTP router handles 405 method not allowed", async () => {
  const router = createHttpRouter({
    routes: {
      "/api": {
        GET: () => new Response("GET API"),
        // Only define GET, not POST
      },
    },
  });

  const req = new Request("https://example.com/api", { method: "POST" });
  const res = await router.fetch(req);

  assertEquals(res.status, 405);
});

Deno.test("HTTP router with custom not found handler", async () => {
  const router = createHttpRouter({
    routes: {
      "/home": () => new Response("Home"),
    },
    notFound: () => new Response("Custom not found page", { status: 404 }),
  });

  const req = new Request("https://example.com/unknown", { method: "GET" });
  const res = await router.fetch(req);

  assertEquals(res.status, 404);
  assertEquals(await res.text(), "Custom not found page");
});

Deno.test("HTTP router with custom wrong method handler", async () => {
  const router = createHttpRouter({
    routes: {
      "/api": {
        GET: () => new Response("GET API"),
        // Only define GET, not POST
      },
    },
    wrongMethod: (req) =>
      new Response(
        `Custom wrong method: ${req.method}`,
        { status: 405 },
      ),
  });

  const req = new Request("https://example.com/api", { method: "POST" });
  const res = await router.fetch(req);

  assertEquals(res.status, 405);
  assertEquals(await res.text(), "Custom wrong method: POST");
});

Deno.test("HTTP router allows async handlers", async () => {
  const router = createHttpRouter({
    routes: {
      "/async": {
        GET: async (_req) => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));
          return new Response("Async response");
        },
      },
    },
  });

  const req = new Request("https://example.com/async", { method: "GET" });
  const res = await router.fetch(req);

  assertEquals(await res.text(), "Async response");
});

Deno.test("HTTP router allows splat routes", async () => {
  const router = createHttpRouter({
    routes: {
      "/files/*": (req) => {
        return new Response(`File: ${req.params["*"]}`);
      },
    },
  });

  const req = new Request("https://example.com/files/documents/report.pdf", {
    method: "GET",
  });
  const res = await router.fetch(req);

  assertEquals(await res.text(), "File: documents/report.pdf");
});

Deno.test("HTTP router supports static Response objects for GET requests", async () => {
  const staticResponse = new Response("Static content");

  const router = createHttpRouter({
    routes: {
      "/static": staticResponse,
    },
  });

  // First request should get a clone of the response
  const req1 = new Request("https://example.com/static", { method: "GET" });
  const res1 = await router.fetch(req1);
  assertEquals(await res1.text(), "Static content");

  // Second request should also work (proving it was cloned)
  const req2 = new Request("https://example.com/static", { method: "GET" });
  const res2 = await router.fetch(req2);
  assertEquals(await res2.text(), "Static content");

  // Non-GET requests to static responses should return 405 Method Not Allowed
  const postReq = new Request("https://example.com/static", { method: "POST" });
  const postRes = await router.fetch(postReq);
  assertEquals(postRes.status, 405);
});

Deno.test("HTTP router handles mixed route styles", async () => {
  const router = createHttpRouter({
    routes: {
      "/function": (_req) => new Response("Function handler"),
      "/methods": {
        GET: () => new Response("GET handler"),
        POST: () => new Response("POST handler"),
      },
      "/static": new Response("Static response"),
    },
  });

  // Test function handler
  const funcReq = new Request("https://example.com/function", {
    method: "GET",
  });
  const funcRes = await router.fetch(funcReq);
  assertEquals(await funcRes.text(), "Function handler");

  // Test method handlers
  const getReq = new Request("https://example.com/methods", { method: "GET" });
  const getRes = await router.fetch(getReq);
  assertEquals(await getRes.text(), "GET handler");

  const postReq = new Request("https://example.com/methods", {
    method: "POST",
  });
  const postRes = await router.fetch(postReq);
  assertEquals(await postRes.text(), "POST handler");

  // Test static response
  const staticReq = new Request("https://example.com/static", {
    method: "GET",
  });
  const staticRes = await router.fetch(staticReq);
  assertEquals(await staticRes.text(), "Static response");
});
