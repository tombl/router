/**
 * A generic router implementation for various types of applications.
 * Compiles a set of routes into a single regexp for reasonably fast matching
 * in a small amount of code.
 * @module
 */

import type { Params } from "./params.ts";
import { escape } from "./regexp-escape.ts";

export type { Params };

const NAMED_SEGMENT = /^:([a-z][a-z0-9]*)$/i;
const ENDS_WITH_NUMBER = /_\d+$/;

/**
 * The type returned by {@link createMatcher}, representing a compiled match function
 * for a set of routes.
 */
export type Matcher<T> = (pathname: string) => T | null;

type RouteHandler<P extends string, T> = (params: Params<P>) => T;

/**
 * Routes mapping type that associates route patterns with handler functions
 *
 * This type maps each route pattern to a handler function that receives
 * typed parameters extracted from that specific route pattern.
 */
export type Routes<
  T,
  Route extends { [Paths in keyof Route & string]: RouteHandler<Paths, T> },
> = Route;

/**
 * Creates a router function that matches paths against defined routes with parameters
 *
 * Supports three types of route segments:
 * - Static segments: Exact string matches (e.g., "/users")
 * - Named parameters: Segments starting with : (e.g., "/:id")
 * - Splat parameter: A "*" segment that can only appear at the end of a route
 *
 * @example
 * ```ts
 * const matcher = createMatcher({
 *   "/": () => "Home",
 *   "/users/:id": (params) => `User ${params.id}`,
 *   "/files/*": (params) => `File ${params["*"]}`
 * });
 *
 * matcher("/users/123"); // "User 123"
 * matcher("/files/path/to/file.txt"); // "File path/to/file.txt"
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
          .map((segment, k, segments) => {
            if (segment === "*") {
              if (k !== segments.length - 1) {
                throw new Error(
                  "The `*` catchall route parameter can only appear at the end of a route",
                );
              }
              i++;
              return `(?<splat>.*)`;
            }

            const match = NAMED_SEGMENT.exec(segment);
            if (match) {
              const [, name] = match;
              i++;
              return `(?<${name}_${i}>[^/]+?)`;
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

    const groups: Record<string, string> = {};
    for (let key in match.groups) {
      const value = match.groups[key];
      if (value === undefined) continue;

      if (key === "splat") {
        key = "*";
      } else {
        key = key.replace(ENDS_WITH_NUMBER, "");
      }

      groups[key] = value;
    }

    return fn(groups);
  };
}
