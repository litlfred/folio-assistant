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
 * - **resolving the governing process** a directory declares in
 *   `coverage.process` (owner, 2026-09-29: *"show highlevel (sub)process bpmn
 *   on the uploads page"*). The name, the diagrams and the site each diagram
 *   renders into are all things this harness's declaration knows and
 *   bootstrap's does not, so {@link governing-process} resolves them here and
 *   the writer is handed a finished `ProcessView`. `check-subgraph-coverage`
 *   shares that resolver, so the page and the axis cannot disagree about
 *   whether a declaration points at anything;
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
import { instanceDirectories, declaredAssetPath, INSTANCE_README_ROLE, instanceRootsIn, readDeclaration, repoRootFor } from "../schemas/cat-harness.ts";
import { defaultGraphKinds, type GraphKindRegistry } from "../schemas/graph-kind-registry.ts";
import { forDirectory, processIndex, resolveProcess, type ProcessIndex } from "./governing-process.ts";
import { buildQaResult, writeQaResult } from "./qa-results.ts";

const ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(ROOT);

/**
 * What each SUBDIRECTORY of `abs` is, by name — read from the directory's own
 * declaration file, the one its graph kinds name as `declarationFile` (the
 * owner's rule, 2026-09-20: each type declares its own filename, so
 * relocating `beans/` to `work/` renames nothing inside it).
 *
 * Only entries WITHOUT `"subgraph": true`. Those are parts of this
 * directory's graph (`beans.json`'s `defs`), and they are what the README's
 * table names; a `subgraph: true` entry is promoted to an instance directory
 * of its own (`skills.json`'s `voices`) and describes itself under its own
 * heading. The two partition, so a promoted directory's row keeps the count.
 *
 * Only a single-segment `path` names a row — `defs/archive` is a directory
 * inside a row, not one. A missing, unparseable or description-less
 * declaration supplies nothing and the row falls back to the file count:
 * absent stays absent rather than being invented. An unparseable file is
 * `check:harness-dirs`'s finding, not this one's.
 */
export function subdirDescriptions(
  abs: string,
  graphKinds: readonly string[],
  registry: GraphKindRegistry = defaultGraphKinds,
): Record<string, string> {
  const out: Record<string, string> = {};
  const files = graphKinds.map((g) => registry.get(g)?.declarationFile).filter((f): f is string => typeof f === "string");
  for (const f of [...new Set(files)]) {
    const p = join(abs, f);
    if (!existsSync(p)) continue;
    let nested: { directories?: unknown; topics?: unknown };
    try {
      nested = JSON.parse(readFileSync(p, "utf-8"));
    } catch {
      continue;
    }
    // `topics` is `skills.json`'s name for the same thing — it predates the
    // concern-group code list (see `declaredGroupsIn`), and each topic declares
    // its directory with a `path` and a `description` as a directory entry
    // does. A `concern-groups/v1` file declares only CODES, so it describes
    // nothing and supplies nothing here.
    const entries = [nested.directories, nested.topics].flatMap((a) => (Array.isArray(a) ? a : []));
    for (const nd of entries as Array<Record<string, unknown>>) {
      if (nd.subgraph === true || typeof nd.path !== "string" || typeof nd.description !== "string") continue;
      const sub = nd.path.replace(/^\.\//, "").replace(/\/+$/, "");
      const description = nd.description.trim();
      if (sub === "" || sub.includes("/") || description === "" || sub in out) continue;
      out[sub] = description;
    }
  }
  return out;
}

/**
 * Every instance under `repo`, with this harness's Extensions resolved: the
 * declared README (scope-aware), each directory's real location, and whether
 * it may be absent. An unreadable declaration is skipped — it is
 * `readDeclaration`'s own finding, reported by its checkers.
 */
export function harnessInstances(repo: string): InstanceInput[] {
  const out: InstanceInput[] = [];
  // Built on FIRST USE, not up front: it reads every `.bpmn` in the
  // repository, and a repository whose directories declare no process should
  // not pay for a walk whose answer nothing asks for.
  let processes: ProcessIndex | undefined;
  const index = (): ProcessIndex => (processes ??= processIndex(repo));
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
      // Own entries AND those declared from within (bean `cmsl`): the five
      // `voices/` READMEs dropped out of coverage when the entries moved into
      // `skills/skills.json` (75 → 70, measured 2026-09-30, bean `2j2r`).
      dirs: instanceDirectories(inst, decl).map((d) => {
        const base = (d as { scope?: string }).scope === "repository" ? repo : inst;
        const abs = resolve(base, d.path);
        // Absent declaration means the writer gets nothing and prints no
        // section: a directory owes no process, so silence here is an answer
        // rather than a gap. A declared name resolving to no diagram still
        // gets a view, because the section has to say *could not determine*.
        const declared = (d as { coverage?: { process?: string } }).coverage?.process;
        const subdirs = subdirDescriptions(abs, d.graphKinds as string[]);
        return {
          id: d.id,
          path: d.path,
          abs,
          title: (d as { title?: string }).title,
          description: (d as { description?: string }).description,
          graphKinds: d.graphKinds as string[],
          mayBeAbsent: Boolean((d as { absent?: unknown }).absent),
          ...(Object.keys(subdirs).length > 0 ? { subdirs } : {}),
          ...(declared !== undefined
            ? { process: forDirectory(resolveProcess(index(), declared), repo, abs) }
            : {}),
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
    "unresolved-process": {
      summary:
        "Directories whose `coverage.process` names a diagram no instance declares: the README says `could not determine` in place of the drawing. Declaring none is not here — a directory owes no process, and only a declaration that points at nothing is a finding.",
      entries: p.findings["unresolved-process"],
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
      `${f["absent-directory"].length} absent, ${f["unmarked-readme"].length} unmarked, ` +
      `${f["unresolved-process"].length} unresolved process.`,
  );
  if (check && stale) {
    console.error("\nRun `bun run readme:subgraphs` and commit.");
    process.exit(1);
  }
}
