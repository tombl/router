/**
 * Client-side router module for single-page applications.
 * Handles client-side navigation without full page reloads.
 * @module
 */

/// <reference lib="dom" />

import { createRouter, type Router as Matcher, type Routes } from "./mod.ts";

/**
 * Web Router class for client-side navigation in browser applications
 *
 * Features:
 * - Client-side navigation without page reloads
 * - Automatic interception of link clicks
 * - History API integration for back/forward navigation
 *
 * @example
 * ```ts
 * const router = new Router({
 *   "/": () => {
 *     document.body.innerHTML = "Home";
 *   },
 *   "/greet/:name": ({ name }) => {
 *     document.body.innerHTML = `Hello ${name}!`;
 *   }
 * });
 *
 * // Programmatic navigation
 * document.querySelector("button").addEventListener("click", () => {
 *   router.navigate("/");
 * });
 * ```
 */
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

  /**
   * Attaches event listeners for navigation events
   *
   * This method is automatically called by the constructor but can be
   * called again if the router was previously detached.
   * 
   * To disable the router, call {@link detach}.
   */
  attach() {
    addEventListener("popstate", this.#onPopState);
    document.body.addEventListener("click", this.#onClick);
  }

  /**
   * Detaches event listeners, effectively disabling the router
   *
   * Call this method when you want to clean up resources or when
   * the router should no longer handle navigation.
   * 
   * To re-enable the router, call {@link attach}.
   */
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

  /**
   * Navigates to a new path by pushing a new entry to the browser history
   *
   * This is the standard way to navigate to a new page in your application.
   * It adds a new entry to the browser history stack.
   */
  navigate(pathname: string) {
    this.#navigate(pathname, false);
  }

  /**
   * Redirects to a new path by replacing the current history entry
   *
   * Use this when you want to navigate without adding to the browser's
   * history stack, such as for redirects or when replacing an invalid URL.
   */
  redirect(pathname: string) {
    this.#navigate(pathname, true);
  }
}
