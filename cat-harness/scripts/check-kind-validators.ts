#!/usr/bin/env bun
/**
 * Every graph kind that declares a validator — does it actually load?
 *
 * Bean `folio-assistant-i31r`. Two failure modes, and only one of them fails
 * the build:
 *
 * 1. **A declared validator that does not resolve** — a wrong path, a missing
 *    export, or a module that exports an interface rather than a Zod schema.
 *    That is a defect and it fails. It is also not hypothetical: the three
 *    `schema` paths on these kinds silently became instance-relative when
 *    `#437` moved the instance under `cat-harness/`, and nothing noticed,
 *    because nothing read them.
 * 2. **A kind with no validator at all** — reported, never failed. 13 of 16
 *    base kinds are in that state today and one is `qa`, the largest
 *    generated graph here. Failing on it would make the check unrunnable;
 *    hiding it would report a clean sweep over most of the corpus.
 *
 * `--require-all` turns state 2 into a failure, for the day the gap is meant
 * to be closed.
 *
 * @module folio-assistant/scripts/check-kind-validators
 */

import { BASE_GRAPH_KINDS } from "../schemas/cat-harness.js";
import { resolveKindValidator } from "../schemas/kind-validator.js";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
const instanceRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

export interface ValidatorSweep {
  resolved: string[];
  undeclared: string[];
  unresolvable: { kind: string; reason: string }[];
}

export async function sweep(root: string): Promise<ValidatorSweep> {
  const out: ValidatorSweep = { resolved: [], undeclared: [], unresolvable: [] };
  for (const kind of Object.keys(BASE_GRAPH_KINDS)) {
    const r = await resolveKindValidator(kind, root);
    if (r.state === "resolved") out.resolved.push(kind);
    else if (r.state === "undeclared") out.undeclared.push(kind);
    else out.unresolvable.push({ kind: r.kind, reason: r.reason });
  }
  return out;
}

async function main(): Promise<number> {
  const requireAll = process.argv.includes("--require-all");
  const r = await sweep(instanceRoot);
  const total = r.resolved.length + r.undeclared.length + r.unresolvable.length;

  if (total === 0) {
    // A sweep over no kinds has not passed. This repository has paid three
    // times for a check that ticked over an empty set.
    console.log("⚠ EXAMINED NOTHING — no graph kinds are registered");
    return 1;
  }

  console.log(`${total} graph kind(s): ${r.resolved.length} with a validator that loads`);
  for (const k of r.resolved) console.log(`  ✓ ${k}`);

  if (r.unresolvable.length > 0) {
    console.log(`\n✗ ${r.unresolvable.length} declare a validator that does not resolve:`);
    for (const u of r.unresolvable) console.log(`  ✗ ${u.kind}: ${u.reason}`);
    return 1;
  }

  const msg =
    `${r.undeclared.length} kind(s) declare no validator — a node of those kinds ` +
    `cannot be checked, and must be reported as "could not determine" rather than ` +
    `as valid: ${r.undeclared.join(", ")}`;
  if (r.undeclared.length > 0) {
    if (requireAll) {
      console.log(`\n✗ ${msg}`);
      return 1;
    }
    console.log(`\n⚠ ${msg}`);
  }
  console.log(`\n✓ every declared validator resolves to a runnable Zod schema`);
  return 0;
}

if (import.meta.main) process.exit(await main());
