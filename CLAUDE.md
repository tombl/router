# Path Router Development Guide

## Commands

- **Run all tests**: `deno test`
- **Run specific test**:
  `deno test mod_test.ts --filter="router handles splat routes"`
- **Run benchmarks**: `deno bench bench.ts`
- **Run comparison benchmarks**: `deno bench bench_compare.ts`

## Code Style Guidelines

- Use 2-space indentation
- Use double quotes for strings
- Include semicolons at line endings
- Use camelCase for variables and functions
- Add JSDoc comments for public functions
- Follow an immutable programming style

## TypeScript Practices

- Use explicit typing with TypeScript
- Use generics for type safety (e.g., `createMatcher<T>`)
- Return null for non-matching routes

## Testing

- Write comprehensive test coverage
- Organize tests by feature with descriptive names
- Use `Deno.test()` and `assertEquals` for assertions

## Import Style

- Use named imports: `import { escape } from "@std/regexp/escape"`
- Dependencies are managed via JSR registry in deno.json
