#!/usr/bin/env bun
/**
 * Every prefix the published `@context` binds, counted against what emits it.
 *
 * @module scripts/check-context-emission
 *
 * ## The defect, and why nothing broke
 *
 * `skos:` was bound in `CONTENT_CONTEXT` from the day that context was
 * written, and emitted by **zero** nodes. `schemas/tabular-csvw.ts` says in
 * prose that this graph *"already speaks eight published vocabularies — doco,
 * deo, cito, oa, prov, skos, dcterms, fhir"*. A consumer that dereferences the
 * context is told to expect terms it will never meet.
 *
 * Nothing broke, which is exactly why it survived for months. This is `ovkk`
 * pointed the other way: there a term was USED and not DECLARED, and a JSON-LD
 * processor silently DROPPED it — 34 names, 3583 occurrences. Here a term is
 * DECLARED and never used, and a processor does nothing at all. One direction
 * loses data loudly enough to be found; the other loses only truth.
 *
 * ## It counts EMISSIONS, not source occurrences — and the difference reversed a finding
 *
 * The first measurement of this scanned `.ts` source for `prefix:` literals
 * and reported **`doco:` 1112**. Measured against the 1086 published
 * `.jsonld` documents instead, `doco` emits **zero**. Both numbers are
 * right about different things: the 1112 are `BLOCK_KIND_TO_DOCO_TYPE`'s
 * entries in `jsonld.ts`, which fire only when a *block* is exported, and this
 * repository is the platform — it holds no folio, so no block is ever
 * exported here.
 *
 * A vocabulary is spoken when a DOCUMENT says it, never when a mapping table
 * mentions it. So the corpus is the documents.
 *
 * ## Two ways a prefix is spoken, and missing either one invents a finding
 *
 * 1. a literal CURIE — `"@type": "doco:Section"`, or a key `"skos:notation"`;
 * 2. a **term alias** — `title` is bound to `dcterms:title`, so every node
 *    carrying `title` emits `dcterms:` once expanded, with no `dcterms:`
 *    anywhere in the file.
 *
 * A scan for the prefix alone sees only the first and would report `dcterms`
 * as dead while 1551 nodes speak it.
 *
 * ## The third state: a forward declaration is allowed, a SILENT one is not
 *
 * Most of the unemitted prefixes here are not defects. This repository is the
 * platform; the content vocabularies describe what a FOLIO holds, and binding
 * them ahead of any folio is deliberate. What is not acceptable is leaving
 * that indistinguishable from an oversight — which is the whole shape of the
 * bug. So a forward declaration is declared, with a reason naming what would
 * emit it, in {@link FORWARD_DECLARED}. Reason required, same discipline as
 * `command-path-ok:` and `<folio:no-skill reason="…"/>`: silencing the check
 * costs more than satisfying it, and the exempted set is REPORTED rather than
 * disappearing.
 *
 * Usage:
 *   bun run cat-harness/scripts/check-context-emission.ts
 *   bun run cat-harness/scripts/check-context-emission.ts --json
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { CONTENT_CONTEXT } from "../schemas/jsonld.js";

const REPO = resolve(import.meta.dir, "..", "..");

/**
 * Prefixes bound ahead of anything that emits them, each with the reason.
 *
 * **A reason is the point.** An unemitted prefix with an entry here is a
 * decision somebody recorded; one without is a question nobody asked. The
 * check reports both, and fails only on the second.
 *
 * Every entry names WHAT WOULD EMIT IT, because that is the fact a later
 * reader needs: it turns "is this still deliberate?" into a question with an
 * answer rather than an archaeology exercise.
 */
export const FORWARD_DECLARED: Readonly<Record<string, string>> = {
  doco: "document STRUCTURE — a paper's chapters, sections and figures, via BLOCK_KIND_TO_DOCO_TYPE. This instance is the platform and holds no folio, so no block is exported here. A folio emits it on its first `gen-block-jsonld` run.",
  deo: "discourse ELEMENTS — `deo:Introduction`, `deo:Conclusion` and the rest, on a paper's rhetorical blocks. Bound with `doco` as its companion vocabulary and waiting on the same thing: a folio with blocks.",
  oa: "Web Annotation — the shape a todo, a review note or a translation comment takes when it is published as an annotation on a block. `bzyu` and the todo-review workflow are where it lands.",
  csvw: "tabular records. `tabular-csvw.ts` models table -> column -> datatype, and `csvwOnly()` emits CSVW-NATIVE KEYS that resolve through this context rather than `csvw:`-prefixed values — so this prefix may be spoken by alias already, and the count below says only that no literal CURIE carries it.",
  skos: "the glossary — `lqo9` slice 1 shipped 135 `skos:Concept` nodes, but into the NAMESPACE document (`ns-export.ts`), which carries its own context rather than this one. A folio's glossary blocks are what emit it HERE.",
  // NO `fhir` ENTRY, and its removal is the check doing its job.
  //
  // It was forward-declared on the reason "emitted by an IG folio's export,
  // never by the platform" — true when written, and false since this
  // repository took in two FHIR artefact indexes (`smart-trust`,
  // `smart-immunizations`). The check reported `fhir is declared forward but
  // emits 1570 — remove its FORWARD_DECLARED entry` as a warning, and the
  // warning was right: a forward declaration is a promise about the FUTURE,
  // so one whose future has arrived is no longer a reason, it is a stale
  // excuse sitting in front of a fact.
  //
  // That is the direction this file exists to catch in BOTH senses. A bound
  // prefix nothing emits is a claim the graph does not keep; a forward
  // declaration for a prefix that now emits is the same defect running the
  // other way, and it is the quieter one, because nothing breaks.
  fac: "folio-assistant-core's own namespace. Core's terms describe CONTENT objects, and this instance holds none — the same reason `doco` and `deo` are here, one layer in.",
};

/** Every `.jsonld` document in the tree, excluding build outputs. */
export function contentDocuments(repo = REPO): string[] {
  const out: string[] = [];
  const skip = new Set(["node_modules", "_kg", "_site", "_docs", ".git"]);
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || skip.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".jsonld")) out.push(p);
    }
  };
  walk(repo);
  return out;
}

const curiePrefix = (s: string): string | undefined => {
  // An absolute IRI is not a CURIE, and `https:` would otherwise read as one.
  if (/^https?:\/\//.test(s)) return undefined;
  return /^([A-Za-z][\w-]*):/.exec(s)?.[1];
};

/** The bound prefixes, and which terms expand into each. */
export function prefixesOf(context: Record<string, unknown>): {
  bound: string[];
  aliasPrefix: Map<string, string>;
} {
  const bound: string[] = [];
  const aliasPrefix = new Map<string, string>();
  for (const [k, v] of Object.entries(context)) {
    if (k.startsWith("@")) continue;
    const s = typeof v === "string" ? v : (v as { "@id"?: unknown } | null)?.["@id"];
    if (typeof s !== "string") continue;
    if (/^https?:\/\//.test(s)) {
      bound.push(k);
      continue;
    }
    const p = curiePrefix(s);
    if (p) aliasPrefix.set(k, p);
  }
  return { bound, aliasPrefix };
}

export interface EmissionReport {
  /** How many documents were read. Zero is a FINDING, never a clean run. */
  readonly documents: number;
  /** Emission count per bound prefix. */
  readonly counts: Record<string, number>;
  /** Unemitted AND declared as forward, with the reason. */
  readonly forward: { prefix: string; reason: string }[];
  /** Unemitted and undeclared — the finding. */
  readonly silent: string[];
  /** Declared forward but ACTUALLY emitted: the exemption has expired. */
  readonly staleForward: { prefix: string; count: number }[];
}

export function checkContextEmission(repo = REPO, context = CONTENT_CONTEXT as Record<string, unknown>): EmissionReport {
  const { bound, aliasPrefix } = prefixesOf(context);
  const counts = new Map<string, number>(bound.map((p) => [p, 0]));
  const bump = (p: string | undefined): void => {
    if (p && counts.has(p)) counts.set(p, counts.get(p)! + 1);
  };

  const walk = (o: unknown): void => {
    if (Array.isArray(o)) return void o.forEach(walk);
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      bump(aliasPrefix.get(k)); // spoken through a term alias
      bump(curiePrefix(k)); // ...or as a literal CURIE key
      if (typeof v === "string") bump(curiePrefix(v));
      walk(v);
    }
  };

  const docs = contentDocuments(repo);
  for (const f of docs) {
    try {
      walk(JSON.parse(readFileSync(f, "utf-8")));
    } catch {
      // A document that does not parse is a finding, but not THIS check's:
      // `kg:schema:check` owns malformed JSON-LD. Counting it here would
      // report one defect as two.
    }
  }

  const zero = bound.filter((p) => counts.get(p) === 0);
  return {
    documents: docs.length,
    counts: Object.fromEntries(counts),
    forward: zero.filter((p) => FORWARD_DECLARED[p]).map((p) => ({ prefix: p, reason: FORWARD_DECLARED[p]! })),
    silent: zero.filter((p) => !FORWARD_DECLARED[p]).sort(),
    staleForward: Object.keys(FORWARD_DECLARED)
      .filter((p) => (counts.get(p) ?? 0) > 0)
      .map((p) => ({ prefix: p, count: counts.get(p)! })),
  };
}

if (import.meta.main) {
  const r = checkContextEmission();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.silent.length > 0 || r.documents === 0 ? 1 : 0);
  }

  console.log(`Context emission — ${Object.keys(r.counts).length} bound prefix(es) over ${r.documents} document(s)`);
  for (const [p, n] of Object.entries(r.counts).sort((a, b) => b[1] - a[1])) {
    if (n > 0) console.log(`  ✓ ${p.padEnd(9)} ${n}`);
  }
  for (const f of r.forward) console.log(`  → ${f.prefix.padEnd(9)} forward-declared: ${f.reason.slice(0, 96)}…`);

  // ZERO DOCUMENTS IS A FINDING. Every count above is computed from the
  // corpus, and a corpus of nothing makes each of them zero — which would
  // report every prefix as unemitted, or, if they were all forward-declared,
  // as a clean run over nothing. That is `6tkl`, and it is the one failure
  // this check cannot be allowed to have.
  if (r.documents === 0) {
    console.error("\n::error::check-context-emission: no .jsonld documents found — every count below is vacuous");
    process.exit(1);
  }
  for (const s of r.staleForward) {
    // Not fatal: being emitted is the outcome the forward declaration was
    // waiting for. But leaving the entry would let a LATER silence hide behind
    // a reason that has already come true.
    console.warn(`  ::warning::\`${s.prefix}\` is declared forward but emits ${s.count} — remove its FORWARD_DECLARED entry`);
  }
  if (r.silent.length > 0) {
    console.error(`\n${r.silent.length} prefix(es) are bound in the published @context and emitted by nothing:`);
    for (const p of r.silent) console.error(`  ✗ ${p}`);
    console.error("\nA consumer that dereferences the context is told to expect terms it will never meet.");
    console.error("Either emit it, remove the binding, or record a reason in FORWARD_DECLARED.");
    process.exit(1);
  }
  console.log(`\n✓ every bound prefix is emitted or declared forward with a reason`);
}
