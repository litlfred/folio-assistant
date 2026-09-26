#!/usr/bin/env bun
/**
 * Every module in the declared `schemas/` directory declares what it is.
 *
 * `harness.json` declares `schemas/` as holding a `schemas` graph, and
 * until 2026-09-19 the export produced no nodes of that kind at all — a
 * declaration with nothing behind it, which is the `dh4f` shape reaching the
 * instance's own root declaration. Bean `xxxb`.
 *
 * The membership test is now the file's own `@graphNode` tag, and this gate is
 * what stops it rotting: a module added to `schemas/` without one is silently
 * ABSENT from the published graph, and absence is the one failure a consumer
 * cannot distinguish from "this instance has none".
 *
 * ## Three states, and the third is not a pass
 *
 * - declared `schema` → a node;
 * - declared `none — <reason>` → deliberately not a node, and the reason is
 *   required so that silencing costs more than declaring;
 * - **undeclared** → reported, non-zero. A `*.test.ts` is undeclared too, and
 *   is listed separately rather than pattern-excluded: excluding by extension
 *   restates a layout coincidence, which is the "distinguishable by extension
 *   … a coincidence of the current layout, not a contract" defect #263 named.
 *   It is not an error, because a test declaring nothing is the expected shape.
 *
 * Usage:  bun run check:schema-nodes
 *
 * @module scripts/check-schema-nodes
 * @covers schemas
 * @graphNode none — a gate over the declarations, not a schema itself
 */
import { resolve } from "node:path";

import { auditSchemaNodes } from "./schema-nodes.js";

const ROOT = resolve(import.meta.dir, "..");

if (import.meta.main) {
  const a = auditSchemaNodes(ROOT);

  // An empty corpus is not a pass. A renamed or moved `schemas/` would
  // otherwise turn this gate into a silent success over nothing — the same
  // defect it exists to catch, one level up.
  if (a.nodes.length + a.exempt.length + a.undeclared.length === 0) {
    console.error("No modules found under schemas/ — refusing to report a clean run.");
    process.exit(2);
  }

  const bad = a.undeclared.length + a.reasonless.length;
  if (bad === 0) {
    console.log(
      `✓ every schemas/*.ts declares itself: ${a.nodes.length} node(s), ` +
        `${a.exempt.length} deliberately not (${a.exempt.map((m) => m.name).join(", ")}), ` +
        `${a.undeclaredTests.length} test file(s) outside the graph.`,
    );
    process.exit(0);
  }

  console.error(`${bad} module(s) in schemas/ do not declare what they are:`);
  for (const m of a.undeclared) {
    console.error(`  ✗ ${m.module}\n      no @graphNode tag — it is absent from the published graph.`);
  }
  for (const m of a.reasonless) {
    console.error(`  ✗ ${m.module}\n      @graphNode none with no reason. Write "none — <why>".`);
  }
  console.error(
    '\nAdd `@graphNode schema` to the leading docblock, or `@graphNode none — <reason>`\n' +
      "if the module defines no schema (a barrel, a constant, a function library).",
  );
  process.exit(1);
}
