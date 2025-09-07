/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Compile-time assertion that `Actual` extends `Expected`.
 * Will cause a TypeScript error if the constraint is not satisfied.
 *
 * Usage:
 * ```ts
 * checkTypeExtends<ActualType, ExpectedShape>();
 * ```
 */
export function checkTypeExtends<Actual extends Expected, Expected>() {}
