#!/usr/bin/env bun
/**
 * Read `schemas/*.ts` as a graph of declarations and the edges between them.
 *
 * @module scripts/schema-graph
 * @graphNode none — a reader over the schema graph, not a schema itself
 *
 * ## Why this exists
 *
 * `schemas/` is a declared graph kind holding **content** (`BASE_GRAPH_KINDS`:
 * *"a shape is the subject matter of the schema graph"*), and it is
 * `renderable: false` — so 100 modules carrying 199 exported schemas had no
 * way to be looked at. Bean `xgd8`.
 *
 * Three generators were written for this before and none was wired:
 * `generate-schemas.ts` (18 of 199 schemas, output directory absent),
 * `generate-schema-manifest.ts` (input paths stale) and
 * `schemas/assistant-schema.puml` (266 lines of hand-authored UML referenced
 * by nothing). This module is the reader half of the fourth attempt, and the
 * thing that makes it different is that the projection built from it is gated
 * — see `gen-schema-viz.ts`.
 *
 * ## Why the AST and not the type checker, and not the published JSON Schema
 *
 * Both obvious alternatives **erase the edges a class diagram is made of**,
 * and it is the same erasure twice at different levels:
 *
 * - **The published JSON Schema.** `harness-schema-export.ts` renders with
 *   `$refStrategy: "none"`, which is right for a dereferenceable document — a
 *   consumer following an `$id` gets something self-contained. Measured
 *   2026-09-20: `folio-assistant.schema.json` is 5179 bytes and contains **one**
 *   `$ref`. `ContentDirectory` is not a named thing in it; it is an anonymous
 *   object repeated at each use site. A diagram drawn from that document is
 *   100 disconnected boxes.
 *
 * - **The TypeScript type checker.** `z.infer<typeof FooSchema>` resolves to a
 *   deeply expanded structural type, so asking the checker what `Foo.bar` is
 *   returns the whole of `Bar` inlined rather than a reference to it. Same
 *   erasure, one level up, and slower.
 *
 * So the **syntactic** form is not a compromise here, it is the only one of
 * the three that still holds `bar: BarSchema` as a reference to a named thing.
 * That is the edge. Everything else is a property of a box.
 *
 * `typescript` is already a direct dependency, so this adds nothing to the
 * dependency surface — which is what lets the viewer built over it keep
 * `kg-viewer.ts`'s rule of no CDN and no third party on a page rendering this
 * repository's own data.
 *
 * ## Resolution is syntactic, and says so
 *
 * A referenced name is resolved in this order: an export of the same module,
 * then through that module's import map to the exporting module. There is no
 * type checker behind it, so a name that is neither is recorded in
 * {@link SchemaDecl.unresolved} rather than dropped. An unresolved reference
 * is a real finding — it usually means the target is a type from outside the
 * schema graph — and a reader that silently omitted it would render a box with
 * fewer edges than the source has, which is indistinguishable from a type that
 * genuinely references nothing.
 *
 * ## Three states, and `undetermined` is never a pass
 *
 * A Zod expression this walker does not recognise yields
 * `kind: "undetermined"` **with the head of the expression recorded in
 * `note`** — never an empty object that renders as a type with no fields. The
 * repository's rule throughout (`check-ci-health`, `check-instance-render`,
 * `beans.ts`) is that "could not determine" and "there is nothing" are
 * different answers, and rendering them alike reports a clean run over
 * something never looked at. `z.lazy`, a 16-member union and the registry
 * pattern in `cat-harness.ts` are the real cases, so this is not hypothetical.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";

import ts from "typescript";

import { directoriesForGraph, repoRootFor } from "../schemas/cat-harness.js";

/**
 * EVERY declared `schemas` directory reachable from this root.
 *
 * ## Why plural, and why the singular version was a bug waiting for main
 *
 * The first version asked `directoryForGraph(root, "schemas")` for THE
 * directory. That call throws by design when more than one directory declares
 * a graph — the `wggr` guard, which exists because returning the first
 * silently once resolved `cat-harness` to `schemas/` and wrote 37 sidecars
 * against the wrong subjects on a run that exited 0.
 *
 * It threw the moment this branch met main. Four instances declare a
 * `schemas` graph now — `schemas/`, `folio-assistant-core/schemas/`,
 * `large-datasets/schemas/` and `detangle/schemas/` — so the singular question
 * has no answer, and the guard said so rather than picking one. **The right
 * fix is not to pick one.** The schema graph genuinely spans instances, a
 * viewer that showed one of four would report a corpus that does not exist,
 * and every id here is already repo-relative so four directories cannot
 * collide.
 *
 * declared-path-literal: the fallback is at the call site so the choice is
 * visible. It applies only when NOTHING declares the graph — an unmigrated
 * instance — and an absent conventional directory yields `[]` rather than a
 * path nothing is at.
 */
export function schemaRoots(root: string): string[] {
  const declared = directoriesForGraph(root, "schemas");
  if (declared.length > 0) return [...declared].sort();
  const conventional = join(root, "schemas");
  return existsSync(conventional) ? [conventional] : [];
}

/**
 * What a declaration IS, as far as the syntax says.
 *
 * `undetermined` is a real member rather than an absence. See the module note.
 */
export type DeclKind =
  | "zod-object"
  | "zod-union"
  | "zod-enum"
  | "zod-array"
  | "zod-record"
  | "zod-scalar"
  | "interface"
  | "type-alias"
  | "undetermined";

/** One field of an object-like declaration. */
export interface SchemaField {
  name: string;
  /** The field's expression as written, collapsed to one line. */
  type: string;
  optional: boolean;
  /** `true` when the field is a list of its target. */
  array: boolean;
  /** Names this field mentions, before resolution. */
  names: string[];
  /** First line of the field's own doc comment, when it has one. */
  doc?: string;
  /**
   * The first prose PARAGRAPH of the field's doc comment, its lines joined by
   * one space: everything up to the first blank line or tag line.
   *
   * `doc` is the first LINE, which is right for a detail panel and wrong for
   * a definition: measured 2026-09-24, 177 of 1,515 documented fields break
   * their first sentence across lines, so `doc` ends mid-clause ("OPTIONAL
   * because folio"). The glossary's extracted schema-field terms (bean `lqo9`)
   * read this instead. Not carried into the published projection.
   */
  paragraph?: string;
  /**
   * The declaration this field's STRING ID points at, when the field declares
   * one with `@ref <Name>`.
   *
   * This exists because the reader is syntactic and a foreign key carried as
   * `z.string()` holds no link to the schema it names — measured against
   * `assistant-schema.puml`, 0 of 9 id-associations were reproduced while 14
   * of 15 compositions were. That is not a gap a better reader closes: the
   * information is not in the source. So it is DECLARED, in the one place
   * that cannot drift from the field, and the diagram draws what the author
   * said rather than what a heuristic guessed.
   */
  ref?: string;
}

/** One declaration — a Zod schema, an interface or a type alias. */
export interface SchemaDecl {
  /** `<module>#<name>`, unique across the graph. */
  id: string;
  name: string;
  /** Repo-relative module path. */
  module: string;
  kind: DeclKind;
  /** For `undetermined`: the head of what was seen. Never omitted silently. */
  note?: string;
  /** First prose line of the declaration's doc comment. */
  doc?: string;
  fields: SchemaField[];
  /**
   * Names this declaration extends or merges — the generalisation arrow.
   *
   * Populated for Zod (`.extend`, `.merge`, `.and`, and a bare base at the
   * head of the chain) and for an interface's heritage clauses. It is a
   * separate field from {@link SchemaDecl.values} because an extension is an
   * EDGE and a literal member is a property of the box, and the first version
   * of this reader carried both in `values`, which made a diagram unable to
   * tell them apart.
   */
  extendsNames: string[];
  /** Literal members of an enum or a union of literals. */
  values: string[];
  /** Declaration ids this one references, resolved. */
  refs: string[];
  /**
   * Names bound in this module that resolved to no declaration in the graph.
   *
   * A real finding: usually a type imported from outside `schemas/`. Distinct
   * from {@link SchemaDecl.external}, which is bound to a non-relative import
   * and was never a candidate.
   */
  unresolved: string[];
  /**
   * Names bound to a NON-RELATIVE import — `z` from `zod`, `ts` from
   * `typescript`.
   *
   * Recorded rather than dropped, because the rule throughout this reader is
   * that nothing disappears silently. But they are not unresolved references:
   * they resolved perfectly well, to a module outside the schema graph, and
   * listing them beside genuine misses would bury the misses. Measured before
   * this split existed: `z` alone accounted for **151** of the 150 distinct
   * "unresolved" names — the single noisiest entry in a list whose whole
   * purpose is to be read.
   */
  external: string[];
  /** 1-indexed line in its module, for a deep link. */
  line: number;
  /** `true` when the declaration is exported. */
  exported: boolean;
}

/** A resolved reference from one declaration to another. */
export interface SchemaEdge {
  from: string;
  to: string;
  /** The field it goes through, or `""` for a union member or an extension. */
  via: string;
  /**
   * `id-ref` is an association DECLARED by `@ref`, not one the reader found:
   * the field is a string and the target is typically not even imported. Kept
   * distinct from `field` so a consumer can tell a reference the source proves
   * from one an author asserted.
   */
  kind: "field" | "member" | "extends" | "id-ref";
  optional: boolean;
  array: boolean;
}

/** One module of the schema graph. */
export interface SchemaGraphModule {
  /** Repo-relative path. */
  module: string;
  /**
   * The instance whose `schemas/` directory this is.
   *
   * Four instances declare one now, and a viewer that merged them would
   * report a corpus that does not exist — the same per-instance rule the
   * uploads queues follow.
   */
  instance: string;
  /** Bare stem — the identifier a node IRI is minted from. */
  name: string;
  /** From the module's own `@graphNode` tag. */
  graphNode: "schema" | "none" | "undeclared";
  /** The reason given after `none —`, when one is. */
  reason?: string;
  /** First prose line of the leading docblock. */
  summary?: string;
  isTest: boolean;
  /** Declaration ids in this module. */
  decls: string[];
}

/** The whole reading. */
export interface SchemaGraph {
  /** Repo-relative paths of every directory read. */
  roots: string[];
  modules: SchemaGraphModule[];
  decls: SchemaDecl[];
  edges: SchemaEdge[];
  /**
   * Every `@ref` that named nothing, or named several things.
   *
   * Reported rather than dropped, for the reason every other state here is:
   * a tag the graph could not honour and a field with no tag at all are
   * different answers, and rendering them alike reports a clean run over a
   * broken assertion.
   */
  refProblems: string[];
}

const TAG = /@graphNode\s+(\S+)(?:\s*[—-]\s*(.*))?/;

/**
 * The first prose line of a JSDoc block, skipping tag lines.
 *
 * The opening `/**` and closing marker are stripped BEFORE splitting rather
 * than by dropping the first line. Dropping line 1 works for a multi-line
 * block and silently returns nothing for a one-liner — `/** A thing. *\/` is
 * a single line, so its only content was the line being discarded. Caught by
 * the reader's own test, which is the case a corpus-wide count would have
 * hidden: most docblocks here are long, so the miss shows up as "a few
 * declarations have no summary" rather than as a defect.
 */
function firstProse(block: string): string | undefined {
  return block
    .replace(/^\/\*\*+/, "")
    .replace(/\*+\/\s*$/, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*+\s?/, "").trim())
    .find((l) => l.length > 0 && !l.startsWith("@"));
}

/** The first prose paragraph of a JSDoc block: {@link firstProse}'s line and the lines that continue it. */
function firstParagraph(block: string): string | undefined {
  const lines = block
    .replace(/^\/\*\*+/, "")
    .replace(/\*+\/\s*$/, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*+\s?/, "").trim());
  const start = lines.findIndex((l) => l.length > 0 && !l.startsWith("@"));
  if (start < 0) return undefined;
  const out: string[] = [];
  for (const l of lines.slice(start)) {
    if (l.length === 0 || l.startsWith("@")) break;
    out.push(l);
  }
  return out.join(" ");
}

/** The first prose paragraph of the JSDoc block immediately above a node. */
function paragraphOf(node: ts.Node, text: string): string | undefined {
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart());
  const last = ranges?.[ranges.length - 1];
  if (!last) return undefined;
  const raw = text.slice(last.pos, last.end);
  return raw.startsWith("/**") ? firstParagraph(raw) : undefined;
}

/**
 * The `@ref <Name>` a field declares, if any.
 *
 * Read from the RAW block rather than from `doc`, because `firstProse` skips
 * every `@`-line on purpose — the prose summary and the machine-readable tag
 * are different things and neither should swallow the other.
 */
function refTagOf(node: ts.Node, text: string): string | undefined {
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart());
  const last = ranges?.[ranges.length - 1];
  if (!last) return undefined;
  const raw = text.slice(last.pos, last.end);
  if (!raw.startsWith("/**")) return undefined;
  const m = /@ref\s+([A-Za-z_$][\w$]*)/.exec(raw);
  return m?.[1];
}

/** The JSDoc block immediately above a node, as source text. */
function docOf(node: ts.Node, text: string): string | undefined {
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart());
  if (!ranges) return undefined;
  const last = ranges[ranges.length - 1];
  if (!last) return undefined;
  const raw = text.slice(last.pos, last.end);
  return raw.startsWith("/**") ? firstProse(raw) : undefined;
}

/**
 * Every identifier mentioned in an expression or type node.
 *
 * Deliberately over-collects: `z`, `string` and other noise come back too, and
 * are discarded at resolution time by failing to resolve. Filtering here would
 * need a list of things to ignore, and a list is a second place for the schema
 * graph's vocabulary to be wrong.
 */
function namesIn(node: ts.Node): string[] {
  const out: string[] = [];
  const walk = (n: ts.Node): void => {
    if (ts.isIdentifier(n)) out.push(n.text);
    // A property access — `z.string`, `Foo.Bar` — contributes only its head,
    // because the tail is a member name and never a declaration in this graph.
    else if (ts.isPropertyAccessExpression(n)) walk(n.expression);
    else n.forEachChild(walk);
  };
  node.forEachChild(walk);
  if (ts.isIdentifier(node)) out.push(node.text);
  return [...new Set(out)];
}

/** One line, collapsed, truncated — enough to read in a table cell. */
function oneLine(s: string, max = 120): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * The chain of Zod calls on an expression, outermost first.
 *
 * `z.string().optional()` gives `["optional", "string"]`. Used to detect
 * optionality and arrays without caring what sits underneath them.
 */
function callChain(node: ts.Expression): string[] {
  const out: string[] = [];
  let cur: ts.Expression = node;
  for (;;) {
    if (ts.isCallExpression(cur)) {
      const c: ts.Expression = cur.expression;
      if (ts.isPropertyAccessExpression(c)) {
        out.push(c.name.text);
        cur = c.expression;
        continue;
      }
      cur = c;
      continue;
    }
    if (ts.isPropertyAccessExpression(cur)) {
      out.push(cur.name.text);
      cur = cur.expression;
      continue;
    }
    break;
  }
  return out;
}

/**
 * What a Zod expression is, read by walking its call chain.
 *
 * ## Why `.extend()` is handled explicitly, and what it cost not to
 *
 * The first version of this walker looked for a `z.object({…})` at the head
 * and classified everything else `undetermined`. Measured over this
 * repository: **31 declarations** came back undetermined and nearly all of
 * them were `BaseSchema.extend({…})` — which is not an unrecognisable shape,
 * it is THE inheritance relation in this corpus. `BlockBaseSchema` is extended
 * by every block kind; `ProvableBaseSchema` by every provable one. So the
 * walker was discarding precisely the generalisation arrow a class diagram is
 * drawn to show, and reporting it as "could not determine" — which is honest
 * about the failure and useless as a diagram.
 *
 * Handled here: `object` / `strictObject` / `looseObject` contribute fields;
 * `extend` contributes fields AND an extension; `merge` and `and` contribute
 * an extension; `lazy` contributes a reference through its thunk. Anything
 * else still lands in `undetermined` WITH the head of the expression, because
 * the point of that state is that it names what it saw.
 */
interface ZodReading {
  kind: DeclKind;
  note?: string;
  fields: SchemaField[];
  /** Names this declaration extends or merges — the generalisation arrow. */
  extendsNames: string[];
}

/** Fields of a `z.object({...})`-shaped literal. */
function zodFields(lit: ts.ObjectLiteralExpression, text: string): SchemaField[] {
  const out: SchemaField[] = [];
  for (const p of lit.properties) {
    if (!ts.isPropertyAssignment(p)) continue;
    const name = ts.isIdentifier(p.name)
      ? p.name.text
      : ts.isStringLiteral(p.name)
        ? p.name.text
        : undefined;
    if (name === undefined) continue;
    const chain = callChain(p.initializer);
    out.push({
      name,
      type: oneLine(p.initializer.getText()),
      optional: chain.includes("optional") || chain.includes("nullish") || chain.includes("default"),
      array: chain.includes("array"),
      names: namesIn(p.initializer),
      doc: docOf(p, text),
      paragraph: paragraphOf(p, text),
      ref: refTagOf(p, text),
    });
  }
  return out;
}

/** String-literal members of a `z.enum([...])` or a union of literals. */
function literalValues(node: ts.Expression): string[] {
  const out: string[] = [];
  const walk = (n: ts.Node): void => {
    if (ts.isStringLiteral(n)) out.push(n.text);
    else n.forEachChild(walk);
  };
  walk(node);
  return [...new Set(out)];
}

/** Read a Zod expression: its kind, its fields and what it extends. */
function readZod(node: ts.Expression, text: string): ZodReading {
  const fields: SchemaField[] = [];
  const extendsNames: string[] = [];
  const ops: string[] = [];
  let sawObject = false;

  /** Walk the chain from outermost call inward, collecting what each op means. */
  let cur: ts.Expression = node;
  for (;;) {
    if (ts.isCallExpression(cur)) {
      const callee = cur.expression;
      const op = ts.isPropertyAccessExpression(callee) ? callee.name.text : undefined;
      if (op) ops.push(op);
      const args = cur.arguments;
      if (op === "object" || op === "strictObject" || op === "looseObject" || op === "extend") {
        const a = args[0];
        if (a && ts.isObjectLiteralExpression(a)) {
          sawObject = true;
          // Outermost wins on a name collision: `.extend({a})` over
          // `object({a})` is a narrowing, and the narrowed one is the truth.
          for (const f of zodFields(a, text)) {
            if (!fields.some((g) => g.name === f.name)) fields.push(f);
          }
        }
      }
      if (op === "merge" || op === "and") {
        for (const a of args) if (ts.isIdentifier(a)) extendsNames.push(a.text);
      }
      cur = ts.isPropertyAccessExpression(callee) ? callee.expression : callee;
      continue;
    }
    if (ts.isPropertyAccessExpression(cur)) {
      cur = cur.expression;
      continue;
    }
    break;
  }

  // The base of the chain. `BlockBaseSchema.extend({…})` bottoms out at the
  // identifier `BlockBaseSchema`, and that is the generalisation. `z.object(…)`
  // bottoms out at `z`, which is the namespace and never a declaration — it is
  // discarded at resolution time by not being bound to a relative import.
  if (ts.isIdentifier(cur) && cur.text !== "z") extendsNames.push(cur.text);

  if (sawObject || extendsNames.length > 0) {
    return { kind: "zod-object", fields, extendsNames };
  }
  if (ops.includes("enum") || ops.includes("nativeEnum")) {
    return { kind: "zod-enum", fields, extendsNames };
  }
  if (ops.includes("union") || ops.includes("discriminatedUnion")) {
    return { kind: "zod-union", fields, extendsNames };
  }
  if (ops.includes("array")) return { kind: "zod-array", fields, extendsNames };
  if (ops.includes("record") || ops.includes("map")) {
    return { kind: "zod-record", fields, extendsNames };
  }
  for (const scalar of ["string", "number", "boolean", "literal", "date", "bigint", "lazy"]) {
    if (ops.includes(scalar)) return { kind: "zod-scalar", fields, extendsNames };
  }
  // The honest answer, and it names what it saw. A reader that returned
  // `zod-object` with no fields here would render these as types that
  // reference nothing, which is the one thing a schema viewer must not do.
  return { kind: "undetermined", note: oneLine(node.getText(), 160), fields, extendsNames };
}

/** Members of an interface or an object type literal. */
function typeMembers(members: ts.NodeArray<ts.TypeElement>, text: string): SchemaField[] {
  const out: SchemaField[] = [];
  for (const m of members) {
    if (!ts.isPropertySignature(m) || !m.type) continue;
    const name = ts.isIdentifier(m.name)
      ? m.name.text
      : ts.isStringLiteral(m.name)
        ? m.name.text
        : undefined;
    if (name === undefined) continue;
    out.push({
      name,
      type: oneLine(m.type.getText()),
      optional: m.questionToken !== undefined,
      array: ts.isArrayTypeNode(m.type),
      names: namesIn(m.type),
      doc: docOf(m, text),
      paragraph: paragraphOf(m, text),
      ref: refTagOf(m, text),
    });
  }
  return out;
}

/** `./foo.js`, `./foo.ts`, `../schemas/foo` → `foo`; anything else → `null`. */
function moduleStemOf(specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  return basename(specifier).replace(/\.(ts|js|mts|mjs)$/, "");
}

/**
 * Every name BOUND in a module, and where it came from.
 *
 * The value is the exporting module's stem for a relative import, and `null`
 * for a non-relative one (`z` from `zod`) or for a name declared here.
 *
 * ## Why this replaced a plain import map, and why it is not a deny-list
 *
 * The first version collected every identifier mentioned in an expression and
 * tried to resolve each one. Measured: the top "unresolved reference" in the
 * whole graph was **`z`**, at 151 occurrences — the Zod namespace object,
 * mentioned in every schema and a declaration in none. `Record`, `Array`,
 * `Set` and a tail of lowercase noise followed it.
 *
 * The tempting fix is a list of names to ignore. That is a second, drifting
 * statement of the schema graph's vocabulary, and this repository has paid for
 * that shape before. The fix here needs no list: **a name is a candidate
 * reference only if the module BINDS it** — declares it, or imports it. `z`
 * is bound, to `zod`, which is not a relative import and therefore not part of
 * this graph; `Record` and `Array` are globals and bound by nothing. Both fall
 * out of the candidate set for a reason the module itself states, rather than
 * because somebody remembered to list them.
 */
function bindingsOf(src: ts.SourceFile): Map<string, string | null> {
  const out = new Map<string, string | null>();
  for (const st of src.statements) {
    if (ts.isImportDeclaration(st) && st.importClause && ts.isStringLiteral(st.moduleSpecifier)) {
      // `""` marks a NON-RELATIVE import — bound, and bound outside this
      // graph. `null` marks a name declared in this module. Keeping them apart
      // is what lets `z` (bound to `zod`) be reported as external rather than
      // as the graph's most-referenced missing declaration.
      const stem = moduleStemOf(st.moduleSpecifier.text) ?? "";
      const named = st.importClause.namedBindings;
      if (named && ts.isNamedImports(named)) {
        for (const el of named.elements) out.set(el.name.text, stem);
      }
      if (named && ts.isNamespaceImport(named)) out.set(named.name.text, stem);
      if (st.importClause.name) out.set(st.importClause.name.text, stem);
      continue;
    }
    // Locally declared names bind too — a schema referring to another in the
    // same file never goes through an import.
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) out.set(d.name.text, null);
      }
      continue;
    }
    if (
      (ts.isInterfaceDeclaration(st) ||
        ts.isTypeAliasDeclaration(st) ||
        ts.isFunctionDeclaration(st) ||
        ts.isClassDeclaration(st) ||
        ts.isEnumDeclaration(st)) &&
      st.name
    ) {
      out.set(st.name.text, null);
    }
  }
  return out;
}

/** Read one module's declarations. */
function readModule(
  file: string,
  moduleRel: string,
  text: string,
): { decls: SchemaDecl[]; bindings: Map<string, string | null> } {
  const src = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  const stem = basename(moduleRel).replace(/\.ts$/, "");
  const decls: SchemaDecl[] = [];
  const lineOf = (n: ts.Node): number =>
    src.getLineAndCharacterOfPosition(n.getStart(src)).line + 1;
  const isExported = (n: ts.Node): boolean =>
    ts.canHaveModifiers(n) &&
    (ts.getModifiers(n) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

  for (const st of src.statements) {
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !d.initializer) continue;
        // Only Zod expressions. A plain constant is not a shape, and treating
        // every exported const as a declaration would bury 199 schemas among
        // path literals and regexes.
        const names = namesIn(d.initializer);
        const chain = callChain(d.initializer);
        const looksZod = names.includes("z") || /Schema$/.test(d.name.text);
        if (!looksZod) continue;
        const read = readZod(d.initializer, text);
        decls.push({
          id: `${moduleRel}#${d.name.text}`,
          name: d.name.text,
          module: moduleRel,
          kind: read.kind,
          note: read.note,
          doc: docOf(st, text),
          fields: read.fields,
          extendsNames: read.extendsNames,
          values:
            read.kind === "zod-enum" || read.kind === "zod-union"
              ? literalValues(d.initializer)
              : [],
          refs: [],
          unresolved: [],
          external: [],
          line: lineOf(d),
          exported: isExported(st),
        });
        void chain;
        void stem;
      }
      continue;
    }
    if (ts.isInterfaceDeclaration(st)) {
      // Heritage clauses go to `extendsNames`, not to `values`. They are the
      // same generalisation arrow a Zod `.extend()` draws, and putting them
      // where literal members go is what made the first draft render an
      // interface's base class as though it were an enum case.
      const heritage = (st.heritageClauses ?? []).flatMap((h) =>
        h.types.flatMap((t) => (ts.isIdentifier(t.expression) ? [t.expression.text] : [])),
      );
      decls.push({
        id: `${moduleRel}#${st.name.text}`,
        name: st.name.text,
        module: moduleRel,
        kind: "interface",
        doc: docOf(st, text),
        fields: typeMembers(st.members, text),
        extendsNames: heritage,
        values: [],
        refs: [],
        unresolved: [],
        external: [],
        line: lineOf(st),
        exported: isExported(st),
      });
      continue;
    }
    if (ts.isTypeAliasDeclaration(st)) {
      const t = st.type;
      const fields = ts.isTypeLiteralNode(t) ? typeMembers(t.members, text) : [];
      const values = ts.isUnionTypeNode(t)
        ? t.types.filter(ts.isLiteralTypeNode).map((n) => n.literal.getText().replace(/["']/g, ""))
        : [];
      decls.push({
        id: `${moduleRel}#${st.name.text}`,
        name: st.name.text,
        module: moduleRel,
        kind: "type-alias",
        doc: docOf(st, text),
        fields,
        extendsNames: [],
        values,
        refs: [],
        unresolved: [],
        external: [],
        line: lineOf(st),
        exported: isExported(st),
      });
    }
  }
  return { decls, bindings: bindingsOf(src) };
}

/**
 * Read the whole schema graph.
 *
 * Returns `null` — not an empty graph — when the declared directory does not
 * exist. The two are different answers and a caller rendering them alike
 * reports a clean run over a directory it never opened.
 */
export function readSchemaGraph(root: string): SchemaGraph | null {
  const dirs = schemaRoots(root);
  if (dirs.length === 0) return null;
  const repoRoot = repoRootFor(root);
  const rel = (p: string): string => relative(repoRoot, p).split("\\").join("/");

  const modules: SchemaGraphModule[] = [];
  const decls: SchemaDecl[] = [];
  /**
   * Module stem → its exports, for cross-module resolution.
   *
   * Keyed by stem because a relative import names a FILE, not an instance —
   * `import { X } from "./foo.js"` inside `detangle/schemas/` means
   * `detangle/schemas/foo.ts`, and two instances may both have a `foo.ts`.
   * So the key is scoped per directory, not global: a shared stem across
   * instances would otherwise resolve one instance's import to another's
   * export, which is the `wggr` failure in miniature.
   */
  const exportsByDirStem = new Map<string, Map<string, string>>();
  const bindingsByModule = new Map<string, Map<string, string | null>>();
  /** Module path → the directory it was read from, for scoped resolution. */
  const dirOfModule = new Map<string, string>();

  for (const dir of dirs) {
    const dirRel = rel(dir);
    const instance = dirRel.includes("/") ? dirRel.split("/")[0]! : basename(repoRoot);
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith(".ts")) continue;
      const moduleRel = `${dirRel}/${f}`;
      const text = readFileSync(join(dir, f), "utf-8");
      const block = /^\/\*\*[\s\S]*?^ \*\//m.exec(text)?.[0] ?? "";
      const tag = TAG.exec(block);
      const graphNode =
        tag === null
          ? "undeclared"
          : tag[1] === "none"
            ? "none"
            : tag[1] === "schema"
              ? "schema"
              : "undeclared";

      const { decls: got, bindings } = readModule(join(dir, f), moduleRel, text);
      const stem = basename(f, ".ts");
      bindingsByModule.set(moduleRel, bindings);
      dirOfModule.set(moduleRel, dirRel);
      const key = `${dirRel}\u0000${stem}`;
      const exported = exportsByDirStem.get(key) ?? new Map<string, string>();
      for (const d of got) exported.set(d.name, d.id);
      exportsByDirStem.set(key, exported);

      modules.push({
        module: moduleRel,
        instance,
        name: stem,
        graphNode,
        reason: tag?.[2]?.trim() || undefined,
        summary: firstProse(block),
        isTest: f.endsWith(".test.ts"),
        decls: got.map((d) => d.id),
      });
      decls.push(...got);
    }
  }

  // Resolution, second pass — every module's exports are known by now, so a
  // forward reference resolves the same as a backward one. Doing it inline
  // above would make an edge's existence depend on directory order, which is
  // filesystem state rather than a property of the graph.
  const byId = new Map(decls.map((d) => [d.id, d]));
  const edges: SchemaEdge[] = [];

  /**
   * A bound name → the declaration it names, `"external"`, or `null`.
   *
   * Three outcomes rather than two, and the middle one is why: a name bound to
   * a non-relative import resolved correctly, to somewhere outside this graph.
   * Reporting it as a miss would bury the real misses under `z`.
   */
  const resolve = (moduleRel: string, name: string): string | "external" | null => {
    const bindings = bindingsByModule.get(moduleRel);
    if (!bindings || !bindings.has(name)) return null; // not bound here: not a reference
    const dirRel = dirOfModule.get(moduleRel) ?? "";
    const own = exportsByDirStem.get(`${dirRel}\u0000${basename(moduleRel, ".ts")}`);
    const here = own?.get(name);
    if (here) return here;
    const stem = bindings.get(name);
    // Bound to a non-relative import, or to something in this module that is
    // not a declaration of the graph (a helper function, a const array of
    // literals). Both resolved; neither is a node.
    if (stem === "" || stem === null || stem === undefined) return "external";
    const target = exportsByDirStem.get(`${dirRel}\u0000${stem}`);
    // A relative import pointing OUT of `schemas/` is external too. Only a
    // module that is part of this graph and does not export the name is a
    // genuine miss — which is the narrow case worth reporting.
    if (target === undefined) return "external";
    return target.get(name) ?? null;
  };

  /**
   * Declarations by NAME, for `@ref` resolution.
   *
   * An id-ref cannot go through `resolve`: that requires the name to be BOUND
   * in the module, and the whole point of a string id is that the target is
   * not imported. So it resolves by name across the graph — nearest first.
   */
  const byName = new Map<string, SchemaDecl[]>();
  for (const d of decls) {
    const list = byName.get(d.name);
    if (list) list.push(d);
    else byName.set(d.name, [d]);
  }

  /** Where an `@ref` went wrong, if it did. One entry per bad tag. */
  const refProblems: string[] = [];

  const considerIdRef = (d: SchemaDecl, f: SchemaField): void => {
    const name = f.ref as string;
    const candidates = byName.get(name);
    if (!candidates || candidates.length === 0) {
      // A tag naming nothing is a DEFECT, not a quiet no-op: the author
      // asserted an edge and the graph cannot honour it. Silence here would
      // make a typo indistinguishable from an undeclared field.
      refProblems.push(`${d.id}.${f.name}: @ref ${name} names no declaration`);
      return;
    }
    // Nearest wins: same module, then same directory, then graph-wide — but
    // ONLY when that narrowing leaves exactly one. Two equally-near targets is
    // an ambiguous tag, and picking the first is the `wggr` failure one level
    // down: an answer that looks resolved and may be the wrong schema.
    const dir = dirOfModule.get(d.module) ?? "";
    const tiers = [
      candidates.filter((c) => c.module === d.module),
      candidates.filter((c) => (dirOfModule.get(c.module) ?? "") === dir),
      candidates,
    ];
    const hit = tiers.find((t) => t.length === 1)?.[0];
    if (!hit) {
      refProblems.push(
        `${d.id}.${f.name}: @ref ${name} is ambiguous — ${candidates.length} declarations carry that name (${candidates
          .map((c) => c.module)
          .join(", ")})`,
      );
      return;
    }
    if (hit.id === d.id) return; // a self-reference is a property of the box
    edges.push({ from: d.id, to: hit.id, via: f.name, kind: "id-ref", optional: f.optional, array: f.array });
  };

  for (const d of decls) {
    const refs = new Set<string>();
    const unresolved = new Set<string>();
    const external = new Set<string>();
    const bindings = bindingsByModule.get(d.module);
    const consider = (
      name: string,
      via: string,
      kind: SchemaEdge["kind"],
      optional: boolean,
      array: boolean,
    ): void => {
      // A self-reference — `z.lazy(() => Foo)` inside `Foo` — is a property of
      // the box, not an edge to another one. Drawing it would put a loop on
      // every recursive schema and say nothing.
      if (name === d.name) return;
      if (!bindings || !bindings.has(name)) return;
      const to = resolve(d.module, name);
      if (to === "external") {
        external.add(name);
        return;
      }
      if (to === null || !byId.has(to)) {
        unresolved.add(name);
        return;
      }
      refs.add(to);
      edges.push({ from: d.id, to, via, kind, optional, array });
    };
    for (const f of d.fields) {
      for (const n of f.names) consider(n, f.name, "field", f.optional, f.array);
      if (f.ref) considerIdRef(d, f);
    }
    for (const n of d.extendsNames) consider(n, "", "extends", false, false);
    d.refs = [...refs].sort();
    d.unresolved = [...unresolved].sort();
    d.external = [...external].sort();
  }

  // Sorted for the reason the todo and bean indices both document: the
  // projection built from this is committed, and an artefact reproducible only
  // where it was generated is a snapshot rather than a generated file.
  edges.sort(
    (a, b) =>
      a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.via.localeCompare(b.via),
  );
  decls.sort((a, b) => a.id.localeCompare(b.id));
  modules.sort((a, b) => a.module.localeCompare(b.module));

  refProblems.sort();

  return { roots: dirs.map(rel), modules, decls, edges, refProblems };
}

if (import.meta.main) {
  const root = join(import.meta.dir, "..");
  const g = readSchemaGraph(root);
  if (g === null) {
    console.error("no schemas directory — nothing to read");
    process.exit(2);
  }
  const und = g.decls.filter((d) => d.kind === "undetermined");
  console.log(g.roots.map((r) => `${r}/`).join("  "));
  console.log(`  modules      ${g.modules.length}`);
  console.log(`  declarations ${g.decls.length}`);
  console.log(`  edges        ${g.edges.length}`);
  console.log(`  undetermined ${und.length}`);
  console.log(`  unresolved   ${new Set(g.decls.flatMap((d) => d.unresolved)).size} distinct name(s)`);
}
