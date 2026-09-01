/**
 * Lets the check scripts import app source the way the app writes it.
 *
 * Vite resolves `./nxn` to `./nxn.ts`; bare node does not. Rather than litter
 * the source with extensions that only exist to keep a test runner happy, this
 * teaches node the same rule: try `.ts`, then `/index.ts`, then give up and let
 * the default resolver produce its own error.
 */
export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    for (const candidate of [`${specifier}.ts`, `${specifier}/index.ts`]) {
      try {
        return await next(candidate, context);
      } catch {
        // Try the next shape.
      }
    }
  }
  return next(specifier, context);
}
