#!/usr/bin/env bun
/**
 * A path inside a **fenced command** still resolves.
 *
 * Bean `b963`. `AGENTS.md` line 3 is the cold-start line every agent runs
 * before anything else, and after the split it read:
 *
 * ```sh
 * scripts/install-beans.sh && export PATH="$HOME/.local/bin:$PATH"
 * ```
 *
 * There is no root `scripts/` — the script moved under `cat-harness/scripts/`.
 * So a fresh container following the first instruction it reads got
 * *"No such file or directory"* and no work-plan CLI. Nine occurrences across
 * `AGENTS.md`, `README.md` and the onboarding guide, and **four more** in
 * `session-start-coord-sweep.sh`, which prints the same line for an agent to
 * copy. Bean `z9eb` is the same defect inside a skill: `session-intent`
 * step 1 was *"Open `STATUS.md`"*, and `ls STATUS.md` fails here.
 *
 * ## Why the two neighbouring checks both miss it by design
 *
 * | check | reads |
 * |---|---|
 * | `check:agent-entry-links` | markdown **links** out of the entry files |
 * | `check:agents-claims` | LOCATION claims — `symbol` in `module.ts` — and absence claims |
 * | `check:declared-paths` | path literals in **code** |
 * | *this* | paths inside fenced **commands**, and in the prose of a skill |
 *
 * A path in a command is not a link, not a claim about a symbol, and not a
 * literal in a `.ts` file. It sits in exactly the gap between them, which is
 * how one rotted in the file a newcomer reads first and stayed there. AGENTS.md
 * records the same defect for two generator commands "until 2026-09-20" — it
 * was fixed in one file and not in the other two, because nothing swept.
 *
 * ## What counts as a path, and why the rule is conservative
 *
 * A token is a candidate when it **contains a `/` and looks like a file or
 * directory**, or ends in a known script extension. It is checked only when it
 * is **repository-relative and static**: a token carrying `$`, `<`, `*`, `~`
 * or a URL scheme is a template or an example, and a check that guessed at
 * those would cry wolf until somebody deleted it.
 *
 * The conservatism is deliberate and is the whole design. A check over prose
 * has to be RIGHT rather than thorough, because its findings are read by a
 * person deciding whether to keep it. Everything it declines to judge is
 * COUNTED in the summary rather than disappearing, so the coverage is visible.
 *
 * Exit: 0 every checked path resolves, 1 one does not, 2 could not check.
 *
 * @module folio-assistant/scripts/check-command-paths
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { directoriesForGraph, repoRootFor } from "../schemas/cat-harness.js";

// `folio` registers on import, and reading the whole declaration refuses an
// unregistered kind. Same import, same reason, as `agent-memory.ts`.
import "../schemas/folio-graph-kind.js";
import { findEntryFiles } from "./check-agent-entry-links.ts";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
export const INSTANCE_ROOT = resolve(import.meta.dir, "..");

/** A fenced block, with its info string. */
const FENCE = /^([ \t]*)```([^\n`]*)\n([\s\S]*?)^[ \t]*```[ \t]*$/gm;

/** Info strings whose contents are commands a person runs. */
const SHELL_INFO = /^(sh|bash|shell|zsh|console|terminal|sh\b.*)$/i;

/**
 * Commands this check declines to read at all, with the reason.
 *
 * Every entry was MEASURED as a false positive on the first run over this
 * corpus, and each is a different way a path-shaped string is not a path in
 * this tree. Declining a whole line is the conservative move: a check over
 * prose has to be right rather than thorough, because its findings are read by
 * a person deciding whether to keep it.
 */
export function skipCommand(cmd: string): string | undefined {
  // `cd content && bun run pipeline/bib-qa.ts` — the base is not this root, and
  // guessing it is how a check starts reporting a folio's layout as a defect.
  if (/(^|[;&|]\s*)cd\s/.test(cmd)) return "changes directory — the base is not the repository root";
  // `git show origin/main:beans/defs/x.md` — a ref is path-shaped and is not a path.
  if (/(^|[;&|]\s*)git\s/.test(cmd)) return "a git command — refs are path-shaped and are not paths";
  return undefined;
}

/**
 * Split a command line into shell words, with expansions and URLs removed
 * WHOLE rather than tokenised through.
 *
 * This is the part the first draft got wrong, and every false positive it
 * produced came from the same mistake: matching path-shaped RUNS inside a
 * larger string. `https://bun.sh/install` yielded `bun.sh/install`,
 * `$HOME/.local/bin` yielded `HOME/.local/bin`, and `/path/to/x` yielded
 * `path/to/x` — three tokens that never appeared in the text, each reported as
 * a missing file. A word is checked only as a WHOLE word.
 */
export function shellWords(cmd: string): string[] {
  const stripped = cmd
    .replace(/[a-z][a-z0-9+.-]*:\/\/\S*/gi, " ") // URLs, whole
    .replace(/\$\{[^}]*\}\S*/g, " ") // ${VAR}... whole
    .replace(/\$\w+\S*/g, " ") // $VAR... whole
    // `<paper>/<paper>.ts` — a placeholder and everything glued to it. Removed
    // WHOLE for the same reason as `$VAR`: splitting it yielded `.ts`, a token
    // that never appears in the text, reported as a missing file.
    .replace(/\S*<[^>]*>\S*/g, " ")
    .replace(/['"]/g, " ");
  return stripped.split(/[\s;|&<>()]+/).filter(Boolean);
}

/** A word this check declines to judge, with the reason it declines. */
export function skipReason(tok: string): string | undefined {
  if (tok.startsWith("-")) return "a flag";
  // `export SMART_BASE_HOME=/path/to/smart-base` — an assignment, not a path.
  if (tok.includes("=")) return "an assignment";
  if (/[$<>*?~{}|@:]/.test(tok)) return "a template, a placeholder or a ref";
  if (tok.startsWith("/")) return "absolute — not repository-relative";
  if (tok.startsWith("..")) return "escaping — not repository-relative";
  // `uploads/FILE.pdf`, `-o OUTDIR` — an ALL-CAPS segment is a stand-in.
  if (tok.split("/").some((seg) => /^[A-Z][A-Z0-9_]+(\.[a-z]+)?$/.test(seg))) return "an upper-case stand-in";
  if (!tok.includes("/") && !/\.(sh|ts|js|py|mjs|cjs|json|md|yml|yaml)$/.test(tok)) return "not path-shaped";
  if (!/[./]/.test(tok)) return "not path-shaped";
  // `bun run`, `npm ci` and friends: a bare word with a dot is not a path.
  if (!tok.includes("/")) return undefined;
  return undefined;
}

export interface CommandPathReport {
  filesRead: number;
  checked: number;
  declined: number;
  /** Folio-relative: named in a skill, unresolvable here BY CONSTRUCTION. */
  folioRelative: number;
  /** Blocks carrying `command-path-ok:` with a reason. Counted, never hidden. */
  exempt: number;
  dead: { file: string; line: number; token: string; command: string }[];
}

/**
 * The two corpora, and why they get different verdicts.
 *
 * **An entry document is about THIS repository by definition** — `AGENTS.md`
 * and `README.md` tell an agent what to run *here*, so every repository-relative
 * path in one of their commands must resolve, full stop. That is the `b963`
 * case: `scripts/install-beans.sh` names a directory this repository does not
 * have, and it is a defect precisely because the document is about this tree.
 *
 * **A skill may be about a FOLIO.** `bun run content/pipeline/content-graph.ts`
 * is correct in a folio and unresolvable in the platform, which carries no
 * folio — `AGENTS.md` says so in its first banner. Failing on those would make
 * the check unrunnable, and exempting the whole corpus would give up the `z9eb`
 * case, where `session-intent` named `STATUS.md` and `docs/coordination/` and
 * neither has ever existed anywhere.
 *
 * So in a skill a path is checked when it **claims to be about this tree**:
 * its first segment is a directory that exists at the repository root
 * (`cat-harness/…`, `beans/…`), or it names a root-level file with no
 * directory part at all (`STATUS.md`). Everything else is COUNTED as
 * folio-relative rather than passing silently, so the coverage is visible.
 */
export type Corpus = "entry" | "skill";

/** Is this path one the SKILL corpus is entitled to judge? */
export function aboutThisTree(repo: string, tok: string): boolean {
  const path = tok.replace(/^\.\//, "");
  const first = path.split("/")[0]!;
  // A bare name with no directory part: judged only when it is MARKDOWN. A
  // root-level document a skill tells you to open is about this repository —
  // `STATUS.md` is the `z9eb` case. `proof-objects.json` and
  // `harness.config.json` are a FOLIO's artefacts, named with no directory
  // because the skill is speaking from inside one, and judging those here
  // reports a folio's layout as a defect.
  if (first === path) return path.endsWith(".md");
  try {
    return statSync(join(repo, first)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * An exemption for one fenced block, on the line above it.
 *
 * ```
 * <!-- command-path-ok: this probes for a directory that may not be here -->
 * ```
 *
 * Same shape as `declared-path-literal:` in `check:declared-paths` and
 * `<folio:no-skill reason="…"/>`: exempt, but **the reason is required**, so
 * silencing the check costs more than satisfying it, and exempted blocks are
 * COUNTED in the summary rather than disappearing.
 *
 * The case it exists for is real and is not a template: the onboarding guide's
 * `ls content/` is a PROBE — it tells you which repository you are in by
 * whether the directory is there. A path whose absence is the answer cannot be
 * required to resolve.
 */
const EXEMPT = /<!--\s*command-path-ok:\s*(\S[^>]*?)\s*-->/;

/** Every fenced shell block in a markdown file, as `{line, text, exempt}`. */
export function shellBlocks(md: string): { line: number; text: string; exempt: boolean }[] {
  const out: { line: number; text: string; exempt: boolean }[] = [];
  const lines = md.split("\n");
  for (const m of md.matchAll(FENCE)) {
    const info = (m[2] ?? "").trim();
    if (!SHELL_INFO.test(info)) continue;
    const before = md.slice(0, m.index ?? 0);
    const line = before.split("\n").length;
    // The nearest non-blank line above the fence.
    let i = line - 2;
    while (i >= 0 && lines[i]!.trim() === "") i--;
    out.push({ line, text: m[3] ?? "", exempt: i >= 0 && EXEMPT.test(lines[i]!) });
  }
  return out;
}

/** Check one file's fenced commands against the tree at `repo`. */
export function checkFile(repo: string, rel: string, report: CommandPathReport, corpusOf: Corpus): void {
  let md: string;
  try {
    md = readFileSync(join(repo, rel), "utf8");
  } catch {
    return;
  }
  report.filesRead++;
  for (const block of shellBlocks(md)) {
    if (block.exempt) {
      report.exempt++;
      continue;
    }
    const lines = block.text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i]!;
      // A comment inside a command block is prose again.
      const cmd = raw.replace(/#.*$/, "");
      if (!cmd.trim()) continue;
      if (skipCommand(cmd) !== undefined) {
        report.declined++;
        continue;
      }
      const words = shellWords(cmd);
      for (let w = 0; w < words.length; w++) {
        const tok = words[w]!.replace(/[.,:)\]}]+$/, "");
        if (!tok) continue;
        // `-o extracted-text.md`, `> out.md`: an output target is a file the
        // command CREATES, so requiring it to exist inverts the check.
        if (/^(-o|--out|--output|-out)$/.test(words[w - 1] ?? "")) {
          report.declined++;
          continue;
        }
        if (skipReason(tok) !== undefined) {
          report.declined++;
          continue;
        }
        if (corpusOf === "skill" && !aboutThisTree(repo, tok)) {
          report.folioRelative++;
          continue;
        }
        report.checked++;
        if (!existsSync(join(repo, tok))) {
          report.dead.push({ file: rel, line: block.line + 1 + i, token: tok, command: raw.trim() });
        }
      }
    }
  }
}

export function checkCommandPaths(repo: string = repoRootFor(INSTANCE_ROOT)): CommandPathReport {
  const report: CommandPathReport = { filesRead: 0, checked: 0, declined: 0, folioRelative: 0, exempt: 0, dead: [] };
  for (const { file, corpus: c } of corpus(repo)) checkFile(repo, file, report, c);
  return report;
}

/**
 * The files whose commands are checked.
 *
 * The agent entry files — reusing `findEntryFiles`, so the corpus cannot drift
 * from the one `check:agent-entry-links` gates — plus `README.md` and every
 * skill body. Skills are in because `z9eb` is a skill: a user-invocable one
 * whose step 1 named a file that has never existed in this repository.
 */
export function corpus(repo: string): { file: string; corpus: Corpus }[] {
  const out: { file: string; corpus: Corpus }[] = [];
  for (const p of findEntryFiles(repo)) out.push({ file: p.slice(repo.length + 1), corpus: "entry" });
  for (const f of ["README.md", "cat-harness/docs/guides/agent-onboarding.md"]) {
    if (existsSync(join(repo, f))) out.push({ file: f, corpus: "entry" });
  }
  // ASKED, not composed. The first draft listed `cat-harness/skills`,
  // `cat-harness/methodologies` and `cat-bootstrap/skills`, and
  // `check:declared-paths` refused it — correctly, and with some irony for a
  // check whose whole subject is a path that moved. A topical split of the
  // knowledge graph is exactly the relocation this check would then have
  // stopped seeing.
  for (const graph of ["cat-harness", "methodology"]) {
    for (const dir of directoriesForGraph(INSTANCE_ROOT, graph)) {
      if (!existsSync(dir)) continue;
      for (const f of walkMarkdown(dir)) out.push({ file: f.slice(repo.length + 1), corpus: "skill" });
    }
  }
  const seen = new Set<string>();
  return out.filter((e) => !seen.has(e.file) && seen.add(e.file)).sort((a, b) => a.file.localeCompare(b.file));
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkMarkdown(p));
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

function formatReport(r: CommandPathReport): string {
  const out = [
    `Command paths (${r.filesRead} file(s); ${r.checked} checked, ${r.folioRelative} folio-relative, ` +
      `${r.exempt} exempt, ${r.declined} declined as templates, URLs, refs or non-paths)`,
  ];
  if (r.filesRead === 0) return "Command paths\n  ? EXAMINED NOTHING — no entry files or skills found. Not a pass.";
  if (r.dead.length === 0) {
    out.push("  ✓ every repository-relative path inside a fenced command resolves");
    return out.join("\n");
  }
  for (const d of r.dead) {
    out.push(`  ✗ ${d.file}:${d.line}  \`${d.token}\` does not exist`);
    out.push(`      in: ${d.command}`);
  }
  out.push("");
  out.push("  An agent copy-pastes these. A path that moved is a first instruction that fails.");
  return out.join("\n");
}

if (import.meta.main) {
  let report: CommandPathReport;
  try {
    report = checkCommandPaths();
  } catch (e) {
    console.error(`Could not check command paths: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.dead.length || report.filesRead === 0 ? 1 : 0);
}
