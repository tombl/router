/**
 * A basic router implementation for the standard web Request/Response API.
 * @module
 */

import { createMatcher, type Params } from "./mod.ts";

/**
 * Like a Request, but with parameters.
 */
interface RequestP<P extends string> extends Request {
  /**
   * The parameters extracted from the path.
   * `/:name` will be available as `request.params.name`.
   */
  params: Params<P>;
}

type Handler = (request: Request) => Response | Promise<Response>;

/**
 * A request handler that supports parameters.
 */
type HandlerP<P extends string> = (
  request: RequestP<P>,
) => Response | Promise<Response>;

export type { HandlerP as Handler, RequestP as RequestWithParams };

function defaultNotFound(_request: Request) {
  return new Response("not found", { status: 404 });
}

function defaultWrongMethod(_request: Request) {
  return new Response("wrong method", { status: 405 });
}

export type Method =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

/**
 * Route configuration type for method-specific handlers
 */
type RouteMethodHandlers<P extends string> = {
  [K in Method]?: HandlerP<P>;
};

/**
 * Route configuration type that can be:
 * - A handler function for all methods
 * - Method-specific handlers
 * - A static Response (which will only be returned for GET requests, other methods will get 405)
 */
type RouteConfig<P extends string> =
  | HandlerP<P>
  | RouteMethodHandlers<P>
  | Response;

interface RouterConfig {
  routes: Record<string, RouteConfig<string>>;
  notFound?: Handler;
  wrongMethod?: Handler;
}
/**
 * Router configuration interface
 */
interface RouterConfigP<R extends { [P in keyof R & string]: RouteConfig<P> }>
  extends RouterConfig {
  routes: R;
}

/**
 * HTTP Router interface with fetch method
 */
export interface HttpRouter {
  /**
   * Handles an incoming HTTP request and returns a Response
   *
   * Extracts the pathname from the request URL, finds a matching route handler,
   * and executes it. If no route matches, the notFound handler is used.
   */
  fetch(request: Request): Promise<Response>;
}

/**
 * Creates an HTTP router for handling HTTP requests with route-specific handlers
 *
 * Features:
 * - Route registration for different HTTP methods
 * - Parameter extraction from URL paths
 * - Support for standard Request/Response API
 * - Support for static responses
 *
 * @example
 * ```ts
 * const router = createHttpRouter({
 *   routes: {
 *     "/": req => new Response("Home"), // all methods
 *     "/users/:id": {
 *       GET: req => new Response(`User ${req.params.id}`), // just GET
 *     },
 *     "/about": new Response("About"), // static response (only works with GET requests)
 *   },
 *   notFound: (req) => new Response(`Not found: ${new URL(req.url).pathname}`, { status: 404 }),
 *   wrongMethod: (req) => new Response(`Method ${req.method} not allowed for ${new URL(req.url).pathname}`, { status: 405 }),
 * });
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
/**
 * Add parameters to a Request object, marking it as a RequestP
 */
function addParams<P extends string>(
  request: Request,
  params: Params<P>,
): asserts request is RequestP<P> {
  Object.defineProperty(request, "params", {
    value: params,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

export function createHttpRouter<
  Route extends { [Path in keyof Route & string]: RouteConfig<Path> },
>(config: RouterConfigP<Route>): HttpRouter;

export function createHttpRouter(config: RouterConfig): HttpRouter;

export function createHttpRouter(config: RouterConfig): HttpRouter {
  const notFound = config.notFound ?? defaultNotFound;
  const wrongMethod = config.wrongMethod ?? defaultWrongMethod;

  const routes: Record<string, (params: Record<string, string>) => Handler> =
    {};

  for (
    const [pathname, routeConfig] of Object.entries(config.routes)
  ) {
    // Create a specific handler based on routeConfig type
    if (routeConfig instanceof Response) {
      // Static response handler - only works for GET requests
      routes[pathname] = (params) => {
        return (request: Request) => {
          addParams(request, params);
          // Only allow GET requests for static responses
          if (request.method === "GET") {
            return routeConfig.clone();
          } else {
            // Method not allowed for non-GET requests to static responses
            return wrongMethod(request);
          }
        };
      };
    } else if (typeof routeConfig === "function") {
      // Function handler for all methods
      routes[pathname] = (params) => {
        return (request: Request) => {
          addParams(request, params);
          return routeConfig(request);
        };
      };
    } else {
      // Method-specific handlers
      routes[pathname] = (params) => {
        return (request: Request) => {
          addParams(request, params);

          const handler = routeConfig[request.method as Method];
          if (handler) {
            return handler(request);
          } else {
            // Method not allowed
            return wrongMethod(request);
          }
        };
      };
    }
  }

  const matcher = createMatcher<Handler>(routes);

  return {
    fetch: async (request: Request): Promise<Response> => {
      const { pathname } = new URL(request.url);
      const handler = matcher(pathname);

      if (handler === null) {
        return await notFound(request);
      }

      return await handler(request);
    },
  };
}
