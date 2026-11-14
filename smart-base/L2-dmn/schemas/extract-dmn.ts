/**
 * Extracts the interior of a DMN file as the L2-DMN subgraph — a port of WHO
 * smart-kg `tools/extract-dmn.mjs` (main 3f5e477).
 *
 * Separate from the BPMN subgraph, and importing it, because the dependency is
 * real and runs one way: dmn:usingTask names the BPMN task that invokes the
 * decision. A DMN can be read without a BPMN — the join is then recorded
 * unresolved — but the reference only exists in this direction.
 *
 * Two joins leave this subgraph. `reads` reaches an l2:data-element by a name
 * recovered from prose. `citesSource` reaches an l1:citation minted from the
 * same string by `extract-citations.ts`, which is how the DMN interior and the
 * L1 recommendation graph meet without either knowing the other.
 *
 *   npx tsx L2-dmn/schemas/extract-dmn.ts <file.dmn> [--bpmn <f.bpmn>] [--out <path>]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

import {
  argOf,
  countByType,
  edgeBuilder,
  graphDocument,
  isMain,
  nodeBuilder,
  xmlAttr as attr,
  xmlDecode as dec,
  type GraphDocument,
  type GraphEdge,
  type GraphNode,
} from "../../L1/schemas/extract-doc.ts";
import { extract as extractBpmn, type BpmnExtraction } from "../../L2-bpmn/schemas/extract-bpmn.ts";
import { artifactId, citationId, dakNamespace, dataElementId, elementId, normalisedScheme, sha256 } from "../../L2/schemas/kgid-l2.ts";
import { L2_DMN } from "./l2-dmn.ts";

const SKILL = "kg/extract-dmn";
const node = nodeBuilder(SKILL);
const edge = edgeBuilder(SKILL);

const inner = (block: string, tag: string): string | null => {
  const m = new RegExp(`<[a-z]+:${tag}>([\\s\\S]*?)</[a-z]+:${tag}>`).exec(block);
  return m ? dec(m[1]!.trim()) : null;
};

// A quoted token in an input expression is a FIELD or a VALUE depending on which side of a
// comparison it sits: in `where "Vaccine type" = "BCG vaccines"` the first is a field and the
// second is not. Taking every quoted token would invent a data element called "BCG vaccines".
const CMP = "=|≠|!=|<>|≤|≥|<=|>=|<|>";

export interface DataElementRef {
  name: string;
  extractionRule: "bare-expression" | "quoted-left-of-comparison" | "quoted-operand";
}

export function dataElementsIn(expression: string | null | undefined): DataElementRef[] {
  const expr = String(expression ?? "").trim();
  if (!expr) return [];
  const quoted = [...expr.matchAll(/"([^"]+)"/g)];
  if (quoted.length === 0) {
    if (new RegExp(CMP).test(expr)) return [];
    return [{ name: expr, extractionRule: "bare-expression" }];
  }
  const out: DataElementRef[] = [];
  for (const m of quoted) {
    const before = expr.slice(0, m.index).trimEnd();
    const after = expr.slice(m.index! + m[0].length).trimStart();
    const pre = new RegExp(`(${CMP})$`).test(before);
    const post = new RegExp(`^(${CMP})`).test(after);
    if (pre && !post) continue;
    out.push({ name: dec(m[1]).trim(), extractionRule: post ? "quoted-left-of-comparison" : "quoted-operand" });
  }
  const seen = new Set<string>();
  return out.filter((d) => d.name && !seen.has(d.name) && (seen.add(d.name), true));
}

interface Cell {
  description: string | null;
  text: string | null;
}

export interface DmnExtraction {
  doc: GraphDocument;
  stats: { warnings: string[] };
}

export function extract(xml: string, path: string, bpmn: BpmnExtraction | null = null): DmnExtraction {
  const rawNs = attr(xml, "namespace");
  const ns = dakNamespace(rawNs);
  const fileId = /<dmn:decision\b[^>]*\sid="([^"]+)"/.exec(xml)?.[1] ?? basename(path);
  const fileIri = artifactId(ns, fileId);
  const eid = (id: string | null): string => elementId(ns, fileId, String(id));
  const fileHash = sha256(readFileSync(path));

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const warnings: string[] = [];
  if (normalisedScheme(rawNs)) {
    warnings.push(`namespace "${rawNs}" uses http; dak.json declares https. Normalised to "${ns}".`);
  }

  nodes.push(
    node(fileIri, "dmn-definitions", attr(xml, "label") ?? fileId, {
      id: fileId,
      namespace: rawNs,
      label: attr(xml, "label"),
      source: path,
      sha256: fileHash,
    }),
  );

  for (const [, decTag, decBody] of xml.matchAll(/<dmn:decision\b([^>]*)>([\s\S]*?)<\/dmn:decision>/g)) {
    const decId = attr(decTag!, "id");
    const decIri = eid(decId);
    nodes.push(
      node(decIri, "dmn-decision", attr(decTag!, "label") ?? decId, {
        id: decId,
        label: attr(decTag!, "label"),
        question: inner(decBody!, "question"),
        allowedAnswers: inner(decBody!, "allowedAnswers"),
      }),
    );
    edges.push(edge("contains", fileIri, decIri));

    // --- the BPMN join ----------------------------------------------------------------------
    const usingTask = /<dmn:usingTask\b[^>]*href="([^"]+)"/.exec(decBody!)?.[1] ?? null;
    if (usingTask) {
      const [href, frag] = usingTask.split("#") as [string, string | undefined];
      const taskName = frag ? decodeURIComponent(frag) : null;
      const hit = taskName && bpmn ? (bpmn.stats.taskNames.get(taskName) ?? undefined) : undefined;
      let target = hit;
      if (!target) {
        target = `${ns}/artifact/${basename(href)}${frag ? `#${frag}` : ""}`;
        nodes.push(
          node(target, "external-artifact", taskName ?? href, { iri: target, targetKind: "bpmn" }, {
            derivation: "inferred",
            note:
              "The task named by this href is in a BPMN file this graph does not hold, so it " +
              "is an opaque pointer. Nothing is claimed about the task itself.",
            evidence: { location: path, quote: `<dmn:usingTask href="${usingTask}"/>` },
          }),
        );
        warnings.push(`usingTask -> BPMN task unresolved: ${bpmn ? "no task of that name in the BPMN read" : "no BPMN supplied"}`);
      }
      edges.push(
        edge("invokedBy", decIri, target, {
          properties: {
            resolutionStatus: hit ? "resolved" : "unresolved",
            matchedOn: "usingTask @href fragment == BPMN task @name",
            href: usingTask,
            taskName,
          },
          derivation: "inferred",
          note: hit
            ? "Matched on the task's NAME, URL-encoded in the href fragment — not on its id. It " +
              "holds only while that sentence stays byte-identical in the BPMN."
            : "The href names a BPMN file and a task by name. Nothing was available to resolve it " +
              "against, so the target is an opaque pointer and the edge is explicitly unresolved.",
          evidence: { location: path, quote: `<dmn:usingTask href="${usingTask}"/>` },
        }),
      );
    }

    for (const [, tblTag, tblBody] of decBody!.matchAll(/<dmn:decisionTable\b([^>]*)>([\s\S]*?)<\/dmn:decisionTable>/g)) {
      const tblId = attr(tblTag!, "id") ?? `${decId}.table`;
      const tblIri = eid(`${tblId}#table`);
      nodes.push(
        node(tblIri, "dmn-decision-table", attr(tblTag!, "label") ?? tblId, {
          id: tblId,
          // Absent in the BCG table. Left absent rather than defaulted to DMN's UNIQUE, which
          // would be asserting something the file does not say.
          hitPolicy: attr(tblTag!, "hitPolicy"),
          aggregation: attr(tblTag!, "aggregation"),
        }),
      );
      edges.push(edge("contains", decIri, tblIri));

      const inputs = [...tblBody!.matchAll(/<dmn:input\b([^>]*)>([\s\S]*?)<\/dmn:input>/g)].map(([, tag, body], i) => ({
        id: attr(tag!, "id"),
        label: attr(tag!, "label"),
        ordinal: i,
        expression: inner(body!, "text"),
        typeRef: /<dmn:inputExpression\b[^>]*typeRef="([^"]+)"/.exec(body!)?.[1] ?? null,
      }));
      const outputs = [...tblBody!.matchAll(/<dmn:output\b([^>]*)>([\s\S]*?)<\/dmn:output>/g)].map(([, tag, body], i) => ({
        id: attr(tag!, "id"),
        label: attr(tag!, "label"),
        ordinal: i,
        description: inner(body!, "description"),
      }));

      // DMN splits the output columns across outputEntry and annotationEntry, positionally. How
      // many are which is read from a rule rather than assumed, because the split decides which
      // column a cell belongs to and getting it wrong silently misattributes every citation.
      const firstRule = /<dmn:rule\b[^>]*>([\s\S]*?)<\/dmn:rule>/.exec(tblBody!)?.[1] ?? "";
      const nOutputEntry = (firstRule.match(/<dmn:outputEntry>/g) ?? []).length;
      const refCol = outputs.findIndex((o) => /source content \(L1\)/i.test(o.description ?? "") || /^reference/i.test(o.label ?? ""));

      const seenElements = new Set<string>();
      for (const c of inputs) {
        const iri = eid(c.id);
        nodes.push(
          node(iri, "dmn-input-clause", c.label, {
            id: c.id,
            label: c.label,
            expression: c.expression,
            typeRef: c.typeRef,
            ordinal: c.ordinal,
          }),
        );
        edges.push(edge("contains", tblIri, iri));

        for (const d of dataElementsIn(c.expression)) {
          const deIri = dataElementId(ns, d.name);
          if (!seenElements.has(deIri)) {
            seenElements.add(deIri);
            nodes.push(
              node(deIri, "data-element", d.name, { name: d.name, extractionRule: d.extractionRule, resolutionStatus: "unresolved" }, {
                derivation: "inferred",
                note:
                  `Recovered from a DMN input expression by the "${d.extractionRule}" rule. No ` +
                  `data dictionary was available, so this is a name that was referenced, not a ` +
                  `definition that was found — and no type or canonical is claimed.`,
                evidence: { location: `${path}#${c.id}`, quote: c.expression ?? "" },
              }),
            );
          }
          edges.push(
            edge("reads", iri, deIri, {
              properties: { resolutionStatus: "unresolved", extractionRule: d.extractionRule },
              derivation: "inferred",
              note:
                "The element name was read out of free text. Until a dictionary resolves it, " +
                "this records that the decision refers to something by that name.",
              evidence: { location: `${path}#${c.id}`, quote: c.expression ?? "" },
            }),
          );
        }
      }

      for (const c of outputs) {
        const iri = eid(c.id);
        nodes.push(
          node(iri, "dmn-output-clause", c.label, {
            id: c.id,
            label: c.label,
            description: c.description,
            ordinal: c.ordinal,
            serialisedAs: c.ordinal < nOutputEntry ? "outputEntry" : "annotationEntry",
            isReferenceColumn: c.ordinal === refCol,
          }),
        );
        edges.push(edge("contains", tblIri, iri));
      }

      const refAnnotationIndex = refCol === -1 ? -1 : refCol - nOutputEntry;
      const cov = { rules: 0, cited: 0, noAnnotations: 0 };
      let ordinal = 0;
      for (const [, ruleId, body] of tblBody!.matchAll(/<dmn:rule\b[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/dmn:rule>/g)) {
        cov.rules++;
        const cells = (t: string): Cell[] =>
          [...body!.matchAll(new RegExp(`<dmn:${t}>([\\s\\S]*?)</dmn:${t}>`, "g"))].map((m) => ({
            description: inner(m[1]!, "description"),
            text: inner(m[1]!, "text"),
          }));
        const conditions = cells("inputEntry").map((c, i) => ({ clause: inputs[i]?.label ?? null, ...c }));
        const results = cells("outputEntry").map((c, i) => ({ clause: outputs[i]?.label ?? null, ...c }));
        const annotations = cells("annotationEntry").map((c, i) => ({
          clause: outputs[i + nOutputEntry]?.label ?? null,
          text: c.text ?? c.description,
        }));
        if (!annotations.length) cov.noAnnotations++;

        const iri = eid(ruleId!);
        nodes.push(node(iri, "dmn-rule", `rule ${ordinal + 1}`, { id: ruleId, ordinal, conditions, outputs: results, annotations }));
        edges.push(edge("contains", tblIri, iri));
        ordinal++;

        const citationText = refAnnotationIndex >= 0 ? annotations[refAnnotationIndex]?.text : null;
        if (citationText && citationText !== "–" && citationText !== "-") {
          cov.cited++;
          edges.push(
            edge("citesSource", iri, citationId(ns, citationText), {
              properties: { text: citationText },
              note:
                "Target is an l1:citation minted by extract-citations.ts from this same " +
                "string, so the DMN interior and the L1 graph join without either knowing the other.",
              evidence: { location: `${path}#${ruleId}`, quote: citationText },
            }),
          );
        }
      }
      if (cov.cited < cov.rules) {
        warnings.push(`L1 citation coverage ${cov.cited}/${cov.rules} rules (${cov.noAnnotations} carry no annotation at all)`);
      }
    }
  }

  return {
    doc: graphDocument(L2_DMN, `${ns}/kg/l2-dmn`, [{ path, sha256: fileHash }], nodes, edges),
    stats: { warnings },
  };
}

function main(argv: string[]): number {
  const path = argv[0];
  if (!path || path.startsWith("--")) {
    console.error("usage: extract-dmn.ts <file.dmn> [--bpmn <f.bpmn>] [--out <path>]");
    return 2;
  }
  const bpmnPath = argOf(argv, "--bpmn");
  const bpmn = bpmnPath ? extractBpmn(readFileSync(bpmnPath, "utf8"), bpmnPath) : null;
  const { doc, stats } = extract(readFileSync(path, "utf8"), path, bpmn);
  const out = argOf(argv, "--out");
  if (out) writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
  else console.log(JSON.stringify(doc, null, 2));

  console.error(`${doc.nodes.length} nodes, ${doc.edges.length} edges`);
  console.error(
    Object.entries(countByType(doc.nodes))
      .map(([k, v]) => `  ${k}: ${v}`)
      .join("\n"),
  );
  for (const w of stats.warnings) console.error(`  warning: ${w}`);
  return 0;
}

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
