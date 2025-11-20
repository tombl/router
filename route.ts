import type { Params } from "./params.ts";
import { escape } from "./regexp-escape.ts";

const NAMED_SEGMENT = /^:([a-z][a-z0-9]*)$/i;
const ENDS_WITH_NUMBER = /_\d+$/;

type Segment =
  | { type: "static"; value: string }
  | { type: "param"; name: string }
  | { type: "splat" };

export interface Route<Path extends string = string> {
  path: Path;
  segments: Segment[];
}

export function createRoute<const Path extends string>(
  path: Path,
): Route<Path> {
  return {
    path,
    segments: path.split("/").map<Segment>((segment, i, segments) => {
      if (segment === "*") {
        if (i !== segments.length - 1) {
          throw new Error(
            "The `*` catchall route parameter can only appear at the end of a route",
          );
        }
        return { type: "splat" };
      }

      const match = NAMED_SEGMENT.exec(segment);
      if (match !== null) {
        return { type: "param", name: match[1] };
      }

      return { type: "static", value: segment };
    }),
  };
}

export function href<R extends Route>(
  route: R,
  params: Params<R["path"]>,
): string;
export function href(route: Route, params: Record<string, string>): string {
  let url = route.segments
    .map((segment) => {
      switch (segment.type) {
        case "splat":
          return params["*"];
        case "param":
          return encodeURIComponent(params[segment.name]);
        case "static":
          return segment.value;
        default:
          segment satisfies never;
      }
    })
    .join("/");

  if (url === "") url = "/";
  if (url[0] !== "/") url = "/" + url;

  return url;
}

export type Matcher<R extends readonly Route[]> = (
  pathname: string,
) =>
  | {
    [I in keyof R]: { path: R[I]["path"]; params: Params<R[I]["path"]> };
  }[number]
  | null;

type AnyMatcher = (
  pathname: string,
) => { path: string; params: Record<string, string> } | null;

export function createMatcher<const R extends readonly Route[]>(
  routes: R,
): Matcher<R>;
export function createMatcher(routes: Route[]): AnyMatcher {
  if (routes.length === 0) return () => null;

  const mapping: number[] = [];
  let i = 0, j = 0;

  const regex = new RegExp(
    routes
      .map((route) => {
        mapping[i++] = j++;

        const pattern = route.segments
          .map((segment) => {
            switch (segment.type) {
              case "splat":
                i++;
                return `(?<splat>.*)`;
              case "param":
                i++;
                return `(?<${segment.name}_${i}>[^/]+?)`;
              case "static":
                return escape(segment.value);
              default:
                segment satisfies never;
            }
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
    const route = routes[idx];

    const params: Record<string, string> = {};
    for (let key in match.groups) {
      const value = match.groups[key];
      if (value === undefined) continue;

      if (key === "splat") {
        key = "*";
      } else {
        key = key.replace(ENDS_WITH_NUMBER, "");
      }

      params[key] = value;
    }

    return { path: route.path, params };
  };
}

{
  const a = createRoute("/:a");
  const b = createRoute("/:b");
  const matcher = createMatcher([a, b]);

  href(a, { a: "a" });
  href(b, { b: "b" });

  const match = matcher("/foo");
  switch (match?.path) {
    case a.path:
      match.params.a;
      break;
    case b.path:
      match.params.b;
      break;
    case null:
      // no match
      break;
  }
}
