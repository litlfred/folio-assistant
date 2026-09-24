#!/usr/bin/env bun
/**
 * Render the `external-schema` graph — which specifications this repository
 * depends on, at which edition, and what in it would move if one bumped.
 *
 * @module cat-harness/scripts/gen-external-schemas-viz
 * @covers external-schema
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
 * ## The one thing this adds: who DECLARES each specification
 *
 * What depends on a specification is the blast radius of a version bump. It
 * was a hand-written `usedBy` list on each record until bean `u63y` — the
 * specification naming its dependents, 36 entries nothing kept current. Now
 * each user declares the spec (`scripts/spec-users.ts`): a `@conformsTo` tag,
 * a `conformsTo:` front-matter list, an `xmlns` binding, or — for a graph
 * kind's files — the declaration of the module that types them. The page
 * lists those, and a declaration naming a spec no record has is a finding.
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
import { specUsers, type SpecUse, type SpecUseForm, type SpecUsers } from "./spec-users.js";
import { BASE_GRAPH_KINDS } from "../schemas/graph-kind-registry.js";
import {
  undeclaredNamespaces,
  unusedNamespaces,
  type ExternalSchema,
} from "../../folio-assistant-core/schemas/external-schema.js";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(INSTANCE_ROOT, "..");

/** The graph kind this renders. A KIND, never a path. */
const KIND = "external-schema";

/** Every declared user of every spec, read from the users (bean `u63y`). */
export function declaredUsers(specs: readonly ExternalSchema[], repoRoot = REPO): SpecUsers {
  const ls = Bun.spawnSync(["git", "ls-files"], { cwd: repoRoot });
  const files = new TextDecoder().decode(ls.stdout).split("\n").filter(Boolean);
  return specUsers(repoRoot, files, specs, BASE_GRAPH_KINDS, "cat-harness");
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

/** How a user declared the spec, in words. */
const FORM: Record<SpecUseForm, string> = {
  tag: "`@conformsTo` tag",
  "front-matter": "`conformsTo:` front matter",
  xmlns: "`xmlns` binding",
  kind: "through the module that types it",
};

/** What each `use` value claims, in one line, so the column is readable. */
const USE_MEANS: Record<string, string> = {
  conforms: "this repository's artefacts are valid against it",
  reads: "this repository parses documents written in it",
  cites: "it is referenced, and nothing here is validated against it",
};

/**
 * One row per `xmlns` directory rather than per diagram — `processes/*.bpmn`
 * is how a reader thinks of 70 files that all bind BPMN — and the rest as-is.
 */
function collapse(uses: readonly SpecUse[]): SpecUse[] {
  const out: SpecUse[] = [];
  const dirs = new Map<string, number>();
  for (const u of uses) {
    if (u.form !== "xmlns") {
      out.push(u);
      continue;
    }
    const dir = u.user.slice(0, u.user.lastIndexOf("/") + 1);
    const ext = u.user.slice(u.user.lastIndexOf("."));
    const key = `${dir}*${ext}`;
    dirs.set(key, (dirs.get(key) ?? 0) + 1);
  }
  for (const [glob, n] of [...dirs].sort()) out.push({ spec: "", user: `${glob} (${n})`, form: "xmlns" });
  return out.sort((a, b) => a.user.localeCompare(b.user));
}

function cell(v: string): string {
  return v.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

export function page(
  specs: readonly ExternalSchema[],
  users: SpecUsers,
  inUse: readonly string[],
): string {
  // One row per user and spec; a `.bpmn` per diagram would bury the rest, so
  // `xmlns` users are counted per directory.
  const bySpec = new Map<string, SpecUse[]>();
  for (const u of users.uses) bySpec.set(u.spec, [...(bySpec.get(u.spec) ?? []), u]);
  const undeclaredSpecs = specs.filter((s) => !bySpec.has(s.id));
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
    `<div class="xs-stat"><b>${users.uses.length}</b><span>declared uses</span></div>`,
    `<div class="xs-stat"><b>${users.unknown.length}</b><span>declarations naming no record</span></div>`,
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
    "## Who declares each specification",
    "",
    "A user declares the specification it depends on; the record names no user.",
    "That is data-modelling step 8 — the dependent holds the pointer — and it is",
    "why this list cannot drift from the code: a file that stops declaring stops",
    "being listed. Four forms are read: a `@conformsTo` tag, a `conformsTo:`",
    "front-matter list, an `xmlns` binding, and a graph kind whose typing module",
    "declares the spec (bean `u63y`).",
    "",
  );
  if (users.unknown.length > 0) {
    b.push(
      `**${users.unknown.length} declaration(s) name a specification no record has.**`,
      "",
      "| user | names |",
      "|---|---|",
      ...users.unknown.map((u) => `| \`${cell(u.user)}\` | \`${cell(u.spec)}\` |`),
      "",
    );
  } else {
    b.push("Every declaration names a record on this page.", "");
  }
  if (undeclaredSpecs.length > 0) {
    b.push(
      `**${undeclaredSpecs.length} record(s) nothing declares.** A version bump would move nothing that says so:`,
      "",
      ...undeclaredSpecs.map((s) => `- [\`${cell(s.id)}\`](#${s.id})`),
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
    const rows = collapse(bySpec.get(s.id) ?? []);
    b.push(
      // The record id IS the heading's id (kramdown `{#…}`), one element. A
      // separate `<a id>` beside the heading collided with kramdown's own slug
      // whenever a title slugified to its id: "HL7 FHIR" -> `hl7-fhir`, twice
      // on one page. `check:duplicate-ids` caught it on the staged site
      // (bean `uknu`); the other records only escaped by their wording.
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

    if (rows.length === 0) {
      b.push("**What depends on it.** Nothing here declares it.", "");
    } else {
      b.push("**What depends on it.**", "", "| user | declared by |", "|---|---|");
      for (const r of rows) b.push(`| \`${cell(r.user)}\` | ${FORM[r.form]}${r.via ? ` (\`${cell(r.via)}\`)` : ""} |`);
      b.push("");
    }

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

  const users = declaredUsers(specs);
  const rendered = page(specs, users, namespacesInUse());
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
    console.log(`external-schemas viewer: ${specs.length} specification(s) → ${PAGE}`);
    console.log(`  ${users.uses.length} declared use(s), ${users.unknown.length} naming no record`);
  }
}
