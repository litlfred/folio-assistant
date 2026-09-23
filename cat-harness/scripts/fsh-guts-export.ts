/**
 * `<base>/fsh-guts.jsonld` — the trashcan, reachable by name.
 *
 * Owner, 2026-09-19: *"jsonld accessible via `<base-url>/fsh-guts.jsonld`."*
 *
 * ## A SEPARATE document, and that is the whole point
 *
 * The main export strips `fsh-guts` from every graph it publishes — the
 * kind, the directory, the skill and every edge naming them. This document
 * is how the content stays reachable anyway: **by name, deliberately, and
 * never by following an edge.** A reader who wants it asks for it; a crawler
 * walking the knowledge graph never arrives.
 *
 * Folding these nodes into the main graph would have been the obvious
 * implementation and would have undone the strip in one step.
 *
 * ## Logs are excluded by DECLARATION, not by luck
 *
 * `fsh-guts/logs/` lives inside the tree this walks, and the owner was
 * explicit that logs are not published. They are git-ignored, so a CI
 * checkout happens to have none — which is a property of the build, not of
 * this exporter, and would stop being true the moment somebody exported from
 * a working tree. A file is included only if it DECLARES
 * `folio-fsh-guts/v1`, so a log entry is excluded because of what it says it
 * is.
 *
 * ## Skipped files are reported, never silently dropped
 *
 * A file that declares nothing is data (somebody dropped a note in); a file
 * that declares this schema and fails it is a defect. Both are listed in
 * `skipped` with a reason, because an exporter whose output is a short list
 * gives no way to tell "the trashcan has three things in it" from "eleven
 * things failed to parse".
 *
 * Usage:  bun run cat-harness/scripts/fsh-guts-export.ts [--out FILE] [--base-url URL]
 *
 * @module scripts/fsh-guts-export
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import {
  artefactStub,
  readDeclaration,
  resolveDirectories, repoRootFor } from "../schemas/cat-harness.js";
import { NS_PREFIXES, termIri } from "../schemas/namespaces.js";
import { readFshGutsNode } from "../schemas/fsh-guts.js";

const ROOT = resolve(import.meta.dir, "..");

export interface SkippedFile {
  path: string;
  reason: string;
}

export interface FshGutsDocument {
  "@context": Record<string, unknown>;
  "@id": string;
  "@type": string;
  name: string;
  description: string;
  nodeCount: number;
  "@graph": Record<string, unknown>[];
  /** Files looked at and not included, each with why. Never omitted. */
  skipped: SkippedFile[];
  /** Directories walked. Empty means the instance declares no trashcan. */
  scans: string[];
}

/**
 * The keys already mapped to their own term in an exported node.
 *
 * Kept beside {@link extraFields} rather than inlined, because the two must
 * agree: a common field that appears in both would be emitted twice, once
 * under its term and once inside `data`.
 */
const MAPPED_KEYS = new Set([
  "$schema",
  "title",
  "kind",
  "movedOn",
  "movedFrom",
  "issue",
  "bean",
  "summary",
]);

/**
 * A node's kind-specific fields, as `{ data: … }` or nothing at all.
 *
 * Nothing at all rather than `data: {}`, so a document of ordinary nodes is
 * byte-identical to what it was before this existed — an empty object on
 * every node would be noise that a reader has to learn to ignore.
 */
export function extraFields(node: Record<string, unknown>): { data?: Record<string, unknown> } {
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (!MAPPED_KEYS.has(k) && v !== undefined) data[k] = v;
  }
  return Object.keys(data).length > 0 ? { data } : {};
}

/** A declared trashcan directory: where it is, and what the declaration calls it. */
export interface FshGutsDir {
  /** Absolute, for walking. */
  absPath: string;
  /**
   * The DECLARED path — `fsh-guts/` — which is what every published string is
   * built from.
   *
   * Both are carried because they answer different questions and the answers
   * diverged at the move (bean `wggr`). `fsh-guts/` is declared
   * `scope: "repository"`, so its absolute path is no longer under the
   * instance root and `relative(root, absPath)` came back `../fsh-guts`. That
   * went into `scans`, into every node's `sourcePath`, and into every `@id` —
   * whose sanitiser permits `.` and would have published
   * `…/fsh-guts.jsonld#../docs/proposals/x.md`. A link-shaped value that
   * dereferences to nothing is the `blv9` shape, and it would have been minted
   * into a document whose whole job is to stay addressable.
   */
  path: string;
}

/** Every declared `fsh-guts` directory — not the literal path. */
export function fshGutsDirs(root: string): FshGutsDir[] {
  try {
    return resolveDirectories([{ name: "(local)", root, own: true }])
      .filter((d) => d.graphKinds.includes("fsh-guts"))
      .map((d) => ({ absPath: d.absPath, path: d.path.replace(/\/+$/, "") }))
      .filter((d) => existsSync(d.absPath));
  } catch {
    return [];
  }
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

/**
 * Build the document.
 *
 * `baseUrl` overrides the declaration's canonical URL, for a staging preview
 * whose `@id` must name where it is actually served rather than where main
 * publishes.
 */
export function buildFshGutsExport(root: string = ROOT, baseUrl?: string): FshGutsDocument {
  const decl = readDeclaration(root);
  const stub = decl ? artefactStub(decl) : "instance";
  const base = (baseUrl ?? decl?.canonicalUrl ?? "").replace(/\/+$/, "");
  const docIri = `${base}/fsh-guts.jsonld`;

  const scans = fshGutsDirs(root);
  const graph: Record<string, unknown>[] = [];
  const skipped: SkippedFile[] = [];

  for (const dir of scans) {
    for (const path of walk(dir.absPath)) {
      // Relative to the DECLARED directory, not to `root`: see `FshGutsDir`.
      const rel = join(dir.path, relative(dir.absPath, path));
      let text: string;
      try {
        text = readFileSync(path, "utf8");
      } catch (e) {
        skipped.push({ path: rel, reason: `unreadable: ${e instanceof Error ? e.message : String(e)}` });
        continue;
      }
      const read = readFshGutsNode(text);
      if (!read.node) {
        skipped.push({ path: rel, reason: read.reason });
        continue;
      }
      const n = read.node;
      graph.push({
        "@id": `${docIri}#${rel.replace(/[^A-Za-z0-9/_.-]/g, "-")}`,
        "@type": termIri("FshGutsNode"),
        name: n.title,
        nodeKind: n.kind,
        sourcePath: rel,
        ...(n.movedOn ? { movedOn: n.movedOn } : {}),
        ...(n.movedFrom ? { movedFrom: n.movedFrom } : {}),
        ...(n.issue !== undefined ? { issue: String(n.issue) } : {}),
        ...(n.bean ? { bean: n.bean } : {}),
        ...(n.summary ? { description: n.summary } : {}),
        // THE BODY, so the viewer has something to display.
        //
        // Without it a reader who selects a node gets its metadata and no
        // content, and `fsh-guts/` is not in the render pipeline — there is
        // no page to link to instead. Keeping something addressable while
        // making its text unreachable would be most of the way to deleting
        // it.
        //
        // Measured 2026-09-19: 59 KB of bodies against a 5 KB document. That
        // is why the viewer fetches this lazily, when Settings is opened,
        // rather than on every page load for a badge number.
        body: read.body.trim(),
        // Whatever this KIND carries that the common fields do not.
        //
        // The schema's `kind` is open, so the fields cannot be closed — and
        // an allowlist here would close them again one level out. `bean` is
        // the evidence: declaring it in the schema was necessary and not
        // sufficient, because a node's extra field still has to be emitted.
        //
        // Nested under `data` rather than spread, so a node kind can never
        // shadow `@id`, `@type` or a common term by choosing that name.
        ...extraFields(n),
      });
    }
  }

  graph.sort((a, b) => String(a["@id"]).localeCompare(String(b["@id"])));
  skipped.sort((a, b) => a.path.localeCompare(b.path));

  return {
    "@context": {
      ...NS_PREFIXES,
      // `rdfs:label` / `rdfs:comment`, exactly as the main export maps them.
      // Minting `fac:name` here would have been a second term for a concept
      // RDF already names — and `ns:check` caught it, which is the gate
      // doing precisely its job twice in one session.
      name: "rdfs:label",
      description: "rdfs:comment",
      nodeKind: termIri("nodeKind"),
      sourcePath: termIri("sourcePath"),
      movedOn: termIri("movedOn"),
      movedFrom: termIri("movedFrom"),
      issue: termIri("issue"),
      bean: termIri("bean"),
      // `schema:text` rather than a minted `fac:body`: schema.org already
      // names "the textual content of this thing", and a second term for it
      // is the drift `ns:check` caught twice on this branch already.
      body: "schema:text",
      nodeCount: termIri("nodeCount"),
      scans: termIri("scans"),
    },
    "@id": docIri,
    "@type": termIri("FshGutsGraph"),
    name: `${stub} — fsh-guts`,
    description:
      "The trashcan that is kept: deprecated and throwaway structured content, " +
      "addressable and exported and deliberately absent from the rendered site. " +
      "Reachable BY NAME only — every other published graph has its references " +
      "stripped, so nothing links here. Activity logs live under this tree and " +
      "are excluded: a file is included only if it declares itself folio-fsh-guts/v1.",
    nodeCount: graph.length,
    "@graph": graph,
    skipped,
    scans: scans.map((d) => d.path),
  };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const arg = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const doc = buildFshGutsExport(ROOT, arg("--base-url"));
  // `_kg/` is a REPOSITORY build output — gitignored at the repository root,
  // beside `node_modules/`, `_site/` and `test-results/`, and read from there
  // by the e2e specs and `test-server.mjs`, both of which run at that root.
  // `ROOT` became the INSTANCE root with the move (bean `wggr`), so this
  // default started writing `cat-harness/_kg/` while every reader still looked
  // one level up — and the stale pre-move copy at the old path made it look
  // fine locally.
const out = arg("--out") ?? join(repoRootFor(ROOT), "_kg", "fsh-guts.jsonld");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`, "utf-8");

  console.log(`fsh-guts export → ${relative(ROOT, out)}`);
  console.log(`  @id  ${doc["@id"]}`);
  if (doc.scans.length === 0) {
    // A determined empty and a missing declaration are different answers.
    console.log("  NO fsh-guts directory is declared — this is not an empty trashcan,");
    console.log("  it is an instance that has not declared one.");
  } else {
    console.log(`  ${doc.nodeCount} node(s) from ${doc.scans.join(", ")}`);
  }
  if (doc.skipped.length) {
    console.log(`  ${doc.skipped.length} file(s) skipped:`);
    for (const s of doc.skipped) console.log(`    · ${s.path} — ${s.reason}`);
  }
}
