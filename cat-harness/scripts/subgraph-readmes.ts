#!/usr/bin/env bun
/**
 * A README for every declared directory, generated from the Knowledge Graph.
 *
 * @module scripts/subgraph-readmes
 * @covers cat-harness
 *
 * Owner, 2026-09-29: a large instance *"can't have all their files listed
 * directly, however they have declared subgraphs/dirs in which to naturally
 * link to sub-README generated documentation for that directory. make sure
 * sub-dir READMEs part of the KG itself"*; *"you should be able to extract
 * needed metadata info (e.g. titles, desc) from the KG itself. QA check when
 * not there"*; committed READMEs, *"check in process should gate regen.
 * source templates should be accessible in tools KG"*, with Liquid
 * `{% include %}` allowed.
 *
 * ## What it writes, and where it will not
 *
 * For each directory an instance declares, `<directory>/README.md`, and only
 * between `<!-- kg:subgraph:begin -->` and `<!-- kg:subgraph:end -->`:
 *
 * - no README → one is created holding just that region;
 * - a README carrying the markers → the region is replaced;
 * - a README without them → **left alone**, and reported. Somebody wrote it,
 *   and the platform owns markers, never the file (`readme-sections`).
 *
 * ## Where the words come from
 *
 * The heading is the directory's declared `title`, the paragraph its declared
 * `description`, the kinds its `graphKinds`; each file row is described from
 * the file itself and "used by" only where a diagram records it (the same
 * helpers as the `kg:files` README section). Nothing is composed here.
 *
 * The layout is a Liquid template in `tools/templates/readme/`, part of the
 * tools graph. Templates may `{% include %}` each other, Jekyll style,
 * and read any declared field through `kg`.
 *
 * ## QA: a missing fact is a finding, never a blank
 *
 * `test/results/subgraph-readmes.qa-results.json` records every directory
 * with no `title` or no `description`, every declared directory absent from
 * disk (unless it declares `absent`), and every README left untouched for
 * lack of markers. Reported, not failed: a gap in the declaration is the
 * declaration owner's to fill, and failing on it would block every commit on
 * a backlog. What `--check` FAILS on is a stale README or a stale sidecar.
 *
 * Usage: `bun run readme:subgraphs` · `bun run readme:subgraphs:check`
 */
import { bootstrapTermTargets, linkTerms } from "../../bootstrap-tools/scripts/term-links.ts";
import { BOOTSTRAP_TERMS } from "../../bootstrap-tools/schemas/graph.ts";
import { releaseIris } from "../../bootstrap-tools/schemas/release-iri.ts";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { Liquid } from "liquidjs";

import {
  declaredAssetPath,
  findDeclarationFile,
  INSTANCE_README_ROLE,
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
} from "../schemas/cat-harness.ts";
import { describe as describeFile, usedByIndex } from "../content/pipeline/readme-graph-sections.ts";
import { buildQaResult, writeQaResult } from "./qa-results.ts";
import { gitCorpus } from "../schemas/git-corpus.ts";

/**
 * Every file under `dir` that git would commit, relative to `dir`: tracked or
 * untracked, never ignored. A bare walk listed `__pycache__/` after a Python
 * test ran, so the README depended on what happened to be on disk. Outside a
 * git work tree (a test's temporary directory) it falls back to the walk.
 */
function filesIn(dir: string): string[] {
  const corpus = gitCorpus(dir);
  if (corpus !== undefined) return corpus.filter((p) => existsSync(p)).map((p) => relative(dir, p)).sort();
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      if (e.isDirectory()) walk(join(d, e.name));
      else out.push(relative(dir, join(d, e.name)));
    }
  };
  walk(dir);
  return out.sort();
}

const ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(ROOT);

/**
 * The templates, in the tools graph: `templates/readme/` inside the directory
 * this instance declares as `tools`. Not a declared directory of their own —
 * a declared directory nested in another is refused by `check:layout-norms`,
 * so they are files OF the tools graph, found through its declaration.
 */
export function templatesDir(instanceRoot: string = ROOT): string {
  const decl = readDeclaration(instanceRoot);
  const tools = decl?.directories?.find((x) => x.id === "tools");
  if (!tools) throw new Error(`subgraph-readmes: ${instanceRoot} declares no \`tools\` directory`);
  // declared-path-literal: the templates' place WITHIN the declared tools
  // directory; the directory itself is read from the declaration above.
  return join(instanceRoot, tools.path, "templates", "readme");
}

export const BEGIN = "<!-- kg:subgraph:begin -->";
export const END = "<!-- kg:subgraph:end -->";

/**
 * A declared description longer than this reads as an essay under a README
 * heading. Many carry history and argument meant for maintainers; they are
 * reported so the declaration's owner can move that to a comment.
 */
export const DESCRIPTION_WORDS = 60;

/** More direct files than this and the table becomes a count by extension. */
export const LIST_LIMIT = 150;

const cell = (t: string) => t.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");

export interface Finding {
  instance: string;
  directory: string;
  path: string;
}

export interface Plan {
  /** README path → the full text it should hold. */
  writes: Map<string, string>;
  findings: Record<
    "no-title" | "no-description" | "long-description" | "absent-directory" | "unmarked-readme",
    Finding[]
  >;
}

/** Replace the marked region, or create a file holding only it. `undefined`: no markers, leave it. */
export function splice(existing: string | undefined, region: string): string | undefined {
  const block = `${BEGIN}\n${region.trimEnd()}\n${END}`;
  if (existing === undefined) return `${block}\n`;
  const i = existing.indexOf(BEGIN);
  const j = existing.indexOf(END);
  if (i === -1 || j === -1 || j < i) return undefined;
  return existing.slice(0, i) + block + existing.slice(j + END.length);
}

/** Every declared directory of every instance under `repo`, planned. */
export async function plan(repo: string, templates: string): Promise<Plan> {
  const liquid = new Liquid({ root: [templates], extname: ".liquid", jekyllInclude: true, strictFilters: true });
  const out: Plan = {
    writes: new Map(),
    findings: { "no-title": [], "no-description": [], "long-description": [], "absent-directory": [], "unmarked-readme": [] },
  };
  const seen = new Set<string>();

  for (const inst of instanceRootsIn(repo)) {
    let decl;
    try {
      decl = readDeclaration(inst);
    } catch {
      continue; // an unreadable declaration is readDeclaration's own finding, reported by its checkers
    }
    if (!decl) continue;
    // The version, and — for an instance declaring an iriBase — both release
    // addresses, so a template writes `{{ release.version }}` rather than a
    // number that goes stale on the next bump (owner, 2026-09-29).
    const iris = releaseIris(decl);
    const release = {
      version: decl.version ?? "",
      major: iris?.major ?? "",
      agent: iris?.agent ?? "",
      human: iris?.human ?? "",
    };
    const name = decl.name;
    const declFile = findDeclarationFile(inst);
    const instReadme = declaredAssetPath(inst, INSTANCE_README_ROLE) ?? join(inst, "README.md");
    const instLink = existsSync(instReadme) ? instReadme : declFile ? join(inst, basename(declFile)) : inst;
    const dirs = decl.directories ?? [];
    const used = usedByIndex(inst, dirs.map((d) => d.path));
    const assets = new Map<string, string>();

    for (const d of dirs) {
      const base = (d as { scope?: string }).scope === "repository" ? repo : inst;
      const abs = resolve(base, d.path);
      const at = { instance: name, directory: d.id, path: relative(repo, abs) || "." };
      // The instance's own root, or the repository's, is the instance README's
      // job, not a directory README's.
      if (abs === resolve(inst) || abs === resolve(repo)) continue;
      if (!existsSync(abs) || !statSync(abs).isDirectory()) {
        if (!(d as { absent?: unknown }).absent) out.findings["absent-directory"].push(at);
        continue;
      }
      if (seen.has(abs)) continue; // two entries for one directory: the first one writes it
      seen.add(abs);
      const title = (d as { title?: string }).title;
      const description = (d as { description?: string }).description;
      if (!title) out.findings["no-title"].push(at);
      if (!description) out.findings["no-description"].push(at);
      else if (description.split(/\s+/).length > DESCRIPTION_WORDS) out.findings["long-description"].push(at);

      // Every defined term in the prose this README shows links to its
      // definition (owner, 2026-09-29: terms "should be links in README.md s").
      const terms = bootstrapTermTargets(repo, abs, Object.keys(BOOTSTRAP_TERMS));
      const linked = (text: string) => linkTerms(text, terms).text;

      const all = filesIn(abs).filter((f) => !f.split("/").some((seg) => seg.startsWith(".")));
      const direct = all.filter((f) => !f.includes("/") && f !== "README.md");
      const counts = new Map<string, number>();
      for (const f of all) if (f.includes("/")) counts.set(f.split("/")[0]!, (counts.get(f.split("/")[0]!) ?? 0) + 1);
      const subdirs = [...counts]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([n, count]) => ({ name: n, count, readme: existsSync(join(abs, n, "README.md")) ? `${n}/README.md` : "" }));
      const listed = direct.length <= LIST_LIMIT;
      const files = listed
        ? direct.map((f) => {
            const relToInst = relative(inst, join(abs, f));
            return {
              path: f,
              what: linked(cell(describeFile(inst, relToInst, assets))),
              usedBy: used(relToInst),
            };
          })
        : [];
      const byExt = new Map<string, number>();
      for (const f of direct) byExt.set(f.includes(".") ? f.slice(f.lastIndexOf(".")) : "(none)", (byExt.get(f.includes(".") ? f.slice(f.lastIndexOf(".")) : "(none)") ?? 0) + 1);
      const summary = listed
        ? ""
        : `${direct.length} files directly here, too many to list: ` +
          [...byExt].sort((a, b) => b[1] - a[1]).map(([e, n]) => `${n} ${e}`).join(", ") + ".";

      const region = await liquid.renderFile("subgraph", {
        subgraph: { id: d.id, path: d.path, title, description: description ? linked(description) : description, kinds: d.graphKinds },
        instance: { name, title: decl.title, readme: relative(abs, instLink) },
        release,
        kg: decl,
        files,
        subdirs,
        summary,
      });
      const readme = join(abs, "README.md");
      const existing = existsSync(readme) ? readFileSync(readme, "utf-8") : undefined;
      const next = splice(existing, region.replace(/\n{3,}/g, "\n\n"));
      if (next === undefined) {
        out.findings["unmarked-readme"].push({ ...at, path: relative(repo, readme) });
        continue;
      }
      out.writes.set(readme, next);
    }
  }
  return out;
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
  const p = await plan(REPO, templatesDir());
  let stale = 0;
  let wrote = 0;
  for (const [file, text] of p.writes) {
    const prev = existsSync(file) ? readFileSync(file, "utf-8") : undefined;
    if (prev === text) continue;
    if (check) {
      console.error(`  ✗ ${relative(REPO, file)} is stale`);
      stale++;
      continue;
    }
    writeFileSync(file, text);
    wrote++;
  }
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

