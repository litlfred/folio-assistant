#!/usr/bin/env bun
/**
 * gen-skill-docs.ts — Render the skill *instruction bodies* (the prose how-to
 * markdowns the LLM loads) as browsable HTML pages on the docs site, with an
 * index.
 *
 * Sources (the actual skill bodies — single source of truth):
 *   skills/content-lifecycle/*.md   → "Lifecycle skills"
 *   src/skills/*.md                  → "Agent skills"
 *
 * Output (consumed by Jekyll → HTML on GitHub Pages):
 *   docs/reference/skill-instructions/<name>.md   (+ index.md)
 *
 * Each generated page gets just-the-docs front matter (any front matter already
 * present in the source body is stripped first), so they render with navigation
 * and link back to the source + the skill's typed schema. Regenerate with:
 *
 *     bun run cat-harness/scripts/gen-skill-docs.ts
 *
 * Dependency-free (bun + fs only). Never hand-edit the output.
 *
 * @module scripts/gen-skill-docs
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve, basename, relative } from "path";

import { isSkillMd, kgDirectories } from "./known-skills.js";
import { siteDirFor, repoRootFor } from "../schemas/cat-harness.ts";
// The `folio` graph kind is registered by CORE on import
// (`schemas/folio-graph-kind.ts`), so the harness alone does not know it
// exists. This module reads this instance's declaration and the instance
// DECLARES a folio graph, so without this it throws `unknown graph kind
// "folio"` on a valid declaration.
//
// Found statically, by listing every script any workflow invokes and checking
// each for the import — NOT by running them. Running `site-links.ts` from the
// wrong directory made it fail with "no harness.json; nothing to resolve",
// which masked this and got it wrongly dismissed as a local-args artefact. A
// script failing on bad arguments says nothing about whether it fails on good
// ones.
import "../schemas/folio-graph-kind.js";

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
// A pencil, as a text glyph rather than an inline SVG. 130 generated pages
// each carrying an SVG is 130 copies of the same markup in the repo and in
// every reader's download; one character is not.
const EDIT_GLYPH = "\u270E";

const OUT_DIR = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "reference", "skill-instructions");

/**
 * `--check`: verify the generated tree is current without writing to it.
 *
 * These pages are generated from skill sources and the repo forbids editing
 * them by hand, but nothing verified they had actually been regenerated after
 * a source change — so `document-intake.md` sat 35 lines behind its source
 * (the PDF-extraction ladder) and the published docs site served the stale
 * copy. A generated file with no drift guard is a file that silently rots.
 *
 * Collects every path whose content would change, so one run reports all of
 * them rather than the first.
 */
const CHECK_ONLY = process.argv.includes("--check");
const drifted: string[] = [];

/**
 * Published names two groups both claimed, with no `publishPrefix` between
 * them and no entry in {@link SAME_BASENAME_DIFFERENT_DOCUMENT}.
 *
 * Bean `v3se`. This was a `↪` line in a list of 173 successes, and the
 * consequence was the one bootstrap exists to prevent: `kg-navigation` existed
 * twice — bootstrap's assuming NOTHING, folio-core's assuming the harness is
 * installed — and the generator kept folio-core's. CatBootstrap's README sends a
 * cold agent to read that name *before anything else is known*, so the reader
 * least able to notice was served the body written for a repository it was not
 * in.
 *
 * A DECLARED pair is not this: it carries a prefix, publishes under two names
 * and gets a directional banner on each. What this catches is one name, two
 * documents, and nobody having decided which governs — which is a judgement
 * somebody has to make, not something a generator may settle by running order.
 *
 * Promoted to a hard failure while the count is ZERO (measured 2026-09-20,
 * after `3jj9` renamed bootstrap's copy). That is this repository's rule for
 * every ratchet — an error only once the backlog is drained — and it is also
 * the only moment the promotion is free.
 */
const collisions: Array<{ published: string; kept: string; from: string }> = [];

function emit(path: string, content: string): void {
  if (CHECK_ONLY) {
    const current = existsSync(path) ? readFileSync(path, "utf-8") : null;
    if (current !== content) drifted.push(path);
    return;
  }
  writeFileSync(path, content);
}

/**
 * An undeclared collision fails the run — writing mode too, not just `--check`.
 *
 * Dropping a document is not a staleness problem that a re-run fixes; it is a
 * document that never reaches the site at all. Reporting it only under
 * `--check` would leave the writer cheerfully publishing 173 pages and one
 * silence.
 */
function reportCollisions(): void {
  if (collisions.length === 0) return;
  console.error(
    `\n✗ ${collisions.length} published name(s) claimed by two groups, with no ` +
      `prefix between them and no SAME_BASENAME_DIFFERENT_DOCUMENT entry.\n` +
      `  One name, two documents: the later one was DROPPED and is not on the site.\n`,
  );
  for (const c of collisions) {
    console.error(`  ${c.published}: kept ${c.kept}, dropped the copy from ${c.from}`);
  }
  console.error(
    `\n  Resolve it deliberately rather than by running order — give the group a ` +
      `\`publishPrefix\`, or\n  declare the pair in SAME_BASENAME_DIFFERENT_DOCUMENT ` +
      `so both publish with a directional banner.\n  Bean \`v3se\`: the collision this ` +
      `guards served a cold bootstrap agent the body for a\n  repository it was not in.`,
  );
  process.exit(1);
}

function reportDrift(): void {
  if (!CHECK_ONLY) return;
  if (drifted.length === 0) {
    console.log("generated docs are up to date");
    process.exit(0);
  }
  console.error(
    `generated docs are STALE (${drifted.length} file(s)); re-run without --check:`,
  );
  for (const p of drifted) console.error(`  ${p}`);
  process.exit(1);
}

const SCHEMA_DIR = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "reference", "skills");

interface Group {
  category: string;
  dir: string;
  /** GitHub path prefix for the "source" link. */
  repoPrefix: string;
  /**
   * Prefix for the PUBLISHED filename, for a group whose basenames can collide
   * with another group's.
   *
   * The output directory is flat, so two groups' identical basenames would have
   * one silently overwrite the other. `.claude/skills/local/todo-manager.md`
   * and `skills/folio-core/todo-manager.md` collide that way.
   *
   * **The divergence that made this urgent is RESOLVED (bean `tdmg`,
   * 2026-09-19); the prefix is still required.** They were 369 and 396 lines
   * with 261 diff lines, each carrying sections the other lacked, and which
   * was canonical was open. It is now settled by measurement — `LOCAL_PACKAGES`
   * in `src/tools/skill-fetch.ts` serves `skills/folio-core` and has no
   * `.claude/skills/local` entry, so only the former was ever servable — and
   * the local copies are stubs pointing at it. The collision remains because
   * the stubs still publish, so do not drop `published`.
   *
   * So the prefix is not cosmetic: it is what lets both be published, which is
   * what makes the divergence visible instead of letting the generator pick a
   * winner by directory order.
   */
  publishPrefix?: string;
}

/**
 * Basenames held by more than one group as GENUINELY DIFFERENT documents.
 *
 * Not a list of duplicates to deduplicate — the generator's `written` map
 * already collapses a true duplicate. This is the opposite case: one name, two
 * documents, neither a copy of the other, which the flat output directory would
 * otherwise resolve by whichever group ran first.
 *
 * Kept as data rather than inferred by diffing, because "these two files differ"
 * is not the same claim as "these two files are meant to be different". The
 * first is measurable and the second is a judgement somebody has to make.
 */
const SAME_BASENAME_DIFFERENT_DOCUMENT: Record<
  string,
  Array<{ published: string; label: string; repoPrefix: string; canonical?: true }>
> = {
  "todo-manager": [
    {
      published: "todo-manager",
      label: "Session Task Manager (folio-core)",
      repoPrefix: "skills/folio-core",
      canonical: true,
    },
    {
      published: "local-todo-manager",
      label: "todo-manager (local stub)",
      repoPrefix: ".claude/skills/local",
    },
  ],
  // Collided exactly as `todo-manager` did and carried NO banner, so a reader
  // landing on either page could not tell the other existed. Added with the
  // `tdmg` resolution.
  "kg-navigation": [
    {
      published: "kg-navigation",
      label: "Reading the knowledge graph (tooled)",
      repoPrefix: "kg-navigation/skills",
      canonical: true,
    },
    {
      published: "local-kg-navigation",
      label: "Reading a knowledge graph before you have anything (bootstrap)",
      repoPrefix: "bootstrap/skills",
    },
  ],
  "bean-coordination": [
    {
      published: "bean-coordination",
      label: "Bean Coordination (folio-core)",
      repoPrefix: "skills/folio-core",
      canonical: true,
    },
    {
      published: "local-bean-coordination",
      label: "bean-coordination (local stub)",
      repoPrefix: ".claude/skills/local",
    },
  ],
};

/**
 * A human-readable category per skill package, for the packages under
 * `skills/`.
 *
 * **The DIRECTORIES are discovered; only the LABEL is declared**, because a
 * label is prose nobody can derive. A package found on disk with no entry here
 * is a hard error naming it — see {@link discoverGroups}.
 */
const SKILLS_CATEGORIES: Record<string, string> = {
  "content-lifecycle": "Lifecycle skills",
  "folio-core": "Platform core (folio-core)",
  workflow: "Workflow & process (workflow)",
  "graph-management": "Graph management (graph-management)",
  theming: "Theming (theming)",
  "folio-document-adapter": "Document adapter (folio-document-adapter)",
  "folio-paper-adapter": "Paper adapter (folio-paper-adapter)",
  "authoring-math": "Mathematical authoring (authoring-math)",
  "authoring-who-smart-guidelines": "WHO SMART Guidelines (authoring-who-smart-guidelines)",
  // Stubs for skills a remote package DECLARES and this instance does not
  // vendor. The heading says "not implemented" in the reader's own words,
  // because the published page is where somebody meets one of these first and
  // the worst outcome is following it as guidance. `kg:audit` carries the same
  // fact for machines, under `skill-is-a-stub`.
  // Each methodology under `workflow-methodologies/` is its own declared
  // subgraph and gets its own heading — the point of the layout is that a
  // reader meets CRDM as a THING rather than as three skills scattered
  // through folio-core with a filename prefix relating them. Owner,
  // 2026-09-20: RACI, SDLC and MADR join it, each with a heading of its own
  // when it exists. Nothing is declared before it has content — a
  // declared-but-absent directory is the `dh4f` defect.
  // Keyed on the DECLARATION'S id, not the directory basename: this root
  // holds its skills directly, so `discoverGroups` takes the
  // `SKILLS_CATEGORIES[decl.id]` branch — the same one `bootstrap` uses
  // below. Keyed on `crdm` it threw, naming the id it actually wanted.
  // `theming` is above, keyed by its package-subdirectory name. Two sessions
  // built that package independently on 2026-09-20 and this entry was the
  // duplicate: one put it at `skills/theming/` (a subdirectory, keyed by
  // basename) and the other at a top-level `cat-harness/theming/` (a declared
  // directory, keyed by id). Same key either way, so the object literal had
  // it twice. The subdirectory won on evidence — bean `lps0` measured that
  // `kg-audit`'s `skillFiles()` walks a hardcoded `skills/`, so the top-level
  // placement silently dropped its skills out of skill QA.
  "methodology-crdm": "CRDM requirements methodology (methodologies/crdm)",
  "methodology-raci": "RACI involvement model (methodologies/raci)",
  "remote-stubs": "Declared but not implemented here (stubs)",
  // The entries below are declared kg directories that hold their skills
  // DIRECTLY rather than in package subdirectories, so they are keyed by the
  // directory's DECLARED ID — `bootstrap`, not `bootstrap/skills`.
  //
  // #428 keyed them by repo-relative path, which works and has a short
  // half-life: the declaration says on its own entry that "ids are stable
  // across a relocation, paths are not", and this file had already paid for
  // that twice in one day — the basename was `bootstrap` only until #422 moved
  // those skills to `bootstrap/skills/`.
  //
  // `cat-harness-src` was a third such entry, for `src/skills/`, and is gone
  // as of #760. That directory held ONE skill beside the `.ts` implementing
  // it — a thing `skills/folio-core/` already does eight times over — and its
  // only distinguishing property was that `discoverLocalPackages` named it
  // `cat-harness` while the declaration gave that id to `skills/`: one name,
  // two real directories. `corpus-grep` now sits in `folio-core` with its
  // siblings and needs no category of its own.
  "bootstrap": "CatBootstrap (read before anything else is known)",
  // CatBootstrap's SECOND declared directory, and the one that constitutes its
  // exemption rather than describing it: the layer is excused a visualiser and
  // owes its own `.jsonld`/`.json` instead, so the skills governing that
  // emission ARE the substitute. Its own heading, because a reader meeting
  // "how bootstrap emits its graph" under "read before anything else is
  // known" would reasonably conclude they have to read it first. Bean `hfkl`.
  "bootstrap-render": "CatBootstrap rendering (bootstrap/render)",
  // Two top-level named subgraphs, staged ahead of the split (#223) and both
  // keyed by DECLARED ID for the reason the comment above gives: their paths
  // will change at the `cat-harness/` move and their ids will not.
  //
  // `kg-navigation` shares its name with `bootstrap/skills/kg-navigation.md`
  // and the two are DIFFERENT DOCUMENTS — the tooled route and the zero-install
  // floor. Measured 2026-09-20, before this entry existed: the published page
  // carried bootstrap's body under the tooled one's name, so a reader landing
  // there got the wrong skill with nothing saying so. That is the same
  // collision `todo-manager` and `bean-coordination` are listed for below, and
  // it is resolved the same way.
  "kg-navigation": "Knowledge-graph navigation (tooled)",
  "large-datasets-skills": "Large data sets (subsetting, materializing, publishing)",
  "who-iris-skills": "WHO IRIS (catalogue instance)",
};

/**
 * Every skill package under `skills/`, found on disk.
 *
 * ## The defect this replaces
 *
 * `GROUPS` listed four `skills/` packages. **Six hold `.md`.** Measured
 * 2026-09-19: `authoring-math` (3 skills) and
 * `authoring-who-smart-guidelines` (9) were absent, so all twelve of their
 * instruction bodies were NEVER PUBLISHED — and four of them
 * (`fhir-validation`, `l2-dak-authoring`, `bpmn-authoring`,
 * `latex-authoring`) are named by `<folio:skill ref>` in the BPMN diagrams.
 * An agent following `workflow_next` to one of those steps is handed a skill
 * whose published reference page 404s.
 *
 * The comment on the `.claude/skills/local` entry below records the SAME bug
 * being fixed for one directory earlier the same day. Fixing one member of a
 * family and leaving two is what a hardcoded list guarantees, so the list is
 * gone.
 *
 * ## Forgetting is loud, not silent
 *
 * A discovered package with no {@link SKILLS_CATEGORIES} label **throws**,
 * naming the directory. That is deliberate: the alternative — deriving a label
 * from the directory name — would publish the package under a plausible
 * heading nobody chose, and the whole failure being fixed here is content
 * going missing without anything saying so. Adding a package is one line;
 * forgetting it stops the build.
 */
/** Does this directory hold at least one skill `.md` directly? */
function holdsSkill(dir: string): boolean {
  try {
    return readdirSync(dir).some((f) => f.endsWith(".md") && isSkillMd(join(dir, f)));
  } catch {
    return false;
  }
}

function discoverGroups(): Group[] {
  const out: Group[] = [];
  const undeclared: string[] = [];
  // Every DECLARED knowledge-graph directory, not `skills/` alone: an instance
  // may put its graph anywhere, and this repository declares three —
  // `skills/`, `bootstrap/skills/` and `src/skills/` (beans `x3bd`, `osbo`).
  //
  // A directory may hold skills DIRECTLY as well as in packages: `src/skills/`
  // holds `corpus-grep.md` beside the `.ts` implementing it, and
  // `bootstrap/skills/` holds both of bootstrap's.
  //
  // THE TWO CASES ARE KEYED DIFFERENTLY, and that is the point. A package
  // NAMES ITSELF, so its basename is the key. A root does not — its basename
  // is an artefact of where the declaration happens to point — so the key is
  // its DECLARED ID. This file keyed a root by basename until #422 moved
  // bootstrap's skills one level down and the generator demanded a heading for
  // a package called "skills"; #428 then keyed by repo-relative path, which
  // has the same shape of failure one move later.
  for (const decl of kgDirectories(INSTANCE_ROOT)) {
    const skillsRoot = decl.absPath;
    const rel = relative(INSTANCE_ROOT, skillsRoot);
    if (holdsSkill(skillsRoot)) {
      const direct = SKILLS_CATEGORIES[decl.id];
      if (direct === undefined) undeclared.push(decl.id);
      else out.push({ category: direct, dir: skillsRoot, repoPrefix: rel });
    }
    for (const d of readdirSync(skillsRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!d.isDirectory()) continue;
      const dir = join(skillsRoot, d.name);
      // No SKILL `.md` means it is not a skill package: `workflows/`,
      // `roles/`, `permissions/`, `requirements/`, `framework/`,
      // `remote-packages/` and `memory/` are other node kinds.
      //
      // Literally the same test as `scripts/known-skills.ts`, by calling it.
      // This comment used to CLAIM that while carrying its own copy, and the
      // copy was falsified by `skills/memory/` — 25 agent-memory nodes, every
      // one a `.md`, none a skill. The generator then demanded a category
      // heading for a package that publishes nothing.
      if (!holdsSkill(dir)) continue;
      const category = SKILLS_CATEGORIES[d.name];
      if (category === undefined) {
        undeclared.push(d.name);
        continue;
      }
      out.push({ category, dir, repoPrefix: `${rel}/${d.name}` });
    }
  }
  if (undeclared.length > 0) {
    throw new Error(
      `skill package(s) with no category in SKILLS_CATEGORIES: ${undeclared.join(", ")}.
` +
        `Add a heading for each in scripts/gen-skill-docs.ts. A package is not published ` +
        `under a guessed heading — that is how twelve skills went unpublished unnoticed.`,
    );
  }
  return out;
}

const GROUPS: Group[] = [
  ...discoverGroups(),
  // Local skills — the harness-specific ones under `.claude/skills/local/`.
  //
  // Absent from this list until 2026-09-19, which meant the authoritative spec
  // for the ten `trap-*` criteria was neither published nor guarded by
  // `--check`, while the copy of `todo-manager.md` beside it carried the MOST
  // inbound references of the three and had no guard at all (`AGENTS.md`, bean
  // `rmer`). Only `.md` files are read, so the 23 `.json` capability and skill
  // descriptors in that directory are not mistaken for instruction bodies.
  //
  // `todo-manager.md` and `bean-coordination.md` here are now STUBS pointing at
  // `skills/folio-core/` (bean `tdmg`): those were never servable by
  // `skill_fetch` and had drifted from the copies that were. `language-trap-
  // agent-audit.md` is the real content this group exists to publish.
  {
    category: "Local skills (.claude/skills/local)",
    dir: join(repoRootFor(INSTANCE_ROOT), ".claude", "skills", "local"),
    repoPrefix: ".claude/skills/local",
    publishPrefix: "local-",
  },
];

/**
 * Inline a split skill's parts into its published page.
 *
 * A long skill may be an entry point plus siblings under `<name>/`, read on
 * demand — the pattern `AGENTS.md` prescribes for `MEMORY.md`, and what
 * `kg-audit`'s `skill-not-a-document` pushes a 1281-line skill towards. That
 * split exists to bound what an AGENT loads at invocation time. It is not a
 * reason to fragment the human-facing reference, where a reader browsing one
 * skill wants the whole of it.
 *
 * So the parts are appended here rather than published as pages of their own.
 * Publishing them separately would also collide: this output directory is
 * flat, and `integration-watcher/idle-backlog.md` shares a basename with the
 * real `idle-backlog` skill.
 *
 * Found by measurement, not design: splitting five skills silently dropped
 * ~2,500 lines from the published site, and left every entry point linking to
 * a path that 404s there. The link rewrite below is the other half — a
 * relative `](name/part.md)` becomes an in-page anchor.
 */
function withParts(dir: string, name: string, body: string): string {
  const partsDir = join(dir, name);
  if (!existsSync(partsDir)) return body;
  const parts = readdirSync(partsDir)
    .filter((f) => f.endsWith(".md") && isSkillMd(join(partsDir, f))).sort();
  if (parts.length === 0) return body;

  // `](integration-watcher/lifecycle.md)` -> `](#part-lifecycle)`
  let out = body.replace(
    new RegExp(`\\]\\(${name}/([\\w.-]+)\\.md\\)`, "g"),
    (_m, part: string) => `](#part-${part})`,
  );
  for (const part of parts) {
    const stem = basename(part, ".md");
    const text = stripFrontMatter(readFileSync(join(partsDir, part), "utf-8")).replace(/^\n+/, "");
    out += `\n\n---\n\n<a id="part-${stem}"></a>\n\n${text}`;
  }
  return out;
}

/** Strip a leading YAML front-matter block (`---\n…\n---`) if present. */
function stripFrontMatter(text: string): string {
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) {
      const after = text.indexOf("\n", end + 1);
      return after !== -1 ? text.slice(after + 1) : "";
    }
  }
  return text;
}

/** Derive a concise nav title from the first H1, else the filename. */
function deriveTitle(body: string, name: string): string {
  const m = body.match(/^#\s+(.+)$/m);
  let title = m ? m[1].trim() : name;
  // Trim "<thing> — long descriptor" down to the lead, and a trailing " Skill".
  title = title.split(" — ")[0].replace(/\s+Skill$/i, "").trim();
  return title || name;
}

function escapePipes(s: string): string {
  return s.replace(/\|/g, "\\|");
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const indexRows: Record<string, string[]> = {};
  // One page per skill id in a flat output dir; if a skill appears in more than
  // one source group (e.g. an agent skill that also has a folio-core copy), the
  // first group wins and later duplicates are listed as a cross-reference.
  const written = new Map<string, string>(); // skill name → category that emitted it

  for (const group of GROUPS) {
    indexRows[group.category] = [];
    if (!existsSync(group.dir)) continue;
    // `isSkillMd`, not a bare `.md` test — the FOURTH place in this repository
    // that predicate was spelled out by hand, and the second in this file.
    // Without it `bootstrap/README.md` was published as a skill instruction
    // page titled "bootstrap", complete with an "edit this page's source"
    // link, for a file that is not a skill.
    const files = readdirSync(group.dir)
      .filter((f) => f.endsWith(".md") && isSkillMd(join(group.dir, f)))
      .sort();

    for (const file of files) {
      const name = basename(file, ".md");
      const published = `${group.publishPrefix ?? ""}${name}`;
      // Keyed on the PUBLISHED name, not the source basename. Two groups may
      // legitimately hold different documents under one basename, and keying on
      // the basename made the generator drop the second one while the index
      // claimed it was "(same page)". A false claim about two documents is
      // worse than either publishing or omitting one, because a reader stops
      // looking. (The `todo-manager` pair that motivated this is now a skill
      // plus a stub — bean `tdmg` — but the key must stay published-name-based:
      // the stubs still publish, and `language-trap-agent-audit.md` shows the
      // local group holds real content of its own.)
      if (written.has(published)) {
        indexRows[group.category].push(
          `| [${name}](${published}.html) | \`${name}\` | — | _also in ${written.get(published)} (same page)_ |`,
        );
        console.log(`  ↪ ${published} (dup — kept ${written.get(published)})`);
        collisions.push({
          published,
          kept: written.get(published) ?? "(unknown)",
          from: group.category,
        });
        continue;
      }
      // Where another group holds the same basename, say so on both pages: a
      // reader who lands on one has no way to know the other exists.
      //
      // **The text is now directional, and that is the `tdmg` correction.** It
      // used to read "Two different skills share this name … They are not
      // copies … Which is canonical is an open question … Read both before
      // relying on either." Every clause of that is now false — the local
      // copies are stubs, `skill_fetch` only ever served `skills/folio-core`,
      // and reading both is the opposite of the advice. A generator that
      // publishes a stale claim about which document governs is worse than one
      // that publishes no banner, because a reader acts on it.
      const twin = SAME_BASENAME_DIFFERENT_DOCUMENT[name];
      const raw = readFileSync(join(group.dir, file), "utf-8");
      let body = withParts(group.dir, name, stripFrontMatter(raw).replace(/^\n+/, ""));
      if (twin) {
        const other = twin.find((t) => t.published !== published);
        const self = twin.find((t) => t.published === published);
        if (other) {
          body =
            (self?.canonical === true
              ? `> **This is the skill \`skill_fetch\` serves.** A stub of the same name\n` +
                `> lives at \`${other.repoPrefix}\` and is published as\n` +
                `> [${other.label}](${other.published}.html); it only points here.\n` +
                `> Edit this page's source, never the stub.\n\n`
              : `> **This is a stub, not the skill.** The skill is\n` +
                `> [${other.label}](${other.published}.html), from \`${other.repoPrefix}\`,\n` +
                `> which is what \`skill_fetch\` serves. Read that one; this page exists\n` +
                `> only so an old link still lands somewhere truthful.\n\n`) +
            body;
        }
      }
      const title = deriveTitle(body, name);

      const hasSchema = existsSync(join(SCHEMA_DIR, `${name}.md`));
      const sourceUrl = `https://github.com/litlfred/folio-assistant/blob/main/${group.repoPrefix}/${file}`;
      // `/edit/`, not `/blob/`. The banner has always carried the CORRECT
      // source path -- the thing it lacked was a way to act on it. GitHub's
      // in-browser editor lives at /edit/<branch>/<path>; /blob/ is read-only,
      // so a reader who spotted a typo had to navigate to the file, find the
      // pencil, and then edit. This is the same target, one click instead of
      // three.
      const editUrl = `https://github.com/litlfred/folio-assistant/edit/main/${group.repoPrefix}/${file}`;

      const page: string[] = [];
      page.push("---");
      page.push("layout: default");
      // QUOTED, always. A skill's title is its H1, which is prose — so it
      // carries colons ("Contrast: measured over the darkest thing that could
      // be there") and backticks, and YAML rejects both unquoted. The page
      // then has front matter Jekyll cannot parse, which `translation:index`
      // reports as *"it could not be translated as things stand"* and nothing
      // else notices, because the page still renders.
      //
      // Measured 2026-09-20: SIX generated pages were in that state, four of
      // them predating the skill that made the seventh. Quoting here fixes the
      // class rather than renaming headings one at a time.
      //
      // Single quotes, with YAML's own escape (a doubled quote), because a
      // title may contain a backtick and a double-quoted scalar would then
      // need backslash rules a heading has no reason to obey.
      page.push(`title: '${title.replace(/'/g, "''")}'`);
      page.push("parent: Skill instructions");
      page.push("---");
      page.push("");
      page.push("{: .note }");
      page.push(
        `> Generated from [\`${group.repoPrefix}/${file}\`](${sourceUrl}) — do not edit here.` +
          (hasSchema ? ` Typed contract: [schema reference](../skills/${name}.html).` : ""),
      );
      page.push(">");
      // The edit affordance is a SEPARATE line inside the callout rather than
      // more prose on the end of it. "do not edit here" and "edit it there"
      // are opposite instructions, and running them into one sentence is how
      // a reader ends up editing the generated copy anyway.
      page.push(`> [${EDIT_GLYPH} Edit this page's source](${editUrl}){: .fa-edit-source }`);
      page.push("");
      // Wrap the body in a Liquid raw block so prose containing `{{ }}` / `{% %}`
      // (math, code, templates) is emitted verbatim, not parsed by Jekyll.
      page.push("{% raw %}");
      page.push(body.trimEnd());
      page.push("{% endraw %}");
      page.push("");
      emit(join(OUT_DIR, `${published}.md`), page.join("\n"));
      written.set(published, group.category);

      const desc = escapePipes((body.match(/^#\s+.+\n+([^\n#].*)$/m)?.[1] ?? "").slice(0, 100));
      const schemaCell = hasSchema ? `[schema](../skills/${name}.html)` : "—";
      indexRows[group.category].push(`| [${title}](${published}.html) | \`${name}\` | ${schemaCell} | ${desc} |`);
      console.log(`  ✓ ${published}.md (${group.category})`);
    }
  }

  // Index page
  const idx: string[] = [];
  idx.push("---");
  idx.push("layout: default");
  idx.push("title: Skill instructions");
  idx.push("nav_order: 6");
  idx.push("has_children: true");
  idx.push("---");
  idx.push("");
  idx.push("# Skill instructions");
  idx.push("");
  idx.push("The prose **instruction bodies** the LLM loads (via `skill_fetch`) when it");
  idx.push("runs a skill. These are generated from the skill source markdowns, so the");
  idx.push("published reference always matches what the agent actually reads.");
  idx.push("");
  idx.push("For each skill's *typed input/output contract*, see the");
  idx.push("[Skill schema reference](../skills/); for the conceptual overview of skills,");
  idx.push("roles, and how they compose with the LLM, see [Skills & roles](../../skills.html).");
  idx.push("");
  for (const group of GROUPS) {
    const rows = indexRows[group.category];
    idx.push(`## ${group.category}`);
    idx.push("");
    if (rows.length === 0) {
      idx.push("_None yet._");
      idx.push("");
      continue;
    }
    idx.push("| Skill | Id | Schema | Summary |");
    idx.push("|-------|----|--------|---------|");
    idx.push(...rows);
    idx.push("");
  }
  idx.push("> The `authoring-math` and `authoring-who-smart-guidelines` packages ship");
  idx.push("> skill *definitions* + typed schemas today; their prose instruction bodies");
  idx.push("> will appear here as they are authored.");
  idx.push("");
  emit(join(OUT_DIR, "index.md"), idx.join("\n"));
  const total = Object.values(indexRows).reduce((n, r) => n + r.length, 0);
  console.log(`  ✓ index.md (${total} instruction bodies)`);
  // BEFORE the drift report: a dropped document is not staleness, and a run
  // that exits 0 on "up to date" would bury it.
  reportCollisions();
  reportDrift();
  console.log(`\nWrote skill instruction docs to ${OUT_DIR}`);
}

main();
