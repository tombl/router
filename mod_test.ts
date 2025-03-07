import { assertEquals } from "jsr:@std/assert";
import { createRouter } from "./mod.ts";

Deno.test("router handles empty routes object", () => {
  const router = createRouter({});
  assertEquals(router("any-path"), null);
  assertEquals(router(""), null);
});

Deno.test("router matches static routes", () => {
  const router = createRouter({
    "home": () => "Home page",
    "about": () => "About page",
    "contact": () => "Contact page",
  });

  assertEquals(router("home"), "Home page");
  assertEquals(router("about"), "About page");
  assertEquals(router("contact"), "Contact page");
  assertEquals(router("notfound"), null);
});

Deno.test("router handles route parameters", () => {
  const router = createRouter({
    "user/:id": ({ id }) => `User ${id}`,
    "post/:slug": ({ slug }) => `Post: ${slug}`,
    "category/:name/page/:num": ({ name, num }) =>
      `Category ${name}, Page ${num}`,
  });

  assertEquals(router("user/123"), "User 123");
  assertEquals(router("post/hello-world"), "Post: hello-world");
  assertEquals(router("category/tech/page/5"), "Category tech, Page 5");
  assertEquals(router("user"), null);
  assertEquals(router("user/123/extra"), null);
});

Deno.test("router handles mixed static and parameterized routes", () => {
  const router = createRouter({
    "": () => "Home page",
    "about": () => "About page",
    "users": () => "Users list",
    "user/:id": ({ id }) => `User ${id}`,
    "blog/:year/:month/:day/:slug": ({ year, month, day, slug }) =>
      `Blog post: ${slug} (${year}-${month}-${day})`,
  });

  assertEquals(router(""), "Home page");
  assertEquals(router("about"), "About page");
  assertEquals(router("users"), "Users list");
  assertEquals(router("user/42"), "User 42");
  assertEquals(
    router("blog/2023/04/01/hello-world"),
    "Blog post: hello-world (2023-04-01)",
  );
});

Deno.test("router returns non-string values", () => {
  const router = createRouter<number>({
    "count/:num": ({ num }) => parseInt(num, 10),
    "fixed": () => 42,
  });

  assertEquals(router("count/10"), 10);
  assertEquals(router("count/999"), 999);
  assertEquals(router("fixed"), 42);
  assertEquals(router("missing"), null);
});

Deno.test("router handles special characters in path segments", () => {
  const router = createRouter({
    "file/:filename": ({ filename }) => `File: ${filename}`,
    "tag/:tag": ({ tag }) => `Tag: ${tag}`,
  });

  assertEquals(router("file/my-document.pdf"), "File: my-document.pdf");
  assertEquals(router("tag/c++"), "Tag: c++");
  assertEquals(router("tag/special#tag"), "Tag: special#tag");
});

Deno.test("router handles regex special characters in routes", () => {
  const router = createRouter({
    "products/(.*)": () => "Regex pattern as literal",
    "search/[query]": () => "Square brackets as literal",
    "items/{id}": () => "Curly braces as literal",
    "files/(id+)": () => "Parentheses and plus as literal",
    "data/^start$": () => "Caret and dollar as literal",
    "special/.*+?^${}()|[]\\": () => "All special chars",
  });

  assertEquals(router("products/(.*)"), "Regex pattern as literal");
  assertEquals(router("search/[query]"), "Square brackets as literal");
  assertEquals(router("items/{id}"), "Curly braces as literal");
  assertEquals(router("files/(id+)"), "Parentheses and plus as literal");
  assertEquals(router("data/^start$"), "Caret and dollar as literal");
  assertEquals(router("special/.*+?^${}()|[]\\"), "All special chars");

  // Make sure these aren't treated as regex patterns
  assertEquals(router("products/anything"), null);
  assertEquals(router("search/value"), null);
});

Deno.test("router distinguishes leading slashes", () => {
  const router = createRouter({
    "/home": () => "Home with slash",
    "about": () => "About without slash",
    "/users/:id": ({ id }) => `User ${id} with slash`,
    "posts/:id": ({ id }) => `Post ${id} without slash`,
  });

  // Routes with leading slashes only match paths with leading slashes
  assertEquals(router("/home"), "Home with slash");
  assertEquals(router("home"), null);

  // Routes without leading slashes only match paths without leading slashes
  assertEquals(router("about"), "About without slash");
  assertEquals(router("/about"), null);

  // Same behavior with parameterized routes
  assertEquals(router("/users/123"), `User 123 with slash`);
  assertEquals(router("users/123"), null);

  assertEquals(router("posts/456"), `Post 456 without slash`);
  assertEquals(router("/posts/456"), null);
});

Deno.test("router handles splat routes", () => {
  const router = createRouter({
    "files/*": () => "All files",
    "docs/:category/*": ({ category }) => `All docs in ${category}`,
    "api/users/:id/posts/*": ({ id }) => `All posts for user ${id}`,
  });

  // Basic splat route
  assertEquals(router("files/document.pdf"), "All files");
  assertEquals(router("files/images/photo.jpg"), "All files");
  assertEquals(router("files/"), "All files");
  assertEquals(router("files/subdirectory/another/file.txt"), "All files");

  // Splat with a parameter
  assertEquals(router("docs/tech/article.md"), "All docs in tech");
  assertEquals(
    router("docs/science/physics/quantum.md"),
    "All docs in science",
  );
  assertEquals(router("docs/history/"), "All docs in history");

  // Splat with multiple path segments and a parameter
  assertEquals(router("api/users/123/posts/latest"), `All posts for user 123`);
  assertEquals(
    router("api/users/456/posts/2023/01/01/new-year"),
    `All posts for user 456`,
  );
  assertEquals(router("api/users/789/posts/"), `All posts for user 789`);

  // Splat routes should still not match different paths
  assertEquals(router("file/document.pdf"), null);
  assertEquals(router("doc/tech/article.md"), null);
});

Deno.test("router captures splat values", () => {
  const router = createRouter({
    "download/*": ({ "*": path }) => `Downloading ${path}`,
    "assets/*/download": ({ "*": file }) => `Asset: ${file}`,
    "blog/:year/*": ({ year, "*": slug }) => `Blog post from ${year}: ${slug}`,
  });

  // Capture the entire splat part as a parameter
  assertEquals(
    router("download/files/report.pdf"),
    "Downloading files/report.pdf",
  );
  assertEquals(
    router("download/images/photos/vacation/beach.jpg"),
    "Downloading images/photos/vacation/beach.jpg",
  );

  // Another example of splat capture
  assertEquals(router("assets/index.html"), null);
  assertEquals(router("assets/css/style.css/download"), "Asset: css/style.css");
  assertEquals(
    router("assets/js/utils/helpers.js/download"),
    "Asset: js/utils/helpers.js",
  );

  // Combining named parameters with splat capture
  assertEquals(
    router("blog/2023/my-first-post"),
    "Blog post from 2023: my-first-post",
  );
  assertEquals(
    router("blog/2024/tech/javascript/advanced-tips"),
    "Blog post from 2024: tech/javascript/advanced-tips",
  );
});

Deno.test("router conflict resolution is based on route definition order", () => {
  // Case 1: Static vs Parameter - first defined wins
  {
    const router1 = createRouter({
      "user/profile": () => "Static profile",
      "user/:action": ({ action }) => `Dynamic ${action}`,
    });

    const router2 = createRouter({
      "user/:action": ({ action }) => `Dynamic ${action}`,
      "user/profile": () => "Static profile",
    });

    // Check which route wins when paths conflict
    assertEquals(
      router1("user/profile"),
      "Static profile",
      "First defined route (static) should win",
    );
    assertEquals(
      router2("user/profile"),
      "Dynamic profile",
      "First defined route (parameter) should win",
    );
  }

  // Case 2: Parameter vs Splat - first defined wins
  {
    const router1 = createRouter({
      "files/:filename": ({ filename }) => `File ${filename}`,
      "files/*": ({ "*": path }) => `Any file: ${path}`,
    });

    const router2 = createRouter({
      "files/*": ({ "*": path }) => `Any file: ${path}`,
      "files/:filename": ({ filename }) => `File ${filename}`,
    });

    // Test which route takes precedence
    assertEquals(
      router1("files/document.pdf"),
      "File document.pdf",
      "First defined route (parameter) should win over splat",
    );
    assertEquals(
      router2("files/document.pdf"),
      "Any file: document.pdf",
      "First defined route (splat) should win over parameter",
    );
  }

  // Case 3: Static vs Splat - first defined wins
  {
    const router1 = createRouter({
      "api/docs": () => "API documentation",
      "api/*": ({ "*": path }) => `API path: ${path}`,
    });

    const router2 = createRouter({
      "api/*": ({ "*": path }) => `API path: ${path}`,
      "api/docs": () => "API documentation",
    });

    assertEquals(
      router1("api/docs"),
      "API documentation",
      "First defined route (static) should win over splat",
    );
    assertEquals(
      router2("api/docs"),
      "API path: docs",
      "First defined route (splat) should win over static",
    );
  }

  // Case 4: Multiple matches with different specificity
  {
    const router = createRouter({
      "blog/:year/:month/:day/:slug": ({ year, month, day, slug }) =>
        `Full blog: ${year}-${month}-${day} ${slug}`,
      "blog/:year/:month/:slug": ({ year, month, slug }) =>
        `Monthly blog: ${year}-${month} ${slug}`,
      "blog/:category/:slug": ({ category, slug }) =>
        `Category blog: ${category} ${slug}`,
      "blog/*": ({ "*": path }) => `Any blog: ${path}`,
    });

    // Test if routes are matched by specificity or by order
    assertEquals(
      router("blog/2023/01/01/hello"),
      "Full blog: 2023-01-01 hello",
      "First route should be used regardless of specificity",
    );
    assertEquals(
      router("blog/2023/01/hello"),
      "Monthly blog: 2023-01 hello",
      "First matching route (skipping non-matching routes) should be used",
    );
    assertEquals(
      router("blog/tech/hello"),
      "Category blog: tech hello",
      "First matching route should be used",
    );
    assertEquals(
      router("blog/hello"),
      "Any blog: hello",
      "When only one route matches, it should be used",
    );
  }
});
