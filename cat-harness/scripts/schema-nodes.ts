/**
 * Which `schemas/*.ts` modules are knowledge-graph nodes, read from the files.
 *
 * ## The defect this exists for
 *
 * `harness.json` declares `schemas/` with `graphKinds: ["schemas", "kg"]`.
 * Measured on `814b693e`: the exported graph contained **zero** nodes of the
 * `schemas` kind — 11 node types, none of them a schema. A declaration a
 * consumer reads and finds nothing behind is the `dh4f` shape this repository
 * keeps naming, and it had reached the instance's own declaration.
 *
 * ## The declaration principle, applied to the odd one out
 *
 * A directory says what to EXPECT; the files declare what they ARE. Three of
 * the four graph kinds already hold that up — skills by YAML front matter,
 * beans by front matter, workflow instances by `"$schema"`. `schemas/*.ts`
 * declared nothing: `@module` names the file's own path, which a scanner
 * already knows, so it says WHERE and not WHAT. Bean `xxxb`.
 *
 * `@graphNode` is that missing declaration. It is a JSDoc tag rather than an
 * exported constant because it must cost nothing at runtime and be greppable
 * from outside the toolchain — a consumer reading the repository, not
 * importing it, has to be able to answer the question.
 *
 * ## Every file declares, including the ones that are not nodes
 *
 * `@graphNode none — <reason>` is a real value, and the reason is required.
 * Three modules carry it: `index.ts` (a re-export barrel), `builders.ts`
 * (constructor functions over other modules' schemas) and `namespaces.ts` (one
 * IRI constant).
 *
 * **An untagged file is `undeclared`, never a pass.** That is the whole point:
 * the alternative considered in `xxxb` was excluding `*.test.ts` by pattern,
 * which solves nothing — it restates a layout coincidence, the very thing
 * #263 named ("distinguishable by extension … a coincidence of the current
 * layout, not a contract"). A test file is excluded here because it declares
 * nothing AND is a test, and the gate says so in those terms.
 *
 * @module scripts/schema-nodes
 * @graphNode none — tooling that reads the declarations, not a schema itself
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { directoriesForGraph } from "../schemas/cat-harness.js";
// The `folio` graph kind is registered by CORE as a load-time side effect
// (`schemas/folio-graph-kind.ts`: "a layer that cannot render must not own the
// renderable kind"), so the harness alone does not know it exists. This module
// reads instance declarations, and this instance now DECLARES a folio graph, so
// without this import `readDeclaration` throws `unknown graph kind "folio"` on a
// declaration that is perfectly valid. Twelve tests and three gates failed that
// way the first time a folio graph was declared here (issue #464) — nothing had
// ever declared one before, so nothing had ever needed the registration to have
// happened. Same import `scripts/kg-export.ts` and
// `scripts/check-avatar-coverage.ts` already carry, and for the same reason.
import "../schemas/folio-graph-kind.js";

/**
 * EVERY directory declaring the `schemas` graph, or the convention.
 *
 * It was `directoriesForGraph(...)[0]` — the FIRST one — until 2026-09-20, and by
 * then three directories declared the graph: `schemas/`,
 * `folio-assistant-core/schemas/` and `large-datasets/schemas/`. So the gate
 * that exists to stop a module being silently absent from the published graph
 * was itself silently absent from two thirds of it. Bean `xxxb` is the defect
 * this file was written for; this is that defect, in this file, one directory
 * over.
 *
 * declared-path-literal: the fallback is at the call site so the choice is
 * visible. `schemas/` declares TWO graphs — it is a knowledge-graph node AND
 * the schema definitions — which is why the accessor is asked for the
 * `schemas` one by name rather than being handed a single-home guess.
 */
function schemasRoots(root: string): string[] {
  const declared = directoriesForGraph(root, "schemas");
  return declared.length > 0 ? declared : [join(root, "schemas")];
}

/** What a `schemas/*.ts` module declares itself to be. */
export type SchemaNodeKind = "schema" | "none" | "undeclared";

export interface SchemaModule {
  /** Repo-relative path, e.g. `schemas/tool.ts`. */
  module: string;
  /** Bare stem, the identifier a node IRI is minted from. */
  name: string;
  kind: SchemaNodeKind;
  /** The reason given after `none —`, when one is. */
  reason?: string;
  /** First prose line of the leading docblock, for the node's title. */
  summary?: string;
  /** True for `*.test.ts`: in the directory, not of the graph. */
  isTest: boolean;
}

const TAG = /@graphNode\s+(\S+)(?:\s*[—-]\s*(.*))?/;

/**
 * Read every `.ts` under `schemas/` and what it says it is.
 *
 * Reads only the FIRST docblock. A `@graphNode` deeper in the file is a
 * mention, not a declaration — a module documenting the convention must not
 * thereby declare itself.
 */
export function schemaModules(root: string): SchemaModule[] {
  const out: SchemaModule[] = [];
  for (const dir of schemasRoots(root)) {
    if (!existsSync(dir)) continue;
    // The module id carries the DIRECTORY, not a bare `schemas/` prefix: three
    // directories declare this graph and two of them hold a `catalogue.ts` or an
    // `index.ts`, so a flat `schemas/<stem>` id would collide across instances
    // and the audit would report one module while another went unchecked. Same
    // reason `kgQaSidecarPath` mirrors each subject's path instead of flattening.
    const prefix = relative(root, dir).split(sep).join("/");
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith(".ts")) continue;
      const module = `${prefix}/${f}`;
      const isTest = f.endsWith(".test.ts");
      const text = readFileSync(join(dir, f), "utf-8");
      const block = /^\/\*\*[\s\S]*?^ \*\//m.exec(text)?.[0] ?? "";
      const m = TAG.exec(block);
      const name = basename(f, ".ts");
      if (!m) {
        out.push({ module, name, kind: "undeclared", isTest });
        continue;
      }
      const value =
        m[1] === "none" ? "none" : m[1] === "schema" ? "schema" : "undeclared";
      // The first prose line: skip the opening `/**` and any leading tag lines.
      const summary = block
        .split("\n")
        .slice(1)
        .map((l) => l.replace(/^\s*\*\s?/, "").trim())
        .find((l) => l.length > 0 && !l.startsWith("@"));
      out.push({
        module,
        name,
        kind: value as SchemaNodeKind,
        reason: m[2]?.trim() || undefined,
        summary,
        isTest,
      });
    }
  }
  return out;
}

/** Just the modules that declare themselves schema nodes. */
export function schemaNodes(root: string): SchemaModule[] {
  return schemaModules(root).filter((m) => m.kind === "schema");
}

/** What a gate should report. Three states, and the third is never a pass. */
export interface SchemaNodeAudit {
  nodes: SchemaModule[];
  /** Declared `none`, with a reason. Deliberately not nodes. */
  exempt: SchemaModule[];
  /**
   * In the declared directory and saying nothing about itself.
   *
   * Reported separately for tests, because "a test file has no declaration" is
   * an expected shape with a different remedy from "somebody added a schema and
   * did not declare it".
   */
  undeclared: SchemaModule[];
  undeclaredTests: SchemaModule[];
  /** `@graphNode none` with no reason. Silencing must cost more than declaring. */
  reasonless: SchemaModule[];
}

export function auditSchemaNodes(root: string): SchemaNodeAudit {
  const all = schemaModules(root);
  return {
    nodes: all.filter((m) => m.kind === "schema"),
    exempt: all.filter((m) => m.kind === "none" && m.reason),
    undeclared: all.filter((m) => m.kind === "undeclared" && !m.isTest),
    undeclaredTests: all.filter((m) => m.kind === "undeclared" && m.isTest),
    reasonless: all.filter((m) => m.kind === "none" && !m.reason),
  };
}
