#!/usr/bin/env bun
/**
 * Run the detangle criterion over this repository's knowledge graph.
 *
 * Usage:
 *   bun run kg:detangle            # every candidate group
 *   bun run kg:detangle --group X  # one group, with its worklist
 *   bun run kg:detangle --json
 *
 * ## What counts as an edge, and why the list is short on purpose
 *
 * Four extractors, each of which reads a declaration the repository already
 * makes rather than guessing at meaning:
 *
 *   - `md-link`       a relative markdown link between two graph files
 *   - `bpmn-skill`    `<folio:skill ref="…">` on an activity
 *   - `json-skill`    a skill name in `roles.json` or a package manifest
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
 * @module skills/graph-management/kg-detangle
 * @covers cat-harness, skills
 */
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join, relative, resolve, dirname } from "path";
import { detangleResultsDir, sidecarFor, sidecarPathFor, staleFields } from "../../schemas/detangle-sidecar.ts";
import {
  DEFAULT_THRESHOLDS,
  measure,
  failingClauses,
  classifyByDirection,
  type ClassifiedEdge,
  type DetangleEdge,
  type DetangleNode,
  type EdgeAuthority,
} from "../../schemas/detangle.js";
import { allowedFromNeeds, directionOf, type LayerRule } from "../../schemas/layer-direction.js";
import { ancestorsOf, flattenDependencies } from "../../schemas/dependency-order.js";
import { ownElementPattern } from "../../schemas/namespaces.js";

const ROOT = resolve(import.meta.dir, "../../..");

/** Directories scanned, each mapped to the depth at which a candidate group is named. */
const SCAN: Array<{ path: string; groupDepth: number }> = [
  { path: "cat-harness/skills", groupDepth: 3 },
  // `processes/` and `scenarios/` are SIBLINGS of `skills/` since 2026-09-21,
  // not subdirectories of it. At depth 3 the old layout named them
  // `cat-harness/skills/workflows` and `.../roles`; once they moved out, the
  // `cat-harness/skills` entry above stopped reaching them and they were
  // measured nowhere — the detangle report is only as wide as this list, so a
  // directory missing from it reads as "nothing to report" rather than as a
  // gap. Depth 2 names them for the same reason `bootstrap/processes` does.
  { path: "cat-harness/processes", groupDepth: 2 },
  { path: "cat-harness/scenarios", groupDepth: 2 },
  { path: "cat-harness/schemas", groupDepth: 2 },
  { path: "cat-harness/tools", groupDepth: 2 },
  { path: "cat-harness/src/skills", groupDepth: 3 },
  // declared-path-literal: the scan list is REPO-relative and pairs each path with a grouping depth no declaration carries; deriving it is its own change, not part of the byql fold.
  { path: "folio-assistant-core/schemas", groupDepth: 2 },
  { path: "bootstrap/skills", groupDepth: 2 },
  { path: "bootstrap/processes", groupDepth: 2 },
];

const EXT = /\.(md|bpmn|dmn|json|ts)$/;

/** Per-directory file names that name no node — see the name index below. */
const CONVENTIONAL = new Set(["README", "AGENTS"]);

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
    // `README` and `AGENTS` are CONVENTIONAL names every directory may carry,
    // never a name a sentence uses to point at one node. Indexing them made
    // every skill mentioning "AGENTS.md" read as coupled to whichever package
    // last held one — measured 2026-09-23 when kg-navigation's pair moved into
    // `cat-harness/skills/` (bean `byql`) and nine groups' prose counts moved.
    for (const n of new Set([base, fm?.[1]].filter((x) => x && !CONVENTIONAL.has(x)) as string[])) {
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
// `EdgeAuthority`, not a restatement of it. This read
// `Record<string, "enforced" | "recorded">` — two of the three levels — while
// the table below assigns `"prose"` and line 157 assigns it directly. A real
// TS2322 that nothing caught, because `tsconfig.json` did not include this
// tree; `detangle/`, `large-datasets/`, `who-iris/` and `folio-assistant-sci/`
// were all outside the program while the file's own comment said "Every tree
// is now compiled".
const AUTHORITY: Record<string, EdgeAuthority> = {
  "ts-import": "enforced",
  "bpmn-call": "enforced",
  "bpmn-import": "enforced",
  "bpmn-decision": "enforced",
  "bpmn-skill": "recorded",
  "json-skill": "recorded",
  "md-link": "recorded",
  "prose-mention": "prose",
};

/**
 * The authority for an extractor, REFUSING rather than defaulting.
 *
 * This read `AUTHORITY[via] ?? "recorded"`. The fallback was unreachable —
 * measured 2026-09-21, the eight `via` values the extractors emit are exactly
 * the eight {@link AUTHORITY} declares — so it silenced nothing today and
 * would have silenced the next extractor added.
 *
 * That matters more here than a default usually does, because `recorded` is
 * not a neutral guess: it is the value that makes a boundary edge stop
 * counting toward `role`. A new `enforced` extractor landing as `recorded`
 * would turn real directed dependencies into `undetermined` verdicts, and the
 * report would look exactly as it does when the analysis is right.
 *
 * Bean `kvsx`'s first requirement is that every extractor DECLARES its
 * authority. A `??` makes that true by coincidence rather than by
 * construction, which is the `6tkl` shape: the check cannot fail, so it cannot
 * tell you anything.
 */
function authorityOf(via: string): EdgeAuthority {
  const a = AUTHORITY[via];
  if (a === undefined) {
    throw new Error(
      `kg-detangle: extractor '${via}' declares no authority. Add it to AUTHORITY in this file as ` +
        `'enforced' (a build or engine breaks if the arrow is reversed) or 'recorded' (the direction is ` +
        `where the author filed the pointer) or 'prose' (a mention, which moves no verdict). ` +
        `Defaulting would file it as 'recorded' and silently drop it from every role verdict.`,
    );
  }
  return a;
}

function link(from: string, toId: string | undefined, ref: string, via: string) {
  if (toId && byId.has(toId)) edges.push({ from, to: toId, via, authority: authorityOf(via) });
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
 * `processes` and was the whole of its reported cohesion of 0.09.
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
    for (const m of text.matchAll(ownElementPattern(text, "skill", String.raw`\s+ref="([^"]+)"`))) {
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

// ── Direction — bean `j79e`.
//
// A node's LAYER is the instance it lives in: the first path segment, when
// that directory declares itself with `<name>/<name>.json`. What a layer may
// reach is its declared `needs`, transitively, plus itself — the same
// relation `check:partition` applies to repos, through the same function.
//
// An instance with no `needs` is UNDETERMINED and its edges stay so. Filling
// it in here would be deciding a layering nobody has declared.
const layerNeeds = new Map<string, readonly string[] | undefined>();
for (const seg of new Set(nodes.map((n) => n.id.split("/")[0]))) {
  const decl = join(ROOT, seg, `${seg}.json`);
  if (!existsSync(decl)) continue;
  const needs = (JSON.parse(readFileSync(decl, "utf8")) as { needs?: string[] }).needs;
  layerNeeds.set(seg, needs);
}
const flat = flattenDependencies(
  [...layerNeeds].map(([id, needs]) => ({ id, needs: (needs ?? []).filter((n) => layerNeeds.has(n)), fatal: false })),
);
if (flat.problems.length) {
  // Refused rather than walked: no ancestor set exists for a broken graph,
  // and a partial one would report allowed edges as wrong-direction.
  throw new Error(`kg-detangle: instance needs graph is broken — ${flat.problems.map((p) => p.detail).join("; ")}`);
}
const layerRule: LayerRule = { allowed: allowedFromNeeds(layerNeeds, ancestorsOf(flat.order)) };
const layerOf = (id: string): string | undefined => {
  const seg = id.split("/")[0];
  return layerNeeds.has(seg) ? seg : undefined;
};
/** Edges whose direction nothing declared could settle — kept apart, because `unclassified` alone would hide them among the allowed. */
const undeterminedEdges = new Set<DetangleEdge>();
const classify = (e: DetangleEdge): ClassifiedEdge => {
  const d = directionOf(e, layerOf(e.from), layerOf(e.to), layerRule);
  if (d.verdict === "undetermined") undeterminedEdges.add(e);
  return classifyByDirection(e, d);
};

const groups = [...new Set(nodes.map((n) => n.group))].sort();
const only = process.argv.includes("--group")
  ? process.argv[process.argv.indexOf("--group") + 1]
  : undefined;

const results = groups.map((g) => {
  const m = measure(g, nodes, edges);
  const classified = m.worklist.map(classify);
  return {
    ...m,
    classified,
    wrongDirection: classified.filter((e) => e.kind === "wrong-direction").length,
    undeterminedDirection: m.worklist.filter((e) => undeterminedEdges.has(e)).length,
    clauses: failingClauses(m, DEFAULT_THRESHOLDS),
  };
});

// ── The durable record — bean `sb6z`, and the owner's ruling on what it holds.
//
// `--check` compares; the default WRITES. Same shape as `kg:audit` /
// `kg:audit:check`, and for the same reason: the check fails on a STALE
// sidecar rather than on a bad number, so it cannot become the gate that
// always passes. `detangle.ts` says the carve is an adjudication — that stays
// a person's call, and nothing here grades it.
// The declared `qa` directory's `detangle/`, resolved in ONE place so every
// reader of the sidecars agrees with this writer (see `detangleResultsDir`).
const HARNESS = join(ROOT, "cat-harness");
const RESULTS_DIR = detangleResultsDir(HARNESS);

function writeSidecars(): { written: string[]; stale: { path: string; fields: string[] }[] } {
  const written: string[] = [];
  const stale: { path: string; fields: string[] }[] = [];
  for (const r of results) {
    const rel = sidecarPathFor(r.group);
    const abs = join(RESULTS_DIR, rel);
    const fresh = sidecarFor(r);
    let committed: unknown = null;
    try {
      committed = JSON.parse(readFileSync(abs, "utf-8"));
    } catch {
      // Absent or unreadable — every field differs, which `staleFields` says.
    }
    const fields = staleFields(committed, fresh);
    if (fields.length > 0) stale.push({ path: rel, fields });
    if (!checking) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, JSON.stringify(fresh, null, 2) + "\n", "utf-8");
    }
    written.push(rel);
  }
  return { written, stale };
}

/**
 * Sidecars no current group accounts for.
 *
 * Bean `3jj9`, paid for one package over: a sidecar whose SUBJECT was renamed
 * sat in the tree reporting a verdict about a path nobody had, while the live
 * subject had no sidecar at all, and `--check` exited 0 across both. The loop
 * above only ever looks from group to file; this looks the other way.
 *
 * REPORTED, NEVER DELETED. An orphan can also mean the group is temporarily
 * undiscovered — a declaration gap, not a dead group — and deleting on that
 * evidence destroys a measurement to hide a defect.
 * `deletion-requires-confirmation`: the agent reports, a person decides.
 */
function sweepOrphans(accountedFor: string[]): string[] {
  const known = new Set(accountedFor);
  const out: string[] = [];
  const walk = (dir: string, prefix = ""): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // no results directory yet is not an orphan
    }
    for (const e of entries) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(dir, e.name), rel);
      else if (e.name.endsWith(".detangle.json") && !known.has(rel)) out.push(rel);
    }
  };
  walk(RESULTS_DIR);
  return out.sort();
}

const checking = process.argv.includes("--check");
const { written: sidecarsWritten, stale: staleSidecars } = writeSidecars();
const orphanSidecars = sweepOrphans(sidecarsWritten);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ thresholds: DEFAULT_THRESHOLDS, results, dangling }, null, 2));
} else {
  console.log(`\nDetangle — ${nodes.length} nodes, ${edges.length} edges, ${dangling.length} dangling\n`);
  console.log(
    "  " +
      ["group".padEnd(40), "size".padStart(5), "coh".padStart(6), "in".padStart(5), "out".padStart(6), "grps".padStart(5), "dir".padStart(6), "enf".padStart(4), "prose".padStart(6), "wdir".padStart(5), "undet".padStart(6), "role".padEnd(13), "verdict"].join(" "),
  );
  console.log("  " + "-".repeat(135));
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
          String(r.wrongDirection).padStart(5),
          String(r.undeterminedDirection).padStart(6),
          r.role.padEnd(13),
          v,
        ].join(" "),
    );
    if (only) {
      for (const c of r.clauses) console.log(`      · ${c}`);
      if (r.worklist.length) {
        // Wrong-direction first: it is the kind a declaration decides, so it
        // is the part of the list that needs no adjudication to act on.
        console.log(`\n      Detangling worklist — every outbound edge, wrong-direction first:`);
        const ordered = [...r.classified].sort((a, b) => Number(b.kind === "wrong-direction") - Number(a.kind === "wrong-direction"));
        for (const e of ordered) {
          console.log(`      → ${e.to}   [${e.via}]   from ${e.from}\n          ${e.kind} — ${e.basis}`);
        }
      }
    }
  }
  console.log(
    `\n  Nothing here decides anything. A failing clause is a reason to LOOK.\n` +
      `  The carve is an adjudication — see cat-harness/schemas/detangle.ts, "taste is a declared step".\n`,
  );
}

// ── Report the pinned record, after the table so it reads as a footnote to it.
if (!process.argv.includes("--json")) {
  const where = relative(process.cwd(), RESULTS_DIR);
  if (checking) {
    if (staleSidecars.length === 0 && orphanSidecars.length === 0) {
      console.log(`  \u2713 ${sidecarsWritten.length} pinned measurement(s) current in ${where}/`);
    }
  } else {
    console.log(`\n  wrote ${sidecarsWritten.length} pinned measurement(s) to ${where}/`);
  }
  // NAMED, never counted — the question a stale sidecar raises is WHICH number
  // moved, and a bare count makes the reader go and diff it themselves.
  for (const s of staleSidecars) {
    console[checking ? "error" : "log"](`  ${checking ? "STALE" : "updated"}  ${s.path} — ${s.fields.join(", ")}`);
  }
  for (const o of orphanSidecars) {
    console.error(`  ORPHAN ${o} — no current group measures this. Reported, not deleted: it may be a declaration gap rather than a dead group.`);
  }
}

if (checking && (staleSidecars.length > 0 || orphanSidecars.length > 0)) {
  console.error(`\n  Run \`bun run kg:detangle\` and commit the result.`);
  process.exit(1);
}
