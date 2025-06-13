/// <reference lib="dom" />

import { createBrowserRouter } from "../../browser.ts";

// syntax highlighting
const html = String.raw;

const router = createBrowserRouter({
  routes: {
    "/": () => {
      document.title = "Home";
      document.body.innerHTML = html`
        <h1>Hello!</h1>
        <p>This is the index page.</p>
        <ul>
          ${Array.from({ length: 100 }, (_, i) =>
          html`
            <li>${i}</li>
          `).join("")}
        </ul>
        <a href="/joe#50">Greet joe</a>
      `;
    },
    "/:name": ({ name }) => {
      document.title = `Hello ${name}`;
      document.body.innerHTML = html`
        <h1>Hello ${name}!</h1>
        <p>This is a page with a parameter.</p>
        <ul>
          ${Array.from({ length: 100 }, (_, i) =>
          html`
            <li id="${i}">${i}</li>
          `)
          .join("")}
        </ul>
        <a href="/">Go back</a>
      `;
    },
  },
  notFound: (pathname) => {
    document.title = "Not found";
    document.body.innerHTML = html`
      <h1>Page not found</h1>
      <p><code>${pathname}</code> does not exist.</p>
      <a href="/">Go home?</a>
    `;
  },
});

// Start the router
router.start();

// deno-lint-ignore no-explicit-any -- i don't want to declare global
(globalThis as any).router = router;
