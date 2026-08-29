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

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { basename, join } from "path";

import {
  discoverPapers,
  injectSection,
  loadReadmeConfig,
  renderToc,
  type ReadmeTocConfig,
} from "./readme-toc";
import { findContentRepoRoot } from "./repo-root";
import { computeStats } from "../../scripts/lean-coverage";

// ── Section contract ────────────────────────────────────────────────────────

export interface SectionContext {
  root: string;
  cfg: ReadmeTocConfig;
  /** Fetch the publish ref when it is missing locally. Only the TOC uses it. */
  fetch: boolean;
}

export interface SectionOutput {
  markdown: string;
  /** Operator-facing remarks: what was empty, what could not be read. */
  notes: string[];
  /**
   * "I could not determine this" — leave whatever the README already has.
   *
   * Distinct from an empty result, and the distinction is the whole point.
   * The folio this was built against configures its simulators under
   * `folio-assistant/simulators`, a directory that only exists once the
   * platform submodule is checked out. In a clone without it, "the directory
   * is not there" was rendered as "this folio has no simulators", and a
   * correct nine-row table was replaced by a sentence saying it did not
   * exist. Same rule as the TOC's unreadable publish ref: not-looked-at is
   * never reported as nothing-found.
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
    join(root, "content", paper, "lean", "lakefile.toml"),
    join(root, "content", paper, "lakefile.toml"),
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
  const dir = join(root, "content", paper, "lean");
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
  render({ root }) {
    const papers = papersWithLean(root);
    if (papers.length === 0) return empty("papers with Lean sources");

    const contentRoot = join(root, "content");
    const rows: string[] = [];
    const notes: string[] = [];
    for (const paper of papers) {
      let stats;
      try {
        stats = computeStats(paper.dir, contentRoot);
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
    // embeds the platform under that name puts them.
    let dir = "folio-assistant/simulators";
    const configPath = join(root, "folio.config.json");
    if (existsSync(configPath)) {
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
      // nothing about whether the folio has simulators — most often it means
      // the platform submodule holding them is not checked out here.
      return undetermined(
        `simulators directory '${dir}' is not present in this checkout ` +
          `(is the platform submodule checked out?)`,
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

export const SECTIONS: readonly ReadmeSection[] = [
  tocSection,
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
export function runReadmeSync(opts: {
  root?: string;
  check?: boolean;
  fetch?: boolean;
  only?: string[];
  readmePath?: string;
  linkStyle?: ReadmeTocConfig["linkStyle"];
}): { text: string; exitCode: number } {
  const root = opts.root ?? findContentRepoRoot();
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

  const readmePath = opts.readmePath ?? join(root, "README.md");
  if (!existsSync(readmePath) || !statSync(readmePath).isFile()) {
    return { text: `No README at ${readmePath}.`, exitCode: 2 };
  }

  const current = readFileSync(readmePath, "utf-8");
  const result = syncSections(
    current,
    { root, cfg, fetch: opts.fetch ?? false },
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
    const result = runReadmeSync({
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
