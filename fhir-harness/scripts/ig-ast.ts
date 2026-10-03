/**
 * Read, check, diff and render an IG **AST**: the per-resource dump the
 * `ast-export` library writes on top of the FHIR IG Publisher
 * (`litlfred/fhir-ig-publisher@claude/ast-export`, bean `a9tx`).
 *
 * @covers schemas
 *
 * Owner, 2026-09-30: *"need to figure out how to list and view
 * differentials/deltas against AST ... including pipeline rendering"*. This is
 * the consumer half. The producer is Java and lives with the Publisher; this
 * lives with the layer that renders. The two meet only at the file formats
 * `ig-ast/v1`, `ig-ast-dependencies/v1` and `ig-ast-plan/v1`.
 *
 * ## An AST is a cache, never an authority
 *
 * Every manifest says `"authority": "cache"` and lists what is `provisional`
 * until a full Publisher run. Everything rendered here carries that mark to
 * the reader. This is `ig-publisher-reduction` P3's approved exit criterion:
 * a page built from cache shows a VISIBLE stale-until-full-run mark.
 *
 * ## Commands
 *
 * - `list <ast>`: what an AST holds (counts per type, edges, provenance).
 * - `validity <ast> --ig <root> [--toolchain <s>]`: whether it was built
 *   from the inputs the IG has NOW. Reuses folio-assistant-core's
 *   `compiledValidity` on the manifest's `inputs`, which the Java side writes
 *   in exactly `CompiledInputsSchema`'s shape. `inputDigest` is recomputed
 *   here by the same algorithm as the Java `InputDigest`, and a golden vector
 *   shared by both test suites keeps the two from drifting.
 * - `diff <base> <head> [--plan plan.json] [--json out] [--site dir]`: the
 *   delta between two ASTs, and optionally just-the-docs pages for it.
 * - `render <delta.json> --site dir`: pages from a delta already computed.
 * - `jsonld <ast>`: the AST as linked data, against `schemas/ig-ast.context.jsonld`.
 * - `schema [--check]`: regenerate (or check) the JSON Schemas and context
 *   from the Zod declaration in `schemas/ig-ast.ts` (bean `l0lq`).
 *
 * ## What a delta says, and what it cannot
 *
 * Resources are matched by KEY (`canonical|version`, else `Type/id`), and a
 * resource whose canonical is unchanged but whose version moved is paired
 * as `versionChanged` rather than reported as a removal plus an addition.
 * A changed resource carries an element-level differential: JSON paths whose
 * value was added, removed or changed. It is a STRUCTURAL diff of the dumped
 * JSON, not a FHIR-semantic one: reordering a repeating element shows as
 * changes at each index.
 *
 * @module fhir-harness/scripts/ig-ast
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  AstDependenciesSchema,
  AstManifestSchema,
  IG_AST_CONTEXT,
  igAstJsonSchemas,
  resourceIri,
  type AstEdge,
  type AstManifest,
  type AstResource,
} from "../schemas/ig-ast.ts";

import {
  compiledValidity,
  type CompiledValidity,
  MaterializationSchema,
} from "../../folio-assistant-core/schemas/materialization.ts";

// ── formats ────────────────────────────────────────────────────────────────

// The formats are declared ONCE, in `fhir-harness/schemas/ig-ast.ts` (Zod,
// with JSON Schema and a JSON-LD context generated from it — bean `l0lq`).
// This reader validates through them rather than spot-checking a tag.
export type { AstEdge, AstManifest, AstResource } from "../schemas/ig-ast.ts";

export interface Ast {
  dir: string;
  manifest: AstManifest;
  edges: AstEdge[];
}

export function readAst(dir: string): Ast {
  const mf = join(dir, "manifest.json");
  if (!existsSync(mf)) throw new Error(`no AST at ${dir}: manifest.json is missing`);
  const rawManifest = JSON.parse(readFileSync(mf, "utf-8")) as { $schema?: unknown };
  if (rawManifest.$schema !== "ig-ast/v1") throw new Error(`${mf} is not ig-ast/v1 (found ${String(rawManifest.$schema)})`);
  const pm = AstManifestSchema.safeParse(rawManifest);
  if (!pm.success) throw new Error(`${mf} does not match ig-ast/v1: ${pm.error.issues[0]?.path.join(".")}: ${pm.error.issues[0]?.message}`);
  const manifest: AstManifest = pm.data;
  // REQUIRED. A missing dependency document is "cannot tell", never "no
  // edges": substituting an empty list would let a diff of two incomplete ASTs
  // report no edge changes as a clean result (Copilot review on #1708).
  const df = join(dir, "dependencies.json");
  if (!existsSync(df)) throw new Error(`incomplete AST at ${dir}: dependencies.json is missing`);
  const pd = AstDependenciesSchema.safeParse(JSON.parse(readFileSync(df, "utf-8")));
  if (!pd.success) throw new Error(`${df} is not ig-ast-dependencies/v1: ${pd.error.issues[0]?.path.join(".")}: ${pd.error.issues[0]?.message}`);
  const edges: AstEdge[] = pd.data.dependencies;
  return { dir, manifest, edges };
}

// ── list ───────────────────────────────────────────────────────────────────

export interface AstListing {
  resources: number;
  byType: Record<string, number>;
  edges: number;
  edgesResolvedInIg: number;
  edgesByOrigin: Record<string, number>;
  mixed: boolean;
  builtAt: Record<string, number>;
  provisional: string[];
}

export function listAst(ast: Ast): AstListing {
  const count = <T>(xs: T[], f: (x: T) => string) =>
    xs.reduce<Record<string, number>>((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});
  return {
    resources: ast.manifest.resources.length,
    byType: sortKeys(count(ast.manifest.resources, (r) => r.resourceType)),
    edges: ast.edges.length,
    edgesResolvedInIg: ast.edges.filter((e) => e.resolved).length,
    edgesByOrigin: sortKeys(count(ast.edges, (e) => e.origin)),
    mixed: ast.manifest.mixed === true,
    builtAt: sortKeys(count(ast.manifest.resources, (r) => r.builtAt ?? "(single build)")),
    provisional: ast.manifest.provisional ?? [],
  };
}

// ── validity ───────────────────────────────────────────────────────────────

/**
 * sha256 over the IG's INPUTS: `sushi-config.yaml`, `ig.ini`, everything
 * under `input/`. Files in byte order of their relative path; each
 * contributes its path, a NUL, its bytes, a NUL. Must equal the Java
 * `InputDigest` byte for byte; see the golden vector in the tests.
 *
 * Inside a git work tree the file set is what git counts as the tree:
 * tracked files plus untracked ones that are not ignored. Without that, a
 * gitignored `.DS_Store` or Publisher scratch file under `input/` makes the
 * digest of a working checkout differ from a clean clone of the same commit,
 * and a seeded cache can never verify anywhere else (bean wnhh, 2026-10-02:
 * smart-trust recorded `b2bbbfc4…`, a clean clone computes `c1023d82…`).
 * Outside a work tree every file is hashed, as before. The Java
 * `InputDigest` must apply the same filter.
 */
export function inputDigest(igRoot: string): string {
  const tops = ["sushi-config.yaml", "ig.ini", "input"];
  const files = gitTreeFiles(igRoot, tops) ?? walkTops(igRoot, tops);
  const rel = files.map((f) => relative(igRoot, f).split("\\").join("/"));
  const order = rel.map((r, i) => [Buffer.from(r, "utf-8"), i] as const).sort((a, b) => Buffer.compare(a[0], b[0]));
  const h = createHash("sha256");
  const NUL = Buffer.from([0]);
  for (const [bytes, i] of order) {
    h.update(bytes);
    h.update(NUL);
    h.update(readFileSync(files[i]!));
    h.update(NUL);
  }
  return h.digest("hex");
}

function walkTops(igRoot: string, tops: string[]): string[] {
  const files: string[] = [];
  for (const top of tops) {
    const p = join(igRoot, top);
    if (!existsSync(p)) continue;
    if (statSync(p).isFile()) files.push(p);
    else walk(p, files);
  }
  return files;
}

/** The files under `tops` git counts as the work tree, or null outside one. */
function gitTreeFiles(igRoot: string, tops: string[]): string[] | null {
  const inside = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: igRoot, encoding: "utf-8" });
  if (inside.status !== 0 || inside.stdout.trim() !== "true") return null;
  const ls = spawnSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...tops], {
    cwd: igRoot,
    encoding: "utf-8",
  });
  if (ls.status !== 0) return null;
  const seen = new Set<string>();
  const files: string[] = [];
  for (const r of ls.stdout.split("\0")) {
    if (!r || seen.has(r)) continue;
    seen.add(r);
    const p = join(igRoot, r);
    // A tracked file deleted in the work tree is not an input any more.
    if (existsSync(p) && statSync(p).isFile()) files.push(p);
  }
  return files;
}

function walk(dir: string, out: string[]): void {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out.push(p);
  }
}

/**
 * The five materialization gates, answered for a locally built AST. Only
 * what is actually known is claimed: the AST derives from the IG's own
 * source, so its terms are the source's, which this check does not assess.
 * A compiled copy can never discharge `sourceLoss`: it is derived, not the
 * source.
 */
export const AST_GATES = {
  size: { verdict: "unknown", basis: "ig-ast validity does not measure the AST's size" },
  restrictions: { verdict: "unknown", basis: "derived from the IG's own source; inherits its terms, not assessed here" },
  copyright: { verdict: "unknown", basis: "derived from the IG's own source; inherits its terms, not assessed here" },
  retention: { verdict: "permitted", basis: "a compiled cache, regenerable from its inputs by a full IG Publisher run" },
  sourceLoss: { verdict: "unknown", basis: "a compiled copy is derived, not the source; it cannot stand in for it" },
} as const;

export interface AstValidity {
  verdict: CompiledValidity["verdict"];
  detail: CompiledValidity;
  recorded: AstManifest["inputs"];
  current: { toolchain?: string; sourceRevision?: string; inputDigest?: string };
}

/**
 * Whether `ast` was built from the inputs `igRoot` has now. The toolchain
 * cannot be read from a checkout, so it is taken from `toolchain` when the
 * caller knows it (the Publisher version it would run) and otherwise
 * assumed unchanged, and SAID to be assumed, in `current`.
 */
export function astValidity(ast: Ast, igRoot: string, toolchain?: string): AstValidity {
  const recorded = ast.manifest.inputs;
  const rev = spawnSync("git", ["rev-parse", "HEAD"], { cwd: igRoot, encoding: "utf-8" });
  const current = {
    toolchain: toolchain ?? recorded?.toolchain,
    sourceRevision: rev.status === 0 ? rev.stdout.trim() : undefined,
    inputDigest: inputDigest(igRoot),
  };
  const rec = MaterializationSchema.safeParse({
    state: "materialized",
    provenance: { upstream: resolve(igRoot) },
    localPath: ast.dir,
    purpose: "compiled",
    gates: AST_GATES,
    inputs: recorded,
  });
  const detail: CompiledValidity = rec.success
    ? compiledValidity(rec.data, current)
    : { verdict: "cannot-tell", why: `the manifest's inputs do not parse: ${rec.error.issues.map((i) => i.message).join("; ")}` };
  return { verdict: detail.verdict, detail, recorded, current };
}

// ── diff ───────────────────────────────────────────────────────────────────

export type ValueChange = { path: string; op: "added" | "removed" | "changed"; base?: unknown; head?: unknown };

export interface ResourceDelta {
  status: "added" | "removed" | "changed" | "versionChanged";
  key: string;
  baseKey?: string;
  resourceType: string;
  id: string;
  canonical: string | null;
  baseVersion?: string | null;
  headVersion?: string | null;
  builtAt?: string;
  changes?: ValueChange[];
  changesTruncated?: number;
}

export interface EdgeRef {
  source: string;
  kind: string;
  target: string;
  targetVersion: string | null;
}

export interface AstDelta {
  $schema: "ig-ast-delta/v1";
  authority: "cache";
  provisional: string[];
  base: { dir: string; sourceRevision?: string; generatedAt?: string };
  head: { dir: string; sourceRevision?: string; generatedAt?: string; mixed: boolean };
  counts: { added: number; removed: number; changed: number; versionChanged: number; unchanged: number };
  resources: ResourceDelta[];
  edges: { added: EdgeRef[]; removed: EdgeRef[] };
  plan?: { decision: string; coneFraction?: number; rebuild: number; fullBuildBecause: string[] };
}

/** Per-resource cap on differential rows; the rest is counted, never silently dropped. */
export const MAX_CHANGES = 200;

export function diffAst(base: Ast, head: Ast, plan?: Record<string, unknown>): AstDelta {
  const b = new Map(base.manifest.resources.map((r) => [r.key, r]));
  const h = new Map(head.manifest.resources.map((r) => [r.key, r]));
  const out: ResourceDelta[] = [];
  let unchanged = 0;

  const removed = [...b.values()].filter((r) => !h.has(r.key));
  const added = [...h.values()].filter((r) => !b.has(r.key));
  // Pair a version move: same canonical on both sides, different key.
  const addedByCanonical = new Map<string, AstResource[]>();
  for (const r of added) if (r.canonical) addedByCanonical.set(r.canonical, [...(addedByCanonical.get(r.canonical) ?? []), r]);
  const paired = new Set<string>();
  for (const r of removed) {
    const cands = r.canonical ? addedByCanonical.get(r.canonical) : undefined;
    const m = cands?.find((c) => !paired.has(c.key));
    if (m) {
      paired.add(m.key);
      out.push({
        ...resourceDiff(base, head, r, m),
        status: "versionChanged",
        baseKey: r.key,
        baseVersion: r.version,
        headVersion: m.version,
      });
    } else {
      out.push({ status: "removed", key: r.key, resourceType: r.resourceType, id: r.id, canonical: r.canonical });
    }
  }
  for (const r of added) {
    if (paired.has(r.key)) continue;
    out.push({ status: "added", key: r.key, resourceType: r.resourceType, id: r.id, canonical: r.canonical, builtAt: r.builtAt });
  }
  for (const [key, hr] of h) {
    const br = b.get(key);
    if (!br) continue;
    const d = resourceDiff(base, head, br, hr);
    if (d.changes!.length === 0 && !d.changesTruncated) unchanged++;
    else out.push({ ...d, status: "changed" });
  }
  out.sort((x, y) => x.resourceType.localeCompare(y.resourceType) || x.key.localeCompare(y.key));

  const ek = (e: AstEdge | EdgeRef) => `${e.source}\u0000${e.kind}\u0000${e.target}\u0000${e.targetVersion ?? ""}`;
  const be = new Map(base.edges.map((e) => [ek(e), e]));
  const he = new Map(head.edges.map((e) => [ek(e), e]));
  const ref = (e: AstEdge): EdgeRef => ({ source: e.source, kind: e.kind, target: e.target, targetVersion: e.targetVersion });

  const count = (s: ResourceDelta["status"]) => out.filter((r) => r.status === s).length;
  const delta: AstDelta = {
    $schema: "ig-ast-delta/v1",
    authority: "cache",
    provisional: head.manifest.provisional ?? ["indices", "dependencies", "versions"],
    base: { dir: base.dir, sourceRevision: base.manifest.inputs?.sourceRevision, generatedAt: base.manifest.generatedAt },
    head: {
      dir: head.dir,
      sourceRevision: head.manifest.inputs?.sourceRevision,
      generatedAt: head.manifest.generatedAt,
      mixed: head.manifest.mixed === true,
    },
    counts: { added: count("added"), removed: count("removed"), changed: count("changed"), versionChanged: count("versionChanged"), unchanged },
    resources: out,
    edges: {
      added: [...he].filter(([k]) => !be.has(k)).map(([, e]) => ref(e)),
      removed: [...be].filter(([k]) => !he.has(k)).map(([, e]) => ref(e)),
    },
  };
  if (plan) {
    delta.plan = {
      decision: String(plan.decision),
      coneFraction: typeof plan.coneFraction === "number" ? plan.coneFraction : undefined,
      rebuild: Array.isArray(plan.rebuild) ? plan.rebuild.length : 0,
      fullBuildBecause: Array.isArray(plan.fullBuildBecause) ? (plan.fullBuildBecause as string[]) : [],
    };
  }
  return delta;
}

function resourceDiff(base: Ast, head: Ast, br: AstResource, hr: AstResource): ResourceDelta {
  const bj = readJson(join(base.dir, br.file));
  const hj = readJson(join(head.dir, hr.file));
  const changes: ValueChange[] = [];
  diffValue(bj, hj, hr.resourceType, changes);
  return {
    status: "changed",
    key: hr.key,
    resourceType: hr.resourceType,
    id: hr.id,
    canonical: hr.canonical,
    builtAt: hr.builtAt,
    changes: changes.slice(0, MAX_CHANGES),
    changesTruncated: changes.length > MAX_CHANGES ? changes.length - MAX_CHANGES : undefined,
  };
}

/** Reads a resource payload. A missing or malformed file THROWS: turning it into
 * `undefined` on both sides would diff as unchanged, a false-clean delta. */
function readJson(p: string): unknown {
  if (!existsSync(p)) throw new Error(`AST resource file missing: ${p}`);
  try {
    return JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(`AST resource file is not JSON: ${p}: ${(e as Error).message}`);
  }
}

/** Structural differential, FHIRPath-like paths with array indices: `Library.relatedArtifact[1].resource`. */
export function diffValue(a: unknown, b: unknown, path: string, out: ValueChange[]): void {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
  if (isObj(a) && isObj(b)) {
    for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
      const p = `${path}.${k}`;
      if (!(k in b)) out.push({ path: p, op: "removed", base: a[k] });
      else if (!(k in a)) out.push({ path: p, op: "added", head: b[k] });
      else diffValue(a[k], b[k], p, out);
    }
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const p = `${path}[${i}]`;
      if (i >= b.length) out.push({ path: p, op: "removed", base: a[i] });
      else if (i >= a.length) out.push({ path: p, op: "added", head: b[i] });
      else diffValue(a[i], b[i], p, out);
    }
    return;
  }
  if (a === undefined) out.push({ path, op: "added", head: b });
  else if (b === undefined) out.push({ path, op: "removed", base: a });
  else out.push({ path, op: "changed", base: a, head: b });
}

// ── render (just-the-docs) ─────────────────────────────────────────────────

/**
 * Writes just-the-docs pages for a delta under `siteDir`: `index.md` (the
 * list) and one page per changed or version-changed resource (the view).
 * Every page opens with the provisional mark: this is P3's exit criterion,
 * not decoration.
 */
export function renderDelta(delta: AstDelta, siteDir: string, opts: { title?: string; navOrder?: number } = {}): string[] {
  const title = opts.title ?? "AST delta";
  const written: string[] = [];
  const write = (rel: string, text: string) => {
    const p = join(siteDir, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text);
    written.push(p);
  };
  const mark = provisionalMark(delta);
  const c = delta.counts;
  const lines: string[] = [
    "---",
    `title: ${yaml(title)}`,
    "has_children: true",
    ...(opts.navOrder !== undefined ? [`nav_order: ${opts.navOrder}`] : []),
    "---",
    "",
    `# ${esc(title)}`,
    "",
    mark,
    "",
    `Base \`${esc(short(delta.base.sourceRevision))}\` → head \`${esc(short(delta.head.sourceRevision))}\`` +
      (delta.head.mixed ? " (head is an **incremental, mixed-provenance** AST)" : ""),
    "",
    "| added | removed | changed | version changed | unchanged | edges added | edges removed |",
    "|---:|---:|---:|---:|---:|---:|---:|",
    `| ${c.added} | ${c.removed} | ${c.changed} | ${c.versionChanged} | ${c.unchanged} | ${delta.edges.added.length} | ${delta.edges.removed.length} |`,
    "",
  ];
  if (delta.plan) {
    lines.push(
      `**Plan:** ${esc(delta.plan.decision)}` +
        (delta.plan.coneFraction !== undefined ? `, cone ${(100 * delta.plan.coneFraction).toFixed(1)}% of the IG` : "") +
        `, ${delta.plan.rebuild} to rebuild.`,
      ...delta.plan.fullBuildBecause.map((w) => `- full build because: ${esc(w)}`),
      "",
    );
  }
  const byType = new Map<string, ResourceDelta[]>();
  for (const r of delta.resources) byType.set(r.resourceType, [...(byType.get(r.resourceType) ?? []), r]);
  for (const [type, rs] of byType) {
    lines.push(`## ${esc(type)}`, "", "| resource | status | detail |", "|---|---|---|");
    for (const r of rs) {
      const page = r.status === "changed" || r.status === "versionChanged";
      const label = `\`${esc(r.key)}\``;
      const detail =
        r.status === "versionChanged"
          ? `${esc(r.baseVersion ?? "∅")} → ${esc(r.headVersion ?? "∅")}, ${r.changes?.length ?? 0} value change(s)`
          : r.status === "changed"
            ? `${(r.changes?.length ?? 0) + (r.changesTruncated ?? 0)} value change(s)`
            : r.builtAt
              ? `built at \`${esc(short(r.builtAt))}\``
              : "";
      lines.push(`| ${page ? `[${label}](${pageName(r)})` : label} | ${r.status} | ${detail} |`);
    }
    lines.push("");
  }
  if (delta.edges.added.length || delta.edges.removed.length) {
    lines.push("## Dependency edges", "", "| | source | kind | target |", "|---|---|---|---|");
    for (const [sign, es] of [["+", delta.edges.added], ["−", delta.edges.removed]] as const) {
      for (const e of es) {
        lines.push(`| ${sign} | \`${esc(e.source)}\` | ${esc(e.kind)} | \`${esc(e.target)}${e.targetVersion ? "|" + esc(e.targetVersion) : ""}\` |`);
      }
    }
    lines.push("");
  }
  write("index.md", wrapRaw(lines.join("\n")));

  for (const r of delta.resources) {
    if (r.status !== "changed" && r.status !== "versionChanged") continue;
    const p: string[] = [
      "---",
      `title: ${yaml(`${r.resourceType}/${r.id}`)}`,
      `parent: ${yaml(title)}`,
      "---",
      "",
      `# ${esc(r.resourceType)}/${esc(r.id)}`,
      "",
      mark,
      "",
      `Key \`${esc(r.key)}\`` + (r.baseKey ? ` (was \`${esc(r.baseKey)}\`)` : "") + (r.builtAt ? `, built at \`${esc(short(r.builtAt))}\`` : ""),
      "",
      "| path | | base | head |",
      "|---|---|---|---|",
      ...(r.changes ?? []).map(
        (ch) => `| \`${esc(ch.path)}\` | ${ch.op} | ${cell(ch.base)} | ${cell(ch.head)} |`,
      ),
      "",
    ];
    if (r.changesTruncated) p.push(`…and **${r.changesTruncated}** more change(s), not shown (cap ${MAX_CHANGES}).`, "");
    write(pageName(r), wrapRaw(p.join("\n")));
  }
  return written;
}

function provisionalMark(d: AstDelta): string {
  return (
    `> **Provisional — built from a cached AST, not a full IG Publisher run.** ` +
    `Until a full run, these are unverified: ${d.provisional.map(esc).join(", ")}.` +
    (d.head.mixed ? " The head AST mixes resources built at different revisions." : "")
  );
}

/** Type-id plus a short hash of the KEY: two entries sharing type/id but not
 * canonical|version must not overwrite one page. */
function pageName(r: ResourceDelta): string {
  const h = createHash("sha256").update(r.key).digest("hex").slice(0, 8);
  return `${safe(r.resourceType)}-${safe(r.id)}-${h}.md`;
}

const safe = (s: string) => s.replace(/[^A-Za-z0-9._-]/g, "_");
const short = (s?: string) => (s ? (/^[0-9a-f]{40}$/.test(s) ? s.slice(0, 8) : s) : "unknown");
/** Markdown-table-safe text. */
/** Markdown-table-safe AND Liquid-inert text. A word joiner (U+2060) between
 * `{` and `{`/`%` stops Jekyll parsing a tag or output, including a value that
 * carries `{% endraw %}` and would otherwise close the page's raw block
 * (Copilot review on #1708). The text reads the same. */
const esc = (s: string) => neutralise(String(s)).replace(/\|/g, "\\|").replace(/\n/g, " ");
export const neutralise = (s: string) => s.replace(/\{(?=[{%])/g, "{\u2060").replace(/%\}/g, "%\u2060}").replace(/\}\}/g, "}\u2060}");
const yaml = (s: string) => JSON.stringify(s);
function cell(v: unknown): string {
  if (v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return `\`${esc(s.length > 160 ? s.slice(0, 157) + "…" : s)}\``;
}
/** FHIR values carry `{{` and `{%` (Liquid in narratives); Jekyll must not evaluate them. */
function wrapRaw(md: string): string {
  const i = md.indexOf("---", 3);
  const fm = md.slice(0, i + 3);
  return `${fm}\n{% raw %}${md.slice(i + 3)}{% endraw %}\n`;
}

function sortKeys<T>(o: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
}

// ── CLI ────────────────────────────────────────────────────────────────────

// ── jsonld ─────────────────────────────────────────────────────────────────

/**
 * The AST as JSON-LD (owner, 2026-10-01: "export json(ld)+schema"): one node
 * per resource, `@id` its canonical URL (`urn:fhir:<Type>/<id>` without one),
 * `@type` its FHIR resource type, and its outgoing edges as `dependsOn`, each
 * pointing at the target by `@id` — the in-IG resource when `resolved`, the
 * canonical as written otherwise. The manifest's cache status rides on the
 * graph, so a consumer of the linked data still reads it as provisional.
 */
export function astJsonLd(ast: Ast): Record<string, unknown> {
  const byKey = new Map(ast.manifest.resources.map((r) => [r.key, r]));
  const iriOfKey = (k: string) => {
    const r = byKey.get(k);
    return r ? resourceIri(r) : k;
  };
  const out = new Map<string, AstEdge[]>();
  for (const e of ast.edges) out.set(e.source, [...(out.get(e.source) ?? []), e]);
  return {
    ...IG_AST_CONTEXT,
    authority: ast.manifest.authority,
    provisional: ast.manifest.provisional,
    "@graph": ast.manifest.resources.map((r) => ({
      "@id": resourceIri(r),
      resourceType: `fhir:${r.resourceType}`,
      key: r.key,
      ...(r.version ? { version: r.version } : {}),
      file: r.file,
      ...(r.source ? { source: r.source } : {}),
      dependsOn: (out.get(r.key) ?? []).map((e) => ({
        kind: e.kind,
        target: e.resolved ? iriOfKey(e.resolved) : e.target,
        ...(e.resolved ? { resolved: iriOfKey(e.resolved) } : {}),
        ...(e.path ? { path: e.path } : {}),
        origin: e.origin,
      })),
    })),
  };
}

/** The generated files `ig-ast:schema` keeps current: the JSON Schemas and the JSON-LD context. */
export function igAstSchemaFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [name, schema] of Object.entries(igAstJsonSchemas())) files[name] = `${JSON.stringify(schema, null, 2)}\n`;
  files["ig-ast.context.jsonld"] = `${JSON.stringify(IG_AST_CONTEXT, null, 2)}\n`;
  return files;
}

if (import.meta.main) {
  const [cmd, ...args] = process.argv.slice(2);
  const opt = (k: string) => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const pos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1]!.startsWith("--")));
  const usage =
    "usage: ig-ast.ts list <ast> | validity <ast> --ig <root> [--toolchain <s>] | " +
    "diff <base-ast> <head-ast> [--plan plan.json] [--json out.json] [--site dir] | render <delta.json> --site dir | " +
    "jsonld <ast> | schema [--check]";
  if (cmd === "list" && pos[0]) {
    console.log(JSON.stringify(listAst(readAst(pos[0])), null, 2));
  } else if (cmd === "validity" && pos[0] && opt("--ig")) {
    const v = astValidity(readAst(pos[0]), opt("--ig")!, opt("--toolchain"));
    console.log(JSON.stringify(v, null, 2));
    process.exit(v.verdict === "valid" ? 0 : v.verdict === "stale-inputs" ? 1 : 2);
  } else if (cmd === "diff" && pos[0] && pos[1]) {
    const plan = opt("--plan") ? JSON.parse(readFileSync(opt("--plan")!, "utf-8")) : undefined;
    const d = diffAst(readAst(pos[0]), readAst(pos[1]), plan);
    const text = JSON.stringify(d, null, 2) + "\n";
    if (opt("--json")) writeFileSync(opt("--json")!, text);
    if (opt("--site")) console.log(`wrote ${renderDelta(d, opt("--site")!).length} page(s) under ${opt("--site")}`);
    if (!opt("--json") && !opt("--site")) process.stdout.write(text);
    else console.log(JSON.stringify(d.counts));
  } else if (cmd === "render" && pos[0] && opt("--site")) {
    const d = JSON.parse(readFileSync(pos[0], "utf-8")) as AstDelta;
    console.log(`wrote ${renderDelta(d, opt("--site")!).length} page(s) under ${opt("--site")}`);
  } else if (cmd === "jsonld" && pos[0]) {
    process.stdout.write(`${JSON.stringify(astJsonLd(readAst(pos[0])), null, 2)}\n`);
  } else if (cmd === "schema") {
    // The JSON Schemas and context, generated from `schemas/ig-ast.ts` into the
    // directory beside it; `--check` fails on any stale or missing file.
    const dir = join(import.meta.dir, "..", "schemas");
    const stale: string[] = [];
    for (const [name, text] of Object.entries(igAstSchemaFiles())) {
      const at = join(dir, name);
      if (args.includes("--check")) {
        if (!existsSync(at) || readFileSync(at, "utf-8") !== text) stale.push(name);
      } else writeFileSync(at, text);
    }
    if (stale.length) {
      console.error(`✗ stale: ${stale.join(", ")} — run \`bun run ig-ast:schema\` and commit`);
      process.exit(1);
    }
    console.log(args.includes("--check") ? "✓ IG AST JSON Schemas and context are current" : `wrote ${Object.keys(igAstSchemaFiles()).length} file(s) to fhir-harness/schemas/`);
  } else {
    console.error(usage);
    process.exit(2);
  }
}
