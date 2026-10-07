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
import { indexAgreement, resolveLandingInstance, type IndexAgreement, type LandingInstance } from "../../cat-harness/schemas/harness-config.js";

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
        text: `${head}\n  ✓ / is ${r.name}'s landing — ${
          r.by === "sole" ? "the only instantiated harness, so no flag is needed" : r.by === "index" ? "index.config.json `site.landing`" : "flagged \"site\": { \"landing\": true }"
        }`,
        ok: true,
      };
    case "hub":
      return {
        text:
          r.flagged.length === 0
            ? `${head}\n  ✓ / is the neutral hub — index.config.json says \`site.landing: "hub"\`, so it lists the harnesses and the todos`
            : `${head}\n  ✓ / is the neutral hub — ${r.flagged.length} harnesses are flagged (${r.flagged.join(", ")}), so it lists the harnesses and the todos`,
        ok: true,
      };
    case "invalid":
      return { text: `${head}\n  ✗ ${r.file} cannot decide the landing: ${r.reason}. It is authoritative, so the per-config flags are NOT consulted instead.`, ok: false };
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

/**
 * Whether `index.config.json` and the root `<name>.config.json` files agree.
 * `undefined` (no index) is fine — the file scan is then the answer. A root
 * config the index does not import is a FAILURE: under the index it is not
 * instantiated, and under the old rule it was, so the two rules disagree about
 * this checkout and nothing should pick silently. An `import` naming a file
 * that is not there fails too. An instance with no config at all is fine.
 */
export function formatAgreement(a: IndexAgreement | undefined): { text: string; ok: boolean } {
  if (a === undefined) return { text: "index.config.json: absent — the root *.config.json files are the instantiated set", ok: true };
  const lines = ["index.config.json against the root *.config.json files:"];
  for (const n of a.unlisted) lines.push(`  ✗ ${n}.config.json is at the root and index.config.json does not list \`${n}\` — list it, or remove the stray config (an inherited fork file?)`);
  for (const m of a.missingImport) lines.push(`  ✗ \`${m.name}\` imports ${m.file}, which does not exist`);
  if (a.withoutConfig.length) lines.push(`  · listed with no config to import (fine): ${a.withoutConfig.join(", ")}`);
  const ok = a.unlisted.length === 0 && a.missingImport.length === 0;
  if (ok) lines.push("  ✓ every root config is listed, and every import exists");
  return { text: lines.join("\n"), ok };
}

if (import.meta.main) {
  const landing = formatLanding(resolveLandingInstance(REPO));
  console.log(landing.text);
  let agreement: { text: string; ok: boolean };
  try {
    agreement = formatAgreement(indexAgreement(REPO));
  } catch (e) {
    agreement = { text: `  ✗ ${(e as Error).message}`, ok: false };
  }
  console.log(agreement.text);
  if (!landing.ok || !agreement.ok) process.exit(1);
}
