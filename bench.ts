import { createRouter } from "./mod.ts";

// Create routers outside of the benchmark functions
// Simple static routes router
const smallRouter = createRouter({
  "home": () => "Home page",
  "about": () => "About page",
  "contact": () => "Contact page",
});

// Larger number of static routes
const largeRoutesObj: Record<
  string,
  (params: Record<string, string>) => string
> = {};
for (let i = 0; i < 100; i++) {
  largeRoutesObj[`route${i}`] = () => `Route ${i}`;
}
const largeRouter = createRouter(largeRoutesObj);

// Router with parameters
const paramRouter = createRouter({
  "user/:id": ({ id }) => `User ${id}`,
  "post/:slug": ({ slug }) => `Post: ${slug}`,
  "category/:name/page/:num": ({ name, num }) =>
    `Category ${name}, Page ${num}`,
});

// Mixed routes with parameters and static segments
const mixedRouter = createRouter({
  "": () => "Home page",
  "about": () => "About page",
  "users": () => "Users list",
  "user/:id": ({ id }) => `User ${id}`,
  "blog/:year/:month/:day/:slug": ({ year, month, day, slug }) =>
    `Blog post: ${slug} (${year}-${month}-${day})`,
});

// Router with splats
const splatRouter = createRouter({
  "files/*": ({ "*": path }) => `Downloading ${path}`,
  "assets/*/download": ({ "*": file }) => `Asset: ${file}`,
  "blog/:year/*": ({ year, "*": slug }) => `Blog post from ${year}: ${slug}`,
});

// Real-world scenario with many routes of different types
const realWorldRouter = createRouter({
  "": () => "Home",
  "about": () => "About",
  "contact": () => "Contact",
  "products": () => "Products list",
  "product/:id": ({ id }) => `Product ${id}`,
  "product/:id/reviews": ({ id }) => `Reviews for product ${id}`,
  "product/:id/review/:reviewId": ({ id, reviewId }) =>
    `Review ${reviewId} for product ${id}`,
  "blog": () => "Blog index",
  "blog/:year/:month": ({ year, month }) => `Blog archive for ${year}-${month}`,
  "blog/:year/:month/:day/:slug": ({ year, month, day, slug }) =>
    `Blog post: ${slug}`,
  "api/v1/users": () => "API users",
  "api/v1/users/:id": ({ id }) => `API user ${id}`,
  "api/v1/users/:id/posts": ({ id }) => `API posts for user ${id}`,
  "api/v1/users/:id/posts/:postId": ({ id, postId }) =>
    `API post ${postId} for user ${id}`,
  "docs/*": ({ "*": path }) => `Documentation: ${path}`,
  "files/:category/*": ({ category, "*": path }) =>
    `Files in ${category}: ${path}`,
});

// Simple comparison router
const comparisonRouter = createRouter({
  "home": () => "Home page",
  "about": () => "About page",
  "contact": () => "Contact page",
});

// Direct object lookup comparison
const staticRoutes: Record<string, () => string> = {
  "home": () => "Home page",
  "about": () => "About page",
  "contact": () => "Contact page",
};

// Simple static routes benchmark
Deno.bench("Static routes (small)", () => {
  smallRouter("home");
  smallRouter("about");
  smallRouter("contact");
  smallRouter("notfound");
});

// Larger number of static routes
Deno.bench("Static routes (large)", () => {
  // Test with 10 hits and 10 misses
  for (let i = 0; i < 10; i++) {
    largeRouter(`route${i}`);
  }

  for (let i = 0; i < 10; i++) {
    largeRouter(`nonexistent${i}`);
  }
});

// Routes with parameters
Deno.bench("Parameterized routes", () => {
  paramRouter("user/123");
  paramRouter("post/hello-world");
  paramRouter("category/tech/page/5");
  paramRouter("user");
});

// Mixed routes with parameters and static segments
Deno.bench("Mixed routes", () => {
  mixedRouter("");
  mixedRouter("about");
  mixedRouter("users");
  mixedRouter("user/42");
  mixedRouter("blog/2023/04/01/hello-world");
});

// Routes with splats
Deno.bench("Splat routes", () => {
  splatRouter("files/document.pdf");
  splatRouter("files/subdir/document.pdf");
  splatRouter("assets/css/style.css/download");
  splatRouter("blog/2023/my-first-post");
  splatRouter("blog/2024/tech/javascript/advanced-tips");
});

// Real-world scenario with many routes of different types
Deno.bench("Real-world scenario", () => {
  // Test with a mix of route types
  const paths = [
    "",
    "about",
    "products",
    "product/123",
    "product/456/reviews",
    "product/789/review/42",
    "blog",
    "blog/2023/04",
    "blog/2023/04/01/hello-world",
    "api/v1/users",
    "api/v1/users/123",
    "api/v1/users/123/posts",
    "api/v1/users/123/posts/456",
    "docs/getting-started",
    "docs/advanced/routing/parameters",
    "files/images/vacation/beach.jpg",
    "nonexistent/path",
  ];

  for (const path of paths) {
    realWorldRouter(path);
  }
});

// Benchmark router creation with different numbers of routes
Deno.bench("Router creation (10 routes)", () => {
  const routes: Record<string, (params: Record<string, string>) => string> = {};

  for (let i = 0; i < 10; i++) {
    routes[`route${i}`] = () => `Route ${i}`;
  }

  createRouter(routes);
});

Deno.bench("Router creation (100 routes)", () => {
  const routes: Record<string, (params: Record<string, string>) => string> = {};

  for (let i = 0; i < 100; i++) {
    routes[`route${i}`] = () => `Route ${i}`;
  }

  createRouter(routes);
});

// Compare with compiled static routes vs dynamic lookup
Deno.bench("Static lookup", () => {
  const path = "about";
  staticRoutes[path]?.();
});

Deno.bench("Router lookup", () => {
  comparisonRouter("about");
});
