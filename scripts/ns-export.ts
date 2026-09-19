/**
 * The folio namespace, as a document that dereferences.
 *
 * `FOLIO_NS` is `https://litlfred.github.io/folio-assistant/ns#` and every
 * class and property the graph projects hangs off it. **Nothing served that
 * stem.** `scripts/tests/kg-export.test.ts` exempted it from the dead-link
 * walk BY NAME — "an IRI stem, not a file — nothing serves it and nothing
 * should try to" — which was right while a term only had to be an IDENTIFIER
 * and stopped being right when the terms had to be DEFINED.
 *
 * ## This is documentation, and can be used as a conformance test
 *
 * The owner's correction, 2026-09-19, and the order matters. The primary job
 * is the graph documenting itself: a consumer holding only the JSON-LD can
 * resolve any term it meets. That the same document also lets CI assert every
 * minted term is defined is a second use of one artefact, not its purpose.
 *
 * ## One node per term
 *
 * Not one node whose `description` carries the vocabulary. A term is a thing
 * the graph has an opinion about, so it gets an `@id`, a type, a label and a
 * definition — which is what makes `folio:Actor` resolvable rather than merely
 * mentioned.
 *
 * ## Where each definition comes from, and why not from here
 *
 * Graph kinds are read from `BASE_GRAPH_KINDS`, which already carries a
 * `summary` for each. Restating them in `schemas/vocabulary.ts` would be a
 * second answer to one question, free to disagree — the drift this repository
 * keeps paying for. Everything else is glossed in `vocabulary.ts`. A term
 * defined in both is an error, not a preference.
 *
 * Usage:  bun run scripts/ns-export.ts [--out FILE] [--check]
 *
 * `--check` writes nothing and exits non-zero if any minted term has no
 * definition, naming each one.
 *
 * @module scripts/ns-export
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { BASE_GRAPH_KINDS } from "../schemas/cat-harness.js";
import { FOLIO_NS } from "../schemas/namespaces.js";
import { CLASS_GLOSSES, PROPERTY_GLOSSES, type TermGloss, type TermLayer } from "../schemas/vocabulary.js";

const ROOT = resolve(import.meta.dir, "..");
const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const OWL = "http://www.w3.org/2002/07/owl#";

/** The namespace with its trailing `#` removed — the DOCUMENT, not the stem. */
export function vocabularyIri(): string {
  return FOLIO_NS.replace(/#$/, "");
}

/**
 * Every term the CODE can mint, found by scanning rather than by listing.
 *
 * A list somebody has to remember to extend is not a single answer; it is a
 * copy that happens to match today — the lesson `known-skills.ts` records at
 * length. So this reads the source.
 *
 * **It is not complete on its own, and says so.** `kg-export.ts:712` mints
 * `` `${FOLIO_NS}${type}` `` from a registry group name, so `Actor` and
 * `Capability` appear in the exported graph and in NO literal anywhere. The
 * caller unions this with the terms a real export emits; neither source alone
 * is sound, and pretending either is would put a term on the "defined"
 * side of a check it never reached.
 */
export function mintedTermsFromSource(root = ROOT): Set<string> {
  const out = new Set<string>();
  const pat = /\$\{FOLIO_NS\}([A-Za-z][A-Za-z0-9_]*)/g;
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) {
        for (const m of readFileSync(p, "utf-8").matchAll(pat)) out.add(m[1]!);
      }
    }
  };
  walk(root);
  return out;
}

/**
 * Which layer each declared graph kind belongs to.
 *
 * Keyed by the DECLARATION's kind name, not the class name, because that is
 * what `BASE_GRAPH_KINDS` is keyed by and translating between the two in a
 * second place is how they drift.
 *
 * A kind absent from this map is `harness` — the middle. That default is
 * deliberate and is the safe direction: a term wrongly called harness is
 * merely carried by an instance that did not need it, while a term wrongly
 * called bootstrap makes the base layer depend on something above it, which
 * is the one thing the direction rule forbids.
 */
const GRAPH_KIND_LAYERS: Readonly<Record<string, TermLayer>> = {
  "cat-harness": "bootstrap",
  schemas: "bootstrap",
  // Everything the owner named as NOT bootstrap, plus the rest of the folio's
  // own furniture: "we shouldnt need voicegraph or librarygrph or
  // previewgrapjh in bootstrap!!"
  voices: "core",
  library: "core",
  uploads: "core",
  todos: "core",
  "todo-items": "core",
  "todo-feedback": "core",
};

/** The graph kinds' own summaries — read, never restated. */
export function graphKindTerms(): Map<string, TermGloss> {
  const out = new Map<string, TermGloss>();
  for (const [name, def] of Object.entries(BASE_GRAPH_KINDS)) {
    const local = def.type.startsWith(FOLIO_NS) ? def.type.slice(FOLIO_NS.length) : undefined;
    if (local && def.summary) out.set(local, { gloss: def.summary, layer: GRAPH_KIND_LAYERS[name] ?? "harness" });
  }
  return out;
}

export interface VocabularyReport {
  /** Terms with a definition, in document order. */
  readonly defined: string[];
  /** Minted in the source and defined nowhere — the finding `--check` fails on. */
  readonly undefinedTerms: string[];
  /** Defined here AND carrying a graph-kind summary: two answers to one question. */
  readonly doublyDefined: string[];
}

/** Assemble the vocabulary, and report what is missing rather than guessing. */
export function buildVocabulary(
  root = ROOT,
  /**
   * Emit only this layer and the ones BELOW it, or the whole vocabulary.
   *
   * "And below" rather than "only this": a harness consumer meets bootstrap's
   * terms constantly, so a harness slice that omitted them would document a
   * vocabulary nobody actually uses. Bootstrap's slice is the interesting one
   * and it is genuinely minimal — it is the bottom of the stack.
   */
  layer?: TermLayer,
): { doc: unknown; report: VocabularyReport } {
  const kinds = graphKindTerms();
  const doublyDefined = [...kinds.keys()].filter((t) => t in CLASS_GLOSSES || t in PROPERTY_GLOSSES).sort();

  const ORDER: readonly TermLayer[] = ["bootstrap", "harness", "core"];
  const cutoff = layer ? ORDER.indexOf(layer) : ORDER.length - 1;
  const inSlice = (g: TermGloss): boolean => ORDER.indexOf(g.layer ?? "harness") <= cutoff;

  const nodes: Record<string, unknown>[] = [];
  const defined = new Set<string>();
  const emit = (name: string, kind: "class" | "property", g: TermGloss): void => {
    if (!inSlice(g)) return;
    defined.add(name);
    nodes.push({
      "@id": `folio:${name}`,
      "@type": kind === "class" ? "rdfs:Class" : "rdf:Property",
      label: name,
      comment: g.gloss,
      isDefinedBy: vocabularyIri(),
      layer: g.layer ?? "harness",
      ...(g.seeAlso ? { seeAlso: new URL(g.seeAlso, `${vocabularyIri().replace(/\/ns$/, "/")}`).href } : {}),
    });
  };

  for (const [name, g] of Object.entries(CLASS_GLOSSES)) emit(name, "class", g);
  for (const [name, g] of [...kinds].sort(([a], [b]) => a.localeCompare(b))) emit(name, "class", g);
  for (const [name, g] of Object.entries(PROPERTY_GLOSSES)) emit(name, "property", g);

  // Only a FULL build can say a term is undefined. A bootstrap slice omits
  // core terms ON PURPOSE, and reporting those as missing would turn the
  // layering into a permanent wall of findings — the "check that cries wolf"
  // this repository switches off.
  const everything = new Set<string>([
    ...Object.keys(CLASS_GLOSSES),
    ...kinds.keys(),
    ...Object.keys(PROPERTY_GLOSSES),
  ]);
  const minted = mintedTermsFromSource(root);
  const undefinedTerms = layer === undefined ? [...minted].filter((t) => !everything.has(t)).sort() : [];

  const doc = {
    "@context": {
      rdf: RDF,
      rdfs: RDFS,
      owl: OWL,
      folio: FOLIO_NS,
      label: "rdfs:label",
      comment: "rdfs:comment",
      isDefinedBy: { "@id": "rdfs:isDefinedBy", "@type": "@id" },
      seeAlso: { "@id": "rdfs:seeAlso", "@type": "@id" },
    },
    "@id": vocabularyIri(),
    "@type": "owl:Ontology",
    label: layer ? `folio-assistant vocabulary (${layer} and below)` : "folio-assistant vocabulary",
    comment:
      "Every class and property the folio knowledge graph projects, one node each. " +
      "Generated by scripts/ns-export.ts; graph-kind definitions are read from the " +
      "declaration registry rather than restated here.",
    "@graph": nodes,
  };

  return { doc, report: { defined: [...defined], undefinedTerms, doublyDefined } };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const layerIdx = argv.indexOf("--layer");
  const layer = layerIdx >= 0 ? (argv[layerIdx + 1] as TermLayer) : undefined;
  if (layer !== undefined && !["bootstrap", "harness", "core"].includes(layer)) {
    console.error(`--layer must be bootstrap, harness or core (got ${String(layer)})`);
    process.exit(2);
  }
  const outIdx = argv.indexOf("--out");
  const out = outIdx >= 0 ? argv[outIdx + 1] : join(ROOT, layer ? `_kg/ns-${layer}.jsonld` : "_kg/ns.jsonld");

  const { doc, report } = buildVocabulary(ROOT, layer);

  for (const t of report.doublyDefined) {
    console.error(`  DOUBLY DEFINED: ${t} — glossed in vocabulary.ts AND summarised in the graph-kind registry.`);
  }
  if (report.undefinedTerms.length > 0) {
    console.error(`\n${report.undefinedTerms.length} minted term(s) have no definition:`);
    for (const t of report.undefinedTerms) console.error(`  · ${t}`);
  }

  if (check) {
    const bad = report.undefinedTerms.length + report.doublyDefined.length;
    if (bad === 0) console.log(`ns vocabulary is complete — ${report.defined.length} term(s) defined`);
    process.exit(bad === 0 ? 0 : 1);
  }

  mkdirSync(dirname(out!), { recursive: true });
  writeFileSync(out!, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`ns vocabulary → ${out}`);
  console.log(`  @id  ${vocabularyIri()}`);
  console.log(`  ${report.defined.length} term(s) defined, ${report.undefinedTerms.length} undefined`);
  if (!existsSync(out!)) process.exit(2);
}
