import { escape } from "jsr:@std/regexp/escape";

const NAMED_SEGMENT = /^:([a-z][a-z0-9]*)$/i;

export type Router<T> = (pathname: string) => T | null;
export type Routes<T> = Record<string, (params: Record<string, string>) => T>;
/**
 * Creates a router function that matches paths against defined routes with parameters
 * @param routes Record mapping route patterns to handler functions
 * @returns A function that takes a pathname and returns the handler result or null if no match
 */
export function createRouter<T>(routes: Routes<T>): Router<T> {
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
