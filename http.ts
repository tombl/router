/**
 * A basic router implementation for the standard web Request/Response API.
 * @module
 */

import { createMatcher, type Params, type Routes } from "./mod.ts";

/**
 * Like a Request, but with parameters.
 */
interface RequestP extends Request {
  /**
   * The parameters extracted from the path.
   * `/:name` will be available as `request.params.name`.
   */
  params: Params;
}

type Handler = (request: Request) => Response | Promise<Response>;

/**
 * A request handler that supports parameters.
 */
type HandlerP = (request: RequestP) => Response | Promise<Response>;

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
type RouteMethodHandlers = {
  [K in Method]?: HandlerP;
};

/**
 * Route configuration type that can be:
 * - A handler function for all methods
 * - Method-specific handlers
 * - A static Response (which will only be returned for GET requests, other methods will get 405)
 */
type RouteConfig = HandlerP | RouteMethodHandlers | Response;

/**
 * Router configuration interface
 */
interface RouterConfig {
  routes: { [pathname: string]: RouteConfig };
  notFound?: Handler;
  wrongMethod?: Handler;
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
function addParams(
  request: Request,
  params: Params,
): asserts request is RequestP {
  Object.defineProperty(request, "params", {
    value: params,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

export function createHttpRouter(config: RouterConfig): HttpRouter {
  const notFound = config.notFound ?? defaultNotFound;
  const wrongMethod = config.wrongMethod ?? defaultWrongMethod;

  const routes: Routes<Handler> = {};

  for (const [pathname, routeConfig] of Object.entries(config.routes)) {
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

  const matcher = createMatcher(routes);

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
