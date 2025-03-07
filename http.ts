/**
 * A basic router implementation for the standard web Request/Response API.
 * @module
 */

import { createRouter, type Router as Matcher, type Routes } from "./mod.ts";

/**
 * Like a Request, but with parameters.
 */
interface RequestP extends Request {
  /**
   * The parameters extracted from the path.
   * `/:name` will be available as `request.params.name`.
   */
  params: Record<string, string>;
}

type Handler = (request: Request) => Response | Promise<Response>;

/**
 * A request handler that supports parameters.
 */
type HandlerP = (request: RequestP) => Response | Promise<Response>;

export type { HandlerP as Handler, RequestP as RequestWithParams };

function defaultNotFound() {
  return new Response("not found", { status: 404 });
}

function defaultWrongMethod() {
  return new Response("wrong method", { status: 405 });
}

/**
 * HTTP Router class for handling HTTP requests with route-specific handlers
 *
 * Features:
 * - Route registration for different HTTP methods
 * - Parameter extraction from URL paths
 * - Support for standard Request/Response API
 *
 * @example
 * ```ts
 * const router = new Router();
 *
 * router.get("/", (req) => new Response("Home"));
 * router.get("/users/:id", (req) => new Response(`User ${req.params.id}`));
 *
 * // Handle requests in a service worker
 * addEventListener("fetch", (event) => {
 *   event.respondWith(router.fetch(event.request));
 * });
 *
 * // Handle requests in `deno serve` or Cloudflare Workers
 * export default router;
 * ```
 */
export class Router {
  #routes: { [pathname: string]: { [method: string]: HandlerP } } = {};
  #matcher: Matcher<Handler> | null = null;

  #notFound: Handler;
  #wrongMethod: Handler;

  constructor(
    options: { notFound?: Handler; wrongMethod?: Handler } = {},
  ) {
    this.#notFound = options.notFound ?? defaultNotFound;
    this.#wrongMethod = options.wrongMethod ?? defaultWrongMethod;

    // compile the matcher at the end of the current sync scope,
    // which should hopefully be after all the routes are setup,
    // but before the first request.
    queueMicrotask(() => {
      this.#getMatcher();
    });
  }

  #getMatcher() {
    if (this.#matcher) return this.#matcher;

    const routes: Routes<Handler> = {};

    for (const [pathname, handlers] of Object.entries(this.#routes)) {
      routes[pathname] = (params) => {
        return async (request: Request) => {
          Object.defineProperty(request, "params", {
            value: params,
            writable: true,
            enumerable: true,
            configurable: true,
          });
          const handler = handlers[request.method] ?? this.#wrongMethod;
          return await handler(request as RequestP);
        };
      };
    }

    return this.#matcher = createRouter(routes);
  }

  /**
   * Handles an incoming HTTP request and returns a Response
   *
   * Extracts the pathname from the request URL, finds a matching route handler,
   * and executes it. If no route matches, the notFound handler is used.
   */
  fetch = async (request: Request): Promise<Response> => {
    const { pathname } = new URL(request.url);
    const match = this.#getMatcher();
    const handler = match(pathname) ?? this.#notFound;
    return await handler(request);
  };

  #route(method: string, pathname: string, handler: HandlerP): void {
    if (pathname[0] !== "/") pathname = "/" + pathname;
    this.#routes[pathname] ??= {};
    this.#routes[pathname][method] = handler;
    this.#matcher = null;
  }

  /** Registers a handler for GET requests at the specified path */
  get(pathname: string, handler: HandlerP): void {
    this.#route("GET", pathname, handler);
  }

  /** Registers a handler for POST requests at the specified path */
  post(pathname: string, handler: HandlerP): void {
    this.#route("POST", pathname, handler);
  }

  /** Registers a handler for PUT requests at the specified path */
  put(pathname: string, handler: HandlerP): void {
    this.#route("PUT", pathname, handler);
  }

  /** Registers a handler for DELETE requests at the specified path */
  delete(pathname: string, handler: HandlerP): void {
    this.#route("DELETE", pathname, handler);
  }

  /** Registers a handler for PATCH requests at the specified path */
  patch(pathname: string, handler: HandlerP): void {
    this.#route("PATCH", pathname, handler);
  }

  /** Registers a handler for OPTIONS requests at the specified path */
  options(pathname: string, handler: HandlerP): void {
    this.#route("OPTIONS", pathname, handler);
  }

  /** Registers a handler for HEAD requests at the specified path */
  head(pathname: string, handler: HandlerP): void {
    this.#route("HEAD", pathname, handler);
  }
}
