/**
 * Extracts the interior of a BPMN file as the L2-BPMN subgraph — a port of
 * WHO smart-kg `tools/extract-bpmn.mjs` (main 3f5e477).
 *
 * Separate from `../../L2/schemas/extract-dak.ts` because the input is XML
 * rather than FSH, the vocabulary is OMG's rather than WHO's, and the failure
 * mode is different: a DAK component is wrong when it points at a file that is
 * not there, this is wrong when it misreads the file it did find.
 *
 * The one cross-file join here is `performedBy`: a pool's @name against an
 * ActorDefinition's title. Compare extract-dak, where a requirement names a
 * persona by Canonical() and resolves exactly. Same estate, same personas, two
 * mechanisms — and only one of them survives a rename.
 *
 *   npx tsx L2-bpmn/schemas/extract-bpmn.ts <file.bpmn> [--personas <dir>] [--out <path>]
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import {
  argOf,
  countByType,
  edgeBuilder,
  graphDocument,
  isMain,
  nodeBuilder,
  xmlAttr as attr,
  type GraphDocument,
  type GraphEdge,
  type GraphNode,
} from "../../L1/schemas/extract-doc.ts";
import { artifactId, dakNamespace, elementId, normalisedScheme, personaId, sha256 } from "../../L2/schemas/kgid-l2.ts";
import { L2_BPMN } from "./l2-bpmn.ts";

const SKILL = "kg/extract-bpmn";
const node = nodeBuilder(SKILL);
const edge = edgeBuilder(SKILL);

/** An ActorDefinition a pool's name matched; null in the map when two share the title. */
export interface PersonaTitle {
  title: string;
  source: string;
}

export interface BpmnStats {
  warnings: string[];
  /** Task name -> task IRI; null when the name is not unique in the file. */
  taskNames: Map<string, string | null>;
  fileIri: string;
  ns: string;
}

export interface BpmnExtraction {
  doc: GraphDocument;
  stats: BpmnStats;
}

/** ActorDefinition titles, which is what a pool matches on. */
export function readPersonaTitles(dir: string): Map<string, PersonaTitle | null> {
  const out = new Map<string, PersonaTitle | null>();
  if (!existsSync(dir)) return out;
  const walk = (d: string): void => {
    for (const e of readdirSync(d).sort()) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) {
        walk(p);
        continue;
      }
      if (!e.endsWith(".fsh")) continue;
      const text = readFileSync(p, "utf8");
      for (const part of text.split(/^(?=Instance:\s*\S)/m)) {
        if (!/^Instance:\s*\S+\s*\r?\n\s*InstanceOf:\s*ActorDefinition/.test(part)) continue;
        const title = /^\*\s+title\s*=\s*"([^"]*)"/m.exec(part)?.[1];
        if (!title) continue;
        out.set(title, out.has(title) ? null : { title, source: p });
      }
    }
  };
  walk(dir);
  return out;
}

export function extract(xml: string, path: string, personaTitles: Map<string, PersonaTitle | null> = new Map()): BpmnExtraction {
  const rawNs = attr(xml, "targetNamespace");
  const ns = dakNamespace(rawNs);
  const fileId = /<bpmn:definitions[^>]*\sid="([^"]+)"/.exec(xml)?.[1] ?? basename(path);
  const fileIri = artifactId(ns, fileId);
  const eid = (id: string | null): string => elementId(ns, fileId, String(id));
  const fileHash = sha256(readFileSync(path));

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const warnings: string[] = [];
  const taskNames = new Map<string, string | null>();
  if (normalisedScheme(rawNs)) {
    warnings.push(
      `targetNamespace "${rawNs}" uses http; dak.json declares https. Normalised to ` +
        `"${ns}" so nodes join — but the two files disagree and one of them should change.`,
    );
  }

  nodes.push(
    node(fileIri, "bpmn-definitions", /<!--\s*COLLABORATION:\s*([^\n]*?)\s*-->/.exec(xml)?.[1] ?? fileId, {
      id: fileId,
      source: path,
      sha256: fileHash,
      targetNamespace: rawNs,
      exporter: attr(xml, "exporter"),
      exporterVersion: attr(xml, "exporterVersion"),
    }),
  );

  const participantOfProcess = new Map<string, string>();
  for (const [tag] of xml.matchAll(/<bpmn:participant\b[^>]*\/?>/g)) {
    const id = attr(tag, "id");
    const name = attr(tag, "name");
    const processRef = attr(tag, "processRef");
    const iri = eid(id);
    if (processRef) participantOfProcess.set(processRef, iri);
    nodes.push(node(iri, "bpmn-participant", name, { id, name, processRef }));
    edges.push(edge("contains", fileIri, iri));

    const key = name ?? "";
    const hit = personaTitles.get(key);
    const status = hit ? "resolved" : personaTitles.has(key) ? "ambiguous" : "unresolved";
    const target = personaId(ns, key);
    if (status !== "resolved") {
      warnings.push(`participant "${name}" -> persona ${status}`);
      // Mint the target. A dangling edge is dropped by any store and the finding goes with it; a
      // node marked unresolved makes "roles a process names that nothing defines" a query. The
      // persona class is L2's; it is emitted here because this is the only extractor that knows
      // the reference exists.
      nodes.push(
        node(target, "persona", name, { title: name, resolutionStatus: status }, {
          derivation: "inferred",
          note:
            "Referenced by a BPMN participant but not defined by any ActorDefinition read. " +
            "Carries the referenced title and nothing else — inventing a description or a type " +
            "would turn a gap into apparent content.",
          evidence: { location: path, quote: `<bpmn:participant name="${name}"/>` },
        }),
      );
    }
    edges.push(
      edge("performedBy", iri, target, {
        properties: { resolutionStatus: status, matchedOn: "participant @name == ActorDefinition title" },
        derivation: "inferred",
        note:
          status === "resolved"
            ? "Matched by exact string equality on a display title. A requirement in the same estate " +
              "reaches the same persona by Canonical() and does not depend on that title staying put."
            : status === "ambiguous"
              ? "More than one ActorDefinition carries this title. A question for a person; a matcher " +
                "must not tie-break it."
              : "No ActorDefinition carries this title. Either the persona is undefined, or it is " +
                "defined under a different title — and the BPMN gives no way to tell which.",
        evidence: hit
          ? { location: hit.source, quote: `* title = "${hit.title}"` }
          : { location: path, quote: `<bpmn:participant name="${name}"/>` },
      }),
    );
  }

  const parentOf = new Map<string, string>();
  for (const [block, subTag] of xml.matchAll(/(<bpmn:subProcess\b([^>]*)>[\s\S]*?<\/bpmn:subProcess>)/g)) {
    const subId = attr(subTag!, "id");
    for (const [, childTag] of block.matchAll(/<bpmn:(?:task|exclusiveGateway|startEvent|endEvent)\b([^>]*)[/>]/g)) {
      const cid = attr(childTag!, "id");
      if (cid && subId && cid !== subId) parentOf.set(cid, subId);
    }
  }

  for (const [, procTag, procBody] of xml.matchAll(/<bpmn:process\b([^>]*)>([\s\S]*?)<\/bpmn:process>/g)) {
    const procId = attr(procTag!, "id");
    const procIri = eid(procId);
    nodes.push(
      node(procIri, "bpmn-process", attr(procTag!, "name") ?? procId, {
        id: procId,
        name: attr(procTag!, "name"),
        isExecutable: attr(procTag!, "isExecutable") === "true",
      }),
    );
    edges.push(edge("contains", fileIri, procIri));
    if (!participantOfProcess.has(String(procId))) warnings.push(`process "${procId}" is referenced by no participant`);

    const emit = (tag: string, type: string, props: Record<string, unknown>) => {
      const id = attr(tag, "id");
      const name = attr(tag, "name");
      const iri = eid(id);
      const parent = id ? parentOf.get(id) : undefined;
      nodes.push(node(iri, type, name ?? id, { id, name, ...props, ...(parent ? { parent: eid(parent) } : {}) }));
      edges.push(edge("contains", parent ? eid(parent) : procIri, iri));
      return { id, name, iri };
    };

    for (const [, tag] of procBody!.matchAll(/<bpmn:task\b([^>]*)[/>]/g)) {
      const t = emit(tag!, "bpmn-task", { taskType: "task", isSubProcess: false });
      if (t.name) {
        if (taskNames.has(t.name)) {
          warnings.push(`duplicate task name "${t.name}"`);
          taskNames.set(t.name, null);
        } else taskNames.set(t.name, t.iri);
      }
    }
    for (const [, tag] of procBody!.matchAll(/<bpmn:subProcess\b([^>]*)>/g)) {
      const t = emit(tag!, "bpmn-task", { taskType: "subProcess", isSubProcess: true });
      if (t.name && !taskNames.has(t.name)) taskNames.set(t.name, t.iri);
    }
    for (const [, tag] of procBody!.matchAll(/<bpmn:exclusiveGateway\b([^>]*)[/>]/g)) {
      emit(tag!, "bpmn-gateway", { gatewayType: "exclusive" });
    }
    for (const [, kind, tag] of procBody!.matchAll(/<bpmn:(startEvent|endEvent)\b([^>]*)[/>]/g)) {
      emit(tag!, "bpmn-event", { eventType: kind!.replace("Event", "") });
    }
    for (const [, tag] of procBody!.matchAll(/<bpmn:sequenceFlow\b([^>]*)[/>]/g)) {
      const name = attr(tag!, "name");
      edges.push(
        edge("flowsTo", eid(attr(tag!, "sourceRef")), eid(attr(tag!, "targetRef")), {
          ...(name ? { qualifier: name } : {}),
          properties: { flowId: attr(tag!, "id"), hasConditionExpression: /conditionExpression/.test(tag!) },
        }),
      );
    }
  }

  for (const [, tag] of xml.matchAll(/<bpmn:messageFlow\b([^>]*)[/>]/g)) {
    edges.push(
      edge("messageTo", eid(attr(tag!, "sourceRef")), eid(attr(tag!, "targetRef")), {
        properties: { flowId: attr(tag!, "id") },
        note: "Crosses participants, so it is a handoff between roles rather than a step within one.",
      }),
    );
  }

  return {
    doc: graphDocument(L2_BPMN, `${ns}/kg/l2-bpmn`, [{ path, sha256: fileHash }], nodes, edges),
    stats: { warnings, taskNames, fileIri, ns },
  };
}

function main(argv: string[]): number {
  const path = argv[0];
  if (!path || path.startsWith("--")) {
    console.error("usage: extract-bpmn.ts <file.bpmn> [--personas <dir>] [--out <path>]");
    return 2;
  }
  const personaDir = argOf(argv, "--personas");
  const titles = personaDir ? readPersonaTitles(personaDir) : new Map<string, PersonaTitle | null>();
  const { doc, stats } = extract(readFileSync(path, "utf8"), path, titles);
  const out = argOf(argv, "--out");
  if (out) writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
  else console.log(JSON.stringify(doc, null, 2));

  console.error(`${doc.nodes.length} nodes, ${doc.edges.length} edges`);
  console.error(
    Object.entries(countByType(doc.nodes))
      .map(([k, v]) => `  ${k}: ${v}`)
      .join("\n"),
  );
  const joins = doc.edges.filter((e) => e.properties?.resolutionStatus);
  const res = joins.filter((e) => e.properties?.resolutionStatus === "resolved").length;
  console.error(`${res}/${joins.length} pool -> persona joins resolved (by display title)`);
  for (const w of stats.warnings) console.error(`  warning: ${w}`);
  return 0;
}

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
