/**
 * The evidence gathering, against real git repositories built for the purpose.
 *
 * `checks.test.ts` proves each check fires when handed the right evidence.
 * This proves the evidence is gathered correctly — and, more importantly, that
 * each way of failing to gather it produces the RIGHT ONE of the three states.
 * Those are different tests: a probe that returned `{ state: "ok", value: [] }`
 * on an unreachable branch would pass every test in the other file.
 *
 * @module test/health/probes.test
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "bun:test";

import { countConsideredOptions, doneWhenState, frontMatter, frontMatterValue, probeBranches, probeBeans, probeRepoSize, probeStaging, probeTodos } from "./probes.ts";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

function run(cwd: string, cmd: string, args: string[]): void {
  const r = spawnSync(cmd, args, { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed: ${r.stderr}`);
}

/** A throwaway repository with one commit. */
function repo(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "health-probe-"));
  made.push(dir);
  run(dir, "git", ["init", "-q", "-b", "main"]);
  run(dir, "git", ["config", "user.email", "t@example.invalid"]);
  run(dir, "git", ["config", "user.name", "T"]);
  for (const [rel, body] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, body);
  }
  run(dir, "git", ["add", "-A"]);
  run(dir, "git", ["commit", "-qm", "fixture"]);
  return dir;
}

/**
 * The branch evidence, against a real remote with a real merge in it.
 *
 * The three answers this probe can give about one branch are different facts
 * and are tested separately: **merged**, **carries unmerged work**, and **I
 * could not tell**. Collapsing the third into either of the first two is what
 * bean `w2g5` is about, and a probe that returned `mergedIntoDefault: true`
 * whenever it failed would pass any test that only looked at the two decided
 * cases.
 */
describe("probeBranches", () => {
  /** `git`, at a fixed commit date — the dates are what the frontier test turns on. */
  function runAt(cwd: string, iso: string, args: string[]): void {
    const r = spawnSync("git", args, {
      cwd,
      encoding: "utf-8",
      env: { ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso },
    });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  }

  /**
   * A remote carrying `main`, a branch merged into it, and one that is not.
   *
   * Dated deliberately and in order: `claude/merged`'s tip is BEFORE the merge
   * commit and `claude/still-going`'s is AFTER it, which is what lets the
   * shallow tests tell "the answer is unreliable" from "the answer is sound
   * even here".
   */
  function remoteWithBranches(): string {
    const dir = repo({ "a.txt": "a" });
    run(dir, "git", ["checkout", "-q", "-b", "claude/merged"]);
    writeFileSync(join(dir, "b.txt"), "b");
    run(dir, "git", ["add", "-A"]);
    runAt(dir, "2026-09-02T00:00:00Z", ["commit", "-qm", "work that landed"]);
    run(dir, "git", ["checkout", "-q", "main"]);
    // A merge COMMIT, which is how this repository merges — the tip of
    // `claude/merged` becomes an ancestor of `main`. Under squash-merge it
    // would not, and the probe would report every branch as unmerged; that is
    // stated in the check's own documentation as an assumption.
    runAt(dir, "2026-09-03T00:00:00Z", ["merge", "-q", "--no-ff", "-m", "Merge pull request #1", "claude/merged"]);
    run(dir, "git", ["checkout", "-q", "-b", "claude/still-going"]);
    writeFileSync(join(dir, "c.txt"), "c");
    run(dir, "git", ["add", "-A"]);
    runAt(dir, "2026-09-04T00:00:00Z", ["commit", "-qm", "work that has not landed"]);
    run(dir, "git", ["checkout", "-q", "main"]);
    run(dir, "git", ["config", "--bool", "core.bare", "true"]);
    return dir;
  }

  function local(remote: string): string {
    const dir = repo({ "unrelated.txt": "x" });
    run(dir, "git", ["remote", "add", "origin", remote]);
    return dir;
  }

  it("tells a merged branch from one that carries unmerged work, and dates both", () => {
    const dir = local(remoteWithBranches());
    const p = probeBranches({
      repoRoot: dir,
      remote: "origin",
      previewSlugs: ["claude-merged", "claude-still-going"],
    });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.defaultBranch).toBe("main");
    const by = new Map(p.value.candidates.map((c) => [c.ref, c]));
    expect([...by.keys()].sort()).toEqual(["claude/merged", "claude/still-going"]);
    expect(by.get("claude/merged")?.mergedIntoDefault).toBe(true);
    expect(by.get("claude/still-going")?.mergedIntoDefault).toBe(false);
    for (const c of p.value.candidates) {
      expect(c.unevaluated).toBeUndefined();
      expect(Number.isNaN(Date.parse(c.headCommittedAt ?? ""))).toBe(false);
    }
  });

  it("carries only the branches a preview slug asks about — 226 branches must not cost 226 fetches", () => {
    const dir = local(remoteWithBranches());
    const p = probeBranches({ repoRoot: dir, remote: "origin", previewSlugs: ["claude-still-going"] });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.candidates.map((c) => c.ref)).toEqual(["claude/still-going"]);
  });

  it("an empty candidate set is a DETERMINED answer, not a failure to look", () => {
    const dir = local(remoteWithBranches());
    const p = probeBranches({ repoRoot: dir, remote: "origin", previewSlugs: ["claude-no-such-branch"] });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.candidates).toEqual([]);
    expect(p.value.defaultBranch).toBe("main");
  });

  it("a remote that cannot be reached is `unknown`, never an empty candidate set", () => {
    // An empty set means "no branch answers for this preview", which sends it
    // to the orphan list. A remote that could not be asked must not produce it.
    const dir = repo({ "a.txt": "a" });
    run(dir, "git", ["remote", "add", "origin", join(dir, "no-such-remote.git")]);
    const p = probeBranches({ repoRoot: dir, remote: "origin", previewSlugs: ["claude-anything"] });
    expect(p.state).toBe("unknown");
    if (p.state !== "unknown") return;
    expect(p.reason).toContain("ls-remote");
  });

  it("is NOT blinded by a shallow fetch of a DIFFERENT branch — the `gh-pages --depth=1` case", () => {
    // `probeStaging` runs first in `gatherContext` and fetches the publish
    // branch with `--depth=1`, which writes a graft into `.git/shallow` and
    // makes `--is-shallow-repository` say yes. The default branch's own
    // history is untouched, and a guard that used that flag would report
    // every sweep blind.
    const dir = local(remoteWithBranches());
    run(dir, "git", ["fetch", "-q", "--depth=1", "origin", "claude/still-going"]);
    const p = probeBranches({ repoRoot: dir, remote: "origin", previewSlugs: ["claude-merged"] });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.candidates.find((x) => x.ref === "claude/merged")?.mergedIntoDefault).toBe(true);
  });

  it("still trusts `not merged` for a branch whose tip POSTDATES the graft boundary", () => {
    // Truncation does not condemn every answer. `claude/still-going`'s tip is
    // dated after the merge commit the shallow fetch stopped at, so a merge of
    // it would have to be inside the fetched range — the negative is a fact,
    // and blinding here would cost the check its only remaining signal on a CI
    // runner that forgot `fetch-depth: 0`.
    const dir = local(remoteWithBranches());
    run(dir, "git", ["fetch", "-q", "--depth=1", "origin", "main"]);
    const p = probeBranches({ repoRoot: dir, remote: "origin", previewSlugs: ["claude-still-going"] });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    const c = p.value.candidates.find((x) => x.ref === "claude/still-going");
    expect(c?.mergedIntoDefault).toBe(false);
    expect(c?.unevaluated).toBeUndefined();
  });

  it("refuses to call a branch unmerged when the default branch's history is truncated past its tip", () => {
    // The trap: `merge-base --is-ancestor` says "no" for a merged branch whose
    // merge point was never fetched. "No" SPARES the preview, so nothing is
    // wrongly accused — but a check that silently spares everything has
    // stopped working, and that is what this guard reports instead.
    const remote = remoteWithBranches();
    const dir = local(remote);
    run(dir, "git", ["fetch", "-q", "--depth=1", "origin", "main"]);
    const p = probeBranches({ repoRoot: dir, remote: "origin", previewSlugs: ["claude-merged"] });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    const c = p.value.candidates.find((x) => x.ref === "claude/merged");
    expect(c).toBeDefined();
    expect(c?.mergedIntoDefault).toBeUndefined();
    expect(c?.unevaluated).toContain("fetch-depth: 0");
    expect(c?.unevaluated).toContain("graft boundary");
  });
});

describe("probeStaging", () => {
  it("reads the previews and sums their blob sizes", () => {
    const dir = repo({
      "STAGING/claude-one/index.html": "x".repeat(1000),
      "STAGING/claude-one/assets/a.css": "y".repeat(500),
      "STAGING/claude-two/index.html": "z".repeat(2000),
      "index.html": "not a preview",
    });
    const p = probeStaging({ repoRoot: dir, remote: "origin", branch: "gh-pages", prefix: "STAGING", localRev: "HEAD" });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.previews.map((x) => x.slug)).toEqual(["claude-one", "claude-two"]);
    expect(p.value.previews[0].bytes).toBe(1500);
    expect(p.value.previews[0].files).toBe(2);
    expect(p.value.previews[1].bytes).toBe(2000);
  });

  it("a branch with no STAGING directory is a DETERMINED empty, not an unknown", () => {
    const dir = repo({ "index.html": "the main site" });
    const p = probeStaging({ repoRoot: dir, remote: "origin", branch: "gh-pages", prefix: "STAGING", localRev: "HEAD" });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.branch).toBe("present");
    expect(p.value.previews).toEqual([]);
  });

  it("a publish branch that positively does not exist is `ok`/`absent` — the first-deploy case", () => {
    const remote = repo({ "index.html": "main" });
    run(remote, "git", ["config", "--bool", "core.bare", "true"]);
    const dir = repo({ "a.txt": "a" });
    run(dir, "git", ["remote", "add", "origin", remote]);
    const p = probeStaging({ repoRoot: dir, remote: "origin", branch: "gh-pages", prefix: "STAGING" });
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.branch).toBe("absent");
    expect(p.value.previews).toEqual([]);
  });

  it("a remote that cannot be reached is `unknown`, and says which command failed", () => {
    const dir = repo({ "a.txt": "a" });
    run(dir, "git", ["remote", "add", "origin", join(dir, "no-such-remote-directory")]);
    const p = probeStaging({ repoRoot: dir, remote: "origin", branch: "gh-pages", prefix: "STAGING" });
    // THE test in this file. An unreachable remote must not look like a branch
    // with no previews: the first is "I could not ask", the second is an
    // answer, and `restore-staging.ts` exists because they were once the same.
    expect(p.state).toBe("unknown");
    if (p.state !== "unknown") return;
    expect(p.reason).toContain("git ls-remote");
  });
});

describe("probeRepoSize", () => {
  it("measures tracked blobs at HEAD, not the working tree", () => {
    const dir = repo({ "a.txt": "x".repeat(4096), "b/c.txt": "y".repeat(2048) });
    // An untracked file is not repository content and must not be counted.
    writeFileSync(join(dir, "untracked.bin"), "z".repeat(1_000_000));
    const p = probeRepoSize(dir);
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.trackedBytes).toBe(4096 + 2048);
    expect(p.value.gitDirBytes).toBeGreaterThan(0);
  });

  it("is `unknown` outside a repository rather than reporting a zero-byte one", () => {
    const dir = mkdtempSync(join(tmpdir(), "health-not-a-repo-"));
    made.push(dir);
    const p = probeRepoSize(dir);
    expect(p.state).toBe("unknown");
  });
});

describe("probeTodos", () => {
  it("reads the declared store, following todos.json rather than a hardcoded path", () => {
    const dir = repo({
      // The node is declared as `elsewhere`, NOT `items`. A probe that
      // hardcoded `todos/items` would read nothing here and report a clean,
      // empty store — the `dh4f` shape.
      "todos/todos.json": JSON.stringify({
        name: "fixture",
        directories: [{ id: "elsewhere", path: "elsewhere", graphKinds: ["todo-items"] }],
      }),
      "todos/elsewhere/one.md": "---\n$schema: folio-todo/v1\nid: one\nstatus: open\ncreatedAt: 2026-01-01\n---\nbody\n",
      "todos/items/decoy.md": "---\nid: decoy\nstatus: open\n---\n",
    });
    const p = probeTodos(dir);
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    expect(p.value.map((t) => t.id)).toEqual(["one"]);
  });

  it("a PRESENT but unreadable declaration is `unknown`, never a fallback to the default path", () => {
    const dir = repo({
      "todos/todos.json": "{ this is not json",
      "todos/items/one.md": "---\nid: one\nstatus: open\n---\n",
    });
    const p = probeTodos(dir);
    expect(p.state).toBe("unknown");
    if (p.state !== "unknown") return;
    expect(p.reason).toContain("todos.json");
  });
});

describe("front matter", () => {
  it("reads a quoted title, which `beans` writes whenever the value holds a colon", () => {
    const fm = frontMatter("---\n# folio-assistant-3vge\ntitle: 'Workflow failure: invisible'\nstatus: todo\n---\nbody");
    expect(fm).toBeDefined();
    expect(frontMatterValue(fm!, "title")).toBe("Workflow failure: invisible");
    expect(frontMatterValue(fm!, "status")).toBe("todo");
    expect(frontMatterValue(fm!, "updated_at")).toBeUndefined();
  });

  it("returns undefined for a file with no front matter at all", () => {
    expect(frontMatter("# just a heading\n")).toBeUndefined();
  });
});

describe("the root the sweep is given", () => {
  it("is the REPOSITORY root, not the instance root", async () => {
    // The probes above resolve their store from a declaration, and do it
    // correctly. That was not enough: `run.ts` handed them the INSTANCE root,
    // so from the moment `#437` moved the instance under `cat-harness/` both
    // stores resolved to `cat-harness/beans/defs` and
    // `cat-harness/todos/items`, neither of which exists.
    //
    // The three-state rule did its job — the sweep reported "could not be
    // evaluated" and refused to call itself clean rather than reporting an
    // empty store as healthy, which is the `dh4f` shape it exists to avoid.
    // But a check that cannot see its subject is not doing the work either,
    // and this one hid 215 inline completed beans and 449 MB of staging
    // previews until it was repointed.
    //
    // Asserted against the real tree rather than a fixture: the defect was
    // that a real path stopped existing, and a fixture would have passed
    // throughout.
    const { existsSync } = await import("node:fs");
    const { join, resolve } = await import("node:path");
    const { repoRootFor } = await import("../../schemas/cat-harness.ts");

    const instanceRoot = resolve(import.meta.dir, "..", "..");
    const repoRoot = repoRootFor(instanceRoot);

    expect(existsSync(join(repoRoot, "beans", "beans.json"))).toBe(true);
    expect(existsSync(join(instanceRoot, "beans", "beans.json"))).toBe(false);

    // And the probes actually find something when given the right one.
    const beans = probeBeans(repoRoot);
    expect(beans.state).toBe("ok");
  });
});

describe("countConsideredOptions — the parse the MADR criterion rests on", () => {
  it("returns `undefined` for a bean with no options section, never 0", () => {
    // The distinction the whole criterion depends on: a bean recording WORK has
    // no options to list, and `madr.md` says so. 0 would make every one of them
    // a malformed decision record — 172 findings on this store.
    expect(countConsideredOptions("# Work\n\nDid the thing.\n")).toBeUndefined();
  });

  it("matches the spellings this store ACTUALLY uses, not only MADR's canonical heading", () => {
    // Measured 2026-09-20: no bean here writes `## Considered options`. Both that
    // record options write `## Options, …`. A detector keyed on the canonical
    // heading alone would have had zero subjects and passed over nothing.
    for (const h of ["## Considered options", "## Options", "## Options, with what each costs", "## OPTIONS"]) {
      expect(countConsideredOptions(`${h}\n\n- a\n- b\n`)).toBe(2);
    }
  });

  it("does not read `## Optional` as an options section", () => {
    // `\b` rather than a bare prefix. Two real headings in this store start
    // "Optional" — "Provenance is not optional", "Accessibility is not optional
    // here" — and counting their bullets would invent decision records.
    expect(countConsideredOptions("## Optional extras\n\n- a\n- b\n")).toBeUndefined();
  });

  it("counts `-`, `*` and numbered items alike", () => {
    expect(countConsideredOptions("## Options\n\n1. one\n2. two\n3. three\n")).toBe(3);
    expect(countConsideredOptions("## Options\n\n* one\n* two\n")).toBe(2);
  });

  it("an option's own sub-points are not options", () => {
    // Indented items are the pros and cons OF an option — MADR's "pros and cons
    // of the options" collapsed inline, which is how the two real records here
    // are written. Counting them would report 6 options where there are 2.
    const text = "## Options\n\n- first\n  - costs a lot\n  - ships sooner\n- second\n  - free\n";
    expect(countConsideredOptions(text)).toBe(2);
  });

  it("stops at the next section, and a `###` inside an option does not end it", () => {
    const text = "## Options\n\n- one\n\n### one in detail\n\n- still under one\n\n## Decision\n\n- not an option\n";
    // TWO items counted, and each half of that matters:
    //   · `- still under one` sits after a `###`, so the sub-heading did not end
    //     the section — an option elaborated under its own heading stays inside.
    //   · `- not an option` sits after `## Decision` and is excluded, so the
    //     section really does end at the next level-2 heading.
    expect(countConsideredOptions(text)).toBe(2);
  });

  it("an options section with no items is 0 — a real, reportable count", () => {
    // Not `undefined`. The section exists, so the bean claims an analysis; that
    // it lists nothing is the finding, and it gets a different remedy from one
    // that lists a single option.
    expect(countConsideredOptions("## Options\n\n(to be decided)\n")).toBe(0);
  });

  it("takes the FIRST options section when a bean revisits the decision", () => {
    // A bean that comes back to a decision appends a second analysis. The first
    // is the record; the later one is the re-analysis, and its own later section
    // documents itself. Counting the last would let a thin original hide.
    const text = "## Options\n\n- a\n\n## Later\n\n## Options, revisited\n\n- a\n- b\n- c\n";
    expect(countConsideredOptions(text)).toBe(1);
  });

  it("the real store has SUBJECTS — a detector with none is not a detector that passed", async () => {
    // Asserted against the real bean store rather than a fixture, for the same
    // reason the staging test above is: the failure mode is the detector matching
    // nothing in practice, and every fixture in this file would pass throughout.
    const { repoRootFor } = await import("../../schemas/cat-harness.ts");
    const { resolve } = await import("node:path");
    const p = probeBeans(repoRootFor(resolve(import.meta.dir, "..", "..")));
    expect(p.state).toBe("ok");
    if (p.state !== "ok") return;
    const records = p.value.filter((b) => b.consideredOptions !== undefined);
    expect(records.length).toBeGreaterThan(0);
  });
});

describe("doneWhenState — the four states `fkjo` needs kept apart", () => {
  it("reads every Done-when spelling the store actually uses", () => {
    // 25 distinct spellings across 457 beans, measured 2026-09-21. The
    // qualifier after the two words is deliberately NOT parsed — treating
    // "REPLACES the list above" as an instruction about which list counts
    // would make this adjudicate supersession.
    for (const h of [
      "## Done when",
      "### Done when",
      "## Done when — revised",
      "## Done when — REPLACES the list above",
      "## DONE WHEN",
    ]) {
      expect(doneWhenState(`${h}\n\n- [x] a\n`)).toEqual({ kind: "all-ticked", total: 1 });
    }
  });

  it("an unticked box is an open bean, and the partial count is kept", () => {
    expect(doneWhenState("## Done when\n\n- [x] a\n- [ ] b\n")).toEqual({
      kind: "open",
      ticked: 1,
      total: 2,
    });
  });

  it("no Done-when section is `absent` — not an empty pass", () => {
    expect(doneWhenState("# Work\n\nDid the thing.\n")).toEqual({ kind: "absent" });
  });

  it("a Done-when carrying no checkbox is `unreadable` — criteria this cannot judge", () => {
    expect(doneWhenState("## Done when\n\n- a thing happens\n- another\n")).toEqual({
      kind: "unreadable",
    });
  });

  it("`unreadable` OUTRANKS a fully ticked sibling section — the `z4mq` shape", () => {
    // Bean `z4mq` carries two matching headings: its real criteria are a bullet
    // list under the first, and under `## Done when — item 3` sits a three-box
    // SUB-CHECKLIST of one item, all ticked. A body-wide `[x]` count calls it
    // finished and so does a count scoped to its Done-when sections; what
    // separates it is that one section states criteria in a form this cannot
    // read. Measured: this is the single bean between the crude sweep's 6 and
    // this parse's 4, and it was the one that was not finished at all.
    const z4mq = "## Done when\n\n\u2022 a\n\u2022 b\n\n## Done when — item 3\n\n- [x] x\n- [x] y\n- [x] z\n";
    expect(doneWhenState(z4mq)).toEqual({ kind: "unreadable" });
  });

  it("a sibling h2 ends the section, so a `## Do not` list is not read as criteria", () => {
    // Load-bearing: many beans carry a `## Do not` section written as dashes,
    // and several of those items would never be ticked. Leaking them in would
    // make every such bean permanently `open`.
    expect(doneWhenState("## Done when\n\n- [x] a\n\n## Do not\n\n- [ ] never do this\n")).toEqual({
      kind: "all-ticked",
      total: 1,
    });
  });

  it("a DEEPER heading does not end it — criteria may carry a note", () => {
    expect(doneWhenState("## Done when\n\n- [x] a\n\n#### Note\n\n- [ ] b\n")).toEqual({
      kind: "open",
      ticked: 1,
      total: 2,
    });
  });

  it("a bare `[x]` with no list marker counts — the store writes both", () => {
    expect(doneWhenState("## Done when\n\n[x] a\n[x] b\n")).toEqual({ kind: "all-ticked", total: 2 });
  });

  it("the real store yields all four states — not a parse that matches nothing", () => {
    // Vacuity guard, and the reason it is here rather than in the check: a
    // regex narrowed by a later edit would make every bean `absent`, and every
    // assertion above is a literal that would keep passing.
    const p = probeBeans(process.cwd());
    if (p.state !== "ok") return;
    const kinds = new Set(p.value.map((b) => b.doneWhen?.kind));
    expect(kinds.has("all-ticked")).toBe(true);
    expect(kinds.has("open")).toBe(true);
    expect(kinds.has("absent")).toBe(true);
    expect(kinds.has("unreadable")).toBe(true);
  });
});
