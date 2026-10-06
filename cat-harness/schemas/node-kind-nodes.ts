/**
 * The NODES of a node kind, found where its typologies say they are — issue
 * #2195, PR 2.
 *
 * @module cat-harness/schemas/node-kind-nodes
 * @graphNode none — a reader over declared directories; it defines no schema
 *
 * A kind's page lists its own nodes and its subclasses' (owner, 2026-10-05:
 * *"i want to see node that subclass a given node kind"*). Where to look is
 * already declared twice over: the node-kind index says which typologies hold
 * each kind, and each instance's `<instance>.json` says which of its
 * directories have that typology. This joins the two and reads the files.
 *
 * A file belongs to a kind when the kind ACCEPTS its `$schema` — same name,
 * same major, no newer minor (`acceptsSchemaTag`) — so a node written under an
 * earlier minor still appears. JSON nodes carry the tag as `$schema`; Markdown
 * nodes (todos) carry it in their front matter.
 *
 * Each node is filed under the HARNESS that holds it — the instance whose
 * declaration names the directory — with a path relative to that instance's
 * root and without its extension. That path is the node's stable address:
 * `<declaring>/<kind>/<harness>/<path>`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { directoryEntriesForGraph, readDeclaration } from "./cat-harness.js";
import { parse as parseYaml } from "yaml";
import { instanceRootsIn } from "./instance-roots.js";
import { kindAndSubclasses, type NodeKindIndex } from "./node-kind-index.js";
import { acceptsSchemaTag } from "./node-kind.js";

export interface KindNode {
  /** The kind the node IS — the kind asked for, or one of its subclasses. */
  kind: string;
  /** The instance that holds it. */
  harness: string;
  /** Relative to that instance's root, extension dropped: the node's address. */
  path: string;
  /** Repo-relative, for a reader who wants the source. */
  file: string;
  /** The parsed node: a JSON object, or a Markdown file's front matter. */
  node: Record<string, unknown>;
}

function* files(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return; // a declared-but-absent directory is `check:declared-dirs`'s finding
  }
  for (const e of entries.sort()) {
    if (e.startsWith(".") || e === "node_modules") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (e.endsWith(".json") || e.endsWith(".md")) yield p;
  }
}

/** The node a file holds, or undefined when it is not a node at all. */
export function readNode(file: string): Record<string, unknown> | undefined {
  try {
    const text = readFileSync(file, "utf-8");
    if (file.endsWith(".md")) {
      // Real YAML, not the line-based `parseFrontMatter`: a todo's
      // `references` and `artefacts` are lists of objects, which that reader
      // flattens into strings, and a node page would then show data that
      // is not in the file.
      const m = /^---\n([\s\S]*?)\n---/.exec(text);
      const fm = m ? (parseYaml(m[1]!) as unknown) : undefined;
      return fm && typeof fm === "object" && !Array.isArray(fm) && typeof (fm as { $schema?: unknown }).$schema === "string"
        ? (fm as Record<string, unknown>)
        : undefined;
    }
    const v = JSON.parse(text) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/** Every node of `kindId` and its subclasses in the checkout at `repoRoot`, sorted by harness then path. */
export function nodesOfKind(index: Pick<NodeKindIndex, "kinds">, kindId: string, repoRoot: string): KindNode[] {
  const byId = new Map(index.kinds.map((k) => [k.id, k]));
  const kinds = kindAndSubclasses(index, kindId).map((id) => byId.get(id)!).filter((k) => k?.version);
  const typologies = [...new Set(kinds.flatMap((k) => k.holdings.map((h) => h.typology)))];
  const out = new Map<string, KindNode>();
  for (const root of instanceRootsIn(repoRoot)) {
    const harness = readDeclaration(root)?.name;
    if (!harness) continue;
    for (const typology of typologies) {
      // Nested declarations included (`todos/todos.json` declares `items/`):
      // the resolver `check:kind-validators` uses, so the two agree.
      for (const { absPath } of directoryEntriesForGraph(root, typology)) {
        for (const file of files(absPath)) {
          if (out.has(file)) continue;
          const node = readNode(file);
          const kind = node && kinds.find((k) => acceptsSchemaTag(k, node.$schema));
          if (!node || !kind) continue;
          out.set(file, {
            kind: kind.id,
            harness,
            path: relative(root, file).replace(/\.(json|md)$/, "").split("\\").join("/"),
            file: relative(repoRoot, file).split("\\").join("/"),
            node,
          });
        }
      }
    }
  }
  return [...out.values()].sort((a, b) => a.harness.localeCompare(b.harness) || a.path.localeCompare(b.path));
}

/**
 * Every directory `nodesOfKind` can read for ANY kind on the index: each
 * instance's directories of a typology that holds a versioned kind. Absolute.
 * What a page generator over the index reads (bean `ehh6`), so a changed file
 * outside all of them cannot change one of its pages.
 */
export function kindDirectories(index: Pick<NodeKindIndex, "kinds">, repoRoot: string): string[] {
  const typologies = [...new Set(index.kinds.filter((k) => k.version).flatMap((k) => k.holdings.map((h) => h.typology)))];
  const out = new Set<string>();
  for (const root of instanceRootsIn(repoRoot)) {
    if (!readDeclaration(root)?.name) continue;
    for (const typology of typologies) for (const { absPath } of directoryEntriesForGraph(root, typology)) out.add(absPath);
  }
  return [...out].sort();
}
