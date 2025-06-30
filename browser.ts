/**
 * Client-side router module for single-page applications.
 * Handles client-side navigation without full page reloads.
 * @module
 */

import { createMatcher, type Params } from "./matcher.ts";

/**
 * A route handler function for the browser router
 */
type RouteHandler<T extends string> = (
  ctx: { params: Params<T>; signal: AbortSignal },
) => void | Promise<void>;

interface RouterConfig {
  routes: Record<string, RouteHandler<string>>;
  notFound?: (
    ctx: { pathname: string; signal: AbortSignal },
  ) => void | Promise<void>;
}
/**
 * Router configuration interface
 */
interface RouterConfigP<R extends { [P in keyof R & string]: RouteHandler<P> }>
  extends RouterConfig {
  routes: R;
}

/**
 * Browser Router interface for client-side navigation
 */
export interface BrowserRouter {
  /**
   * Navigates to a new path by pushing a new entry to the browser history
   *
   * This is the standard way to navigate to a new page in your application.
   * It adds a new entry to the browser history stack.
   */
  navigate(pathname: string): Promise<void>;

  /**
   * Redirects to a new path by replacing the current history entry
   *
   * Use this when you want to navigate without adding to the browser's
   * history stack, such as for redirects or when replacing an invalid URL.
   */
  redirect(pathname: string): Promise<void>;

  /**
   * Starts the router by attaching event listeners for navigation events
   *
   * Call this method to activate the router and handle navigation events.
   * The router is not automatically started when created.
   */
  start(): Promise<void>;

  /**
   * Stops the router by removing event listeners
   *
   * Call this method when you want to clean up resources or when
   * the router should no longer handle navigation.
   */
  stop(): void;
}

/**
 * Creates a browser router for client-side navigation in web applications
 *
 * Features:
 * - Client-side navigation without page reloads
 * - Automatic interception of link clicks
 * - History API integration for back/forward navigation
 *
 * @example
 * ```ts
 * const router = createBrowserRouter({
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
export function createBrowserRouter<
  Route extends { [Path in keyof Route & string]: RouteHandler<Path> },
>(config: RouterConfigP<Route>): BrowserRouter;

export function createBrowserRouter(config: RouterConfig): BrowserRouter;

export function createBrowserRouter(config: RouterConfig): BrowserRouter {
  // Create a route mapping with handlers wrapped to pass params and signal
  const routes: Record<
    string,
    (params: Record<string, string>) => (signal: AbortSignal) => Promise<void>
  > = {};

  // Transform route handlers
  for (
    const [pathname, routeHandler] of Object.entries(
      config.routes,
    )
  ) {
    routes[pathname] = (params) => {
      return async (signal: AbortSignal) => {
        await routeHandler({ params, signal });
      };
    };
  }

  const matcher = createMatcher<(signal: AbortSignal) => Promise<void>>(routes);
  const notFound = config.notFound;
  let controller: AbortController | null = null;

  async function handle(pathname: string, signal: AbortSignal): Promise<void> {
    const handler = matcher(pathname);

    if (handler === null) {
      await notFound?.({ pathname, signal });
    } else {
      await handler(signal);
    }
  }

  async function navigate(
    init: { pathname: string; hash?: string; search?: string },
    isRedirect: boolean,
  ): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    await handle(init.pathname, signal);

    if (signal.aborted) return;

    const url = new URL(location.href);
    url.pathname = init.pathname;
    if (init.search !== undefined) url.search = init.search;
    if (init.hash !== undefined) url.hash = init.hash;
    if (isRedirect) {
      history.replaceState(null, "", url);
    } else {
      history.pushState(null, "", url);
    }
    scrollTo(0, 0);
  }

  async function onPopState(event: PopStateEvent) {
    if (matcher(location.pathname) === null && !notFound) {
      return;
    }

    event.preventDefault();

    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    await handle(location.pathname, signal);
  }

  async function onClick(event: MouseEvent) {
    const link = event.composedPath().find((target) =>
      target instanceof HTMLAnchorElement
    );

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
      const oldLocation = new URL(location.href);
      await navigate(link, false);
      if (oldLocation.hash !== location.hash) {
        // Only set the hash if we have one, because location.hash = ""`
        // actually sets it to "#"
        if (link.hash) location.hash = link.hash;

        if (
          oldLocation.pathname === location.pathname &&
          oldLocation.search === location.search
        ) {
          dispatchEvent(
            new HashChangeEvent("hashchange", {
              oldURL: oldLocation.href,
              newURL: location.href,
            }),
          );
        }
      }
    }
  }

  return {
    navigate: (pathname: string) => navigate({ pathname }, false),
    redirect: (pathname: string) => navigate({ pathname }, true),
    async start() {
      addEventListener("popstate", onPopState);
      document.body.addEventListener("click", onClick);
      await navigate(location, true);
    },
    stop() {
      removeEventListener("popstate", onPopState);
      document.body.removeEventListener("click", onClick);
      controller?.abort();
      controller = null;
    },
  };
}
