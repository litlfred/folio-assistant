#!/usr/bin/env bun
/**
 * Which open PRs' bean edits must LAND before `beans/` can leave `main`, and
 * which can simply be PORTED to `cat/cat-harness/beans` instead?
 *
 * @module scripts/bean-rollover
 * @graphNode none — a read-only report over git and the open PRs
 * @covers none — a merge-steward report: it inventories, it judges no declared graph
 *
 * ## The question, and why a count alone does not answer it
 *
 * Issue #1850 step 2 is *"land or park the PRs that change beans"*. Measured
 * with `merge:overlap` on 2026-10-02 that is **29 of 33 open PRs and 110
 * authored bean touches**, which reads as "clear the board" — weeks of merging
 * before the freeze in step 3 can even be scheduled.
 *
 * But "touches `beans/`" is three different situations wearing one number:
 *
 *   - a generated region (`beans/README.md`'s file COUNT) that is regenerated
 *     and needs nothing;
 *   - a bean whose edit `main` already carries, so the PR differs only because
 *     `main` moved on;
 *   - a bean that exists only on that PR — usually the session's own handover
 *     bean — which can be copied onto the beans branch without that PR landing
 *     at all.
 *
 * Only the last group is work, and only a group that BOTH sides edited needs a
 * person. This separates them, so the owner can schedule step 2 against a real
 * number instead of 110.
 *
 * ## Four states per authored bean path, and the fourth is never clean
 *
 * | state | meaning |
 * |---|---|
 * | `already-on-main` | the PR's version matches the base, or its patch applies in reverse to the base — the base has the change |
 * | `port` | the base has not touched this bean since the fork point, so the PR's version can be copied onto the beans branch with nothing to lose |
 * | `adjudicate` | BOTH the PR and the base changed this bean since the fork — a person picks, because either choice drops someone's edit |
 * | `could-not-determine` | git would not answer for this path. **Never reported as portable, never counted clean** |
 *
 * The third state is the one that matters for scheduling and the one a naive
 * tool would fold into the second. Porting over a bean the base also edited
 * silently destroys the base's edit, and a bean id is referenced from commits,
 * issues and other beans, so that loss is not local.
 *
 * ## What this deliberately does NOT do
 *
 * **It never writes to `cat/cat-harness/beans`.** That branch's own manifest
 * says `status: seed`, `authoritative: false`, and *"main remains the source of
 * truth until arc fs43 migrates every reader and writer; until then this branch
 * is a verified copy, not the store."* A tool that wrote there now would
 * pre-empt steps 3 to 5 of the plan and make the seed diverge from `main` in a
 * direction nothing checks. The port is a steward action, taken after the
 * freeze, against a re-copied seed.
 *
 * It also never deletes or rewrites a bean anywhere. `deletion-requires-confirmation`.
 *
 * ## Reuse, because a second classifier is a second answer
 *
 * `pathClass` and `differsOnlyInRegions` come from `merge-pipeline-paths.ts` —
 * the same functions `merge:overlap` and `merge:train` use, so this cannot
 * disagree with them about what "authored" means. The reverse-patch test for
 * "the base already carries this change" is the technique `merge:leftover`
 * established for its own `landed` verdict.
 *
 * Usage:
 *   bun run beans:rollover                      # every open PR, via gh
 *   bun run beans:rollover -- 1764 1766         # just these
 *   bun run beans:rollover -- --base origin/main --no-fetch
 *   bun run beans:rollover -- --json            # the report on stdout
 *
 * Exit 0 nothing needs porting or adjudicating · 1 some does · 2 could not
 * determine for at least one path, or the PR list could not be read.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { git, parseMemberSpec, resolveMember } from "./merge-pipeline-git.ts";
import { pathClass, differsOnlyInRegions } from "./merge-pipeline-paths.ts";

const ROOT = join(import.meta.dir, "..", "..");
const SUBGRAPH = "beans/";

type State = "already-on-main" | "port" | "adjudicate" | "could-not-determine";

interface PathVerdict {
  path: string;
  state: State;
  /** Why, in one line, so a reader need not re-derive it. */
  because: string;
}

interface PrVerdict {
  number: number | null;
  ref: string;
  head: string | null;
  authored: PathVerdict[];
  generatedRegions: string[];
  generated: string[];
  error?: string;
}

/** The blob at `ref:path`, or undefined when the path is absent there. */
function blob(ref: string, path: string): string | undefined {
  const r = git(ROOT, ["show", `${ref}:${path}`]);
  return r.ok ? r.out : undefined;
}

/**
 * Does `base` already carry the change this PR made to `path`?
 *
 * Two ways, cheapest first: the blobs are equal (or differ only inside
 * generated regions), or the PR's own patch applies in REVERSE to the base's
 * version — meaning the change is present and the files differ only because
 * the base moved on. The reverse-patch runs in a throwaway index; no working
 * tree is touched. `merge:leftover` established this test.
 */
function baseCarries(base: string, head: string, fork: string, path: string): boolean | undefined {
  const b = blob(base, path);
  const h = blob(head, path);
  if (b === undefined || h === undefined) return b === h ? true : false;
  if (b === h) return true;
  if (differsOnlyInRegions(b, h)) return true;

  const patch = git(ROOT, ["diff", `${fork}..${head}`, "--", path]);
  if (!patch.ok) return undefined;
  if (patch.out.trim() === "") return true; // the PR did not change it after all

  const dir = mkdtempSync(join(tmpdir(), "bean-rollover-"));
  try {
    const r = spawnSync(
      "git",
      ["apply", "--reverse", "--check", "--unidiff-zero", "-"],
      { cwd: ROOT, input: patch.out, env: { ...process.env, GIT_INDEX_FILE: join(dir, "idx") }, encoding: "utf-8" },
    );
    if (r.status === null) return undefined;
    return r.status === 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Did `base` itself change `path` since the fork point? */
function baseTouched(base: string, fork: string, path: string): boolean | undefined {
  const r = git(ROOT, ["diff", "--name-only", `${fork}..${base}`, "--", path]);
  if (!r.ok) return undefined;
  return r.out.trim() !== "";
}

function classify(base: string, head: string, fork: string, path: string): PathVerdict {
  const carries = baseCarries(base, head, fork, path);
  if (carries === undefined) {
    return { path, state: "could-not-determine", because: "git would not produce or test the patch for this path" };
  }
  if (carries) {
    return { path, state: "already-on-main", because: "the base carries this change; the files differ only because the base moved on" };
  }
  const touched = baseTouched(base, fork, path);
  if (touched === undefined) {
    return { path, state: "could-not-determine", because: "git would not say whether the base changed this path since the fork" };
  }
  if (touched) {
    return {
      path,
      state: "adjudicate",
      because: "both this PR and the base changed this bean since the fork — porting either way drops the other's edit",
    };
  }
  return { path, state: "port", because: "the base has not touched this bean since the fork, so the PR's version can be copied with nothing to lose" };
}

function openPrs(): Array<{ number: number; ref: string }> | undefined {
  const r = spawnSync("gh", ["api", "repos/litlfred/folio-assistant/pulls?state=open&per_page=100"], {
    encoding: "utf-8",
    cwd: ROOT,
  });
  if (r.status !== 0) return undefined;
  try {
    const d = JSON.parse(r.stdout) as Array<{ number: number; head: { ref: string } }>;
    return d.map((p) => ({ number: p.number, ref: p.head.ref }));
  } catch {
    return undefined;
  }
}

function main(): number {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const noFetch = args.includes("--no-fetch");
  const bi = args.indexOf("--base");
  const base = bi >= 0 ? args[bi + 1]! : "origin/main";
  const specs = args.filter((a) => !a.startsWith("--") && a !== base);

  let members: Array<{ number: number | null; ref: string }>;
  if (specs.length > 0) {
    members = specs.map((s) => ({ number: /^\d+$/.test(s) ? Number(s) : null, ref: s }));
  } else {
    const prs = openPrs();
    if (!prs) {
      console.error("beans:rollover: could not list the open PRs — COULD NOT DETERMINE, not a clean run.");
      return 2;
    }
    members = prs;
  }

  const verdicts: PrVerdict[] = [];
  for (const m of members) {
    const spec = parseMemberSpec(m.number ? String(m.number) : m.ref);
    const resolved = resolveMember(ROOT, spec, { fetch: !noFetch });
    if (!("sha" in resolved) || !resolved.sha) {
      verdicts.push({ number: m.number, ref: m.ref, head: null, authored: [], generatedRegions: [], generated: [], error: "head could not be resolved or fetched" });
      continue;
    }
    const head = resolved.sha;
    const fb = git(ROOT, ["merge-base", base, head]);
    if (!fb.ok) {
      verdicts.push({ number: m.number, ref: m.ref, head, authored: [], generatedRegions: [], generated: [], error: "no merge base with the base ref" });
      continue;
    }
    const fork = fb.out.trim();
    const names = git(ROOT, ["diff", "--name-only", `${fork}..${head}`, "--", SUBGRAPH]);
    if (!names.ok) {
      verdicts.push({ number: m.number, ref: m.ref, head, authored: [], generatedRegions: [], generated: [], error: "git would not list this PR's bean paths" });
      continue;
    }
    const paths = names.out.split("\n").map((s) => s.trim()).filter(Boolean);
    const v: PrVerdict = { number: m.number, ref: m.ref, head, authored: [], generatedRegions: [], generated: [] };
    for (const p of paths) {
      const cls = pathClass(p).class;
      if (cls === "generated") v.generated.push(p);
      else if (cls === "generated-regions") v.generatedRegions.push(p);
      else v.authored.push(classify(base, head, fork, p));
    }
    verdicts.push(v);
  }

  const all = verdicts.flatMap((v) => v.authored);
  const n = (s: State) => all.filter((a) => a.state === s).length;
  const undetermined = n("could-not-determine") + verdicts.filter((v) => v.error).length;

  if (json) {
    console.log(JSON.stringify({ $schema: "bean-rollover/v1", base, subgraph: SUBGRAPH, generated_at: new Date().toISOString(), summary: { prs: verdicts.length, authored: all.length, port: n("port"), adjudicate: n("adjudicate"), already_on_main: n("already-on-main"), could_not_determine: n("could-not-determine") }, prs: verdicts }, null, 2));
  } else {
    console.log(`Bean rollover inventory — #1850 step 2, against ${base}\n`);
    for (const v of verdicts.filter((x) => x.authored.length || x.error)) {
      const label = v.number ? `#${v.number}` : v.ref;
      if (v.error) {
        console.log(`  ${label.padEnd(7)} COULD NOT DETERMINE — ${v.error}`);
        continue;
      }
      const c = (s: State) => v.authored.filter((a) => a.state === s).length;
      console.log(`  ${label.padEnd(7)} ${v.authored.length} authored · port ${c("port")} · adjudicate ${c("adjudicate")} · already-on-main ${c("already-on-main")} · undetermined ${c("could-not-determine")}`);
      for (const a of v.authored.filter((x) => x.state === "adjudicate" || x.state === "could-not-determine")) {
        console.log(`            ${a.state.toUpperCase()}  ${a.path}`);
        console.log(`              ${a.because}`);
      }
    }
    console.log(`
  ${verdicts.length} PR(s) · ${all.length} authored bean path(s)
    port                ${n("port")}   copy onto the beans branch after the freeze; the PR need not land first
    adjudicate          ${n("adjudicate")}   both sides changed the bean — a person picks
    already-on-main     ${n("already-on-main")}   nothing to do
    could-not-determine ${n("could-not-determine")}   NOT portable and NOT clean`);
    console.log(`
  This REPORTS. Porting is a steward action taken after step 3's freeze, against
  a re-copied seed — never by this script, which does not write to
  cat/cat-harness/beans at all: that branch is still status:seed,
  authoritative:false, and main is the store until fs43 migrates the writers.`);
  }

  if (undetermined > 0) return 2;
  return n("port") + n("adjudicate") > 0 ? 1 : 0;
}

process.exit(main());
