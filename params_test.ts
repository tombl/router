import { assertType, type IsExact } from "@std/testing/types";
import type { Params } from "./params.ts";

// deno-lint-ignore ban-types
type Empty = {};

// Test simple static route
assertType<IsExact<Params<"/static/route">, Empty>>(true);

// Test single parameter route
assertType<IsExact<Params<"/users/:id">, { id: string }>>(true);

// Test multiple parameters in a route
assertType<
  IsExact<Params<"/users/:userId/posts/:postId">, {
    userId: string;
    postId: string;
  }>
>(true);

// Test splat parameter
assertType<IsExact<Params<"/files/*">, { "*": string }>>(true);
assertType<IsExact<Params<"/files/*/stuff">, Empty>>(true);

// Test mixed parameters and splat
assertType<
  IsExact<Params<"/users/:userId/files/*">, {
    userId: string;
    "*": string;
  }>
>(true);

// Test complex route with multiple parameters
assertType<
  IsExact<Params<"/blog/:year/:month/:day/:slug">, {
    year: string;
    month: string;
    day: string;
    slug: string;
  }>
>(true);

// Test with repeated parameter names (they should overwrite in the final type)
assertType<
  IsExact<Params<"/:id/posts/:id">, {
    id: string;
  }>
>(true);

// Test empty route
assertType<IsExact<Params<"">, Empty>>(true);

// Test route with only root
assertType<IsExact<Params<"/">, Empty>>(true);
