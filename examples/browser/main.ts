/// <reference lib="dom" />

import { createBrowserRouter } from "../../browser.ts";

// syntax highlighting
const html = String.raw;

const router = createBrowserRouter({
  routes: {
    "/": async ({ signal }) => {
      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if navigation was cancelled
      if (signal.aborted) return;

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
        <a href="/slow">Test slow loading</a>
      `;
      document.body
        .appendChild(document.createElement("div"))
        .attachShadow({ mode: "open" }).innerHTML = html`
          <a href="/joe#49">Greet joe (shadow)</a>
        `;
    },
    "/slow": async ({ signal }) => {
      // Simulate slow async work
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if navigation was cancelled
      if (signal.aborted) return;

      document.title = "Slow Page";
      document.body.innerHTML = html`
        <h1>Slow page loaded!</h1>
        <p>This page took 2 seconds to load.</p>
        <a href="/">Go back</a>
      `;
    },
    "/:name": async ({ params: { name }, signal }) => {
      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check if navigation was cancelled
      if (signal.aborted) return;

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
  notFound: async ({ pathname, signal }) => {
    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check if navigation was cancelled
    if (signal.aborted) return;

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
