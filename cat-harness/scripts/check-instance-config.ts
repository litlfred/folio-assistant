/**
 * Every instance's config is named after the instance, and no retired name
 * survives.
 *
 * ## Why this gate exists at all
 *
 * The config filename has changed twice. `folio.config.json` became
 * `harness.config.json` on 2026-09-18 (bean `6nfy`), as a HARD BREAK on the
 * owner's instruction — the old name "no longer read at all". Nothing
 * announced it, and two days later `9ici` found the cost: one reader had kept
 * the old name in a fallback loop, so an instance on the old spelling got a
 * DETERMINED answer for its voices while fifteen other settings vanished in
 * silence. The break was right; being quiet about it was not.
 *
 * `<instance>.config.json` (2026-09-20) is the third name, and the first to
 * ship with something that fails when a checkout is on the wrong one.
 *
 * ## What it checks, and the third state
 *
 * For every instance in the checkout:
 *
 *   - a config named after the instance, or none at all — both fine;
 *   - a config under the RETIRED global name — a finding, with the `git mv`
 *     to run, because nothing reads it and nothing else would say so;
 *   - a `*.config.json` at the instantiation root matching no declared
 *     instance — a finding, because it is either a rename half-done or a
 *     config for an instance that is not here, and the two are worth telling
 *     apart by hand.
 *
 * COULD-NOT-DETERMINE is its own exit. An unreadable declaration means the
 * instance's name is unknown, so its filename is unknowable — reported, never
 * folded into "no finding". A sweep that could not look has not cleared
 * anything (bean `xom7`).
 *
 * @module scripts/check-instance-config
 * @covers cat-harness
 */
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { findDeclarationFile, readDeclaration } from "../schemas/cat-harness.js";
import { instanceConfigFilename, LEGACY_HARNESS_CONFIG } from "../schemas/harness-config.js";

const CHECKOUT = resolve(import.meta.dir, "..", "..");

interface Finding {
  kind: "legacy" | "orphan" | "unknown";
  detail: string;
  fix?: string;
}

/** Instance roots: the checkout itself, and each immediate subdirectory that declares. */
function instanceRoots(checkout: string): string[] {
  const out: string[] = [];
  if (findDeclarationFile(checkout) !== undefined) out.push(checkout);
  for (const entry of readdirSync(checkout, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const d = join(checkout, entry.name);
    if (findDeclarationFile(d) !== undefined) out.push(d);
  }
  return out;
}

export function sweep(checkout: string): { findings: Finding[]; expected: Set<string> } {
  const findings: Finding[] = [];
  const expected = new Set<string>();

  for (const root of instanceRoots(checkout)) {
    let name: string | undefined;
    try {
      name = readDeclaration(root)?.name;
    } catch (e) {
      findings.push({
        kind: "unknown",
        detail: `${root}: declaration unreadable, so this instance's config filename is UNKNOWN — ${e instanceof Error ? e.message : String(e)}`,
      });
      continue;
    }
    if (name === undefined) {
      findings.push({ kind: "unknown", detail: `${root}: declaration names no instance` });
      continue;
    }
    expected.add(instanceConfigFilename(name));

    // The retired name, wherever it sits: beside the declaration or at the
    // checkout root. Both are places a migration would leave one.
    for (const d of new Set([root, checkout])) {
      const legacy = join(d, LEGACY_HARNESS_CONFIG);
      if (existsSync(legacy)) {
        findings.push({
          kind: "legacy",
          detail: `${legacy} is the RETIRED global name — nothing reads it`,
          fix: `git mv ${legacy} ${join(checkout, instanceConfigFilename(name))}`,
        });
      }
    }
  }

  // A `*.config.json` at the instantiation root that no instance claims.
  for (const f of readdirSync(checkout)) {
    if (!f.endsWith(".config.json") || f === LEGACY_HARNESS_CONFIG) continue;
    if (expected.has(f)) continue;
    findings.push({
      kind: "orphan",
      detail: `${join(checkout, f)} matches no declared instance in this checkout`,
      fix: "rename it to match an instance's `name`, or remove it if its instance has gone",
    });
  }

  return { findings, expected };
}

if (import.meta.main) {
  const { findings, expected } = sweep(CHECKOUT);
  console.log(`Instance configs — ${expected.size} instance(s) declared:`);
  for (const f of [...expected].sort()) {
    console.log(`  ${existsSync(join(CHECKOUT, f)) ? "✓" : "·"} ${f}`);
  }
  console.log("\n  (· = declared but no config written; a legitimate state.)");

  if (findings.length === 0) {
    console.log("\n✓ every config is named after its instance, and no retired name survives");
    process.exit(0);
  }
  console.error(`\n✗ ${findings.length} finding(s):`);
  for (const f of findings) {
    console.error(`  [${f.kind}] ${f.detail}`);
    if (f.fix) console.error(`      ${f.fix}`);
  }
  // `unknown` fails too, and says so: a sweep that could not read a
  // declaration has not established that the others are fine either.
  process.exit(1);
}
