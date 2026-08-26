/**
 * @module @folio-assistant/schemas
 * @description Core schema package for the agent skills framework.
 *
 * Re-exports all types, Zod validation schemas, and builder functions.
 */

export * from "./types.js";
export * from "./constraints.js";
export * from "./builders.js";
// The `dak` adapter's blocks — WHO SMART Guidelines L2/L3. Separate module,
// separate union, same `BlockBase` fields; see schemas/dak-blocks.ts.
export * from "./dak-blocks.js";
