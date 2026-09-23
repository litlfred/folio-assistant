#!/usr/bin/env bun
/**
 * Every prefix the published `@context` binds, counted against what emits it —
 * and, since bean `zaqn`, every prefix a document SPEAKS checked against what
 * binds it, with our own namespaces spelt as their instance stubs.
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
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { CONTENT_CONTEXT, CONTENT_CONTEXT_URL } from "../schemas/jsonld.js";
import { stubOfNamespace } from "../schemas/namespaces.js";

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
  //
  // NO `fac` ENTRY either, and its removal is the bean-`zaqn` finding. It was
  // forward-declared as "Core's terms describe CONTENT objects, and this
  // instance holds none" — while 1,737 committed documents were emitting
  // core's terms under `folio:`, a prefix this context never bound. The
  // emission count could not see them, because it counts BOUND prefixes; a
  // prefix that is spoken and never bound is the other half of the question,
  // which {@link checkPrefixDeclaration} now asks. The binding is spelt
  // `folio-assistant-core` since that bean — the instance's stub.
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

// ── The other direction: a prefix that is SPOKEN must be BOUND ──────────
//
// Bean `zaqn`. Everything above asks "is each bound prefix spoken?". Nothing
// asked the converse, and the converse is the one that corrupts data: an
// unbound prefix is not an error to a JSON-LD processor. `folio:Definition`
// with no `folio` binding is read as an absolute IRI in a URI SCHEME called
// `folio` — well-formed, meaningless, and joined with nothing. The published
// content context did exactly that to twenty terms, across 1,737 committed
// documents, with every gate green: the drift check compares the generated
// copy with its source, and both were wrong the same way.

/** Schemes an absolute IRI may legitimately carry — never read as a prefix. */
export const IRI_SCHEMES: ReadonlySet<string> = new Set(["http", "https", "urn", "mailto", "data", "file", "tag"]);

/** Our own namespaces live under this stem; a binding onto one must be spelt as its stub. */
export const OWN_NS_STEM = "https://litlfred.github.io/folio-assistant/";

export interface PrefixFinding {
  readonly prefix: string;
  readonly count: number;
  /** The first document (repo-relative) or `@context` it was met in. */
  readonly example: string;
}

export interface PrefixDeclarationReport {
  /** Documents whose context could be resolved and was checked. */
  readonly documents: number;
  /**
   * Documents naming a context by a URL this check cannot resolve — the third
   * state. Reported and counted, never treated as clean: they were not read.
   */
  readonly unresolved: { count: number; urls: string[] };
  /** Spoken as a key or an `@type`, bound nowhere in scope — the finding. */
  readonly undeclared: PrefixFinding[];
  /**
   * A binding onto one of our own `…/<stub>/ns#` namespaces spelt as anything
   * but `<stub>`, or naming a stub no instance declares. Owner, 2026-09-23:
   * "prefix -> match stub".
   */
  readonly misspelt: { prefix: string; namespace: string; stub: string; where: string }[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * The stubs this repository's instances declare: `<dir>/<dir>.json` one level
 * down, carrying `name` and optionally `stub`. The same convention
 * `findDeclarationFile` matches on — a file agreeing with ITSELF.
 */
export function declaredStubs(repo = REPO): Set<string> {
  const out = new Set<string>();
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    const f = join(repo, e.name, `${e.name}.json`);
    if (!existsSync(f)) continue;
    try {
      const d = JSON.parse(readFileSync(f, "utf-8")) as { name?: unknown; stub?: unknown };
      if (d.name === e.name) out.add(typeof d.stub === "string" ? d.stub : e.name);
    } catch {
      // A declaration that does not parse is `check:declared-paths`'s finding.
    }
  }
  return out;
}

/**
 * Check both halves over the corpus and over the published context itself.
 *
 * Only KEYS and `@type` VALUES are read as CURIEs. A plain string value may
 * legitimately look like one — `label: "def:foo"` is an authored label, not an
 * IRI, which is the hazard `schemas/jsonld.ts` opens with — so reading values
 * would invent findings, and a check that cries wolf is switched off.
 */
export function checkPrefixDeclaration(
  repo = REPO,
  context = CONTENT_CONTEXT as Record<string, unknown>,
  contextUrl = CONTENT_CONTEXT_URL,
  stubs: ReadonlySet<string> = declaredStubs(REPO),
): PrefixDeclarationReport {
  const undeclared = new Map<string, { count: number; example: string }>();
  const misspelt: PrefixDeclarationReport["misspelt"] = [];
  // One binding may be read more than once (a context repeated in nested
  // nodes); one defect is reported once.
  const seenMisspelt = new Set<string>();
  const unresolvedUrls = new Set<string>();
  let unresolvedCount = 0;
  let documents = 0;

  const note = (p: string, where: string): void => {
    const e = undeclared.get(p);
    if (e) e.count++;
    else undeclared.set(p, { count: 1, example: where });
  };

  const unbound = (s: string, scope: ReadonlySet<string>): string | undefined => {
    if (s.startsWith("@") || s.startsWith("_:")) return undefined;
    const m = /^([A-Za-z][\w.-]*):(?!\/\/)/.exec(s);
    if (!m) return undefined;
    const p = m[1]!;
    return IRI_SCHEMES.has(p.toLowerCase()) || scope.has(p) ? undefined : p;
  };

  // A context's own definitions: every term is in scope as a prefix, every
  // compact target must be bound, and our namespaces must be spelt as stubs.
  const checkContext = (ctx: Record<string, unknown>, where: string, scope: ReadonlySet<string>): void => {
    for (const [k, v] of Object.entries(ctx)) {
      if (k.startsWith("@")) continue;
      const target = typeof v === "string" ? v : isRecord(v) && typeof v["@id"] === "string" ? v["@id"] : undefined;
      if (target === undefined) continue;
      if (target.startsWith(OWN_NS_STEM)) {
        const stub = stubOfNamespace(target);
        const key = `${where}\u0000${k}`;
        if (stub && (k !== stub || !stubs.has(stub)) && !seenMisspelt.has(key)) {
          seenMisspelt.add(key);
          misspelt.push({ prefix: k, namespace: target, stub, where });
        }
        continue;
      }
      const p = unbound(target, scope);
      if (p) note(p, `${where} (term \`${k}\`)`);
    }
  };

  /** Merge a `@context` value into scope; `false` if part of it is unreadable. */
  const extend = (c: unknown, scope: Set<string>, where: string, check = true): boolean => {
    if (Array.isArray(c)) return c.map((x) => extend(x, scope, where, check)).every(Boolean);
    if (typeof c === "string") {
      if (c !== contextUrl) {
        unresolvedUrls.add(c);
        return false;
      }
      for (const k of Object.keys(context)) if (!k.startsWith("@")) scope.add(k);
      return true;
    }
    if (isRecord(c)) {
      for (const k of Object.keys(c)) if (!k.startsWith("@")) scope.add(k);
      if (check) checkContext(c, where, scope);
    }
    return true;
  };

  const walk = (o: unknown, scope: Set<string>, where: string): void => {
    if (Array.isArray(o)) return void o.forEach((x) => walk(x, scope, where));
    if (!isRecord(o)) return;
    let s = scope;
    if ("@context" in o) {
      s = new Set(scope);
      extend(o["@context"], s, where);
    }
    for (const [k, v] of Object.entries(o)) {
      if (k === "@context") continue;
      if (!s.has(k)) {
        const p = unbound(k, s);
        if (p) note(p, where);
      }
      if (k === "@type" || k === "type") {
        for (const t of Array.isArray(v) ? v : [v]) {
          if (typeof t !== "string" || s.has(t)) continue;
          const p = unbound(t, s);
          if (p) note(p, where);
        }
      }
      walk(v, s, where);
    }
  };

  // The published context first: it is where bean `zaqn` started, and it is
  // checked whether or not any document happens to use the broken term.
  const own = new Set(Object.keys(context).filter((k) => !k.startsWith("@")));
  checkContext(context, contextUrl, own);

  for (const f of contentDocuments(repo)) {
    let doc: unknown;
    try {
      doc = JSON.parse(readFileSync(f, "utf-8"));
    } catch {
      continue; // `kg:schema:check` owns malformed JSON-LD — see above.
    }
    const rel = f.startsWith(repo) ? f.slice(repo.length + 1) : f;
    const top = isRecord(doc) ? doc["@context"] : undefined;
    const probe = new Set<string>();
    // A PROBE — does the context resolve? — so it reports nothing; the walk
    // below reads the same context again and is where findings come from.
    if (top !== undefined && !extend(top, probe, rel, false)) {
      unresolvedCount++;
      continue;
    }
    documents++;
    walk(doc, new Set(), rel);
  }

  return {
    documents,
    unresolved: { count: unresolvedCount, urls: [...unresolvedUrls].sort() },
    undeclared: [...undeclared].map(([prefix, e]) => ({ prefix, ...e })).sort((a, b) => b.count - a.count),
    misspelt,
  };
}

/** Print the spoken-but-unbound half; return whether it failed. */
function reportDeclaration(d: PrefixDeclarationReport): boolean {
  console.log(`\nPrefix declaration — ${d.documents} document(s) read, ${d.unresolved.count} with a context this check cannot resolve`);
  for (const u of d.unresolved.urls) console.warn(`  ? could not determine: ${u}`);
  let failed = false;
  if (d.undeclared.length > 0) {
    failed = true;
    console.error(`\n${d.undeclared.length} prefix(es) are SPOKEN and bound nowhere in scope:`);
    for (const u of d.undeclared) console.error(`  ✗ ${u.prefix}:  ×${u.count}  e.g. ${u.example}`);
    console.error("\nA JSON-LD processor reads an unbound prefix as a URI SCHEME: `folio:Definition` becomes an IRI that means nothing.");
    console.error("Bind the prefix in the context, or write the term with its bound prefix.");
  }
  if (d.misspelt.length > 0) {
    failed = true;
    console.error(`\n${d.misspelt.length} binding(s) onto our own namespaces are not spelt as the instance's stub:`);
    for (const m of d.misspelt) console.error(`  ✗ ${m.prefix} → ${m.namespace}  (want \`${m.stub}\`, a declared stub) in ${m.where}`);
  }
  if (d.documents === 0) {
    failed = true;
    console.error("\n::error::prefix declaration: no document could be read — a clean run over nothing is not clean");
  }
  if (!failed) console.log("✓ every spoken prefix is bound, and every own-namespace prefix is its stub");
  return failed;
}

if (import.meta.main) {
  const r = checkContextEmission();
  const d = checkPrefixDeclaration();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ emission: r, declaration: d }, null, 2));
    const declFailed = d.undeclared.length > 0 || d.misspelt.length > 0 || d.documents === 0;
    process.exit(r.silent.length > 0 || r.documents === 0 || declFailed ? 1 : 0);
  }
  if (reportDeclaration(d)) process.exitCode = 1;

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
