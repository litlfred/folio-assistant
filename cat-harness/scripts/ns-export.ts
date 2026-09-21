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
 * Usage:  bun run cat-harness/scripts/ns-export.ts [--out FILE] [--check]
 *
 * `--check` writes nothing and exits non-zero if any minted term has no
 * definition, naming each one.
 *
 * @module scripts/ns-export
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { BASE_GRAPH_KINDS, repoRootFor } from "../schemas/cat-harness.js";
import { LEGACY_FOLIO_NS, NS_PREFIXES, namespaceForLayer, prefixForLayer } from "../schemas/namespaces.js";
import { REGISTRY_GROUPS } from "../schemas/kg-node.js";
import {
  CLASS_GLOSSES,
  PROPERTY_GLOSSES,
  TERM_LAYERS,
  type TermGloss,
  type TermLayer,
} from "../schemas/vocabulary.js";

const ROOT = resolve(import.meta.dir, "..");
const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const OWL = "http://www.w3.org/2002/07/owl#";
// DECLARED HERE RATHER THAN IMPORTED, and the duplicate is CHECKED.
//
// `schemas/jsonld.ts` also declares these two, but it is `folio-assist-core`
// and this module is `agentic-harness` — core depends on the harness, so the
// import would be a wrong-direction edge and `check:partition` refuses it.
// That is the rule working: the constant a harness module needs must not be
// reached for across a boundary just because it happens to exist there.
//
// So they sit beside RDFS/RDF/OWL above, which are local for the same reason,
// and `ns-export-skos.test.ts` asserts each equals its `jsonld.ts` twin — a
// test may cross the boundary where source may not. An unavoidable duplicate
// is fine; an UNCHECKED one is the drift this repository keeps paying for.
const SKOS = "http://www.w3.org/2004/02/skos/core#";
const DCTERMS = "http://purl.org/dc/terms/";

/** The namespace with its trailing `#` removed — the DOCUMENT, not the stem. */
export function vocabularyIri(): string {
  // `<base>/ns/vocabulary.jsonld`, NOT `<base>/ns`.
  //
  // `schemas/jsonld.ts` publishes the content `@context` at
  // `<base>/ns/content/v1.jsonld`, so `<base>/ns` has to be a DIRECTORY. A
  // static host cannot serve a file and a directory at one path, and the
  // first version of this exporter wrote the union document straight to
  // `<base>/ns` — which would have made the content context unreachable the
  // day it deployed.
  //
  // Nothing is lost by moving: no term hangs off this document. Every term
  // lives in its layer's namespace (`bootstrap/ns`, `cat-harness/ns`,
  // `folio-assistant-core/ns`), each of which IS a file and dereferences. The
  // union is a convenience for a person reading the whole vocabulary at once,
  // so it can sit anywhere that resolves.
  return `${LEGACY_FOLIO_NS.replace(/ns#$/, "")}ns/vocabulary.jsonld`;
}

/**
 * The `skos:ConceptScheme` a layer's terms belong to — and it is the layer's
 * OWN namespace document, not a fourth IRI invented to hold them.
 *
 * `--layer <l> --exact` already publishes exactly that layer's terms under
 * exactly that IRI, which is the definition of a concept scheme: a set of
 * concepts with a boundary somebody is willing to state. Minting a separate
 * `…#scheme` would be a second name for a set that already has one, and it
 * would not dereference — the defect `blv9` records and the whole reason this
 * module exists.
 *
 * So in `--exact` mode the document node IS the scheme and gains the type
 * rather than a duplicate `@id` appearing in its own `@graph`.
 */
function conceptSchemeIri(layer: TermLayer): string {
  return namespaceForLayer(layer).replace(/#$/, "");
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
  // `termIri("Name")` is the ONE minting form since the namespaces split —
  // 94 hand-written template literals became this single call, which is also
  // what makes the scan a scan for one pattern rather than for four.
  const pat = /\btermIri\(\s*"([A-Za-z][A-Za-z0-9_]*)"\s*\)/g;
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) {
        // COMMENTS ARE STRIPPED FIRST, and this is not fussiness: the first
        // version scanned raw source and reported `Name` as an undefined
        // term, matched from THIS function's own comment describing the
        // pattern it looks for. A scanner that reads its own documentation as
        // data will do it again the next time somebody writes an example, and
        // a phantom term in a completeness check is worse than none — it is a
        // finding nobody can act on.
        const src = readFileSync(p, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
        for (const m of src.matchAll(pat)) out.add(m[1]!);
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
    const local = def.type.includes("#") ? def.type.split("#")[1] : undefined;
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
  /**
   * EXACTLY this layer, rather than it and everything below.
   *
   * The two modes answer different questions and conflating them would publish
   * a lie. `--layer harness` is what a HARNESS CONSUMER wants: it meets
   * bootstrap's terms constantly, so the document includes them. A NAMESPACE
   * document is what `cat:Harness` dereferences to, and it must contain only
   * `cat:` terms — a `cat-harness/ns` that also defined `bs:Actor` would be
   * asserting ownership of a term in somebody else's namespace.
   */
  exact = false,
): { doc: unknown; report: VocabularyReport } {
  const kinds = graphKindTerms();
  const doublyDefined = [...kinds.keys()].filter((t) => t in CLASS_GLOSSES || t in PROPERTY_GLOSSES).sort();

  // The declared order, not a local one. `TERM_LAYERS` states that its order
  // IS the direction rule, which is exactly what these index comparisons read.
  const ORDER: readonly TermLayer[] = TERM_LAYERS;
  const cutoff = layer ? ORDER.indexOf(layer) : ORDER.length - 1;
  const inSlice = (g: TermGloss): boolean => {
    const i = ORDER.indexOf(g.layer ?? "harness");
    return exact ? i === cutoff : i <= cutoff;
  };

  const nodes: Record<string, unknown>[] = [];
  const defined = new Set<string>();
  const emit = (name: string, kind: "class" | "property", g: TermGloss): void => {
    if (!inSlice(g)) return;
    defined.add(name);
    const l = g.layer ?? "harness";
    nodes.push({
      "@id": `${prefixForLayer(l)}:${name}`,
      // TWO types on purpose, and the tension is named rather than hidden.
      //
      // A term here is both a thing the graph has instances OF (`rdfs:Class`)
      // and a unit of meaning a reader looks UP (`skos:Concept`). That is
      // punning, sound in RDFS and OWL-Full and what published vocabularies do,
      // but NOT sound under an OWL-DL reasoner. Nothing here runs one; if
      // something ever does, this is the line to revisit — splitting the
      // concept onto its own node linked by `foaf:focus` is the usual repair.
      "@type": [kind === "class" ? "rdfs:Class" : "rdf:Property", "skos:Concept"],
      label: name,
      comment: g.gloss,
      // The SKOS half. `prefLabel`/`definition` restate `label`/`comment`
      // rather than replacing them, because a consumer arriving by either
      // vocabulary must find the term — and `skos:prefLabel` is a declared
      // sub-property of `rdfs:label`, so the two agreeing is the spec's own
      // expectation rather than a duplication this file invented.
      prefLabel: name,
      definition: g.gloss,
      // THE CODE the owner asked for, and it is not a new field to author:
      // the prefixed name IS the notation, unique across the vocabulary
      // because the prefix carries the layer. A `notation` somebody has to
      // type is a `notation` that goes missing; this one cannot.
      notation: `${prefixForLayer(l)}:${name}`,
      inScheme: conceptSchemeIri(l),
      isDefinedBy: vocabularyIri(),
      layer: l,
      ...(g.seeAlso ? { seeAlso: new URL(g.seeAlso, `${vocabularyIri().replace(/\/ns$/, "/")}`).href } : {}),
    });
  };

  for (const [name, g] of Object.entries(CLASS_GLOSSES)) emit(name, "class", g);
  for (const [name, g] of [...kinds].sort(([a], [b]) => a.localeCompare(b))) emit(name, "class", g);
  for (const [name, g] of Object.entries(PROPERTY_GLOSSES)) emit(name, "property", g);

  // The schemes, derived from what was ACTUALLY emitted rather than from the
  // three layers that exist. A scheme with no concepts is `dh4f` in miniature:
  // a consumer follows `inScheme`, finds an empty set, and reports a clean
  // run over nothing. `--layer bootstrap` legitimately emits one scheme.
  const docIri = exact && layer ? conceptSchemeIri(layer) : vocabularyIri();
  const schemeLayers = [...new Set(nodes.map((n) => n.layer as TermLayer))].sort(
    (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b),
  );
  const schemeNodes = schemeLayers
    // In `--exact` mode the DOCUMENT is the scheme, so it gains the type below
    // instead of appearing a second time inside its own `@graph`.
    .filter((l) => conceptSchemeIri(l) !== docIri)
    .map((l) => ({
      "@id": conceptSchemeIri(l),
      "@type": "skos:ConceptScheme",
      prefLabel: `folio-assistant ${l} vocabulary`,
      title: `folio-assistant ${l} vocabulary`,
      definition: `Every class and property the ${l} layer mints, one concept each.`,
    }));
  nodes.push(...schemeNodes);

  // Only a FULL build can say a term is undefined. A bootstrap slice omits
  // core terms ON PURPOSE, and reporting those as missing would turn the
  // layering into a permanent wall of findings — the "check that cries wolf"
  // this repository switches off.
  const everything = new Set<string>([
    ...Object.keys(CLASS_GLOSSES),
    ...kinds.keys(),
    ...Object.keys(PROPERTY_GLOSSES),
  ]);
  // THE UNION THIS FILE HAS DOCUMENTED SINCE IT WAS WRITTEN, now performed.
  //
  // `mintedTermsFromSource` scans for `termIri("Name")` literals, and says in
  // its own doc comment that it "is not complete on its own" because
  // `kg-export` mints `` `${FOLIO_NS}${type}` `` from a registry group name —
  // so those classes appear in the exported graph and in NO literal anywhere.
  // It names `Actor` and `Capability` as the cases. Both happened to be
  // defined, so the gap never showed, and the caller was written to filter the
  // scan ALONE. A promise kept only in prose is not kept.
  //
  // Bean `3190` collected the bill: `Convention` was projected onto two real
  // nodes whose `@type` dereferenced to nothing while this check reported
  // `0 undefined` — a clean run over a set it never looked at. `Requirement`
  // was in the same state and had been for longer.
  const minted = new Set<string>([...mintedTermsFromSource(root), ...Object.values(REGISTRY_GROUPS)]);
  const undefinedTerms = layer === undefined ? [...minted].filter((t) => !everything.has(t)).sort() : [];

  const doc = {
    "@context": {
      rdf: RDF,
      rdfs: RDFS,
      owl: OWL,
      skos: SKOS,
      dcterms: DCTERMS,
      ...NS_PREFIXES,
      label: "rdfs:label",
      comment: "rdfs:comment",
      isDefinedBy: { "@id": "rdfs:isDefinedBy", "@type": "@id" },
      seeAlso: { "@id": "rdfs:seeAlso", "@type": "@id" },
      prefLabel: "skos:prefLabel",
      definition: "skos:definition",
      notation: "skos:notation",
      title: "dcterms:title",
      inScheme: { "@id": "skos:inScheme", "@type": "@id" },
    },
    "@id": docIri,
    // In `--exact` mode this document IS the layer's concept scheme (see
    // `conceptSchemeIri`), so it carries both types rather than pointing at a
    // scheme node that would share its `@id`.
    "@type": exact && layer ? ["owl:Ontology", "skos:ConceptScheme"] : "owl:Ontology",
    label: !layer
      ? "folio-assistant vocabulary"
      : exact
        ? `folio-assistant vocabulary (${layer} only)`
        : `folio-assistant vocabulary (${layer} and below)`,
    comment:
      "Every class and property the folio knowledge graph projects, one node each. " +
      "Generated by scripts/ns-export.ts; graph-kind definitions are read from the " +
      "declaration registry rather than restated here.",
    "@graph": nodes,
  };

  return { doc, report: { defined: [...defined], undefinedTerms, doublyDefined } };
}

/**
 * Why `--layer <value>` was refused, or `undefined` when it is a layer.
 *
 * ONE READ OF `TERM_LAYERS` DECIDES BOTH the verdict and the sentence, which
 * is the whole point (#807). It was two literals — a predicate listing
 * `cat-bootstrap` and a message already saying `bootstrap` — so a refusal
 * printed the value it had just refused and read as an impossible state.
 *
 * Exported rather than left inline in the `import.meta.main` block because a
 * branch inside that block cannot be reached by a test at all: the only way to
 * exercise it was to spawn the script and read stderr, which is why nothing
 * did, and why the drift sat there through a rename.
 */
export function layerArgError(value: string): string | undefined {
  if ((TERM_LAYERS as readonly string[]).includes(value)) return undefined;
  // Composed from the same tuple the check used. An Oxford-less "a, b or c",
  // and still right if the tuple ever became one member.
  //
  // Phrased off `rest`, NOT off `TERM_LAYERS.length`: the tuple is `as const`,
  // so its length is the literal `3` and `=== 1` is a comparison tsc can prove
  // impossible — TS2367, which it duly raised. `slice` widens to an array, so
  // this asks the question without asserting a falsehood about today's tuple.
  const last = TERM_LAYERS[TERM_LAYERS.length - 1];
  const rest = TERM_LAYERS.slice(0, -1);
  const names = rest.length > 0 ? `${rest.join(", ")} or ${last}` : String(last);
  return `--layer must be ${names} (got ${value})`;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const layerIdx = argv.indexOf("--layer");
  const layer = layerIdx >= 0 ? (argv[layerIdx + 1] as TermLayer) : undefined;
  if (layer !== undefined) {
    const bad = layerArgError(String(layer));
    if (bad !== undefined) {
      console.error(bad);
      process.exit(2);
    }
  }
  const outIdx = argv.indexOf("--out");
  // `repoRootFor`: `_kg/` is a repository build output, not an instance one.
  // Spelled `_kg/ns.jsonld` as ONE segment rather than `"_kg", "ns.jsonld"`,
  // which is why the grep that found the other four defaults missed this one —
  // a reminder that a scan for a path is a scan for a spelling.
  const out =
    outIdx >= 0
      ? argv[outIdx + 1]
      : join(repoRootFor(ROOT), layer ? `_kg/ns-${layer}.jsonld` : "_kg/ns.jsonld");

  const { doc, report } = buildVocabulary(ROOT, layer, argv.includes("--exact"));

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
  console.log(`  @id  ${(doc as { "@id": string })["@id"]}`);
  console.log(`  ${report.defined.length} term(s) defined, ${report.undefinedTerms.length} undefined`);
  if (!existsSync(out!)) process.exit(2);
}
