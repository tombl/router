// deno-fmt-ignore
type Letter = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
            | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
            | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
            | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type ValidNameRest<Rest extends string> = Rest extends
  `${Letter | Digit}${infer Next}` ? ValidNameRest<Next>
  : Rest extends "" ? true
  : false;

type ValidName<Name extends string> = Name extends `${Letter}${infer Rest}`
  ? ValidNameRest<Rest> extends true ? Name
  : never
  : never;

type ParamSegment<Segment extends string> = Segment extends `:${infer Name}`
  ? { [K in Name as ValidName<K>]: string }
  // deno-lint-ignore ban-types
  : {};

type ParamsInner<Path extends string> = Path extends
  `${infer Segment}/${infer Rest}` ? ParamSegment<Segment> & ParamsInner<Rest>
  : ParamSegment<Path>;

/**
 * Extract parameter names from a route pattern
 *
 * @example
 * type UserParams = Params<"/users/:id/posts/:postId">; // { id: string; postId: string }
 *
 * Supports:
 * - Named parameters with syntax `:paramName` (must start with a letter)
 * - A splat parameter (`*`) which can only appear at the end of a route
 */
export type Params<Path extends string> = Path extends `${infer P}/*`
  ? ParamsInner<P> & { "*": string }
  : keyof ParamsInner<Path> extends never ? Record<string, never>
  : ParamsInner<Path>;
