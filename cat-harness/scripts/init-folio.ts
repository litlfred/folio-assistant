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

import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "fs";
import { instanceConfigFilename } from "../schemas/harness-config";
import { instanceDeclarationFilename, resolveDirectories } from "../schemas/cat-harness";
import { materialiseDeclaredDirectories } from "../schemas/harness-config";
import { relative, dirname, join, resolve, sep } from "path";
import { spawnSync } from "child_process";
import { BUILTIN_ADAPTERS } from "../src/builtin-adapters";

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

/**
 * What every harness instance needs, whether or not it holds a folio.
 *
 * Bean `mer2`, owner's ruling 2026-10-01: `folio_init` conflated two
 * operations. The declaration, config, work plan, agent guidance and MCP wiring
 * need NO content type; only `folio/`, its builder shim and the source-material
 * directories need an adapter. A harness layer (`bootstrap`, `cat-harness` — the partition once called it `agentic-harness`)
 * declares no `folio` kind and carries no adapter, so the MVP the owner ruled
 * for it — *"`folio_init` creates a working folio against that layer ALONE, in
 * an empty repository"* (`tndo`) — was not expressible while the two were one
 * call. `initInstance` is the contentless half; `initFolio` is it plus the
 * adapter's scaffold.
 *
 * A `--layer` flag was considered and rejected: it forces an answer to "which
 * content type does a contentless layer scaffold?", which has none.
 */
export interface InitInstanceOptions {
  /** Repo root to scaffold into. */
  targetDir: string;
  // declared-path-literal: the folio content root. Resolving it through `directoryForGraph` is bean `hs08`; the harness-side callers hit `ot9a`'s layering boundary, so the literal is COUNTED here rather than hidden.
  /** Instance name: `<slug>.json`, and for a folio the directory under `folio/` and the manifest's name. */
  slug: string;
  title: string;
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

/** An instance that holds a folio: the instance, plus what its adapter scaffolds. */
export interface InitFolioOptions extends InitInstanceOptions {
  /** Content type — selects the adapter and the profile. */
  contentType: "paper" | "document";
  authors: string[];
}

/** The content type, when the instance being scaffolded holds a folio. */
type MaybeFolio = InitInstanceOptions & { contentType?: InitFolioOptions["contentType"] };

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

/**
 * Where a content type's adapter module sits, from the folio's own root.
 *
 * **This is a LOOKUP and must not go back to being a composition.** It read
 *
 * ```ts
 * `./${platformDir(assistant)}/adapters/${o.contentType}/index.ts`
 * ```
 *
 * which assumed every adapter lives under the same instance. That stopped
 * being true on 2026-09-30, when `adapters/paper/` moved to
 * `folio-assistant-sci/` (bean `y5si`): one template cannot name two
 * instances, so every paper folio scaffolded after the move would have got an
 * `adapterModule` pointing at a path that does not exist.
 *
 * **The test did not catch it and could not have.** `init-folio.test.ts`
 * pinned the SUBSTRING `adapters/paper/index.ts`, which the broken path still
 * contains — so the composed and the correct answer were indistinguishable to
 * the gate. It pins the full path now.
 *
 * `BUILTIN_ADAPTERS` is the declaration of where each adapter is, and its
 * `module` is relative to `cat-harness/` — the same root `platformDir` names —
 * so joining the two is the whole conversion. An unknown content type has no
 * declaration to read, and composing a guess for it would re-create exactly
 * the failure above; it gets the conventional path under the harness and the
 * scaffold's own adapter resolution reports it if nothing is there.
 */
function adapterModulePath(assistant: string, contentType: string): string {
  const declared = BUILTIN_ADAPTERS.find((a) => a.contentType === contentType);
  const rel = declared ? declared.module : `adapters/${contentType}/index.ts`;
  return `./${posixSegments(`${platformDir(assistant)}/${rel}`).join("/")}`;
}

/**
 * A path's segments, `.` and `..` folded, POSIX by hand: these strings go into
 * a JSON config read on every platform, and `join` from `node:path` would emit
 * backslashes on Windows.
 */
function posixSegments(path: string): string[] {
  const segments: string[] = [];
  for (const part of path.split("/")) {
    if (part === "." || part === "") continue;
    if (part === ".." && segments.length > 0 && segments[segments.length - 1] !== "..") segments.pop();
    else segments.push(part);
  }
  return segments;
}

/**
 * The layer a new instance STANDS ON, as a config dependency (bean `zmdo`).
 *
 * Without it the scaffolded instance's declaration chain is the instance alone:
 * measured 2026-10-04 in a sibling layout, a fresh instance — and a fresh
 * document folio — reached **0** skill directories, so it could not read the
 * conventions it was scaffolded to follow. One entry is enough: the layer's own
 * `needs` carry the rest of the stack (`bootstrap ← bootstrap-tools ←
 * cat-harness ← …`), measured the same day.
 *
 * Which layer is DERIVED, never asked for: a folio stands on its adapter's
 * instance (`BUILTIN_ADAPTERS[].instance`), and a contentless instance on the
 * harness whose scaffolder wrote it. A `--layer` flag was rejected for `mer2`
 * and is not reintroduced here.
 */
function standsOn(assistant: string, contentType: InitFolioOptions["contentType"] | undefined): { name: string; path: string } {
  const harness = { name: HARNESS_SUBDIR, path: posixSegments(platformDir(assistant)).join("/") };
  if (contentType === undefined) return harness;
  const declared = BUILTIN_ADAPTERS.find((a) => a.contentType === contentType);
  if (!declared) return harness;
  // The adapter's module is relative to the harness directory and passes
  // through its instance's directory: `../folio-assistant-core/adapters/…`.
  const segments = posixSegments(`${platformDir(assistant)}/${declared.module}`);
  const at = segments.lastIndexOf(declared.instance);
  return at < 0 ? harness : { name: declared.instance, path: segments.slice(0, at + 1).join("/") };
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
function instanceDeclaration(o: MaybeFolio): string {
  return JSON.stringify(
    {
      name: o.slug,
      title: o.title,
      // A contentless instance declares no `folio` directory: declaring one it
      // does not hold would be the `dh4f` defect (a consumer scans nothing and
      // reports a clean run). Bean `mer2`.
      directories: o.contentType === undefined ? [] : [
        {
          id: "folio",
          // declared-path-literal: THE BASE CASE, same as `DEFAULT_DIRECTORIES`.
          // This line IS the declaration being written; there is nothing to
          // read it from in a repository that does not exist yet.
          path: "folio/",
          graphTypologies: ["folio"],
          description: `The content of ${o.title} — its document, chapters and blocks.`,
        },
      ],
    },
    null,
    2,
  ) + "\n";
}

/**
 * The scaffolded instance's CONFIG — `<slug>.config.json`, beside its declaration.
 *
 * NO `site.landing` FLAG, on purpose (issue #1904). A scaffolded folio is the
 * one harness instantiated at its root, and the owner's ruling makes that the
 * landing page with no flag: *"If exactly one harness is instantiated, it is
 * the landing page and no flag is needed."* The flag becomes necessary the day
 * a SECOND `<name>.config.json` lands beside this one: then exactly one of
 * them carries `"site": { "landing": true }` (two or more give a neutral hub),
 * and `check:landing-instance` fails until one does. Writing it now would be
 * a decision nobody has made yet. Rule: the `harness-tiles` skill.
 */
function instanceConfig(o: MaybeFolio, assistant: string): string {
  return JSON.stringify(
    {
      // Omitted, not defaulted, for a contentless instance (bean `mer2`):
      // naming an adapter here would be inventing a content type for a layer
      // that has none.
      ...(o.contentType === undefined ? {} : {
        contentType: o.contentType,
        adapter: o.contentType,
        adapterModule: adapterModulePath(assistant, o.contentType),
      }),
      dependencies: { folioAssistant: [standsOn(assistant, o.contentType)] },
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
folio/schema/            re-export shim for the platform's builders
test/results/block-qa/     QA verdicts, one per block, mirroring folio/ (machine-written — never hand-edit)
library/                   ingested source documents (read-only reference)
uploads/                   source PDFs, for offline citation verification
${assistant}/              the platform
beans/                    the work plan
\`\`\`

## Commands

\`\`\`sh
bun run ${platformDir(assistant)}/src/index.ts --stdio --repo .   # the MCP server
bun run ${platformDir(assistant)}/src/index.ts --check-deps       # what's installed
bun run ${platformDir(assistant)}/content/pipeline/qa-sweep.ts folio  # QA every block
\`\`\`

## QA — every block is checked from the first commit

\`qa-sweep\` runs every criterion a script can check against each block, and
writes one verdict file per block under \`test/results/block-qa/\`. **Commit
those files with the edit they are about**: a verdict is keyed on the block's
content hash, so one that is older than its block reads as stale, never as
passing.

The staging preview sweeps each pull request as well (\`.github/workflows/staging.yml\`),
so the review page's QA column reports that build. \`.github/workflows/qa-sweep.yml\`
runs the full sweep in CI, and \`qa-sweep-nightly.yml\` refreshes stale verdicts;
both are dispatch-only until you enable their triggers. Criteria that need an
agent's judgement (voice, exposition, adversarial review) are not run by the
sweep; they stay unaudited until an agent records them.

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

function gitignore(o: MaybeFolio): string {
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
${o.contentType === "paper" ? "\n# Lean build artifacts\n.lake/\n*.olean\n\n# Raw Lean build logs — the JSON sidecars beside them are committed\nbuild-logs/*.log\nbuild-logs/*.tsv\n" : ""}`;
}

/**
 * The folio's before/after preview: a caller of the platform's reusable
 * `folio-staging.yml` (bean `ojcx`). Without it a folio in its own repository
 * gets no STAGING build, and a reviewer has no "after" to compare.
 *
 * **A document folio gets it ON**, building with
 * `folio-assistant-core/scripts/build-document-site.ts` (bean `fyu2`). That
 * command was rehearsed end to end on a folio this function scaffolds: site,
 * ChangeSet and banner. The path is `folio-assistant-core/` rather than
 * `cat-harness/` as of bean `yj6r`, 2026-09-30: rendering a folio to a site is
 * CONTENT machinery, and the script reads core's `schemas/changeset.ts`. The
 * string here is the invocation a scaffolded folio's staging workflow carries,
 * so it is instance-relative and moves with the file — `init-folio.test.ts`
 * pins it for exactly that reason.
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
    ? `bun run ${assistant}/folio-assistant-core/scripts/build-document-site.ts --out _site`
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
  // `push` to main publishes main's site at the gh-pages root, which is the
  // "before" side every preview is compared with (bean 5uuf). Without it the
  // before pictures are all missing and "view on main" 404s.
  const trigger = on
    ? `  pull_request:
    types: [opened, synchronize, reopened]
  issue_comment:
    types: [created, edited]
  push:
    branches: [main]
  workflow_dispatch:`
    : `  workflow_dispatch:
  # push:
  #   branches: [main]
  # pull_request:
  #   types: [opened, synchronize, reopened]
  # issue_comment:
  #   types: [created, edited]`;
  return `name: Staging preview

# A before/after preview of this folio for every pull request, published to
# STAGING/<branch>/ on gh-pages, with the ChangeSet (what changed, block by
# block) beside it. A push to main publishes main's site at the gh-pages root:
# the "before" side. The mechanics live in the platform's reusable workflow.
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

// ── Workflow templates, read from disk ───────────────────────────

/**
 * The declared id of the directory holding the files a folio is given.
 *
 * Bean `52dz`, owner 2026-09-24: *"Move them to a templates folder; folio_init
 * writes them into a new folio's .github/workflows. They stop running (and
 * failing) here."* — and, for the Lean ones, *"have folio_init write them for
 * paper folios only. The .github scripts/actions they need get shipped too."*
 *
 * They are real files rather than strings in this module (as
 * `stagingWorkflow` above still is) so that they can be read, diffed and
 * parsed as what they are. Looked up by the declaration's `id`, never by its
 * path: `directoryForGraph("code")` is ambiguous here by design, and a by-id
 * lookup through `resolveDirectories` is what that function's own
 * documentation says to use when you want one particular directory.
 */
export const TEMPLATES_ID = "folio-templates";

/**
 * Which template profiles a content type receives, in order.
 *
 * Profiles NEST, as they do in `content-profiles`: a paper is a document plus
 * the formal kinds, so a paper folio gets everything a document folio gets
 * and then the Lean workflows. A document folio has no Lean toolchain to run
 * them against, so it never gets them.
 */
export const TEMPLATE_PROFILES: Record<InitFolioOptions["contentType"], readonly string[]> = {
  document: ["document"],
  paper: ["document", "paper"],
};

/**
 * Template path segments that land DOT-PREFIXED in the folio.
 *
 * The templates cannot sit under a literal `.github/`: the dot-prefix guard
 * in `directory-conventions` refuses a hidden segment anywhere in a declared
 * tree, for the reason it gives — a dot-prefixed directory is invisible to a
 * plain `ls` and to a forge's web tree. So the template says `github/` and
 * the writer adds the dot, in this one place.
 */
const DOT_SEGMENTS: Readonly<Record<string, string>> = { github: ".github" };

/** The placeholders a template may use. Anything else is refused. */
export const TEMPLATE_PLACEHOLDERS = ["assistant", "folio", "platform_git", "platform_repo"] as const;
export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number];

/**
 * `{{name}}`, NOT preceded by `$`. `${{ … }}` is a GitHub Actions expression
 * and must reach the folio untouched; confusing the two would either corrupt
 * every workflow or leave a placeholder behind, and the second is silent.
 */
export const TEMPLATE_PLACEHOLDER_RE = /(?<!\$)\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

/** Where the templates are, from THIS platform checkout's own declaration. */
export function templatesDir(): string {
  // The instance root this script belongs to — the platform checkout that is
  // running `folio_init`, which is also the one the new folio will link.
  const instanceRoot = resolve(import.meta.dir, "..");
  const dir = resolveDirectories([{ name: "(local)", root: instanceRoot, own: true }]).find(
    (d) => d.id === TEMPLATES_ID,
  );
  if (!dir || !existsSync(dir.absPath)) {
    // Refuse rather than write a folio without its workflows and report
    // success: that is the `dh4f` shape, a clean run over nothing.
    throw new Error(
      `init-folio: the platform declares no '${TEMPLATES_ID}' directory under ${instanceRoot}, ` +
        `so there are no workflow templates to write.`,
    );
  }
  return dir.absPath;
}

export interface TemplateFile {
  /** Absolute path of the template in the platform checkout. */
  source: string;
  /** Path the file is written to, relative to the folio root. */
  target: string;
}

function walkFiles(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      // Build debris (a `__pycache__`, an editor's dotfile) is never a template.
      if (name.startsWith(".") || name === "__pycache__") return [];
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walkFiles(p) : [p];
    });
}

/** Every template a folio of this content type receives, profile by profile. */
export function folioTemplates(
  contentType: InitFolioOptions["contentType"],
  dir: string = templatesDir(),
): TemplateFile[] {
  const out: TemplateFile[] = [];
  for (const profile of TEMPLATE_PROFILES[contentType]) {
    const base = join(dir, profile);
    if (!existsSync(base)) {
      throw new Error(`init-folio: template profile '${profile}' is missing from ${dir}`);
    }
    for (const source of walkFiles(base)) {
      const target = relative(base, source)
        .split(sep)
        .map((seg) => DOT_SEGMENTS[seg] ?? seg)
        .join("/");
      out.push({ source, target });
    }
  }
  return out;
}

/**
 * Substitute every placeholder, and refuse one that is not known.
 *
 * Refusing is the point: an unknown `{{name}}` left in a workflow is text
 * GitHub will run as a path, and it fails at run time in the folio, long
 * after the scaffold reported success.
 */
export function renderTemplate(text: string, values: Record<TemplatePlaceholder, string>): string {
  return text.replace(TEMPLATE_PLACEHOLDER_RE, (whole, name: string) => {
    if (!(TEMPLATE_PLACEHOLDERS as readonly string[]).includes(name)) {
      throw new Error(`init-folio: unknown template placeholder ${whole}`);
    }
    return values[name as TemplatePlaceholder];
  });
}

/** `https://github.com/owner/repo.git` → `owner/repo`. */
function repoSlug(url: string): string {
  const m = /github\.com[:/](.+?)(?:\.git)?$/.exec(url);
  if (!m) throw new Error(`init-folio: cannot read owner/repo from ${url}`);
  return m[1]!;
}

/**
 * The folio's todos graph: people's outstanding items, and FEEDBACK raised
 * against a block. Bean `423d`.
 *
 * `feedback` (graph typology `todo-feedback`) is where a review-process task
 * commits a reviewer's comment when it decides what happens to it
 * (`folio-review-comment-move`, on the edit-set's feature branch, per the
 * owner's ruling). Without the declaration the first recorded decision on a
 * new folio stops with "declares no directory of graph typology todo-feedback",
 * so a folio gets it from the start.
 *
 * `verdicts` (graph typology `review-verdicts`) is where the review coordinator
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
          graphTypologies: ["todo-items"],
          description: "One Markdown file per todo, carrying `$schema: folio-todo/v1` in its front matter: a person's outstanding item.",
        },
        {
          id: "feedback",
          path: "feedback",
          graphTypologies: ["todo-feedback"],
          description:
            "Todos raised against a specific block. Review comments land here as `folio-review-comment/v1` JSON, committed on the edit-set's feature branch by the review-process task that decided them (the `review-comments` skill).",
        },
        {
          id: "verdicts",
          path: "verdicts",
          graphTypologies: ["review-verdicts"],
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

/**
 * A contentless instance's README (bean `mer2`).
 *
 * Only the workflows markers: `folio:toc` lists a folio's contents, and an
 * instance that holds none would carry a region nothing can fill.
 */
function instanceReadme(o: InitInstanceOptions): string {
  return `# ${o.title}

A harness instance with no content type: its declaration (\`${instanceDeclarationFilename(o.slug)}\`),
work plan (\`beans/\`, \`todos/\`) and agent wiring. It holds no folio.

<!-- Regions between a \`folio:*:begin\` / \`folio:*:end\` pair are generated:
     refresh them with \`readme_sync\` (MCP) or \`bun run readme:sync\` from the
     platform checkout. Edits inside a pair are overwritten; everything else in
     this file is yours and is never touched. -->

## Workflows

<!-- folio:workflows:begin -->
<!-- folio:workflows:end -->
`;
}

/**
 * A contentless instance's AGENTS.md (bean `mer2`).
 *
 * Says what the instance is and is not, and where the platform is — the folio
 * version's block-kind rules would be rules about content this instance does
 * not hold.
 */
function instanceAgentsMd(o: InitInstanceOptions, assistant: string): string {
  return `# AGENTS.md — ${o.title}

This is a **harness instance with no content type**. It declares itself in
\`${instanceDeclarationFilename(o.slug)}\`, keeps its work plan in \`beans/\` and
\`todos/\`, and reaches the platform — skills, schemas, MCP tools — through
[folio-assistant](${FOLIO_ASSISTANT_REPO}), checked out at \`${assistant}/\`.

This file is the **agent-generic** source of truth. \`CLAUDE.md\` and
\`GEMINI.md\` are thin stubs pointing here.

## It holds no folio

There is no \`folio/\` here and no adapter is configured, on purpose: a
contentless instance scaffolds the instance and nothing an adapter would own.
Adding a folio to an existing instance in place is **not supported yet**:
\`init-folio\` skips files that exist, so this instance's declaration and
config would go on saying it holds no content.

## Work plan

\`beans\` is the todo mechanism: \`beans prime\`, \`beans list\`,
\`beans create "<title>"\`.
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

/**
 * The root of a git repository that ENCLOSES `root` without being it, or
 * `null`. Bean `zdfa`: a folio scaffolded into a subfolder of an existing
 * repository got its workflow at `<sub>/.github/workflows/`, which GitHub
 * never reads, and a nested `git init`.
 */
export function enclosingRepoRoot(root: string): string | null {
  let probe = resolve(root);
  while (!existsSync(probe)) {
    const up = dirname(probe);
    if (up === probe) return null;
    probe = up;
  }
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: probe, stdio: "pipe" });
  if (r.status !== 0) return null;
  const top = realpathSync(r.stdout.toString().trim());
  return top === realpathSync(probe) && probe === resolve(root) ? null : top;
}

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
/** The writer and context one scaffold run shares across its steps. */
interface Scaffold {
  o: MaybeFolio;
  root: string;
  assistant: string;
  result: InitFolioResult;
  write: (relPath: string, content: string) => void;
}

function checkSlug(slug: string): void {
  if (!isValidSlug(slug)) {
    throw new Error(
      `Invalid slug '${slug}'. Use lowercase words joined by single hyphens ` +
      `(e.g. 'antenatal-care-guidance') — the slug is a directory name, a TS ` +
      `module name and a URL path at once.`,
    );
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(
      `Slug '${slug}' is reserved: folio/${slug}/ has a platform meaning ` +
      `and would not be discovered as a document.`,
    );
  }
}

function startScaffold(o: MaybeFolio): Scaffold {
  const result: InitFolioResult = { created: [], skipped: [], notes: [] };
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

  return { o, root, assistant, result, write };
}

/**
 * The instance-level writes — everything that needs no content type (bean
 * `mer2`). Shared by `initInstance` and `initFolio`, so a folio's instance half
 * cannot drift from a bare instance's.
 */
function writeInstanceFiles(s: Scaffold): void {
  const { o, assistant, write } = s;
  // Named after the instance, not after the harness: the config the scaffold
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
  write("CLAUDE.md", `# CLAUDE.md\n\nThis ${o.contentType ? "folio" : "instance"}'s agent guidance is maintained agent-generically in \`AGENTS.md\`.\n\n@AGENTS.md\n`);
  write("GEMINI.md", `# GEMINI.md\n\nThis ${o.contentType ? "folio" : "instance"}'s agent guidance is maintained agent-generically in \`AGENTS.md\`.\n\nSee [AGENTS.md](./AGENTS.md).\n`);
}

/** Link the platform, then create every declared or inherited directory. Last, for both. */
function finishScaffold(s: Scaffold): void {
  const { o, root, assistant, result } = s;

  // Version control.
  const platformPresent = existsSync(join(root, assistant));
  if (!o.skipVcs && !o.dryRun) {
    linkPlatform(root, assistant, o, result);
  } else if (o.link === "submodule" && !platformPresent) {
    // Only when it is actually absent. Emitting this unconditionally told a
    // caller who had already added the submodule (and passed --skip-vcs
    // precisely because of that) to add it again.
    result.notes.push(`Add the platform: git submodule add ${FOLIO_ASSISTANT_REPO} ${assistant}`);
  }

  if (o.contentType !== undefined && !existsSync(join(root, assistant))) {
    result.notes.push(
      `The builder shim in folio/schema/ points at '${assistant}', which does not exist yet. ` +
      `Nothing will import until the platform is there.`,
    );
  }

  // Every directory this instance DECLARES or INHERITS, created if absent.
  //
  // Last, and after the platform link, because the inherited half of the answer
  // comes from walking the dependency tree — an instance whose platform is not
  // checked out yet inherits nothing, and this then correctly creates only what
  // the instance itself declares. Re-running with `--force` re-runs this,
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
}

/**
 * Scaffold a harness instance with NO content type (bean `mer2`).
 *
 * Writes the declaration (with no `folio` directory), the config (with no
 * adapter), the work plan, agent guidance and MCP wiring, and links the
 * platform. Writes nothing an adapter owns: no `folio/`, no builder shim, no
 * `uploads/` or `library/`, no staging or QA workflows. This is the operation
 * the owner's MVP ruling (`tndo`) needs for a layer that has no adapter.
 */
export function initInstance(options: InitInstanceOptions): InitFolioResult {
  const o: MaybeFolio = { ...options, contentType: undefined };
  checkSlug(o.slug);
  const s = startScaffold(o);
  if (!o.dryRun) mkdirSync(s.root, { recursive: true });
  writeInstanceFiles(s);
  s.write("README.md", instanceReadme(o));
  s.write("AGENTS.md", instanceAgentsMd(o, s.assistant));
  finishScaffold(s);
  return s.result;
}

/** Scaffold a folio: `initInstance`'s writes, plus the adapter's folio scaffold. */
export function initFolio(options: InitFolioOptions): InitFolioResult {
  const o: InitFolioOptions = { ...options };
  checkSlug(o.slug);
  if (o.authors.length === 0) {
    throw new Error("At least one author is required — the manifest's `authors` may not be empty.");
  }

  const s = startScaffold(o);
  const { root, assistant, result, write } = s;

  // Checked before anything is written: whether this folio is the root of
  // its repository decides where its workflow can go (bean `zdfa`).
  const enclosing = enclosingRepoRoot(root);
  if (!o.dryRun) mkdirSync(root, { recursive: true });

  // 1. The instance half — configuration, work plan, agent stubs.
  writeInstanceFiles(s);

  // 1b. The staging and QA workflows — folio-level: each builds or audits content.
  if (enclosing) {
    // GitHub reads workflows only at the repository root, and the reusable
    // workflow builds from the repository root. A caller written here would
    // never run, and one written at the root would build the wrong directory,
    // so neither is written, and the author is told.
    result.notes.push(
      `This folio is in a subfolder of the repository at '${enclosing}'. GitHub reads workflows only from ` +
        `that repository's root .github/workflows/, and the platform's folio-staging.yml builds from the ` +
        `repository root, so it cannot stage a folio below it yet. No staging workflow was written, so this ` +
        `folio gets no preview. Scaffold it at a repository root to have one.`,
    );
  } else {
    write(".github/workflows/staging.yml", stagingWorkflow(assistant, o.contentType));
  }
  if (!enclosing && o.contentType !== "document") {
    result.notes.push(
      "Staging previews are wired but OFF: set build_command in .github/workflows/staging.yml " +
        "and uncomment its pull_request trigger. Until then there is no STAGING build to review.",
    );
  }
  // The QA workflows every folio gets, and for a paper the Lean workflows
  // with the scripts and composite action they call. Read from the platform's
  // declared templates directory and written with their placeholders filled.
  const templateValues: Record<TemplatePlaceholder, string> = {
    assistant,
    // declared-path-literal: THE BASE CASE, the same literal
    // `instanceDeclaration` writes as this folio's content root — there is
    // no declaration to read in a repository that does not exist yet.
    folio: "folio",
    platform_git: FOLIO_ASSISTANT_REPO,
    platform_repo: repoSlug(FOLIO_ASSISTANT_REPO),
  };
  for (const t of folioTemplates(o.contentType)) {
    write(t.target, renderTemplate(readFileSync(t.source, "utf-8"), templateValues));
  }
  result.notes.push(
    "QA workflows (qa-sweep, qa-sweep-nightly, section-title-audit)" +
      (o.contentType === "paper" ? " and Lean workflows (blueprint, lean-build, lean-build-sidecar, lean_ci)" : "") +
      " are written dispatch-only: enable their triggers in .github/workflows/ when you want them to run.",
  );

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

  // 5. Agent guidance: AGENTS.md is authoritative; the stubs are instance-level.
  write("AGENTS.md", agentsMd(o, assistant));

  finishScaffold(s);
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
  o: InitInstanceOptions,
  result: InitFolioResult,
): void {
  const isRepo = existsSync(join(root, ".git"));
  const enclosing = enclosingRepoRoot(root);
  if (enclosing) {
    // Never a repository nested inside another by accident (bean `zdfa`).
    result.notes.push(`Inside the repository at '${enclosing}', so no git init: the folio is part of that repository.`);
  } else if (!isRepo) {
    const init = spawnSync("git", ["init"], { cwd: root, stdio: "pipe" });
    if (init.status === 0) result.notes.push("Initialized a git repository.");
    else {
      result.notes.push(`git init failed: ${init.stderr?.toString().trim() || "unknown error"}`);
      return;
    }
  }

  if (!enclosing) {
    const seed = seedMainIfEmpty(root, o.slug);
    if (seed.kind === "seeded") {
      result.notes.push(
        `The repository was empty, so main was seeded with one empty commit${seed.pushed ? " and pushed" : ""}, ` +
        `and this scaffold is on branch '${seed.branch}'. Commit it there and open a pull request against main.`,
      );
    } else if (seed.kind === "no-main") {
      result.notes.push(`This repository has commits but no 'main' (on '${seed.current}'). Not seeded — that would give it a second root.`);
    } else if (seed.kind === "stopped") {
      result.notes.push(`Stopped before linking the platform: ${seed.reason}.`);
      return;
    }
  }

  if (o.link === "sibling") {
    result.notes.push(
      `Linked as a sibling checkout at '${assistant}' — nothing to add to version control. ` +
      `Note that a fresh clone of this folio will not have it; the staging workflow checks the platform ` +
      `out in CI and links it at that path.`,
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

/**
 * What {@link seedMainIfEmpty} found, and what it did about it.
 *
 * - `seeded` — the repository had no commits; `main` now holds one empty seed
 *   commit (pushed where a remote exists) and the scaffold sits on `branch`.
 * - `has-main` — ordinary repository; nothing to do.
 * - `no-main` — commits exist but no `main`. Reported, NEVER seeded over: a
 *   repository with history on `master` is a different case, and a seed commit
 *   would give it two unrelated roots.
 * - `stopped` — could not seed safely; `reason` says why and nothing past the
 *   check was done.
 */
export type SeedOutcome =
  | { kind: "seeded"; branch: string; pushed: boolean }
  | { kind: "has-main" }
  | { kind: "no-main"; current: string }
  | { kind: "stopped"; reason: string };

function git(root: string, args: string[], timeout = 60_000) {
  const r = spawnSync("git", args, { cwd: root, stdio: "pipe", timeout });
  return { ok: r.status === 0, out: r.stdout?.toString().trim() ?? "", err: r.stderr?.toString().trim() ?? "" };
}

/**
 * On an EMPTY repository, make `main` real before bootstrapping onto it.
 *
 * Bean `izqr`, owner 2026-09-22: *"when bootstrap initializes, if repo is
 * empty, it should seed main then bootstrap"*. A repository with no commits
 * has no base for a feature branch, no target for a PR, and nothing for
 * staging, `id-stable` or a ChangeSet to diff against — so a bootstrap onto it
 * either fails at the first `git switch -c`, or becomes the root of `main`
 * itself and is never reviewable. Seeding first makes the bootstrap an
 * ordinary branch, and so an ordinary PR.
 *
 * **The seed is an EMPTY commit.** The least that makes `main` real, and it
 * holds nothing a bootstrap would then have to overwrite — a README or
 * `.gitignore` stub would be exactly that.
 *
 * **A remote is asked before anything is written.** A remote that already has
 * branches means the local repository is empty only because nothing was
 * fetched; seeding would fork history. A remote that cannot be asked is could
 * not determine, and stops rather than guesses. A seed that cannot be pushed
 * stops too: the owner's rule is never to bootstrap onto an orphan branch.
 */
export function seedMainIfEmpty(root: string, slug: string): SeedOutcome {
  const head = git(root, ["rev-parse", "--verify", "--quiet", "HEAD"]);
  if (head.ok) {
    if (git(root, ["show-ref", "--verify", "--quiet", "refs/heads/main"]).ok) return { kind: "has-main" };
    const current = git(root, ["symbolic-ref", "--short", "--quiet", "HEAD"]).out || "(detached)";
    return { kind: "no-main", current };
  }

  const hasOrigin = git(root, ["remote"]).out.split(/\s+/).includes("origin");
  if (hasOrigin) {
    const heads = git(root, ["ls-remote", "--heads", "origin"]);
    if (!heads.ok) return { kind: "stopped", reason: `could not ask the remote whether it is empty (${heads.err.slice(0, 200) || "no output"}) — not seeding over history nobody checked` };
    if (heads.out !== "") return { kind: "stopped", reason: "the remote already has branches — this checkout is empty only because nothing was fetched; fetch and check out its default branch instead of seeding" };
  }

  if (!git(root, ["symbolic-ref", "HEAD", "refs/heads/main"]).ok) return { kind: "stopped", reason: "could not point HEAD at main" };
  const seed = git(root, ["-c", "commit.gpgsign=false", "commit", "--allow-empty", "--quiet", "-m", "Seed main"]);
  if (!seed.ok) return { kind: "stopped", reason: `the seed commit failed (${seed.err.slice(0, 200) || "unknown error"}) — often an unset user.name / user.email` };

  let pushed = false;
  if (hasOrigin) {
    const push = git(root, ["push", "--quiet", "-u", "origin", "main"], 120_000);
    if (!push.ok) return { kind: "stopped", reason: `main was seeded locally but could not be pushed (${push.err.slice(0, 200) || "unknown error"}) — not bootstrapping onto a branch whose base the remote lacks` };
    pushed = true;
  }

  const branch = `bootstrap/${slug}`;
  if (!git(root, ["switch", "--quiet", "-c", branch]).ok) return { kind: "stopped", reason: `main was seeded but branch '${branch}' could not be created` };
  return { kind: "seeded", branch, pushed };
}

/** Render a result as the report a human or an agent reads. */
export function formatInitResult(result: InitFolioResult, o: InitFolioOptions | InitInstanceOptions): string {
  const folio = "contentType" in o ? o : undefined;
  const lines = folio
    ? [
        `Initialized a ${folio.contentType} folio: ${o.title}`,
        `  folio/${o.slug}/  ·  ${result.created.length} file(s) written`,
        "",
      ]
    : [
        `Initialized a harness instance with no content type: ${o.title}`,
        `  ${instanceDeclarationFilename(o.slug)}  ·  ${result.created.length} file(s) written`,
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
  if (!folio) return lines.join("\n");
  lines.push(
    "",
    "Next:",
    `  1. Edit folio/${o.slug}/introduction/overview.md — it is a placeholder.`,
    `  2. Ask your agent to "add a chapter on <topic>".`,
    `  3. Run content_validate, then ${folio.contentType === "document" ? "document_render_md" : "content_build"}.`,
  );
  return lines.join("\n");
}

// ── CLI ──────────────────────────────────────────────────────────

const USAGE = `init-folio — scaffold a new folio repository

Usage:
  bun run cat-harness/scripts/init-folio.ts [options]

Options:
  --dir <path>        Folio root to scaffold into            (default: .)
  --instance          A harness instance with NO content type: no folio/,
                      no adapter, no --type or --author (bean mer2)
  --type <type>       paper | document                       (default: document)
  --slug <slug>       Document slug under folio/           (default: from --title)
  --title <title>     Document title                         (required)
  --author <name>     Author. Repeat for several.            (required for a folio)
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

type ParsedArgs =
  | { kind: "folio"; options: InitFolioOptions }
  | { kind: "instance"; options: InitInstanceOptions };

function parseArgs(argv: string[]): ParsedArgs | "help" {
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
  let instance = false;
  let typeGiven = false;

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
      case "--instance": instance = true; break;
      case "--type": {
        typeGiven = true;
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
  const common = { targetDir: dir, slug: slug ?? slugify(title), title, link, assistantPath, force, dryRun, skipVcs };
  if (instance) {
    // Refused rather than ignored: a content type passed to a contentless
    // init is a caller who wanted a folio and would silently not get one.
    if (typeGiven) throw new Error("--instance takes no --type: an instance with a content type is a folio");
    return { kind: "instance", options: common };
  }
  if (authors.length === 0) throw new Error("--author is required (repeat for several)");

  return { kind: "folio", options: { ...common, contentType, authors } };
}

if (import.meta.main) {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    if (parsed === "help") {
      console.log(USAGE);
      process.exit(0);
    }
    const result = parsed.kind === "instance" ? initInstance(parsed.options) : initFolio(parsed.options);
    console.log(formatInitResult(result, parsed.options));
    process.exit(0);
  } catch (e) {
    console.error(`init-folio: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`\n${USAGE}`);
    process.exit(1);
  }
}
