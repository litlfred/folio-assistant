#!/usr/bin/env bun
/**
 * lean-narrative-roundtrip — the mechanical half of the round trip between a
 * Lean library and the textbook narration of it (skill `lean-library-ingestion`,
 * step 5). Two directions:
 *
 * - **narrative → Lean (resolution):** every block's `lean.ref`, and every
 *   identifier on a block's `*Lean:*` line, names a declaration that exists in
 *   the pinned library source. A name that resolves nowhere is a `fail`.
 * - **Lean → narrative (coverage):** for every module a block cites on its
 *   `*Source:*` line, every declaration that module's docstring lists under
 *   *Main definitions / results / statements* is stated somewhere in the paper
 *   (a `lean.ref` or a `*Lean:*` identifier). A missing one is a `warn` on the
 *   citing block, since an author may leave it out on purpose and say so.
 *
 * It reads source text only (no build), so "exists" means "declared in the
 * source at this revision", not "elaborates". The semantic half — does the
 * prose say what the formal statement says, hypotheses included — needs an
 * agent that sees only the formal statement and the prose; record its verdict
 * with `--payload` (criterion `lean-narrative-fidelity`).
 *
 * Usage:
 *   bun run lean-narrative-roundtrip.ts --root <lake-root> --folio folio/<slug> [--package mathlib] [--write]
 *   bun run lean-narrative-roundtrip.ts --payload <file.json>
 *
 * With `--write`, each verdict is written into the block's sidecar under
 * `test/results/block-qa/<folio path>/<root>.qa.json`, criterion
 * `lean-narrative-roundtrip`.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative } from "node:path";
import { execFileSync } from "node:child_process";

export const CRITERION = "lean-narrative-roundtrip";
export const FIDELITY = "lean-narrative-fidelity";

const DECL_RE =
  /^(?:@\[[^\]]*\]\s*)*(?:(?:private|protected|noncomputable|nonrec|partial|unsafe|public)\s+)*(theorem|lemma|def|abbrev|instance|structure|class|inductive|axiom|opaque|alias)\s+([^\s:({[]+)/;

/** Every declared fully-qualified name in a directory of Lean source, tracking `namespace … end`. */
export function declaredNames(files: string[]): Set<string> {
  const out = new Set<string>();
  for (const f of files) {
    const ns: string[][] = [];
    const lines = readFileSync(f, "utf8").replace(/\/-[\s\S]*?-\//g, (c) => c.replace(/[^\n]/g, " ")).split("\n");
    for (const raw of lines) {
      const l = raw.trim();
      let m: RegExpMatchArray | null;
      if ((m = l.match(/^namespace\s+(\S+)/))) ns.push(m[1].split("."));
      else if ((m = l.match(/^section\b/))) ns.push([]);
      else if ((m = l.match(/^end\b/))) ns.pop();
      else if ((m = l.match(DECL_RE))) {
        const name = m[2];
        if (name.startsWith("_root_.")) out.add(name.slice(7));
        else out.add([...ns.flat(), name].join("."));
      }
    }
  }
  return out;
}

export function resolve(name: string, decls: Set<string>, namespaces: string[]): string | undefined {
  if (decls.has(name)) return name;
  for (const n of namespaces) if (decls.has(`${n}.${name}`)) return `${n}.${name}`;
  return undefined;
}

/** The backticked identifiers on a block's `*Lean:*` line(s). */
export function leanLineNames(md: string): string[] {
  return [...md.matchAll(/^\*Lean:\*(.*)$/gm)].flatMap((m) =>
    [...m[1].matchAll(/`([A-Za-z_][A-Za-z0-9_'.]*)`/g)].map((x) => x[1]).filter((n) => !/\s/.test(n)),
  );
}

/** Modules cited on `*Source:*` lines, expanded for the `` `A.B.C`, `.D` `` shorthand. */
export function sourceModules(md: string): string[] {
  const out: string[] = [];
  for (const m of md.matchAll(/^\*Source:\*(.*)$/gm)) {
    let base = "";
    for (const x of m[1].matchAll(/`([A-Za-z.][A-Za-z0-9_.]*)`/g)) {
      const t = x[1];
      if (t.startsWith(".") && base) out.push(base + t);
      else if (t.includes(".")) {
        out.push(t);
        base = t.split(".").slice(0, -1).join(".");
      }
    }
  }
  return out;
}

/** The identifiers a module docstring lists under Main definitions / results / statements. */
export function mainDeclarations(src: string): string[] {
  const doc = src.match(/\/-!([\s\S]*?)-\//)?.[1] ?? "";
  const out: string[] = [];
  for (const sec of doc.split(/^##\s+/m).slice(1)) {
    if (!/^main (definitions?|results?|statements?|theorems?)/i.test(sec)) continue;
    for (const b of sec.matchAll(/^\*\s+`([A-Za-z_][A-Za-z0-9_'.]*)[^`]*`/gm)) out.push(b[1]);
    for (const b of sec.matchAll(/^\*\s+`[^`]*`\s*,\s*`([A-Za-z_][A-Za-z0-9_'.]*)`/gm)) out.push(b[1]);
  }
  return out;
}

type Block = { md: string; ts: string; root: string; mdText: string; leanRef?: string };

function walk(dir: string, ext: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (e.endsWith(ext)) out.push(p);
  }
  return out;
}

export function blocksOf(folio: string): Block[] {
  return walk(folio, ".md")
    .filter((md) => existsSync(md.replace(/\.md$/, ".ts")))
    .map((md) => {
      const ts = md.replace(/\.md$/, ".ts");
      const tsText = readFileSync(ts, "utf8");
      const ref = tsText.match(/"?ref"?\s*:\s*"([^"]+)"/)?.[1];
      return { md, ts, root: md.replace(/\.md$/, ""), mdText: readFileSync(md, "utf8"), leanRef: ref };
    });
}

type Verdict = { block: Block; result: "pass" | "warn" | "fail" | "n/a"; notes: string };

export function judge(blocks: Block[], decls: Set<string>, moduleSrc: (m: string) => string | undefined, pkg: string): Verdict[] {
  // The top-level namespaces the library declares, so a short name on a `*Lean:*` line resolves within them.
  const namespaces = [...new Set([...decls].map((d) => d.split(".")[0]))];
  const stated = new Set<string>();
  const verdicts: Verdict[] = [];
  for (const b of blocks) {
    const problems: string[] = [];
    const ok: string[] = [];
    const names = leanLineNames(b.mdText);
    if (b.leanRef) {
      const [p, decl] = b.leanRef.includes(":") ? b.leanRef.split(":", 2) : [pkg, b.leanRef];
      if (p !== pkg) problems.push(`lean.ref package "${p}" is not "${pkg}"`);
      names.unshift(decl);
    }
    for (const n of names) {
      const r = resolve(n, decls, namespaces);
      if (r) (ok.push(r), stated.add(r));
      else problems.push(`\`${n}\` is declared nowhere in the source`);
    }
    if (!names.length) verdicts.push({ block: b, result: "n/a", notes: "states no Lean declaration" });
    else
      verdicts.push({
        block: b,
        result: problems.length ? "fail" : "pass",
        notes: problems.length ? problems.join("; ") : `${new Set(ok).size} declaration(s) resolve: ${[...new Set(ok)].join(", ")}`,
      });
  }
  // coverage, on the blocks that cite modules
  for (const v of verdicts) {
    const mods = sourceModules(v.block.mdText);
    if (!mods.length) continue;
    const missing: string[] = [];
    let listed = 0;
    for (const m of mods) {
      const src = moduleSrc(m);
      if (src === undefined) {
        missing.push(`module ${m} not found`);
        continue;
      }
      for (const d of mainDeclarations(src)) {
        listed++;
        const r = resolve(d, decls, namespaces);
        if (!r || !stated.has(r)) missing.push(`${m}: \`${d}\``);
      }
    }
    const cov = missing.length
      ? `coverage: ${listed - missing.length}/${listed} main declarations of the cited modules are stated; not stated: ${missing.join(", ")}`
      : `coverage: all ${listed} main declarations of ${mods.length} cited module(s) are stated in the paper`;
    if (v.result === "n/a") v.result = missing.length ? "warn" : "pass";
    else if (missing.length && v.result === "pass") v.result = "warn";
    v.notes = v.result === "n/a" ? cov : `${v.notes}. ${cov}`.replace(/^states no Lean declaration\. /, "");
  }
  return verdicts;
}

const short = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex").slice(0, 12);

export function sidecarPath(repoRoot: string, block: Block): string {
  return join(repoRoot, "test/results/block-qa", relative(repoRoot, block.root) + ".qa.json");
}

export function writeEntry(repoRoot: string, block: Block, criterion: string, entries: object[]) {
  const p = sidecarPath(repoRoot, block);
  const d = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : { $schema: "block-qa/v1", paths: { md: relative(repoRoot, block.md), ts: relative(repoRoot, block.ts) }, criteria: {} };
  d.criteria ??= {};
  d.criteria[criterion] = entries;
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
}

function tree(root: string): string {
  try {
    return execFileSync("git", ["-C", root, "rev-parse", "HEAD^{tree}"]).toString().trim();
  } catch {
    return "unknown";
  }
}

function main() {
  const a = process.argv.slice(2);
  const get = (k: string) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
  const payload = get("--payload");
  if (payload) {
    // { repoRoot, block: "<md path>", verdict, findings[], reasoning, reviewer: {id, skill, session}, sawOnly: "..." }
    const p = JSON.parse(readFileSync(payload, "utf8"));
    const repoRoot = p.repoRoot ?? process.cwd();
    const md = join(repoRoot, p.block);
    const b: Block = { md, ts: md.replace(/\.md$/, ".ts"), root: md.replace(/\.md$/, ""), mdText: "" };
    writeEntry(repoRoot, b, FIDELITY, [
      {
        field_hash: { md: short(b.md), ts: short(b.ts) },
        result: p.verdict,
        reviewer: { kind: "agent", id: p.reviewer?.id ?? "lean-narrative-fidelity-reviewer", actor: "independent-agent", version: "v1", agent_skill: p.reviewer?.skill, agent_session: p.reviewer?.session, agent_date: p.date ?? new Date().toISOString() },
        reviewed_tree: tree(repoRoot),
        notes: [p.reasoning, ...(p.findings ?? []).map((f: string) => `finding: ${f}`)].filter(Boolean).join("\n"),
        metrics: { saw: p.sawOnly ?? "the formal statement and the prose, not the module docstring" },
      },
    ]);
    console.log(`${FIDELITY}: ${p.verdict} recorded on ${p.block}`);
    return;
  }
  const root = get("--root");
  const folio = get("--folio");
  if (!root || !folio) {
    console.error("usage: --root <lake-root> --folio folio/<slug> [--package mathlib] [--write] | --payload <file>");
    process.exit(2);
  }
  const pkg = get("--package") ?? "mathlib";
  const libDir = get("--lib") ?? "Mathlib";
  const decls = declaredNames(walk(join(root, libDir), ".lean"));
  const moduleSrc = (m: string) => {
    const f = join(root, m.split(".").join("/") + ".lean");
    return existsSync(f) ? readFileSync(f, "utf8") : undefined;
  };
  const vs = judge(blocksOf(join(root, folio)), decls, moduleSrc, pkg);
  const t = tree(root);
  let fails = 0;
  for (const v of vs) {
    if (v.result === "fail") fails++;
    console.log(`${v.result.padEnd(4)} ${relative(root, v.block.md)}  ${v.notes}`);
    if (a.includes("--write"))
      writeEntry(root, v.block, CRITERION, [
        {
          field_hash: { md: short(v.block.md), ts: short(v.block.ts) },
          result: v.result,
          reviewer: { kind: "script", id: "folio-assistant-sci/scripts/lean-narrative-roundtrip.ts", actor: "local-sweep", version: "v1" },
          reviewed_tree: t,
          notes: v.notes,
        },
      ]);
  }
  console.log(`${vs.length} blocks: ${vs.filter((v) => v.result === "pass").length} pass, ${vs.filter((v) => v.result === "warn").length} warn, ${fails} fail, ${vs.filter((v) => v.result === "n/a").length} n/a`);
  if (fails) process.exit(1);
}

if (import.meta.main) main();
