/**
 * Client-side router module for single-page applications.
 * Handles client-side navigation without full page reloads.
 * @module
 */

/// <reference lib="dom" />

import { createMatcher, type Params } from "./mod.ts";

/**
 * A route handler function for the web router
 */
type RouteHandler<T extends string> = (params: Params<T>) => void;

interface RouterConfig {
  routes: Record<string, RouteHandler<string>>;
  notFound?: (pathname: string) => void;
}
/**
 * Router configuration interface
 */
interface RouterConfigP<R extends { [P in keyof R & string]: RouteHandler<P> }>
  extends RouterConfig {
  routes: R;
}

/**
 * Web Router interface for client-side navigation
 */
export interface WebRouter {
  /**
   * Navigates to a new path by pushing a new entry to the browser history
   *
   * This is the standard way to navigate to a new page in your application.
   * It adds a new entry to the browser history stack.
   */
  navigate(pathname: string): void;

  /**
   * Redirects to a new path by replacing the current history entry
   *
   * Use this when you want to navigate without adding to the browser's
   * history stack, such as for redirects or when replacing an invalid URL.
   */
  redirect(pathname: string): void;

  /**
   * Starts the router by attaching event listeners for navigation events
   *
   * Call this method to activate the router and handle navigation events.
   * The router is not automatically started when created.
   */
  start(): void;

  /**
   * Stops the router by removing event listeners
   *
   * Call this method when you want to clean up resources or when
   * the router should no longer handle navigation.
   */
  stop(): void;
}

/**
 * Creates a web router for client-side navigation in browser applications
 *
 * Features:
 * - Client-side navigation without page reloads
 * - Automatic interception of link clicks
 * - History API integration for back/forward navigation
 *
 * @example
 * ```ts
 * const router = createWebRouter({
 *   routes: {
 *     "/": () => {
 *       document.body.innerHTML = "Home";
 *     },
 *     "/greet/:name": ({ name }) => {
 *       document.body.innerHTML = `Hello ${name}!`;
 *     }
 *   },
 *   notFound: (pathname) => {
 *     document.body.innerHTML = `Page ${pathname} not found`;
 *   }
 * });
 *
 * // Start the router
 * router.start();
 *
 * // Programmatic navigation
 * document.querySelector("button").addEventListener("click", () => {
 *   router.navigate("/");
 * });
 * ```
 */
export function createWebRouter<
  R extends { [P in keyof R & string]: RouteHandler<P> },
>(config: RouterConfigP<R>): WebRouter;

export function createWebRouter(config: RouterConfig): WebRouter;

export function createWebRouter(config: RouterConfig): WebRouter {
  // Create a route mapping with handlers wrapped to pass params
  const routes: Record<string, (params: Record<string, string>) => () => void> =
    {};

  // Transform route handlers
  for (
    const [pathname, routeHandler] of Object.entries(
      config.routes,
    )
  ) {
    routes[pathname] = (params) => {
      return () => routeHandler(params);
    };
  }

  const matcher = createMatcher<() => void>(routes);
  const notFound = config.notFound;

  function handle(pathname: string) {
    const handler = matcher(pathname);

    if (handler === null) {
      notFound?.(pathname);
    } else {
      handler();
    }
  }

  function navigate(pathname: string, isRedirect: boolean) {
    const url = new URL(location.href);
    url.pathname = pathname;
    if (isRedirect) {
      history.replaceState(null, "", url);
    } else {
      history.pushState(null, "", url);
    }
    handle(pathname);
  }

  function onPopState(event: PopStateEvent) {
    if (matcher(location.pathname) === null && !notFound) {
      return;
    }

    event.preventDefault();
    handle(location.pathname);
  }

  function onClick(event: MouseEvent) {
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
      // Check if the router has a handler for this path or notFound is defined
      // If not, let the browser handle the navigation
      if (matcher(link.pathname) === null && !notFound) {
        return;
      }

      event.preventDefault();
      const hashChanged = location.hash !== link.hash;
      navigate(link.pathname, false);
      if (hashChanged) {
        location.hash = link.hash;
        if (link.hash === "" || link.hash === "#") {
          dispatchEvent(new HashChangeEvent("hashchange"));
        }
      }
    }
  }

  return {
    navigate: (pathname: string) => navigate(pathname, false),
    redirect: (pathname: string) => navigate(pathname, true),
    start: () => {
      addEventListener("popstate", onPopState);
      document.body.addEventListener("click", onClick);
      handle(location.pathname);
    },
    stop: () => {
      removeEventListener("popstate", onPopState);
      document.body.removeEventListener("click", onClick);
    },
  };
}
