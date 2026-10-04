#!/usr/bin/env bun
/**
 * The site has a landing page that was DECIDED, not guessed (issue #1904).
 *
 * @module scripts/check-landing-instance
 * @covers cat-harness — the instance axis: which instantiated harness the published site puts at `/`
 *
 * The owner's ruling, 2026-10-02, verbatim:
 *
 * > "Flag it, with a default (recommended). The chosen instance's own
 * > `<name>.config.json` carries `"site": { "landing": true }`. If exactly one
 * > harness is instantiated, it is the landing page and no flag is needed.
 * > That covers smart-trust. If there are several and none is flagged, a gate
 * > fails. If more than one is flagged, then neutral hub with listing of
 * > harnesses, todos,"
 *
 * This is that gate. The resolution is `resolveLandingInstance` in
 * `schemas/harness-config.ts`, the only reader of the flag; this script
 * reports its answer and fails on `ambiguous`. `none` passes: a checkout with
 * nothing instantiated has no site landing to decide, and failing there
 * would make every bare fixture red.
 *
 * Exit codes: 0 decided (an instance, a hub, or nothing instantiated) · 1
 * several harnesses and none flagged, or a config that cannot be read.
 */
import { resolve } from "node:path";

import { repoRootFor } from "../../cat-harness/schemas/cat-harness.js";
import { resolveLandingInstance, type LandingInstance } from "../../cat-harness/schemas/harness-config.js";

/**
 * Resolved from this file, not `process.cwd()` (`check-folio-mount` says why:
 * run from the root, `repoRootFor(cwd)` walked up to the parent and reported a
 * clean run over nothing, `dh4f`).
 */
const REPO = repoRootFor(resolve(import.meta.dir, ".."));

/** The report, and whether it fails. Pure, so the tests need no process. */
export function formatLanding(r: LandingInstance): { text: string; ok: boolean } {
  const head = `Site landing instance (${r.names.length} instantiated harness(es))`;
  switch (r.kind) {
    case "none":
      return { text: `${head}\n  · nothing is instantiated here: no \`<name>.config.json\` at the root, so there is no landing to decide`, ok: true };
    case "instance":
      return {
        text: `${head}\n  ✓ / is ${r.name}'s landing — ${r.by === "sole" ? "the only instantiated harness, so no flag is needed" : "flagged \"site\": { \"landing\": true }"}`,
        ok: true,
      };
    case "hub":
      return {
        text: `${head}\n  ✓ / is the neutral hub — ${r.flagged.length} harnesses are flagged (${r.flagged.join(", ")}), so it lists the harnesses and the todos`,
        ok: true,
      };
    case "ambiguous":
      return {
        text:
          r.reason === "unreadable"
            ? `${head}\n  ✗ cannot decide: ${r.unreadable.map((n) => `${n}.config.json`).join(", ")} cannot be read (invalid JSON, or a \`site\` that is not { "landing": boolean }), and its flag decides the answer`
            : `${head}\n  ✗ ${r.names.length} harnesses are instantiated (${r.names.join(", ")}) and none is flagged.\n` +
              `    Add "site": { "landing": true } to the landing harness's own <name>.config.json — or to two or more, for a neutral hub (issue #1904).`,
        ok: false,
      };
  }
}

if (import.meta.main) {
  const { text, ok } = formatLanding(resolveLandingInstance(REPO));
  console.log(text);
  if (!ok) process.exit(1);
}
