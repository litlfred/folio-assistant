#!/usr/bin/env bun
/**
 * export-graph.ts — bootstrap's own Knowledge Graph as JSON-LD,
 * `bootstrap.jsonld`: the document bootstrap owes in place of a visualiser
 * (`renderExemption.owes` in `bootstrap.json`).
 *
 * @module bootstrap-tools/scripts/export-graph
 * @covers code
 * @conformsTo w3c-prov-o
 *
 * ## Why here, and not cat-harness's `kg-export`
 *
 * Owner, 2026-09-30 (bean `xsqm`): *"bootstrap.jsonld, should be in
 * bootstrap-tools"*. Until then cat-harness's general exporter wrote it
 * (`kg-export --instance ./bootstrap`, a 24k-line import cone), and every
 * property in it was cat-harness's (`partOf`, `inSubgraph`, `relaxable`,
 * `touchesWorkPlan` …) — bootstrap's own graph described in the vocabulary of
 * the layer above it. Now the content's tools write the content's graph.
 *
 * ## Vocabulary — pre-existing standards first
 *
 * Owner, 2026-09-30: *"emphasize pre-existing standards"*. Classes are
 * bootstrap's (`bootstrap/ns.jsonld`, exactly its defined terms). Every
 * property is a published standard's, or one of bootstrap's own diagram
 * extensions; none is minted for this document:
 *
 * | fact | property | standard |
 * |---|---|---|
 * | a node's name | `rdfs:label` | RDF Schema 1.1 |
 * | title, description | `dcterms:title`, `dcterms:description` | DCMI Metadata Terms |
 * | node ⊂ process, flow ⊂ process, anything ⊂ subgraph, subgraph ⊂ graph | `dcterms:isPartOf` | DCMI |
 * | a subgraph's kinds; a process node's BPMN element | `dcterms:type` | DCMI |
 * | the file a node is | `dcterms:source` | DCMI |
 * | a flow's ends | `bpmn:sourceRef`, `bpmn:targetRef` | BPMN 2.0 |
 * | the nodes a role's lanes hold | `bpmn:flowNodeRef` | BPMN 2.0 |
 * | a task's skill, a lane's role | `processes:skill`, `processes:role` | bootstrap's diagram extensions |
 * | provenance | `prov:wasDerivedFrom`, `prov:generatedAtTime` | PROV-O |
 *
 * Harness-only facts about a node (enforcement, whether a step touches a work
 * plan, …) are the harness's to state, in the harness's export.
 *
 * ## Identifiers are the ones already linked to
 *
 * `#skill/<name>`, `#process/<id>`, `#process/<id>/node/<id>`,
 * `#process/<id>/flow/<id>`, `#role/<id>`, `#directory/<id>`, `#asset/<id>` —
 * unchanged, because cat-harness mints links into this document (a skill's
 * home) and a moved fragment is a broken link.
 *
 * ## Pure unless asked
 *
 * Built at publish time and not committed. `--provenance` adds the commit and
 * the build time; without it two builds of one tree are byte-identical, which
 * is what the tests rely on.
 *
 * ```sh
 * bun run bootstrap-tools/scripts/export-graph.ts --base-url <url> --out <file> [--provenance]
 * ```
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { readKnowledgeGraphDeclaration } from "../schemas/declaration.ts";
import { releaseIri, bootstrapRelease } from "../schemas/release-iri.ts";

const BPMN_MODEL = "http://www.omg.org/spec/BPMN/20100524/MODEL#";

/** One XML element, as far as a BPMN reader needs: name, attributes, children, text. */
export interface El {
  name: string;
  attrs: Record<string, string>;
  children: El[];
  text: string;
}

/**
 * A small XML reader for authored BPMN: elements, attributes, text. No
 * DTDs, no entities beyond the five predefined — the diagrams here have
 * neither, and bootstrap-tools may not depend on an XML package.
 */
export function parseXml(src: string): El {
  const root: El = { name: "#root", attrs: {}, children: [], text: "" };
  const stack: El[] = [root];
  const unescape = (t: string) =>
    t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  const body = src.replace(/<\?[\s\S]*?\?>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_m, t: string) => t.replace(/</g, "&lt;"));
  const re = /<(\/?)([\w.:-]+)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  for (const m of body.matchAll(re)) {
    const top = stack[stack.length - 1]!;
    if (m[5] !== undefined) {
      top.text += unescape(m[5]);
      continue;
    }
    const [, close, name, attrText, selfClose] = m;
    if (close) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of attrText!.matchAll(/([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]!] = unescape(a[2] ?? a[3] ?? "");
    const el: El = { name: name!, attrs, children: [], text: "" };
    top.children.push(el);
    if (!selfClose) stack.push(el);
  }
  return root;
}

const local = (name: string) => name.slice(name.indexOf(":") + 1);
const walk = (el: El, f: (e: El) => void) => {
  f(el);
  for (const c of el.children) walk(c, f);
};

/** BPMN element local names that are flow nodes (a process node), never a flow or a container. */
const FLOW_NODE = /^(task|userTask|serviceTask|scriptTask|manualTask|businessRuleTask|sendTask|receiveTask|callActivity|subProcess|startEvent|endEvent|intermediateCatchEvent|intermediateThrowEvent|boundaryEvent|exclusiveGateway|parallelGateway|inclusiveGateway|eventBasedGateway|complexGateway)$/;

/** The extension element `<prefix:skill …>` / `<prefix:role …>` inside an element, whatever the prefix. */
function extension(el: El, what: "skill" | "role"): El | undefined {
  let found: El | undefined;
  walk(el, (e) => {
    if (found === undefined && local(e.name) === what && e.name.includes(":") && !e.name.startsWith("bpmn")) found = e;
  });
  return found;
}

/** Its `ref`, when it names one. */
function extensionRef(el: El, what: "skill" | "role"): string | undefined {
  return extension(el, what)?.attrs["ref"];
}

/** Front matter `name`, `description`, and the first heading, of a markdown file. */
function markdownFacts(md: string): { name?: string; description?: string; heading?: string } {
  const fm = /^---\n([\s\S]*?)\n---/.exec(md)?.[1] ?? "";
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  const folded = /^description:\s*>-?\s*\n((?:[ \t]+.*\n?)+)/m.exec(fm)?.[1];
  const inline = /^description:\s*([^>\n].*)$/m.exec(fm)?.[1];
  const description = (folded ?? inline)?.replace(/\s+/g, " ").trim();
  const heading = /^#\s+(.+)$/m.exec(md.slice(fm.length))?.[1]?.trim();
  return { name, description, heading };
}

function filesIn(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...filesIn(p, ext));
    else if (e.name.endsWith(ext) && e.name !== "README.md") out.push(p);
  }
  return out.sort();
}

export interface ExportOptions {
  /** Where the document is published; its `@id`. */
  docIri: string;
  /** Add `prov:wasDerivedFrom` (the commit) and `prov:generatedAtTime`. */
  provenance?: boolean;
  /** Where the source files are browsed, for `dcterms:source`; relative paths when absent. */
  sourceBase?: string;
}

/** The Graph Kinds whose Subgraphs' contents this exporter reads. */
export const COLLECTED_KINDS: readonly string[] = ["skills", "scenarios", "processes"];

/** bootstrap's graph. `root` is a bootstrap checkout. */
export function exportGraph(root: string, opts: ExportOptions): Record<string, unknown> {
  const decl = readKnowledgeGraphDeclaration(root);
  if (!decl) throw new Error(`${root} carries no Knowledge Graph declaration`);
  const r = bootstrapRelease(root);
  const ns = releaseIri(r, "ns#", "agent");
  const processesNs = releaseIri(r, "processes/ns#", "agent");
  const doc = opts.docIri;
  const id = (kind: string, rest: string) => `${doc}#${kind}/${rest}`;
  const src = (rel: string) => (opts.sourceBase ? `${opts.sourceBase.replace(/\/?$/, "/")}${rel}` : rel);
  const nodes: Record<string, unknown>[] = [];
  const problems: string[] = [];

  const dirs = decl.directories ?? [];

  for (const d of dirs) {
    nodes.push({
      "@id": id("directory", d.id),
      "@type": "bootstrap:Subgraph",
      label: d.id,
      ...(d.title ? { title: d.title } : {}),
      ...(d.description ? { description: d.description } : {}),
      type: d.graphKinds.map((k) => `bootstrap:graphKind/${k}`),
      source: src(d.path),
      isPartOf: doc,
    });
  }
  for (const a of decl.assets ?? []) {
    nodes.push({
      "@id": id("asset", a.id),
      "@type": "bootstrap:Asset",
      label: a.id,
      ...(typeof a["title"] === "string" ? { title: a["title"] } : {}),
      ...(typeof a["description"] === "string" ? { description: a["description"] } : {}),
      source: src(a.src),
      isPartOf: doc,
    });
  }

  // Skills: every markdown file in a `skills` subgraph.
  for (const d of dirs.filter((x) => x.graphKinds.includes("skills"))) {
    for (const f of filesIn(join(root, d.path), ".md")) {
      const rel = relative(root, f);
      const m = markdownFacts(readFileSync(f, "utf-8"));
      const name = m.name ?? rel.replace(/^.*\//, "").replace(/\.md$/, "");
      nodes.push({
        "@id": id("skill", name),
        "@type": "bootstrap:Skill",
        label: name,
        ...(m.heading ? { title: m.heading } : {}),
        ...(m.description ? { description: m.description } : {}),
        source: src(rel),
        isPartOf: id("directory", d.id),
      });
    }
  }

  // Roles: `roles.json` in each `scenarios` subgraph.
  const roleIds = new Set<string>();
  const roleNodes = new Map<string, Record<string, unknown>>();
  for (const d of dirs.filter((x) => x.graphKinds.includes("scenarios"))) {
    const f = join(root, d.path, "roles.json");
    if (!existsSync(f)) continue;
    const roles = (JSON.parse(readFileSync(f, "utf-8")) as { roles?: { id: string; title: string; description?: string }[] }).roles ?? [];
    for (const role of roles) {
      roleIds.add(role.id);
      const n: Record<string, unknown> = {
        "@id": id("role", role.id),
        "@type": "bootstrap:Role",
        label: role.title,
        ...(role.description ? { description: role.description } : {}),
        source: src(relative(root, f)),
        isPartOf: id("directory", d.id),
      };
      roleNodes.set(role.id, n);
      nodes.push(n);
    }
  }

  // Processes, their nodes and flows.
  for (const d of dirs.filter((x) => x.graphKinds.includes("processes"))) {
    for (const f of filesIn(join(root, d.path), ".bpmn")) {
      const rel = relative(root, f);
      const xml = parseXml(readFileSync(f, "utf-8"));
      walk(xml, (p) => {
        if (local(p.name) !== "process" || !p.attrs["id"]) return;
        const pid = p.attrs["id"]!;
        const pIri = id("process", pid);
        nodes.push({
          "@id": pIri,
          "@type": "bootstrap:Process",
          label: p.attrs["name"] ?? pid,
          source: src(rel),
          isPartOf: id("directory", d.id),
        });
        const nodeIri = (nid: string) => `${pIri}/node/${nid}`;
        for (const c of p.children) {
          const kind = local(c.name);
          if (FLOW_NODE.test(kind) && c.attrs["id"]) {
            const skill = extensionRef(c, "skill");
            nodes.push({
              "@id": nodeIri(c.attrs["id"]),
              "@type": "bootstrap:ProcessNode",
              ...(c.attrs["name"] ? { label: c.attrs["name"] } : {}),
              type: `bpmn:${kind}`,
              isPartOf: pIri,
              ...(skill ? { skill: id("skill", skill) } : {}),
            });
          } else if (kind === "sequenceFlow" && c.attrs["id"]) {
            nodes.push({
              "@id": `${pIri}/flow/${c.attrs["id"]}`,
              "@type": "bootstrap:SequenceFlow",
              ...(c.attrs["name"] ? { label: c.attrs["name"] } : {}),
              sourceRef: nodeIri(c.attrs["sourceRef"] ?? ""),
              targetRef: nodeIri(c.attrs["targetRef"] ?? ""),
              isPartOf: pIri,
            });
          }
        }
        // Lanes: a lane binds a Role; the Role holds the lane's nodes.
        walk(p, (lane) => {
          if (local(lane.name) !== "lane") return;
          const role = extension(lane, "role");
          // `variable="true"`: the lane DECLARES that its performer is whoever
          // invoked the process — bootstrap's own diagram term, so not a gap.
          if (role?.attrs["variable"] === "true") return;
          const ref = role?.attrs["ref"];
          const held = lane.children.filter((c) => local(c.name) === "flowNodeRef").map((c) => nodeIri(c.text.trim()));
          if (!ref) {
            problems.push(`${rel}#${lane.attrs["id"] ?? "?"}: a lane that binds no Role`);
            return;
          }
          const n = roleNodes.get(ref);
          if (!n) {
            problems.push(`${rel}#${lane.attrs["id"] ?? "?"}: binds Role "${ref}", which roles.json does not declare`);
            return;
          }
          n["flowNodeRef"] = [...new Set([...((n["flowNodeRef"] as string[] | undefined) ?? []), ...held])].sort();
        });
      });
    }
  }

  // A Subgraph whose kinds none of the collectors above reads is declared (it
  // has its own node) but its contents are not: said, so "holds nothing" and
  // "nobody looked" are never the same empty answer.
  const omitted = dirs
    .filter((d) => !d.graphKinds.some((k) => COLLECTED_KINDS.includes(k)))
    .map((d) => d.id)
    .sort();

  const byType = new Map<string, number>();
  for (const n of nodes) byType.set(String(n["@type"]), (byType.get(String(n["@type"])) ?? 0) + 1);

  let prov: Record<string, unknown> = {};
  if (opts.provenance) {
    const git = (...a: string[]) => spawnSync("git", a, { cwd: root, encoding: "utf-8" });
    const sha = git("rev-parse", "HEAD");
    prov = {
      generatedAtTime: new Date().toISOString(),
      ...(sha.status === 0 ? { wasDerivedFrom: `git:${sha.stdout.trim()}` } : {}),
    };
  }

  return {
    "@context": {
      bootstrap: ns,
      processes: processesNs,
      bpmn: BPMN_MODEL,
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
      dcterms: "http://purl.org/dc/terms/",
      prov: "http://www.w3.org/ns/prov#",
      owl: "http://www.w3.org/2002/07/owl#",
      label: "rdfs:label",
      comment: "rdfs:comment",
      wasAttributedTo: { "@id": "prov:wasAttributedTo", "@type": "@id" },
      title: "dcterms:title",
      description: "dcterms:description",
      isPartOf: { "@id": "dcterms:isPartOf", "@type": "@id" },
      type: { "@id": "dcterms:type", "@type": "@id" },
      source: { "@id": "dcterms:source", "@type": "@id" },
      sourceRef: { "@id": "bpmn:sourceRef", "@type": "@id" },
      targetRef: { "@id": "bpmn:targetRef", "@type": "@id" },
      flowNodeRef: { "@id": "bpmn:flowNodeRef", "@type": "@id" },
      skill: { "@id": "processes:skill", "@type": "@id" },
      versionInfo: "owl:versionInfo",
      generatedAtTime: { "@id": "prov:generatedAtTime", "@type": "http://www.w3.org/2001/XMLSchema#dateTime" },
      wasDerivedFrom: { "@id": "prov:wasDerivedFrom", "@type": "@id" },
      // What the build saw, kept as opaque JSON literals (`@json`) rather than
      // left undeclared: a strict processor — `publish:verify`'s — rejects an
      // undeclared key as an "invalid property", and that failed every preview
      // build. The values are byte-for-byte what they were.
      omitted: { "@id": "bootstrap:buildOmitted", "@type": "@json" },
      counts: { "@id": "bootstrap:buildCounts", "@type": "@json" },
      problems: { "@id": "bootstrap:buildProblems", "@type": "@json" },
    },
    "@id": doc,
    "@type": ["bootstrap:KnowledgeGraph", "prov:Entity"],
    label: decl.name,
    // Said in the document itself, as every generated file of bootstrap's
    // says it (owner, 2026-09-30): generated, by what, and so not to be edited.
    comment: "Generated by bootstrap-tools (scripts/export-graph.ts) from bootstrap's own files — do not edit; change the files it describes.",
    wasAttributedTo: "https://github.com/litlfred/bootstrap-tools",
    ...(decl.title ? { title: decl.title } : {}),
    ...(decl.description ? { description: decl.description } : {}),
    versionInfo: decl.version ?? "",
    ...prov,
    // Sorted by `@id`, by code unit rather than locale, so directory order on
    // the machine that built it never reaches the file (bootstrap-graph-emission).
    "@graph": nodes.sort((a, b) => (String(a["@id"]) < String(b["@id"]) ? -1 : String(a["@id"]) > String(b["@id"]) ? 1 : 0)),
    // Not RDF facts about bootstrap, but what the build saw: counted, never
    // silently dropped. Declared in the context as `@json` literals, so an RDF
    // reader carries them as opaque values and a person or a check reads them.
    omitted,
    counts: Object.fromEntries([...byType].sort(([a], [b]) => a.localeCompare(b))),
    problems,
  };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const arg = (f: string) => {
    const i = args.indexOf(f);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const root = arg("--root") ?? join(import.meta.dir, "..", "..", "bootstrap");
  const out = arg("--out");
  const base = arg("--base-url");
  if (!out || !base) {
    console.error("usage: export-graph.ts --base-url <site url of bootstrap/> --out <file> [--root <bootstrap>] [--provenance] [--source-base <url>]");
    process.exit(2);
  }
  const doc = exportGraph(root, {
    docIri: `${base.replace(/\/?$/, "/")}bootstrap.jsonld`,
    provenance: args.includes("--provenance"),
    sourceBase: arg("--source-base"),
  });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  const problems = doc["problems"] as string[];
  console.log(`✓ ${out}: ${(doc["@graph"] as unknown[]).length} nodes ${JSON.stringify(doc["counts"])}`);
  for (const p of problems) console.log(`  · ${p}`);
}
