#!/usr/bin/env bun
/**
 * Validate a node in the graph — **one Tool, parameterised by graph typology**.
 *
 * Bean `folio-assistant-i31r`, route A of `folio-assistant-3lbz`. The owner,
 * 2026-09-20, on what shape this should take:
 *
 * > a Tool per Zod schema... no, but there should be common patterns (single
 * > pattern?) with some parameters more or less
 *
 * So: give it a path, and it works out what the file *is* from the
 * declaration — which declared directory contains it, and therefore which
 * graph typology — then runs that kind's validator. 199 exported schemas, one
 * lookup.
 *
 * ## What it refuses to call valid
 *
 * A kind with no declared validator yields **could not determine**, and this
 * exits non-zero on it by default rather than printing a tick. That is not
 * pedantry: 14 of 16 kinds are in that state, including `qa` — the largest
 * generated graph here — so a tool that treated "nothing to run" as "fine"
 * would report success over most of the corpus. `--lenient` downgrades it to
 * a warning for a caller that knowingly wants partial coverage.
 *
 * @module folio-assistant/scripts/kg-validate
 */

import { existsSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

import { instanceDirectories, instanceRootsIn, readDeclaration } from "../schemas/cat-harness.js";
import { checkoutRootFor } from "../schemas/harness-config.js";
import type { z } from "zod";

import { resolveKindValidator, resolveNodeSchemas, stripAnnotations } from "../schemas/kind-validator.js";

const instanceRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

export type Verdict =
  | { path: string; state: "valid"; kind: string }
  | { path: string; state: "invalid"; kind: string; problems: string[] }
  | { path: string; state: "undetermined"; reason: string; kind?: string };

/**
 * Which declared graph typology owns this path.
 *
 * The LONGEST matching directory wins, because declarations nest — `beans/`
 * contains `beans/defs/`, and answering with the outer one would validate a
 * bean definition against the wrong kind and pass.
 */
export function kindForPath(
  filePath: string,
  root: string,
  dirs: { path: string; graphTypologies: string[] }[],
): string | undefined {
  const rel = relative(root, resolve(filePath));
  if (rel.startsWith("..")) return undefined;
  let best: { len: number; kind: string } | undefined;
  for (const d of dirs) {
    const dir = d.path.replace(/\/+$/, "");
    if (rel === dir || rel.startsWith(dir + sep) || rel.startsWith(dir + "/")) {
      // A directory may declare several graphs; one is unambiguous, more is
      // not, and guessing which would be the lie of precision the
      // `cat-harness` kind's own doc comment warns about.
      if (d.graphTypologies.length === 1 && (!best || dir.length > best.len)) {
        best = { len: dir.length, kind: d.graphTypologies[0] };
      }
    }
  }
  return best?.kind;
}

/**
 * The declared instance that OWNS a path: the deepest instance root in the
 * checkout that contains it, or `fallback` when none does (bean `676g`).
 *
 * ## Why this exists
 *
 * `kg:validate` resolved every path against ONE root — its own instance,
 * `cat-harness/` — so a file inside a NESTED instance was refused rather than
 * validated. Measured on `main` `cf3e624`:
 *
 * ```
 * kg:validate smart-dak/test/results/kg-qa/scenarios/kg.kg-qa.json
 *   ? … could not determine: no declared directory owns this path
 * ```
 *
 * `smart-dak.json` declares `test/results/` as `qa` — one kind — so the
 * failing branch was "no directory owns it": the resolver never read that
 * instance's declaration at all. ~150 committed sidecars across 13 instances
 * sat in that gap, which is why `kg:audit:all:check` could prove them current
 * but nothing could prove they PARSE for a consumer.
 *
 * ## Why the deepest, not the first
 *
 * Instances nest inside the checkout, and the instance declared AT the
 * checkout root contains every other one. Answering with the outer one would
 * resolve a nested instance's path against the root's declaration — the same
 * refusal, one level up. Longest-prefix is the rule `kindForPath` already
 * applies to directories, for the same reason.
 */
export function owningInstanceRoot(filePath: string, fallback: string): string {
  const abs = resolve(filePath);
  let best: string | undefined;
  for (const r of instanceRootsIn(checkoutRootFor(fallback))) {
    const rel = relative(r, abs);
    if (rel.startsWith("..") || resolve(r, rel) !== abs) continue;
    if (best === undefined || r.length > best.length) best = r;
  }
  return best ?? fallback;
}

/**
 * Validate one file.
 *
 * Two roots, because they answer two questions (bean `676g`):
 *
 * - `root` — the instance whose DECLARATION says which directory owns the
 *   path, and therefore its graph typology. For a nested instance's file that is
 *   the nested instance (see {@link owningInstanceRoot}).
 * - `schemaRoot` — what the kind's unqualified `module#Export` validator refs
 *   resolve against: the instance whose registry DEFINES the kind. The
 *   registry here is `defaultGraphTypologies`, defined in this instance, so its
 *   refs (`schemas/kg-qa.ts#…`) are relative to `cat-harness/`. Resolving them
 *   against `smart-dak/` instead reported "schemas/kg-qa.ts does not exist"
 *   for every nested sidecar — the second half of the same refusal.
 *
 * `schemaRoot` defaults to `root`, so a caller validating the registry's own
 * instance is unchanged.
 */
export async function validatePath(filePath: string, root: string, schemaRoot: string = root): Promise<Verdict> {
  if (!existsSync(filePath)) {
    return { path: filePath, state: "undetermined", reason: "no such file" };
  }
  const decl = readDeclaration(root);
  if (!decl) {
    return { path: filePath, state: "undetermined", reason: `no declaration under ${root}` };
  }
  // Own entries AND those declared from within (bean `cmsl`): a voice file
  // under `skills/voices/` classified as `skills`, or as nothing, the moment
  // `voices` moved into `skills/skills.json` (measured 2026-09-30, bean `2j2r`).
  const kind = kindForPath(filePath, root, instanceDirectories(root, decl));
  if (!kind) {
    return {
      path: filePath,
      state: "undetermined",
      reason:
        "no declared directory owns this path, or the one that does declares " +
        "several graphs and which applies is not stated",
    };
  }
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (e) {
    return {
      path: filePath,
      state: "undetermined",
      kind,
      reason: `not readable as JSON: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // Bean `rdkm`: a kind that names its `$schema` families routes the node by
  // its own tag first — `qa` holds seven families, and the kind-level
  // validator would check six of them against the wrong shape.
  const families = await resolveNodeSchemas(kind, schemaRoot);
  let schema: z.ZodTypeAny;
  if (families.length) {
    const tag = (data as { $schema?: unknown } | null)?.$schema;
    const fam = families.find((f) => f.tag === tag);
    if (!fam) {
      return { path: filePath, state: "undetermined", kind, reason: `${kind} names no $schema family ${JSON.stringify(tag)}` };
    }
    if (fam.state !== "resolved") {
      const why =
        fam.state === "shape" ? "is a TypeScript shape, not a runnable schema"
        : fam.state === "external" ? `conforms to ${fam.spec}, which nothing here runs`
        : fam.reason;
      return { path: filePath, state: "undetermined", kind, reason: `${fam.tag} ${why}` };
    }
    schema = fam.schema;
  } else {
    const v = await resolveKindValidator(kind, schemaRoot);
    if (v.state !== "resolved") {
      return { path: filePath, state: "undetermined", kind, reason: v.reason };
    }
    schema = v.schema;
  }
  const parsed = schema.safeParse(stripAnnotations(data));
  if (parsed.success) return { path: filePath, state: "valid", kind };
  return {
    path: filePath,
    state: "invalid",
    kind,
    problems: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
  };
}

async function main(): Promise<number> {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const lenient = process.argv.includes("--lenient");
  if (args.length === 0) {
    console.log("usage: bun run kg:validate <path>… [--lenient]");
    return 2;
  }

  let bad = 0;
  let undetermined = 0;
  for (const p of args) {
    // Against the instance that OWNS the path, not this script's own (bean
    // `676g`) — see `owningInstanceRoot`.
    const abs = resolve(p);
    const v = await validatePath(abs, owningInstanceRoot(abs, instanceRoot), instanceRoot);
    if (v.state === "valid") {
      console.log(`✓ ${v.path}  [${v.kind}]`);
    } else if (v.state === "invalid") {
      bad++;
      console.log(`✗ ${v.path}  [${v.kind}]`);
      for (const pr of v.problems) console.log(`    ${pr}`);
    } else {
      undetermined++;
      console.log(`? ${v.path}${v.kind ? `  [${v.kind}]` : ""} — could not determine: ${v.reason}`);
    }
  }

  if (bad > 0) return 1;
  if (undetermined > 0 && !lenient) {
    console.log(
      `\n${undetermined} file(s) could not be checked. Exiting non-zero: "nothing to ` +
        `run" is not "valid". Pass --lenient to accept partial coverage knowingly.`,
    );
    return 1;
  }
  return 0;
}

if (import.meta.main) process.exit(await main());
