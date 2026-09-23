#!/usr/bin/env bun
/**
 * readme-sections.ts — generated README sections, injected only where the
 * folio asked for them.
 *
 * ## What this replaces, and why it is not a smaller change
 *
 * `scripts/generate-readme.sh` assembled a whole README and ended in
 * `cp "$OUT" README.md`. What it assembled was one folio's content held in
 * the platform: the title `# Quantum Observable Universe`, three
 * `litlfred/qou` CI badges, a Knot Registry of Alexander-Briggs indices, a
 * Project Structure table naming `content/quantum-observable-universe/lean/`,
 * a Published Artefacts table of `litlfred.github.io/qou` URLs, and a CC BY
 * 4.0 licence block. Run it in any other folio and the author loses their
 * README and gains that one.
 *
 * Only a handful of its sections were actually *derived from the tree* — the
 * contents table, Lean coverage, Lean modules, the simulator list, the
 * workflow list. The rest was prose, and prose about a folio belongs to that
 * folio. So the fix is not to parameterise the prose; it is to stop the
 * platform owning the file. Each generated section is delimited by its own
 * marker pair, and a section is written **only where its markers already
 * appear**. A folio opts in by adding them. There is no code path that
 * touches a byte outside a marked region, which is the property the
 * predecessor could not have.
 *
 * ## Adding a section
 *
 * Append to {@link SECTIONS}: a marker name, a one-line summary for
 * `--list`, and a renderer. A renderer returns Markdown plus any notes worth
 * printing to the operator — "this folio has no simulators" is a note, not an
 * empty table. Nothing else needs touching; the CLI, the MCP tool and the
 * staleness check all read the registry.
 *
 * Lean sections live here rather than in a paper-only module because the
 * registry is one list and a document folio simply never carries their
 * markers. They render nothing and cost nothing where Lean is absent.
 *
 * @module content/pipeline/readme-sections
 */

import { folioDir } from "../../schemas/cat-harness.js";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { basename, join, relative, resolve } from "path";

/** The PLATFORM root — where the science layer would be installed. */
const ROOT = resolve(import.meta.dir, "../..");

import {
  discoverPapers,
  injectSection,
  loadReadmeConfig,
  renderToc,
  type ReadmeTocConfig,
} from "./readme-toc";
import { findContentRepoRoot } from "./repo-root";
import { expectedInstanceConfigPath } from "../../schemas/harness-config";
import {
  AGENT_INSTRUCTIONS_ROLE,
  assetRolePurpose,
  INSTANCE_README_ROLE,
  declaredAssetPath,
  instanceRootsIn,
  readDeclaration,
  workPlanGraphsIn,
} from "../../schemas/cat-harness";

// ── Section contract ────────────────────────────────────────────────────────

export interface SectionContext {
  root: string;
  cfg: ReadmeTocConfig;
  /** Fetch the publish ref when it is missing locally. Only the TOC uses it. */
  fetch: boolean;
  /**
   * Lean coverage statistics, when the science layer is installed.
   *
   * Resolved ONCE by {@link runReadmeSync} and passed in, rather than imported
   * at the top of this file. The registry is deliberately one list — see the
   * module header — but `computeStats` lives in the science layer, so
   * importing it here made the GENERIC section registry depend on it, and a
   * folio without that layer must still be able to sync its TOC.
   *
   * `undefined` means NOT INSTALLED, which the coverage section reports
   * through {@link undetermined} — leaving whatever the README already has,
   * rather than replacing a correct table with "no Lean found".
   */
  leanCoverage?: LeanCoverageStats;
}

/**
 * What {@link SectionContext.leanCoverage} provides, if anything does.
 *
 * The shape is written out here rather than imported from the science layer,
 * because `import type` is still an import as far as the repository partition
 * is concerned — it is what a consumer must be able to read WITHOUT that layer
 * installed. It is the subset this section renders, not the whole `Stats`
 * record: `computeStats` also returns `paper`, `generated_at`, `total_blocks`
 * and `by_kind`, which the table does not show and this contract therefore
 * does not demand.
 */
export type LeanCoverageStats = (
  paperDir: string,
  folioRoot: string,
) => {
  provable: { total: number; with_lean_file: number; sorry_free: number; percent_sorry_free: number };
  conjectures: { total: number; with_lean_file: number; class_axiomatized: number; percent_class_axiomatized: number };
  definitions: { total: number; with_lean_file: number };
};

export interface SectionOutput {
  markdown: string;
  /** Operator-facing remarks: what was empty, what could not be read. */
  notes: string[];
  /**
   * "I could not determine this" — leave whatever the README already has.
   *
   * Distinct from an empty result, and the distinction is the whole point.
   * The folio this was built against configured its simulators under
   * `folio-assistant/simulators`, a directory that only existed once the
   * platform submodule was checked out. In a clone without it, "the directory
   * is not there" was rendered as "this folio has no simulators", and a
   * correct nine-row table was replaced by a sentence saying it did not
   * exist. Same rule as the TOC's unreadable publish ref: not-looked-at is
   * never reported as nothing-found.
   *
   * That folio now owns its simulators outright, so the submodule case is
   * gone — but a configured directory can be absent for other reasons (a
   * sparse or partial checkout, a folio mid-migration), and this state is
   * what keeps any of them from being reported as "no simulators".
   */
  skip?: boolean;
}

export interface ReadmeSection {
  /** Marker name; the README carries `<!-- <marker>:begin -->` … `:end`. */
  marker: string;
  /** One line, shown by `--list`. */
  summary: string;
  render(ctx: SectionContext): SectionOutput;
}

/** Escape the cell separator so a title containing `|` cannot break a table. */
function cell(text: string): string {
  return text.replace(/\|/g, "\\|");
}

/** An italic line standing in for a table with no rows — a determined answer. */
function empty(what: string): SectionOutput {
  return { markdown: `_No ${what} in this folio._\n`, notes: [`no ${what} found`] };
}

/** An undetermined answer: keep whatever the README already shows. */
function undetermined(why: string): SectionOutput {
  return { markdown: "", notes: [`left unchanged — ${why}`], skip: true };
}

// ── Lean helpers ────────────────────────────────────────────────────────────

/**
 * A paper's Lake library name, for prefixing module names.
 *
 * Read from the paper's `lakefile.toml`, because the predecessor hardcoded
 * `QOU.` and stamped it onto the modules of every folio. When no lakefile
 * names a library, modules are listed **unprefixed** rather than under an
 * invented namespace: a wrong namespace is a worse answer than none, since it
 * is the string a reader would paste into an `import`.
 */
export function leanLibName(root: string, paper: string): string | undefined {
  for (const candidate of [
    join(folioDir(root),  paper, "lean", "lakefile.toml"),
    join(folioDir(root),  paper, "lakefile.toml"),
  ]) {
    if (!existsSync(candidate)) continue;
    const src = readFileSync(candidate, "utf-8");
    const name = src.match(/\[\[lean_lib\]\][\s\S]*?name\s*=\s*"([^"]+)"/)?.[1];
    if (name) return name;
  }
  return undefined;
}

/** The directory holding a paper's Lean sources, if it has one. */
function leanDir(root: string, paper: string): string | undefined {
  const dir = join(folioDir(root),  paper, "lean");
  return existsSync(dir) ? dir : undefined;
}

/** Papers that carry Lean sources. Empty in a document folio. */
function papersWithLean(root: string): { dir: string; title: string; lean: string }[] {
  return discoverPapers(root)
    .map((p) => ({ ...p, lean: leanDir(root, p.dir) }))
    .filter((p): p is { dir: string; title: string; lean: string } => p.lean !== undefined);
}

// ── The sections ────────────────────────────────────────────────────────────

const tocSection: ReadmeSection = {
  marker: "folio:toc",
  summary: "One chapter table per paper, with publish-ref-verified PDF links.",
  render({ root, cfg, fetch }) {
    const toc = renderToc(root, cfg, fetch);
    const notes: string[] = [];
    if (toc.publishRefUnavailable) {
      notes.push(
        `publish ref '${cfg.publishRef}' not readable here — PDF column omitted. ` +
          `Re-run with --fetch, or: git fetch --depth 1 origin ` +
          `${cfg.publishRef}:refs/remotes/origin/${cfg.publishRef}`,
      );
    } else if (toc.missingPdfs.length > 0) {
      notes.push(
        `${toc.missingPdfs.length} chapter(s) have no published PDF and render '—': ` +
          toc.missingPdfs.map((m) => `${m.paper}/${m.chapter}`).join(", "),
      );
    }
    return { markdown: toc.markdown, notes };
  },
};

const leanCoverageSection: ReadmeSection = {
  marker: "folio:lean-coverage",
  summary: "Formalisation coverage per paper: provable claims, conjectures, definitions.",
  render({ root, leanCoverage }) {
    // No science layer, no coverage — and NOT an empty table. An absent
    // toolchain is "could not determine", so a README already carrying a
    // correct table keeps it. Exactly the distinction this file was written
    // around: an empty directory is a determined empty; a missing one is not.
    if (!leanCoverage) return undetermined("the science layer is not installed here");
    const papers = papersWithLean(root);
    if (papers.length === 0) return empty("papers with Lean sources");

    const folioRoot = folioDir(root);
    const rows: string[] = [];
    const notes: string[] = [];
    for (const paper of papers) {
      let stats;
      try {
        stats = leanCoverage(paper.dir, folioRoot);
      } catch (e) {
        // A paper whose stats will not compute is named, not skipped: a table
        // silently missing a row reads as a paper with no Lean at all.
        notes.push(`${paper.dir}: coverage unavailable (${e instanceof Error ? e.message : e})`);
        rows.push(`| ${cell(paper.title)} | _coverage unavailable_ | — | — | — |`);
        continue;
      }
      const p = stats.provable;
      const c = stats.conjectures;
      const d = stats.definitions;
      rows.push(
        `| ${cell(paper.title)} | Provable claims | ${p.total} | ${p.with_lean_file} | ` +
          `**${p.sorry_free} sorry-free (${p.percent_sorry_free}%)** |`,
        `| | Conjectures (open) | ${c.total} | ${c.with_lean_file} | ` +
          `**${c.class_axiomatized} class-axiomatised (${c.percent_class_axiomatized}%)** |`,
        `| | Definitions | ${d.total} | ${d.with_lean_file} | — |`,
      );
    }

    return {
      markdown:
        ["| Paper | Block kind | Total | With Lean sibling | Fully formalized |",
         "|-------|------------|------:|------------------:|-----------------:|",
         ...rows].join("\n") + "\n",
      notes,
    };
  },
};

const leanModulesSection: ReadmeSection = {
  marker: "folio:lean-modules",
  summary: "Lean modules per paper, namespaced by the paper's Lake library.",
  render({ root }) {
    const papers = papersWithLean(root);
    if (papers.length === 0) return empty("papers with Lean sources");

    const out: string[] = [];
    const notes: string[] = [];
    for (const paper of papers) {
      const lib = leanLibName(root, paper.dir);
      if (!lib) notes.push(`${paper.dir}: no [[lean_lib]] in a lakefile — modules listed unprefixed`);
      const prefix = lib ? `${lib}.` : "";
      const libDir = lib && existsSync(join(paper.lean, lib)) ? join(paper.lean, lib) : paper.lean;

      const entries = readdirSync(libDir, { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile() && e.name.endsWith(".lean"))
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b));
      const subdirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b));

      if (papers.length > 1) out.push(`**${paper.title}**`, "");
      if (files.length === 0 && subdirs.length === 0) {
        out.push(`_No Lean modules under \`${lib ?? "lean"}/\`._`, "");
        continue;
      }
      out.push("| Module | Source |", "|--------|--------|");
      for (const f of files) out.push(`| \`${prefix}${basename(f, ".lean")}\` | \`${f}\` |`);
      for (const d of subdirs) {
        const count = readdirSync(join(libDir, d)).filter((f) => f.endsWith(".lean")).length;
        out.push(`| \`${prefix}${d}.*\` | \`${count} files\` |`);
      }
      out.push("");
    }
    return { markdown: out.join("\n").trimEnd() + "\n", notes };
  },
};

const simulatorsSection: ReadmeSection = {
  marker: "folio:simulators",
  summary: "Interactive simulators, from the folio's configured simulators directory.",
  render({ root }) {
    // The directory is config, not convention: the predecessor read
    // `folio-assistant/simulators` literally, which is only where a folio that
    // embeds the platform under that name puts them. The fallback is now the
    // folio-root convention, because simulators are the FOLIO's content — a
    // default naming the platform is how they came to live in the platform in
    // the first place.
    let dir = "simulators";
    const configPath = expectedInstanceConfigPath(root);
    // `undefined` = nothing declares an instance here; nothing to read.
    if (configPath !== undefined && existsSync(configPath)) {
      try {
        const parsed = JSON.parse(readFileSync(configPath, "utf-8")) as {
          simulators?: { dir?: string };
        };
        if (parsed.simulators?.dir) dir = parsed.simulators.dir;
      } catch {
        // Reported by the tools that own the config; fall back to the default.
      }
    }

    const abs = join(root, dir);
    if (!existsSync(abs)) {
      // Not `empty`: the directory being absent from THIS checkout says
      // nothing about whether the folio has simulators — it may be a sparse or
      // partial checkout, or a folio that has not declared its directory.
      return undetermined(
        `simulators directory '${dir}' is not present in this checkout ` +
          `(is it declared in ${configPath === undefined ? "this instance's config" : basename(configPath)}, ` +
          "and is the checkout complete?)",
      );
    }
    const files = readdirSync(abs)
      .filter((f) => f.endsWith(".html"))
      .sort();
    if (files.length === 0) return empty("simulators");

    const rows = files.map((f) => {
      const raw = basename(f, ".html");
      const pretty = raw
        .split(/[_-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return `| ${cell(pretty)} | [\`${dir}/${f}\`](${dir}/${f}) |`;
    });
    return {
      markdown: ["| Simulator | File |", "|-----------|------|", ...rows].join("\n") + "\n",
      notes: [],
    };
  },
};

const workflowsSection: ReadmeSection = {
  marker: "folio:workflows",
  summary: "GitHub Actions workflows, described by their own `name:` field.",
  render({ root }) {
    // `root` is the FOLIO's root, supplied by the caller — this module
    // generates a folio's README, not this instance's. `.github/` sits at that
    // root. The `repoRootFor` sweep of 2026-09-19 treated this like the ~57
    // sites where `root` meant this instance, and sent it to the folio's
    // PARENT. The platform assuming it is the folio is the boundary this
    // repository exists to keep.
    const dir = join(root, ".github", "workflows");
    if (!existsSync(dir)) return empty("`.github/workflows` directory");
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
      .sort();
    if (files.length === 0) return empty("workflows");

    const rows: string[] = [];
    const notes: string[] = [];
    for (const f of files) {
      // The `name:` the workflow gives itself, never a lookup table. The
      // predecessor carried a hardcoded map of one folio's twelve workflow
      // filenames and consulted it FIRST, so a folio that reused a filename
      // got the other folio's description, and every workflow outside the map
      // got whatever its YAML said — two different sources in one column.
      let name = "";
      try {
        name = readFileSync(join(dir, f), "utf-8")
          .match(/^name:\s*(.+)$/m)?.[1]
          ?.trim()
          .replace(/^["']|["']$/g, "") ?? "";
      } catch {
        notes.push(`${f}: unreadable`);
      }
      if (!name) notes.push(`${f}: no \`name:\` field — description left blank`);
      rows.push(`| \`${f}\` | ${cell(name)} |`);
    }
    return {
      markdown: ["| Workflow | Purpose |", "|----------|---------|", ...rows].join("\n") + "\n",
      notes,
    };
  },
};

// ── Harness instances ───────────────────────────────────────────────────────

/**
 * Two entries per instance, because two different readers arrive.
 *
 * The owner, 2026-09-20:
 *
 * > find beans related to readme, associated to harness instances, they must
 * > add to main one. should provide both Agent links (agents.md , memories)
 * > AND human docuemntaion (docs/) link for each harness.
 *
 * ## Why this is generated rather than written
 *
 * The same instruction carried its own constraint — *"be careful to do this to
 * minimize drift, maybe tool to use json/jsonld queries for aaplicable KGs"* —
 * and this repository has paid for the other shape repeatedly: a hardcoded
 * list of instances in two gates (bean `6tkl`), a hardcoded skills catalogue,
 * a comment asserting a committed artefact that was gitignored. **A table of
 * instances written by hand is wrong the day an instance is added**, and
 * nobody finds out, because a README is the one file no check reads.
 *
 * So every cell here is resolved from the instance's own `harness.json`: its
 * declared assets for the two file links, its declared `graphs` for the two
 * directory links. Nothing is composed from a convention — `join(root,
 * "AGENTS.md")` would render a link to a file that may not be declared, and
 * the whole point of the criterion in `check:subgraph-coverage` is that an
 * undeclared file is one no checker has a reason to look at.
 *
 * ## A gap is rendered AS a gap
 *
 * An instance with no `agent-instructions` asset gets an em dash and a
 * footnote count, never a blank cell and never a guessed path. Eight of eleven
 * instances were in that state when this was written, and a table that quietly
 * omitted them would have read as though the work were done. Same rule as
 * every other section here: not-looked-at is never reported as nothing-found,
 * and a KNOWN gap is not reported as an absence either.
 */
const instancesSection: ReadmeSection = {
  marker: "cat-harness:instances",
  summary: "Every harness instance in this repository, with its agent entry and its human entry",
  render(ctx) {
    // `ctx.root` and NOT `repoRootFor(ctx.root)`: this section indexes the
    // instances held by the instance whose README is being written, and
    // `repoRootFor` is `instanceRoot/..` — correct for a nested instance
    // asking "which repository am I in", and one level too far for the
    // repository root itself, which is exactly the instance that carries this
    // section. Called that way it enumerated the CONTAINING directory and
    // rendered a one-row table listing this repository as its own child.
    const repo = ctx.root;
    const roots = instanceRootsIn(repo);
    // Zero instances is UNDETERMINED, not "this repository has none": the
    // reader is holding a README that sits in a repository which, by
    // construction, contains at least the instance that declared it.
    if (roots.length === 0) {
      return { markdown: "", notes: ["no instance declares a <name>.json — nothing was read"], skip: true };
    }

    const notes: string[] = [];
    const rows: string[] = [];
    let mute = 0;
    let undocumented = 0;

    for (const root of roots) {
      const rel = relative(repo, root);
      const here = rel === "" ? "." : rel;
      let decl;
      try {
        decl = readDeclaration(root);
      } catch (e) {
        notes.push(`${here}: declaration unreadable — ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      if (decl === undefined) continue;

      // A declared `src` or `path` is relative to the root its SCOPE names —
      // this instance's by default, the repository's when `scope` says so —
      // which is the one rule `rootForScope` exists to hold. Composing
      // `./<instance>/<path>` instead rendered cat-harness's `memory/` as
      // `./cat-harness/memory/`, and it is declared `scope: "repository"`, so
      // the real directory is at the repository root and the link was dead.
      // A dead link in a generated table is worse than a missing row: the row
      // asserts the entry exists.
      const link = (label: string, target: string, scope?: string): string => {
        const base = scope === "repository" || rel === "" ? "" : `./${rel}/`;
        return `[${label}](${base}${target})`;
      };

      // A file link is the DECLARED src, never a composed path.
      const asset = (role: string): { src: string; scope?: string } | undefined => {
        const a = (decl.assets ?? []).find((x) => x.role === role);
        return a === undefined ? undefined : { src: a.src, scope: a.scope };
      };
      // A directory link is any directory this instance declares as holding
      // that graph kind. Several is possible and all of them are rendered:
      // picking one would be this file choosing on the instance's behalf.
      const dirs = (kind: string): Array<{ path: string; scope?: string }> =>
        (decl.directories ?? [])
          .filter((d) => (d.graphKinds ?? []).includes(kind))
          .map((d) => ({ path: d.path, scope: d.scope }));

      const agents = asset(AGENT_INSTRUCTIONS_ROLE);
      const readme = asset(INSTANCE_README_ROLE);
      const memory = dirs("memory");
      const docs = dirs("docs");

      if (agents === undefined) mute += 1;
      if (docs.length === 0) undocumented += 1;

      const agentCell = [
        agents === undefined ? undefined : link("AGENTS.md", agents.src, agents.scope),
        ...memory.map((m) => link("memory", m.path, m.scope)),
      ].filter((x) => x !== undefined);
      const humanCell = [
        readme === undefined ? undefined : link("README", readme.src, readme.scope),
        ...docs.map((d) => link("docs", d.path, d.scope)),
      ].filter((x) => x !== undefined);

      rows.push(
        `| \`${cell(decl.name ?? here)}\` | ${cell(here)} | ` +
          `${agentCell.length === 0 ? "—" : agentCell.join(" · ")} | ` +
          `${humanCell.length === 0 ? "—" : humanCell.join(" · ")} |`,
      );
    }

    if (rows.length === 0) {
      return { markdown: "", notes: [...notes, "every declaration was unreadable"], skip: true };
    }

    // The gaps are stated under the table rather than left as em dashes a
    // reader has to count. `check:subgraph-coverage` is named because it is
    // the thing that will tell them WHICH instance, and a README that reports
    // a number without saying where to get the list is the "count in prose"
    // failure this repository already has a rule about.
    const gaps: string[] = [];
    if (mute > 0) {
      gaps.push(
        `**${mute} of ${rows.length}** declare no \`agent-instructions\` asset — readable by a person, ` +
          "mute to an agent. `bun run check:subgraph-coverage` names them.",
      );
    }
    if (undocumented > 0) {
      gaps.push(
        `**${undocumented} of ${rows.length}** declare no \`docs\` graph of their own; their reader-facing ` +
          "documentation is the harness layer's site.",
      );
    }

    return {
      markdown:
        [
          "| Instance | Path | For an agent | For a person |",
          "|----------|------|--------------|--------------|",
          ...rows,
        ].join("\n") +
        "\n" +
        (gaps.length === 0 ? "" : "\n" + gaps.map((g) => `> ${g}`).join("\n>\n") + "\n") +
        "\n" +
        `*\`AGENTS.md\` — ${assetRolePurpose(AGENT_INSTRUCTIONS_ROLE)}*  \n` +
        `*\`README\` — ${assetRolePurpose(INSTANCE_README_ROLE)}*\n`,
      notes,
    };
  },
};

// ── Cold start ──────────────────────────────────────────────────────────────

/**
 * What an arriving agent does first — four pointers, and the skill list is a
 * QUERY rather than an answer.
 *
 * The owner, 2026-09-20, on what the root README owes a cold agent:
 *
 * > • point to the bootstreap md overview of skill/tasks
 * > • point to kg-navation, instruct them where to find the list of skills in
 * >   materialed corpus (be careful to do this to minimize drift, maybe tool
 * >   to use json/jsonld queries for aaplicable KGs)
 * > • tell them to determine if active KG (beans/tods) or static (point to
 * >   process on determining context)
 * > • if active: see agent shoud can determine their role, process, task,
 * >   context/memoty (point to BPMN processes), then check for active beans
 * >   and (new/updated process) priotize and ask use which beans to work on
 *
 * ## The drift constraint is the design, not a caveat
 *
 * *"be careful to do this to minimize drift"* — so **this section never
 * lists skills.** It names the two calls that ask the graph, and the fallback
 * for an agent with no MCP server. A README that lists skills is wrong the
 * day a skill is added and nothing says so, because a README is the one file
 * no check reads. This repository has paid for that shape repeatedly: a
 * hardcoded instance list in two gates (`6tkl`), a hardcoded skills
 * catalogue, a comment asserting a committed artefact that was gitignored.
 *
 * The one thing it DOES compute is the active-vs-static verdict, because
 * that is a fact about this checkout rather than a list that can rot — see
 * {@link workPlanGraphsIn}, which derives it from each kind's `recordsWork`.
 */
const coldStartSection: ReadmeSection = {
  marker: "cat-harness:cold-start",
  summary: "What an arriving agent does first — four pointers, skills reached by query",
  render(ctx) {
    const repo = ctx.root;
    const roots = instanceRootsIn(repo);
    if (roots.length === 0) {
      return { markdown: "", notes: ["no instance declares a <name>.json — nothing was read"], skip: true };
    }

    const { plan, unreadable } = workPlanGraphsIn(repo);
    const notes: string[] = [];
    // THREE states. An unreadable declaration means the absence of a work
    // plan is unproven, and rendering STATIC over it would tell an arriving
    // agent there is nothing here — the one thing this section must not get
    // wrong. Same rule as every other section in this file: not-looked-at is
    // never reported as nothing-found.
    if (plan.length === 0 && unreadable.length > 0) {
      for (const u of unreadable) notes.push(`declaration unreadable: ${relative(repo, u) || "."}`);
      return {
        markdown: "",
        notes: [...notes, "active-vs-static could not be determined — region left untouched"],
        skip: true,
      };
    }
    const active = plan.length > 0;
    for (const u of unreadable) notes.push(`declaration unreadable, not counted: ${relative(repo, u) || "."}`);

    // The verdict, computed, with the evidence beside it — a bare ACTIVE is a
    // claim, and the whole point of deriving it is that a reader can check.
    const verdict = active
      ? `**This repository is an ACTIVE knowledge graph.** ` +
        plan
          .map((p) => `\`${cell(p.instance)}\` declares ${p.kinds.map((k) => `\`${k}\``).join(" and ")}`)
          .join("; ") +
        ` — work somebody is partway through, which you can pick up.`
      : `**This repository is a STATIC knowledge graph.** No instance declares a graph that records work ` +
        `(beans, todos, a BPMN instance mid-flight), so there is nothing here to pick up — it is here to be read.`;

    const lines = [
      "**Read this before you do anything else.**",
      "",
      verdict,
      "",
      "| | |",
      "|---|---|",
      "| **1. What the harness is, from nothing** | [`bootstrap/README.md`](bootstrap/README.md) — the overview of skills and tasks, written to assume no MCP server, no `beans`, no build. |",
      "| **2. How to find the graph, and the skills in it** | [`kg-navigation`](cat-harness/skills/kg-navigation/kg-navigation.md). **Ask for the skill list; never read one from here** — `skill_list` for what exists, `skill_fetch` to load one. No MCP? Resolve the `kg` graph from `<name>.json` and read the directory it names. |",
      "| **3. Whether this graph is active or static** | The verdict above is computed, not asserted: an instance is ACTIVE when it declares a graph kind whose `recordsWork` is true. Static? Then determine your context instead — [`process-state`](cat-harness/skills/workflow/process-state.md). |",
      active
        ? "| **4. It is active, so** | Work out your role, process and task from the BPMN under [`processes/`](cat-harness/processes/) — the diagrams are executable, not illustrations. Then read the work plan in [`beans/`](beans/), prioritise it, and **ask which items to work on**. That last step is an interaction rule, not a formality. |"
        : "| **4. It is static, so** | There is no work plan to prioritise and no process to resume. Determine your context from [`process-state`](cat-harness/skills/workflow/process-state.md) and work from what you were asked to do. |",
      "",
      "*Why no list of skills: a README is the one file no check reads, so a list in it is wrong the day a skill is added and nothing says so. The two calls above ask the graph instead.*",
      "",
    ];

    if (!active) {
      notes.push("no work-plan graph declared — rendered the STATIC branch");
    }
    return { markdown: lines.join("\n"), notes };
  },
};

export const SECTIONS: readonly ReadmeSection[] = [
  tocSection,
  coldStartSection,
  instancesSection,
  leanCoverageSection,
  leanModulesSection,
  simulatorsSection,
  workflowsSection,
];

// ── Sync ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  /** Markers found in the README and rewritten. */
  written: string[];
  /** Registered markers the README does not carry — skipped, not an error. */
  absent: string[];
  /** Markers present but left untouched because the section could not determine an answer. */
  skipped: string[];
  /** Whether any marked region's content changed. */
  changed: boolean;
  notes: string[];
  content: string;
}

/**
 * Rewrite every registered section the README actually carries.
 *
 * A registered marker the README omits is *absent*, not an error: sections are
 * opt-in per folio, and a document folio carrying only `folio:toc` is the
 * normal case, not a misconfiguration.
 */
export function syncSections(
  readme: string,
  ctx: SectionContext,
  only?: string[],
): SyncResult {
  const written: string[] = [];
  const absent: string[] = [];
  const skipped: string[] = [];
  const notes: string[] = [];
  let content = readme;
  let changed = false;

  for (const section of SECTIONS) {
    if (only && !only.includes(section.marker)) continue;
    if (!content.includes(`<!-- ${section.marker}:begin -->`)) {
      absent.push(section.marker);
      continue;
    }
    const out = section.render(ctx);
    if (out.skip) {
      notes.push(...out.notes.map((n) => `${section.marker}: ${n}`));
      skipped.push(section.marker);
      continue;
    }
    const injected = injectSection(content, out.markdown, section.marker);
    content = injected.content;
    changed = changed || injected.changed;
    written.push(section.marker);
    notes.push(...out.notes.map((n) => `${section.marker}: ${n}`));
  }
  return { written, absent, skipped, changed, notes, content };
}

/** Shared by the CLI and the `readme_sync` MCP tool. */
/**
 * Load the science layer's coverage computation, if it is installed.
 *
 * A VARIABLE specifier, so this module names no science-layer file and the
 * repository partition records no edge — the same mechanism
 * `qa-checker-discovery` and `render-discovery` use. `undefined` on any
 * failure, which the coverage section renders as "could not determine" rather
 * than as an empty table.
 */
async function loadLeanCoverage(): Promise<LeanCoverageStats | undefined> {
  const rel = "scripts/lean-coverage.ts";
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return undefined;
  try {
    const mod = (await import(abs)) as Record<string, unknown>;
    const fn = mod.computeStats;
    return typeof fn === "function" ? (fn as LeanCoverageStats) : undefined;
  } catch {
    return undefined;
  }
}

export async function runReadmeSync(opts: {
  root?: string;
  check?: boolean;
  fetch?: boolean;
  only?: string[];
  readmePath?: string;
  linkStyle?: ReadmeTocConfig["linkStyle"];
}): Promise<{ text: string; exitCode: number }> {
  const root = opts.root ?? findContentRepoRoot();
  const leanCoverage = await loadLeanCoverage();
  const cfg = loadReadmeConfig(root);
  if (opts.linkStyle) cfg.linkStyle = opts.linkStyle;

  if (opts.only) {
    const known = SECTIONS.map((s) => s.marker);
    const unknown = opts.only.filter((m) => !known.includes(m));
    if (unknown.length > 0) {
      return {
        text: `Unknown section(s): ${unknown.join(", ")}. Known: ${known.join(", ")}`,
        exitCode: 2,
      };
    }
  }

  // ASKED, not composed. This instance's README is declared
  // `scope: "repository"` — it sits at the top of the checkout, one directory
  // above the instance — so `join(root, "README.md")` named nothing and the
  // gate failed with "No README" on a file that exists. The composed path is
  // still the fallback, for an instance that declares no README asset.
  const readmePath =
    opts.readmePath ?? declaredAssetPath(root, INSTANCE_README_ROLE) ?? join(root, "README.md");
  if (!existsSync(readmePath) || !statSync(readmePath).isFile()) {
    return { text: `No README at ${readmePath}.`, exitCode: 2 };
  }

  const current = readFileSync(readmePath, "utf-8");
  const result = syncSections(
    current,
    { root, cfg, fetch: opts.fetch ?? false, leanCoverage },
    opts.only,
  );

  if (result.written.length === 0 && result.skipped.length === 0) {
    return {
      text:
        `${readmePath} carries no generated-section markers, so nothing was written.\n` +
        `Add a marker pair where a section should go, e.g.:\n` +
        `  <!-- folio:toc:begin -->\n  <!-- folio:toc:end -->\n` +
        `Available: ${SECTIONS.map((s) => s.marker).join(", ")}`,
      exitCode: 0,
    };
  }

  const summary =
    `sections: ${result.written.join(", ") || "none"}` +
    (result.skipped.length ? `; left unchanged: ${result.skipped.join(", ")}` : "");
  if (opts.check) {
    return result.changed
      ? {
          text: [`${readmePath} is out of date (${summary}). Run: bun run readme:sync`, ...result.notes].join("\n"),
          exitCode: 1,
        }
      : { text: [`${readmePath} is up to date (${summary}).`, ...result.notes].join("\n"), exitCode: 0 };
  }

  if (result.changed) writeFileSync(readmePath, result.content);
  return {
    text: [
      result.changed
        ? `${readmePath} updated (${summary}).`
        : `${readmePath} already current (${summary}).`,
      ...result.notes,
    ].join("\n"),
    exitCode: 0,
  };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  if (argv.includes("--list")) {
    for (const s of SECTIONS) console.log(`${s.marker.padEnd(22)} ${s.summary}`);
    process.exit(0);
  }

  const style = flag("link-style");
  if (style && !["blob", "pages", "raw"].includes(style)) {
    console.error(`--link-style must be blob, pages or raw (got '${style}')`);
    process.exit(2);
  }
  const only = flag("only")?.split(",").map((s) => s.trim()).filter(Boolean);

  try {
    const result = await runReadmeSync({
      // `--dir` names the INSTANCE whose README is being synced, and it is not
      // a convenience. The Tool node has declared a `dir` input since it was
      // written; the CLI never accepted one, so the two disagreed and the flag
      // was silently ignored. It became load-bearing when the repository's
      // README and cat-harness's were split (issue #592): before that,
      // cat-harness declared the root's file with `scope: "repository"`, so
      // "this instance's README" and "the repository's README" were one file
      // and the difference could not show. They are now two, and
      // `findContentRepoRoot()` resolves to whichever instance carries a
      // `folio/` — which is cat-harness, not the root.
      root: flag("dir") === undefined ? undefined : resolve(flag("dir")!),
      check: argv.includes("--check"),
      fetch: argv.includes("--fetch"),
      only,
      readmePath: flag("readme"),
      linkStyle: style as ReadmeTocConfig["linkStyle"] | undefined,
    });
    (result.exitCode === 0 ? console.log : console.error)(result.text);
    process.exit(result.exitCode);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(2);
  }
}
