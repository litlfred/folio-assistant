/**
 * README sections an instance renders from its own declaration: its Processes,
 * drawn, and every file it holds.
 *
 * @module bootstrap-tools/scripts/readme-graph-sections
 *
 * Owner, 2026-09-29, on `bootstrap/README.md`: *"display bpmn(s) etc in
 * README.md"*, *"cat-harness renders svg, part of readme.md generation is to
 * do rendering"*, and *"make sure filelist generation at end of [the README]
 * is a skill and tool in cat-harness"*. Both were hand-written in that README;
 * a hand-kept list is wrong the day a file is added and nothing says so,
 * because a README is the one file no check reads.
 *
 * So both are sections of the `readme_sync` tool (`readme-sections.ts`), each
 * derived from the instance's declaration and the files it names — never from
 * a list kept here. Run against an instance with `--dir <instance>`.
 *
 * ## Why this lives in bootstrap-tools
 *
 * One copy of the README writers, in the tools repository of the Knowledge
 * Graph whose READMEs they write (owner, 2026-09-29, bean `xsqm`), which
 * cat-harness calls. So it reads the declaration with bootstrap's own shape
 * (`../schemas/declaration.ts`), asks git itself (`./git-files.ts`), and
 * states the section types structurally below rather than importing them
 * from the harness registry that lists it.
 *
 * ## Marker names
 *
 * `kg:processes` and `kg:files`, not `cat-harness:…`: the marker is written
 * INTO the instance's README, and the floor instance must not name the layer
 * above it (its leak test fails on the word). `kg` is vocabulary every
 * instance has — a Knowledge Graph declares its directories.
 *
 * ## Three states, as every section here
 *
 * A diagram with no picture beside it leaves the region untouched rather than
 * writing a broken image; an unreadable declaration does the same. Neither is
 * reported as "this instance has no Processes".
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

import { declarationFileIn, readKnowledgeGraphDeclaration } from "../schemas/declaration.ts";
import { gitFiles } from "./git-files.ts";

/** What a section renders. The same shape as the harness's `SectionOutput`. */
export interface SectionOutput {
  markdown: string;
  /** Operator-facing remarks: what was empty, what could not be read. */
  notes: string[];
  /** "I could not determine this" — leave whatever the README already has. */
  skip?: boolean;
}

/**
 * A README section keyed by its marker. The harness's `ReadmeSection` passes
 * a richer context; these two read only `root`, so they fit its registry.
 */
export interface GraphSection {
  /** Marker name; the README carries `<!-- <marker>:begin -->` … `:end`. */
  marker: string;
  /** One line, shown by `--list`. */
  summary: string;
  render(ctx: { root: string }): SectionOutput;
}

/** Escape the cell separator so a value containing `|` cannot break a table. */
const cell = (text: string): string => text.replace(/\|/g, "\\|");

/** The first sentence of `text`, markdown emphasis removed, at most ~160 characters. */
export function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, " ").replace(/\*\*|__/g, "").trim();
  const end = flat.search(/[.!?](\s|$)/);
  const s = end === -1 ? flat : flat.slice(0, end + 1);
  return s.length > 160 ? `${s.slice(0, 157).trimEnd()}…` : s;
}

/**
 * Every file under `dir` that git would commit, relative to `root`, sorted:
 * tracked or untracked, never ignored, so a build cache does not become a
 * row. Outside a git work tree it falls back to a walk.
 */
function filesUnder(root: string, dir: string): string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const corpus = gitFiles(dir);
  if (corpus !== undefined) {
    return corpus
      .filter((p) => existsSync(p) && !relative(dir, p).split("/").some((s) => s.startsWith(".")))
      .map((p) => relative(root, p))
      .sort();
  }
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(relative(root, p));
    }
  };
  walk(dir);
  return out.sort();
}

/** A `.bpmn` file's first process: its id, its name, and the processes it calls. */
export function processOf(xml: string): { id: string; name: string; calls: string[] } | undefined {
  const m = /<bpmn:process\b[^>]*\bid="([^"]+)"[^>]*>/.exec(xml);
  if (!m) return undefined;
  const name = /\bname="([^"]+)"/.exec(m[0])?.[1] ?? m[1]!;
  const calls = [...xml.matchAll(/<bpmn:callActivity\b[^>]*\bcalledElement="([^"]+)"/g)].map((c) => c[1]!);
  return { id: m[1]!, name, calls };
}

/** The Skill ids a `.bpmn` names on its tasks, whatever prefix binds the extension. */
function skillRefs(xml: string): string[] {
  return [...xml.matchAll(/<[\w.-]+:skill\s+ref="([^"]+)"/g)].map((m) => m[1]!);
}

/** Front matter `name:` and `description:` of a markdown file, if it declares them. */
function frontMatter(md: string): { name?: string; description?: string } {
  const fm = /^---\n([\s\S]*?)\n---/.exec(md)?.[1];
  if (!fm) return {};
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  const folded = /^description:\s*>?\s*\n((?:[ \t]+.*\n?)+)/m.exec(fm)?.[1];
  const inline = /^description:\s*([^>\n].*)$/m.exec(fm)?.[1];
  const description = (folded ?? inline)?.replace(/\s+/g, " ").trim();
  return { name, description };
}

interface Graph {
  root: string;
  /** Every `.bpmn` in the declared directories, relative to the root. */
  bpmn: { file: string; id: string; name: string; calls: string[]; skills: string[] }[];
}

function readGraph(root: string, dirs: string[]): Graph {
  const bpmn: Graph["bpmn"] = [];
  for (const d of dirs) {
    for (const f of filesUnder(root, join(root, d))) {
      if (!f.endsWith(".bpmn")) continue;
      const xml = readFileSync(join(root, f), "utf-8");
      const p = processOf(xml);
      if (p) bpmn.push({ file: f, ...p, skills: skillRefs(xml) });
    }
  }
  return { root, bpmn };
}

/** Entry processes first (called by none of the others), then the rest, each group by file. */
function ordered(g: Graph): Graph["bpmn"] {
  const called = new Set(g.bpmn.flatMap((p) => p.calls));
  const byFile = (a: { file: string }, b: { file: string }) => a.file.localeCompare(b.file);
  return [...g.bpmn.filter((p) => !called.has(p.id)).sort(byFile), ...g.bpmn.filter((p) => called.has(p.id)).sort(byFile)];
}

/** The declared directories, or `undefined` when the declaration cannot be read. */
function declaredDirs(root: string): { id: string; path: string; title?: string; description?: string }[] | undefined {
  try {
    const decl = readKnowledgeGraphDeclaration(root);
    if (!decl) return undefined;
    return (decl.directories ?? []).map((d) => ({ id: d.id, path: d.path, title: d.title, description: d.description }));
  } catch {
    return undefined;
  }
}

/** More files than this in one instance and `kg:files` lists directories, not files. */
export const INSTANCE_LIST_LIMIT = 200;

const skip = (why: string): SectionOutput => ({ markdown: "", notes: [`left unchanged — ${why}`], skip: true });

/**
 * `kg:processes` — every Process the instance declares, as a picture.
 *
 * The picture is the SVG `render:bpmn` writes beside the `.bpmn` for an
 * instance with no site of its own; this section reads it and never draws.
 * Rendering needs a browser, so it stays in the renderer, and `readme:sync`
 * for such an instance runs the renderer first (`package.json`).
 */
export const processesSection: GraphSection = {
  marker: "kg:processes",
  summary: "Every Process the instance declares, drawn — the SVG beside each .bpmn",
  render(ctx) {
    const dirs = declaredDirs(ctx.root);
    if (!dirs) return skip("no readable declaration at this root");
    const g = readGraph(ctx.root, dirs.map((d) => d.path));
    if (g.bpmn.length === 0) return { markdown: "_This instance declares no Processes._\n", notes: ["no .bpmn found"] };
    const missing = g.bpmn.filter((p) => !existsSync(join(ctx.root, p.file.replace(/\.bpmn$/, ".svg"))));
    if (missing.length) {
      return skip(`no picture beside ${missing.map((p) => p.file).join(", ")} — run \`bun run render:bpmn\``);
    }
    const byId = new Map(g.bpmn.map((p) => [p.id, p]));
    const lines: string[] = [];
    for (const p of ordered(g)) {
      const callers = g.bpmn.filter((q) => q.calls.includes(p.id)).map((q) => q.name);
      const how = callers.length ? `started from ${callers.map((c) => `"${c}"`).join(" and ")}` : "the one you start";
      const calls = [...new Set(p.calls)].map((c) => byId.get(c)?.name).filter(Boolean);
      lines.push(
        `**${p.name}**: [\`${p.file}\`](${p.file}), ${how}${calls.length ? `; it calls ${calls.map((c) => `"${c}"`).join(" and ")}` : ""}.`,
        "",
        `![${p.name}](${p.file.replace(/\.bpmn$/, ".svg")})`,
        "",
      );
    }
    return { markdown: lines.join("\n"), notes: [] };
  },
};

/**
 * Who uses a file, as the diagrams record it: the Processes whose tasks name
 * a Skill, and those that call a Process. Blank where no diagram says so.
 * `file` is relative to `root`.
 */
export function usedByIndex(root: string, dirPaths: string[]): (file: string) => string {
  const g = readGraph(root, dirPaths);
  const usedBy = new Map<string, string[]>();
  for (const p of g.bpmn) {
    for (const s of new Set(p.skills)) usedBy.set(`skill:${s}`, [...(usedBy.get(`skill:${s}`) ?? []), p.name]);
    for (const c of new Set(p.calls)) {
      const callee = g.bpmn.find((q) => q.id === c);
      if (callee) usedBy.set(callee.file, [...(usedBy.get(callee.file) ?? []), p.name]);
    }
  }
  return (file: string): string => {
    const md = file.endsWith(".md") ? frontMatter(readFileSync(join(root, file), "utf-8")).name : undefined;
    const who = usedBy.get(file) ?? (md ? usedBy.get(`skill:${md}`) : undefined) ?? [];
    return [...new Set(who)].map((w) => `"${cell(w)}"`).join(", ");
  };
}

/** What one file is, read from the file itself. */
export function describe(root: string, file: string, assets: Map<string, string>): string {
  const asset = assets.get(file);
  if (asset) return asset;
  const text = () => readFileSync(join(root, file), "utf-8");
  if (file.endsWith(".md")) {
    const fm = frontMatter(text());
    if (fm.description) return firstSentence(fm.description);
    const h = /^#\s+(.+)$/m.exec(text())?.[1];
    return h ? h.replace(/`/g, "") : "text";
  }
  if (file.endsWith(".bpmn")) return `a Process: ${processOf(text())?.name ?? basename(file)}`;
  if (file.endsWith(".liquid")) {
    // A template says what it is in its leading `{% comment %}` block.
    const c = /\{%-?\s*comment\s*-?%\}([\s\S]*?)\{%-?\s*endcomment\s*-?%\}/.exec(text())?.[1];
    return c ? firstSentence(c) : "a template";
  }
  if (file.endsWith(".svg")) {
    const src = file.replace(/\.svg$/, ".bpmn");
    return existsSync(join(root, src)) ? `the picture of \`${basename(src)}\`, generated from it` : "a picture";
  }
  if (file.endsWith(".json") || file.endsWith(".jsonld")) {
    try {
      const j = JSON.parse(text()) as Record<string, unknown>;
      for (const k of ["title", "description", "$comment", "summary"]) {
        if (typeof j[k] === "string") return firstSentence(j[k] as string);
      }
    } catch {
      return "data that does not parse";
    }
    return "data";
  }
  return "a file";
}

/**
 * `kg:files` — every file the instance holds, grouped by declared directory.
 *
 * "What it is" is read from each file; "used by" only where the graph records
 * a relation (a diagram naming a Skill, a diagram calling a Process), and
 * blank otherwise rather than guessed. A directory of results collapses to
 * one row with its count.
 */
export const filesSection: GraphSection = {
  marker: "kg:files",
  summary: "Every file the instance holds, grouped by declared directory, each described from itself",
  render(ctx) {
    const root = ctx.root;
    const dirs = declaredDirs(root);
    let declFile: string | undefined;
    try {
      declFile = declarationFileIn(root);
    } catch {
      declFile = undefined;
    }
    if (!dirs || !declFile) return skip("no readable declaration at this root");
    let decl: ReturnType<typeof readKnowledgeGraphDeclaration>;
    try {
      decl = readKnowledgeGraphDeclaration(root);
    } catch {
      return skip("declaration does not parse");
    }
    const assets = new Map<string, string>();
    for (const a of decl?.assets ?? []) {
      const src = (a as { src?: string }).src;
      if (src) assets.set(src, firstSentence((a as { description?: string }).description ?? a.role ?? "an asset"));
    }
    const used = usedByIndex(root, dirs.map((d) => d.path));
    // The label is the file's name under the heading it sits beneath; the
    // link stays the path from this README. A table under `skills/` that
    // repeats `skills/` on every row says the same thing twice.
    const row = (f: string, under = "") =>
      `| [\`${cell(under ? relative(under, f) : f)}\`](${f}) | ${cell(describe(root, f, assets))} | ${used(f)} |`;
    const head = ["| file | what it is | used by |", "|---|---|---|"];

    const lines: string[] = [];
    // The row is the declaration's file name at this root.
    const top = [...assets.keys(), basename(declFile)].filter((f) => existsSync(join(root, f)));
    lines.push("**At the top**", "", ...head, ...top.map((f) => row(f)), "");

    // Each directory's own README, generated by `subgraph-readmes`, is where
    // its full listing lives. Here: a link to it, and the files themselves
    // only while the instance is small enough to show them on one page.
    const perDir = dirs
      .map((d) => {
        const own = relative(root, join(root, d.path, "README.md"));
        return { d, files: filesUnder(root, join(root, d.path)).filter((f) => f !== own) };
      })
      .filter((x) => x.files.length > 0);
    const total = perDir.reduce((n, x) => n + x.files.length, 0);
    const readmeOf = (path: string) => (existsSync(join(root, path, "README.md")) ? join(path, "README.md") : undefined);

    if (total > INSTANCE_LIST_LIMIT) {
      lines.push(
        `${total} files in ${perDir.length} directories, too many for one page. Each directory's README lists its own.`,
        "",
        "| directory | what it holds | files |",
        "|---|---|---|",
        ...perDir.map(({ d, files }) => {
          const label = d.title ? ` ${cell(d.title)}` : "";
          return `| [\`${cell(d.path)}\`](${readmeOf(d.path) ?? d.path})${label} | ${cell(d.description ? firstSentence(d.description) : "")} | ${files.length} |`;
        }),
        "",
      );
      return { markdown: lines.join("\n"), notes: [`${total} files: listed by directory`] };
    }

    for (const { d, files } of perDir) {
      const r = readmeOf(d.path);
      const heading = r ? `[\`${d.path}\`](${r})` : `\`${d.path}\``;
      lines.push(`**${heading}**${d.description ? `: ${cell(firstSentence(d.description))}` : ""}`, "");
      const nested = files.some((f) => relative(d.path, f).includes("/"));
      if (nested && files.every((f) => f.endsWith(".json"))) {
        lines.push(...head, `| [\`${d.path}\`](${d.path}) | ${files.length} files, in subdirectories | |`, "");
        continue;
      }
      lines.push(...head, ...files.map((f) => row(f, d.path)), "");
    }
    return { markdown: lines.join("\n"), notes: [] };
  },
};
