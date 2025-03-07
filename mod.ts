import { escape } from "jsr:@std/regexp/escape";

const NAMED_SEGMENT = /^:([a-z][a-z0-9]*)$/i;

/**
 * Creates a router function that matches paths against defined routes with parameters
 * @param routes Record mapping route patterns to handler functions
 * @returns A function that takes a pathname and returns the handler result or null if no match
 */
export function createRouter<T>(
  routes: Record<string, (params: Record<string, string>) => T>,
): (pathname: string) => T | null {
  const entries = Object.entries(routes);

  if (entries.length === 0) return () => null;

  const mapping: number[] = [];
  let i = 0, j = 0;

  const regex = new RegExp(
    entries
      .map(([route]) => {
        mapping[i++] = j++;
        return route
          .split("/")
          .map((segment) => {
            const match = NAMED_SEGMENT.exec(segment);
            if (match === null) {
              return escape(segment);
            } else {
              i++;
              return `(?<${match[1]}>[^/]+?)`;
            }
          })
          .join("/");
      })
      .map((route) => `^(${route})$`)
      .join("|"),
  );

  return (pathname: string): T | null => {
    const match = regex.exec(pathname);
    if (match === null) return null;

    const idx = mapping[match.findIndex((m, i) => i && m !== undefined) - 1];
    const fn = entries[idx][1];

    return fn(match.groups!);
  };
}
