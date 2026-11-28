#!/usr/bin/env bun
/**
 * lean-library-ingest — read a Lean 4 library (a directory of modules, such as
 * `Mathlib/InformationTheory`) as the knowledge graph it already is, and
 * linearise it into a textbook outline: chapters, sections, subsections.
 *
 * It reads source text only. No `lake build`, no elaboration: imports, module
 * docstrings (`/-! … -/`), declaration docstrings (`/-- … -/`) and declaration
 * headers. So the edges are the IMPORT graph, which is coarser than the
 * elaborated formal graph (`lean-formal-edges`); the outline it produces is a
 * proposal for an author, never a claim about what a proof uses.
 *
 * Usage:
 *   bun run scripts/lean-library-ingest.ts --root <lake-root> --lib <Mathlib/Dir> [--out <dir>] [--exclude Tactic,Util]
 *   bun run scripts/lean-library-ingest.ts --root <lake-root> --lib Mathlib --libraries [--out <dir>]
 *
 * Writes `<out>/kg.json` (modules, declarations, edges, provenance) and
 * `<out>/outline.md` (the linearisation). With `--libraries`, treats every
 * immediate subdirectory of `--lib` as one library and also writes
 * `<out>/libraries.md`, the order of the libraries themselves.
 */
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

type Decl = { kind: string; name: string; line: number; doc?: string; attrs?: string[] };
type Module = {
  name: string;
  path: string;
  lines: number;
  imports: string[];
  title?: string;
  moduleDoc?: string;
  headings: string[];
  references: string[];
  authors?: string;
  decls: Decl[];
};

const DECL_RE =
  /^(?:@\[[^\]]*\]\s*)*(?:(?:private|protected|noncomputable|nonrec|partial|unsafe|public)\s+)*(theorem|lemma|def|abbrev|instance|structure|class|inductive|axiom|opaque)\b\s*([^\s:({[]*)/;

export function parseModule(root: string, file: string): Module {
  const src = readFileSync(file, "utf8");
  const rel = relative(root, file);
  const name = rel.replace(/\.lean$/, "").split("/").join(".");
  const imports = [...src.matchAll(/^(?:public\s+)?(?:meta\s+)?import\s+([A-Za-z0-9_.]+)/gm)].map((m) => m[1]);
  const authors = src.match(/^Authors?:\s*(.+)$/m)?.[1]?.trim();
  const modDocs = [...src.matchAll(/\/-!([\s\S]*?)-\//g)].map((m) => m[1].trim());
  const moduleDoc = modDocs[0];
  const title = moduleDoc?.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const headings = modDocs.flatMap((d) => [...d.matchAll(/^#{1,3}\s+(.+)$/gm)].map((m) => m[1].trim()));
  const references = [...new Set([...src.matchAll(/\[([A-Za-z][A-Za-z0-9_+-]*\d{4}[a-z]?)\]/g)].map((m) => m[1]))];
  const decls: Decl[] = [];
  const lines = src.split("\n");
  let pendingDoc: string | undefined;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const docStart = l.match(/^\s*\/--([\s\S]*)$/);
    if (docStart) {
      let buf = docStart[1];
      while (!buf.includes("-/") && i + 1 < lines.length) buf += "\n" + lines[++i];
      pendingDoc = buf.slice(0, buf.indexOf("-/")).trim();
      const rest = buf.slice(buf.indexOf("-/") + 2).trim();
      if (!rest) continue;
      const m = rest.match(DECL_RE);
      if (m) decls.push({ kind: m[1], name: m[2], line: i + 1, doc: pendingDoc });
      pendingDoc = undefined;
      continue;
    }
    const m = l.match(DECL_RE);
    if (m) {
      decls.push({ kind: m[1], name: m[2], line: i + 1, ...(pendingDoc ? { doc: pendingDoc } : {}) });
      pendingDoc = undefined;
    } else if (l.trim() && !l.trim().startsWith("@[")) pendingDoc = undefined;
  }
  return { name, path: rel, lines: lines.length, imports, title, moduleDoc, headings, references, authors, decls };
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".lean")) out.push(p);
  }
  return out.sort();
}

/** Prerequisite weight of a module: the size of its transitive import closure in the
 * whole package. A textbook puts what needs less first, so ties in the topological
 * order are broken by this (elementary before heavy), then by path. */
let WEIGHT = new Map<string, number>();
export function computeWeights(root: string, pkgDirs: string[]) {
  const imp = new Map<string, string[]>();
  for (const d of pkgDirs)
    for (const f of walk(join(root, d))) {
      const src = readFileSync(f, "utf8");
      const name = relative(root, f).replace(/\.lean$/, "").split("/").join(".");
      imp.set(name, [...src.matchAll(/^(?:public\s+)?(?:meta\s+)?import\s+([A-Za-z0-9_.]+)/gm)].map((m) => m[1]));
    }
  const memo = new Map<string, Set<string>>();
  const closure = (n: string): Set<string> => {
    if (memo.has(n)) return memo.get(n)!;
    const s = new Set<string>();
    memo.set(n, s);
    for (const i of imp.get(n) ?? []) {
      s.add(i);
      for (const j of closure(i)) s.add(j);
    }
    return s;
  };
  WEIGHT = new Map([...imp.keys()].map((n) => [n, closure(n).size]));
}
const weight = (n: string) => WEIGHT.get(n) ?? 0;
const byWeight = (a: string, b: string) => weight(a) - weight(b) || a.localeCompare(b);

/** Kahn's algorithm, ties broken by prerequisite weight, then path. */
export function topoOrder(mods: Module[]): Module[] {
  const byName = new Map(mods.map((m) => [m.name, m]));
  const indeg = new Map(mods.map((m) => [m.name, 0]));
  const users = new Map<string, string[]>(mods.map((m) => [m.name, []]));
  for (const m of mods)
    for (const i of m.imports)
      if (byName.has(i) && i !== m.name) {
        indeg.set(m.name, indeg.get(m.name)! + 1);
        users.get(i)!.push(m.name);
      }
  const ready = mods.filter((m) => indeg.get(m.name) === 0).map((m) => m.name).sort(byWeight);
  const out: Module[] = [];
  while (ready.length) {
    const n = ready.shift()!;
    out.push(byName.get(n)!);
    for (const u of users.get(n)!) {
      indeg.set(u, indeg.get(u)! - 1);
      if (indeg.get(u) === 0) {
        ready.push(u);
        ready.sort(byWeight);
      }
    }
  }
  if (out.length !== mods.length) throw new Error("import cycle: " + mods.filter((m) => !out.includes(m)).map((m) => m.name));
  return out;
}

type Chapter = { key: string; title: string; sections: Module[] };

/** Chapters are the library's immediate subdirectories (a top-level file is its own chapter),
 * ordered by the condensed import DAG between them, then by first appearance in the module order. */
export function chapters(lib: string, mods: Module[]): Chapter[] {
  const ordered = topoOrder(mods);
  const libDepth = lib.split("/").length;
  const keyOf = (m: Module) => m.path.replace(/\.lean$/, "").split("/").slice(libDepth, libDepth + 1)[0] ?? "_intro";
  const groups = new Map<string, Module[]>();
  for (const m of ordered) {
    const k = keyOf(m);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }
  // condensed DAG between chapters
  const chOf = new Map(mods.map((m) => [m.name, keyOf(m)]));
  const deps = new Map<string, Set<string>>([...groups.keys()].map((k) => [k, new Set()]));
  for (const m of mods) for (const i of m.imports) if (chOf.has(i) && chOf.get(i) !== keyOf(m)) deps.get(keyOf(m))!.add(chOf.get(i)!);
  // a chapter's entry cost is the heaviest prerequisite closure among its modules
  const cost = new Map([...groups].map(([k, ms]) => [k, Math.max(...ms.map((m) => weight(m.name)))]));
  const placed: string[] = [];
  const pending = new Set(groups.keys());
  while (pending.size) {
    const ready = [...pending].filter((k) => [...deps.get(k)!].every((d) => !pending.has(d) || d === k));
    const pick = (ready.length ? ready : [...pending]).sort((a, b) => cost.get(a)! - cost.get(b)! || a.localeCompare(b))[0];
    placed.push(pick);
    pending.delete(pick);
  }
  return placed.map((k) => {
    const secs = groups.get(k)!;
    const index = secs.find((m) => m.path.replace(/\.lean$/, "").split("/").length === libDepth + 1);
    const title = k === "_intro" ? "Introduction" : (index ?? secs[0]).title ?? humanise(k);
    return { key: k, title: secs.length > 1 ? humanise(k) : title, sections: secs };
  });
}

type Part = { key: string; title?: string; chapters: Chapter[] };

/** A library with more than `threshold` chapters is split into Parts: its top-level
 * directories become parts (in the chapter order above), and each part's own
 * subdirectories become its chapters. Modules with no declarations (attribute or
 * tactic registration files) are not narrated and are returned separately. */
export function parts(lib: string, all: Module[], threshold = 30, big = 4): { parts: Part[]; skipped: Module[] } {
  const skipped = all.filter((m) => m.decls.length === 0);
  const mods = all.filter((m) => m.decls.length > 0);
  const top = chapters(lib, mods);
  if (top.length <= threshold) return { parts: [{ key: "", chapters: top }], skipped };
  // Consecutive small items (a loose file, or a directory of fewer than `big` modules)
  // are gathered into one group, so a part or chapter is never a single short file.
  const gather = (items: Chapter[]): Chapter[][] => {
    const out: Chapter[][] = [];
    for (const c of items) {
      const small = c.sections.length < big;
      const last = out[out.length - 1];
      if (small && last && last.every((x) => x.sections.length < big)) last.push(c);
      else out.push([c]);
    }
    return out;
  };
  const merge = (g: Chapter[]): Chapter =>
    g.length === 1 ? g[0] : { key: g.map((c) => c.key).join("+"), title: mergedTitle(g), sections: g.flatMap((c) => c.sections) };
  const ps: Part[] = gather(top).map((g) => {
    if (g.length > 1) return { key: g.map((c) => c.key).join("+"), title: mergedTitle(g), chapters: g };
    const c = g[0];
    const inner = c.sections.length >= big ? chapters(`${lib}/${c.key}`, c.sections) : [c];
    return { key: c.key, title: c.title, chapters: inner.length > threshold ? gather(inner).map(merge) : inner };
  });
  return { parts: ps, skipped };
}

const mergedTitle = (g: Chapter[]) =>
  g.length <= 3 ? g.map((c) => c.title.replace(/\.$/, "")).join("; ") : `${g[0].title.replace(/\.$/, "")}, and ${g.length - 1} further short topics`;

const humanise = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1 $2");

const SUBSECTION_SKIP = /^(main (definitions|results|statements|theorems|declarations)|notation|implementation notes?|references?|tags|todo|main definition|main result|definitions|results)$/i;

const roman = (n: number) => {
  let r = "";
  for (const [v, t] of [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]] as const)
    while (n >= v) (r += t), (n -= v);
  return r;
};

export function outlineMarkdown(lib: string, ps: Part[], skipped: Module[], rev: string): string {
  const chs = ps.flatMap((p) => p.chapters);
  const all = chs.flatMap((c) => c.sections);
  const nDecl = all.reduce((s, m) => s + m.decls.length, 0);
  const nDoc = all.reduce((s, m) => s + m.decls.filter((d) => d.doc).length, 0);
  const withParts = ps.length > 1 || !!ps[0]?.title;
  let md = `# ${humanise(lib.split("/").pop()!)} — narrative outline\n\n`;
  md += `> Linearised from the import graph of \`${lib}\` at revision \`${rev}\` by \`lean-library-ingest\`. `;
  md += `${all.length} modules, ${nDecl} declarations (${nDoc} with docstrings)${withParts ? `, in ${ps.length} parts` : ""}. `;
  md += `Chapter order is a topological order of the chapter-level import DAG and section order a topological order of modules, ties broken elementary-first (smaller transitive import closure). `;
  md += `Subsections are the headings of each module's own docstring. It is a proposal for an author: every section names the Lean module it narrates, which is its provenance.\n\n`;
  let ci = 0;
  ps.forEach((p, pi) => {
    if (withParts) md += `# Part ${roman(pi + 1)}. ${p.title}\n\n`;
    p.chapters.forEach((c) => {
      ci++;
      md += `## ${ci}. ${c.title}\n\n`;
      c.sections.forEach((m, si) => {
        const t = m.title ?? humanise(m.name.split(".").pop()!);
        const th = m.decls.filter((d) => d.kind === "theorem" || d.kind === "lemma").length;
        const df = m.decls.length - th;
        md += `### ${ci}.${si + 1} ${t}\n\n`;
        md += `*Source:* \`${m.name}\` (${m.lines} lines; ${df} definitions/instances, ${th} results${m.authors ? `; ${m.authors}` : ""})`;
        if (m.references.length) md += ` · *cites* ${m.references.map((r) => `[${r}]`).join(", ")}`;
        md += `\n\n`;
        const subs = m.headings.filter((h) => h !== m.title && !SUBSECTION_SKIP.test(h));
        subs.forEach((h, hi) => (md += `- ${ci}.${si + 1}.${hi + 1} ${h}\n`));
        if (subs.length) md += `\n`;
        if (!m.moduleDoc) md += `> ⚠ no module docstring — this section has no source narrative to start from.\n\n`;
      });
    });
  });
  if (skipped.length) md += `## Not narrated\n\nModules with no declarations (attribute, simp-set or tactic registration): ${skipped.map((m) => `\`${m.name}\``).join(", ")}.\n`;
  return md;
}

function main() {
  const args = process.argv.slice(2);
  const get = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  const root = get("--root");
  const lib = get("--lib");
  if (!root || !lib) {
    console.error("usage: --root <lake-root> --lib <Lib/Dir> [--out dir] [--libraries] [--exclude A,B]");
    process.exit(2);
  }
  const out = get("--out") ?? "lean-ingest";
  const exclude = new Set((get("--exclude") ?? "").split(",").filter(Boolean));
  let rev = "unknown";
  try {
    rev = execSync(`git -C ${JSON.stringify(root)} rev-parse --short HEAD`).toString().trim();
  } catch {}
  const libs = args.includes("--libraries")
    ? readdirSync(join(root, lib)).filter((d) => statSync(join(root, lib, d)).isDirectory() && !exclude.has(d)).map((d) => `${lib}/${d}`)
    : [lib];
  computeWeights(root, [lib.split("/")[0]]);
  const allMods = new Map<string, Module>();
  const libOf = new Map<string, string>();
  for (const l of libs) {
    const mods = walk(join(root, l)).map((f) => parseModule(root, f));
    mods.forEach((m) => (allMods.set(m.name, m), libOf.set(m.name, l)));
    const { parts: ps, skipped } = parts(l, mods);
    const chs = ps.flatMap((p) => p.chapters);
    const dir = join(out, l.split("/").pop()!);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "kg.json"),
      JSON.stringify(
        {
          $schema: "lean-library-kg/v1",
          library: l,
          revision: rev,
          extractedBy: "folio-assistant-sci/scripts/lean-library-ingest.ts",
          edgeBasis: "import graph from source text; not elaborated",
          parts: ps.map((p) => ({ key: p.key, title: p.title, chapters: p.chapters.map((c) => ({ key: c.key, title: c.title, modules: c.sections.map((m) => m.name) })) })),
          notNarrated: skipped.map((m) => m.name),
          modules: mods,
        },
        null,
        1,
      ),
    );
    writeFileSync(join(dir, "outline.md"), outlineMarkdown(l, ps, skipped, rev));
    console.log(`${l}: ${mods.length} modules, ${ps.length} part(s), ${chs.length} chapters -> ${dir}`);
  }
  if (libs.length > 1) {
    // order of the libraries themselves: condensed DAG over library membership
    const deps = new Map(libs.map((l) => [l, new Set<string>()]));
    for (const m of allMods.values()) for (const i of m.imports) if (libOf.has(i) && libOf.get(i) !== libOf.get(m.name)) deps.get(libOf.get(m.name)!)!.add(libOf.get(i)!);
    // Libraries are mutually dependent at this granularity (no DAG), so order them by the
    // MEDIAN prerequisite weight of their modules: elementary libraries first.
    const med = (l: string) => {
      const w = [...allMods.values()].filter((m) => libOf.get(m.name) === l).map((m) => weight(m.name)).sort((a, b) => a - b);
      return w[Math.floor(w.length / 2)] ?? 0;
    };
    const order = [...libs].sort((a, b) => med(a) - med(b) || a.localeCompare(b));
    let md = `# ${lib} as a treatise — order of the libraries\n\n> mathlib's top-level libraries import from one another in both directions, so they are not a DAG and no order respects every import. They are ordered by the median size of their modules' transitive import closure — elementary first — which is the Bourbaki principle (a book presupposes only the books before it) applied as far as the graph allows. A back-reference is a forward import across libraries and is listed so the narrative can say so.\n\n| # | library | modules | median prerequisite closure | imports from libraries placed later |\n|---|---|---|---|---|\n`;
    order.forEach((l, i) => {
      const n = [...allMods.values()].filter((m) => libOf.get(m.name) === l).length;
      const later = [...deps.get(l)!].filter((d) => order.indexOf(d) > i).map((d) => d.split("/").pop()).sort();
      md += `| ${i + 1} | ${l.split("/").pop()} | ${n} | ${med(l)} | ${later.join(", ") || "—"} |\n`;
    });
    writeFileSync(join(out, "libraries.md"), md);
  }
}

if (import.meta.main) main();
