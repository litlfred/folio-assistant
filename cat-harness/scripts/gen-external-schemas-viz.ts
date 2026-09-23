#!/usr/bin/env bun
/**
 * Render the `external-schema` graph — which specifications this repository
 * depends on, at which edition, and what in it would move if one bumped.
 *
 * @module cat-harness/scripts/gen-external-schemas-viz
 *
 * ## The gap this closes
 *
 * `external-schema` was one of the declared graph kinds with no published
 * viewer, so the navbar listed it disabled. Four records — BPMN 2.0, Diagram
 * Definition 1.0, DCMI Metadata Terms, SKOS — each naming an authority, an
 * edition, its namespace IRIs, the files that depend on it and the operative
 * terms this repository actually branches on, and no way to see any of it
 * short of opening four JSON files.
 *
 * ## It reads the registry through `external-schemas.ts`, not past it
 *
 * `loadSpecs` already finds the registry FROM THE DECLARATION, parses every
 * record and refuses a malformed one; `undeclaredNamespaces` and
 * `unusedNamespaces` already reconcile what is declared against what the
 * corpus uses. All of it is imported. A generator with its own reader would be
 * a second answer to "what is in this registry", free to render a record the
 * checker never validated — the rule bean `zw4a` states for the adjacent case
 * and the one `gen-methodologies-viz.ts` follows for its own graph.
 *
 * ## The one thing this adds: does `usedBy` still resolve?
 *
 * `usedBy` is the blast radius of a version bump — *"what in this repository
 * depends on it"* — and it is a hand-written list of paths. Nothing checked
 * them. A path that has since been renamed leaves the record claiming a
 * dependency that no longer exists, which is the `evidence`-dangling failure
 * one graph over: it reads as a resolved reference in every listing.
 *
 * THREE STATES, because two would lie about the third:
 *
 * | state | means |
 * |---|---|
 * | **resolves** | a path in this checkout, openable |
 * | **not a path** | a glob or a prose note (`processes/*.bpmn — the BPMNDI layout…`) — NOT checkable, and not a finding |
 * | **does not resolve** | spelled as a path and there is nothing there |
 *
 * Collapsing the middle into either of the others is the `dh4f` defect: a
 * deliberate prose entry reported as broken teaches a reader to ignore the
 * column, and one reported as fine hides the entries that really are.
 *
 * Usage:
 *   bun run cat-harness/scripts/gen-external-schemas-viz.ts
 *   bun run cat-harness/scripts/gen-external-schemas-viz.ts --check
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { declarationPathIn } from "../schemas/cat-harness.js";
import { docsLayers } from "./compose-docs.js";
import { loadSpecs, namespacesInUse } from "./external-schemas.js";
import {
  undeclaredNamespaces,
  unusedNamespaces,
  type ExternalSchema,
} from "../../folio-assistant-core/schemas/external-schema.js";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(INSTANCE_ROOT, "..");

/** The graph kind this renders. A KIND, never a path. */
const KIND = "external-schema";

/** One `usedBy` entry, and whether this checkout still holds it. */
export interface UsedByRow {
  readonly entry: string;
  readonly state: "resolves" | "not-a-path" | "missing";
}

/**
 * Classify one `usedBy` entry.
 *
 * Exported because it is the only judgement on this page, and a test that went
 * through the rendered markdown would be testing the markdown.
 *
 * A glob or a prose note is NOT CHECKABLE and says so. The corpus already
 * holds both forms deliberately — `omg-dd-1.0` writes *"processes/*.bpmn — the
 * BPMNDI layout every diagram carries"*, which names a set and then explains
 * it — so treating anything non-resolving as broken would report a record that
 * is doing the right thing.
 *
 * Resolution is tried against the REPOSITORY root and then this instance's,
 * because the corpus spells both: `cat-harness/scripts/ns-export.ts` is
 * repo-relative and `processes/*.bpmn` is instance-relative. Trying one only
 * would report half the list missing, which is a wrong answer that looks like
 * a finding.
 */
export function classifyUsedBy(entry: string, repoRoot: string, instanceRoot: string): UsedByRow {
  // A glob, or a path with prose after it. Both name something this cannot
  // open, and neither is a defect.
  if (/[*?]/.test(entry) || /\s[—-]\s/.test(entry) || /\s/.test(entry.trim())) {
    return { entry, state: "not-a-path" };
  }
  const found = existsSync(join(repoRoot, entry)) || existsSync(join(instanceRoot, entry));
  return { entry, state: found ? "resolves" : "missing" };
}

/** Every `usedBy` entry across every spec, classified. */
export function usedByRows(
  specs: readonly ExternalSchema[],
  repoRoot = REPO,
  instanceRoot = INSTANCE_ROOT,
): Map<string, UsedByRow[]> {
  const out = new Map<string, UsedByRow[]>();
  for (const s of specs) {
    out.set(
      s.id,
      s.usedBy.map((e) => classifyUsedBy(e, repoRoot, instanceRoot)),
    );
  }
  return out;
}

/** Where the page goes, read from the declaration that renders it. */
export function pageRelPath(repo = REPO): string | undefined {
  const declPath = declarationPathIn(join(repo, "cat-harness"));
  if (!declPath || !existsSync(declPath)) return undefined;
  const d = JSON.parse(readFileSync(declPath, "utf-8")) as {
    directories?: { graphKinds?: string[]; coverage?: { visualiser?: unknown } }[];
  };
  for (const e of d.directories ?? []) {
    if (!(e.graphKinds ?? []).includes(KIND)) continue;
    const v = e.coverage?.visualiser;
    for (const one of Array.isArray(v) ? v : [v]) {
      const ref = typeof one === "string" ? one : (one as { ref?: string } | undefined)?.ref;
      if (!ref) continue;
      const rel = relative(baseDocs(repo), resolve(repo, ref));
      if (rel.startsWith("..") || rel === "") return undefined;
      return rel;
    }
  }
  return undefined;
}

/** The base docs layer — the same answer `compose-docs.ts` uses. */
function baseDocs(repo: string): string {
  const base = docsLayers(repo).layers.find((l) => !l.repositoryScoped);
  if (base === undefined) throw new Error("no instance-scoped docs layer is declared");
  return base.dir;
}

const CSS = `
.xs-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.72rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.xs-ok{color:#0d6e5e}
.xs-na{color:#5b5f66}
.xs-missing{color:#a8200f}
.xs-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.xs-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.xs-stat b{display:block;font-size:1.25rem;line-height:1.2}
.xs-stat span{font-size:.75rem;opacity:.75}
`;

/** WORDS, not only colour — the three states are the point of the column. */
const BADGE: Record<UsedByRow["state"], string> = {
  resolves: '<span class="xs-tag xs-ok">resolves</span>',
  "not-a-path": '<span class="xs-tag xs-na">not a path</span>',
  missing: '<span class="xs-tag xs-missing">not in this checkout</span>',
};

/** What each `use` value claims, in one line, so the column is readable. */
const USE_MEANS: Record<string, string> = {
  conforms: "this repository's artefacts are valid against it",
  reads: "this repository parses documents written in it",
  cites: "it is referenced, and nothing here is validated against it",
};

function cell(v: string): string {
  return v.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

export function page(
  specs: readonly ExternalSchema[],
  used: ReadonlyMap<string, UsedByRow[]>,
  inUse: readonly string[],
): string {
  const all = [...used.values()].flat();
  const missing = all.filter((r) => r.state === "missing");
  const undeclared = undeclaredNamespaces(inUse, specs);
  const unused = unusedNamespaces(inUse, specs);
  const terms = specs.reduce((n, s) => n + s.terms.length, 0);

  const b: string[] = [
    "---",
    'title: "External schemas"',
    'description: "The specifications this repository depends on — the edition of each, what would move if one bumped, and the terms it actually branches on."',
    "---",
    `<style>${CSS}</style>`,
    "",
    "A specification here is **referenced, not held**: the edition is named and",
    "the terms this repository actually acts on are materialised into the graph,",
    "but the document itself stays at the authority. That split is the owner's:",
    "*\"dont need to materalize, but should reference specific version being",
    'used"*, and *"some schema that is operational should be in KG"*.',
    "",
    "So each record answers three questions — **which edition**, **what here",
    "depends on it**, and **which of its terms this repository branches on**.",
    "",
    '<div class="xs-grid">',
    `<div class="xs-stat"><b>${specs.length}</b><span>specifications</span></div>`,
    `<div class="xs-stat"><b>${terms}</b><span>operative terms in the graph</span></div>`,
    `<div class="xs-stat"><b>${all.length}</b><span>declared dependents</span></div>`,
    `<div class="xs-stat"><b>${missing.length}</b><span>dependents that no longer resolve</span></div>`,
    "</div>",
    "",
    "## The specifications",
    "",
    "| specification | authority | edition | how it is used |",
    "|---|---|---|---|",
  ];

  for (const s of specs) {
    b.push(
      `| **[${cell(s.title)}](#${s.id})**<br>\`${cell(s.id)}\` | ${cell(s.authority)} | ` +
        `[${cell(s.version)}](${s.specUrl}) | \`${cell(s.use)}\` — ${cell(USE_MEANS[s.use] ?? "")} |`,
    );
  }

  b.push(
    "",
    "## Does every declared dependent still exist?",
    "",
    "`usedBy` is the blast radius of a version bump, and it is hand-written. A",
    "path that has since been renamed leaves the record claiming a dependency",
    "that is not there — which reads as a resolved reference in every listing,",
    "the same way a dangling citation does one graph over.",
    "",
    "**Three states, and the middle one is not a finding.** A glob or a path with",
    "a note after it names something this cannot open and is written that way on",
    "purpose; reporting it as broken would teach a reader to ignore the column.",
    "",
  );

  if (missing.length === 0) {
    b.push(
      `Every one of the **${all.filter((r) => r.state === "resolves").length}** entries spelled as a path`,
      `resolves in this checkout. **${all.filter((r) => r.state === "not-a-path").length}** name a set or`,
      "carry a note and were not checked.",
      "",
    );
  } else {
    b.push(
      `**${missing.length} of ${all.length} do not.**`,
      "",
      "| specification | declared dependent |",
      "|---|---|",
      ...specs.flatMap((s) =>
        (used.get(s.id) ?? [])
          .filter((r) => r.state === "missing")
          .map((r) => `| \`${cell(s.id)}\` | \`${cell(r.entry)}\` |`),
      ),
      "",
    );
  }

  // Reported either way. "Nothing undeclared" and "the reconciliation did not
  // run" are different facts, and a section that appeared only on a finding
  // could not tell them apart.
  b.push("## Namespaces the corpus uses against the ones it declares", "");
  b.push(
    `Read from the BPMN and DMN files themselves — **${inUse.length}** namespace IRI(s)`,
    "are in use. Derived rather than listed, so a diagram that adopts a new",
    "vocabulary shows up here instead of going unnoticed.",
    "",
  );
  if (undeclared.length === 0) {
    b.push("Every namespace the corpus declares is covered by a record above.", "");
  } else {
    b.push(
      `**${undeclared.length} in use and not declared here** — a vocabulary this`,
      "repository writes and has said nothing about.",
      "",
      ...undeclared.map((n) => `- \`${cell(n)}\``),
      "",
    );
  }
  if (unused.length > 0) {
    b.push(
      `**${unused.length} declared and not in use.** Not a defect on its own: a`,
      "record may cover a namespace only some artefacts carry. It is here because",
      "a registry nobody prunes is one that stops describing the repository.",
      "",
      ...unused.map((n) => `- \`${cell(n)}\``),
      "",
    );
  }

  b.push("## Each specification", "");
  for (const s of specs) {
    const rows = used.get(s.id) ?? [];
    b.push(
      // The id rides ON the heading (kramdown IAL) rather than on an anchor
      // beside it: kramdown also mints a heading id from the title, and when
      // the slug of the title equals this one — "HL7 FHIR" and \`hl7-fhir\` —
      // the page carried the id twice (bean \`uknu\`).
      `### ${cell(s.title)} {#${s.id}}`,
      "",
      `\`${cell(s.id)}\` — ${cell(s.authority)}, edition [${cell(s.version)}](${s.specUrl}) — ` +
        `\`${cell(s.use)}\`, meaning ${cell(USE_MEANS[s.use] ?? "")}.`,
      "",
      "**Namespaces.**",
      "",
      ...s.namespaces.map((n) => `- \`${cell(n)}\``),
      "",
    );
    if (s.note) b.push(`**Note.** ${cell(s.note)}`, "");

    b.push("**What depends on it.**", "", "| entry | |", "|---|---|");
    for (const r of rows) b.push(`| \`${cell(r.entry)}\` | ${BADGE[r.state]} |`);
    b.push("");

    if (s.terms.length === 0) {
      // A DETERMINED ZERO, said as one. `omg-dd-1.0` declares no operative
      // terms because this repository conforms to DD without branching on any
      // of its elements — which is a different fact from a record nobody has
      // filled in, and an empty table would render them alike.
      b.push(
        "**No operative terms.** This repository conforms to the specification",
        "without branching on any of its terms, so none is materialised into the",
        "graph. That is a determined zero, not an unfilled field.",
        "",
      );
    } else {
      b.push(
        `**Operative terms (${s.terms.length}).** The terms this repository acts on —`,
        "derived by the tooling from the corpus, never hand-listed, and deliberately",
        "a subset of the edition rather than a transcription of it.",
        "",
        "| term | what it means here |",
        "|---|---|",
        ...s.terms.map((t) => `| \`${cell(t.term)}\` | ${cell(t.operative)} |`),
        "",
      );
    }
  }

  return b.join("\n").trimEnd() + "\n";
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const specs = loadSpecs();

  if (specs.length === 0) {
    // The third state above the page's own three: the registry was not found
    // or is empty. Refuse rather than publish a page that says zero, which is
    // what a graph nobody located looks like from the outside.
    console.error("::error::gen-external-schemas-viz: the external-schema registry yielded no records");
    process.exit(2);
  }

  const PAGE = pageRelPath(REPO);
  if (PAGE === undefined) {
    console.error(`::error::gen-external-schemas-viz: no visualiser declared for graph kind '${KIND}'`);
    process.exit(1);
  }

  const used = usedByRows(specs);
  const rendered = page(specs, used, namespacesInUse());
  const out = join(baseDocs(REPO), PAGE);

  if (check) {
    const current = existsSync(out) ? readFileSync(out, "utf-8") : "";
    if (current !== rendered) {
      console.error(
        `::error::gen-external-schemas-viz: ${PAGE} is stale — run \`bun run external-schemas:viz\``,
      );
      process.exit(1);
    }
    console.log(`✓ external-schemas viewer is current — ${specs.length} specification(s)`);
  } else {
    mkdirSync(join(out, ".."), { recursive: true });
    writeFileSync(out, rendered);
    const flat = [...used.values()].flat();
    console.log(`external-schemas viewer: ${specs.length} specification(s) → ${PAGE}`);
    console.log(
      `  ${flat.filter((r) => r.state === "resolves").length} dependent(s) resolve, ` +
        `${flat.filter((r) => r.state === "not-a-path").length} not checkable, ` +
        `${flat.filter((r) => r.state === "missing").length} missing`,
    );
  }
}
