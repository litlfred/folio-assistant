#!/usr/bin/env bun
/**
 * Graph-aware search across the authored corpus and the ingested library.
 *
 * `searchGraph` answers "which nodes contain these words". `neighbors` answers
 * "what is adjacent to this node". Both already exist, both already span the
 * authored and ingested populations — and they are disjoint operations. To use
 * one with the other today you search, copy an id, walk its neighbourhood, and
 * repeat per hit. The graph therefore contributes nothing to a search, which is
 * the one thing it is uniquely able to do.
 *
 * ## Why the graph belongs in the search
 *
 * The corpus-grep checklist an agent runs before declaring anything open asks
 * *"has anyone worked this topic?"*. A lexical search answers that for the
 * words the asker happened to choose. It cannot answer it for a prior result
 * written in different words — which is the case that actually costs a
 * session, because the grep comes back empty and reads as a clean bill.
 *
 * The graph is exactly the structure that survives a change of vocabulary. A
 * block that never says "Temperley-Lieb" but `uses` one that does is one hop
 * from the query. So: seed lexically, expand structurally, and say which is
 * which.
 *
 * ## What this does NOT do
 *
 * It does not invent a relevance score. `searchGraph` deliberately refuses to
 * rank, on the grounds that a made-up order hides the fact that everything
 * matched equally, and that reasoning holds here. Ordering is by facts the
 * index actually knows — which field matched, and how many hops away a node
 * is — never by a similarity number. `hops: 0` reproduces `searchGraph`'s
 * result exactly, so nothing is lost by routing through this.
 *
 * ## Provenance is reported, not merged
 *
 * "Open in this corpus" and "settled in a paper we hold" are different
 * verdicts, and conflating them is the specific error the checklist's fifth
 * path exists to prevent. Counts are split by provenance in every result, so a
 * caller can see at a glance that a topic has 40 library hits and no authored
 * ones — the shape that means *cite it*, not *derive it*.
 *
 *   bun run content/pipeline/graph-search.ts "torsion" --hops 2 --text
 *   bun run content/pipeline/graph-search.ts "Temperley-Lieb" --in
 */

import {
  type GraphIndex,
  type GraphNode,
  loadGraphIndex,
  defaultRoots,
  neighbors,
  searchGraph,
} from "./graph-index";
import type { GraphEdgeTerm } from "../../schemas/jsonld";

/** How a result got into the answer. */
export type Reason =
  | { via: "match"; matchedIn: string; snippet?: string }
  | { via: "graph"; seed: string; hops: number; path: GraphEdgeTerm[] };

export interface GraphSearchHit {
  id: string;
  label?: string;
  kind?: string;
  title?: string;
  provenance: string;
  file: string;
  reason: Reason;
}

export interface GraphSearchOptions {
  /** Expansion depth. 0 reproduces `searchGraph` exactly. Default 1. */
  hops?: number;
  /** Seed cap, before expansion. Default 20. */
  limit?: number;
  /** Scan companion Markdown for seeds. Off by default — it reads files. */
  searchText?: boolean;
  /** Restrict seeds by provenance. Expansion still crosses populations. */
  provenance?: string;
  /** `out` = what this depends on; `in` = what depends on it. Default both. */
  direction?: "out" | "in" | "both";
  /** Restrict expansion to these edge terms. */
  edges?: readonly GraphEdgeTerm[];
  /** Cap on expanded nodes per seed. Default 25. */
  maxPerSeed?: number;
}

export interface GraphSearchResult {
  query: string;
  hits: GraphSearchHit[];
  /** Seeds vs graph-reached, and the authored/ingested split of each. */
  summary: {
    seeds: number;
    expanded: number;
    byProvenance: Record<string, number>;
    seedsByProvenance: Record<string, number>;
    /** True when the query matched nothing lexically — expansion cannot help. */
    noSeeds: boolean;
  };
  /** Roots that were searched, and whether each existed at all. */
  roots: GraphIndex["roots"];
  /**
   * Roots that EXIST but hold no graph nodes.
   *
   * This is the difference between "nothing matched" and "nothing was
   * searched", and they look identical in a result unless someone says so.
   * A folio whose `.jsonld` siblings have never been generated has present,
   * populated, non-empty directories and an empty index — so every query
   * returns zero and reads as a clean negative. That is the exact shape of
   * the silent-empty-corpus failure this repo already guards elsewhere
   * (`scripts/tests/audit-empty-corpus.test.ts`), arriving one layer up.
   */
  emptyRoots: Array<{ name: string; dir: string }>;
  /** Edge targets referenced but absent from the index, deduped. */
  dangling: string[];
  /** Seeds the graph could not expand. Empty in a healthy index. */
  unexpandable: Array<{ seed: string; error: string }>;
  truncated: boolean;
}

/** Rank of a match field. Lower sorts first. Structural, not semantic. */
const FIELD_RANK: Record<string, number> = {
  label: 0, title: 1, kind: 2, tags: 3, text: 4,
};

function toHit(node: GraphNode, reason: Reason): GraphSearchHit {
  return {
    id: node.id,
    label: node.label,
    kind: node.kind,
    title: node.title,
    provenance: node.provenance,
    file: node.file,
    reason,
  };
}

function tally(hits: GraphSearchHit[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of hits) out[h.provenance] = (out[h.provenance] ?? 0) + 1;
  return out;
}

/**
 * Seed lexically, expand structurally.
 *
 * Seeds keep `searchGraph`'s order. Expanded nodes follow, nearest first, and
 * a node already present as a seed is never demoted to an expansion — the
 * stronger reason wins.
 */
export function graphSearch(
  index: GraphIndex,
  query: string,
  opts: GraphSearchOptions = {},
): GraphSearchResult {
  const hops = opts.hops ?? 1;
  const maxPerSeed = opts.maxPerSeed ?? 25;

  const base = searchGraph(index, query, {
    provenance: opts.provenance,
    limit: opts.limit ?? 20,
    searchText: opts.searchText,
  });

  const seen = new Map<string, GraphSearchHit>();
  for (const s of base.hits) {
    const node = index.nodes.get(s.id);
    if (!node) continue;
    seen.set(s.id, toHit(node, {
      via: "match", matchedIn: s.matchedIn, snippet: s.snippet,
    }));
  }
  const seedIds = [...seen.keys()];
  const seedCount = seedIds.length;

  const dangling = new Set<string>();
  const unexpandable: Array<{ seed: string; error: string }> = [];
  let truncated = base.textScanTruncated;

  if (hops > 0) {
    for (const seed of seedIds) {
      const res = neighbors(index, seed, {
        hops,
        direction: opts.direction ?? "both",
        edges: opts.edges,
        maxNodes: maxPerSeed,
      });
      // `neighbors` reports an unresolvable seed rather than throwing. A seed
      // came out of the index a moment ago, so this should not fire — but it
      // is recorded rather than swallowed, because silently skipping is how a
      // search under-reports and still looks clean.
      if ("error" in res) {
        unexpandable.push({ seed, error: res.error });
        continue;
      }
      const nb = res;
      truncated = truncated || nb.truncated;
      for (const d of nb.dangling) dangling.add(d);

      // Reconstruct hop + edge path per reached node from the edge list.
      const hopOf = new Map<string, number>();
      const edgeOf = new Map<string, GraphEdgeTerm[]>();
      for (const e of nb.edges) {
        const prev = hopOf.get(e.to);
        if (prev === undefined || e.hop < prev) {
          hopOf.set(e.to, e.hop);
          edgeOf.set(e.to, [...(edgeOf.get(e.from) ?? []), e.edge]);
        }
      }
      for (const n of nb.nodes) {
        if (n.id === seed || seen.has(n.id)) continue;  // seeds outrank expansions
        const node = index.nodes.get(n.id);
        if (!node) continue;
        seen.set(n.id, toHit(node, {
          via: "graph",
          seed,
          hops: hopOf.get(n.id) ?? 1,
          path: edgeOf.get(n.id) ?? [],
        }));
      }
    }
  }

  const hits = [...seen.values()].sort((a, b) => {
    const av = a.reason.via === "match" ? 0 : 1;
    const bv = b.reason.via === "match" ? 0 : 1;
    if (av !== bv) return av - bv;
    if (a.reason.via === "match" && b.reason.via === "match") {
      return (FIELD_RANK[a.reason.matchedIn] ?? 9) - (FIELD_RANK[b.reason.matchedIn] ?? 9);
    }
    if (a.reason.via === "graph" && b.reason.via === "graph") {
      return a.reason.hops - b.reason.hops;
    }
    return 0;
  });

  const seedHits = hits.filter((h) => h.reason.via === "match");
  return {
    query,
    hits,
    summary: {
      seeds: seedCount,
      expanded: hits.length - seedCount,
      byProvenance: tally(hits),
      seedsByProvenance: tally(seedHits),
      noSeeds: seedCount === 0,
    },
    roots: index.roots,
    emptyRoots: index.roots
      .filter((r) => r.present && r.nodes === 0)
      .map((r) => ({ name: r.name, dir: r.dir })),
    dangling: [...dangling].sort(),
    unexpandable,
    truncated,
  };
}

// ── CLI ──────────────────────────────────────────────────────────

if (import.meta.main) {
  const { findContentRepoRoot } = await import("./repo-root");
  const argv = process.argv.slice(2);
  const flag = (f: string): string | undefined =>
    argv.includes(f) ? argv[argv.indexOf(f) + 1] : undefined;
  const query = argv.find((a) => !a.startsWith("--") &&
    argv[argv.indexOf(a) - 1]?.startsWith("--") !== true) ?? argv[0] ?? "";

  const index = loadGraphIndex(defaultRoots(findContentRepoRoot()));
  const r = graphSearch(index, query, {
    hops: Number(flag("--hops") ?? 1),
    limit: Number(flag("--limit") ?? 20),
    searchText: argv.includes("--text"),
    direction: argv.includes("--in") ? "in" : argv.includes("--out") ? "out" : "both",
    provenance: flag("--provenance"),
  });

  if (argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    const s = r.summary;
    console.log(`query: ${JSON.stringify(r.query)}`);
    console.log(`  ${s.seeds} seed(s), ${s.expanded} reached via the graph`);
    console.log(`  by provenance: ${JSON.stringify(s.byProvenance)}   seeds only: ${JSON.stringify(s.seedsByProvenance)}`);
    for (const root of r.roots) {
      if (!root.present) console.log(`  ! root "${root.name}" absent (${root.dir}) — that population was NOT searched`);
    }
    for (const e of r.emptyRoots) {
      console.log(`  ! root "${e.name}" exists but holds ZERO graph nodes (${e.dir})`);
      console.log(`    Nothing was searched there. This is not a negative result.`);
      console.log(`    The .jsonld siblings are generated: run \`bun run gen:jsonld\` in the folio.`);
    }
    if (s.noSeeds && r.emptyRoots.length === 0) {
      console.log("  no lexical seed — expansion cannot help; try --text, or a different term");
    }
    console.log();
    for (const h of r.hits) {
      const why = h.reason.via === "match"
        ? `match:${h.reason.matchedIn}`
        : `graph:${h.reason.hops}hop via ${h.reason.path.join("/") || "?"} from ${h.reason.seed}`;
      console.log(`  [${h.provenance}] ${h.label ?? h.id}`);
      console.log(`      ${h.title ?? ""}`.trimEnd());
      console.log(`      ${why}`);
    }
    if (r.dangling.length) console.log(`\n  dangling edge targets: ${r.dangling.length}`);
    for (const u of r.unexpandable) console.log(`  ! seed ${u.seed} could not be expanded: ${u.error}`);
  }
}
