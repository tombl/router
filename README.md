# Path Router

A lightweight, fast path router for JavaScript/TypeScript that supports static
routes, parameterized routes, and splat routes.

## Features

- Zero dependencies (only uses Deno's `@std/regexp/escape`)
- Support for route parameters (e.g. `/user/:id`)
- Support for splat routes with wildcards (e.g. `files/*`)
- Type-safe with TypeScript generics
- Fast regex-based matching
- First-defined-route-wins conflict resolution

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

  // Splat routes (match anything after the prefix)
  "files/*": () => "File browser",
  "docs/:category/*": ({ category }) => `Documentation for ${category}`,

  // Capturing splat parts
  "download/*": ({ "*": path }) => `Downloading ${path}`,
});

// Match a path
router("about"); // Returns: "About page"
router("user/123"); // Returns: "User profile: 123"
router("post/2023/06/hello-world"); // Returns: "Blog post from 06/2023: hello-world"
router("unknown-path"); // Returns: null

// Splat routes match any number of path segments
router("files/document.pdf"); // Returns: "File browser"
router("files/images/photo.jpg"); // Returns: "File browser"
router("docs/javascript/functions/callbacks"); // Returns: "Documentation for javascript"

// Capturing the splat part
router("download/report.pdf"); // Returns: "Downloading report.pdf"
router("download/images/photo.jpg"); // Returns: "Downloading images/photo.jpg"

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
  "api/files/*": ({ "*": path }) =>
    new Response(JSON.stringify({ path, type: "file" }), {
      headers: { "Content-Type": "application/json" },
    }),
});

apiRouter("api/users"); // Returns a Response object with users list
apiRouter("api/user/42"); // Returns a Response object with user data
apiRouter("api/files/documents/report.pdf"); // Returns a Response with file path info
```

## License

MIT
