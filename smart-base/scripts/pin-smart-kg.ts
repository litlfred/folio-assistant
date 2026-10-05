#!/usr/bin/env bun
/**
 * Snapshot the CLASS vocabulary of smart-kg at the commit smart-base pins.
 *
 * Owner, 2026-10-02 (#1767): *"utilize https://github.com/litlfred/smart-kg for
 * L1 related stuff"* and *"(perhaps subgraph in smart-base to help define l1
 * dth etc docs?)"*. And, 2026-09-23 (bean `wg7r`): *"dont want smart-kg here
 * yet, that is its own repo already"*. Both hold at once only if smart-kg is
 * REFERENCED rather than copied — so the pin record names a commit, and this
 * writes the one thing a check here needs offline: which class ids exist at
 * that commit. Not the notes, not the edges, not the projections. Bean `pebe`.
 *
 * The snapshot reuses `folio-pinned-terminology/v1` rather than minting a
 * family: a class id in a layer is a code in a system, and the check that
 * reads it ("is this term in the pinned edition?") is the same question
 * `check:term-mapping` asks of smart-base's code systems.
 *
 * ## Why the checkout's HEAD must equal the pin
 *
 * A snapshot taken from a different commit than the record names would be a
 * correct-looking file asserting the wrong edition. So the pin moves first —
 * edit `version` in the record — and this refuses to write until the checkout
 * is at it.
 *
 *   git clone https://github.com/litlfred/smart-kg /path/smart-kg
 *   bun run smart-base/scripts/pin-smart-kg.ts --checkout /path/smart-kg
 *   bun run smart-base/scripts/pin-smart-kg.ts --check     # offline
 *
 * @module smart-base/scripts/pin-smart-kg
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { ExternalSchemaSchema } from "../platform.js";
import {
  PINNED_TERMINOLOGY_TAG,
  PinnedTerminologySchema,
  type PinnedConcept,
  type PinnedTerminologyFile,
} from "../platform.js";

const HERE = resolve(import.meta.dir, "..");
export const SMART_KG_PIN = join(HERE, "external-schemas", "who-smart-kg.json");
export const SMART_KG_TERMS = join(HERE, "external-schemas", "who-smart-kg.terms.json");

/** The layers snapshotted, and the system each one's classes are codes in. */
export const SMART_KG_LAYERS = [
  { layer: "l1", system: "sgkg-l1" },
  { layer: "l2", system: "sgkg-l2" },
] as const;

interface OntologyClass {
  id: string;
  name?: string;
}

/** The classes of every snapshotted layer in a smart-kg checkout. */
export function classesIn(checkout: string): PinnedConcept[] {
  const out: PinnedConcept[] = [];
  for (const { layer, system } of SMART_KG_LAYERS) {
    const path = join(checkout, "ontology", layer, `${layer}.json`);
    if (!existsSync(path)) throw new Error(`${path} is missing — is ${checkout} a smart-kg checkout?`);
    const doc = JSON.parse(readFileSync(path, "utf-8")) as { classes?: OntologyClass[] };
    if (!Array.isArray(doc.classes) || doc.classes.length === 0) throw new Error(`${path} declares no classes`);
    for (const c of doc.classes) out.push({ system, code: c.id, display: c.name ?? c.id });
  }
  return out;
}

export function snapshot(version: string, concepts: PinnedConcept[], repoRoot: string): PinnedTerminologyFile {
  return PinnedTerminologySchema.parse({
    $schema: PINNED_TERMINOLOGY_TAG,
    _comment:
      "DERIVED from the commit pinned in smart-base/external-schemas/who-smart-kg.json — the class ids of smart-kg's " +
      "L1 and L2 ontology layers, and nothing else of it. Never hand-edit: move the pin, check out that commit, and " +
      "re-run smart-base/scripts/pin-smart-kg.ts --checkout <path>. Bean pebe.",
    pin: relative(repoRoot, SMART_KG_PIN),
    version,
    source: "https://github.com/litlfred/smart-kg",
    concepts,
  });
}

/** Every term the snapshot holds, as `<system>#<code>`. */
export function pinnedTerms(file = SMART_KG_TERMS): Set<string> {
  const t = PinnedTerminologySchema.parse(JSON.parse(readFileSync(file, "utf-8")));
  return new Set(t.concepts.map((c) => `${c.system}#${c.code}`));
}

/** Why the snapshot does not match its pin, or `undefined` when it does. Offline. */
export function snapshotProblem(): string | undefined {
  const pin = ExternalSchemaSchema.parse(JSON.parse(readFileSync(SMART_KG_PIN, "utf-8")));
  const t = PinnedTerminologySchema.parse(JSON.parse(readFileSync(SMART_KG_TERMS, "utf-8")));
  return t.version === pin.version
    ? undefined
    : `${relative(resolve(HERE, ".."), SMART_KG_TERMS)} is of ${t.version}, but the pin names ${pin.version} — re-run pin-smart-kg.ts --checkout`;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const repoRoot = resolve(HERE, "..");
  const pin = ExternalSchemaSchema.parse(JSON.parse(readFileSync(SMART_KG_PIN, "utf-8")));
  if (args.includes("--check")) {
    const problem = snapshotProblem();
    if (problem) {
      console.error(`✗ ${problem}`);
      process.exit(1);
    }
    console.log(`✓ smart-kg snapshot matches the pin (${pin.version.slice(0, 12)}, ${pinnedTerms().size} classes)`);
    process.exit(0);
  }
  const i = args.indexOf("--checkout");
  const checkout = i >= 0 ? args[i + 1] : undefined;
  if (!checkout) {
    console.error("usage: pin-smart-kg.ts --checkout <smart-kg checkout at the pinned commit> | --check");
    process.exit(2);
  }
  const head = execFileSync("git", ["-C", checkout, "rev-parse", "HEAD"], { encoding: "utf-8" }).trim();
  if (head !== pin.version) {
    console.error(`✗ ${checkout} is at ${head}, the pin names ${pin.version}. Move the pin first, or check out the pinned commit.`);
    process.exit(1);
  }
  const file = snapshot(pin.version, classesIn(checkout), repoRoot);
  writeFileSync(SMART_KG_TERMS, `${JSON.stringify(file, null, 2)}\n`);
  console.log(`wrote ${relative(repoRoot, SMART_KG_TERMS)} — ${file.concepts.length} classes at ${head.slice(0, 12)}`);
}
