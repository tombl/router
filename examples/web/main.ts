/// <reference lib="dom" />

import { Router } from "../../web.ts";

// syntax highlighting
const html = String.raw;

const router = new Router({
  "/": () => {
    document.body.innerHTML = html`
      <h1>Hello!</h1>
      <p>This is the index page.</p>
      <a href="/joe">Greet joe</a>
    `;
  },
  "/:name": ({ name }) => {
    document.body.innerHTML = html`
      <h1>Hello ${name}!</h1>
      <p>This is a page with a parameter.</p>
      <a href="/">Go back</a>
    `;
  },
}, {
  notFound: (pathname) => {
    document.body.innerHTML = html`
      <h1>Page not found</h1>
      <p><code>${pathname}</code> does not exist.</p>
      <a href="/">Go home?</a>
    `;
  },
});

// deno-lint-ignore no-explicit-any -- i don't want to declare global
(globalThis as any).router = router;
