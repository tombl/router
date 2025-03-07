# @tombl/router

A lightweight and flexible routing library for various JavaScript environments.

[![JSR](https://jsr.io/badges/@tombl/router)](https://jsr.io/@tombl/router)

## Features

- **Lightweight**: Small footprint with no external dependencies
- **Reasonably fast**: Compiles your routes into a single regex
- **Flexible**: Supports multiple router types for different use cases
- **Modern**: Designed for Deno, Cloudflare Workers, and browser environments
- **Type-safe**: Full TypeScript support with typed route parameters

## Installation

```bash
# Deno
deno add jsr:@tombl/router

# npm
npx jsr add @tombl/router
```

## Generic Router

The core router provides pattern matching functionality that can be used in any
JavaScript environment.

```ts
import { createMatcher } from "@tombl/router/matcher";

const matcher = createMatcher({
  "/": () => "Home page",
  "/about": () => "About page",
  "/users/:id": ({ id }) => `User profile: ${id}`,
  "/files/*": ({ "*": path }) => `File: ${path}`,
});

matcher("/"); // "Home page"
matcher("/about"); // "About page"
matcher("/users/123"); // "User profile: 123"
matcher("/files/docs/readme"); // "File: docs/readme"
matcher("/unknown"); // null (no match)
```

The router supports three types of route segments:

- **Static segments**: Exact string matches (e.g., `/about`)
- **Named parameters**: Segments starting with `:` (e.g., `/:id`)
- **Splat parameter**: A `*` segment that can only appear at the end of a route

### Type-Safe Route Parameters

Route parameters are fully type-safe, with TypeScript inferring the correct
parameter types based on your route patterns:

```ts
// Parameters are automatically typed based on route patterns
const matcher = createMatcher({
  "/users/:id": (params) => `User ${params.id}`, // params is typed as { id: string }
  "/posts/:postId/comments/:commentId/*": (params) => {
    // params is typed as { postId: string, commentId: string, "*": string }
    return `Post ${params.postId}, Comment ${params.commentId}, Path: ${
      params["*"]
    }`;
  },
});

// You can also extract parameter types for use elsewhere
type UserParams = Params<"/users/:id">; // { id: string }
```

## HTTP Router

For server-side applications using the standard Request/Response API (Deno,
Cloudflare Workers,
[Node](https://www.npmjs.com/package/@mjackson/node-fetch-server), etc.)

```ts
import { createHttpRouter } from "@tombl/router/http";

const router = createHttpRouter({
  routes: {
    "/": {
      GET: (req) => new Response("Home page"),
      POST: async (req) => {
        const data = await req.json();
        return new Response("Data received", { status: 201 });
      },
    },
    "/users/:id": (req) => {
      // handle all methods in a single function
      return new Response(`User profile: ${req.params.id}`);
    },
    "/about": new Response("About page content"), // Static response (GET only)
    "/posts/:postId/comments/:commentId": {
      GET: (req) => {
        const { postId, commentId } = req.params;
        return new Response(`Post ${postId}, Comment ${commentId}`);
      },
    },
  },
  notFound: (req) => new Response("Not found", { status: 404 }),
  wrongMethod: (req) => new Response("Method not allowed", { status: 405 }),
});

// Handle requests with Deno
Deno.serve(router.fetch);

// Or export for use with Cloudflare Workers / `deno serve`
export default router;
```

## Browser Router

> [!NOTE]
> When bundled, minified, and gzipped, `@tombl/router/browser` is 1kb

For client-side single-page applications in the browser:

```ts
import { createBrowserRouter } from "@tombl/router/browser";

const router = createBrowserRouter({
  routes: {
    "/": () => {
      document.body.innerHTML = "<h1>Home Page</h1>";
    },
    "/about": () => {
      document.body.innerHTML = "<h1>About Page</h1>";
    },
    "/users/:id": ({ id }) => {
      // id is properly typed as string
      document.body.innerHTML = `<h1>User ${id}</h1>`;
    },
    "/posts/:postId/comments/:commentId": ({ postId, commentId }) => {
      // Both parameters are properly typed
      document.body.innerHTML = `<h1>Post ${postId}, Comment ${commentId}</h1>`;
    },
  },
  notFound: (pathname) => {
    document.body.innerHTML = `<h1>404 - Page not found: ${pathname}</h1>`;
  },
});

// Start the router
router.start();

// Programmatic navigation
document.querySelector("button#nav-home").addEventListener("click", () => {
  router.navigate("/");
});

// The router automatically handles link clicks for same-origin links
```

## License

MIT
