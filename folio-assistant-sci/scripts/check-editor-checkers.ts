#!/usr/bin/env bun
/**
 * check-editor-checkers.ts — every declared `editor-checkers` node parses, and
 * every piece of code it names is there to load.
 *
 * The `editor-checkers` kind (typologies/editor-checkers.json, bean
 * folio-assistant-4dx7) reached the folio-assistant index typed and judged by
 * nothing: `folio-editor-checker/v1` parsed its nodes and no gate read them
 * (`audit:coverage`, `kinds-typed-only`). A node is only useful when the ✍
 * suggest runtime can load what it names, so that is what this judges:
 *
 * - the node parses as `folio-editor-checker/v1`, and its `id` is its file
 *   name (`<id>.json`), which is how a reader finds it;
 * - each code ref (`check`, `macros`, and the `crepe` roles) names a file of
 *   the contributing instance that exists and EXPORTS the named symbol.
 *
 * The export is read from the source text, never by importing it: the modules
 * import the editor (Milkdown, KaTeX), and a gate must not need a DOM to say
 * that a name is exported.
 *
 *   bun run folio-assistant-sci/scripts/check-editor-checkers.ts
 *
 * Exit: 0 consistent, 1 a finding, 2 a declared directory is absent.
 *
 * @module folio-assistant-sci/scripts/check-editor-checkers
 * @covers editor-checkers
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { directoriesForGraph } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.ts";
import { instanceRootsIn, repoRootFor } from "@litlfred/cat-harness-tools/schemas/kg/instance-roots.ts";
import { EditorCheckerNodeSchema, codeRefs } from "../schemas/editor-checker.ts";

/** Does `source` export `name` — a declaration, or a name in an `export { … }` list? */
export function exportsName(source: string, name: string): boolean {
  const n = name.replace(/[$]/g, "\\$");
  if (new RegExp(`^\\s*export\\s+(?:default\\s+)?(?:async\\s+)?(?:function\\*?|const|let|var|class)\\s+${n}\\b`, "m").test(source)) {
    return true;
  }
  for (const m of source.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)) {
    for (const part of m[1]!.split(",")) {
      const [orig, alias] = part.trim().split(/\s+as\s+/);
      if ((alias ?? orig)?.trim() === name) return true;
    }
  }
  return false;
}

/** Findings about one node file of the instance at `inst`. */
export function judgeEditorChecker(file: string, inst: string): string[] {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    return [`does not parse as JSON: ${(e as Error).message}`];
  }
  const parsed = EditorCheckerNodeSchema.safeParse(raw);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => `not a folio-editor-checker/v1 node: ${i.path.join(".") || "(root)"}: ${i.message}`);
  }
  const node = parsed.data;
  const out: string[] = [];
  const stem = file.replace(/^.*[\\/]/, "").replace(/\.json$/, "");
  if (node.id !== stem) out.push(`id "${node.id}" is not its file name "${stem}"`);
  for (const ref of codeRefs(node)) {
    const [path, name] = ref.split("#") as [string, string];
    const abs = join(inst, path);
    if (!existsSync(abs)) {
      out.push(`${ref}: no file ${path} in ${relative(resolve(inst, ".."), inst)}`);
      continue;
    }
    if (!exportsName(readFileSync(abs, "utf-8"), name)) out.push(`${ref}: ${path} exports no ${name}`);
  }
  return out;
}

function main(): number {
  const repo = repoRootFor(resolve(import.meta.dir, ".."));
  let judged = 0;
  let findings = 0;
  for (const inst of instanceRootsIn(repo)) {
    for (const dir of directoriesForGraph(inst, "editor-checkers")) {
      const rel = relative(repo, dir) || ".";
      if (!existsSync(dir)) {
        console.error(`✗ ${rel}: declared, and absent from this checkout`);
        return 2;
      }
      for (const f of readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
        judged++;
        const found = judgeEditorChecker(join(dir, f), inst);
        if (found.length === 0) console.log(`✓ ${rel}/${f}`);
        for (const x of found) console.error(`✗ ${rel}/${f}: ${x}`);
        findings += found.length;
      }
    }
  }
  if (judged === 0) {
    console.log("check:editor-checkers — no declared editor-checkers directory holds a node; nothing to judge.");
    return 0;
  }
  console.log(`check:editor-checkers — ${judged} node(s) judged, ${findings} finding(s).`);
  return findings > 0 ? 1 : 0;
}

if (import.meta.main) process.exit(main());
