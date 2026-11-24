/**
 * Extracts L1 citations from a DMN decision table — a port of WHO smart-kg
 * `tools/extract-citations.mjs` (main 3f5e477).
 *
 * WHO's own tooling already provides for an L1 reference per decision-table
 * rule — the BCG table declares an output column whose description reads
 * "Reference for the source content (L1)" — but it holds free text no tool can
 * follow, and only 1 of that table's 25 rules has one filled in. This turns
 * each such string into a `citation` node, leaves it `unresolved` until a
 * person resolves it, and reports how many rules had nothing to extract. A cell
 * holding several citations on separate lines yields one node per line, and
 * "[Add appropriate reference]" is recorded as a placeholder: the author saying
 * a source is missing, which coverage counts apart from a blank.
 *
 * The output is an L2 document: the citations are L1 nodes, but the file they
 * appear in is the DAK's (l2:external-artifact), and since L1 3.0 nothing in L1
 * points out of L1. It lives here, beside `extract-dmn.ts`, because it reads
 * the same input.
 *
 * What it does NOT do is guess the resolution. Matching a citation string to a
 * publication is a judgement, and the schema requires a note and evidence for a
 * judgement. An extractor that resolved silently would be manufacturing provenance.
 *
 *   npx tsx L2-dmn/schemas/extract-citations.ts <file.dmn> [--out /tmp/citations.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

import { argOf, edgeBuilder, graphDocument, isMain, nodeBuilder, stripTags, xmlDecode as dec, type GraphDocument, type GraphEdge, type GraphNode } from "../../L1/schemas/extract-doc.ts";
import { L2 } from "../../L2/schemas/l2.ts";
import { artifactId, citationId, dakNamespace, sha256 } from "../../L2/schemas/kgid-l2.ts";

const SKILL = "kg/extract-citations";
const node = nodeBuilder(SKILL);
const edge = edgeBuilder(SKILL);

const text = (block: string, tag: string): string | null => {
  const m = new RegExp(`<dmn:${tag}>([\\s\\S]*?)</dmn:${tag}>`).exec(block);
  return m ? dec(m[1]!.trim()) : null;
};

export interface CitationStats {
  rules: number;
  cited: number;
  placeholderOnly: number;
  noAnnotations: number;
  shortOfRefColumn: number;
  citations: number;
  usingTask: string | null;
}

export function extract(xml: string, path: string): { doc: GraphDocument; stats: CitationStats } {
  const nsUrl = dakNamespace(/namespace="([^"]+)"/.exec(xml)?.[1]); // scheme-normalised; see kgid-l2.ts
  const tableId = /<dmn:decision id="([^"]+)"/.exec(xml)?.[1] ?? basename(path);
  const usingTask = /<dmn:usingTask href="([^"]+)"/.exec(xml)?.[1] ?? null;

  // Which output column is the L1 reference. The description is the reliable marker; column order
  // is not, and hard-coding an index would break on the first table that adds a column.
  const outputs = [...xml.matchAll(/<dmn:output id="([^"]+)" label="([^"]+)">([\s\S]*?)<\/dmn:output>/g)].map(([, id, label, body]) => ({
    id,
    label: dec(label),
    description: text(body!, "description"),
  }));
  const refCol = outputs.findIndex((o) => /source content \(L1\)/i.test(o.description ?? "") || /^reference/i.test(o.label));
  // outputEntry and annotationEntry are serialised separately; the reference lands among the
  // annotations, offset by however many outputs are carried as outputEntry. In the BCG table the
  // first two outputs (Care Plan, Guidance) are outputEntry and the last two (Annotations,
  // Reference(s)) are annotationEntry, which is what the offset of 2 encodes. (smart-kg's rule,
  // kept; extract-dmn.ts counts the outputEntry cells of the first rule instead.)
  const refAnnotationIndex = refCol === -1 ? -1 : refCol - 2;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seenCitations = new Map<string, string>();

  const artifact = artifactId(nsUrl, tableId);
  nodes.push(node(artifact, "external-artifact", /label="([^"]+)"/.exec(xml)?.[1] ?? tableId, { iri: artifact, targetKind: "dmn" }));

  // Coverage, counted rather than assumed. In the BCG table 16 of 25 rules carry no annotation at
  // all and 8 carry only the first (guidance) one. Which rules cite a source and which do not is
  // the question this graph exists to answer, so the extractor reports it.
  const cov = { rules: 0, cited: 0, placeholderOnly: 0, noAnnotations: 0, shortOfRefColumn: 0 };

  for (const [, , body] of xml.matchAll(/<dmn:rule id="([^"]+)">([\s\S]*?)<\/dmn:rule>/g)) {
    cov.rules++;
    const annotations = [...body!.matchAll(/<dmn:annotationEntry>([\s\S]*?)<\/dmn:annotationEntry>/g)].map(
      (m) => text(m[1]!, "text") ?? dec(stripTags(m[1]!).trim()),
    );
    if (annotations.length === 0) cov.noAnnotations++;
    if (refAnnotationIndex < 0 || annotations.length <= refAnnotationIndex) {
      // Trailing empty annotation columns are omitted by the generator rather than serialised
      // empty, so a rule can be short of the reference column. Positional reading cannot tell a
      // rule that omitted only the reference from one that omitted an earlier column too; it is
      // counted here rather than guessed at.
      if (annotations.length > 0) cov.shortOfRefColumn++;
      continue;
    }
    const cell = annotations[refAnnotationIndex];
    // One citation per line: a cell can cite the summary tables and a position paper at once, and
    // those resolve to different publications.
    const lines = (cell ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && l !== "–" && l !== "-");
    if (!lines.length) continue;
    if (lines.some((l) => !/^\[.*\]$/.test(l))) cov.cited++;
    else cov.placeholderOnly++;

    for (const citationText of lines) {
      // One citation node per distinct string; where each rule cites it is recorded by L2-DMN's
      // citesSource edges, not on the node.
      if (seenCitations.has(citationText)) continue;
      const citeId = citationId(nsUrl, citationText);
      seenCitations.set(citationText, citeId);
      const numbering = /\((\d+)\)\s*$/.exec(citationText)?.[1] ?? null;
      const placeholder = /^\[.*\]$/.test(citationText);
      nodes.push(
        node(
          citeId,
          "citation",
          citationText.length > 80 ? citationText.slice(0, 77) + "..." : citationText,
          {
            text: citationText,
            numbering,
            citationKind: placeholder ? "placeholder" : "reference",
            resolutionStatus: "unresolved",
          },
          { note: "Copied verbatim from the rule's L1 reference annotation. Resolution to a publication is deliberately not attempted here." },
        ),
      );
      edges.push(edge("appearsIn", citeId, artifact));
    }
  }

  return {
    doc: graphDocument(L2, `${nsUrl}/kg/citations`, [{ path, sha256: sha256(readFileSync(path)) }], nodes, edges),
    stats: { ...cov, citations: seenCitations.size, usingTask },
  };
}

function main(argv: string[]): number {
  const path = argv[0];
  if (!path || path.startsWith("--")) {
    console.error("usage: extract-citations.ts <file.dmn> [--out <path>]");
    return 2;
  }
  const { doc, stats } = extract(readFileSync(path, "utf8"), path);
  const out = argOf(argv, "--out");
  if (out) writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
  console.error(`${stats.rules} rules, ${stats.citations} distinct L1 citation(s), ${doc.nodes.length} nodes, ${doc.edges.length} edges`);
  console.error(
    `coverage: ${stats.cited}/${stats.rules} rules cite an L1 source` +
      (stats.placeholderOnly ? `, ${stats.placeholderOnly} carry only a placeholder` : "") +
      ` (${stats.noAnnotations} carry no annotation at all` +
      (stats.shortOfRefColumn ? `, ${stats.shortOfRefColumn} stop short of the reference column` : "") +
      `)`,
  );
  if (stats.cited < stats.rules) console.error("  ^ a gap in the source, not in this tool. Reported so it can be fixed upstream.");
  if (stats.usingTask) console.error(`bpmn link present: ${decodeURIComponent(stats.usingTask).slice(0, 100)}...`);
  if (!out) console.log(JSON.stringify(doc, null, 2));
  return 0;
}

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
