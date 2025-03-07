# @tombl/router

A lightweight and flexible routing library for various JavaScript environments.

[![JSR](https://jsr.io/badges/@tombl/router)](https://jsr.io/@tombl/router)

## Features

- **Lightweight**: Small footprint with no dependencies
- **Reasonably fast**: Uses a compiled single RegExp
- **Flexible**: Supports multiple router types for different use cases
- **Modern**: Designed for Deno, Cloudflare Workers, and browser environments

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
import { createMatcher } from "@tombl/router";

const router = createMatcher({
  "/": () => "Home page",
  "/about": () => "About page",
  "/users/:id": ({ id }) => `User profile: ${id}`,
  "/files/*": ({ "*": path }) => `File: ${path}`,
});

router("/"); // "Home page"
router("/about"); // "About page"
router("/users/123"); // "User profile: 123"
router("/files/docs/readme"); // "File: docs/readme"
router("/unknown"); // null (no match)
```

The router supports three types of route segments:

- **Static segments**: Exact string matches (e.g., `/about`)
- **Named parameters**: Segments starting with `:` (e.g., `/:id`)
- **Splat parameter**: A `*` segment that captures the rest of the path

## HTTP Router

For server-side applications using the standard Request/Response API (Deno,
Cloudflare Workers, etc.)

```ts
import { Router } from "@tombl/router/http";

const router = new Router();

router.get("/", (req) => {
  return new Response("Home page");
});

router.get("/users/:id", (req) => {
  return new Response(`User profile: ${req.params.id}`);
});

router.post("/api/items", async (req) => {
  const data = await req.json();
  // Process data...
  return new Response("Item created", { status: 201 });
});

// Handle requests with Deno
Deno.serve(router.fetch);

// Or export for use with Cloudflare Workers / `deno serve`
export default router;
```

## Web Router

For client-side single-page applications in the browser:

```ts
import { Router } from "@tombl/router/web";

const router = new Router({
  "/": () => {
    document.body.innerHTML = "<h1>Home Page</h1>";
  },
  "/about": () => {
    document.body.innerHTML = "<h1>About Page</h1>";
  },
  "/users/:id": ({ id }) => {
    document.body.innerHTML = `<h1>User ${id}</h1>`;
  },
}, {
  notFound: (pathname) => {
    document.body.innerHTML = "<h1>404 - Page not found</h1>";
  },
});

// Programmatic navigation (don't do this, use links instead)
document.querySelector("button#nav-home").addEventListener("click", () => {
  router.navigate("/");
});

// The router automatically handles link clicks for same-origin links
```

## License

MIT
