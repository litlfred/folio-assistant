#!/usr/bin/env bun
/**
 * Is a minted glossary candidate already somebody else's concept?
 *
 * Bean `7wou`, under `5yhm`. The check the owner asked for on 2026-09-29:
 * *"extracting exsiting glossary needs compaision to existing
 * termonology/coding."* The contract, the three states and why `exact` and
 * `concept` are a pair are in `schemas/term-mapping.ts` and are not restated
 * here. Three things decide what the code below does:
 *
 *   * TWO TARGETS, NEVER MERGED. `skos` is authoritative for meaning, `fhir`
 *     for a clinical code's operational semantics, and the owner was explicit
 *     2026-09-30: "OCL is only for FHIR. not a constraint on SKOS." So there
 *     are two resolvers and two sets of results, and a term can be mapped in
 *     one and unmapped in the other without contradiction.
 *
 *   * A RESOLVER THAT CANNOT BE REACHED RETURNS `undetermined`, WITH ITS
 *     REASON — never `unmapped`. In this checkout that is not hypothetical:
 *     the network policy refuses `api.openconceptlab.org:443`, so every
 *     `fhir` row is undetermined and says so, while `skos` resolves locally
 *     and returns real verdicts.
 *
 *   * IT REPORTS AND NEVER GRADES. No ratio, no threshold, no exit code that
 *     depends on how many mapped. An unmapped candidate may be a term this
 *     corpus is right to coin.
 *
 * Usage:
 *   bun run cat-harness/scripts/check-term-mapping.ts
 *   bun run cat-harness/scripts/check-term-mapping.ts --check   # fail if stale
 *
 * @module scripts/check-term-mapping
 * @covers glossary
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  MAPPING_TARGETS,
  type ConceptMatch,
  type MappingScope,
  type MatchState,
  type TermMapping,
  TermMappingsFileSchema,
  normaliseLabel,
} from "../schemas/term-mapping.ts";
import { QA_RESULTS_DIR, buildQaResult, writeQaResult } from "./qa-results.ts";

const ROOT = resolve(import.meta.dir, "../..");
const STEM = "term-mapping";

/** The host OCL is served from. Named once, so the reason can quote it. */
export const OCL_HOST = "api.openconceptlab.org";

interface GlossTerm {
  id: string;
  prefLabel: string;
  altLabel?: string[];
  exactMatch?: string[];
  status?: string;
}
interface GlossScheme {
  id: string;
  terms: GlossTerm[];
  file: string;
}

/** Every `*.glossary.json` in the checkout, authored and generated alike. */
export function glossarySchemes(root: string): GlossScheme[] {
  const out: GlossScheme[] = [];
  const walk = (dir: string) => {
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const n of names) {
      if (n.startsWith(".") || n === "node_modules") continue;
      const abs = join(dir, n);
      let s;
      try {
        s = statSync(abs);
      } catch {
        continue;
      }
      if (s.isDirectory()) walk(abs);
      else if (n.endsWith(".glossary.json")) {
        try {
          const d = JSON.parse(readFileSync(abs, "utf-8")) as { id?: string; terms?: GlossTerm[] };
          if (d.terms) out.push({ id: d.id ?? n, terms: d.terms, file: abs.slice(root.length + 1) });
        } catch {
          // A scheme that will not parse is `check:glossary`'s finding, not
          // this one's. Saying it twice would make one defect look like two.
        }
      }
    }
  };
  walk(join(root, "folio-assistant-core", "glossary"));
  return out;
}

/**
 * The SKOS half, resolved LOCALLY against authored concepts.
 *
 * "Authoritative for meaning" does not mean "somewhere else": an authored
 * term in this instance is a concept somebody decided, and a candidate that
 * duplicates one is the promotion `glossary-terms` describes. External
 * schemes reached through an authored term's `exactMatch` travel with it, so
 * a match against `policy` also reports the ODRL URI it is an exact match for.
 */
export function skosIndex(schemes: GlossScheme[]): Map<string, ConceptMatch[]> {
  const idx = new Map<string, ConceptMatch[]>();
  const add = (label: string, m: ConceptMatch) => {
    const k = normaliseLabel(label);
    if (!k) return;
    const list = idx.get(k) ?? [];
    list.push(m);
    idx.set(k, list);
  };
  for (const s of schemes) {
    for (const t of s.terms) {
      if (t.status !== "authored") continue;
      // The external URI where there is one, otherwise the in-repo id — a
      // concept without a URI is still a concept somebody authored.
      const uri = t.exactMatch?.[0] ?? `${s.id}:${t.id}`;
      add(t.prefLabel, { uri, predicate: "skos:exactMatch", via: t.prefLabel, scheme: s.id });
      for (const alt of t.altLabel ?? []) {
        add(alt, { uri, predicate: "skos:closeMatch", via: alt, scheme: s.id });
      }
    }
  }
  return idx;
}

/** Candidates, which are what the check is ABOUT. */
export function candidates(schemes: GlossScheme[]): { term: GlossTerm; scheme: string }[] {
  return schemes.flatMap((s) =>
    s.terms.filter((t) => t.status !== "authored").map((term) => ({ term, scheme: s.id })),
  );
}

export function resolveSkos(
  cands: { term: GlossTerm; scheme: string }[],
  idx: Map<string, ConceptMatch[]>,
): TermMapping[] {
  return cands.map(({ term, scheme }) => {
    const key = normaliseLabel(term.prefLabel);
    const hits = idx.get(key) ?? [];
    const exactHit = hits.filter((h) => h.predicate === "skos:exactMatch");
    const exact: MatchState = exactHit.length ? "mapped" : "unmapped";
    const concept: MatchState = hits.length ? "mapped" : "unmapped";
    return {
      term: term.id,
      scheme,
      target: "skos" as const,
      exact,
      concept,
      ...(hits.length ? { matches: hits } : {}),
    };
  });
}

/**
 * The FHIR half. Open Concept Lab, and ONLY for FHIR — the owner's ruling.
 *
 * `reachable` is injected so the undetermined path is testable without the
 * network, which is the path that actually runs here.
 */
export function resolveFhir(
  cands: { term: GlossTerm; scheme: string }[],
  reason: string,
): TermMapping[] {
  return cands.map(({ term, scheme }) => ({
    term: term.id,
    scheme,
    target: "fhir" as const,
    exact: "undetermined" as const,
    concept: "undetermined" as const,
    undetermined_reason: reason,
  }));
}

async function oclReachable(): Promise<string | null> {
  try {
    const r = await fetch(`https://${OCL_HOST}/orgs/`, {
      method: "HEAD",
      signal: AbortSignal.timeout(15_000),
    });
    return r.ok ? null : `${OCL_HOST} answered HTTP ${r.status}`;
  } catch (e) {
    return `${OCL_HOST} could not be reached: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export async function run(root: string): Promise<{ mappings: TermMapping[]; scope: MappingScope[] }> {
  const schemes = glossarySchemes(root);
  const cands = candidates(schemes);
  const idx = skosIndex(schemes);
  const authoredSchemes = [
    ...new Set(schemes.filter((s) => s.terms.some((t) => t.status === "authored")).map((s) => s.id)),
  ].sort();

  const fhirReason = await oclReachable();
  const scope: MappingScope[] = [
    {
      target: "skos",
      consulted: authoredSchemes,
      via: "local — authored terms in this checkout's declared glossary schemes",
    },
    {
      target: "fhir",
      consulted: [],
      via: `https://${OCL_HOST}`,
      ...(fhirReason
        ? {
            unreachable_reason:
              `${fhirReason}. Every fhir row is therefore \`undetermined\`, NOT \`unmapped\` — ` +
              "a terminology that could not answer has said nothing.",
          }
        : {}),
    },
  ];

  const mappings = [
    ...resolveSkos(cands, idx),
    ...(fhirReason
      ? resolveFhir(cands, fhirReason)
      : // A reachable OCL still resolves nothing until this instance declares
        // which collections are in scope — an empty scope is a determined
        // finding, and inventing collections to query would be worse.
        resolveFhir(cands, `${OCL_HOST} is reachable, but no collections are declared in scope`)),
  ];
  return { mappings, scope };
}

function summarise(ms: TermMapping[], target: string): string {
  const of = ms.filter((m) => m.target === target);
  const n = (k: MatchState) => of.filter((m) => m.concept === k).length;
  // Three counts, never a ratio — see the module header.
  return `${of.length} candidate(s): ${n("mapped")} mapped, ${n("unmapped")} unmapped, ${n("undetermined")} undetermined`;
}

async function main(): Promise<number> {
  const check = process.argv.includes("--check");
  const { mappings, scope } = await run(ROOT);

  const file = {
    $schema: "folio-term-mappings/v1" as const,
    checked_at: new Date().toISOString().slice(0, 10),
    scope,
    mappings,
  };
  const parsed = TermMappingsFileSchema.safeParse(file);
  if (!parsed.success) {
    console.error("the result does not satisfy its own schema:");
    console.error(JSON.stringify(parsed.error.issues, null, 2));
    return 2;
  }

  for (const t of MAPPING_TARGETS) {
    const s = scope.find((x) => x.target === t)!;
    console.log(`  ${t}: ${summarise(mappings, t)}`);
    console.log(`    consulted ${s.consulted.length ? s.consulted.join(", ") : "(none declared)"} via ${s.via}`);
    if (s.unreachable_reason) console.log(`    ! ${s.unreachable_reason}`);
  }

  const result = buildQaResult({
    script: "cat-harness/scripts/check-term-mapping.ts",
    scriptAbsPath: import.meta.path,
    subject: { kind: "glossary", id: "folio-assistant-core/glossary" },
    families: Object.fromEntries(
      MAPPING_TARGETS.map((t) => [
        t,
        {
          summary: summarise(mappings, t),
          // Only the DETERMINED findings are entries: 2 594 undetermined rows
          // would bury the ones a reader can act on, and the scope already
          // says the whole target is undetermined and why.
          entries: mappings.filter((m) => m.target === t && m.concept === "mapped"),
        },
      ]),
    ),
  });
  const rel = join("cat-harness", QA_RESULTS_DIR, `${STEM}.qa-results.json`);
  if (check) {
    // `--check` VERIFIES. Writing in check mode would make the gate green by
    // repairing what it was asked to inspect, which is the one thing a check
    // must not do.
    //
    // Compared on the FAMILIES, not the whole file: `producer.script_hash`
    // moves whenever this script is edited and the timestamp moves every run,
    // and neither is a finding. What must not drift is what was found.
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) {
      console.error(`  ✗ ${rel} does not exist — run \`bun run term:mapping\``);
      return 1;
    }
    const prior = JSON.parse(readFileSync(abs, "utf-8")) as { families?: unknown };
    if (JSON.stringify(prior.families) !== JSON.stringify(result.families)) {
      console.error(`  ✗ ${rel} is stale — run \`bun run term:mapping\` and commit it`);
      return 1;
    }
    console.log(`  ✓ ${rel} is current`);
    return 0;
  }
  const out = writeQaResult(join(ROOT, "cat-harness"), STEM, result);
  console.log(`  wrote ${out.slice(ROOT.length + 1)}`);
  // Never fails on WHAT IT FOUND. The three states are the report, and an
  // unmapped candidate may be a term this corpus is right to coin.
  return 0;
}

if (import.meta.main) process.exit(await main());
