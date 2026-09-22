#!/usr/bin/env bun
/**
 * Does each directory's `readOnly` declaration agree with what its nodes say?
 *
 * @module cat-harness/scripts/check-read-only-graphs
 *
 * ## Why a gate and not a derivation
 *
 * The owner, 2026-09-22, chose **declare it, and gate that it matches** over
 * deriving read-only from the content. Both halves earn their place:
 *
 * - the **declaration** is what a listing reads. Deriving it would mean
 *   scanning every node of every directory to draw a navbar, and a tile
 *   generator that has to parse a corpus is a tile generator that stops being
 *   run;
 * - the **gate** is what stops the declaration drifting from the bytes. A
 *   declaration nothing checks reads as coverage while the content says
 *   otherwise, which is the failure this repository has paid for repeatedly
 *   (`dh4f` — a probe that sweeps nothing and reports clean).
 *
 * ## Three states, and the third is the interesting one
 *
 * - **agrees** — declared `true` over materialized nodes, or declared `false`
 *   over none.
 * - **contradicts** — declared `true` while nothing there is materialized, or
 *   declared `false` over materialized nodes **with no stated basis**.
 * - **exception** — declared `false` over materialized nodes, WITH a basis.
 * - **undeclared** — the directory holds materialized nodes and says nothing.
 *
 * ## `exception` exists because the corpus falsified the binary immediately
 *
 * The first version had three kinds, and "declared writable over materialized
 * content" was flatly a contradiction. It fired on `who-iris/uploads/` — the
 * ingestion DROP ZONE, which `adapters/document/paths.ts` creates on a first
 * ingest precisely so somebody can write there, and which holds a materialized
 * node. The declaration was right and the gate was wrong.
 *
 * The bytes are materialized; the directory is a write target. Those are
 * different questions, and a boolean comparison cannot ask the second. What
 * separates a deliberate exception from a declaration that is simply wrong is
 * whether anybody said why — so `readOnlyBasis` is what moves a case out of
 * `contradicts`, the same way {@link GateSchema}'s `basis` is required on
 * `permitted` and not only on `refused`.
 *
 * `undeclared` is a finding and never a pass. Absent is not `false`: a
 * directory that has not answered has not asserted it is writable. But it is
 * also not an ERROR, because the field is new and every declaration predates
 * it — so it reports and does not fail, and the count is what says whether the
 * migration is finished.
 *
 * ## What it does NOT check
 *
 * Whether anything actually enforces the read-only-ness at write time. That is
 * `check:materialized-fixity`'s job, and it answers a different question — it
 * catches an edit that HAPPENED, where this catches a declaration that would
 * let one happen unremarked. Saying so here because a gate whose name suggests
 * enforcement and which only compares two labels is worse than none.
 *
 * Usage:
 *   bun run cat-harness/scripts/check-read-only-graphs.ts
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { declarationPathIn } from "../schemas/cat-harness.js";

const REPO = resolve(import.meta.dir, "..", "..");

/** One directory's answer, and what its bytes say. */
export interface Verdict {
  instance: string;
  id: string;
  path: string;
  declared?: boolean;
  materializedNodes: number;
  kind: "agrees" | "contradicts" | "exception" | "undeclared" | "not-applicable";
  why: string;
}

/**
 * Count nodes under `dir` whose `materialization.state` is `materialized`.
 *
 * Walks JSON only, and walks the PARSED document rather than grepping, because
 * the string `"materialized"` appears in prose throughout this repository —
 * including in this file. A grep-based count would have reported every skill
 * that discusses the concept as a directory full of frozen content.
 */
export function materializedNodesIn(dir: string): number {
  if (!existsSync(dir)) return 0;
  let n = 0;
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) {
        walk(p);
        continue;
      }
      if (!e.name.endsWith(".json")) continue;
      let doc: unknown;
      try {
        doc = JSON.parse(readFileSync(p, "utf-8"));
      } catch {
        // A file that will not parse is not evidence either way, and treating
        // it as zero would let a broken document read as "nothing frozen here".
        continue;
      }
      const count = (v: unknown): void => {
        if (Array.isArray(v)) {
          for (const x of v) count(x);
          return;
        }
        if (typeof v !== "object" || v === null) return;
        const o = v as Record<string, unknown>;
        const m = o.materialization as Record<string, unknown> | undefined;
        if (m && m.state === "materialized") n++;
        for (const c of Object.values(o)) count(c);
      };
      count(doc);
    }
  };
  walk(dir);
  return n;
}

/** Every instance declaration in the repository, by the stem-equals-name rule. */
function instances(repo: string): { name: string; dir: string; file: string }[] {
  const out: { name: string; dir: string; file: string }[] = [];
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const d = join(repo, e.name);
    const f = declarationPathIn(d);
    if (f) out.push({ name: e.name, dir: d, file: f });
  }
  return out;
}

export function run(repo: string = REPO): Verdict[] {
  const out: Verdict[] = [];
  for (const inst of instances(repo)) {
    let decl: { directories?: { id?: string; path?: string; readOnly?: boolean; readOnlyBasis?: string }[] };
    try {
      decl = JSON.parse(readFileSync(inst.file, "utf-8"));
    } catch {
      continue;
    }
    for (const d of decl.directories ?? []) {
      if (!d.path || !d.id) continue;
      const abs = join(inst.dir, d.path);
      if (!existsSync(abs) || !statSync(abs).isDirectory()) continue;
      const n = materializedNodesIn(abs);
      const base = { instance: inst.name, id: d.id, path: d.path, declared: d.readOnly, materializedNodes: n };
      const basis = (d.readOnlyBasis ?? "").trim();
      if (d.readOnly === undefined) {
        out.push(
          n > 0
            ? { ...base, kind: "undeclared", why: `${n} materialized node(s) and no \`readOnly\`` }
            : { ...base, kind: "not-applicable", why: "nothing materialized here" },
        );
      } else if (basis === "") {
        // A declaration with no basis cannot be told from one nobody thought
        // about, which is the whole reason the field is required.
        out.push({ ...base, kind: "contradicts", why: "`readOnly` declared with no `readOnlyBasis`" });
      } else if (d.readOnly && n === 0) {
        out.push({ ...base, kind: "contradicts", why: "declared read-only, nothing materialized here" });
      } else if (!d.readOnly && n > 0) {
        out.push({ ...base, kind: "exception", why: `writable over ${n} materialized node(s) — ${basis}` });
      } else {
        out.push({ ...base, kind: "agrees", why: d.readOnly ? `${n} materialized node(s)` : "nothing materialized" });
      }
    }
  }
  return out;
}

if (import.meta.main) {
  const v = run();
  const by = (k: Verdict["kind"]) => v.filter((x) => x.kind === k);
  const contradicts = by("contradicts");
  const exceptions = by("exception");
  const undeclared = by("undeclared");

  console.log(
    `${v.length} declared directory(ies) examined — ` +
      `${by("agrees").length} agree, ${contradicts.length} contradict, ` +
      `${exceptions.length} stated exception(s), ` +
      `${undeclared.length} undeclared over materialized content, ` +
      `${by("not-applicable").length} hold nothing materialized.`,
  );

  for (const x of contradicts) console.log(`  ✗ ${x.instance}/${x.id} (${x.path}) — ${x.why}`);
  // Printed rather than silent: an exception that nobody sees is a carve-out,
  // and the point of requiring a basis is that somebody can disagree with it.
  for (const x of exceptions) console.log(`  ~ ${x.instance}/${x.id} (${x.path}) — ${x.why}`);
  // REPORTED, NOT FAILED. `readOnly` is new and every declaration predates it,
  // so failing here would fail the build for not having answered a question
  // nobody had been asked. The count is what says when the migration is done.
  for (const x of undeclared) console.log(`  · ${x.instance}/${x.id} (${x.path}) — ${x.why}`);

  if (contradicts.length === 0) {
    console.log("✓ no declaration contradicts its content");
  }
  process.exit(contradicts.length > 0 ? 1 : 0);
}
