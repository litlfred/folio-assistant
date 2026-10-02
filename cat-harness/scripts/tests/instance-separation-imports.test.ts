/**
 * An instance staged here ahead of leaving for its own repository reaches the
 * platform through ONE file: its `platform.ts`.
 *
 * `check:import-direction` already asks whether an instance CAN be lifted out:
 * nothing it loads may live outside what it `needs`. This asks the next
 * question, the one the move itself pays for — how many edits does it take?
 * Every relative import that climbs out of the instance directory is one, and
 * the smart-* plan names the cost of missing one
 * (`cat-harness/docs/proposals/smart-separation-2026-10-01.md`, "a gate that
 * cannot pass in a fork"). So the climb happens in one place,
 * `<instance>/platform.ts`, re-exporting what the instance uses — a folio's
 * `../schemas/builders` shim, for the same reason — and re-pointing the
 * platform is a one-file edit.
 *
 * **Opt-in, by having the shim.** The platform layers (cat-harness,
 * folio-assistant-core, …) also declare a `repository` they will move to, but
 * they import EACH OTHER by design and are governed by `check:import-direction`
 * and the separation arc; requiring a shim of them would be a second, louder
 * answer to a question already answered. The smart-* instances are pinned as
 * opted in, so the rule cannot quietly become vacuous.
 *
 * Measured 2026-10-02: six climbs in three files (smart-base/tools/index.ts,
 * smart-trust/themes/themes.ts and its test), all now through platform.ts.
 *
 * @module cat-harness/scripts/tests/instance-separation-imports.test
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { specifiersOf } from "../../../bootstrap-tools/scripts/check-closure.js";
import { declarationPathIn } from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "..", "..", "..");
const SHIM = "platform.ts";
const CODE = /\.(ts|tsx|mts|js|mjs)$/;

/** Instances that declare a `repository` other than the one they live in. */
function stagedInstances(): string[] {
  const out: string[] = [];
  for (const e of readdirSync(ROOT, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const decl = declarationPathIn(join(ROOT, e.name));
    if (!decl || !existsSync(decl)) continue;
    try {
      const d = JSON.parse(readFileSync(decl, "utf-8")) as { repository?: string; livesAt?: { repository?: string } };
      if (d.repository && d.livesAt?.repository && d.repository !== d.livesAt.repository) out.push(e.name);
    } catch {
      // an unparseable declaration is `kg:schema:check`'s finding, not this one's
    }
  }
  return out.sort();
}

/** The instance's code files, as git tracks them. */
function codeFiles(instance: string): string[] {
  const ls = spawnSync("git", ["ls-files", "-z", "--", instance], { cwd: ROOT, encoding: "utf-8" });
  if (ls.status !== 0) throw new Error(`git ls-files ${instance} failed: ${ls.stderr}`);
  return ls.stdout.split("\0").filter((f) => f && CODE.test(f) && !f.split("/").includes("node_modules"));
}

/** Each relative import in `instance` (other than its shim) that resolves outside it. */
function climbsOutOf(instance: string): string[] {
  const home = join(ROOT, instance);
  const out: string[] = [];
  for (const rel of codeFiles(instance)) {
    if (rel === `${instance}/${SHIM}`) continue;
    const abs = join(ROOT, rel);
    for (const spec of specifiersOf(readFileSync(abs, "utf-8"))) {
      if (!spec.startsWith(".")) continue;
      const inside = relative(home, resolve(dirname(abs), spec));
      if (inside.startsWith("..")) out.push(`${rel} → ${spec}`);
    }
  }
  return out;
}

describe("staged instances reach the platform only through platform.ts", () => {
  const optedIn = stagedInstances().filter((i) => existsSync(join(ROOT, i, SHIM)));

  test("smart-base and smart-trust have opted in (the rule is not vacuous)", () => {
    expect(optedIn).toEqual(expect.arrayContaining(["smart-base", "smart-trust"]));
  });

  test("in an opted-in instance, no file but platform.ts imports from outside it", () => {
    // The whole list on a failure: each line is an edit the separation would
    // have to find, and the fix is to route it through `<instance>/platform.ts`.
    expect(optedIn.flatMap(climbsOutOf)).toEqual([]);
  });
});
