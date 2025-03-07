import { assertEquals } from "jsr:@std/assert";
import { createMatcher } from "./matcher.ts";

Deno.test("router handles empty routes object", () => {
  const matcher = createMatcher({});
  assertEquals(matcher("any-path"), null);
  assertEquals(matcher(""), null);
});

Deno.test("router matches static routes", () => {
  const matcher = createMatcher({
    "home": () => "Home page",
    "about": () => "About page",
    "contact": () => "Contact page",
  });

  assertEquals(matcher("home"), "Home page");
  assertEquals(matcher("about"), "About page");
  assertEquals(matcher("contact"), "Contact page");
  assertEquals(matcher("notfound"), null);
});

Deno.test("router handles route parameters", () => {
  const matcher = createMatcher({
    "user/:id": ({ id }) => `User ${id}`,
    "post/:slug": ({ slug }) => `Post: ${slug}`,
    "category/:name/page/:num": ({ name, num }) =>
      `Category ${name}, Page ${num}`,
  });

  assertEquals(matcher("user/123"), "User 123");
  assertEquals(matcher("post/hello-world"), "Post: hello-world");
  assertEquals(matcher("category/tech/page/5"), "Category tech, Page 5");
  assertEquals(matcher("user"), null);
  assertEquals(matcher("user/123/extra"), null);
});

Deno.test("router handles mixed static and parameterized routes", () => {
  const matcher = createMatcher({
    "": () => "Home page",
    "about": () => "About page",
    "users": () => "Users list",
    "user/:id": ({ id }) => `User ${id}`,
    "blog/:year/:month/:day/:slug": ({ year, month, day, slug }) =>
      `Blog post: ${slug} (${year}-${month}-${day})`,
  });

  assertEquals(matcher(""), "Home page");
  assertEquals(matcher("about"), "About page");
  assertEquals(matcher("users"), "Users list");
  assertEquals(matcher("user/42"), "User 42");
  assertEquals(
    matcher("blog/2023/04/01/hello-world"),
    "Blog post: hello-world (2023-04-01)",
  );
});

Deno.test("router returns non-string values", () => {
  const matcher = createMatcher({
    "count/:num": ({ num }) => parseInt(num, 10),
    "fixed": () => 42,
  });

  assertEquals(matcher("count/10"), 10);
  assertEquals(matcher("count/999"), 999);
  assertEquals(matcher("fixed"), 42);
  assertEquals(matcher("missing"), null);
});

Deno.test("router handles special characters in path segments", () => {
  const matcher = createMatcher({
    "file/:filename": ({ filename }) => `File: ${filename}`,
    "tag/:tag": ({ tag }) => `Tag: ${tag}`,
  });

  assertEquals(matcher("file/my-document.pdf"), "File: my-document.pdf");
  assertEquals(matcher("tag/c++"), "Tag: c++");
  assertEquals(matcher("tag/special#tag"), "Tag: special#tag");
});

Deno.test("router handles regex special characters in routes", () => {
  const matcher = createMatcher({
    "products/(.*)": () => "Regex pattern as literal",
    "search/[query]": () => "Square brackets as literal",
    "items/{id}": () => "Curly braces as literal",
    "files/(id+)": () => "Parentheses and plus as literal",
    "data/^start$": () => "Caret and dollar as literal",
    "special/.*+?^${}()|[]\\": () => "All special chars",
  });

  assertEquals(matcher("products/(.*)"), "Regex pattern as literal");
  assertEquals(matcher("search/[query]"), "Square brackets as literal");
  assertEquals(matcher("items/{id}"), "Curly braces as literal");
  assertEquals(matcher("files/(id+)"), "Parentheses and plus as literal");
  assertEquals(matcher("data/^start$"), "Caret and dollar as literal");
  assertEquals(matcher("special/.*+?^${}()|[]\\"), "All special chars");

  // Make sure these aren't treated as regex patterns
  assertEquals(matcher("products/anything"), null);
  assertEquals(matcher("search/value"), null);
});

Deno.test("router distinguishes leading slashes", () => {
  const matcher = createMatcher({
    "/home": () => "Home with slash",
    "about": () => "About without slash",
    "/users/:id": ({ id }) => `User ${id} with slash`,
    "posts/:id": ({ id }) => `Post ${id} without slash`,
  });

  // Routes with leading slashes only match paths with leading slashes
  assertEquals(matcher("/home"), "Home with slash");
  assertEquals(matcher("home"), null);

  // Routes without leading slashes only match paths without leading slashes
  assertEquals(matcher("about"), "About without slash");
  assertEquals(matcher("/about"), null);

  // Same behavior with parameterized routes
  assertEquals(matcher("/users/123"), `User 123 with slash`);
  assertEquals(matcher("users/123"), null);

  assertEquals(matcher("posts/456"), `Post 456 without slash`);
  assertEquals(matcher("/posts/456"), null);
});

Deno.test("router handles splat routes", () => {
  const matcher = createMatcher({
    "files/*": () => "All files",
    "docs/:category/*": ({ category }) => `All docs in ${category}`,
    "api/users/:id/posts/*": ({ id }) => `All posts for user ${id}`,
  });

  // Basic splat route
  assertEquals(matcher("files/document.pdf"), "All files");
  assertEquals(matcher("files/images/photo.jpg"), "All files");
  assertEquals(matcher("files/"), "All files");
  assertEquals(matcher("files/subdirectory/another/file.txt"), "All files");

  // Splat with a parameter
  assertEquals(matcher("docs/tech/article.md"), "All docs in tech");
  assertEquals(
    matcher("docs/science/physics/quantum.md"),
    "All docs in science",
  );
  assertEquals(matcher("docs/history/"), "All docs in history");

  // Splat with multiple path segments and a parameter
  assertEquals(matcher("api/users/123/posts/latest"), `All posts for user 123`);
  assertEquals(
    matcher("api/users/456/posts/2023/01/01/new-year"),
    `All posts for user 456`,
  );
  assertEquals(matcher("api/users/789/posts/"), `All posts for user 789`);

  // Splat routes should still not match different paths
  assertEquals(matcher("file/document.pdf"), null);
  assertEquals(matcher("doc/tech/article.md"), null);
});

Deno.test("router captures splat values", () => {
  const matcher = createMatcher({
    "download/*": ({ "*": path }) => `Downloading ${path}`,
    "assets/*/download": ({ "*": file }) => `Asset: ${file}`,
    "blog/:year/*": ({ year, "*": slug }) => `Blog post from ${year}: ${slug}`,
  });

  // Capture the entire splat part as a parameter
  assertEquals(
    matcher("download/files/report.pdf"),
    "Downloading files/report.pdf",
  );
  assertEquals(
    matcher("download/images/photos/vacation/beach.jpg"),
    "Downloading images/photos/vacation/beach.jpg",
  );

  // Another example of splat capture
  assertEquals(matcher("assets/index.html"), null);
  assertEquals(
    matcher("assets/css/style.css/download"),
    "Asset: css/style.css",
  );
  assertEquals(
    matcher("assets/js/utils/helpers.js/download"),
    "Asset: js/utils/helpers.js",
  );

  // Combining named parameters with splat capture
  assertEquals(
    matcher("blog/2023/my-first-post"),
    "Blog post from 2023: my-first-post",
  );
  assertEquals(
    matcher("blog/2024/tech/javascript/advanced-tips"),
    "Blog post from 2024: tech/javascript/advanced-tips",
  );
});

Deno.test("router conflict resolution is based on route definition order", () => {
  // Case 1: Static vs Parameter - first defined wins
  {
    const matcher1 = createMatcher({
      "user/profile": () => "Static profile",
      "user/:action": ({ action }) => `Dynamic ${action}`,
    });

    const matcher2 = createMatcher({
      "user/:action": ({ action }) => `Dynamic ${action}`,
      "user/profile": () => "Static profile",
    });

    // Check which route wins when paths conflict
    assertEquals(
      matcher1("user/profile"),
      "Static profile",
      "First defined route (static) should win",
    );
    assertEquals(
      matcher2("user/profile"),
      "Dynamic profile",
      "First defined route (parameter) should win",
    );
  }

  // Case 2: Parameter vs Splat - first defined wins
  {
    const matcher1 = createMatcher({
      "files/:filename": ({ filename }) => `File ${filename}`,
      "files/*": ({ "*": path }) => `Any file: ${path}`,
    });

    const matcher2 = createMatcher({
      "files/*": ({ "*": path }) => `Any file: ${path}`,
      "files/:filename": ({ filename }) => `File ${filename}`,
    });

    // Test which route takes precedence
    assertEquals(
      matcher1("files/document.pdf"),
      "File document.pdf",
      "First defined route (parameter) should win over splat",
    );
    assertEquals(
      matcher2("files/document.pdf"),
      "Any file: document.pdf",
      "First defined route (splat) should win over parameter",
    );
  }

  // Case 3: Static vs Splat - first defined wins
  {
    const matcher1 = createMatcher({
      "api/docs": () => "API documentation",
      "api/*": ({ "*": path }) => `API path: ${path}`,
    });

    const matcher2 = createMatcher({
      "api/*": ({ "*": path }) => `API path: ${path}`,
      "api/docs": () => "API documentation",
    });

    assertEquals(
      matcher1("api/docs"),
      "API documentation",
      "First defined route (static) should win over splat",
    );
    assertEquals(
      matcher2("api/docs"),
      "API path: docs",
      "First defined route (splat) should win over static",
    );
  }

  // Case 4: Multiple matches with different specificity
  {
    const matcher = createMatcher({
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
      matcher("blog/2023/01/01/hello"),
      "Full blog: 2023-01-01 hello",
      "First route should be used regardless of specificity",
    );
    assertEquals(
      matcher("blog/2023/01/hello"),
      "Monthly blog: 2023-01 hello",
      "First matching route (skipping non-matching routes) should be used",
    );
    assertEquals(
      matcher("blog/tech/hello"),
      "Category blog: tech hello",
      "First matching route should be used",
    );
    assertEquals(
      matcher("blog/hello"),
      "Any blog: hello",
      "When only one route matches, it should be used",
    );
  }
});
