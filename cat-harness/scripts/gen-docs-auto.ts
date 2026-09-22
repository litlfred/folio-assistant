#!/usr/bin/env bun
/**
 * Derived documentation for a sub-graph — one index per (type, sub-graph).
 *
 * @module scripts/gen-docs-auto
 *
 * Owner, 2026-09-20, bean `06e3`:
 *
 * > in cat-harness needs to be harness/handler at
 * > `cat-harness/docs-auto/<auto-doc-type>/<path>` defined. which will
 * > auto-generate extracatable documentation at `<path>` sub-graph.
 * > extracablle = bpmn, tasks, glossary, etc.
 *
 * ## Why this is a NEW generator rather than a kind of an existing one
 *
 * A note on `06e3` guessed the opposite — that docs-auto would be a `kind`
 * handled by `state-visualizer.ts`, which had just landed. Reading the three
 * existing generators says no, and the reason is structural rather than a
 * matter of taste: **every one of them is one-axis.** `gen-schema-viz`,
 * `gen-library-viz` and `state-visualizer` each map ONE graph kind to ONE
 * viewer at a fixed route, with optional subject pages beneath it. docs-auto
 * is **two-axis** — an auto-doc TYPE crossed with a SUB-GRAPH — and there is
 * nowhere in a one-axis generator to put the second axis without it becoming
 * this file anyway.
 *
 * What IS reused, and it is the part worth reusing: the routing.
 * `viewerPlacement(site, "<handler>/docs-auto/<type>", …)` is the owner's
 * `<base>/<handler>/<kind>/<subject>` rule with the type as a segment, and
 * `orphanSubjectPages()` prunes the result. No new URL rule, no fourth pruner.
 *
 * ## The sub-graph segment is the declared directory's `id`, not its path
 *
 * The owner wrote `<path>`. This publishes under the declared entry's **id**
 * instead — put to them as an open question on #607 with both costs stated,
 * and **ruled for the `id` on 2026-09-21**. The reasons it was argued on, all
 * of which survive as the reasons it stays:
 *
 * - **Precedent.** `state-visualizer.ts` settled the same question the same
 *   way, and gave the reason: `id` is what `harness.json` declares and what an
 *   override matches on, so an id-derived URL survives the directory moving.
 *   A path-derived one does not.
 * - **It stays one segment.** A path has slashes, so page directories would
 *   nest — and `orphanSubjectPages` scans one level, which is what makes
 *   pruning's ownership test exact. A nested tree would need a fourth pruner,
 *   which bean `ankg` explicitly asks nobody to write.
 * - **Nothing is lost.** Each page STATES its declared path, so the mapping
 *   from id to path is on the artefact rather than only in the URL.
 *
 * The cost, said out loud because a settled question still has one: the URL
 * does not mirror the tree, so `skills/` publishing under `cat-harness` is
 * legible only from the declaration. That is the trade taken.
 *
 * ## What this emits is an INDEX, and an index is not the documentation
 *
 * Owner, same bean:
 *
 * > then when authong `<harness>/docs` the author should make use of auto-doc
 * > referneces and provide a summary / overvuew of each of the business
 * > processes defined. as part of skills and judgement
 *
 * and, on how:
 *
 * > ..reuse assets in explain.
 *
 * So this file deliberately stops at the index. The per-process summary — what
 * each one is FOR, when you would be in it, what it is not — is a HUMAN or
 * AGENT obligation carried by the `docs-auto` skill, and it reuses these
 * assets rather than paraphrasing them into a second copy. A generated index
 * with no authored prose around it reads as complete while explaining nothing,
 * which is the `xom7` shape moved into documentation.
 *
 * ## Empty is not rendered
 *
 * A sub-graph contributing no items of a type gets NO page. A declared-but-
 * empty directory with a page claiming to index it is the `dh4f` defect as a
 * nav entry — a link that resolves to nothing while reading as a section.
 *
 * Usage:
 *   bun run docs:auto          # write
 *   bun run docs:auto --check  # fail if any artefact is stale, or orphaned
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

import { orphanSubjectPages, viewerPlacement } from "./gen-schema-viz.ts";
import { classify } from "./check-docs-populated.ts";
import { isSkillMd, kgRoots, skillMdDirs } from "./known-skills.ts";
import { readRoleGraph } from "../schemas/role-graph.ts";
import {
  findDeclarationFile,
  instanceRootsIn,
  readDeclaration,
  resolveDirectories,
  siteDirFor,
  visualisationsOf,
} from "../schemas/cat-harness.ts";

const ROOT = join(import.meta.dir, "..");
const REPO = join(ROOT, "..");
const check = process.argv.includes("--check");

/** One artefact an index lists. */
export interface AutoDocItem {
  /** Repository-relative path — what a reader opens, and how a sub-graph claims it. */
  path: string;
  /** What to call it in a listing. */
  name: string;
  /** One line, EXTRACTED from the artefact. Absent means the artefact does not carry one. */
  summary?: string;
  /** Type-specific facts, rendered as a small table. */
  facts?: Record<string, string>;
}

/**
 * An extractable documentation type.
 *
 * One `collect` per type, and the contract is the same for all of them —
 * which is the test of whether "docs-auto" names one thing. If a type cannot
 * produce `AutoDocItem[]`, it is a different generator wearing this one's
 * name.
 */
export interface AutoDocType {
  /** The URL segment(s), e.g. `index/skills`. Slashes nest. */
  id: string;
  title: string;
  /**
   * The graph kind whose declared directories hold this type's artefacts.
   *
   * **Not optional, and the first draft not having it was a real defect.**
   * Walking EVERY declared directory reported **1,522** skills where
   * `knownSkills()` finds ~136: `docs/` is declared too, and it holds a
   * generated markdown rendering of every skill, so each one was counted
   * again as though it were a second skill. A RENDERING of an artefact is not
   * the artefact. Naming the graph is what keeps an index about the thing
   * rather than about its copies.
   */
  graph: string;
  /**
   * Where this type's sub-graphs come from, when the ROOT declaration is not
   * the right source.
   *
   * Defaults to {@link declaredDirectories}`(graph)` — the root's own view,
   * which is correct for every type whose dependents' directories the root
   * already declares. `docs` is the exception and the reason this hook
   * exists: the root declares dependents' `skills/` and `library/` but CANNOT
   * declare their `docs/`, because `compose-docs.docsLayers` treats every
   * docs-kind entry in that file as a COMPOSITION LAYER — declaring
   * `smart-trust/docs/` there overlays its `index.md` onto the site's own.
   * Measured: `compose-docs.test.ts` failed exactly that way when tried.
   *
   * So the docs type asks each instance about itself instead, which is what
   * `mount-instance-docs` already does.
   */
  directories?: () => Array<{ id: string; absPath: string; path: string }>;
  /** One line on the page saying what was extracted and from where. */
  extracts: string;
  collect(): AutoDocItem[];
}

/** YAML front matter's `description`, folded to one line. Absent is absent. */
function frontMatterDescription(text: string): string | undefined {
  if (!text.startsWith("---")) return undefined;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return undefined;
  const fm = text.slice(3, end);
  const m = /^description:\s*(.*)$/m.exec(fm);
  if (!m) return undefined;
  let body = m[1]!.trim();
  if (body === ">" || body === "|" || body === ">-" || body === "|-") {
    // A folded block: take the indented lines that follow.
    const after = fm.slice(m.index + m[0].length).split("\n");
    const lines: string[] = [];
    for (const l of after) {
      if (l.trim() === "") continue;
      if (!/^\s+/.test(l)) break;
      lines.push(l.trim());
    }
    body = lines.join(" ");
  }
  return body.replace(/\s+/g, " ").trim() || undefined;
}

/** The first sentence of a longer string, for a listing line. */
/**
 * A pre-rendered page's `<title>`, for the docs index.
 *
 * Docs are not uniformly markdown — `who-iris/docs/` is four `.html` files —
 * so `frontMatterDescription` has nothing to read there. The title is what
 * such a page carries instead, and an absent one yields `undefined` rather
 * than a guess: a listing with no summary says less than a wrong one.
 */
/**
 * Docs directories across EVERY instance, each read from its own declaration.
 *
 * `instanceRootsIn` rather than a list: its own docstring records two gates
 * that each carried `["cat-harness", "bootstrap"]` while four instances
 * existed, and reported clean runs over half the subject. A list that must be
 * edited when a directory is added is a list that will be wrong.
 *
 * `scope !== "repository"` matches what `mount-instance-docs` publishes, so
 * this index covers exactly the docs that get a route and no more.
 *
 * Ids are the DECLARING instance's own, which is what makes the sub-page a
 * per-dependency answer — `who-iris-docs`, `smart-trust-docs` — rather than
 * one page for the root's docs and silence about everyone else's.
 */
function docsDirectoriesAcrossInstances(): Array<{ id: string; absPath: string; path: string }> {
  const out = new Map<string, { id: string; absPath: string; path: string }>();
  for (const d of declaredDirectories("docs")) out.set(d.absPath, d);
  for (const instance of instanceRootsIn(REPO)) {
    // `findDeclarationFile` returns a BASENAME, not a path — join it.
    // Without the join this reads relative to the process cwd, which silently
    // "works" for whichever instance happens to sit there and fails for every
    // other, leaving one sub-graph where there should be three. That is how
    // the first attempt at this looked correct.
    const declName = findDeclarationFile(instance);
    if (declName === undefined) continue;
    const decl = join(instance, declName);
    let parsed: { directories?: Array<{ id?: string; path?: string; scope?: string; graphKinds?: string[] }> };
    try {
      parsed = JSON.parse(readFileSync(decl, "utf-8"));
    } catch {
      continue; // an unreadable declaration is somebody else's finding, not a silent drop of this index
    }
    for (const e of parsed.directories ?? []) {
      if (!e.id || !e.path || e.scope === "repository") continue;
      if (!(e.graphKinds ?? []).includes("docs")) continue;
      const absPath = join(instance, e.path);
      if (!existsSync(absPath) || out.has(absPath)) continue;
      out.set(absPath, { id: e.id, absPath, path: relative(REPO, absPath).split("\\").join("/") });
    }
  }
  return [...out.values()].sort((a, b) => a.id.localeCompare(b.id, "en"));
}

/**
 * Pages a declared visualiser marks `publish: "staging-only"`.
 *
 * `compose-docs.ts` withholds these from the CANONICAL build, and a docs
 * index that reads the source tree walks straight past that decision. It is
 * not cosmetic: `fsh-guts-unpublished.test.ts` asserts the string `fsh-guts`
 * appears NOWHERE in the built export, and listing
 * `cat-harness/docs/fsh-guts/index.md` in this index put it there. The test
 * caught it.
 *
 * Read from the declaration's own `publish` field rather than by name, so a
 * second staging-only page is withheld without editing this file — naming
 * `fsh-guts` here would be a rule true only for the instance somebody
 * remembered.
 */
function stagingOnlyRefs(): Set<string> {
  const out = new Set<string>();
  for (const d of resolveDirectories([{ name: "(local)", root: ROOT, own: true }])) {
    for (const v of visualisationsOf(d.coverage, d.id)) {
      if (v.publish === "staging-only") out.add(v.ref.replace(/\\/g, "/"));
    }
  }
  return out;
}

function htmlTitle(text: string): string | undefined {
  const m = /<title>([\s\S]*?)<\/title>/i.exec(text);
  const t = m?.[1]?.replace(/\s+/g, " ").trim();
  return t ? t : undefined;
}

function firstSentence(s: string, max = 220): string {
  const one = s.replace(/\s+/g, " ").trim();
  const stop = one.search(/\.\s|\.$/);
  const cut = stop > 0 ? one.slice(0, stop + 1) : one;
  return cut.length > max ? cut.slice(0, max - 1).trimEnd() + "…" : cut;
}

function walk(dir: string, pred: (name: string) => boolean): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    // A dot-prefixed segment is skipped for the reason `directory-conventions`
    // gives: it is not a place this graph declares.
    if (e.name.startsWith(".")) continue;
    if (e.isDirectory()) out.push(...walk(p, pred));
    else if (pred(e.name)) out.push(p);
  }
  return out.sort();
}

/**
 * The declared directories holding one graph kind, by id.
 *
 * Existence-filtered, because a declared-but-absent directory is the `dh4f`
 * defect — a consumer scans nothing and reports a clean run over it.
 */
export function declaredDirectories(graph: string): Array<{ id: string; absPath: string; path: string }> {
  return resolveDirectories([{ name: "(local)", root: ROOT, own: true }])
    .filter((d) => (d.graphKinds ?? []).includes(graph))
    .map((d) => ({ id: d.id, absPath: d.absPath, path: relative(REPO, d.absPath).split("\\").join("/") }))
    .filter((d) => existsSync(d.absPath))
    .sort((a, b) => a.id.localeCompare(b.id, "en"));
}

/**
 * The types this handler implements.
 *
 * **`toc` is deliberately absent.** It was in the owner's first list and was
 * withdrawn in the same session — *"no toc,... ther is no meanging at folio
 * level"* — because a table of contents is a document-order notion and a
 * sub-graph has no single order to take one over. Recorded here as well as on
 * the bean, since this array is what a reader checks against that list.
 *
 * `glossary` was "declared but not built, bean `lqo9` holds a roast that gates
 * it". **That roast is held and slice 2 shipped**, so it is built below and
 * reads the ledger that slice writes.
 *
 * Still declared but NOT built: `index`, `index/bpmn`, `index/dmn`,
 * `index/tasks`, `index/roles`. Absent rather than stubbed: a type that emits
 * an empty page is indistinguishable from one whose sub-graphs are empty.
 */
export const TYPES: AutoDocType[] = [
  {
    id: "index/skills",
    title: "Skills",
    graph: "skills",
    extracts: "every skill markdown file, with the description it declares in its own front matter",
    collect(): AutoDocItem[] {
      // `skillMdDirs()`, NOT a recursive walk of the declared directories.
      //
      // The first draft walked them recursively and reported 227 skills
      // against `knownSkills()`'s 219. The seven extras were all the same
      // shape — `skills/<package>/<skill>/<page>.md`, a SUPPORTING PAGE of a
      // skill rather than a skill — and `isSkillMd` accepts them because they
      // carry the same front matter. `knownSkills` gets this right by listing
      // the directories that hold skill markdown instead of descending into
      // whatever is under them, so this asks the same function rather than
      // re-deriving the rule and disagreeing by seven.
      const items: AutoDocItem[] = [];
      for (const parts of skillMdDirs(ROOT)) {
        const dir = join(ROOT, ...parts);
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir)) {
          if (!f.endsWith(".md")) continue;
          const abs = join(dir, f);
          // Per FILE, not per directory: admitting a package says the
          // directory holds skills, never that everything in it is one.
          if (!isSkillMd(abs)) continue;
          const desc = frontMatterDescription(readFileSync(abs, "utf-8"));
          items.push({
            path: relative(REPO, abs).split("\\").join("/"),
            name: basename(f, ".md"),
            summary: desc ? firstSentence(desc) : undefined,
          });
        }
      }
      return dedupeByPath(items);
    },
  },
  {
    id: "index/docs",
    title: "Docs",
    graph: "docs",
    directories: docsDirectoriesAcrossInstances,
    extracts:
      "every AUTHORED documentation page an instance publishes, with the title and description its own front matter declares",
    collect(): AutoDocItem[] {
      // AUTHORED only, and `classify` from `check-docs-populated.ts` is what
      // decides — imported rather than re-derived.
      //
      // 261 of this instance's 316 docs markdown files are the GENERATED
      // reference (`docs/reference/**`, written by `gen-schema-docs` and
      // `gen-skill-docs`), plus this generator's own output under
      // `docs-auto/`. Listing them would bury the ~55 authored pages a reader
      // came for, and duplicate `index/skills`, which already lists the skill
      // instruction bodies those pages are generated FROM.
      //
      // The obvious implementation is a list of directory names to skip, and
      // it is the wrong one twice over: it is the hardcoded path literal
      // `check:declared-paths` refuses, and it would be a SECOND answer to
      // "is this page generated" — `check-docs-populated.ts` already owns
      // that question, having learned the hard way that a substring search
      // for "generated by" marks an authored page that merely DESCRIBES a
      // generator. Its anchored markers are the tested rule; this reuses them.
      // `.html` AS WELL AS `.md`, and that is not defensive breadth.
      // `who-iris/docs/` holds FOUR pages and every one is `.html` —
      // pre-rendered rather than Jekyll source. An `.md`-only filter reports
      // that instance as having no documentation while it publishes four
      // pages, which is the `dh4f` shape: a consumer scanning nothing and
      // calling the result clean. Measured before this was written.
      const items: AutoDocItem[] = [];
      const withheld = stagingOnlyRefs();
      for (const d of docsDirectoriesAcrossInstances()) {
        for (const abs of walk(d.absPath, (n) => n.endsWith(".md") || n.endsWith(".html"))) {
          const rel = relative(REPO, abs).split("\\").join("/");
          if (withheld.has(rel)) continue;
          const text = readFileSync(abs, "utf-8");
          if (classify(abs, text) === "generated") continue;
          const md = abs.endsWith(".md");
          const desc = md ? frontMatterDescription(text) : htmlTitle(text);
          items.push({
            path: relative(REPO, abs).split("\\").join("/"),
            name: basename(abs, md ? ".md" : ".html"),
            summary: desc ? firstSentence(desc) : undefined,
          });
        }
      }
      return dedupeByPath(items);
    },
  },
  {
    id: "index/processes",
    title: "Processes",
    graph: "processes",
    extracts: "every BPMN process, with its own documentation, its lanes, and the skills its activities name",
    collect(): AutoDocItem[] {
      const items: AutoDocItem[] = [];
      // BOTH the split kind and the umbrella it came out of. `processes` is
      // where an in-tree diagram lives after 2026-09-21; `cat-harness` is
      // where a downstream instance's still is, and dropping it would make
      // this index silently empty for them — which is worse than useless,
      // because an empty index reads as "this instance has no processes".
      //
      // This comment said `workflows` until the kind was renamed later the
      // same day, while the call below already read `processes` — a comment
      // naming a kind the code does not use is the one kind of staleness a
      // type checker cannot catch.
      const seen = new Set<string>();
      for (const d of [...declaredDirectories("processes"), ...declaredDirectories("cat-harness")]) {
        if (seen.has(d.absPath)) continue;
        seen.add(d.absPath);
        for (const f of walk(d.absPath, (n) => n.endsWith(".bpmn"))) {
          const xml = readFileSync(f, "utf-8");
          // `(?:bpmn:)?` on EVERY element, because the prefix is a document's
          // choice and not a fact about BPMN. `translation-workflow.bpmn`
          // declares BPMN as the DEFAULT namespace and writes `<lane>`,
          // `<userTask>`, `<documentation>` unprefixed — valid, and invisible
          // to a prefixed regex.
          //
          // It did not vanish from this index, which is why it survived: the
          // entry appeared, fell back to its FILENAME for a name, and showed
          // no lanes, no skills and no summary. An absent row might have been
          // noticed; an empty one reads as a diagram with nothing to say.
          // Found 2026-09-22 — the same defect in a fourth reader, after
          // `check-lane-documentation` and `glossary-export`.
          const name = /<(?:bpmn:)?process[^>]*\sname="([^"]*)"/.exec(xml)?.[1];
          // The process's OWN documentation — a DIRECT child, not the first
          // `<documentation>` anywhere after the process opens.
          //
          // Measured 2026-09-22: **16 of 61 diagrams** were showing a LANE's
          // documentation as the process summary. The old regex took the
          // first match in the file, and a process with no documentation of
          // its own therefore borrowed its first lane's.
          //
          // It was correct until two days earlier, and that is the instructive
          // part: bean `sqtq` wrote 157 lane `<documentation>` elements, and
          // every diagram whose process carried none started presenting a
          // lane's instead. A generated index, compared by a check against its
          // own generator, so nothing went red — the defect arrived with the
          // fix to a different one.
          const procOpen = /<(?:bpmn:)?process\b[^>]*>/.exec(xml);
          const doc = ((): string | undefined => {
            if (procOpen === null) return undefined;
            const after = xml.slice(procOpen.index + procOpen[0].length);
            const d = /<(?:bpmn:)?documentation>([\s\S]*?)<\/(?:bpmn:)?documentation>/.exec(after);
            if (d === null) return undefined;
            // Only whitespace and comments may sit between: anything else
            // means this documentation belongs to a child element.
            const between = after.slice(0, d.index).replace(/<!--[\s\S]*?-->/g, "").trim();
            return between === "" ? d[1] : undefined;
          })();
          const lanes = [...xml.matchAll(/<(?:bpmn:)?lane\b[^>]*\sname="([^"]*)"/g)].map((m) => m[1]!);
          const skills = [...new Set([...xml.matchAll(/<folio:skill\s+ref="([^"]+)"/g)].map((m) => m[1]!))];
          const acts = (xml.match(/<(?:bpmn:)?(task|serviceTask|userTask|callActivity)\b/g) ?? []).length;
          const facts: Record<string, string> = { activities: String(acts) };
          if (lanes.length) facts.lanes = lanes.join(" · ");
          if (skills.length) facts.skills = skills.sort().join(", ");
          items.push({
            path: relative(REPO, f).split("\\").join("/"),
            name: name ?? basename(f, ".bpmn"),
            summary: doc ? firstSentence(decodeEntities(doc)) : undefined,
            facts,
          });
        }
      }
      return dedupeByPath(items);
    },
  },
  {
    id: "glossary",
    title: "Glossary",
    graph: "glossary",
    extracts:
      "every term this instance's swimlanes define — the role's title and description, " +
      "the lane names that bind it, and whether the term has been retired",
    collect(): AutoDocItem[] {
      // Reads the LEDGER, not the glossary document.
      //
      // The document is derived and lives in `_kg/` (or `_site/` on a
      // deploy), so it is absent from a plain checkout — an index built from
      // it would be empty locally and full in CI, which is the worst of both.
      // The ledger is committed, is the declared `glossary` graph, and is the
      // one artefact that carries retirement. Reading it also means this page
      // shows a RETIRED term, which a reader looking up a word they met in an
      // old commit needs more than a reader of live terms does.
      //
      // `glossary-export.ts` is deliberately NOT imported: it builds the whole
      // KG export to do its job, which is seconds of work for a page that
      // needs four fields. `06e3`'s own rule — an index reuses assets rather
      // than recomputing them.
      // The DEFINITION, joined from the role registry.
      //
      // The ledger stores identity and retirement and nothing else, on
      // purpose: a definition copied into it would be a second copy free to
      // drift from `roles.json`, which is the authored source. So this joins
      // the two exactly as `glossary-export.ts` does — ledger for memory,
      // registry for meaning — rather than widening the ledger.
      //
      // The first version omitted this and every one of the 44 rows read "no
      // description in the artefact": a glossary index that defines nothing,
      // which is the thing issue #596 asked for the opposite of. Caught by
      // opening the page rather than by reading the count.
      const descriptions = new Map<string, string>();
      for (const kgRoot of kgRoots(ROOT)) {
        for (const r of readRoleGraph(kgRoot)?.roles ?? []) {
          if (!descriptions.has(r.id) && r.description) descriptions.set(r.id, r.description);
        }
      }

      const items: AutoDocItem[] = [];
      for (const d of declaredDirectories("glossary")) {
        for (const f of walk(d.absPath, (n) => n === "glossary-ledger.json")) {
          let parsed: { instance?: string; concepts?: Record<string, { prefLabel?: string; firstSeen?: string; retiredOn?: string | null }> };
          try {
            parsed = JSON.parse(readFileSync(f, "utf-8"));
          } catch {
            // A ledger this code cannot read is NOT an instance with no terms.
            // Skipping it silently would report a clean, empty glossary over a
            // broken file — `dh4f`, which is the shape this whole handler is
            // careful about.
            items.push({
              path: relative(REPO, f).split("\\").join("/"),
              name: "(unreadable ledger)",
              summary: "This file could not be parsed, so its terms are unknown — not absent.",
            });
            continue;
          }
          for (const [key, entry] of Object.entries(parsed.concepts ?? {}).sort(([a], [b]) => a.localeCompare(b, "en"))) {
            const retired = typeof entry.retiredOn === "string";
            items.push({
              // The ledger is one file holding many terms, so each item points
              // at the file and distinguishes itself by `name`. `dedupeByPath`
              // keys on path, so it is deliberately not applied here.
              path: `${relative(REPO, f).split("\\").join("/")}#${key}`,
              name: entry.prefLabel ?? key,
              summary: retired
                ? `Retired ${entry.retiredOn} — kept, never deleted, so retirement and accident do not look alike.`
                : // A retired term has no role to define it any more, which is
                  // why the branch above wins: its label comes from the ledger
                  // and its definition is genuinely gone.
                  (key.startsWith("role/") ? descriptions.get(key.slice("role/".length)) : undefined),
              facts: {
                notation: key,
                ...(entry.firstSeen ? { "first seen": entry.firstSeen } : {}),
                status: retired ? "retired" : "current",
              },
            });
          }
        }
      }
      return items;
    },
  },
];

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#10;/g, " ")
    .replace(/&amp;/g, "&");
}

/**
 * One item per path.
 *
 * Declared directories NEST — `cat-harness/skills/` contains
 * `cat-harness/processes/`, and both are declared — so a naive walk
 * lists the inner files twice. Deduplicating by path keeps the count honest;
 * the SUB-GRAPH a file is attributed to is decided separately, by
 * {@link owningDirectory}, which picks the most specific declaration.
 */
function dedupeByPath(items: AutoDocItem[]): AutoDocItem[] {
  const byPath = new Map<string, AutoDocItem>();
  for (const i of items) if (!byPath.has(i.path)) byPath.set(i.path, i);
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path, "en"));
}

/**
 * Which declared directory an item belongs to — the MOST SPECIFIC one.
 *
 * `cat-harness/processes/x.bpmn` is inside both `cat-harness` (id
 * `cat-harness`, path `cat-harness/skills/`) and the workflow directory. The
 * longest matching declared path wins, because that is the sub-graph that
 * actually describes it; attributing it to the outer one would make the inner
 * declaration index nothing while looking populated.
 */
export function owningDirectory(
  itemPath: string,
  dirs: Array<{ id: string; path: string }>,
): { id: string; path: string } | undefined {
  let best: { id: string; path: string } | undefined;
  for (const d of dirs) {
    const prefix = d.path.endsWith("/") ? d.path : `${d.path}/`;
    if (!itemPath.startsWith(prefix)) continue;
    if (!best || prefix.length > best.path.length) best = { id: d.id, path: prefix };
  }
  return best;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const BLOB = "https://github.com/litlfred/folio-assistant/blob/main";

/**
 * The chrome every page here shares.
 *
 * Extracted when the LEVEL pages were added (bean `06e3`): two renderers with
 * two copies of one stylesheet is two answers to what this looks like, and the
 * copy that is not edited is the one a reader meets first.
 */
const PAGE_CSS = `<style>
  :root { color-scheme: light dark; --ink: #1b2733; --muted: #5b6b7a; --edge: #c3ccd6; --paper: #fff; --accent: #0a5c7a; }
  @media (prefers-color-scheme: dark) {
    :root { --ink: #e6edf3; --muted: #9fb0c0; --edge: #3a4652; --paper: #0f1720; --accent: #6fc4e4; }
  }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 68rem; margin: 0 auto; padding: 1.5rem 1.2rem 4rem; }
  a { color: var(--accent); }
  h1 { font-size: 1.7rem; margin: 0 0 .3rem; }
  .lede { color: var(--muted); margin: 0 0 1.4rem; }
  .note { border-left: 4px solid var(--edge); padding: .7rem 1rem; margin: 1.4rem 0; font-size: .93rem; color: var(--muted); }
  table { width: 100%; border-collapse: collapse; font-size: .95rem; }
  th, td { text-align: left; padding: .6rem .6rem; border-bottom: 1px solid var(--edge); vertical-align: top; }
  th { background: color-mix(in srgb, var(--edge) 22%, transparent); }
  td:first-child { width: 26rem; }
  /* A repo-relative path is long and has no spaces, so it breaks mid-word
     unless the breakpoints are named. Slashes are where a reader expects it. */
  .p { color: var(--muted); font-size: .8rem; font-family: ui-monospace, monospace; word-break: normal; overflow-wrap: anywhere; line-break: anywhere; }
  .none { color: var(--muted); font-style: italic; }
  .f { margin-top: .35rem; font-size: .85rem; color: var(--muted); }
  .f .k { display: inline-block; min-width: 5.2rem; font-weight: 600; }
  ul.subs { list-style: none; padding: 0; margin: 0 0 1.6rem; }
  ul.subs li { padding: .3rem 0; border-bottom: 1px solid var(--edge); }
  .n { float: right; color: var(--muted); font-variant-numeric: tabular-nums; }
</style>`;

/**
 * One index page.
 *
 * `scope` carries the declared directory's id, and it is emitted as the same
 * `var SCOPE = "…";` line the viewer generators use — deliberately, because
 * that line is what `orphanSubjectPages` reads to establish ownership before
 * pruning. A fourth marker would mean a fourth pruner.
 */
export function autoDocPage(
  type: AutoDocType,
  items: AutoDocItem[],
  scope: string,
  scopePath: string | undefined,
  siblings: Array<{ id: string; path: string; count: number }>,
): string {
  const rows = items
    .map((i) => {
      const facts = i.facts
        ? Object.entries(i.facts)
            .map(([k, v]) => `<div class="f"><span class="k">${esc(k)}</span> ${esc(v)}</div>`)
            .join("")
        : "";
      return `<tr>
  <td><a href="${esc(`${BLOB}/${i.path}`)}"><code>${esc(i.name)}</code></a><br><span class="p">${esc(i.path)}</span></td>
  <td>${i.summary ? esc(i.summary) : '<span class="none">no description in the artefact</span>'}${facts}</td>
</tr>`;
    })
    .join("\n");

  const nav = siblings
    .map(
      (s) =>
        `<li>${s.id === scope ? "<strong>" : `<a href="../${esc(s.id)}/">`}${esc(s.id)}${s.id === scope ? "</strong>" : "</a>"}` +
        ` <span class="p">${esc(s.path)}</span> <span class="n">${s.count}</span></li>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(type.title)}${scope ? ` — ${esc(scope)}` : ""} · docs-auto</title>
${PAGE_CSS}
</head>
<body>
<div class="wrap">
<h1>${esc(type.title)}${scope ? ` <span class="p">${esc(scope)}</span>` : ""}</h1>
<p class="lede">Derived: ${esc(type.extracts)}.${scopePath ? ` Sub-graph <code>${esc(scopePath)}</code>.` : ""}</p>

<div class="note">
  <strong>This is an index, not the documentation.</strong> It says what exists and what each
  artefact declares about itself. What a process is <em>for</em>, when you would be in it, and
  what it is not, is authored beside it and reuses these entries rather than restating them —
  see the <code>docs-auto</code> skill.
</div>

<ul class="subs">
${nav}
</ul>

<table>
<thead><tr><th>Artefact</th><th>What it declares about itself</th></tr></thead>
<tbody>
${rows || '<tr><td colspan="2" class="none">Nothing in scope.</td></tr>'}
</tbody>
</table>
</div>
<script>
/* The sub-graph this page indexes. Read by orphanSubjectPages() to establish
   ownership before pruning — the same line the viewer generators emit. */
var SCOPE = "${scope}";
</script>
</body>
</html>
`;
}

/** One built type, as a LEVEL page needs to describe it. */
export interface LevelChild {
  /** The path segment, which is also the directory name. */
  seg: string;
  /** A type's own title, or the segment when the child is another level. */
  title: string;
  /** What the type extracts, or how many types sit under this level. */
  detail: string;
  /** Items indexed, where the child is a type. */
  count?: number;
}

/**
 * The index for a LEVEL — a directory that holds types rather than items.
 *
 * **Bean `06e3`, and it is the same defect `§4(a)` fixed one level up.**
 * `viewerPlacement` gives a type like `index/skills` a nested page directory,
 * so `docs-auto/` and `docs-auto/index/` came into existence as directories
 * with nothing in them. A route that reads like a section and answers nothing
 * is `dh4f` in navigation form — and the authored landing page had to name
 * `docs-auto` WITHOUT a link because of it.
 *
 * The children are derived from the built types, never listed: a type added to
 * `TYPES` appears here the moment it is built, and a level with nothing under
 * it does not get a page at all rather than getting an empty one. An empty
 * list and a complete list look identical, which is the whole reason the
 * absent-rather-than-stubbed rule is on `TYPES` already.
 *
 * It carries the same `var SCOPE` line as every other page here, so ownership
 * is read off the file by the one pruner rather than assumed from the path.
 */
export function levelPage(prefix: string, children: readonly LevelChild[]): string {
  const here = prefix === "" ? "docs-auto" : prefix;
  const rows = children
    .map(
      (c) =>
        `<li><a href="${esc(c.seg)}/">${esc(c.title)}</a>` +
        (c.count === undefined ? "" : ` <span class="n">${c.count}</span>`) +
        `<div class="f">${esc(c.detail)}</div></li>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(here)} · docs-auto</title>
${PAGE_CSS}
</head>
<body>
<div class="wrap">
<h1>docs-auto${prefix ? ` <span class="p">${esc(prefix)}</span>` : ""}</h1>
<p class="lede">Derived documentation over a declared sub-graph. Each entry below is
generated from the repository on every build, so it is what the tree actually holds
rather than what anybody remembered.</p>

<div class="note">
  <strong>These are indexes, not the documentation.</strong> They say what exists and what
  each artefact declares about itself. What a thing is <em>for</em>, when you would reach for
  it, and what it is not, is authored beside them and reuses these entries rather than
  restating them — see the <code>docs-auto</code> skill.
</div>

<ul class="subs">
${rows || '<li class="none">Nothing is built under this level.</li>'}
</ul>
</div>
<script>
/* The level this page indexes. Read by orphanSubjectPages() to establish
   ownership before pruning — the same line every other page here emits. */
var SCOPE = "${esc(prefix === "" ? "docs-auto" : prefix.split("/").pop()!)}";
</script>
</body>
</html>
`;
}

let stale = 0;
function emit(path: string, content: string): void {
  if (check) {
    const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
    if (current === content) return;
    console.error(`  ✗ ${path} ${existsSync(path) ? "is stale" : "is missing"}`);
    stale++;
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

if (import.meta.main) {
  const handler = readDeclaration(ROOT)?.name;
  if (!handler) {
    console.log("  · this instance declares no name — no handler segment to publish under");
    process.exit(0);
  }
  const site = join(ROOT, siteDirFor(ROOT));

  /** Items indexed per BUILT type — what the level pages below count. */
  const built = new Map<string, number>();

  for (const type of TYPES) {
    const dirs = (type.directories ?? (() => declaredDirectories(type.graph)))();
    const items = type.collect();
    // Attribute each item to its most specific declared sub-graph, then keep
    // only the sub-graphs that actually have something. An empty one gets no
    // page: `dh4f` as a nav entry.
    const byDir = new Map<string, AutoDocItem[]>();
    for (const i of items) {
      const owner = owningDirectory(i.path, dirs);
      if (!owner) continue;
      (byDir.get(owner.id) ?? byDir.set(owner.id, []).get(owner.id)!).push(i);
    }
    const populated = [...byDir.keys()].sort((a, b) => a.localeCompare(b, "en"));
    const siblings = populated.map((id) => ({
      id,
      path: dirs.find((d) => d.id === id)?.path ?? "",
      count: byDir.get(id)!.length,
    }));

    const { pageDir } = viewerPlacement(site, `${handler}/docs-auto/${type.id}`, "docs-auto");
    emit(join(pageDir, "index.html"), autoDocPage(type, items, "", undefined, siblings));
    for (const id of populated) {
      const sub = viewerPlacement(site, `${handler}/docs-auto/${type.id}/${id}`, "docs-auto");
      emit(
        join(sub.pageDir, "index.html"),
        autoDocPage(type, byDir.get(id)!, id, dirs.find((d) => d.id === id)?.path, siblings),
      );
    }

    // Orphans — bean `ankg`'s helper, unchanged. A sub-graph that stops
    // contributing items keeps its page otherwise, indexing a set that no
    // longer exists.
    const { owned, foreign } = orphanSubjectPages(pageDir, populated);
    for (const name of foreign) {
      console.error(`  ! ${join(pageDir, name)} does not identify itself — left in place`);
    }
    for (const name of owned) {
      const dir = join(pageDir, name);
      if (check) {
        console.error(`  ✗ ${dir} is an orphan — its sub-graph contributes nothing to this type`);
        stale++;
        continue;
      }
      rmSync(dir, { recursive: true });
      console.log(`  ✗ pruned ${dir}`);
    }

    built.set(type.id, items.length);
    if (!check) {
      console.log(`  ✓ ${type.id}: ${items.length} item(s) across ${populated.length} sub-graph(s)`);
    }
  }

  // ── The LEVEL pages — bean `06e3`, the same defect §4(a) fixed one up ──
  //
  // A type id may carry a slash (`index/skills`), so `viewerPlacement` nests
  // its page directory and the levels above it came into existence holding
  // nothing. Each one now gets an index derived from the types actually BUILT,
  // so a type added to `TYPES` appears here the day it builds and a level with
  // nothing under it gets no page rather than an empty one.
  {
    const levels = new Map<string, LevelChild[]>();
    for (const id of built.keys()) {
      const segs = id.split("/");
      for (let i = 0; i < segs.length; i++) {
        const prefix = segs.slice(0, i).join("/");
        const seg = segs[i]!;
        const childId = segs.slice(0, i + 1).join("/");
        const kids = levels.get(prefix) ?? levels.set(prefix, []).get(prefix)!;
        if (kids.some((k) => k.seg === seg)) continue;
        const type = TYPES.find((t) => t.id === childId);
        kids.push(
          type
            ? { seg, title: type.title, detail: type.extracts, count: built.get(childId) }
            : {
                seg,
                title: seg,
                // Counted, not named: the types under a level are listed on
                // the level's own page, and repeating them here would be the
                // restatement the note on every page forbids.
                detail: `${[...built.keys()].filter((k) => k.startsWith(`${childId}/`)).length} type(s) below`,
              },
        );
      }
    }
    for (const [prefix, kids] of levels) {
      kids.sort((a, b) => a.seg.localeCompare(b.seg, "en"));
      const at = viewerPlacement(site, `${handler}/docs-auto${prefix ? `/${prefix}` : ""}`, "docs-auto");
      emit(join(at.pageDir, "index.html"), levelPage(prefix, kids));
      if (!check) console.log(`  ✓ level ${prefix || "docs-auto"}: ${kids.length} child(ren)`);
    }
  }

  if (stale > 0) {
    console.error(`\n${stale} artefact(s) stale — run \`bun run docs:auto\``);
    process.exit(1);
  }
  if (check) console.log(`docs-auto: ${TYPES.length} type(s) up to date`);
}
