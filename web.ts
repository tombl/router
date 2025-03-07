/// <reference lib="dom" />

import { createRouter, type Router as Matcher, type Routes } from "./mod.ts";

export class Router {
  #match: Matcher<void>;
  #notFound?: (pathname: string) => void;
  constructor(
    routes: Routes<void>,
    options: { notFound?: (pathname: string) => void } = {},
  ) {
    this.#match = createRouter(routes);
    this.#notFound = options.notFound;

    this.attach();
    this.#handle(location.pathname);
  }

  attach() {
    addEventListener("popstate", this.#onPopState);
    document.body.addEventListener("click", this.#onClick);
  }

  detach() {
    removeEventListener("popstate", this.#onPopState);
    document.body.removeEventListener("click", this.#onClick);
  }

  #onPopState = (event: PopStateEvent) => {
    event.preventDefault();
    this.#handle(location.pathname);
  };

  #onClick = (event: MouseEvent) => {
    const link = (event.target as Element).closest("a");

    if (
      link &&
      event.button === 0 && // Left mouse button
      link.target !== "_blank" && // Not for new tab
      link.origin === location.origin && // Not external link
      link.rel !== "external" && // Not external link
      link.target !== "_self" && // Now manually disabled
      !link.download && // Not download link
      !event.altKey && // Not download link by user
      !event.metaKey && // Not open in new tab (mac)
      !event.ctrlKey && // Not open in new tab (win)
      !event.shiftKey && // Not open in new window
      !event.defaultPrevented // Click was not cancelled
    ) {
      event.preventDefault();
      const hashChanged = location.hash !== link.hash;
      this.navigate(link.pathname);
      if (hashChanged) {
        location.hash = link.hash;
        if (link.hash === "" || link.hash === "#") {
          dispatchEvent(new HashChangeEvent("hashchange"));
        }
      }
    }
  };

  #handle(pathname: string) {
    if (this.#match(pathname) === null) this.#notFound?.(pathname);
  }

  #navigate(pathname: string, isRedirect: boolean) {
    const url = new URL(location.href);
    url.pathname = pathname;
    if (isRedirect) {
      history.replaceState(null, "", url);
    } else {
      history.pushState(null, "", url);
    }
    this.#handle(pathname);
  }

  navigate(pathname: string) {
    this.#navigate(pathname, false);
  }

  redirect(pathname: string) {
    this.#navigate(pathname, true);
  }
}
