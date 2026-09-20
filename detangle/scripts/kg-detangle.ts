#!/usr/bin/env bun
/**
 * Run the detangle criterion over this repository's knowledge graph.
 *
 * Usage:
 *   bun run detangle/scripts/kg-detangle.ts            # every candidate group
 *   bun run detangle/scripts/kg-detangle.ts --group X  # one group, with its worklist
 *   bun run detangle/scripts/kg-detangle.ts --json
 *
 * ## What counts as an edge, and why the list is short on purpose
 *
 * Four extractors, each of which reads a declaration the repository already
 * makes rather than guessing at meaning:
 *
 *   - `md-link`       a relative markdown link between two graph files
 *   - `bpmn-skill`    `<folio:skill ref="…">` on an activity
 *   - `json-skill`    a skill name in `roles.json`, a package manifest, or a
 *                     requirement's `satisfiedBy`
 *   - `ts-import`     a relative import between schema modules
 *
 * There is deliberately NO full-text extractor. A skill that merely MENTIONS
 * another by name in prose is not depending on it, and counting prose
 * mentions would make every package that cites `AGENTS.md`'s examples look
 * tangled into all of them. Under-counting shows up as a group that looks
 * cleaner than it is; the adjudicator is told which extractors ran, so that
 * limit is visible rather than silent.
 *
 * A reference to a node outside the scanned set is a DANGLING reference, and
 * it is reported separately. It is not an outbound edge: counting it as one
 * would make a group with a broken link look entangled, which is a different
 * finding calling for a different fix.
 *
 * @module detangle/scripts/kg-detangle
 */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, relative, resolve, dirname } from "path";
import {
  DEFAULT_THRESHOLDS,
  measure,
  failingClauses,
  type DetangleEdge,
  type DetangleNode,
} from "../schemas/detangle.js";

const ROOT = resolve(import.meta.dir, "../..");

/** Directories scanned, each mapped to the depth at which a candidate group is named. */
const SCAN: Array<{ path: string; groupDepth: number }> = [
  { path: "cat-harness/skills", groupDepth: 3 },
  { path: "cat-harness/schemas", groupDepth: 2 },
  { path: "cat-harness/tools", groupDepth: 2 },
  { path: "cat-harness/src/skills", groupDepth: 3 },
  { path: "folio-assistant-core/schemas", groupDepth: 2 },
  { path: "kg-navigation/skills", groupDepth: 2 },
  { path: "bootstrap/skills", groupDepth: 2 },
  { path: "bootstrap/workflows", groupDepth: 2 },
  { path: "detangle/schemas", groupDepth: 2 },
];

const EXT = /\.(md|bpmn|dmn|json|ts)$/;

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e.startsWith(".")) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.test(e)) out.push(p);
  }
  return out;
}

const nodes: DetangleNode[] = [];
const byId = new Map<string, string>(); // id -> absolute path
/** Skill name (front-matter `name:` or basename) -> node id. A name may be carried by two bodies; both are kept. */
const byName = new Map<string, string[]>();

for (const { path, groupDepth } of SCAN) {
  for (const abs of walk(join(ROOT, path))) {
    const id = relative(ROOT, abs);
    const group = id.split("/").slice(0, groupDepth).join("/");
    nodes.push({ id, group });
    byId.set(id, abs);
    const base = id.split("/").pop()!.replace(EXT, "");
    const fm = /^---\n[\s\S]*?\bname:\s*([A-Za-z0-9._-]+)/m.exec(readFileSync(abs, "utf8"));
    for (const n of new Set([base, fm?.[1]].filter(Boolean) as string[])) {
      byName.set(n, [...(byName.get(n) ?? []), id]);
    }
  }
}

const edges: DetangleEdge[] = [];
const dangling: Array<{ from: string; ref: string; via: string }> = [];

/**
 * `enforced` means a build or engine breaks if the arrow is reversed. Only
 * three extractors qualify; see `EdgeAuthority` for why the distinction
 * decides the whole classification.
 */
const AUTHORITY: Record<string, "enforced" | "recorded"> = {
  "ts-import": "enforced",
  "bpmn-call": "enforced",
  "bpmn-import": "enforced",
  "bpmn-decision": "enforced",
  "bpmn-skill": "recorded",
  "json-skill": "recorded",
  "md-link": "recorded",
  "prose-mention": "prose",
};

function link(from: string, toId: string | undefined, ref: string, via: string) {
  if (toId && byId.has(toId)) edges.push({ from, to: toId, via, authority: AUTHORITY[via] ?? "recorded" });
  else dangling.push({ from, ref, via });
}

/**
 * Resolve a name to a node.
 *
 * `kinds` is NOT optional and that is the fix for a measured defect. A first
 * cut preferred a hit in the SAME group, on the reasoning that a package's own
 * copy should win over a sibling instance's. Five `<folio:skill ref>` values —
 * `activity-log`, `getting-started`, `l2-dak-authoring`, `qa-report-signing`,
 * `upstream-version-adoption` — are ALSO the basenames of diagrams sitting in
 * the same directory, so every one of them resolved to the .bpmn referring to
 * it rather than to the skill body. That produced 31 phantom internal edges in
 * `skills/workflows` and was the whole of its reported cohesion of 0.09.
 *
 * A skill ref names a SKILL. Restricting the candidate set by extension is what
 * makes the name collision harmless instead of silently self-referential.
 */
function byNameOfKind(from: string, name: string, kinds: string[]): string | undefined {
  const hits = (byName.get(name) ?? []).filter((h) => kinds.some((k) => h.endsWith(k)));
  if (!hits.length) return undefined;
  const g = from.split("/").slice(0, 3).join("/");
  return hits.find((h) => h.startsWith(g)) ?? hits[0];
}

for (const n of nodes) {
  const abs = byId.get(n.id)!;
  const text = readFileSync(abs, "utf8");

  if (n.id.endsWith(".md")) {
    for (const m of text.matchAll(/\]\((\.\.?\/[^)\s#]+\.md)[^)]*\)/g)) {
      link(n.id, relative(ROOT, resolve(dirname(abs), m[1])), m[1], "md-link");
    }
    // PROSE MENTIONS. Link targets are stripped first, so an edge here is a
    // name appearing in running text with no link and no declaration behind it
    // — the weakest evidence in the graph, and the owner's "maybe the prose is
    // in the wrong place" made countable. Never weighed into a verdict.
    const prose = text.replace(/\]\([^)]*\)/g, "").replace(/^---\n[\s\S]*?\n---/, "");
    const self = n.id.split("/").pop()!.replace(/\.md$/, "");
    for (const [nm, tgts] of byName) {
      if (nm === self || nm.length < 5) continue;
      const t = tgts.find((x) => x.endsWith(".md"));
      if (!t || t === n.id) continue;
      if (new RegExp(`\\b${nm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(prose)) {
        edges.push({ from: n.id, to: t, via: "prose-mention", authority: "prose" });
      }
    }
  }
  if (n.id.endsWith(".bpmn") || n.id.endsWith(".dmn")) {
    for (const m of text.matchAll(/folio:skill\s+ref="([^"]+)"/g)) {
      link(n.id, byNameOfKind(n.id, m[1], [".md"]), m[1], "bpmn-skill");
    }
    // A diagram calling another diagram, and a diagram importing one. These
    // are the INTERNAL edges of a workflow graph and the first cut extracted
    // neither, which understated cohesion for exactly the group whose carve
    // was under discussion.
    for (const m of text.matchAll(/<bpmn:import[^>]*location="([^"]+)"/g)) {
      link(n.id, relative(ROOT, resolve(dirname(abs), m[1])), m[1], "bpmn-import");
    }
    for (const m of text.matchAll(/calledElement="([^"]+)"/g)) {
      // calledElement names a PROCESS id (`Process_DeriveContent`), not a file.
      // Resolve through the file that declares that id.
      const owner = nodes.find(
        (o) =>
          (o.id.endsWith(".bpmn") || o.id.endsWith(".dmn")) &&
          new RegExp(`<bpmn:process[^>]*id="${m[1]}"`).test(readFileSync(byId.get(o.id)!, "utf8")),
      );
      link(n.id, owner?.id, m[1], "bpmn-call");
    }
    for (const m of text.matchAll(/decisionRef="([^"]+)"|([A-Za-z0-9_-]+\.dmn)/g)) {
      const ref = m[1] ?? m[2];
      link(n.id, byNameOfKind(n.id, ref.replace(/\.dmn$/, ""), [".dmn"]), ref, "bpmn-decision");
    }
  }
  if (n.id.endsWith(".json")) {
    // Only string ARRAY members are read as references. A free-form description
    // mentioning a skill is prose, and prose is not a dependency.
    for (const m of text.matchAll(/"([a-z][a-z0-9-]{3,})"(?=\s*[,\]])/g)) {
      const t = byNameOfKind(n.id, m[1], [".md"]);
      if (t && t !== n.id) edges.push({ from: n.id, to: t, via: "json-skill", authority: "recorded" });
    }
  }
  if (n.id.endsWith(".ts")) {
    for (const m of text.matchAll(/from\s+"(\.\.?\/[^"]+)"/g)) {
      const p = resolve(dirname(abs), m[1].replace(/\.js$/, ".ts"));
      link(n.id, relative(ROOT, p), m[1], "ts-import");
    }
  }
}

const groups = [...new Set(nodes.map((n) => n.group))].sort();
const only = process.argv.includes("--group")
  ? process.argv[process.argv.indexOf("--group") + 1]
  : undefined;

const results = groups.map((g) => {
  const m = measure(g, nodes, edges);
  return { ...m, clauses: failingClauses(m, DEFAULT_THRESHOLDS) };
});

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ thresholds: DEFAULT_THRESHOLDS, results, dangling }, null, 2));
} else {
  console.log(`\nDetangle — ${nodes.length} nodes, ${edges.length} edges, ${dangling.length} dangling\n`);
  console.log(
    "  " +
      ["group".padEnd(40), "size".padStart(5), "coh".padStart(6), "in".padStart(5), "out".padStart(6), "grps".padStart(5), "dir".padStart(6), "enf".padStart(4), "prose".padStart(6), "role".padEnd(13), "verdict"].join(" "),
  );
  console.log("  " + "-".repeat(122));
  for (const r of results) {
    if (only && r.group !== only) continue;
    const v = r.clauses.length === 0 ? "CANDIDATE" : `${r.clauses.length} clause(s) fail`;
    console.log(
      "  " +
        [
          r.group.padEnd(40),
          String(r.size).padStart(5),
          r.cohesion.toFixed(2).padStart(6),
          String(r.inbound).padStart(5),
          String(r.outbound).padStart(6),
          String(r.distinctTargetGroups).padStart(5),
          r.directionality.toFixed(2).padStart(6),
          String(r.enforcedBoundary).padStart(4),
          String(r.proseMentions).padStart(6),
          r.role.padEnd(13),
          v,
        ].join(" "),
    );
    if (only) {
      for (const c of r.clauses) console.log(`      · ${c}`);
      if (r.worklist.length) {
        console.log(`\n      Detangling worklist — every outbound edge:`);
        for (const e of r.worklist) console.log(`      → ${e.to}   [${e.via}]   from ${e.from}`);
      }
    }
  }
  console.log(
    `\n  Nothing here decides anything. A failing clause is a reason to LOOK.\n` +
      `  The carve is an adjudication — see detangle/schemas/detangle.ts, "taste is a declared step".\n`,
  );
}
