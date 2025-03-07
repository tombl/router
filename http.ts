import { createRouter, Router as Matcher, Routes } from "./mod.ts";

interface RequestP extends Request {
  params: Record<string, string>;
}

type Handler = (request: Request) => Response | Promise<Response>;
type HandlerP = (request: RequestP) => Response | Promise<Response>;

export type { HandlerP as Handler, RequestP as RequestWithParams };

function defaultNotFound() {
  return new Response("not found", { status: 404 });
}
function defaultWrongMethod() {
  return new Response("wrong method", { status: 405 });
}

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

  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    const match = this.#getMatcher();
    const handler = match(pathname) ?? this.#notFound;
    return await handler(request);
  }

  #route(method: string, pathname: string, handler: HandlerP): void {
    if (pathname[0] !== "/") pathname = "/" + pathname;
    this.#routes[pathname] ??= {};
    this.#routes[pathname][method] = handler;
    this.#matcher = null;
  }

  get(pathname: string, handler: HandlerP): void {
    this.#route("GET", pathname, handler);
  }

  post(pathname: string, handler: HandlerP): void {
    this.#route("POST", pathname, handler);
  }

  put(pathname: string, handler: HandlerP): void {
    this.#route("PUT", pathname, handler);
  }

  delete(pathname: string, handler: HandlerP): void {
    this.#route("DELETE", pathname, handler);
  }

  patch(pathname: string, handler: HandlerP): void {
    this.#route("PATCH", pathname, handler);
  }

  options(pathname: string, handler: HandlerP): void {
    this.#route("OPTIONS", pathname, handler);
  }

  head(pathname: string, handler: HandlerP): void {
    this.#route("HEAD", pathname, handler);
  }
}
