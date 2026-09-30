#!/usr/bin/env bun
/**
 * A README for every declared directory, generated from the Knowledge Graph.
 *
 * @module bootstrap-tools/scripts/subgraph-readmes
 * @covers code
 *
 * Owner, 2026-09-29: a large instance *"can't have all their files listed
 * directly, however they have declared subgraphs/dirs in which to naturally
 * link to sub-README generated documentation for that directory. make sure
 * sub-dir READMEs part of the KG itself"*; *"you should be able to extract
 * needed metadata info (e.g. titles, desc) from the KG itself. QA check when
 * not there"*; committed READMEs, with Liquid `{% include %}` allowed.
 *
 * ## Why this lives in bootstrap-tools, and what it does not know
 *
 * One copy of the README writers, in the tools repository (owner, 2026-09-29,
 * bean `xsqm`), which cat-harness calls. It knows bootstrap's declaration
 * shape and nothing above it. So it takes its instances ALREADY RESOLVED
 * ({@link InstanceInput}): a harness whose declarations carry Extensions —
 * a directory scoped to the repository, one allowed to be absent — resolves
 * those itself and hands the result to {@link plan}. Run standalone, this
 * resolves with bootstrap's plain rule (every path relative to its
 * declaration), which is {@link instancesIn} — and it writes only the
 * content graphs this toolset declares it `supports`, at a supported major.
 * A graph above bootstrap may carry Extensions this reader does not know;
 * writing its READMEs anyway would be guessing, so it is that harness's
 * call (measured: over this repository, 15 of 85 READMEs came out different
 * without the harness's `scope`).
 *
 * ## What it writes, and where it will not
 *
 * For each declared directory, `<directory>/README.md`, and only between
 * `<!-- kg:subgraph:begin -->` and `<!-- kg:subgraph:end -->`:
 *
 * - no README → one is created holding just that region;
 * - a README carrying the markers → the region is replaced;
 * - a README without them → **left alone**, and reported. Somebody wrote it,
 *   and the tool owns markers, never the file.
 *
 * ## Where the words come from
 *
 * The heading is the directory's declared `title`, the paragraph its declared
 * `description`, the kinds its `graphKinds`; each file row is described from
 * the file itself and "used by" only where a diagram records it (the helpers
 * of the `kg:files` README section). The layout is Liquid, in
 * `templates/readme/` beside this file; templates may `{% include %}` each
 * other, Jekyll style, and read any declared field through `kg`.
 *
 * ## The governing PROCESS, where the caller resolved one
 *
 * Owner, 2026-09-29: *"show highlevel (sub)process bpmn on the uploads
 * page."* A directory may name a BPMN process that governs it; the diagram is
 * then drawn on its README, with its `.bpmn` source and a row per subprocess.
 * The template half is `templates/readme/process.liquid`, included only when
 * the caller supplies a {@link ProcessView}.
 *
 * **Resolved by the caller, like every other Extension here.** A process name
 * is declared in a field this reader does not know (in cat-harness,
 * `coverage.process`), and a diagram has a home the calling harness's
 * declaration knows; this writer defines only the SHAPE it renders. So a
 * harness resolves the name to a diagram and hands over the view.
 *
 * DECLARED, never matched out of the diagram's prose. `document-ingestion`
 * opens on an event named "A file lands in uploads/", which is exactly the
 * inference not to make: an event's name is editorial text, and rewording it
 * would unlink the page with nothing able to tell that from a directory that
 * never had a process.
 *
 * A directory the caller resolved nothing for gets no section and is no
 * finding. A view whose `bpmn` is empty keeps the section, says *could not
 * determine*, and IS a finding — a printed absence and a real absence must
 * not look alike.
 *
 * ## A missing fact is a finding, never a blank
 *
 * {@link Plan.findings} records every directory with no `title` or no
 * `description`, every declared directory absent from disk (unless the caller
 * said it may be), and every README left untouched for lack of markers. The
 * caller decides where findings are recorded; standalone, they are printed.
 *
 * Usage: `bun run bootstrap-tools/scripts/subgraph-readmes.ts [--repo <dir>] [--check]`
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { Liquid } from "liquidjs";

import {
  declarationFileIn,
  type KnowledgeGraphDeclaration,
  knowledgeGraphsIn,
  readKnowledgeGraphDeclaration,
  supportsContent,
} from "../schemas/declaration.ts";
import { BOOTSTRAP_TERMS } from "../schemas/graph.ts";
import { releaseIris } from "../schemas/release-iri.ts";
import { gitFiles } from "./git-files.ts";
import { describe as describeFile, usedByIndex } from "./readme-graph-sections.ts";
import { bootstrapTermTargets, linkTerms } from "./term-links.ts";

/** The Liquid templates this writer renders: `subgraph.liquid`, which includes `files.liquid`. */
export const TEMPLATES = join(import.meta.dir, "templates", "readme");

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

/** One call activity of a governing process, as the template reads it. */
export interface SubProcessView {
  id: string;
  /** Whitespace collapsed and table-escaped by the resolver: it is a cell. */
  name: string;
  /** The skill the activity names, or `""`. */
  skill: string;
  /** The called process id. */
  calls: string;
  /** Links relative to the directory whose README this is, or `""`. */
  bpmn: string;
  svg: string;
}

/**
 * A directory's governing process, resolved by the caller to what a template
 * can print. Every path is already relative to that directory, and every
 * absent fact is `""` rather than missing, so `process.liquid` never has to
 * compose a link or test for nil.
 */
export interface ProcessView {
  /** The name as DECLARED, echoed back whatever else resolved. */
  name: string;
  /** The `<bpmn:process name>`, or `""` when the diagram was not found. */
  title: string;
  /** The diagram, or `""` — the one field that says whether this resolved. */
  bpmn: string;
  /** Its rendered SVG, or `""` when nothing has been rendered. */
  svg: string;
  /** The names of its start events, read from the element type. */
  startEvents: string[];
  subprocesses: SubProcessView[];
  /** Why the drawing is missing, or `""`. */
  undetermined: string;
}

/** One declared directory, with its path resolved by the caller. */
export interface SubgraphInput {
  id: string;
  /** As declared, relative to the declaration. */
  path: string;
  /** Where it actually is. */
  abs: string;
  title?: string;
  description?: string;
  graphKinds: string[];
  /** The caller's declaration says it may be missing; its absence is not a finding. */
  mayBeAbsent?: boolean;
  /**
   * The process governing this directory, already resolved. `undefined` means
   * the caller was told of none — an answer, not a gap — and the README then
   * carries no process section at all.
   */
  process?: ProcessView;
}

/** One Knowledge Graph, resolved. */
export interface InstanceInput {
  root: string;
  decl: KnowledgeGraphDeclaration;
  /** Its README, or `undefined` when it declares none. */
  readme?: string;
  dirs: SubgraphInput[];
}

export interface Finding {
  instance: string;
  directory: string;
  path: string;
}

export interface Plan {
  /** README path → the full text it should hold. */
  writes: Map<string, string>;
  findings: Record<
    | "no-title"
    | "no-description"
    | "long-description"
    | "absent-directory"
    | "unmarked-readme"
    | "unresolved-process",
    Finding[]
  >;
}

/**
 * Every file under `dir` that git would commit, relative to `dir`: tracked or
 * untracked, never ignored. A bare walk listed `__pycache__/` after a Python
 * test ran, so the README depended on what happened to be on disk. Outside a
 * git work tree (a test's temporary directory) it falls back to the walk.
 */
function filesIn(dir: string): string[] {
  const corpus = gitFiles(dir);
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

/** Replace the marked region, or create a file holding only it. `undefined`: no markers, leave it. */
export function splice(existing: string | undefined, region: string): string | undefined {
  const block = `${BEGIN}\n${region.trimEnd()}\n${END}`;
  if (existing === undefined) return `${block}\n`;
  const i = existing.indexOf(BEGIN);
  const j = existing.indexOf(END);
  if (i === -1 || j === -1 || j < i) return undefined;
  return existing.slice(0, i) + block + existing.slice(j + END.length);
}

/**
 * Every Knowledge Graph in a checkout, resolved with bootstrap's plain rule:
 * a directory's `path` and an asset's `src` are relative to the declaration,
 * and the README is the asset whose role is `instance-readme`.
 */
export function instancesIn(repo: string): InstanceInput[] {
  const out: InstanceInput[] = [];
  for (const { root, decl } of knowledgeGraphsIn(repo)) {
    const readme = decl.assets?.find((a) => a.role === "instance-readme");
    out.push({
      root,
      decl,
      readme: readme ? resolve(root, readme.src) : undefined,
      dirs: (decl.directories ?? []).map((d) => ({
        id: d.id,
        path: d.path,
        abs: resolve(root, d.path),
        title: d.title,
        description: d.description,
        graphKinds: d.graphKinds,
      })),
    });
  }
  return out;
}

/** Every declared directory of every instance given, planned. */
export async function plan(repo: string, instances: InstanceInput[], templates: string = TEMPLATES): Promise<Plan> {
  const liquid = new Liquid({ root: [templates], extname: ".liquid", jekyllInclude: true, strictFilters: true });
  const out: Plan = {
    writes: new Map(),
    findings: {
      "no-title": [],
      "no-description": [],
      "long-description": [],
      "absent-directory": [],
      "unmarked-readme": [],
      "unresolved-process": [],
    },
  };
  const seen = new Set<string>();

  for (const { root: inst, decl, readme: instReadme, dirs } of instances) {
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
    let declFile: string | undefined;
    try {
      declFile = declarationFileIn(inst);
    } catch {
      declFile = undefined;
    }
    const readmeAt = instReadme ?? join(inst, "README.md");
    const instLink = existsSync(readmeAt) ? readmeAt : declFile ? join(inst, basename(declFile)) : inst;
    const used = usedByIndex(inst, dirs.map((d) => d.path));
    const assets = new Map<string, string>();

    for (const d of dirs) {
      const abs = d.abs;
      const at = { instance: name, directory: d.id, path: relative(repo, abs) || "." };
      // The instance's own root, or the repository's, is the instance README's
      // job, not a directory README's.
      if (abs === resolve(inst) || abs === resolve(repo)) continue;
      if (!existsSync(abs) || !statSync(abs).isDirectory()) {
        if (!d.mayBeAbsent) out.findings["absent-directory"].push(at);
        continue;
      }
      if (seen.has(abs)) continue; // two entries for one directory: the first one writes it
      seen.add(abs);
      const { title, description } = d;
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

      // A view with no `bpmn` resolved to nothing: the template still prints
      // the section saying so, and the finding sends its owner to the
      // declaration. A view that found the diagram but no rendered SVG is NOT
      // this finding — that is a stale checkout, repaired by `render:bpmn`,
      // and merging the two would send a reader to the wrong repair.
      if (d.process !== undefined && d.process.bpmn === "") out.findings["unresolved-process"].push(at);

      const region = await liquid.renderFile("subgraph", {
        subgraph: { id: d.id, path: d.path, title, description: description ? linked(description) : description, kinds: d.graphKinds },
        process: d.process,
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

/** Write (or, with `check`, compare) every planned README. Returns how many were stale or written. */
export function apply(p: Plan, check: boolean, repo: string): { stale: string[]; wrote: number } {
  const stale: string[] = [];
  let wrote = 0;
  for (const [file, text] of p.writes) {
    const prev = existsSync(file) ? readFileSync(file, "utf-8") : undefined;
    if (prev === text) continue;
    if (check) {
      stale.push(relative(repo, file));
      continue;
    }
    writeFileSync(file, text);
    wrote++;
  }
  return { stale, wrote };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const repoAt = args.indexOf("--repo");
  const repo = resolve(repoAt >= 0 && args[repoAt + 1] ? args[repoAt + 1]! : join(import.meta.dir, "..", ".."));
  const tools = readKnowledgeGraphDeclaration(join(import.meta.dir, "..")) as Record<string, unknown> | undefined;
  const all = instancesIn(repo);
  const mine = all.filter((i) => tools !== undefined && supportsContent(tools, i.decl.name, i.decl.version));
  if (mine.length === 0) {
    console.error(`✗ no Knowledge Graph under ${repo} is one these tools support (${JSON.stringify(tools?.["supports"] ?? {})}) — nothing was written or checked.`);
    process.exit(2);
  }
  for (const i of all.filter((x) => !mine.includes(x))) console.log(`  ~ ${i.decl.name}: not a graph these tools support — its harness writes its READMEs`);
  const p = await plan(repo, mine);
  const { stale, wrote } = apply(p, check, repo);
  for (const s of stale) console.error(`  ✗ ${s} is stale`);
  for (const [family, entries] of Object.entries(p.findings)) {
    for (const e of entries) console.log(`  · ${family}: ${e.instance} / ${e.directory} (${e.path})`);
  }
  console.log(`${p.writes.size} directory README(s); ${check ? `${stale.length} stale` : `${wrote} written`}.`);
  if (check && stale.length) process.exit(1);
}
