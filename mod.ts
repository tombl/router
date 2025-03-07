/**
 * A generic router implementation for various types of applications.
 * Compiles a set of routes into a single regexp for reasonably fast matching
 * in a small amount of code.
 * @module
 */

import { escape } from "./regexp-escape.ts";

const NAMED_SEGMENT = /^:([a-z][a-z0-9]*)$/i;

/**
 * The type returned by {@link createMatcher}, representing a compiled match function
 * for a set of routes.
 */
export type Matcher<T> = (pathname: string) => T | null;

/**
 * Extract parameter names from a route pattern
 *
 * @example
 * type UserParams = Params<"/users/:id/posts/:postId">; // { id: string; postId: string }
 */
export type Params<P extends string> = P extends
  `${string}/:${infer Param}/${infer Rest}`
  ? { [K in Param]: string } & Params<`/${Rest}`>
  : P extends `${string}/:${infer Param}` ? { [K in Param]: string }
  : P extends `${string}/*/${infer Rest}` ? { "*": string } & Params<`/${Rest}`>
  : P extends `${string}/*` ? { "*": string }
  // deno-lint-ignore ban-types
  : {};

type RouteHandler<P extends string, T> = (params: Params<P>) => T;

/**
 * Routes mapping type that associates route patterns with handler functions
 *
 * This type maps each route pattern to a handler function that receives
 * typed parameters extracted from that specific route pattern.
 */
export type Routes<
  T,
  R extends { [P in keyof R & string]: RouteHandler<P, T> },
> = R;

/**
 * Creates a router function that matches paths against defined routes with parameters
 *
 * Supports three types of route segments:
 * - Static segments: Exact string matches (e.g., "/users")
 * - Named parameters: Segments starting with : (e.g., "/:id")
 * - Splat parameter: A "*" segment that captures the rest of the path
 *
 * @example
 * ```ts
 * const router = createMatcher({
 *   "/": () => "Home",
 *   "/users/:id": (params) => `User ${params.id}`,
 *   "/files/*": (params) => `File ${params["*"]}`
 * });
 *
 * router("/users/123"); // "User 123"
 * router("/files/path/to/file.txt"); // "File path/to/file.txt"
 * ```
 */
export function createMatcher<
  T,
  Route extends { [Path in keyof Route & string]: RouteHandler<Path, T> },
>(routes: Routes<T, Route>): Matcher<T>;

export function createMatcher<T>(
  routes: Record<string, (params: Record<string, string>) => T>,
): Matcher<T>;

export function createMatcher<T>(
  routes: Record<string, (params: Record<string, string>) => T>,
): Matcher<T> {
  const entries = Object.entries(routes);

  if (entries.length === 0) return () => null;

  const mapping: number[] = [];
  let i = 0, j = 0;

  const regex = new RegExp(
    entries
      .map(([route]) => {
        mapping[i++] = j++;

        const pattern = route
          .split("/")
          .map((segment) => {
            if (segment === "*") {
              i++;
              return `(?<_splat>.*)`;
            }

            const match = NAMED_SEGMENT.exec(segment);
            if (match) {
              const [, name] = match;
              i++;
              return `(?<${name}>[^/]+?)`;
            }

            return escape(segment);
          })
          .join("/");

        return `^(${pattern})$`;
      })
      .join("|"),
  );

  return (pathname) => {
    const match = regex.exec(pathname);
    if (match === null) return null;

    const idx = mapping[match.findIndex((m, i) => i && m !== undefined) - 1];
    const fn = entries[idx][1];

    const groups = match.groups ?? {};
    if ("_splat" in groups) {
      groups["*"] = groups._splat;
      delete groups._splat;
    }

    return fn(groups);
  };
}
