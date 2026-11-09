/**
 * Write every artefact generated from the Zod source, or with `--check`, fail
 * when any committed copy differs from what would be written.
 *
 *   smart-base/kg/generated/l1/l1.json                          L1 3.0, smart-kg format, JSON-equal to WHO's but for `_generated`
 *   smart-base/kg/generated/l1/l1-library.json                  the extension layer (imports l1), smart-kg format
 *   smart-base/kg/generated/l1/l1-library.jsonld                the specialisation: rdfs:subClassOf from L1 layout classes to the library's
 *   smart-base/kg/generated/l1/recommendation-graph.schema.json the document JSON Schema
 *   smart-base/kg/generated/l1/l1.context.jsonld                smart-kg's L1 context, JSON-equal to WHO's
 *   smart-base/kg/generated/l1/l1-library.context.jsonld        the context an l1-library document names (src/context.ts)
 *   input/fsh/models/KGL1.fsh, KGL1Library.fsh       logical models (the IG's, at the repository root)
 *   input/fsh/codesystems/KG*.fsh, valuesets/KG*VS.fsh
 *
 * A generated FSH file this run would not write — a value set renamed or
 * removed upstream — is deleted, and only if it carries this generator's
 * banner: a hand-written KG*.fsh is never touched. `--check` reports it.
 *
 *   npx tsx src/emit.ts           write
 *   npx tsx src/emit.ts --check   exit 1 and name each stale or orphaned file
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { baseContext, extensionContext } from "./context.ts";
import { fshFiles, GENERATED_BANNER } from "./fsh.ts";
import { GraphDocumentSchema } from "./graph.ts";
import { L1 } from "./l1.ts";
import { DOCO_NS, ELEMENT_TYPE_CLASS, L1_LIBRARY, LAYERING_RULE, SPECIALISES } from "./l1-library.ts";
import { toOntologyJson } from "./ontology.ts";
import { SHAPE_ID, SHAPE_TITLE } from "./shape-text.ts";

/** smart-base repository root: this file is `smart-base/kg/src/emit.ts`, three levels down. */
export const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export function graphJsonSchema(): Record<string, unknown> {
  const body = z.toJSONSchema(GraphDocumentSchema, { io: "input", reused: "inline", target: "draft-2020-12" }) as Record<string, unknown>;
  return { $schema: body.$schema, $id: SHAPE_ID, title: SHAPE_TITLE, ...body };
}

/** The class-level half of the specialisation ruling, as linked data. */
export function specialisationJsonLd(): Record<string, unknown> {
  const sg = "http://smart.who.int/kg/";
  return {
    "@context": { rdfs: "http://www.w3.org/2000/01/rdf-schema#", sgkg: sg, doco: DOCO_NS, subClassOf: { "@id": "rdfs:subClassOf", "@type": "@id" }, comment: "rdfs:comment" },
    "@id": `${sg}l1-library`,
    comment: LAYERING_RULE,
    "@graph": [
      ...SPECIALISES.map((s) => ({ "@id": `${sg}${s.l1}`, subClassOf: s.library, comment: s.note })),
      ...Object.entries(ELEMENT_TYPE_CLASS).map(([type, cls]) => ({
        "@id": `${sg}publication-element#${type}`,
        subClassOf: [`${sg}publication-element`, cls],
        comment: `A publication-element whose elementType is "${type}".`,
      })),
    ],
  };
}

/**
 * The top-level `_generated` the two smart-kg-format files carry: each file's
 * own declaration that this generator wrote it, the convention the harness's
 * reference-direction check reads (`declaresGenerated`). `l1.json` quotes
 * WHO's text byte for byte, including a `where` naming a DAK repository by its
 * layer name; without the key that quote read as authored text in this layer.
 *
 * Added here, at serialisation, and not in `toOntologyJson`: the ontology
 * schema is strict and the parity test compares that function's value with
 * WHO's file, so both stay exactly as they were. `source: "authored"` in the
 * file is about L1's CONTENT (authored, not extracted); this key is about the
 * FILE (written from `l1.ts`, not edited by hand).
 */
export const GENERATED_NOTE = "smart-base/kg/src/emit.ts (npm run build in smart-base/kg/) — do not hand-edit; edit src/";

export function artefacts(): { path: string; text: string }[] {
  const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;
  const declared = (v: object) => json({ _generated: GENERATED_NOTE, ...v });
  return [
    { path: "smart-base/kg/generated/l1/l1.json", text: declared(toOntologyJson(L1)) },
    { path: "smart-base/kg/generated/l1/l1-library.json", text: declared(toOntologyJson(L1_LIBRARY)) },
    { path: "smart-base/kg/generated/l1/l1-library.jsonld", text: json(specialisationJsonLd()) },
    { path: "smart-base/kg/generated/l1/recommendation-graph.schema.json", text: json(graphJsonSchema()) },
    { path: "smart-base/kg/generated/l1/l1.context.jsonld", text: json(baseContext([L1])) },
    { path: "smart-base/kg/generated/l1/l1-library.context.jsonld", text: json(extensionContext([L1_LIBRARY, L1])) },
    ...fshFiles(L1, "smart-base/kg/src/l1.ts (L1 3.0)"),
    ...fshFiles(L1_LIBRARY, "smart-base/kg/src/l1-library.ts (the library extension)"),
  ];
}

/** Generated FSH on disk that this run would not write: renamed or removed upstream. */
export function orphans(written: Set<string>): string[] {
  const out: string[] = [];
  for (const dir of ["input/fsh/models", "input/fsh/codesystems", "input/fsh/valuesets"]) {
    const abs = join(REPO, dir);
    if (!existsSync(abs)) continue;
    for (const f of readdirSync(abs)) {
      const rel = `${dir}/${f}`;
      if (!/^KG.*\.fsh$/.test(f) || written.has(rel)) continue;
      // Only this generator's own output: the banner's fixed prefix.
      if (readFileSync(join(abs, f), "utf8").startsWith(GENERATED_BANNER("").split(" from ")[0]!)) out.push(rel);
    }
  }
  return out.sort();
}

function main(argv: string[]): number {
  const check = argv.includes("--check");
  const all = artefacts();
  const stale: string[] = [];
  for (const a of all) {
    const abs = join(REPO, a.path);
    const current = existsSync(abs) ? readFileSync(abs, "utf8") : undefined;
    if (current === a.text) continue;
    if (check) {
      stale.push(`${a.path}${current === undefined ? " (missing)" : ""}`);
      continue;
    }
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, a.text);
    console.log(`wrote ${a.path}`);
  }
  for (const o of orphans(new Set(all.map((a) => a.path)))) {
    if (check) stale.push(`${o} (orphaned: generated, but nothing generates it now)`);
    else {
      rmSync(join(REPO, o));
      console.log(`removed ${o} (orphaned)`);
    }
  }
  if (check) {
    if (stale.length) {
      console.error(`${stale.length} generated file(s) are stale — run \`npm run build\` in smart-base/kg/:`);
      for (const s of stale) console.error(`  ${s}`);
      return 1;
    }
    console.log(`✓ ${all.length} generated file(s) current, none orphaned`);
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(main(process.argv.slice(2)));
