#!/usr/bin/env bun
/**
 * No rendered diagram label shows an XML character reference as literal text.
 *
 * ## What it measures, and why the SUBJECT is the SVG rather than the BPMN
 *
 * A BPMN `name` written `&amp;#10;` is DOUBLE-escaped. XML resolves it to the
 * five characters `&#10;`, and the renderer then draws them, so a reader sees
 *
 *     Dependency advisories&#10;(WARN-ONLY)
 *
 * inside the box. Measured 2026-09-26: 74 workflow SVGs, **6** carrying at
 * least one such label, **68** labels in all. Bean `li5y`.
 *
 * The check reads the RENDERED SVG on purpose. Two reasons, and the second is
 * the one that matters:
 *
 * 1. A grep over `.bpmn` for `&amp;#10;` finds the one form somebody already
 *    knows about. `&amp;#8212;`, `&amp;#x2014;` and every future variant are
 *    the same defect and would slip past it. What is wrong is a character
 *    reference surviving INTO the drawn text, whatever its spelling.
 * 2. A source-level check cannot tell a label from documentation.
 *    `docs-site-publish.bpmn` carries eight `&amp;#10;` and its SVG carries
 *    none — they are all in `<bpmn:documentation>`, which is prose on a page
 *    rather than text in a box. Those want a different remedy (`li5y` keeps
 *    them separate), and a check that conflated the two would demand the wrong
 *    fix for eight of them.
 *
 * ## Why `render:bpmn:check` cannot do this job
 *
 * It asks whether the committed SVG is what the renderer would produce. It was
 * GREEN across all 68 of these, and correctly so: the renderer faithfully
 * produced the wrong thing. Currency is not validity — the distinction
 * `check-artefact-verification` exists for, arriving in the diagrams. This
 * check asks about the OUTPUT's content, which is the question a reader has.
 *
 * ## Enforcement is a RATCHET
 *
 * Six files are already affected and fixing them is a corpus sweep with a
 * five-locale translation consequence (`li5y`). Failing on them would make
 * this the "check that cries wolf is a check somebody switches off" failure on
 * its first run. So known counts sit in a committed baseline and **anything
 * beyond them fails**: a new file, or an existing file gaining a label.
 *
 * Keyed on file AND count, unlike `check-layout-norms`' set of pair strings.
 * A file already on the list can gain a seventh bad label, and a presence-only
 * baseline would say nothing — the baseline must shrink, never drift.
 *
 * Removing labels is progress and is NOT a failure: it prints as fixed, and
 * `--update` rewrites the baseline so the diff somebody reviews is the
 * shrinking list. `code-quality-gates.svg` left the list that way.
 *
 * Usage:
 *   bun run check:rendered-labels
 *   bun run check:rendered-labels -- --update    # rewrite the baseline
 *   bun run check:rendered-labels -- --json      # sidecar only
 *
 * Exit: 0 clean (or only known labels), 1 a label beyond the baseline,
 *       2 could not determine — no SVG was read.
 *
 * @module scripts/check-rendered-labels
 * @covers cat-harness
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { gitCorpus } from "../schemas/git-corpus.ts";
import { buildQaResult, writeQaResult } from "./qa-results.ts";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(INSTANCE_ROOT, "..");

/**
 * Known counts, committed. Beside this module rather than in a declaration:
 * it records what has NOT been done yet, which is a property of the work
 * rather than of the graph.
 */
const BASELINE = join(INSTANCE_ROOT, "scripts", "rendered-labels-baseline.json");

/**
 * A character reference that survived into drawn text.
 *
 * Matches the decimal and hex forms — `&#10;` and `&#x2014;`. In the SVG these
 * appear as `&amp;#10;`, because a tspan whose TEXT is those five characters
 * serialises its ampersand. So this pattern is looking for the escape of an
 * escape, which is exactly the defect and cannot false-positive on a label
 * that merely contains an ampersand (that serialises as `&amp;amp;`).
 */
const LITERAL_REF = /&amp;#(?:x[0-9A-Fa-f]+|[0-9]+);/;

/** Text of every `<tspan>` in an SVG — the drawn label content. */
export function tspans(svg: string): string[] {
  return [...svg.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/gs)].map((m) => m[1]!);
}

/** How many of an SVG's labels show a character reference as literal text. */
export function offendingLabels(svg: string): string[] {
  return tspans(svg).filter((t) => LITERAL_REF.test(t));
}

export interface LabelReport {
  undetermined: boolean;
  /** How many SVGs were read. Zero is `undetermined`, never clean. */
  scanned: number;
  /** repo-relative path -> offending label count, for every affected file. */
  found: Record<string, number>;
  /** Files above their baseline count, or absent from it — these fail. */
  unexpected: string[];
  /** Baselined files now clean, or below their count — progress, never a failure. */
  fixed: string[];
}

export function readBaseline(file = BASELINE): Record<string, number> {
  if (!existsSync(file)) return {};
  const raw = JSON.parse(readFileSync(file, "utf-8")) as { counts?: Record<string, number> };
  return raw.counts ?? {};
}

/**
 * Every rendered workflow diagram, asked of GIT rather than the disk.
 *
 * `gitCorpus` for the reason its own module states, and the reason this
 * session paid for directly: a filesystem walk counts whatever a gate left
 * lying around, which is how a pinned measurement moved by 1214 nodes
 * depending on whether a subpackage's devDependencies were installed.
 */
function renderedDiagrams(repoRoot: string): string[] | undefined {
  const corpus = gitCorpus(repoRoot, ["*.svg"]);
  if (corpus === undefined) return undefined;
  return corpus.filter((p) => {
    const rel = relative(repoRoot, p);
    return rel.includes(`${"workflows"}/`) && rel.endsWith(".svg");
  });
}

export function checkRenderedLabels(repoRoot = REPO_ROOT, baselineFile = BASELINE): LabelReport {
  const files = renderedDiagrams(repoRoot);
  const r: LabelReport = {
    undetermined: files === undefined || files.length === 0,
    scanned: 0,
    found: {},
    unexpected: [],
    fixed: [],
  };
  if (files === undefined || files.length === 0) return r;

  for (const abs of files) {
    const n = offendingLabels(readFileSync(abs, "utf-8")).length;
    r.scanned += 1;
    if (n > 0) r.found[relative(repoRoot, abs)] = n;
  }

  const known = readBaseline(baselineFile);
  // ABOVE its allowance, or not in it at all. Equal is known and passes.
  r.unexpected = Object.keys(r.found)
    .filter((f) => r.found[f]! > (known[f] ?? 0))
    .sort();
  r.fixed = Object.keys(known)
    .filter((f) => (r.found[f] ?? 0) < known[f]!)
    .sort();
  return r;
}

if (import.meta.main) {
  const r = checkRenderedLabels();

  if (r.undetermined) {
    console.error("UNDETERMINED: no rendered workflow diagram was read.");
    console.error(
      "This is not a pass — nothing was checked. Either git could not list the " +
        "corpus, or `bun run render:bpmn` has never produced an SVG here.",
    );
    process.exit(2);
  }

  const total = Object.values(r.found).reduce((a, b) => a + b, 0);

  writeQaResult(
    INSTANCE_ROOT,
    "rendered-labels",
    buildQaResult({
      script: "cat-harness/scripts/check-rendered-labels.ts",
      scriptAbsPath: fileURLToPath(import.meta.url),
      subject: { kind: "corpus", id: "rendered-diagram-labels" },
      families: {
        "literal-character-reference": {
          summary:
            "A rendered diagram label showing an XML character reference as literal text — a reader sees " +
            "`Dependency advisories&#10;(WARN-ONLY)` inside the box. The cause is a DOUBLE-escaped `name` in " +
            "the BPMN (`&amp;#10;` where `&#10;` was meant). Measured against the RENDERED SVG rather than " +
            "the source, because a source grep finds only the escape form somebody already knows and cannot " +
            "tell a label from `<bpmn:documentation>`, whose eight instances in docs-site-publish want a " +
            "different remedy. `render:bpmn:check` is green across all of these and correctly so: it asks " +
            "whether the SVG matches the renderer's output, and the renderer faithfully produced the wrong " +
            "thing. Known counts are baselined so an outstanding sweep does not fail the gate; a NEW file, " +
            "or an existing file gaining a label, does. Bean `li5y`.",
          entries: Object.entries(r.found).map(([file, count]) => ({
            file,
            count,
            known: !r.unexpected.includes(file),
          })),
        },
      },
    }),
  );

  if (process.argv.includes("--update")) {
    writeFileSync(
      BASELINE,
      `${JSON.stringify(
        {
          _comment:
            "Rendered workflow diagrams whose labels still show an XML character reference as literal text, " +
            "with how many labels each. NOT intended output — see scripts/check-rendered-labels.ts and bean " +
            "`li5y`. A file above its count here, or absent from here, fails the check, so this file only " +
            "ever shrinks. Written by `bun run check:rendered-labels -- --update`.",
          counts: Object.fromEntries(Object.entries(r.found).sort(([a], [b]) => a.localeCompare(b))),
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Baseline written: ${Object.keys(r.found).length} file(s), ${total} label(s).`);
    process.exit(0);
  }

  if (!process.argv.includes("--json")) {
    console.log(`rendered diagram labels — ${r.scanned} SVG(s) read\n`);
    if (total === 0) {
      console.log("  ✓ no rendered label shows a character reference as literal text");
    }
    for (const [file, count] of Object.entries(r.found).sort(([a], [b]) => a.localeCompare(b))) {
      console.log(`  ${r.unexpected.includes(file) ? "✗" : "·"} ${count} label(s)  ${file}`);
    }
    for (const f of r.fixed) console.log(`  ✓ FIXED, fewer or none now: ${f}`);
    if (r.fixed.length > 0) {
      console.log("\n  Re-run with --update to shrink the baseline — the diff is the progress.");
    }
    if (r.unexpected.length > 0) {
      console.log(
        `\n  ${r.unexpected.length} file(s) beyond the baseline. A label's line break is ` +
          "`&#10;` in the BPMN `name`, not `&amp;#10;` — the second is double-escaped and the " +
          "renderer draws the five characters. Fix the `name`, then `bun run render:bpmn`.",
      );
    }
  }

  if (r.unexpected.length > 0) process.exit(1);
}
