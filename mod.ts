import { escape } from "jsr:@std/regexp/escape";

// input:
const routes: Record<string, (params: Record<string, string>) => string> = {
  "a": () => "A",
  "a/:name": ({ name }) => `A ${name}`,
  "b": () => "B",
};
const path = "a";

// library

const SEGMENT = /^:([a-z][a-z0-9]*)$/i;

const mapping = new Map<number, number>();
let i = 0, j = 0;

const regex = new RegExp(
  Object.keys(routes)
    .map((route) => {
      mapping.set(i++, j++);
      return route
        .split("/")
        .map((segment) => {
          const match = SEGMENT.exec(segment);
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

const match = regex.exec(path);
console.log(regex);

if (match !== null) {
  const idx = mapping.get(match.slice(1).findIndex((x) => x !== undefined))!;
  console.log(Object.values(routes)[idx](match.groups!));
}
