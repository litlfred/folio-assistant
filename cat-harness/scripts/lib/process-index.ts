/**
 * The process index projection — every BPMN process every instance declares,
 * as one published JSON file the workflow page loads at runtime.
 *
 * Owner, 2026-10-02 (bean `ax6r`): the "Every workflow in the repo" table was
 * hand-maintained, and every new diagram needed a hand-written row that then
 * drifted from the diagram it described. The rows now come from here, and each
 * row's text is the diagram's OWN `bpmn:documentation` — so a sentence about a
 * process is written once, in the process, and every reader of it agrees.
 *
 * ## Per instance, from each instance's own declaration
 *
 * Every instance in the checkout is asked for ITS `processes` directories
 * (`workflowFiles(inst, "instance")`), and a diagram is attributed to the
 * instance that declares it. That is the aggregation the bean asks for, done
 * the only way a single checkout can do it today; once the instances are
 * separated it has to resolve each one through the declared dependencies
 * instead of walking one tree, and that half is still open on the bean.
 *
 * Bootstrap's diagrams ARE in this list, unlike in the docs-auto HTML index,
 * which indexes the root's corpus. This file is a listing — names and
 * documentation — not the root's knowledge graph, so it does not re-carry
 * bootstrap's process into the root's published graph (`kg-export` and
 * `instance-graph-isolation.test.ts` own that boundary).
 *
 * Written by `bun run docs:auto` (`gen-docs-auto.ts`), checked by
 * `docs:auto:check` for staleness and by `check:process-index` for coverage.
 *
 * @module scripts/lib/process-index
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

import { workflowFiles } from "../known-skills.ts";
import { forgeLocation, instanceRootsIn, readDeclaration, siteDirFor } from "../../schemas/cat-harness.ts";

/** The `$schema` tag of the published file. */
export const PROCESS_INDEX_SCHEMA = "folio-process-index/v1";

/** One process, as the workflow page draws it. */
export interface ProcessIndexRow {
  /** `bpmn:process/@id`. */
  id: string;
  /** `bpmn:process/@name`, or the file's basename when the diagram gives none. */
  name: string;
  /** First sentence of the process's own `bpmn:documentation`. Absent when it has none. */
  summary?: string;
  /** Repository-relative path of the `.bpmn`. */
  path: string;
  /** The `.bpmn` on its forge — in its submodule's own repository when it sits in one. */
  source: string;
  /** Site-root path of the rendered SVG, when `render:bpmn` has drawn one. */
  svg?: string;
  /** The directory between `processes/` and the file — the concern group. `""` when the file sits at the top. */
  group: string;
  /** Name of the instance whose declaration holds the diagram. */
  instance: string;
  /** `calledElement` of every call activity, deduplicated, in document order. Empty when it calls nothing. */
  calls: string[];
}

export interface ProcessIndex {
  $schema: typeof PROCESS_INDEX_SCHEMA;
  /** Every instance that was asked, with how many diagrams it declares — so a zero is a determined zero. */
  instances: Array<{ name: string; path: string; processes: number }>;
  processes: ProcessIndexRow[];
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#10;/g, " ").replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/** The first sentence of a longer string, for a listing line. */
export function firstSentence(s: string, max = 260): string {
  const one = s.replace(/\s+/g, " ").trim();
  const stop = one.search(/\.\s|\.$/);
  const cut = stop > 0 ? one.slice(0, stop + 1) : one;
  return cut.length > max ? cut.slice(0, max - 1).trimEnd() + "…" : cut;
}

/**
 * The process's OWN documentation — a DIRECT child of `bpmn:process`, never
 * the first `<documentation>` anywhere after it opens. A process with none of
 * its own would otherwise borrow its first lane's (measured 2026-09-22: 16 of
 * 61 diagrams did). `(?:bpmn:)?` everywhere: the prefix is a document's choice.
 */
export function processDocumentation(xml: string): string | undefined {
  const procOpen = /<(?:bpmn:)?process\b[^>]*>/.exec(xml);
  if (procOpen === null) return undefined;
  const after = xml.slice(procOpen.index + procOpen[0].length);
  const d = /<(?:bpmn:)?documentation\b[^>]*>([\s\S]*?)<\/(?:bpmn:)?documentation>/.exec(after);
  if (d === null) return undefined;
  const between = after.slice(0, d.index).replace(/<!--[\s\S]*?-->/g, "").trim();
  return between === "" ? decodeEntities(d[1]!) : undefined;
}

/** `@id` and `@name` of the first `bpmn:process` in a document. */
export function processHead(xml: string): { id?: string; name?: string } {
  const open = /<(?:bpmn:)?process\b([^>]*)>/.exec(xml)?.[1] ?? "";
  const id = /\sid="([^"]*)"/.exec(open)?.[1];
  const name = /\sname="([^"]*)"/.exec(open)?.[1];
  return { id, name: name === undefined ? undefined : decodeEntities(name) };
}

/** Every call activity's `calledElement`, deduplicated, in document order. */
export function calledElements(xml: string): string[] {
  const out: string[] = [];
  for (const m of xml.matchAll(/<(?:bpmn:)?callActivity\b[^>]*\scalledElement="([^"]+)"/g)) {
    if (!out.includes(m[1]!)) out.push(m[1]!);
  }
  return out;
}

/** The concern group: the path between the last `processes/` segment and the file. */
export function concernGroup(repoRelPath: string): string {
  const parts = repoRelPath.split("/");
  const at = parts.lastIndexOf("processes");
  return at >= 0 && at < parts.length - 2 ? parts.slice(at + 1, -1).join("/") : "";
}

const FORGE = "https://github.com/litlfred/folio-assistant";

/**
 * Build the projection for every instance under `repoRoot`.
 *
 * `harnessRoot` is the instance whose site the SVGs are rendered into
 * (`render:bpmn` writes `<site>/assets/img/workflows/<basename>.svg`); an SVG
 * is named only when the file is there, so the page never links a picture
 * nobody drew.
 */
export function collectProcessIndex(repoRoot: string, harnessRoot: string): ProcessIndex {
  const svgDir = join(harnessRoot, siteDirFor(harnessRoot), "assets", "img", "workflows");
  const instances: ProcessIndex["instances"] = [];
  const rows: ProcessIndexRow[] = [];
  const seen = new Set<string>();
  for (const inst of instanceRootsIn(repoRoot)) {
    let name = basename(inst);
    try {
      name = readDeclaration(inst)?.name ?? name;
    } catch {
      // An unreadable declaration is that instance's finding; the directory name still identifies it.
    }
    const files = workflowFiles(inst, "instance").filter((f) => f.endsWith(".bpmn"));
    let n = 0;
    for (const abs of files) {
      const path = relative(repoRoot, abs).split("\\").join("/");
      if (seen.has(path)) continue;
      seen.add(path);
      n++;
      const xml = readFileSync(abs, "utf-8");
      const head = processHead(xml);
      const doc = processDocumentation(xml);
      const at = forgeLocation(path, FORGE, repoRoot);
      const svgName = `${basename(abs, ".bpmn")}.svg`;
      rows.push({
        id: head.id ?? basename(abs, ".bpmn"),
        name: head.name ?? basename(abs, ".bpmn"),
        ...(doc && doc.trim() ? { summary: firstSentence(doc) } : {}),
        path,
        source: `${at.repoUrl.replace(/\.git$/, "")}/blob/main/${at.path}`,
        ...(existsSync(join(svgDir, svgName)) ? { svg: `/assets/img/workflows/${svgName}` } : {}),
        group: concernGroup(path),
        instance: name,
        calls: calledElements(xml),
      });
    }
    instances.push({ name, path: relative(repoRoot, inst).split("\\").join("/") || ".", processes: n });
  }
  rows.sort((a, b) => a.group.localeCompare(b.group, "en") || a.instance.localeCompare(b.instance, "en") || a.path.localeCompare(b.path, "en"));
  instances.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return { $schema: PROCESS_INDEX_SCHEMA, instances, processes: rows };
}

/**
 * Every declared `.bpmn` that is NOT a row — the coverage half of the gate.
 *
 * Recomputed from the declarations rather than read from the projection, so a
 * stale or hand-edited projection cannot vouch for itself.
 */
export function missingFromIndex(index: ProcessIndex, repoRoot: string): string[] {
  const have = new Set(index.processes.map((p) => p.path));
  return declaredDiagrams(repoRoot).filter((p) => !have.has(p));
}

/** Every `.bpmn` any instance under `repoRoot` declares, repository-relative and sorted. */
export function declaredDiagrams(repoRoot: string): string[] {
  const out: string[] = [];
  for (const inst of instanceRootsIn(repoRoot)) {
    for (const abs of workflowFiles(inst, "instance")) {
      if (abs.endsWith(".bpmn")) out.push(relative(repoRoot, abs).split("\\").join("/"));
    }
  }
  return [...new Set(out)].sort();
}
