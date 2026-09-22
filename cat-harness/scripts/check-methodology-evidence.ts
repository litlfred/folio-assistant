#!/usr/bin/env bun
/**
 * Does each methodology's cited source actually exist in a library?
 *
 * ## The measurement this exists for
 *
 * Every methodology node carries an `origin` naming authors and a publication,
 * because `methodology-adoption` makes that the line between an adoption and a
 * house process. Measured 2026-09-22, across all four declared libraries:
 * **six methodologies cited an origin and ZERO had that source ingested.** The
 * citations resolved against nothing — the shape the retired skill `roles:`
 * field cost 260 dangling values (bean `qif9`), reappearing on the kind whose
 * whole justification is being somebody else's named, external work.
 *
 * There was no way to see it. `test/results/` held eight QA axes and none was
 * about methodologies, so "this methodology rests on a citation nobody can
 * follow" was not a finding anything could report.
 *
 * ## It REPORTS; it does not gate
 *
 * Default exit is 0 **with findings**. That is deliberate and it is the same
 * division `check:subgraphs` uses: a gate that fails on things nobody has
 * decided about is the "check that cries wolf is a check somebody switches
 * off" failure `known-skills.ts` names, and on the day this landed it would
 * have failed on five of six methodologies at once.
 *
 * Whether a methodology with no reachable source may still be used is the
 * owner's call, not this script's. `--strict` exits 1 for a caller that has
 * decided.
 *
 * **Two things DO fail by default**, because neither is an open question:
 * front matter that does not validate, and an `evidence` reference pointing at
 * a bib-slug no declared library holds. The first is a malformed node; the
 * second is a citation that claims to resolve and does not, which is strictly
 * worse than having none — it reads as evidence in every listing.
 *
 * ## Could-not-determine is a third state and exits 2
 *
 * If no directory declares a `methodology` graph, this reports `undetermined`
 * and exits 2 rather than printing a clean run over a corpus it never found.
 * An empty sweep and a clean sweep must not share a spelling — the `dh4f`
 * defect, which is about exactly this.
 *
 * Usage:
 *   bun run check:methodology-evidence
 *   bun run check:methodology-evidence -- --strict    # any finding exits 1
 *   bun run check:methodology-evidence -- --json      # sidecar only, no prose
 *
 * Exit: 0 reported, 1 a hard finding (or any finding under --strict),
 *       2 could not determine.
 *
 * @module scripts/check-methodology-evidence
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import { directoriesForGraph } from "../schemas/cat-harness.ts";
import { MethodologyFrontMatterSchema, METHODOLOGY_SCHEMA_TAG } from "../schemas/methodology.ts";
import { buildQaResult, writeQaResult } from "./qa-results.ts";

/**
 * This module's own instance root.
 *
 * Derived from the module's location rather than the CWD, for the reason
 * `ingest-document.ts` records at length: after the stub move the CWD is the
 * REPOSITORY root, which declares nothing, so a CWD-relative resolution
 * reported "this instance declares no such graph" — a true sentence about a
 * directory that is not this instance.
 */
const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

interface Finding {
  node: string;
  name?: string;
  detail: string;
}

export interface EvidenceReport {
  undetermined: boolean;
  nodes: number;
  invalid: Finding[];
  unresolved: Finding[];
  noEvidence: Finding[];
  untagged: Finding[];
  resolved: { node: string; name: string; evidence: string; at: string }[];
}

/** Every `.md` under every directory declaring a `methodology` graph. */
function methodologyFiles(root: string): string[] {
  const out: string[] = [];
  for (const dir of directoriesForGraph(root, "methodology")) {
    if (!existsSync(dir)) continue;
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      // Only files directly in the graph directory. A methodology that owns a
      // SUBDIRECTORY (crdm/, raci/) declares that subdirectory itself, and its
      // nodes are its own — the `x4v4` rule that a subgraph's nodes are not
      // also its container's. Recursing here would attribute a CRDM skill to
      // the methodology graph and make every count computed from it wrong.
      if (e.endsWith(".md") && statSync(p).isFile()) out.push(p);
    }
  }
  return out.sort();
}

/** Front matter between the first two `---` lines, or undefined. */
export function frontMatterOf(text: string): string | undefined {
  if (!text.startsWith("---")) return undefined;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return undefined;
  return text.slice(text.indexOf("\n", 3) + 1, end + 1);
}

/**
 * Where a `library/<bib-slug>` reference resolves, across EVERY declared
 * library, or undefined.
 *
 * Fanned out rather than resolved against the node's own instance, per bean
 * `a02m`: several instances declare a library, and a methodology's source may
 * sit in a sibling's corpus — `grade`'s would belong with the WHO material.
 * Resolving against one would report a present document as missing.
 */
export function resolveEvidence(root: string, ref: string): string | undefined {
  // declared-path-literal: this is the `evidence` field's REFERENCE GRAMMAR,
  // not a directory. `library/<bib-slug>` is the spelling a node writes and
  // `MethodologyFrontMatterSchema` validates; the directories it is resolved
  // AGAINST are read from the declaration, on the next line. Reading the
  // declaration to strip this prefix would be asking where a library lives in
  // order to parse a string that does not name one.
  const slug = ref.slice("library/".length);
  for (const lib of directoriesForGraph(root, "library")) {
    const p = join(lib, slug);
    if (existsSync(p) && statSync(p).isDirectory()) return p;
  }
  return undefined;
}

export function checkMethodologyEvidence(root = INSTANCE_ROOT): EvidenceReport {
  const files = methodologyFiles(root);
  const r: EvidenceReport = {
    undetermined: directoriesForGraph(root, "methodology").length === 0,
    nodes: 0,
    invalid: [],
    unresolved: [],
    noEvidence: [],
    untagged: [],
    resolved: [],
  };
  if (r.undetermined) return r;

  for (const f of files) {
    const node = relative(root, f);
    const text = readFileSync(f, "utf-8");
    const fm = frontMatterOf(text);

    if (fm === undefined || !fm.includes(METHODOLOGY_SCHEMA_TAG)) {
      // NOT counted as an invalid methodology — it may legitimately be a
      // README or an index sitting in the directory. It is reported because a
      // node nobody tagged is a node no consumer of the graph can see, which
      // is the same silence a declared-but-absent directory produces.
      r.untagged.push({ node, detail: `carries no \`$schema: ${METHODOLOGY_SCHEMA_TAG}\`` });
      continue;
    }

    let parsed: unknown;
    try {
      parsed = parseYaml(fm);
    } catch (e) {
      r.invalid.push({ node, detail: `front matter is not valid YAML: ${(e as Error).message}` });
      continue;
    }

    const v = MethodologyFrontMatterSchema.safeParse(parsed);
    if (!v.success) {
      r.invalid.push({
        node,
        detail: v.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "),
      });
      continue;
    }

    r.nodes += 1;
    const { name, evidence, origin } = v.data;

    if (evidence === undefined || evidence.length === 0) {
      r.noEvidence.push({
        node,
        name,
        detail: `cites an origin (${origin.replace(/\s+/g, " ").trim().slice(0, 90)}…) with no ingested source`,
      });
      continue;
    }

    // EVERY reference is resolved, not just the first. A node citing two
    // sources where one is missing is not backed — it is half backed, and
    // reporting it as resolved would put the more reassuring of the two
    // answers on the record.
    const missing: string[] = [];
    const found: { ref: string; at: string }[] = [];
    for (const ref of evidence) {
      const at = resolveEvidence(root, ref);
      if (at === undefined) missing.push(ref);
      else found.push({ ref, at: relative(root, at) });
    }
    if (missing.length > 0) {
      r.unresolved.push({
        node,
        name,
        detail: `${missing.map((m) => `\`${m}\``).join(", ")} in no declared library`,
      });
      continue;
    }
    for (const f of found) r.resolved.push({ node, name, evidence: f.ref, at: f.at });
  }
  return r;
}

if (import.meta.main) {
  const strict = process.argv.includes("--strict");
  const r = checkMethodologyEvidence();

  if (r.undetermined) {
    console.error("UNDETERMINED: no directory declares a `methodology` graph — nothing was checked.");
    console.error("This is not a pass. Declare the graph, or say why this instance has none.");
    process.exit(2);
  }

  writeQaResult(
    INSTANCE_ROOT,
    "methodology-evidence",
    buildQaResult({
      script: "cat-harness/scripts/check-methodology-evidence.ts",
      scriptAbsPath: fileURLToPath(import.meta.url),
      subject: { kind: "corpus", id: "methodologies" },
      families: {
        "evidence-unresolved": {
          summary:
            "An `evidence:` reference naming a bib-slug no declared library holds. WORSE than declaring none: " +
            "it reads as an ingested source in every listing, so a reader who does not open it is told the " +
            "citation resolves. Fails by default, unlike a missing `evidence` field, because a broken pointer " +
            "is not an open question about whether to adopt something.",
          entries: r.unresolved,
        },
        "invalid-front-matter": {
          summary:
            "A node tagged `folio-methodology/v1` whose front matter does not validate against " +
            "`schemas/methodology.ts`. The schema is `strict()`, so a misspelled key is a finding rather than " +
            "a silent omission — `applies_when` beside a correct `applies-when` would otherwise validate while " +
            "the selection question never reached the node. Fails by default.",
          entries: r.invalid,
        },
        "no-evidence-declared": {
          summary:
            "A valid methodology citing an origin, with no `evidence:` pointing at an ingested source. THE " +
            "FINDING THIS AXIS WAS BUILT FOR: on 2026-09-22 this was six of six. Reported, never gated — " +
            "whether a methodology whose source nobody can open may still be used is the owner's call, and a " +
            "gate failing on the whole corpus at once is one somebody switches off. `literature-search` is the " +
            "skill that closes one of these.",
          entries: r.noEvidence,
        },
        "untagged-file": {
          summary:
            "A `.md` sitting in a directory declared as a `methodology` graph, carrying no " +
            "`$schema: folio-methodology/v1`. It may legitimately be a README, which is why this is separate " +
            "from `invalid-front-matter` and is not gated — but an untagged node is one no consumer of the " +
            "graph can see, and that silence is indistinguishable from the file not being there.",
          entries: r.untagged,
        },
      },
    }),
  );

  if (!process.argv.includes("--json")) {
    console.log(`methodology evidence — ${r.nodes} node(s) across the declared \`methodology\` graph(s)\n`);
    for (const g of r.resolved) {
      console.log(`  ✓ ${g.name.padEnd(16)} ${g.evidence}  →  ${g.at}`);
    }
    for (const f of r.noEvidence) {
      console.log(`  · ${(f.name ?? basename(f.node)).padEnd(16)} no ingested source — ${f.detail}`);
    }
    for (const f of r.unresolved) console.log(`  ✗ ${(f.name ?? f.node).padEnd(16)} ${f.detail}`);
    for (const f of r.invalid) console.log(`  ✗ ${f.node}: ${f.detail}`);
    for (const f of r.untagged) console.log(`  ? ${f.node}: ${f.detail}`);

    // COUNT THE METHODOLOGIES, NOT THE REFERENCES. `resolved` holds one entry
    // per (node, source) pair since `evidence` became an array, so its length
    // is a count of citations — and printing that as "N of 5 methodologies"
    // read as 2 the moment one node gained a second source. Exactly the
    // "never quote a count from prose" failure, in the script that exists to
    // replace prose counts with measured ones.
    const backed = new Set(r.resolved.map((g) => g.name)).size;
    const refs = r.resolved.length;
    console.log(
      `\n  ${backed} of ${r.nodes} methodolog${r.nodes === 1 ? "y" : "ies"} rest on a source this ` +
        `checkout holds${refs > backed ? `, across ${refs} ingested source(s)` : ""}.`,
    );
    if (r.noEvidence.length > 0) {
      console.log(`  ${r.noEvidence.length} cite${r.noEvidence.length === 1 ? "s" : ""} an origin nobody has ingested.`);
      console.log("  Not a gate. Run `literature-search` against one, or record why it stays as it is.");
    }
  }

  const hard = r.invalid.length + r.unresolved.length;
  if (hard > 0) process.exit(1);
  if (strict && r.noEvidence.length + r.untagged.length > 0) process.exit(1);
}
