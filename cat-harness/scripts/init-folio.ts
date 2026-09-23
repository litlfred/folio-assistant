#!/usr/bin/env bun
/**
 * Scaffold a new folio in an empty (or existing) repository.
 *
 * ## The problem this solves
 *
 * folio-assistant is the platform; a folio is the content repo that uses it.
 * Standing one up by hand means knowing six conventions that were only ever
 * written down implicitly: where the document manifest lives and that it must
 * be named after its own directory, that block manifests import builders
 * through a `folio/schema/` shim, that `harness.config.json` selects the
 * adapter, that `AGENTS.md` is the agent-generic entry point with `CLAUDE.md`
 * and `GEMINI.md` as stubs, that `beans/` is the work plan, and that the
 * folio-assistant checkout has to be reachable from the shim's relative path.
 *
 * Getting any one of them wrong produces a repo that looks right and renders
 * nothing. This writes all of them together, so the first thing an author does
 * in a fresh folio is add a chapter rather than debug a layout.
 *
 * ## What it does NOT do
 *
 * It writes no subject matter. The starter block says what a block is; it does
 * not say anything about the folio's topic, because that is the author's to
 * write and a scaffolder that guesses at it produces content nobody asked for
 * that then has to be deleted.
 *
 * Usage:
 *   bun run cat-harness/scripts/init-folio.ts --dir . --type document --slug my-guidance \
 *       --title "My Guidance Note" --author "A. Author"
 *
 *   bun run cat-harness/scripts/init-folio.ts --help
 *
 * @module scripts/init-folio
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { instanceConfigFilename } from "../schemas/harness-config";
import { instanceDeclarationFilename } from "../schemas/cat-harness";
import { materialiseDeclaredDirectories } from "../schemas/harness-config";
import {  } from "../schemas/cat-harness";
import { relative, dirname, join, resolve } from "path";
import { spawnSync } from "child_process";

/** The upstream this folio pins its platform to. */
export const FOLIO_ASSISTANT_REPO = "https://github.com/litlfred/folio-assistant.git";

/**
 * How the folio reaches its folio-assistant checkout.
 *
 * - `submodule` — pinned at `folio-assistant/` inside the folio. Default,
 *   because it makes the folio reproducible: a clone with `--recurse-submodules`
 *   gets the exact platform revision the content was authored against, and the
 *   builder-shim path is the same on every machine.
 * - `sibling` — a checkout beside the folio, reached by a relative path.
 *   Right when one working copy of the platform serves several folios, or when
 *   you are developing the platform and the folio together.
 */
export type LinkMode = "submodule" | "sibling";

export interface InitFolioOptions {
  /** Folio repo root to scaffold into. */
  targetDir: string;
  /** Content type — selects the adapter and the profile. */
  contentType: "paper" | "document";
  // declared-path-literal: the folio content root. Resolving it through `directoryForGraph` is bean `hs08`; the harness-side callers hit `ot9a`'s layering boundary, so the literal is COUNTED here rather than hidden.
  /** Document slug: the directory under `folio/` and the manifest's name. */
  slug: string;
  title: string;
  authors: string[];
  link: LinkMode;
  /**
   * Path to the folio-assistant checkout, relative to the folio root.
   * Defaults to `folio-assistant` (submodule) or `../folio-assistant` (sibling).
   */
  assistantPath?: string;
  /** Overwrite files that already exist. Off by default. */
  force?: boolean;
  /** Report what would be written without writing it. */
  dryRun?: boolean;
  /** Skip `git submodule add` / `git init`. */
  skipVcs?: boolean;
}

export interface InitFolioResult {
  created: string[];
  /** Files left alone because they already existed and `force` was not set. */
  skipped: string[];
  /** Anything the caller needs to act on — a failed submodule add, a next step. */
  notes: string[];
}

/** A slug that is safe as a directory name, a TS module name and a URL path. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

const RESERVED_SLUGS = new Set(["schema", "pipeline", "node_modules", "build"]);

/**
 * Where the platform's code sits INSIDE its checkout.
 *
 * Bean `b963`. `init-folio` wrote `${assistant}/src/index.ts`,
 * `${assistant}/scripts/session-start-coord-sweep.sh` and
 * `${assistant}/viewer` — nine sites, all of them correct before the split and
 * none of them afterwards, because the repository's code moved under
 * `cat-harness/` while `assistant` still names the CHECKOUT root.
 *
 * **Measured 2026-09-20, and this is the reason it matters more than nine
 * edits:** two of the nine are the new folio's `.mcp.json` and its
 * `SessionStart` hook. So every folio scaffolded since the split got an MCP
 * server that cannot start and a hook that silently does nothing — the same
 * defect that had killed this repository's own session-start sweep, reproduced
 * in the one place that hands it to every downstream repository at once. A
 * failing hook looks exactly like a hook with nothing to say.
 *
 * Written down ONCE, for the reason `AGENTS.md` gives for the builder shim:
 * the path to the platform is a fact with one home, so the next relocation is
 * a one-line edit rather than a nine-site sweep that misses two.
 */
const HARNESS_SUBDIR = "cat-harness";

/** The platform's code root, from the checkout root a folio links it at. */
function platformDir(assistant: string): string {
  return `${assistant}/${HARNESS_SUBDIR}`;
}

// ── Templates ────────────────────────────────────────────────────

/**
 * The instance DECLARATION — `harness.json`, and the reason the config beside
 * it has the name it has.
 *
 * Writing `<slug>.config.json` without this was a `dh4f` in miniature: the
 * file is on disk, and every reader answers "no config". A config filename is
 * composed from the instance's NAME, and a name is something a directory only
 * has by declaring one — `resolveHarnessConfigPath` refuses to guess a global
 * filename back into existence, which is correct and which leaves an
 * undeclared scaffold unconfigured in a way nothing reports.
 *
 * `directories` declares `folio/` and nothing else, which is not minimalism
 * for its own sake. A folio's content root is the one directory the scaffold
 * both CREATES and OWNS, and it is the only one whose meaning a dependent
 * cannot get from anywhere else. `uploads/`, `library/`, `beans/` and the
 * rest arrive two other ways — inherited from folio-assistant, which declares
 * them `dependents: "reproduce"`, and present in the conventional set — and
 * restating them here would be the same fact in two places, free to drift.
 *
 * Writing `directories: []` instead is a trap, and it is worth naming because
 * it looks like the humbler choice. `ownDirectories` falls back to
 * `DEFAULT_DIRECTORIES` only for a root with **no declaration at all**; an
 * empty array is a declaration that the instance owns nothing, so adding a
 * name would silently withdraw every convention the scaffold had before it.
 */
/**
 * The scaffolded instance's DECLARATION — `<slug>.json`.
 *
 * TWO files again since 2026-09-21. The history is worth keeping because both
 * transitions broke this function:
 *
 * 1. `harness.json` + `<slug>.config.json` — two files, two names.
 * 2. Excised into one `<slug>.config.json`, at which point the two writers
 *    targeted the SAME path and the config silently overwrote the
 *    declaration; a scaffolded folio came out with no `directories` at all.
 * 3. The owner split them again, giving each its own name, so the collision
 *    that forced the merge cannot recur: `<slug>.json` declares, and
 *    `<slug>.config.json` configures.
 *
 * `name` is what makes this file a declaration rather than a plain config, and
 * the filename stem must equal it — `findDeclarationFile` checks exactly that.
 */
function instanceDeclaration(o: InitFolioOptions): string {
  return JSON.stringify(
    {
      name: o.slug,
      title: o.title,
      directories: [
        {
          id: "folio",
          // declared-path-literal: THE BASE CASE, same as `DEFAULT_DIRECTORIES`.
          // This line IS the declaration being written; there is nothing to
          // read it from in a repository that does not exist yet.
          path: "folio/",
          dependents: "reproduce",
          graphKinds: ["folio"],
          description: `The content of ${o.title} — its document, chapters and blocks.`,
        },
      ],
    },
    null,
    2,
  ) + "\n";
}

/** The scaffolded instance's CONFIG — `<slug>.config.json`, beside its declaration. */
function instanceConfig(o: InitFolioOptions, assistant: string): string {
  return JSON.stringify(
    {
      contentType: o.contentType,
      adapter: o.contentType,
      adapterModule: `./${platformDir(assistant)}/adapters/${o.contentType}/index.ts`,
      feedbackDir: ".folio-feedback",
      skills: ".claude/skills/local",
      viewer: { dir: `${platformDir(assistant)}/viewer`, port: 8080 },
      // `blob` rather than `pages`: it is the only link style that resolves
      // for a PRIVATE folio, and a folio is private by default. Switching to
      // `pages` once a public Pages site exists is a one-word edit; a README
      // full of unreachable github.io URLs is not something the author finds
      // out about, because it renders fine for them.
      readme: { linkStyle: "blob", publishRef: "gh-pages" },
    },
    null,
    2,
  ) + "\n";
}

/**
 * The builder shim every block manifest imports through.
 *
 * A shim rather than a direct relative import from each block, because blocks
 * live at `folio/<slug>/<chapter>/` and would otherwise each spell out
 * `../../../<assistant>/schemas/builders` — a path that changes for any block
 * nested one level differently, and for every folio that links the platform
 * differently. One file holds the coupling; moving the platform is a one-line
 * edit here rather than a sweep over the whole corpus.
 */
function builderShim(assistant: string): string {
  return `/**
 * Re-export of folio-assistant's content-object builders.
 *
 * Every block, chapter and document manifest in this folio imports from here
 * rather than reaching into the platform directly, so the path to
 * folio-assistant is written down exactly once. If you move or re-link the
 * platform checkout, edit this file and \`types.ts\` beside it — nothing else.
 *
 * Generated by \`folio_init\`. Safe to edit; not regenerated.
 */

export * from "../../${platformDir(assistant)}/schemas/builders";
`;
}

function typesShim(assistant: string): string {
  return `/**
 * Re-export of folio-assistant's content-object types. See \`builders.ts\`.
 *
 * Generated by \`folio_init\`. Safe to edit; not regenerated.
 */

export type * from "../../${platformDir(assistant)}/schemas/types";
`;
}

function documentManifest(o: InitFolioOptions): string {
  const authors = o.authors.map((a) => JSON.stringify(a)).join(", ");
  return `import { paper, chapterRef } from "../schema/builders";

/**
 * ${o.title}
 *
 * The document manifest. \`chapters\` is an ORDERED list — its order is the
 * reading order, and it is the only place that order is recorded. To move a
 * chapter, move its entry here; never rename the directory to encode position,
 * because labels, uses[], feedback and QA sidecars all key on names.
 */
export default paper({
  title: ${JSON.stringify(o.title)},
  authors: [${authors}],
  date: new Date().toISOString().slice(0, 10),
  chapters: [
    chapterRef({ dir: "introduction" }),
  ],
});
`;
}

function chapterManifest(): string {
  return `import { chapter, section } from "../../schema/builders";

/**
 * The chapter manifest.
 *
 * A block reaches the rendered document IFF some section's \`blocks\` names it.
 * Writing \`<root>.ts\` and \`<root>.md\` is not enough — a block nobody lists
 * renders nowhere and is swept by nothing. Adding the name here is part of
 * adding a block, not a follow-up.
 */
export default chapter({
  title: "Introduction",
  label: "chap:introduction",
  tabLabel: "I",
  sections: [
    section({
      title: "Overview",
      label: "sec:overview",
      blocks: ["overview"],
    }),
  ],
});
`;
}

function starterBlockManifest(): string {
  return `import { prose } from "../../schema/builders";

export default prose({
  label: "prose:overview",
  title: "Overview",
  // Blocks a reader must already have read to follow this one. Editorial
  // judgement, direct neighbours only — never derived, never the transitive
  // closure. This block is first, so it has none.
  uses: [],
});
`;
}

function starterBlockBody(o: InitFolioOptions): string {
  const kinds =
    o.contentType === "document"
      ? "`prose`, `example`, `remark`, `algorithm`, `simulator`, `equation`, `diagram`, `table`"
      : "the eight document kinds plus `definition`, `theorem`, `lemma`, " +
        "`proposition`, `corollary`, `conjecture` and `proof`";
  return `This is the first block of ${o.title}. Replace this text with the real
opening — this file is a placeholder, not content.

A **block** is the unit of authorship, review, feedback and QA in a folio. It
is two files that share a root name: \`overview.ts\` holds the metadata (kind,
label, title, \`uses[]\`) and \`overview.md\` holds the prose you are reading.
They are separate so a reviewer's diff is over the writing, not the manifest.

The kinds this folio may use are ${kinds}.

Ask your agent to *add a chapter* or *add a section on X*, and it will write
the manifests and wire them up. Run \`content_validate\` when you want to know
whether the corpus is sound.
`;
}

function agentsMd(o: InitFolioOptions, assistant: string): string {
  const isDoc = o.contentType === "document";
  return `# AGENTS.md — ${o.title}

This is a **folio**: the content repository. The authoring platform —
skills, schemas, MCP tools, the publication pipeline — is
[folio-assistant](${FOLIO_ASSISTANT_REPO}), checked out at \`${assistant}/\`.

This file is the **agent-generic** source of truth, read natively by Claude
Code, Gemini CLI, Antigravity, Cursor and Copilot. \`CLAUDE.md\` and
\`GEMINI.md\` are thin stubs pointing here.

> **Content lives here; formalism lives in the platform.** If you are about to
> add a schema, a validator, a QA criterion or a skill, it belongs in
> folio-assistant, not in this repo. If you are about to add a chapter, a
> recommendation or a table, it belongs here.

## Content type: \`${o.contentType}\`

${
  isDoc
    ? `A **document** folio: structured prose — policy guidance, a standard, a
report, a handbook. No Lean formalization, and no TeX installation required to
publish.

**Block kinds you may use:** \`prose\`, \`example\`, \`remark\`, \`algorithm\`,
\`simulator\`, \`equation\`, \`diagram\`, \`table\`.

**Kinds you may NOT use:** \`definition\`, \`theorem\`, \`lemma\`,
\`proposition\`, \`corollary\`, \`conjecture\`, \`proof\`. Those are the paper
profile — their assertion is a formal mathematical claim backed by a \`.lean\`
sibling, and this folio has no toolchain to check one. \`content_validate\`
enforces this on every run.

Reaching for \`theorem\` to carry a recommendation is the common mistake. Load
the \`normative-statements\` skill instead.`
    : `A **paper** folio: structured prose whose mathematics is backed by
machine-checked Lean 4 and rendered through LaTeX. Every kind is available,
including the seven whose assertion is a formal claim.

A paper is a document plus those kinds — so the document skills apply here too,
and the Markdown render path (\`document_render_md\`, \`document_render_html\`)
works on a machine with no TeX, which is the usual case while drafting.`
}

## Layout

\`\`\`
folio/${o.slug}/          the document
  ${o.slug}.ts             its manifest — chapters, in reading order
  <chapter>/<chapter>.ts   a chapter manifest — sections, in reading order
  <chapter>/<root>.ts      a block manifest
  <chapter>/<root>.md      that block's prose
  <chapter>/<root>.qa.json QA sidecar (machine-written — never hand-edit)
folio/schema/            re-export shim for the platform's builders
library/                   ingested source documents (read-only reference)
uploads/                   source PDFs, for offline citation verification
${assistant}/              the platform
beans/                    the work plan
\`\`\`

## Commands

\`\`\`sh
bun run ${platformDir(assistant)}/src/index.ts --stdio --repo .   # the MCP server
bun run ${platformDir(assistant)}/src/index.ts --check-deps       # what's installed
\`\`\`

## Work plan — use \`beans\`

\`beans/\` is committed, so the plan survives a fresh container and a sibling
session sees it. Claim before you work; never resolve a sibling's bean.

\`\`\`sh
${platformDir(assistant)}/scripts/install-beans.sh
beans list
beans create "<title>"
beans <id> --status in-progress
\`\`\`

**Check before you create** — \`beans create\` is not idempotent and dedupes on
nothing, so re-entering a step duplicates the plan rather than no-op'ing.

## The skills are in the platform, not here

Ask for them by name and the agent loads them over MCP (\`skill_fetch\`):

| Package | What |
|---|---|
| \`folio-core\` | content-agnostic: bean coordination, editorial review, QA |
${
  isDoc
    ? "| `folio-document-adapter` | `document-authoring`, `document-structure`, `normative-statements`, `document-publishing` |"
    : "| `folio-document-adapter` | structure and prose authoring — applies to papers too |\n| `folio-paper-adapter` | Lean generation, proof review, LaTeX build, formalization audits |"
}

Do not copy a skill body into this repo. It will drift, and the platform's copy
is the one every other folio is reading.
`;
}

function mcpJson(assistant: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        "folio-assistant": {
          command: "bun",
          args: ["run", `${platformDir(assistant)}/src/index.ts`, "--stdio", "--repo", "."],
        },
      },
    },
    null,
    2,
  ) + "\n";
}

function claudeSettings(assistant: string): string {
  return JSON.stringify(
    {
      hooks: {
        SessionStart: [
          {
            matcher: "*",
            hooks: [
              {
                type: "command",
                command: `${platformDir(assistant)}/scripts/session-start-coord-sweep.sh`,
              },
            ],
          },
        ],
      },
    },
    null,
    2,
  ) + "\n";
}

function gitignore(o: InitFolioOptions): string {
  return `# Build output
build/
_site/
.folio-feedback/
node_modules/

# Generated QA reports
bib-qa.json

# Editor / OS
.DS_Store
*.swp
${o.contentType === "paper" ? "\n# Lean build artifacts\n.lake/\n*.olean\n" : ""}`;
}

/**
 * The folio's before/after preview: a caller of the platform's reusable
 * `folio-staging.yml` (bean `ojcx`). Without it a folio in its own repository
 * gets no STAGING build, and a reviewer has no "after" to compare.
 *
 * **A document folio gets it ON**, building with the platform's
 * `build-document-site.ts` (bean `fyu2`). That command was rehearsed end to
 * end on a folio this function scaffolds: site, ChangeSet and banner.
 *
 * **A paper folio gets it OFF**: dispatch-only, with a build step that
 * refuses. A paper builds through `publish.yml` (LaTeX, a folio-supplied
 * builder image), and the site a reviewer should see from that is the
 * folio's to name. A guessed command would publish a preview built by
 * something the author never chose.
 */
function stagingWorkflow(assistant: string, contentType: InitFolioOptions["contentType"]): string {
  const on = contentType === "document";
  const build = on
    ? `bun run ${assistant}/cat-harness/scripts/build-document-site.ts --out _site`
    : `echo "::error::set build_command in .github/workflows/staging.yml to build this folio''s site" && exit 1`;
  const header = on
    ? `# The site is built by the platform's build-document-site.ts: one page per
# document, with an anchor on every labelled block.`
    : `# TO ENABLE (a paper folio builds through publish.yml, so its site is yours
# to name):
#   1. Set build_command below to the command that builds this folio's site.
#   2. Uncomment the pull_request trigger.
# Until then it runs only when dispatched, and the build step refuses.`;
  // `issue_comment` refreshes the preview's review comments when a reviewer
  // writes one (bean 423d, the `review-comments` skill). The reusable
  // workflow's `comments` job runs only on it, and checks out no PR code.
  const trigger = on
    ? `  pull_request:
    types: [opened, synchronize, reopened]
  issue_comment:
    types: [created, edited]
  workflow_dispatch:`
    : `  workflow_dispatch:
  # pull_request:
  #   types: [opened, synchronize, reopened]
  # issue_comment:
  #   types: [created, edited]`;
  return `name: Staging preview

# A before/after preview of this folio for every pull request, published to
# STAGING/<branch>/ on gh-pages, with the ChangeSet (what changed, block by
# block) beside it. The mechanics live in the platform's reusable workflow.
#
${header}

on:
${trigger}

# What the reusable workflow needs, and no more: publish the preview, comment
# on the pull request, and read its comments for the review page.
permissions:
  contents: write
  pull-requests: write
  issues: read

jobs:
  staging:
    uses: litlfred/folio-assistant/.github/workflows/folio-staging.yml@main
    with:
      build_command: '${build}'
      site_dir: _site
      folio_dir: folio
      platform_dir: ${assistant}
`;
}

/**
 * The folio's todos graph: people's outstanding items, and FEEDBACK raised
 * against a block. Bean `423d`.
 *
 * `feedback` (graph kind `todo-feedback`) is where a review-process task
 * commits a reviewer's comment when it decides what happens to it
 * (`folio-review-comment-move`, on the edit-set's feature branch, per the
 * owner's ruling). Without the declaration the first recorded decision on a
 * new folio stops with "declares no directory of graph kind todo-feedback",
 * so a folio gets it from the start.
 *
 * `verdicts` (graph kind `review-verdicts`) is where the review coordinator
 * commits reviewers' per-block verdicts (`folio-review-coverage --commit`,
 * bean `px0t`). Declared from the start for the same reason.
 *
 * No `defaultTheme`: a folio's own theme is the folio's to choose, and a
 * literal here would impose one on every new folio.
 */
function todosGraph(slug: string): string {
  return JSON.stringify(
    {
      name: slug,
      directories: [
        {
          id: "items",
          path: "items",
          graphKinds: ["todo-items"],
          description: "One Markdown file per todo, carrying `$schema: folio-todo/v1` in its front matter: a person's outstanding item.",
        },
        {
          id: "feedback",
          path: "feedback",
          graphKinds: ["todo-feedback"],
          description:
            "Todos raised against a specific block. Review comments land here as `folio-review-comment/v1` JSON, committed on the edit-set's feature branch by the review-process task that decided them (the `review-comments` skill).",
        },
        {
          id: "verdicts",
          path: "verdicts",
          graphKinds: ["review-verdicts"],
          description:
            "Reviewers' per-block verdicts, one `folio-review-verdict/v1` JSON each, pinned to the block's hash and committed on the edit-set's feature branch by the review coordinator (`folio-review-coverage --commit`).",
        },
      ],
    },
    null,
    2,
  ) + "\n";
}

function beansYml(slug: string): string {
  return `beans:
    path: beans
    prefix: ${slug}-
    id_length: 4
    default_status: todo
    default_type: task
`;
}

/**
 * The folio's own README.
 *
 * Deliberately thin: the contents table is generated by `readme_toc` between
 * the two markers, and everything else is the author's to write. What matters
 * here is that the markers exist from the first commit.
 */
function folioReadme(o: InitFolioOptions): string {
  return `# ${o.title}

${o.authors.join(", ")}

<!-- Regions between a \`folio:*:begin\` / \`folio:*:end\` pair are generated:
     refresh them with \`readme_sync\` (MCP) or \`bun run readme:sync\` from the
     platform checkout. Edits inside a pair are overwritten; everything else in
     this file is yours and is never touched. \`bun run readme:sections\` lists
     the sections you can add. -->

## Contents

<!-- folio:toc:begin -->
<!-- folio:toc:end -->

## Workflows

<!-- folio:workflows:begin -->
<!-- folio:workflows:end -->
`;
}

function uploadsReadme(): string {
  return `# uploads/

Source PDFs and data files, one per cited work, for **offline citation
verification**. A reviewer checking a citation reads the file here rather than
chasing a URL that may have moved.

Name each file after the reference id it backs: \`uploads/<id>.pdf\`.

This is not the reference list — that is authored content. This directory is
the evidence behind it.
`;
}

function libraryReadme(): string {
  return `# library/

**Ingested** source documents — a guideline this folio adapts, a standard it
cites, a paper it builds on. Machine-extracted structure, not authored content.

\`\`\`
library/<doc-id>/
  structure.json        extracted document structure
  sections/<sid>.md     extracted section text
  candidates.json       extraction proposals
  manifest.jsonld       graph node for the document
\`\`\`

**Nothing here is folio content.** Every node carries
\`provenance: "ingested"\` and is attributed to its source, so a query can
always separate *what that document claims* from *what this folio claims*.
Promoting something into \`folio/\` is a separate, deliberate act — see the
platform's \`document-intake\` skill.
`;
}

// ── Writer ───────────────────────────────────────────────────────

function defaultAssistantPath(link: LinkMode): string {
  return link === "submodule" ? "folio-assistant" : "../folio-assistant";
}

/**
 * Scaffold the folio.
 *
 * Never overwrites without `force`, and reports what it left alone — running
 * it twice on a live folio must not silently replace an author's `AGENTS.md`
 * with the template.
 */
export function initFolio(options: InitFolioOptions): InitFolioResult {
  const o: InitFolioOptions = { ...options };
  const result: InitFolioResult = { created: [], skipped: [], notes: [] };

  if (!isValidSlug(o.slug)) {
    throw new Error(
      `Invalid slug '${o.slug}'. Use lowercase words joined by single hyphens ` +
      `(e.g. 'antenatal-care-guidance') — the slug is a directory name, a TS ` +
      `module name and a URL path at once.`,
    );
  }
  if (RESERVED_SLUGS.has(o.slug)) {
    throw new Error(
      `Slug '${o.slug}' is reserved: folio/${o.slug}/ has a platform meaning ` +
      `and would not be discovered as a document.`,
    );
  }
  if (o.authors.length === 0) {
    throw new Error("At least one author is required — the manifest's `authors` may not be empty.");
  }

  const root = resolve(o.targetDir);
  const assistant = o.assistantPath ?? defaultAssistantPath(o.link);

  const write = (relPath: string, content: string): void => {
    const full = join(root, relPath);
    if (existsSync(full) && !o.force) {
      result.skipped.push(relPath);
      return;
    }
    if (!o.dryRun) {
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content, "utf-8");
    }
    result.created.push(relPath);
  };

  if (!o.dryRun) mkdirSync(root, { recursive: true });

  // 1. Configuration and the platform link.
  // Named after the folio, not after the harness: the config the scaffold
  // writes is THIS instance's, and `folio_init` is where a new instance's
  // name first becomes a filename (2026-09-20).
  // The declaration comes FIRST, because it is what gives the next line's
  // filename a meaning. See `instanceConfig` above — ONE file now, its
  // declaration and its config, since `harness.json` was excised.
  write(instanceDeclarationFilename(o.slug), instanceDeclaration(o));
  write(instanceConfigFilename(o.slug), instanceConfig(o, assistant));
  write(".mcp.json", mcpJson(assistant));
  write(".claude/settings.json", claudeSettings(assistant));
  write(".gitignore", gitignore(o));
  write(".beans.yml", beansYml(o.slug));
  write(".github/workflows/staging.yml", stagingWorkflow(assistant, o.contentType));
  if (o.contentType !== "document") {
    result.notes.push(
      "Staging previews are wired but OFF: set build_command in .github/workflows/staging.yml " +
        "and uncomment its pull_request trigger. Until then there is no STAGING build to review.",
    );
  }
  // declared-path-literal: the scaffolder CREATES the layout. There is no
  // declaration to read in a repo that does not exist yet — this is the
  // write that makes one possible.
  write("beans/.gitkeep", "");
  // The todos graph, and both directories it declares: declaring a directory
  // that does not exist is the `dh4f` defect (a consumer scans nothing and
  // reports a clean run). declared-path-literal: scaffolding the layout, as above.
  write("todos/todos.json", todosGraph(o.slug));
  write("todos/items/.gitkeep", "");
  write("todos/feedback/.gitkeep", "");
  write("todos/verdicts/.gitkeep", "");

  // 2. The builder shim — the one place the platform path is written down.
  // declared-path-literal: the folio content root. Resolving it through `directoryForGraph` is bean `hs08`; the harness-side callers hit `ot9a`'s layering boundary, so the literal is COUNTED here rather than hidden.
  write("folio/schema/builders.ts", builderShim(assistant));
  // declared-path-literal: the folio content root. Resolving it through `directoryForGraph` is bean `hs08`; the harness-side callers hit `ot9a`'s layering boundary, so the literal is COUNTED here rather than hidden.
  write("folio/schema/types.ts", typesShim(assistant));

  // 3. The document, one chapter, one block.
  // declared-path-literal: the folio content root. Resolving it through `directoryForGraph` is bean `hs08`; the harness-side callers hit `ot9a`'s layering boundary, so the literal is COUNTED here rather than hidden.
  write(`folio/${o.slug}/${o.slug}.ts`, documentManifest(o));
  // declared-path-literal: the folio content root. Resolving it through `directoryForGraph` is bean `hs08`; the harness-side callers hit `ot9a`'s layering boundary, so the literal is COUNTED here rather than hidden.
  write(`folio/${o.slug}/introduction/introduction.ts`, chapterManifest());
  // declared-path-literal: the folio content root. Resolving it through `directoryForGraph` is bean `hs08`; the harness-side callers hit `ot9a`'s layering boundary, so the literal is COUNTED here rather than hidden.
  write(`folio/${o.slug}/introduction/overview.ts`, starterBlockManifest());
  // declared-path-literal: the folio content root. Resolving it through `directoryForGraph` is bean `hs08`; the harness-side callers hit `ot9a`'s layering boundary, so the literal is COUNTED here rather than hidden.
  write(`folio/${o.slug}/introduction/overview.md`, starterBlockBody(o));

  // 4. The two source-material directories.
  //
  // Written as READMEs rather than left to `materialiseDeclaredDirectories`
  // below because a new folio's author needs to be told what each stage is
  // FOR — the keep-marker exists to stop an empty directory vanishing, not to
  // explain a pipeline. The materialiser then covers whatever else this folio
  // inherits from the platform and does not have.
  // declared-path-literal: as above — scaffolding the layout a declaration
  // will describe, not reading one.
  write("uploads/README.md", uploadsReadme());
  // declared-path-literal: as above.
  write("library/README.md", libraryReadme());

  // 4b. The folio README, carrying the markers `readme_sync` writes between.
  // A section is written only where its markers already appear, so a folio
  // scaffolded without them would get nothing from the tool — and the markers
  // are also the documentation of which sections exist.
  write("README.md", folioReadme(o));

  // 5. Agent guidance: AGENTS.md is authoritative, the other two are stubs.
  write("AGENTS.md", agentsMd(o, assistant));
  write("CLAUDE.md", `# CLAUDE.md\n\nThis folio's agent guidance is maintained agent-generically in \`AGENTS.md\`.\n\n@AGENTS.md\n`);
  write("GEMINI.md", `# GEMINI.md\n\nThis folio's agent guidance is maintained agent-generically in \`AGENTS.md\`.\n\nSee [AGENTS.md](./AGENTS.md).\n`);

  // 6. Version control.
  const platformPresent = existsSync(join(root, assistant));
  if (!o.skipVcs && !o.dryRun) {
    linkPlatform(root, assistant, o, result);
  } else if (o.link === "submodule" && !platformPresent) {
    // Only when it is actually absent. Emitting this unconditionally told a
    // caller who had already added the submodule (and passed --skip-vcs
    // precisely because of that) to add it again.
    result.notes.push(`Add the platform: git submodule add ${FOLIO_ASSISTANT_REPO} ${assistant}`);
  }

  if (!existsSync(join(root, assistant))) {
    result.notes.push(
      `The builder shim in folio/schema/ points at '${assistant}', which does not exist yet. ` +
      `Nothing will import until the platform is there.`,
    );
  }

  // 7. Every directory this folio DECLARES or INHERITS, created if absent.
  //
  // Last, and after the platform link, because the inherited half of the answer
  // comes from walking the dependency tree — a folio whose platform is not
  // checked out yet inherits nothing, and this then correctly creates only what
  // the folio itself declares. Re-running `init-folio --force` re-runs this,
  // which is safe: it is idempotent and never overwrites a keep-marker.
  //
  // Placed here rather than left to the session-start sweep because the two
  // answer different moments and `AGENTS.md` is explicit that a resolver with
  // no caller is the defect to avoid — `resolveSkillDirs` has had none since it
  // was written, and `resolveDirectories` had none before this change.
  if (!o.dryRun) {
    for (const d of materialiseDeclaredDirectories(root)) {
      if (d.created) result.created.push(`${relative(root, d.absPath)}/`);
      if (d.markerWritten) result.created.push(relative(root, join(d.absPath, ".gitignore")));
    }
  }

  return result;
}

/**
 * Put the platform where `harness.config.json` says it is.
 *
 * Failure here is a **note, not an error**: every file this scaffolder writes
 * is already correct, and the remedy is one command the caller can run. Dying
 * on a network failure would leave a half-initialized repo and no record of
 * what remained to be done.
 */
function linkPlatform(
  root: string,
  assistant: string,
  o: InitFolioOptions,
  result: InitFolioResult,
): void {
  const isRepo = existsSync(join(root, ".git"));
  if (!isRepo) {
    const init = spawnSync("git", ["init"], { cwd: root, stdio: "pipe" });
    if (init.status === 0) result.notes.push("Initialized a git repository.");
    else {
      result.notes.push(`git init failed: ${init.stderr?.toString().trim() || "unknown error"}`);
      return;
    }
  }

  if (o.link === "sibling") {
    result.notes.push(
      `Linked as a sibling checkout at '${assistant}' — nothing to add to version control. ` +
      `Note that a fresh clone of this folio will not have it.`,
    );
    return;
  }

  if (existsSync(join(root, assistant))) {
    result.notes.push(`'${assistant}' already exists — left as is.`);
    return;
  }

  const add = spawnSync("git", ["submodule", "add", FOLIO_ASSISTANT_REPO, assistant], {
    cwd: root,
    stdio: "pipe",
    timeout: 300_000,
  });
  if (add.status === 0) {
    result.notes.push(`Added folio-assistant as a submodule at '${assistant}'.`);
  } else {
    result.notes.push(
      `Could not add the submodule (${add.stderr?.toString().trim().slice(0, 300) || "unknown error"}). ` +
      `Run it yourself: git submodule add ${FOLIO_ASSISTANT_REPO} ${assistant}`,
    );
  }
}

/** Render a result as the report a human or an agent reads. */
export function formatInitResult(result: InitFolioResult, o: InitFolioOptions): string {
  const lines = [
    `Initialized a ${o.contentType} folio: ${o.title}`,
    `  folio/${o.slug}/  ·  ${result.created.length} file(s) written`,
    "",
  ];
  for (const f of result.created) lines.push(`  + ${f}`);
  if (result.skipped.length) {
    lines.push("", `Left alone (already present — pass force to overwrite):`);
    for (const f of result.skipped) lines.push(`  = ${f}`);
  }
  if (result.notes.length) {
    lines.push("", "Notes:");
    for (const n of result.notes) lines.push(`  · ${n}`);
  }
  lines.push(
    "",
    "Next:",
    `  1. Edit folio/${o.slug}/introduction/overview.md — it is a placeholder.`,
    `  2. Ask your agent to "add a chapter on <topic>".`,
    `  3. Run content_validate, then ${o.contentType === "document" ? "document_render_md" : "content_build"}.`,
  );
  return lines.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────

const USAGE = `init-folio — scaffold a new folio repository

Usage:
  bun run cat-harness/scripts/init-folio.ts [options]

Options:
  --dir <path>        Folio root to scaffold into            (default: .)
  --type <type>       paper | document                       (default: document)
  --slug <slug>       Document slug under folio/           (default: from --title)
  --title <title>     Document title                         (required)
  --author <name>     Author. Repeat for several.            (required)
  --link <mode>       submodule | sibling                    (default: submodule)
  --assistant <path>  Path to folio-assistant, relative to the folio root
  --force             Overwrite files that already exist
  --dry-run           Report what would be written
  --skip-vcs          Do not run git init / git submodule add
  --help
`;

/** `"My Guidance Note"` → `"my-guidance-note"`. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseArgs(argv: string[]): InitFolioOptions | "help" {
  const authors: string[] = [];
  let dir = ".";
  let contentType: "paper" | "document" = "document";
  let slug: string | undefined;
  let title: string | undefined;
  let link: LinkMode = "submodule";
  let assistantPath: string | undefined;
  let force = false;
  let dryRun = false;
  let skipVcs = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    switch (a) {
      case "--help": case "-h": return "help";
      case "--dir": dir = next(); break;
      case "--type": {
        const t = next();
        if (t !== "paper" && t !== "document") throw new Error(`--type must be paper or document, got '${t}'`);
        contentType = t;
        break;
      }
      case "--slug": slug = next(); break;
      case "--title": title = next(); break;
      case "--author": authors.push(next()); break;
      case "--link": {
        const l = next();
        if (l !== "submodule" && l !== "sibling") throw new Error(`--link must be submodule or sibling, got '${l}'`);
        link = l;
        break;
      }
      case "--assistant": assistantPath = next(); break;
      case "--force": force = true; break;
      case "--dry-run": dryRun = true; break;
      case "--skip-vcs": skipVcs = true; break;
      default: throw new Error(`Unknown option: ${a}`);
    }
  }

  if (!title) throw new Error("--title is required");
  if (authors.length === 0) throw new Error("--author is required (repeat for several)");

  return {
    targetDir: dir, contentType, slug: slug ?? slugify(title), title,
    authors, link, assistantPath, force, dryRun, skipVcs,
  };
}

if (import.meta.main) {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    if (parsed === "help") {
      console.log(USAGE);
      process.exit(0);
    }
    const result = initFolio(parsed);
    console.log(formatInitResult(result, parsed));
    process.exit(0);
  } catch (e) {
    console.error(`init-folio: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`\n${USAGE}`);
    process.exit(1);
  }
}
