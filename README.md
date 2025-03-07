# Path Router

A lightweight, fast path router for JavaScript/TypeScript that supports static
routes and parameterized routes.

## Features

- Zero dependencies (only uses Deno's `@std/regexp/escape`)
- Support for route parameters (e.g. `/user/:id`)
- Type-safe with TypeScript generics
- Fast regex-based matching

## Usage

```ts
import { createRouter } from "./mod.ts";

// Create a router with some routes
const router = createRouter({
  // Static routes
  "": () => "Home page",
  "about": () => "About page",

  // Routes with parameters
  "user/:id": ({ id }) => `User profile: ${id}`,
  "post/:year/:month/:slug": ({ year, month, slug }) =>
    `Blog post from ${month}/${year}: ${slug}`,
});

// Match a path
router("about"); // Returns: "About page"
router("user/123"); // Returns: "User profile: 123"
router("post/2023/06/hello-world"); // Returns: "Blog post from 06/2023: hello-world"
router("unknown-path"); // Returns: null

// Router can return any type, not just strings
const apiRouter = createRouter<Response>({
  "api/users": () =>
    new Response(JSON.stringify({ users: ["Alice", "Bob"] }), {
      headers: { "Content-Type": "application/json" },
    }),
  "api/user/:id": ({ id }) =>
    new Response(JSON.stringify({ id, name: `User ${id}` }), {
      headers: { "Content-Type": "application/json" },
    }),
});

apiRouter("api/users"); // Returns a Response object with users list
apiRouter("api/user/42"); // Returns a Response object with user data
```

## License

MIT
