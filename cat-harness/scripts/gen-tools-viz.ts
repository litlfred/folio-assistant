#!/usr/bin/env bun
/**
 * Render the `tools` graph — Tool nodes, how each is installed and invoked,
 * and which skill each one satisfies.
 *
 * @module cat-harness/scripts/gen-tools-viz
 * @covers tools
 *
 * ## Why this is its own page, and not a section of the skills page
 *
 * Owner, 2026-09-21: **"keep tools and skills separate!"**
 *
 * They were not. `cat-harness.json`'s `tools` entry declared
 * `coverage.docs: "cat-harness/docs/skills.md"` — a page titled *"Skills &
 * roles"* whose headings are Skills, Roles, Capabilities, with no tools
 * section anywhere in it. The tools graph had no documentation of its own and
 * pointed at a page about something else.
 *
 * That is worse than an absent page, and it is worth being precise about why:
 * an absent `docs` ref is a legible gap, while a ref that RESOLVES reports
 * coverage. The check in force asks only whether the path exists — it does —
 * so nothing had ever flagged it. `pb04` one level up: the link works and
 * points at the wrong thing.
 *
 * ## What a Tool is, against a skill — the distinction the page exists to keep
 *
 * A **skill** states a capability generically: what an actor needs to know to
 * perform a task. A **Tool** is one concrete way to exercise it — with an
 * installation, an invocation, and typed inputs and outputs. One skill may be
 * satisfied by several Tools, and a Tool may satisfy several skills.
 *
 * So the relation is `satisfies`, and it runs FROM a Tool TO a skill. This
 * page renders it from the tool side, which is the direction that does not
 * conflate them: it says "this tool is one way to do that", never "this skill
 * is a tool".
 *
 * ## It imports the graph rather than parsing it
 *
 * The nodes are authored as TypeScript calling `defineTool`, precisely so a
 * malformed one fails at `tsc`. A generator that re-parsed the source would
 * throw that away and invent a second, weaker reader of the same file —
 * which would then be free to disagree with the one the server uses.
 *
 * Usage:
 *   bun run cat-harness/scripts/gen-tools-viz.ts
 *   bun run cat-harness/scripts/gen-tools-viz.ts --check
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { declarationPathIn } from "../schemas/cat-harness.js";
import { docsLayers } from "./compose-docs.js";

const REPO = resolve(import.meta.dir, "..", "..");
/** The graph kind this renders. A KIND, never a path. */
const KIND = "tools";

/** One Tool, reduced to what the page shows. */
export interface ToolRow {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** How it is installed — the declared keys, e.g. `none`, `cli`. */
  readonly install: string[];
  /** How it is invoked — `shell`, `mcp`, `inProcess`, `manual`. */
  readonly invoke: string[];
  /** Skills this tool is one way to exercise. */
  readonly satisfies: string[];
  readonly inputs: number;
  readonly outputs: number;
}

/** A `satisfies` entry, however it was written. */
function skillId(s: unknown): string {
  if (typeof s === "string") return s;
  const o = s as { skill?: string; ref?: string } | null;
  return o?.skill ?? o?.ref ?? String(s);
}

/**
 * The Tool nodes, reduced.
 *
 * Exported so the reduction is testable without the markdown: the `satisfies`
 * join is the part worth pinning, and a test that went through the rendered
 * table would be testing the table.
 */
export function toolRows(defs: readonly unknown[]): ToolRow[] {
  return defs
    .map((d) => {
      const t = d as Record<string, unknown>;
      const io = (t.io ?? {}) as { inputs?: unknown[]; outputs?: unknown[] };
      return {
        id: String(t.id ?? ""),
        title: String(t.title ?? t.id ?? ""),
        description: String(t.description ?? ""),
        install: Object.keys((t.install ?? {}) as object).sort(),
        invoke: Object.keys((t.invoke ?? {}) as object).sort(),
        satisfies: ((t.satisfies ?? []) as unknown[]).map(skillId).sort(),
        inputs: io.inputs?.length ?? 0,
        outputs: io.outputs?.length ?? 0,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id, "en"));
}

/** Every skill document in the checkout, by id, so a `satisfies` can be resolved. */
export function skillIds(repo = REPO): Set<string> {
  const out = new Set<string>();
  const walk = (dir: string, depth = 0): void => {
    if (depth > 5) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name.endsWith(".md")) out.add(e.name.replace(/\.md$/, ""));
    }
  };
  // Every directory declaring a `kg` or `skills` graph, read from the
  // declarations — a hardcoded list here is the `check:declared-assets` shape,
  // and it would go stale the first time an instance is added.
  for (const declPath of instanceDeclarations(repo)) {
    const d = JSON.parse(readFileSync(declPath, "utf-8")) as {
      directories?: { path?: string; scope?: string; graphKinds?: string[] }[];
    };
    const instanceRoot = join(declPath, "..");
    for (const entry of d.directories ?? []) {
      if (!entry.path) continue;
      const kinds = entry.graphKinds ?? [];
      if (!kinds.includes("skills") && !kinds.includes("kg") && !kinds.includes("methodology")) continue;
      walk(join(entry.scope === "repository" ? repo : instanceRoot, entry.path));
    }
  }
  return out;
}

/**
 * Every INSTANCE declaration in the checkout.
 *
 * `declarationPathIn`, never a "does it have `directories`?" heuristic. That
 * heuristic sweeps in `beans/beans.json` and `todos/todos.json`, whose stem is
 * not their declared `name` — and it produced a wrong corpus for two separate
 * sessions on 2026-09-21 (`w4tq`, and this session's own `yunp` re-measure).
 * It is attractive because it is one line and NEARLY right, so it returns a
 * plausible answer rather than an error.
 */
function instanceDeclarations(repo: string): string[] {
  const out: string[] = [];
  const at = declarationPathIn(repo);
  if (at && existsSync(at)) out.push(at);
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = declarationPathIn(join(repo, e.name));
    if (p && existsSync(p)) out.push(p);
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
.tg-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.72rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor;margin-right:.2rem}
.tg-shell{color:#0d6e5e}
.tg-mcp{color:#6b5b95}
.tg-inproc{color:#1d5fa8}
.tg-manual{color:#a8430f}
.tg-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.tg-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.tg-stat b{display:block;font-size:1.25rem;line-height:1.2}
.tg-stat span{font-size:.75rem;opacity:.75}
`;

const INVOKE_CLASS: Record<string, string> = {
  shell: "tg-shell",
  mcp: "tg-mcp",
  inProcess: "tg-inproc",
  manual: "tg-manual",
};

function badge(kind: string): string {
  return `<span class="tg-tag ${INVOKE_CLASS[kind] ?? ""}">${kind}</span>`;
}

/** Escape a cell so a pipe in a description cannot break the table. */
function cell(v: string): string {
  return v.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function page(rows: readonly ToolRow[], known: ReadonlySet<string>): string {
  const invoke = new Map<string, number>();
  const install = new Map<string, number>();
  for (const r of rows) {
    for (const k of r.invoke) invoke.set(k, (invoke.get(k) ?? 0) + 1);
    for (const k of r.install) install.set(k, (install.get(k) ?? 0) + 1);
  }
  const allSkills = new Set(rows.flatMap((r) => r.satisfies));
  const unresolved = [...allSkills].filter((s) => !known.has(s)).sort();
  const noSatisfies = rows.filter((r) => r.satisfies.length === 0);

  const b: string[] = [
    "---",
    'title: "Tools"',
    'description: "The Tool nodes this instance declares — how each is installed and invoked, and which skill it satisfies."',
    "---",
    `<style>${CSS}</style>`,
    "",
    "A **skill** states a capability generically: what an actor needs to know to",
    "perform a task. A **Tool** is one concrete way to exercise it, with an",
    "installation, an invocation and typed inputs and outputs. One skill may be",
    "satisfied by several tools, and one tool may satisfy several skills.",
    "",
    "They are separate graphs and this is the tools one. The relation between them",
    "is `satisfies`, and it runs **from a tool to a skill** — *this tool is one way",
    "to do that*, never *this skill is a tool*.",
    "",
    "<div class=\"tg-grid\">",
    `<div class="tg-stat"><b>${rows.length}</b><span>Tool nodes</span></div>`,
    `<div class="tg-stat"><b>${allSkills.size}</b><span>skills satisfied</span></div>`,
    `<div class="tg-stat"><b>${invoke.get("shell") ?? 0}</b><span>invoked as a shell command</span></div>`,
    `<div class="tg-stat"><b>${invoke.get("mcp") ?? 0}</b><span>reachable over MCP</span></div>`,
    "</div>",
    "",
    "## How they are invoked, and installed",
    "",
    "A tool may declare more than one invocation, so these do not sum to the total.",
    "",
    "| invocation | tools |",
    "|---|---|",
    ...[...invoke.entries()]
      .sort((a, b2) => b2[1] - a[1])
      .map(([k, n]) => `| ${badge(k)} | ${n} |`),
    "",
    "| installation | tools |",
    "|---|---|",
    ...[...install.entries()]
      .sort((a, b2) => b2[1] - a[1])
      .map(([k, n]) => `| \`${k}\` | ${n} |`),
    "",
    "## Does every `satisfies` name a skill that exists?",
    "",
  ];

  // The join, reported either way. "Nothing unresolved" and "the check did not
  // run" are different facts, and a section that appeared only on failure
  // could not tell them apart.
  if (unresolved.length === 0) {
    b.push(
      `Yes — all **${allSkills.size}** skills named across **${rows.length}** tools resolve to a`,
      "skill document in this checkout. A `satisfies` pointing at nothing would be a",
      "tool advertising a capability the graph cannot locate.",
      "",
    );
  } else {
    b.push(
      `**${unresolved.length} of ${allSkills.size} do not.** A \`satisfies\` naming a skill that is`,
      "not in this checkout is a dangling reference — the tool advertises a capability",
      "the graph cannot locate.",
      "",
      "| unresolved skill | named by |",
      "|---|---|",
      ...unresolved.map((s) => {
        const by = rows.filter((r) => r.satisfies.includes(s)).map((r) => `\`${r.id}\``);
        return `| \`${cell(s)}\` | ${by.join(", ")} |`;
      }),
      "",
    );
  }

  if (noSatisfies.length > 0) {
    b.push(
      `**${noSatisfies.length} tool(s) satisfy no skill at all**, which is a different gap: the`,
      "tool exists and nothing says what capability it is a way of exercising.",
      "",
      ...noSatisfies.map((r) => `- \`${cell(r.id)}\` — ${cell(r.title)}`),
      "",
    );
  }

  b.push("## Every tool", "", "| tool | what it does | invoked | satisfies | i/o |", "|---|---|---|---|---|");
  for (const r of rows) {
    const sat = r.satisfies.length
      ? r.satisfies.map((s) => `\`${cell(s)}\``).join("<br>")
      : "**—**";
    b.push(
      `| \`${cell(r.id)}\`<br>${cell(r.title)} | ${cell(r.description)} | ` +
        `${r.invoke.map(badge).join(" ")} | ${sat} | ${r.inputs} in / ${r.outputs} out |`,
    );
  }
  b.push("");
  return b.join("\n").trimEnd() + "\n";
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const { tools } = (await import("../tools/index.js")) as { tools: () => unknown[] };
  const rows = toolRows(tools());
  if (rows.length === 0) {
    // A declared graph that yields nothing is the `dh4f` shape — scanning
    // nothing and reporting a clean run. Refuse rather than write an empty page.
    console.error("::error::gen-tools-viz: the tools graph yielded no nodes");
    process.exit(1);
  }
  const PAGE = pageRelPath(REPO);
  if (PAGE === undefined) {
    console.error(`::error::gen-tools-viz: no visualiser declared for graph kind '${KIND}'`);
    process.exit(1);
  }
  const rendered = page(rows, skillIds(REPO));
  const out = join(baseDocs(REPO), PAGE);

  if (check) {
    const current = existsSync(out) ? readFileSync(out, "utf-8") : "";
    if (current !== rendered) {
      console.error(`::error::gen-tools-viz: ${PAGE} is stale — run \`bun run tools:viz\``);
      process.exit(1);
    }
    console.log(`✓ tools viewer is current — ${rows.length} tool(s)`);
  } else {
    mkdirSync(join(out, ".."), { recursive: true });
    writeFileSync(out, rendered);
    const known = skillIds(REPO);
    const bad = [...new Set(rows.flatMap((r) => r.satisfies))].filter((s) => !known.has(s));
    console.log(`tools viewer: ${rows.length} tool(s) → ${PAGE}`);
    console.log(bad.length === 0 ? "  every satisfies resolves" : `  ${bad.length} unresolved — shown on the page`);
  }
}
