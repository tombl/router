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
