/**
 * Every check is shown FIRING, not merely returning clean.
 *
 * **A checker that returns `[]` for everything passes a corpus test.** Run the
 * registry against a healthy repository and a function that does nothing is
 * indistinguishable from one that works, so "the live repo is green" proves
 * nothing about any of these. Each check therefore gets fixture evidence
 * chosen to breach each of its thresholds, and the assertion NAMES the finding
 * rather than counting them — a count passes when the wrong finding fires.
 *
 * The three states get the same treatment: a determined empty and a
 * could-not-determine are asserted separately, because collapsing them is the
 * defect the whole family exists to refuse.
 *
 * @module test/health/checks.test
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { repoRootFor } from "../../schemas/cat-harness.js";

import { describe, expect, it } from "bun:test";

import { HealthReportSchema, healthVerdict } from "../../schemas/health-report.ts";
import { hasRenderedDecision } from "./probes.ts";
import {
  BEAN_OPEN_LIMIT,
  BEAN_RESOLVED_INLINE_LIMIT,
  HEALTH_CHECKS,
  ORPHAN_THRESHOLDS,
  RECENT_COMMIT_MINUTES,
  STAGING_CRITICAL_BYTES,
  STAGING_WARN_BYTES,
  TRACKED_MAJOR_BYTES,
  TRACKED_WARN_BYTES,
  beanStoreCheck,
  formatBytes,
  repositorySizeCheck,
  runHealthChecks,
  searchIndexCheck,
  previewLiveness,
  stagingOrphanCheck,
  stagingSizeCheck,
  stagingSlug,
  todoStoreCheck,
  type BeanEvidence,
  type BranchEvidenceSet,
  type HealthContext,
  type StagingPreview,
} from "./checks.ts";

const MB = 1024 * 1024;

/** A context in which every probe succeeded and every store is healthy. */
function healthyContext(over: Partial<HealthContext> = {}): HealthContext {
  return {
    now: new Date("2026-09-19T12:00:00Z"),
    subject: "litlfred/folio-assistant",
    staging: {
      state: "ok",
      value: { branch: "present", previews: [{ slug: "claude-a", bytes: 10 * MB, files: 5 }], command: "fixture" },
    },
    openPrHeads: { state: "ok", value: ["claude/a"] },
    branches: { state: "ok", value: { candidates: [], defaultBranch: "main", command: "fixture" } },
    repoSize: { state: "ok", value: { gitDirBytes: 20 * MB, trackedBytes: 10 * MB, packs: 1, packBytes: 18 * MB } },
    beans: {
      state: "ok",
      value: [{ id: "b1", title: "one", status: "todo" }],
    },
    todos: { state: "ok", value: [{ id: "t1", status: "open", createdAt: "2026-09-18" }] },
    // Well under the 10 MiB budget, so a healthy context stays healthy — the
    // real measured value is 3.44 MiB (bean `eof6`).
    searchIndex: { state: "ok", value: { bytes: 3_605_319, url: "https://example.invalid/search-data.json", command: "HEAD https://example.invalid/search-data.json" } },
    ...over,
  };
}

function previews(n: number, each: number): StagingPreview[] {
  return Array.from({ length: n }, (_, i) => ({ slug: `claude-p${i}`, bytes: each, files: 700 }));
}

/** Findings named by the metric they breached — assert by naming, not counting. */
function metrics(r: { findings: { metric?: string }[] }): (string | undefined)[] {
  return r.findings.map((f) => f.metric);
}

describe("staging-preview-size", () => {
  it("fires at `major` on the owner's 500 MB threshold", () => {
    // FOURTEEN previews at the size measured on gh-pages (36.7–37.6 MB each).
    //
    // It was three, against a 100 MB threshold. The owner raised it to 500 MB
    // on 2026-09-20 together with `folio-assistant-1feu`, which made a merged
    // pull request's preview go away automatically. That is what changed the
    // meaning: the total used to be MONOTONIC, so any threshold was breached
    // once and stayed breached; now the store drains and what remains is
    // bounded by concurrent reviews. 500 MB is about thirteen of them, so
    // fourteen is the first breach.
    const r = stagingSizeCheck(healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: previews(14, 37 * MB), command: "fixture" } },
    }));
    expect(r.state).toBe("finding");
    expect(metrics(r)).toEqual(["staging-total-bytes"]);
    expect(r.findings[0].severity).toBe("major");
    expect(r.findings[0].summary).toContain("518.0 MB");
    // The action never removes anything — it asks.
    expect(r.findings[0].action).toContain("staging:cleanup");
  });

  it("thirteen concurrent reviews is UNDER the threshold — the number means a concurrency", () => {
    // The point of the raise. Thirteen at ~37 MB is 481 MB: this repository's
    // realistic ceiling of simultaneous open reviews should not read as a
    // finding, or the signal is a permanent verdict again rather than news.
    const r = stagingSizeCheck(healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: previews(13, 37 * MB), command: "fixture" } },
    }));
    expect(r.state).toBe("ok");
  });

  it("escalates to `critical` past three-quarters of the Pages limit, and reports ONE breach not two", () => {
    const r = stagingSizeCheck(healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: previews(21, 37 * MB), command: "fixture" } },
    }));
    expect(r.state).toBe("finding");
    // 777 MB is over BOTH thresholds. One finding, not two: otherwise the
    // count would track how many thresholds happen to be declared.
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].severity).toBe("critical");
    expect(STAGING_CRITICAL_BYTES).toBeGreaterThan(STAGING_WARN_BYTES);
  });

  it("a branch that was read and carries no previews is a determined `ok`", () => {
    const r = stagingSizeCheck(healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: [], command: "fixture" } },
    }));
    expect(r.state).toBe("ok");
    expect(r.measurements.find((m) => m.metric === "staging-total-bytes")?.value).toBe(0);
  });

  it("an unreadable publish branch is `unknown` — never 0 MB of previews", () => {
    const r = stagingSizeCheck(healthyContext({
      staging: { state: "unknown", reason: "git ls-remote origin gh-pages exited 128: could not read Username" },
    }));
    expect(r.state).toBe("unknown");
    expect(r.reason).toContain("ls-remote");
    // The distinction that matters: no measurement was invented to stand in.
    expect(r.measurements).toHaveLength(0);
    expect(r.findings).toHaveLength(0);
  });
});

describe("staging-preview-orphans", () => {
  it("names the preview whose PR is closed, and leaves the open one alone", () => {
    const r = stagingOrphanCheck(healthyContext({
      staging: {
        state: "ok",
        value: {
          branch: "present",
          previews: [
            { slug: "claude-live", bytes: 37 * MB, files: 700 },
            { slug: "claude-merged-last-week", bytes: 36 * MB, files: 690 },
          ],
          command: "fixture",
        },
      },
      openPrHeads: { state: "ok", value: ["claude/live"] },
    }));
    expect(r.state).toBe("finding");
    expect(r.findings.map((f) => f.summary)).toEqual([
      expect.stringContaining("STAGING/claude-merged-last-week"),
    ]);
    expect(r.findings[0].severity).toBe("minor");
    expect(r.findings[0].action).toContain("Ask the owner");
  });

  it("is `unknown` when the PR list could not be fetched, rather than calling every preview an orphan", () => {
    const r = stagingOrphanCheck(healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: previews(6, 37 * MB), command: "fixture" } },
      openPrHeads: { state: "unknown", reason: "GitHub API returned 403 for litlfred/folio-assistant/pulls" },
    }));
    expect(r.state).toBe("unknown");
    expect(r.findings).toHaveLength(0);
    expect(r.reason).toContain("403");
  });

  it("agrees with `feature-staging.yml`'s own sed pipeline, branch for branch", () => {
    // A CHECKED duplication, in the idiom `check:harness-dirs` uses for
    // `.beans.yml`: the rule is written in sed inside the workflow and in
    // TypeScript here, and it cannot be written once because one runs in a
    // shell step and the other in this process. What can be avoided is an
    // UNCHECKED duplication — a drift here would make the orphan check name
    // the wrong preview, on a finding whose action invites removal.
    const wf = readFileSync(resolve(repoRootFor(resolve(import.meta.dir, "..", "..")), ".github/workflows/feature-staging.yml"), "utf-8");
    const pipelines = [...wf.matchAll(/SLUG=\$\(echo "\$BRANCH" \| (.+)\)$/gm)].map((m) => m[1]);
    // Both occurrences, so a fix applied to one of them is caught.
    expect(pipelines.length).toBeGreaterThanOrEqual(2);
    expect(new Set(pipelines).size).toBe(1);

    for (const branch of [
      "claude/health-checks",
      "feat/a//b",
      "-lead-and-trail-",
      "release/v1.2.3",
      // ASCII only, deliberately: `sed`'s `[^a-zA-Z0-9._-]` is byte-oriented
      // or character-oriented depending on the locale, so a non-ASCII branch
      // name would make this test's verdict a fact about `LC_ALL` rather than
      // about either implementation. A failure nobody can act on is worse
      // than a gap.
      "a__b--c",
    ]) {
      const r = spawnSync("bash", ["-c", `echo "$1" | ${pipelines[0]}`, "_", branch], { encoding: "utf-8" });
      expect(r.status).toBe(0);
      expect(stagingSlug(branch)).toBe(r.stdout.trim());
    }
  });

  it("slugifies the branch the way feature-staging.yml does, and only forwards", () => {
    expect(stagingSlug("claude/health-checks")).toBe("claude-health-checks");
    expect(stagingSlug("feat/a//b")).toBe("feat-a-b");
    expect(stagingSlug("-lead-and-trail-")).toBe("lead-and-trail");
    // `claude/a-b` and `claude-a-b` collide, which is exactly why the check
    // never tries to recover a branch name from a directory name.
    expect(stagingSlug("claude/a-b")).toBe(stagingSlug("claude-a-b"));
  });
});

/**
 * The liveness signals, one at a time and then together.
 *
 * **Every test here names the preview it is about.** A count would pass while
 * the wrong preview was spared, and sparing the wrong one is how a live
 * collaborator's review artefact gets proposed for removal — which is the
 * failure bean `w2g5` reports and the only one this check must never produce.
 *
 * `NOW` and the fixture dates are chosen so each test turns on ONE difference
 * from the one before it.
 */
describe("staging-preview-orphans — liveness", () => {
  const NOW = new Date("2026-09-19T12:00:00Z");

  function branchSet(over: Partial<BranchEvidenceSet> = {}): BranchEvidenceSet {
    return { candidates: [], defaultBranch: "main", command: "fixture", ...over };
  }

  /** A context whose only preview is `slug`, with the branches and PRs given. */
  function withPreview(
    slug: string,
    openPrHeads: string[],
    branches: BranchEvidenceSet,
    extra: StagingPreview[] = [],
  ): HealthContext {
    return healthyContext({
      now: NOW,
      staging: {
        state: "ok",
        value: {
          branch: "present",
          previews: [{ slug, bytes: 37 * MB, files: 700 }, ...extra],
          command: "fixture",
        },
      },
      openPrHeads: { state: "ok", value: openPrHeads },
      branches: { state: "ok", value: branches },
    });
  }

  describe("each signal, firing on its own", () => {
    it("`open-pr` spares a preview whose branch is merged and long idle", () => {
      const l = previewLiveness(
        "claude-live",
        ["claude/live"],
        branchSet({
          candidates: [{ ref: "claude/live", mergedIntoDefault: true, headCommittedAt: "2026-08-01T00:00:00Z" }],
        }),
        NOW,
      );
      expect(l.slug).toBe("claude-live");
      expect(l.live).toEqual(["open-pr"]);
    });

    it("`unmerged-branch` spares a preview with no PR whose branch carries work not in `main`", () => {
      const l = previewLiveness(
        "claude-carries-work",
        [],
        branchSet({
          candidates: [
            // Three days idle: far outside the recency horizon, so this is the
            // unmerged signal alone and nothing else.
            { ref: "claude/carries-work", mergedIntoDefault: false, headCommittedAt: "2026-09-16T12:00:00Z" },
          ],
        }),
        NOW,
      );
      expect(l.live).toEqual(["unmerged-branch"]);
    });

    it("`recent-commit` spares a preview in the gap between one PR merging and the next — the window nothing else covers", () => {
      // The shape of the gap: the merge commit has put the branch back INSIDE
      // `main`, so `unmerged-branch` is silent, and the next PR does not exist
      // yet, so `open-pr` is silent too. Only recency is left.
      const l = previewLiveness(
        "claude-between-prs",
        [],
        branchSet({
          candidates: [
            { ref: "claude/between-prs", mergedIntoDefault: true, headCommittedAt: "2026-09-19T11:55:00Z" },
          ],
        }),
        NOW,
      );
      expect(l.live).toEqual(["recent-commit"]);
    });

    it("stops sparing on recency one minute past the horizon, and the horizon is the declared threshold", () => {
      const at = (minutesAgo: number): string => new Date(NOW.getTime() - minutesAgo * 60_000).toISOString();
      const judge = (minutesAgo: number) =>
        previewLiveness(
          "claude-idle",
          [],
          branchSet({
            candidates: [{ ref: "claude/idle", mergedIntoDefault: true, headCommittedAt: at(minutesAgo) }],
          }),
          NOW,
        );
      expect(judge(RECENT_COMMIT_MINUTES - 1).live).toEqual(["recent-commit"]);
      expect(judge(RECENT_COMMIT_MINUTES).live).toEqual(["recent-commit"]);
      expect(judge(RECENT_COMMIT_MINUTES + 1).live).toEqual([]);
      // The number in the report is the number the code compares against.
      const t = ORPHAN_THRESHOLDS.find((x) => x.metric === "preview-branch-idle-minutes");
      expect(t?.value).toBe(RECENT_COMMIT_MINUTES);
      expect(t?.unit).toBe("minutes");
      expect(t?.basis).toContain("NO EXTERNAL STANDARD");
    });

    it("a tip dated in the future reads as recent, because clock skew must not convict", () => {
      const l = previewLiveness(
        "claude-skewed",
        [],
        branchSet({
          candidates: [{ ref: "claude/skewed", mergedIntoDefault: true, headCommittedAt: "2026-09-19T12:30:00Z" }],
        }),
        NOW,
      );
      expect(l.live).toEqual(["recent-commit"]);
    });
  });

  it("does NOT report the `claude-brave-hypatia-r820sf` shape — the regression this was rewritten for", () => {
    // Bean `w2g5`, measured 2026-09-19: no open pull request (all five of its
    // PRs closed), the branch present on the remote, NOT an ancestor of
    // `main`, and a 343-line commit two minutes before the sweep ran. The old
    // check named it an orphan and invited a person to remove a live
    // collaborator's review artefact.
    const ctx = withPreview(
      "claude-brave-hypatia-r820sf",
      [],
      branchSet({
        candidates: [
          {
            ref: "claude/brave-hypatia-r820sf",
            mergedIntoDefault: false,
            headCommittedAt: "2026-09-19T11:58:00Z",
          },
        ],
      }),
    );
    const r = stagingOrphanCheck(ctx);
    expect(r.state).toBe("ok");
    expect(r.findings).toEqual([]);
    // Named rather than counted: the slug must appear in nothing a reader is
    // invited to act on. (It appears in the threshold's `basis`, which is the
    // measurement this horizon was calibrated from, and that is the point.)
    expect(JSON.stringify(r.findings)).not.toContain("brave-hypatia");
    expect(r.measurements.find((m) => m.metric === "staging-orphan-count")?.value).toBe(0);
    expect(r.measurements.find((m) => m.metric === "staging-live-count")?.value).toBe(1);
    // The regression made visible rather than implied: the signal the OLD
    // check relied on is silent here — there is no open pull request — and
    // the preview is spared anyway, by the two signals that did not exist.
    const l = previewLiveness("claude-brave-hypatia-r820sf", [], ctx.branches.state === "ok" ? ctx.branches.value : branchSet(), NOW);
    expect(l.live).not.toContain("open-pr");
    expect(l.undetermined).toBeUndefined();
    // And both signals that spared it are visible, not just the verdict.
    expect(previewLiveness("claude-brave-hypatia-r820sf", [], ctx.branches.state === "ok" ? ctx.branches.value : branchSet(), NOW).live)
      .toEqual(["unmerged-branch", "recent-commit"]);
  });

  it("STILL reports a genuinely dead preview — merged, no PR, long idle", () => {
    const r = stagingOrphanCheck(
      withPreview(
        "claude-merged-last-week",
        [],
        branchSet({
          candidates: [
            { ref: "claude/merged-last-week", mergedIntoDefault: true, headCommittedAt: "2026-09-08T09:00:00Z" },
          ],
        }),
      ),
    );
    expect(r.state).toBe("finding");
    expect(r.findings.map((f) => f.summary)).toEqual([
      expect.stringContaining("STAGING/claude-merged-last-week"),
    ]);
    // The evidence travels with the name, so a reader can see WHICH signals were silent.
    expect(r.findings[0].summary).toContain("no open pull request");
    expect(r.findings[0].summary).toContain("already in `main`");
    expect(r.findings[0].summary).toContain("11 days");
    expect(r.measurements.find((m) => m.metric === "staging-orphan-count")?.value).toBe(1);
  });

  it("reports a preview no branch on the remote answers for — a determined empty is not a blind spot", () => {
    // The branch was deleted after its merge. The remote WAS listed and
    // nothing on it slugifies to this preview, which is an answer, not a
    // failure to look.
    const r = stagingOrphanCheck(withPreview("claude-branch-gone", [], branchSet({ candidates: [] })));
    expect(r.state).toBe("finding");
    expect(r.findings[0].summary).toContain("STAGING/claude-branch-gone");
    expect(r.findings[0].summary).toContain("no branch on the remote slugifies to it");
  });

  it("names the remedy a person can actually invoke, since the label alone cannot reach a closed PR", () => {
    const r = stagingOrphanCheck(withPreview("claude-branch-gone", [], branchSet()));
    const action = r.findings[0].action;
    expect(action).toContain("staging:cleanup");
    expect(action).toContain("cleanup_slug: claude-branch-gone");
    expect(action).toContain("cleanup_confirm: claude-branch-gone");
    expect(action).toContain("Leaving it is a valid answer");
    // Nothing in this check ever removes anything.
    expect(action).not.toMatch(/\brm -rf\b/);
  });

  describe("a signal that cannot be evaluated", () => {
    const blindBranch = {
      ref: "claude/unreadable",
      headCommittedAt: "2026-09-08T09:00:00Z",
      unevaluated: "git merge-base --is-ancestor exited 128: bad object",
    };

    it("sends that preview to `unknown`, never to the orphan list", () => {
      const r = stagingOrphanCheck(
        withPreview("claude-unreadable", [], branchSet({ candidates: [blindBranch] })),
      );
      expect(r.state).toBe("unknown");
      expect(r.findings).toEqual([]);
      expect(r.reason).toContain("STAGING/claude-unreadable");
      expect(r.reason).toContain("bad object");
    });

    it("takes the WHOLE check to `unknown`, and still names the orphan it had determined", () => {
      // `unknown` outranks `findings` at every level of this family —
      // `healthVerdict` one layer up, `probeStaging` one layer down. A blind
      // check must not hide behind a sighted one; the determined orphan is
      // named in the reason so the measurement is not lost either.
      const r = stagingOrphanCheck(
        withPreview("claude-unreadable", [], branchSet({ candidates: [blindBranch] }), [
          { slug: "claude-clearly-dead", bytes: 36 * MB, files: 690 },
        ]),
      );
      expect(r.state).toBe("unknown");
      expect(r.findings).toEqual([]);
      expect(r.reason).toContain("STAGING/claude-clearly-dead");
      expect(r.reason).toContain("Determined but NOT reported");
    });

    it("does not blind a preview another signal has already spared", () => {
      // Liveness is a disjunction: one true disjunct settles it, so an
      // unreadable ancestry cannot turn "leave it alone" into "I do not know".
      const l = previewLiveness("claude-unreadable", ["claude/unreadable"], branchSet({ candidates: [blindBranch] }), NOW);
      expect(l.live).toEqual(["open-pr"]);
      expect(l.undetermined).toBeUndefined();
    });

    it("is `unknown` when the branches could not be listed at all, rather than calling every preview an orphan", () => {
      const r = stagingOrphanCheck(
        healthyContext({
          staging: { state: "ok", value: { branch: "present", previews: previews(6, 37 * MB), command: "fixture" } },
          openPrHeads: { state: "ok", value: [] },
          branches: { state: "unknown", reason: "git ls-remote --heads origin exited 128: could not read Username" },
        }),
      );
      expect(r.state).toBe("unknown");
      expect(r.findings).toEqual([]);
      expect(r.reason).toContain("ls-remote");
      expect(r.reason).toContain("w2g5");
    });
  });
});

describe("repository-size", () => {
  it("fires `minor` past the 250 MB early-warning point", () => {
    const r = repositorySizeCheck(healthyContext({
      repoSize: {
        state: "ok",
        value: { gitDirBytes: 300 * MB, trackedBytes: TRACKED_WARN_BYTES + MB, packs: 1, packBytes: 290 * MB },
      },
    }));
    expect(metrics(r)).toEqual(["tracked-tree-bytes"]);
    expect(r.findings[0].severity).toBe("minor");
  });

  it("fires `major` past GitHub's documented 1 GB recommendation", () => {
    const r = repositorySizeCheck(healthyContext({
      repoSize: {
        state: "ok",
        value: { gitDirBytes: 2000 * MB, trackedBytes: TRACKED_MAJOR_BYTES + MB, packs: 1, packBytes: 1900 * MB },
      },
    }));
    expect(r.findings.find((f) => f.metric === "tracked-tree-bytes")?.severity).toBe("major");
  });

  it("fires on the history-to-tree ratio — this repository's own shape on 2026-09-19", () => {
    // 349 MB of .git against 29 MB of blobs at HEAD: 12.0x.
    const r = repositorySizeCheck(healthyContext({
      repoSize: { state: "ok", value: { gitDirBytes: 349 * MB, trackedBytes: 29 * MB, packs: 42, packBytes: 308 * MB } },
    }));
    expect(metrics(r)).toEqual(["git-dir-to-tree-ratio"]);
    expect(r.findings[0].summary).toContain("12.0x");
    // It sends the reader to `git gc` FIRST, because a high pack count is
    // local housekeeping and moves the number without history changing.
    expect(r.findings[0].action).toContain("git gc");
  });

  it("does not fire the ratio on a small clone, however lopsided", () => {
    const r = repositorySizeCheck(healthyContext({
      repoSize: { state: "ok", value: { gitDirBytes: 2 * MB, trackedBytes: 0.1 * MB, packs: 1, packBytes: 2 * MB } },
    }));
    expect(r.state).toBe("ok");
  });

  it("is `unknown` when git could not be asked", () => {
    const r = repositorySizeCheck(healthyContext({
      repoSize: { state: "unknown", reason: "git count-objects -v exited 128" },
    }));
    expect(r.state).toBe("unknown");
    expect(r.measurements).toHaveLength(0);
  });
});

describe("bean-rendered-decision-records", () => {
  // Bean `hajp`, 2026-09-21. `bean-decision-records` counts beans with an
  // `## Options` heading; the gating condition it was read against wanted
  // decisions put THROUGH `DecisionRequestSchema`. Measured on the live store:
  // 10 of the first, 0 of the second. A threshold over the wrong population
  // cannot be met meaningfully and would have been read as met.
  it("an `## Options` heading is NOT a rendered decision", () => {
    expect(hasRenderedDecision("## Options\n\n1. **A** — do a thing\n2. **B** — do another")).toBe(false);
  });

  it("all five rows are required — four is not a rendered decision", () => {
    const four = [
      "| **What it does** | x |",
      "| **Pro** | x |",
      "| **Con** | x |",
      "| **Downstream** | x |",
    ].join("\n");
    expect(hasRenderedDecision(four)).toBe(false);
  });

  it("the table `renderDecision` emits is recognised", () => {
    const table = [
      "| | **a** *(recommended)* | b |",
      "|---|---|---|",
      "| **What it does** | x | y |",
      "| **Pro** | x | y |",
      "| **Con** | x | y |",
      "| **Downstream** | x | y |",
      "| **Reversibility** | x | y |",
    ].join("\n");
    expect(hasRenderedDecision(table)).toBe(true);
  });
});

describe("bean-store", () => {
  const bean = (o: Partial<BeanEvidence> & { id: string }): BeanEvidence => ({
    title: `title ${o.id}`,
    status: "todo",
    ...o,
  });

  it("fires `major` on a duplicate title — the 14,688-duplicate shape, at its leading edge", () => {
    const r = beanStoreCheck(healthyContext({
      beans: {
        state: "ok",
        value: [
          bean({ id: "aaaa", title: "Drain the exposition swarm" }),
          bean({ id: "bbbb", title: "drain the exposition swarm" }),
          bean({ id: "cccc", title: "Something else" }),
        ],
      },
    }));
    expect(metrics(r)).toEqual(["bean-duplicate-title-groups"]);
    expect(r.findings[0].severity).toBe("major");
    expect(r.findings[0].summary).toContain("aaaa, bbbb");
    // The action is `scrapped`, and it says outright not to delete.
    expect(r.findings[0].action).toContain("scrapped");
    expect(r.findings[0].action).toContain("Never `beans delete`");
  });

  it("fires on a decision record listing ONE option — MADR's refusal, made checkable", () => {
    // `madr.md`: "never fewer than two considered options — one option is not a
    // choice". THE FALSIFIER FOR THE WHOLE CRITERION: over the real store this
    // fires on nothing (2 records, both with 3 options), so without this the
    // detector could have been broken in either direction and still looked clean.
    const r = beanStoreCheck(healthyContext({
      beans: {
        state: "ok",
        value: [
          bean({ id: "aaaa", title: "Pick a serialisation", consideredOptions: 1 }),
          bean({ id: "bbbb", title: "Ordinary work, no decision" }),
        ],
      },
    }));
    expect(metrics(r)).toEqual(["bean-thin-decision-records"]);
    expect(r.findings[0].severity).toBe("minor");
    expect(r.findings[0].summary).toContain("one option");
    // The action must offer the methodology's OWN escape — say why no
    // alternative existed — and must refuse the shortcut, or an agent reading it
    // will pad the list to two and the check will have made the record worse.
    expect(r.findings[0].action).toContain("WHY NO ALTERNATIVE EXISTED");
    expect(r.findings[0].action).toContain("Never invent a straw option");
  });

  it("an options section with NO items reads differently from one with a single option", () => {
    // Zero is not a smaller version of one. An empty section claims an analysis
    // that did not happen, and the remedy is the opposite — drop the section, or
    // fill it — so the two cannot share an action.
    const r = beanStoreCheck(healthyContext({
      beans: { state: "ok", value: [bean({ id: "aaaa", consideredOptions: 0 })] },
    }));
    expect(r.findings[0].summary).toContain("no options");
    expect(r.findings[0].action).toContain("or drop the section");
  });

  it("a bean with no options section is NOT a malformed decision record", () => {
    // The third state, and the one the check is likeliest to get wrong: most
    // beans record WORK, and `madr.md` says a work bean needs no such section.
    // Reading `undefined` as 0 would make all 172 of them findings.
    const r = beanStoreCheck(healthyContext({
      beans: {
        state: "ok",
        value: [bean({ id: "aaaa" }), bean({ id: "bbbb", consideredOptions: undefined })],
      },
    }));
    expect(metrics(r)).toEqual([]);
    const m = r.measurements.find((x) => x.metric === "bean-decision-records");
    expect(m?.value).toBe(0);
  });

  it("the SUBJECT COUNT is reported, so a detector that stops matching is not green", () => {
    // Nothing thresholds `bean-decision-records`, and it is emitted anyway. The
    // finding above can only fire on a bean this counts, so if the heading regex
    // is narrowed or a heading respelled, this drops to 0 rather than the check
    // passing over an empty walk — the trap `NoCheckScriptsFound` refuses one
    // layer along. Measured on the real store 2026-09-20: 2 subjects, 0 thin.
    const r = beanStoreCheck(healthyContext({
      beans: {
        state: "ok",
        value: [
          bean({ id: "aaaa", consideredOptions: 3 }),
          bean({ id: "bbbb", consideredOptions: 2 }),
          bean({ id: "cccc" }),
        ],
      },
    }));
    expect(metrics(r)).toEqual([]);
    expect(r.measurements.find((x) => x.metric === "bean-decision-records")?.value).toBe(2);
    expect(r.measurements.find((x) => x.metric === "bean-thin-decision-records")?.value).toBe(0);
  });

  describe("a claim its own criteria say is finished — `fkjo`", () => {
    it("fires `minor` on an in-progress bean with every Done-when box ticked", () => {
      const r = beanStoreCheck(healthyContext({
        beans: {
          state: "ok",
          value: [
            bean({ id: "done", status: "in-progress", doneWhen: { kind: "all-ticked", total: 4 } }),
            bean({ id: "open", status: "in-progress", doneWhen: { kind: "open", ticked: 3, total: 4 } }),
          ],
        },
      }));
      expect(metrics(r)).toEqual(["bean-self-declared-done"]);
      expect(r.findings[0]!.summary).toContain("all 4 of its Done-when boxes ticked");
      // The action must not tell anybody to close it. `bean-coordination` closes
      // on evidence re-derived, never on the bean's own claim about itself, and
      // four of six such beans in the measurement had NOT all landed cleanly.
      expect(r.findings[0]!.action).toContain("RE-DERIVE");
    });

    it("says nothing about a bean that is ticked but NOT claimed", () => {
      // A completed bean has every box ticked by construction. The finding is
      // about the disagreement between body and front matter, so with no claim
      // there is nothing to disagree with.
      const r = beanStoreCheck(healthyContext({
        beans: {
          state: "ok",
          value: [bean({ id: "shut", status: "completed", doneWhen: { kind: "all-ticked", total: 2 } })],
        },
      }));
      expect(metrics(r)).toEqual([]);
    });

    it("counts, and never reports, the two states it cannot judge", () => {
      // The `dh4f` rule: a clean run over a corpus the tool could not read is
      // worse than no run. `absent` and `unreadable` are measured so a person
      // can see how much of the store this check is blind to, and neither is
      // folded into the pass OR into the finding.
      const r = beanStoreCheck(healthyContext({
        beans: {
          state: "ok",
          value: [
            bean({ id: "none", status: "in-progress", doneWhen: { kind: "absent" } }),
            bean({ id: "prose", status: "in-progress", doneWhen: { kind: "unreadable" } }),
          ],
        },
      }));
      expect(metrics(r)).toEqual([]);
      const m = (k: string) => r.measurements.find((x) => x.metric === k)?.value;
      expect(m("bean-claimed-criteria-absent")).toBe(1);
      expect(m("bean-claimed-criteria-unreadable")).toBe(1);
      expect(m("bean-self-declared-done")).toBe(0);
    });

    it("reports the denominator, so a detector that stops matching is visible", () => {
      // A heading respelled or the regex narrowed makes every bean `undefined`
      // here. That must read as "this check saw nothing" rather than as a green
      // tick — which it can only do if the subject count is on the record.
      const r = beanStoreCheck(healthyContext({
        beans: {
          state: "ok",
          value: [
            bean({ id: "aaaa", status: "in-progress" }),
            bean({ id: "bbbb", status: "in-progress" }),
          ],
        },
      }));
      expect(metrics(r)).toEqual([]);
      expect(r.measurements.find((x) => x.metric === "bean-claimed-with-criteria")?.value).toBe(0);
      expect(r.measurements.find((x) => x.metric === "bean-claimed")?.value).toBe(2);
    });
  });

  it("fires `minor` on a claim nobody has honoured for a fortnight", () => {
    const r = beanStoreCheck(healthyContext({
      beans: {
        state: "ok",
        value: [
          bean({ id: "stale", status: "in-progress", updatedAt: "2026-08-01T00:00:00Z" }),
          bean({ id: "fresh", status: "in-progress", updatedAt: "2026-09-18T00:00:00Z" }),
        ],
      },
    }));
    expect(metrics(r)).toEqual(["bean-stale-in-progress"]);
    expect(r.findings[0].summary).toContain("`stale`");
    expect(r.findings[0].summary).toContain("49 days");
  });

  it("an `in-progress` bean with no timestamp is not reported as stale", () => {
    // A missing date is not an old one. Guessing here would report a fresh
    // claim as abandoned, which is a false accusation against a sibling.
    const r = beanStoreCheck(healthyContext({
      beans: { state: "ok", value: [bean({ id: "undated", status: "in-progress" })] },
    }));
    expect(r.state).toBe("ok");
  });

  it("fires on resolved beans still inline, and the action MOVES rather than deletes", () => {
    const value = Array.from({ length: BEAN_RESOLVED_INLINE_LIMIT + 1 }, (_, i) =>
      bean({ id: `c${i}`, title: `done ${i}`, status: "completed" }),
    );
    const r = beanStoreCheck(healthyContext({ beans: { state: "ok", value } }));
    expect(metrics(r)).toEqual(["bean-resolved-inline"]);
    expect(r.findings[0].action).toContain("beans archive");
    expect(r.findings[0].action).toContain("MOVES");
  });

  it("fires on an open backlog past the calibration point", () => {
    const value = Array.from({ length: BEAN_OPEN_LIMIT + 1 }, (_, i) => bean({ id: `o${i}`, title: `open ${i}` }));
    const r = beanStoreCheck(healthyContext({ beans: { state: "ok", value } }));
    expect(metrics(r)).toEqual(["bean-open"]);
  });

  it("is `unknown` when the store could not be read", () => {
    const r = beanStoreCheck(healthyContext({
      beans: { state: "unknown", reason: "beans/beans.json could not be read" },
    }));
    expect(r.state).toBe("unknown");
  });
});

describe("todo-store", () => {
  it("fires on a todo left open for a quarter", () => {
    const r = todoStoreCheck(healthyContext({
      todos: { state: "ok", value: [{ id: "old", status: "open", createdAt: "2026-01-01" }] },
    }));
    expect(metrics(r)).toEqual(["todo-stale-days"]);
    expect(r.findings[0].action).toContain("only they");
  });

  it("fires on too many open todos, and does not count the closed ones", () => {
    const open = Array.from({ length: 26 }, (_, i) => ({ id: `o${i}`, status: "open" }));
    const closed = Array.from({ length: 50 }, (_, i) => ({ id: `d${i}`, status: "done" }));
    const r = todoStoreCheck(healthyContext({ todos: { state: "ok", value: [...open, ...closed] } }));
    expect(metrics(r)).toEqual(["todo-open"]);
    expect(r.measurements.find((m) => m.metric === "todo-open")?.value).toBe(26);
  });

  it("an empty todo store is a determined `ok`, unlike an empty bean store", () => {
    const r = todoStoreCheck(healthyContext({ todos: { state: "ok", value: [] } }));
    expect(r.state).toBe("ok");
  });
});

describe("the registry and the report", () => {
  it("every registered id has a check that answers to it", () => {
    const ran = runHealthChecks(healthyContext());
    expect(ran.map((r) => r.id).sort()).toEqual(HEALTH_CHECKS.map((c) => c.id).sort());
  });

  it("every threshold states its basis", () => {
    // The structural half is in the schema; this is the corpus half — no
    // shipped check may carry a bare number.
    for (const r of runHealthChecks(healthyContext())) {
      for (const t of r.thresholds) {
        expect(t.basis.length).toBeGreaterThan(40);
      }
    }
  });

  it("every finding names something a person does", () => {
    const ctx = healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: previews(6, 37 * MB), command: "fixture" } },
      openPrHeads: { state: "ok", value: [] },
      repoSize: { state: "ok", value: { gitDirBytes: 349 * MB, trackedBytes: 29 * MB, packs: 42, packBytes: 308 * MB } },
    });
    const findings = runHealthChecks(ctx).flatMap((r) => r.findings);
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) expect(f.action.length).toBeGreaterThan(20);
  });

  it("one `unknown` takes the whole verdict to unknown, even beside findings", () => {
    // The precedence that matters: a sweep blind on one check has not cleared
    // the others, so `unknown` outranks `findings`.
    expect(healthVerdict([{ state: "ok" }, { state: "finding" }, { state: "unknown" }])).toBe("unknown");
    expect(healthVerdict([{ state: "ok" }, { state: "finding" }])).toBe("findings");
    expect(healthVerdict([{ state: "ok" }])).toBe("clean");
  });

  it("the schema refuses a report that claims ok while holding findings", () => {
    const base = {
      $schema: "health-report/v1",
      producer: { script: "test/health/run.ts", script_hash: "deadbeefcafe" },
      subject: { kind: "repository", id: "litlfred/folio-assistant" },
      updated_at: "2026-09-19T12:00:00Z",
      verdict: "clean",
      checks: [
        {
          id: "x",
          state: "ok",
          summary: "s",
          thresholds: [],
          measurements: [],
          findings: [{ summary: "a thing", severity: "minor", action: "do something about it" }],
        },
      ],
    };
    expect(() => HealthReportSchema.parse(base)).toThrow(/false pass/);
  });

  it("the schema refuses an `unknown` that does not say what it could not determine", () => {
    expect(() =>
      HealthReportSchema.parse({
        $schema: "health-report/v1",
        producer: { script: "test/health/run.ts", script_hash: "deadbeefcafe" },
        subject: { kind: "repository", id: "r" },
        updated_at: "2026-09-19T12:00:00Z",
        verdict: "unknown",
        checks: [{ id: "x", state: "unknown", summary: "s", thresholds: [], measurements: [], findings: [] }],
      }),
    ).toThrow(/gives no reason/);
  });

  it("the schema refuses a stored verdict that disagrees with its own checks", () => {
    expect(() =>
      HealthReportSchema.parse({
        $schema: "health-report/v1",
        producer: { script: "test/health/run.ts", script_hash: "deadbeefcafe" },
        subject: { kind: "repository", id: "r" },
        updated_at: "2026-09-19T12:00:00Z",
        verdict: "clean",
        checks: [
          {
            id: "x",
            state: "finding",
            summary: "s",
            thresholds: [],
            measurements: [],
            findings: [{ summary: "a thing", severity: "major", action: "do something about it" }],
          },
        ],
      }),
    ).toThrow(/disagrees with the checks/);
  });

  it("the schema refuses a sweep with no checks in it at all", () => {
    expect(() =>
      HealthReportSchema.parse({
        $schema: "health-report/v1",
        producer: { script: "test/health/run.ts", script_hash: "deadbeefcafe" },
        subject: { kind: "repository", id: "r" },
        updated_at: "2026-09-19T12:00:00Z",
        verdict: "clean",
        checks: [],
      }),
    ).toThrow();
  });

  it("formats bytes the way the report reads them", () => {
    expect(formatBytes(222 * MB)).toBe("222.0 MB");
    expect(formatBytes(2 * 1024 * MB)).toBe("2.00 GB");
  });
});

describe("search-index-size", () => {
  /**
   * Bean `eof6`. The index is carried once per DEPLOY TREE — the canonical
   * site and every preview — so its size is a budget question, and the budget
   * needed a basis before it could be declared. That basis is the 3.44 MiB
   * measured from PR #946's `stage` log.
   */
  it("the measured size passes, and is reported either way", () => {
    const r = searchIndexCheck(healthyContext());
    expect(r.state).toBe("ok");
    // Reported whether or not it breached: a threshold with no measurement
    // beside it cannot be re-derived by a reader.
    expect(r.measurements.find((m) => m.metric === "search-index-bytes")?.value).toBe(3_605_319);
    expect(r.findings).toEqual([]);
  });

  it("past the budget it is a MAJOR finding that does not say 'shard'", () => {
    const r = searchIndexCheck(
      healthyContext({
        searchIndex: { state: "ok", value: { bytes: 11 * MB, url: "u", command: "HEAD u" } },
      }),
    );
    expect(r.state).toBe("finding");
    expect(r.findings[0]!.severity).toBe("major");
    // `eof6` decides sharding on measurement rather than in advance, so the
    // action names the release-asset half and explicitly refuses to conclude
    // sharding from one number.
    expect(r.findings[0]!.action).toContain("release asset");
    expect(r.findings[0]!.action).toContain("Do NOT shard");
  });

  it("unreachable is UNKNOWN with a reason, never a comfortable number", () => {
    // The common case from a sandboxed session, where egress to the published
    // site is denied outright. A check that returned a passing size when it
    // could not look would be green exactly where nobody could verify it.
    const r = searchIndexCheck(
      healthyContext({ searchIndex: { state: "unknown", reason: "HEAD ... failed: proxy denied" } }),
    );
    expect(r.state).toBe("unknown");
    expect(r.reason).toContain("proxy denied");
    expect(r.measurements).toEqual([]);
  });

  it("the threshold carries its arithmetic, not just a number", () => {
    // `HealthThresholdSchema` requires SOME basis; this asserts the basis
    // actually shows the working, which is what makes it re-derivable.
    const b = searchIndexCheck(healthyContext()).thresholds[0]!.basis;
    expect(b).toContain("3,605,319");
    expect(b).toContain("per DEPLOY");
    expect(b).toContain("ONE WHOLE EXTRA PREVIEW");
  });
});
