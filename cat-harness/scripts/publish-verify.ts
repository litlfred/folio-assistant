#!/usr/bin/env bun
/**
 * Verify what is about to be deployed — the post-processing verifier set.
 *
 * @module scripts/publish-verify
 *
 * Bean `vigi`, owner 2026-09-23: *"a set of post processing tools for
 * verification that a failure triggers an alert to the publisher manager …
 * new sub-process"*, run **before deployment**, blocking. The process is
 * `processes/publish-verification.bpmn`; the alert is
 * `processes/publish-alert.bpmn`, which every failing step after the publish
 * button shares.
 *
 *   bun run cat-harness/scripts/publish-verify.ts --dir ./_site [--report out.json]
 *
 * Exit 0 every in-scope document passed · 1 a verifier found a failure ·
 * 2 could not tell (nothing to verify, or a verifier could not run). The
 * caller treats 1 and 2 alike: nothing is deployed.
 *
 * ## A SET, not one check
 *
 * Each verifier is an entry in {@link VERIFIERS}: an id, what it asks, and a
 * function from the directory to findings. Adding one is adding an entry; the
 * report, the exit code and the alert need no change. The first is JSON-LD
 * expansion, because the graph was JSON-LD by convention and not by
 * construction — nothing had ever run a processor over it, and the first run
 * found two documents silently dropping a property. The second is unique ids
 * in built HTML (bean `uknu`) — a defect the source cannot show.
 *
 * ## What is in scope
 *
 * A document is OURS — and so verified — when its `@context` references our
 * content context or binds one of our namespaces (`own-namespaces` code list).
 * Anything else in the tree is ingested third-party data (a WHO IG's artefact
 * index, say): counted and reported, never silently passed, and never able to
 * block our release. The same scoping the owner approved for bean `2j09`.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import jsonld from "jsonld";

import { CONTENT_CONTEXT_URL } from "../schemas/jsonld";
import { OWN_NAMESPACE_VALUES } from "../schemas/namespaces";
import { duplicateIds } from "./check-duplicate-ids";

export interface Finding {
  verifier: string;
  file: string;
  detail: string;
}

export interface VerifierResult {
  id: string;
  asks: string;
  checked: number;
  outOfScope: number;
  findings: Finding[];
  /** Set when the verifier could not run at all — never read as a pass. */
  couldNotTell?: string;
}

export interface Verifier {
  id: string;
  asks: string;
  run(dir: string): Promise<Omit<VerifierResult, "id" | "asks">>;
}

/** Every file with this extension under a directory, skipping dot-prefixed segments. */
export function treeFiles(dir: string, ext: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(ext)) out.push(p);
    }
  };
  if (existsSync(dir) && statSync(dir).isDirectory()) walk(dir);
  return out.sort();
}

/** Ours: the context names our content context, or binds a namespace we mint. */
export function isOurs(doc: unknown): boolean {
  if (doc === null || typeof doc !== "object") return false;
  const ctx = (doc as { "@context"?: unknown })["@context"];
  if (ctx === undefined) return false;
  const s = JSON.stringify(ctx);
  return s.includes(CONTENT_CONTEXT_URL) || OWN_NAMESPACE_VALUES.some((ns) => s.includes(ns));
}

/** A document that is only a context — nothing to expand, and not a failure. */
function contextOnly(doc: Record<string, unknown>): boolean {
  return Object.keys(doc).every((k) => k === "@context");
}

/**
 * A loader that never touches the network: a context URL under our published
 * base resolves to the file at the same path in the tree being verified, and
 * anything else is refused — a document that needs the network to be
 * understood is a finding, not something to fetch at deploy time.
 */
export function localLoader(dir: string) {
  const base = CONTENT_CONTEXT_URL.slice(0, CONTENT_CONTEXT_URL.indexOf("/ns/content/"));
  return async (url: string) => {
    const p = url.startsWith(`${base}/`) ? join(dir, url.slice(base.length + 1)) : undefined;
    const fallback = url === CONTENT_CONTEXT_URL ? resolve(import.meta.dir, "..", "ns", "content", "v1.jsonld") : undefined;
    const file = p && existsSync(p) ? p : fallback;
    if (!file) throw new Error(`refused to fetch ${url}: not in the tree being verified`);
    return { contextUrl: null, documentUrl: url, document: JSON.parse(readFileSync(file, "utf-8")) };
  };
}

/** Expand one document; every warning a processor raises is a finding. */
export async function expandFindings(doc: object, loader: ReturnType<typeof localLoader>): Promise<string[]> {
  const out: string[] = [];
  try {
    await jsonld.expand(doc, {
      documentLoader: loader,
      eventHandler: ({ event }: { event: { code: string; message?: string; details?: Record<string, unknown> } }) => {
        const d = event.details ?? {};
        const what = (d["property"] ?? d["id"] ?? d["term"] ?? "") as string;
        out.push(`${event.code}${what ? ` (${String(what)})` : ""}`);
      },
    } as unknown as jsonld.Options.Expand);
  } catch (e) {
    out.push(`does not expand: ${(e as Error).message}`);
  }
  return out;
}

export const JSONLD_EXPAND: Verifier = {
  id: "jsonld-expand",
  asks:
    "Does every JSON-LD document of ours expand under a real processor with no warning — no " +
    "property dropped, no relative IRI, no context that fails to load?",
  async run(dir) {
    const loader = localLoader(dir);
    const findings: Finding[] = [];
    let checked = 0;
    let outOfScope = 0;
    for (const f of treeFiles(dir, ".jsonld")) {
      let doc: unknown;
      try {
        doc = JSON.parse(readFileSync(f, "utf-8"));
      } catch (e) {
        findings.push({ verifier: "jsonld-expand", file: relative(dir, f), detail: `not JSON: ${(e as Error).message}` });
        continue;
      }
      if (!isOurs(doc)) {
        outOfScope += 1;
        continue;
      }
      if (contextOnly(doc as Record<string, unknown>)) continue;
      checked += 1;
      for (const detail of await expandFindings(doc as object, loader)) {
        findings.push({ verifier: "jsonld-expand", file: relative(dir, f), detail });
      }
    }
    return { checked, outOfScope, findings };
  },
};

/**
 * Bean `uknu`: the theme renders `nav_footer_custom.html` twice, so 1,222
 * published pages carried `id="fa-nav-open"` twice while the source was
 * correct and every gate was green. #1213 fixed it and added
 * `check:duplicate-ids`, which runs on a PR's STAGING build — this runs the
 * same scanner on the build that DEPLOYS, so a duplicate that reaches `main`
 * blocks the release and raises the publication-manager alert instead of
 * going live. One scanner, two call sites.
 *
 * Every page in the tree is in scope. Unlike a JSON-LD document, which may be
 * someone else's data we carry, an HTML page here is one our site build wrote
 * and publishes under our URL.
 */
export const HTML_UNIQUE_IDS: Verifier = {
  id: "html-unique-ids",
  asks:
    "Does every built HTML page declare each id once — so every `<label for>`, `#fragment` link and " +
    "`aria-labelledby` reaches the one element it names?",
  async run(dir) {
    const findings: Finding[] = [];
    let checked = 0;
    for (const f of treeFiles(dir, ".html")) {
      checked += 1;
      for (const [id, n] of duplicateIds(readFileSync(f, "utf-8"))) {
        findings.push({ verifier: "html-unique-ids", file: relative(dir, f), detail: `duplicate id ${id} ×${n}` });
      }
    }
    return { checked, outOfScope: 0, findings };
  },
};

/** The set. Add a verifier here; nothing else changes. */
export const VERIFIERS: readonly Verifier[] = [JSONLD_EXPAND, HTML_UNIQUE_IDS];

export async function verify(dir: string, verifiers: readonly Verifier[] = VERIFIERS): Promise<{
  results: VerifierResult[];
  exit: 0 | 1 | 2;
}> {
  const results: VerifierResult[] = [];
  for (const v of verifiers) {
    try {
      const r = await v.run(dir);
      results.push({ id: v.id, asks: v.asks, ...r, ...(r.checked === 0 ? { couldNotTell: "no in-scope document found" } : {}) });
    } catch (e) {
      results.push({ id: v.id, asks: v.asks, checked: 0, outOfScope: 0, findings: [], couldNotTell: (e as Error).message });
    }
  }
  const exit = results.some((r) => r.couldNotTell) ? 2 : results.some((r) => r.findings.length > 0) ? 1 : 0;
  return { results, exit };
}

/** The markdown the alert carries — what failed, where, and how to reproduce. */
export function reportMarkdown(dir: string, results: readonly VerifierResult[]): string {
  const lines = [`Verified \`${dir}\` before deployment:`, ""];
  for (const r of results) {
    const state = r.couldNotTell ? `could not tell — ${r.couldNotTell}` : r.findings.length ? `${r.findings.length} finding(s)` : "pass";
    lines.push(`- **${r.id}**: ${state} — ${r.checked} document(s) checked, ${r.outOfScope} out of scope (not ours)`);
    for (const f of r.findings.slice(0, 20)) lines.push(`  - \`${f.file}\`: ${f.detail}`);
    if (r.findings.length > 20) lines.push(`  - …and ${r.findings.length - 20} more`);
  }
  lines.push("", "Reproduce: `bun run publish:verify -- --dir <built site>`.");
  return lines.join("\n");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const arg = (f: string) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : undefined);
  const dir = resolve(arg("--dir") ?? "_site");
  const { results, exit } = await verify(dir);
  const md = reportMarkdown(relative(process.cwd(), dir) || ".", results);
  console.log(md);
  const report = arg("--report");
  if (report) writeFileSync(report, `${md}\n`);
  process.exit(exit);
}
