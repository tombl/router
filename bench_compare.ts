import { createRouter as createMyRouter } from "./mod.ts";
import * as rou3 from "npm:rou3";
import FindMyWay from "npm:find-my-way";
import { Trouter } from "npm:trouter";

// --- Construction Time Benchmark ---
// Define real-world routes to add to router
const realWorldRoutes = [
  "",
  "about",
  "contact",
  "products",
  "product/:id",
  "product/:id/reviews",
  "product/:id/review/:reviewId",
  "blog",
  "blog/:year/:month",
  "blog/:year/:month/:day/:slug",
  "api/v1/users",
  "api/v1/users/:id",
  "api/v1/users/:id/posts",
  "api/v1/users/:id/posts/:postId",
  "docs/*",
  "files/:category/*",
];

Deno.bench("Construction - My Router", {
  group: "construction",
  baseline: true,
}, () => {
  createMyRouter({
    "": () => "Home",
    "about": () => "About",
    "contact": () => "Contact",
    "products": () => "Products list",
    "product/:id": ({ id }) => `Product ${id}`,
    "product/:id/reviews": ({ id }) => `Reviews for product ${id}`,
    "product/:id/review/:reviewId": ({ id, reviewId }) =>
      `Review ${reviewId} for product ${id}`,
    "blog": () => "Blog index",
    "blog/:year/:month": ({ year, month }) =>
      `Blog archive for ${year}-${month}`,
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
});

Deno.bench("Construction - Rou3", { group: "construction" }, () => {
  const router = rou3.createRouter();
  rou3.addRoute(router, "GET", "", "Home handler");
  rou3.addRoute(router, "GET", "about", "About handler");
  rou3.addRoute(router, "GET", "contact", "Contact handler");
  rou3.addRoute(router, "GET", "products", "Products handler");
  rou3.addRoute(router, "GET", "product/:id", "Product handler");
  rou3.addRoute(
    router,
    "GET",
    "product/:id/reviews",
    "Product reviews handler",
  );
  rou3.addRoute(
    router,
    "GET",
    "product/:id/review/:reviewId",
    "Product review handler",
  );
  rou3.addRoute(router, "GET", "blog", "Blog handler");
  rou3.addRoute(router, "GET", "blog/:year/:month", "Blog archive handler");
  rou3.addRoute(
    router,
    "GET",
    "blog/:year/:month/:day/:slug",
    "Blog post handler",
  );
  rou3.addRoute(router, "GET", "api/v1/users", "API users handler");
  rou3.addRoute(router, "GET", "api/v1/users/:id", "API user handler");
  rou3.addRoute(router, "GET", "api/v1/users/:id/posts", "API posts handler");
  rou3.addRoute(
    router,
    "GET",
    "api/v1/users/:id/posts/:postId",
    "API post handler",
  );
  rou3.addRoute(router, "GET", "docs/**", "Docs handler");
  rou3.addRoute(router, "GET", "files/:category/**", "Files handler");
});

Deno.bench("Construction - Find My Way", { group: "construction" }, () => {
  const router = FindMyWay();
  router.on("GET", "/", () => "Home handler");
  router.on("GET", "/about", () => "About handler");
  router.on("GET", "/contact", () => "Contact handler");
  router.on("GET", "/products", () => "Products handler");
  router.on("GET", "/product/:id", () => "Product handler");
  router.on("GET", "/product/:id/reviews", () => "Product reviews handler");
  router.on(
    "GET",
    "/product/:id/review/:reviewId",
    () => "Product review handler",
  );
  router.on("GET", "/blog", () => "Blog handler");
  router.on("GET", "/blog/:year/:month", () => "Blog archive handler");
  router.on("GET", "/blog/:year/:month/:day/:slug", () => "Blog post handler");
  router.on("GET", "/api/v1/users", () => "API users handler");
  router.on("GET", "/api/v1/users/:id", () => "API user handler");
  router.on("GET", "/api/v1/users/:id/posts", () => "API posts handler");
  router.on("GET", "/api/v1/users/:id/posts/:postId", () => "API post handler");
  router.on("GET", "/docs/*", () => "Docs handler");
  router.on("GET", "/files/:category/*", () => "Files handler");
});

Deno.bench("Construction - Trouter", { group: "construction" }, () => {
  const router = new Trouter();
  router.get("/", () => "Home handler");
  router.get("/about", () => "About handler");
  router.get("/contact", () => "Contact handler");
  router.get("/products", () => "Products handler");
  router.get("/product/:id", () => "Product handler");
  router.get("/product/:id/reviews", () => "Product reviews handler");
  router.get("/product/:id/review/:reviewId", () => "Product review handler");
  router.get("/blog", () => "Blog handler");
  router.get("/blog/:year/:month", () => "Blog archive handler");
  router.get("/blog/:year/:month/:day/:slug", () => "Blog post handler");
  router.get("/api/v1/users", () => "API users handler");
  router.get("/api/v1/users/:id", () => "API user handler");
  router.get("/api/v1/users/:id/posts", () => "API posts handler");
  router.get("/api/v1/users/:id/posts/:postId", () => "API post handler");
  router.get("/docs/*", () => "Docs handler");
  router.get("/files/:category/*", () => "Files handler");
});

// --- Static Routes ---
// Our implementation
const myStaticRouter = createMyRouter({
  "home": () => "Home page",
  "about": () => "About page",
  "contact": () => "Contact page",
});

// Rou3 implementation
const rou3StaticRouter = rou3.createRouter();
rou3.addRoute(rou3StaticRouter, "GET", "home", "Home page");
rou3.addRoute(rou3StaticRouter, "GET", "about", "About page");
rou3.addRoute(rou3StaticRouter, "GET", "contact", "Contact page");

// Find My Way implementation
const fmwStaticRouter = FindMyWay();
fmwStaticRouter.on("GET", "/home", () => "Home page");
fmwStaticRouter.on("GET", "/about", () => "About page");
fmwStaticRouter.on("GET", "/contact", () => "Contact page");

// Trouter implementation
const trouterStaticRouter = new Trouter();
trouterStaticRouter.get("/home", () => "Home page");
trouterStaticRouter.get("/about", () => "About page");
trouterStaticRouter.get("/contact", () => "Contact page");

// Static routes benchmark
Deno.bench("Static routes - My Router", {
  group: "static-routes",
  baseline: true,
}, () => {
  myStaticRouter("home");
  myStaticRouter("about");
  myStaticRouter("contact");
  myStaticRouter("notfound");
});

Deno.bench("Static routes - Rou3", { group: "static-routes" }, () => {
  rou3.findRoute(rou3StaticRouter, "GET", "home");
  rou3.findRoute(rou3StaticRouter, "GET", "about");
  rou3.findRoute(rou3StaticRouter, "GET", "contact");
  rou3.findRoute(rou3StaticRouter, "GET", "notfound");
});

Deno.bench("Static routes - Find My Way", { group: "static-routes" }, () => {
  fmwStaticRouter.find("GET", "/home");
  fmwStaticRouter.find("GET", "/about");
  fmwStaticRouter.find("GET", "/contact");
  fmwStaticRouter.find("GET", "/notfound");
});

Deno.bench("Static routes - Trouter", { group: "static-routes" }, () => {
  trouterStaticRouter.find("GET", "/home");
  trouterStaticRouter.find("GET", "/about");
  trouterStaticRouter.find("GET", "/contact");
  trouterStaticRouter.find("GET", "/notfound");
});

// --- Parameterized Routes ---
// Our implementation
const myParamRouter = createMyRouter({
  "user/:id": ({ id }) => `User ${id}`,
  "post/:slug": ({ slug }) => `Post: ${slug}`,
  "category/:name/page/:num": ({ name, num }) =>
    `Category ${name}, Page ${num}`,
});

// Rou3 implementation
const rou3ParamRouter = rou3.createRouter();
rou3.addRoute(rou3ParamRouter, "GET", "user/:id", "User handler");
rou3.addRoute(rou3ParamRouter, "GET", "post/:slug", "Post handler");
rou3.addRoute(
  rou3ParamRouter,
  "GET",
  "category/:name/page/:num",
  "Category handler",
);

// Find My Way implementation
const fmwParamRouter = FindMyWay();
fmwParamRouter.on("GET", "/user/:id", () => "User handler");
fmwParamRouter.on("GET", "/post/:slug", () => "Post handler");
fmwParamRouter.on("GET", "/category/:name/page/:num", () => "Category handler");

// Trouter implementation
const trouterParamRouter = new Trouter();
trouterParamRouter.get("/user/:id", () => "User handler");
trouterParamRouter.get("/post/:slug", () => "Post handler");
trouterParamRouter.get("/category/:name/page/:num", () => "Category handler");

// Parameterized routes benchmark
Deno.bench("Parameterized routes - My Router", {
  group: "param-routes",
  baseline: true,
}, () => {
  myParamRouter("user/123");
  myParamRouter("post/hello-world");
  myParamRouter("category/tech/page/5");
  myParamRouter("user");
});

Deno.bench("Parameterized routes - Rou3", { group: "param-routes" }, () => {
  rou3.findRoute(rou3ParamRouter, "GET", "user/123");
  rou3.findRoute(rou3ParamRouter, "GET", "post/hello-world");
  rou3.findRoute(rou3ParamRouter, "GET", "category/tech/page/5");
  rou3.findRoute(rou3ParamRouter, "GET", "user");
});

Deno.bench(
  "Parameterized routes - Find My Way",
  { group: "param-routes" },
  () => {
    fmwParamRouter.find("GET", "/user/123");
    fmwParamRouter.find("GET", "/post/hello-world");
    fmwParamRouter.find("GET", "/category/tech/page/5");
    fmwParamRouter.find("GET", "/user");
  },
);

Deno.bench("Parameterized routes - Trouter", { group: "param-routes" }, () => {
  trouterParamRouter.find("GET", "/user/123");
  trouterParamRouter.find("GET", "/post/hello-world");
  trouterParamRouter.find("GET", "/category/tech/page/5");
  trouterParamRouter.find("GET", "/user");
});

// --- Mixed Routes ---
// Our implementation
const myMixedRouter = createMyRouter({
  "": () => "Home page",
  "about": () => "About page",
  "users": () => "Users list",
  "user/:id": ({ id }) => `User ${id}`,
  "blog/:year/:month/:day/:slug": ({ year, month, day, slug }) =>
    `Blog post: ${slug} (${year}-${month}-${day})`,
});

// Rou3 implementation
const rou3MixedRouter = rou3.createRouter();
rou3.addRoute(rou3MixedRouter, "GET", "", "Home handler");
rou3.addRoute(rou3MixedRouter, "GET", "about", "About handler");
rou3.addRoute(rou3MixedRouter, "GET", "users", "Users handler");
rou3.addRoute(rou3MixedRouter, "GET", "user/:id", "User handler");
rou3.addRoute(
  rou3MixedRouter,
  "GET",
  "blog/:year/:month/:day/:slug",
  "Blog post handler",
);

// Find My Way implementation
const fmwMixedRouter = FindMyWay();
fmwMixedRouter.on("GET", "/", () => "Home handler");
fmwMixedRouter.on("GET", "/about", () => "About handler");
fmwMixedRouter.on("GET", "/users", () => "Users handler");
fmwMixedRouter.on("GET", "/user/:id", () => "User handler");
fmwMixedRouter.on(
  "GET",
  "/blog/:year/:month/:day/:slug",
  () => "Blog post handler",
);

// Trouter implementation
const trouterMixedRouter = new Trouter();
trouterMixedRouter.get("/", () => "Home handler");
trouterMixedRouter.get("/about", () => "About handler");
trouterMixedRouter.get("/users", () => "Users handler");
trouterMixedRouter.get("/user/:id", () => "User handler");
trouterMixedRouter.get(
  "/blog/:year/:month/:day/:slug",
  () => "Blog post handler",
);

// Mixed routes benchmark
Deno.bench("Mixed routes - My Router", {
  group: "mixed-routes",
  baseline: true,
}, () => {
  myMixedRouter("");
  myMixedRouter("about");
  myMixedRouter("users");
  myMixedRouter("user/42");
  myMixedRouter("blog/2023/04/01/hello-world");
});

Deno.bench("Mixed routes - Rou3", { group: "mixed-routes" }, () => {
  rou3.findRoute(rou3MixedRouter, "GET", "");
  rou3.findRoute(rou3MixedRouter, "GET", "about");
  rou3.findRoute(rou3MixedRouter, "GET", "users");
  rou3.findRoute(rou3MixedRouter, "GET", "user/42");
  rou3.findRoute(rou3MixedRouter, "GET", "blog/2023/04/01/hello-world");
});

Deno.bench("Mixed routes - Find My Way", { group: "mixed-routes" }, () => {
  fmwMixedRouter.find("GET", "/");
  fmwMixedRouter.find("GET", "/about");
  fmwMixedRouter.find("GET", "/users");
  fmwMixedRouter.find("GET", "/user/42");
  fmwMixedRouter.find("GET", "/blog/2023/04/01/hello-world");
});

Deno.bench("Mixed routes - Trouter", { group: "mixed-routes" }, () => {
  trouterMixedRouter.find("GET", "/");
  trouterMixedRouter.find("GET", "/about");
  trouterMixedRouter.find("GET", "/users");
  trouterMixedRouter.find("GET", "/user/42");
  trouterMixedRouter.find("GET", "/blog/2023/04/01/hello-world");
});

// --- Splat Routes ---
// Our implementation
const mySplatRouter = createMyRouter({
  "files/*": ({ "*": path }) => `Downloading ${path}`,
  "assets/*": ({ "*": file }) => `Asset: ${file}`,
  "blog/:year/*": ({ year, "*": slug }) => `Blog post from ${year}: ${slug}`,
});

// Rou3 implementation
const rou3SplatRouter = rou3.createRouter();
rou3.addRoute(rou3SplatRouter, "GET", "files/**", "Files handler");
rou3.addRoute(rou3SplatRouter, "GET", "assets/**", "Assets handler");
rou3.addRoute(rou3SplatRouter, "GET", "blog/:year/**", "Blog handler");

// Find My Way implementation
const fmwSplatRouter = FindMyWay();
fmwSplatRouter.on("GET", "/files/*", () => "Files handler");
fmwSplatRouter.on("GET", "/assets/*", () => "Assets handler");
fmwSplatRouter.on("GET", "/blog/:year/*", () => "Blog handler");

// Trouter implementation
const trouterSplatRouter = new Trouter();
trouterSplatRouter.get("/files/*", () => "Files handler");
trouterSplatRouter.get("/assets/*", () => "Assets handler");
trouterSplatRouter.get("/blog/:year/*", () => "Blog handler");

// Splat routes benchmark
Deno.bench("Splat routes - My Router", {
  group: "splat-routes",
  baseline: true,
}, () => {
  mySplatRouter("files/document.pdf");
  mySplatRouter("files/subdir/document.pdf");
  mySplatRouter("assets/css/style.css");
  mySplatRouter("blog/2023/my-first-post");
});

Deno.bench("Splat routes - Rou3", { group: "splat-routes" }, () => {
  rou3.findRoute(rou3SplatRouter, "GET", "files/document.pdf");
  rou3.findRoute(rou3SplatRouter, "GET", "files/subdir/document.pdf");
  rou3.findRoute(rou3SplatRouter, "GET", "assets/css/style.css");
  rou3.findRoute(rou3SplatRouter, "GET", "blog/2023/my-first-post");
});

Deno.bench("Splat routes - Find My Way", { group: "splat-routes" }, () => {
  fmwSplatRouter.find("GET", "/files/document.pdf");
  fmwSplatRouter.find("GET", "/files/subdir/document.pdf");
  fmwSplatRouter.find("GET", "/assets/css/style.css");
  fmwSplatRouter.find("GET", "/blog/2023/my-first-post");
});

Deno.bench("Splat routes - Trouter", { group: "splat-routes" }, () => {
  trouterSplatRouter.find("GET", "/files/document.pdf");
  trouterSplatRouter.find("GET", "/files/subdir/document.pdf");
  trouterSplatRouter.find("GET", "/assets/css/style.css");
  trouterSplatRouter.find("GET", "/blog/2023/my-first-post");
});

// --- Real-world scenario ---
// Our implementation
const myRealWorldRouter = createMyRouter({
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

// Rou3 implementation
const rou3RealWorldRouter = rou3.createRouter();
rou3.addRoute(rou3RealWorldRouter, "GET", "", "Home handler");
rou3.addRoute(rou3RealWorldRouter, "GET", "about", "About handler");
rou3.addRoute(rou3RealWorldRouter, "GET", "contact", "Contact handler");
rou3.addRoute(rou3RealWorldRouter, "GET", "products", "Products handler");
rou3.addRoute(rou3RealWorldRouter, "GET", "product/:id", "Product handler");
rou3.addRoute(
  rou3RealWorldRouter,
  "GET",
  "product/:id/reviews",
  "Product reviews handler",
);
rou3.addRoute(
  rou3RealWorldRouter,
  "GET",
  "product/:id/review/:reviewId",
  "Product review handler",
);
rou3.addRoute(rou3RealWorldRouter, "GET", "blog", "Blog handler");
rou3.addRoute(
  rou3RealWorldRouter,
  "GET",
  "blog/:year/:month",
  "Blog archive handler",
);
rou3.addRoute(
  rou3RealWorldRouter,
  "GET",
  "blog/:year/:month/:day/:slug",
  "Blog post handler",
);
rou3.addRoute(rou3RealWorldRouter, "GET", "api/v1/users", "API users handler");
rou3.addRoute(
  rou3RealWorldRouter,
  "GET",
  "api/v1/users/:id",
  "API user handler",
);
rou3.addRoute(
  rou3RealWorldRouter,
  "GET",
  "api/v1/users/:id/posts",
  "API posts handler",
);
rou3.addRoute(
  rou3RealWorldRouter,
  "GET",
  "api/v1/users/:id/posts/:postId",
  "API post handler",
);
rou3.addRoute(rou3RealWorldRouter, "GET", "docs/**", "Docs handler");
rou3.addRoute(
  rou3RealWorldRouter,
  "GET",
  "files/:category/**",
  "Files handler",
);

// Find My Way implementation
const fmwRealWorldRouter = FindMyWay();
fmwRealWorldRouter.on("GET", "/", () => "Home handler");
fmwRealWorldRouter.on("GET", "/about", () => "About handler");
fmwRealWorldRouter.on("GET", "/contact", () => "Contact handler");
fmwRealWorldRouter.on("GET", "/products", () => "Products handler");
fmwRealWorldRouter.on("GET", "/product/:id", () => "Product handler");
fmwRealWorldRouter.on(
  "GET",
  "/product/:id/reviews",
  () => "Product reviews handler",
);
fmwRealWorldRouter.on(
  "GET",
  "/product/:id/review/:reviewId",
  () => "Product review handler",
);
fmwRealWorldRouter.on("GET", "/blog", () => "Blog handler");
fmwRealWorldRouter.on(
  "GET",
  "/blog/:year/:month",
  () => "Blog archive handler",
);
fmwRealWorldRouter.on(
  "GET",
  "/blog/:year/:month/:day/:slug",
  () => "Blog post handler",
);
fmwRealWorldRouter.on("GET", "/api/v1/users", () => "API users handler");
fmwRealWorldRouter.on("GET", "/api/v1/users/:id", () => "API user handler");
fmwRealWorldRouter.on(
  "GET",
  "/api/v1/users/:id/posts",
  () => "API posts handler",
);
fmwRealWorldRouter.on(
  "GET",
  "/api/v1/users/:id/posts/:postId",
  () => "API post handler",
);
fmwRealWorldRouter.on("GET", "/docs/*", () => "Docs handler");
fmwRealWorldRouter.on("GET", "/files/:category/*", () => "Files handler");

// Trouter implementation
const trouterRealWorldRouter = new Trouter();
trouterRealWorldRouter.get("/", () => "Home handler");
trouterRealWorldRouter.get("/about", () => "About handler");
trouterRealWorldRouter.get("/contact", () => "Contact handler");
trouterRealWorldRouter.get("/products", () => "Products handler");
trouterRealWorldRouter.get("/product/:id", () => "Product handler");
trouterRealWorldRouter.get(
  "/product/:id/reviews",
  () => "Product reviews handler",
);
trouterRealWorldRouter.get(
  "/product/:id/review/:reviewId",
  () => "Product review handler",
);
trouterRealWorldRouter.get("/blog", () => "Blog handler");
trouterRealWorldRouter.get("/blog/:year/:month", () => "Blog archive handler");
trouterRealWorldRouter.get(
  "/blog/:year/:month/:day/:slug",
  () => "Blog post handler",
);
trouterRealWorldRouter.get("/api/v1/users", () => "API users handler");
trouterRealWorldRouter.get("/api/v1/users/:id", () => "API user handler");
trouterRealWorldRouter.get(
  "/api/v1/users/:id/posts",
  () => "API posts handler",
);
trouterRealWorldRouter.get(
  "/api/v1/users/:id/posts/:postId",
  () => "API post handler",
);
trouterRealWorldRouter.get("/docs/*", () => "Docs handler");
trouterRealWorldRouter.get("/files/:category/*", () => "Files handler");

// Real-world scenario paths to test
const realWorldPaths = [
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

// Real-world scenario benchmark
Deno.bench("Real-world scenario - My Router", {
  group: "real-world",
  baseline: true,
}, () => {
  for (const path of realWorldPaths) {
    myRealWorldRouter(path);
  }
});

Deno.bench("Real-world scenario - Rou3", { group: "real-world" }, () => {
  for (const path of realWorldPaths) {
    rou3.findRoute(rou3RealWorldRouter, "GET", path);
  }
});

Deno.bench("Real-world scenario - Find My Way", { group: "real-world" }, () => {
  for (const path of realWorldPaths) {
    // Find My Way expects paths to start with /
    fmwRealWorldRouter.find("GET", path ? `/${path}` : "/");
  }
});

Deno.bench("Real-world scenario - Trouter", { group: "real-world" }, () => {
  for (const path of realWorldPaths) {
    // Trouter expects paths to start with /
    trouterRealWorldRouter.find("GET", path ? `/${path}` : "/");
  }
});
