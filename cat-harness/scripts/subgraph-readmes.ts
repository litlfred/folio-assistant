#!/usr/bin/env bun
/**
 * A README for every declared directory — cat-harness's call into the
 * writer in bootstrap-tools.
 *
 * @module scripts/subgraph-readmes
 * @covers cat-harness
 *
 * The writer, its Liquid templates and its findings are
 * `bootstrap-tools/scripts/subgraph-readmes.ts` — one copy, in the tools
 * repository (owner, 2026-09-29, bean `xsqm`). What stays here is what only
 * a harness knows:
 *
 * - **resolving its Extensions** before the writer sees a directory: a
 *   directory entry `scope: "repository"` is relative to the repository
 *   rather than the instance, one declaring `absent` may be missing, and an
 *   asset's README is found through {@link declaredAssetPath}, which honours
 *   the asset's scope too;
 * - **recording the findings** as the committed QA sidecar
 *   `test/results/subgraph-readmes.qa-results.json`. Reported, not failed: a
 *   gap in a declaration is its owner's to fill, and failing on it would block
 *   every commit on a backlog. What `--check` FAILS on is a stale README or a
 *   stale sidecar.
 *
 * Usage: `bun run readme:subgraphs` · `bun run readme:subgraphs:check`
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import {
  apply,
  DESCRIPTION_WORDS,
  type InstanceInput,
  type Plan,
  plan,
} from "../../bootstrap-tools/scripts/subgraph-readmes.ts";
import { declaredAssetPath, INSTANCE_README_ROLE, instanceRootsIn, readDeclaration, repoRootFor } from "../schemas/cat-harness.ts";
import { buildQaResult, writeQaResult } from "./qa-results.ts";

const ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(ROOT);

/**
 * Every instance under `repo`, with this harness's Extensions resolved: the
 * declared README (scope-aware), each directory's real location, and whether
 * it may be absent. An unreadable declaration is skipped — it is
 * `readDeclaration`'s own finding, reported by its checkers.
 */
export function harnessInstances(repo: string): InstanceInput[] {
  const out: InstanceInput[] = [];
  for (const inst of instanceRootsIn(repo)) {
    let decl;
    try {
      decl = readDeclaration(inst);
    } catch {
      continue;
    }
    if (!decl) continue;
    out.push({
      root: inst,
      decl: decl as unknown as InstanceInput["decl"],
      readme: declaredAssetPath(inst, INSTANCE_README_ROLE),
      dirs: (decl.directories ?? []).map((d) => {
        const base = (d as { scope?: string }).scope === "repository" ? repo : inst;
        return {
          id: d.id,
          path: d.path,
          abs: resolve(base, d.path),
          title: (d as { title?: string }).title,
          description: (d as { description?: string }).description,
          graphKinds: d.graphKinds as string[],
          mayBeAbsent: Boolean((d as { absent?: unknown }).absent),
        };
      }),
    });
  }
  return out;
}

/** The writer's plan over every instance in this checkout. */
export function harnessPlan(repo: string = REPO): Promise<Plan> {
  return plan(repo, harnessInstances(repo));
}

/** The committed QA record of what the declarations do not say. */
export function qaResult(p: Plan) {
  const families: Record<string, { summary: string; entries: unknown[] }> = {
    "no-title": {
      summary: "Declared directories with no `title`: their README heading falls back to the id.",
      entries: p.findings["no-title"],
    },
    "no-description": {
      summary: "Declared directories with no `description`: their README says so instead of saying what they hold.",
      entries: p.findings["no-description"],
    },
    "long-description": {
      summary: `Declared directories whose description runs over ${DESCRIPTION_WORDS} words: shown to readers under the README heading, so history and argument belong in a \`_comment\` instead.`,
      entries: p.findings["long-description"],
    },
    "absent-directory": {
      summary: "Declared directories not on disk and not declared `absent`: a consumer scanning them finds nothing and may report a clean run.",
      entries: p.findings["absent-directory"],
    },
    "unmarked-readme": {
      summary: "READMEs that exist without the kg:subgraph markers, left untouched because somebody wrote them. Add the marker pair to adopt the generated section.",
      entries: p.findings["unmarked-readme"],
    },
  };
  return buildQaResult({
    script: "scripts/subgraph-readmes.ts",
    scriptAbsPath: import.meta.path,
    subject: { kind: "graph", id: "subgraph-readmes" },
    families,
  });
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const p = await harnessPlan(REPO);
  const { stale: staleFiles, wrote } = apply(p, check, REPO);
  for (const f of staleFiles) console.error(`  ✗ ${f} is stale`);
  let stale = staleFiles.length;
  const result = qaResult(p);
  const sidecar = join(ROOT, "test/results/subgraph-readmes.qa-results.json");
  if (check) {
    const prior = existsSync(sidecar) ? JSON.parse(readFileSync(sidecar, "utf-8")) : undefined;
    const strip = (r: unknown) => JSON.stringify({ ...(r as object), updated_at: undefined });
    if (!prior || strip(prior) !== strip(result)) {
      console.error(`  ✗ ${relative(REPO, sidecar)} is stale`);
      stale++;
    }
  } else {
    writeQaResult(ROOT, "subgraph-readmes", result);
  }
  const f = p.findings;
  console.log(
    `${p.writes.size} directory README(s); ${check ? `${stale} stale` : `${wrote} written`}. ` +
      `Findings: ${f["no-title"].length} no title, ${f["no-description"].length} no description, ` +
      `${f["long-description"].length} long description, ` +
      `${f["absent-directory"].length} absent, ${f["unmarked-readme"].length} unmarked.`,
  );
  if (check && stale) {
    console.error("\nRun `bun run readme:subgraphs` and commit.");
    process.exit(1);
  }
}
