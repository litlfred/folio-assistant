/**
 * @module @folio-assistant/schemas
 * @description Core schema package for the agent skills framework.
 *
 * Re-exports all types, Zod validation schemas, and builder functions.
 * @graphNode none — a re-export barrel: it defines nothing of its own
 */

export * from "./types.js";
export * from "./constraints.js";
export * from "./builders.js";
// The `dak` adapter's blocks (WHO SMART Guidelines L2/L3) were re-exported
// here until bean `1335`. They are smart-base's now —
// `smart-base/schemas/dak-blocks.ts` — and reach core by contribution, so a
// core barrel re-exporting them would be core importing a harness.
