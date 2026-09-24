#!/usr/bin/env bun
/**
 * Validate a node in the graph — **one Tool, parameterised by graph kind**.
 *
 * Bean `folio-assistant-i31r`, route A of `folio-assistant-3lbz`. The owner,
 * 2026-09-20, on what shape this should take:
 *
 * > a Tool per Zod schema... no, but there should be common patterns (single
 * > pattern?) with some parameters more or less
 *
 * So: give it a path, and it works out what the file *is* from the
 * declaration — which declared directory contains it, and therefore which
 * graph kind — then runs that kind's validator. 199 exported schemas, one
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

import { readDeclaration } from "../schemas/cat-harness.js";
import type { z } from "zod";

import { resolveKindValidator, resolveNodeSchemas, stripAnnotations } from "../schemas/kind-validator.js";

const instanceRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

export type Verdict =
  | { path: string; state: "valid"; kind: string }
  | { path: string; state: "invalid"; kind: string; problems: string[] }
  | { path: string; state: "undetermined"; reason: string; kind?: string };

/**
 * Which declared graph kind owns this path.
 *
 * The LONGEST matching directory wins, because declarations nest — `beans/`
 * contains `beans/defs/`, and answering with the outer one would validate a
 * bean definition against the wrong kind and pass.
 */
export function kindForPath(
  filePath: string,
  root: string,
  dirs: { path: string; graphKinds: string[] }[],
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
      if (d.graphKinds.length === 1 && (!best || dir.length > best.len)) {
        best = { len: dir.length, kind: d.graphKinds[0] };
      }
    }
  }
  return best?.kind;
}

export async function validatePath(filePath: string, root: string): Promise<Verdict> {
  if (!existsSync(filePath)) {
    return { path: filePath, state: "undetermined", reason: "no such file" };
  }
  const decl = readDeclaration(root);
  if (!decl) {
    return { path: filePath, state: "undetermined", reason: `no declaration under ${root}` };
  }
  const kind = kindForPath(filePath, root, decl.directories ?? []);
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
  const families = await resolveNodeSchemas(kind, root);
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
    const v = await resolveKindValidator(kind, root);
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
    const v = await validatePath(resolve(p), instanceRoot);
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
