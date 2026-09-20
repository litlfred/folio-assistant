/**
 * The Pages build outcome — bean `3yi4`.
 *
 * `bm6d` measured **6 of the last 10 `pages build and deployment` runs
 * cancelled**, in an exact repeating pattern, and nothing in this repository
 * said so. Three properties hid it at once: those runs are on `gh-pages`
 * rather than the default branch, they are raised by `github-pages[bot]` on
 * the `dynamic` event rather than by a file in `.github/workflows/`, and
 * `check-ci-health.ts` asks `?branch=<default>`. The reader was never missing;
 * the QUESTION was too narrow.
 *
 * ## Why these are pure reducers with no store behind them
 *
 * The owner's correction, 2026-09-20: *"they are not. changes status of repo.
 * tools need to look external."* A Pages deployment is a fact an external
 * service holds. Writing it into the repository would rebuild `xom7` in a new
 * place — a committed answer that is right when written and silently wrong
 * afterwards. So the caller asks the API every time and these functions only
 * reduce what it got back.
 *
 * ## What is pinned
 *
 * That `cancelled` survives as a THIRD state (it is neither "shipped" nor
 * "broken"), and that a cancellation this repository caused itself is
 * distinguishable from one caused by a sibling session. Merging either
 * distinction gives a number that cannot answer the question the report is
 * for: *did the preview actually build?*
 *
 * @module cat-harness/scripts/tests/pages-health.test
 */
import { describe, expect, test } from "bun:test";

import {
  PAGES_WORKFLOW,
  pagesHealth,
  selfSupersedes,
  slugOfDeployCommit,
  type DeployCommit,
  type RunSummary,
} from "../../src/workflow/ci-health";

const pages = (over: Partial<RunSummary> = {}): RunSummary => ({
  name: "pages build and deployment",
  status: "completed",
  conclusion: "success",
  created_at: "2026-09-20T12:00:00Z",
  ...over,
});

describe("pagesHealth — cancelled is a third state", () => {
  test("a cancelled deployment is neither success nor failure", () => {
    // The whole reason this function exists. Folded into success, the report
    // says the preview shipped while it is stale; folded into failure, it
    // sends somebody to fix a build that was merely superseded.
    const h = pagesHealth([pages({ conclusion: "cancelled" })]);
    expect(h.cancelled).toBe(1);
    expect(h.success).toBe(0);
    expect(h.failure).toBe(0);
    expect(h.unsettled).toBe(0);
  });

  test("the four settled states and the unsettled one partition the runs", () => {
    // `bm6d`'s measured shape: mostly cancelled, some green, one real red.
    const runs = [
      pages({ conclusion: "cancelled" }),
      pages({ conclusion: "cancelled" }),
      pages({ conclusion: "success" }),
      pages({ conclusion: "failure" }),
      pages({ status: "in_progress", conclusion: null as unknown as string }),
      pages({ conclusion: "skipped" }),
    ];
    const h = pagesHealth(runs);
    expect(h.total).toBe(6);
    expect(h.cancelled).toBe(2);
    expect(h.success).toBe(1);
    expect(h.failure).toBe(1);
    expect(h.unsettled).toBe(2); // in-flight + skipped
    expect(h.success + h.cancelled + h.failure + h.unsettled).toBe(h.total);
  });

  test("only the Pages workflow is counted", () => {
    // The runs arrive on a shared page with every other workflow. Counting a
    // red `docs-site` as a failed DEPLOYMENT would report the site as not
    // publishing when it published fine.
    const h = pagesHealth([
      pages(),
      { ...pages(), name: "Docs site", conclusion: "failure" },
      { ...pages(), name: "CI health", conclusion: "failure" },
    ]);
    expect(h.total).toBe(1);
    expect(h.failure).toBe(0);
  });

  test("the workflow name is matched case-insensitively", () => {
    // GitHub renders it lowercase in the UI and has spelled it with capitals
    // in the API. A case-sensitive match reports `total: 0` — which is
    // "no deployments at all", a far stronger and quite false claim.
    expect(pagesHealth([pages({ name: "Pages build and deployment" })]).total).toBe(1);
    expect(PAGES_WORKFLOW).toBe(PAGES_WORKFLOW.toLowerCase());
  });

  test("no Pages runs is total 0 with no latest — never a green", () => {
    // A caller that reads `failure === 0` as healthy gets the `xom7` misread.
    // `total` is the denominator that makes zero readable.
    const h = pagesHealth([{ ...pages(), name: "Docs site" }]);
    expect(h.total).toBe(0);
    expect(h.latest).toBeUndefined();
  });

  test("latest is the newest Pages run, not the newest run", () => {
    // The API returns newest-first across all workflows, so the first element
    // is usually somebody else's.
    const newest = { ...pages(), name: "Docs site" };
    const mine = pages({ conclusion: "cancelled", created_at: "2026-09-20T11:00:00Z" });
    const h = pagesHealth([newest, mine, pages({ created_at: "2026-09-20T09:00:00Z" })]);
    expect(h.latest?.created_at).toBe("2026-09-20T11:00:00Z");
    expect(h.latest?.conclusion).toBe("cancelled");
  });
});

describe("slugOfDeployCommit — which preview a publish-branch commit is about", () => {
  test("the payload commit names its slug", () => {
    expect(slugOfDeployCommit("staging(claude-eroyaz): from abc123")).toBe("claude-eroyaz");
  });

  test("the render-log commit names its slug", () => {
    // The second writer, from BEFORE `bm6d` coalesced the pair. Detecting the
    // old shape is the point: this is how the report shows the fix held.
    expect(slugOfDeployCommit("render-log: rendered STAGING/claude-eroyaz")).toBe("claude-eroyaz");
  });

  test("a commit about nothing staged is undefined, not a guess", () => {
    expect(slugOfDeployCommit("deploy: main site")).toBeUndefined();
    expect(slugOfDeployCommit("")).toBeUndefined();
  });

  test("the slug is read from a line start, so a quoted message does not match", () => {
    // `^` with `m`, not a bare `indexOf`. A commit quoting an earlier one in
    // its body — which `bm6d`'s own merge commits do — would otherwise be
    // counted as a deploy of that slug.
    expect(slugOfDeployCommit("Merge PR: reverts staging(other): from x")).toBeUndefined();
  });

  test("the coalesced commit resolves to its one slug", () => {
    // `bm6d`'s output carries both spellings in one message — the subject and
    // a trailer — from ONE shell variable, so they cannot disagree and the
    // branch order decides nothing here. That is worth saying because the
    // first version of this test claimed the opposite ("the subject wins")
    // and a mutation reordering the branches SURVIVED it. The rationale was
    // wrong, not the test set; the real ordering property is the next test.
    const msg = "staging(eroyaz): from abc\n\nrender-log: rendered STAGING/eroyaz\n";
    expect(slugOfDeployCommit(msg)).toBe("eroyaz");
  });

  test("a cleanup commit names the slug it REMOVED, not the word `cleanup`", () => {
    // The defect the surviving mutation led to. `feature-staging.yml` writes
    // `staging(cleanup): remove STAGING/<slug>` on a closed PR — `cleanup` is
    // the operation and the slug is in the path. Read subject-first, every
    // removal in the repository became one branch called `cleanup`, and two
    // removals for two unrelated PRs then looked like this repository
    // contending with itself.
    expect(slugOfDeployCommit("staging(cleanup): remove STAGING/eroyaz (PR #123 closed)")).toBe(
      "eroyaz",
    );
    expect(slugOfDeployCommit("staging(cleanup): remove STAGING/other (dispatched)")).toBe("other");
  });

  test("two removals for two PRs are two slugs, not one", () => {
    // The consequence, stated as the property rather than the spelling.
    const a = slugOfDeployCommit("staging(cleanup): remove STAGING/aaa (PR #1 closed)");
    const b = slugOfDeployCommit("staging(cleanup): remove STAGING/bbb (PR #2 closed)");
    expect(a).not.toBe(b);
  });

  test("a branch genuinely named `cleanup` still resolves", () => {
    // The cost of the fix, checked rather than assumed. A deploy commit for
    // such a branch carries no `remove STAGING/`, so the fallback reaches it.
    expect(slugOfDeployCommit("staging(cleanup): from abc123")).toBe("cleanup");
  });

  test("the retained-preview commit names its slug", () => {
    // A third writer: the cleanup job REFUSING a removal still pushes a
    // render-log commit, which still cancels a Pages build.
    expect(slugOfDeployCommit("render-log: retained STAGING/eroyaz")).toBe("eroyaz");
  });
});

describe("selfSupersedes — this repo's own contention, not a sibling's", () => {
  const c = (sha: string, message: string, date: string): DeployCommit => ({ sha, message, date });

  test("two commits for one slug seconds apart are one deploy writing twice", () => {
    // The `bm6d` signature exactly: payload, then render-log, ~10s later, and
    // the second cancels the first's Pages build.
    const found = selfSupersedes([
      c("bbb", "render-log: rendered STAGING/eroyaz", "2026-09-20T12:00:10Z"),
      c("aaa", "staging(eroyaz): from abc", "2026-09-20T12:00:00Z"),
    ]);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ slug: "eroyaz", by: "bbb", superseded: "aaa", secondsApart: 10 });
  });

  test("different slugs are TWO SESSIONS and are not counted", () => {
    // This is the distinction `3yi4` asks for. Cross-session contention is
    // `6pfo`'s ground and a different fix; counting it here would make `bm6d`
    // look unfixed however well it worked.
    expect(
      selfSupersedes([
        c("bbb", "staging(other): from def", "2026-09-20T12:00:10Z"),
        c("aaa", "staging(eroyaz): from abc", "2026-09-20T12:00:00Z"),
      ]),
    ).toHaveLength(0);
  });

  test("the same slug redeployed much later is a new deploy, not a self-supersede", () => {
    // An hour apart is a second push, whose cancellation of a finished build
    // is nothing. Without the window every re-run of a branch would be a
    // finding, and a finding that always fires is not read.
    expect(
      selfSupersedes([
        c("bbb", "staging(eroyaz): from def", "2026-09-20T13:00:00Z"),
        c("aaa", "staging(eroyaz): from abc", "2026-09-20T12:00:00Z"),
      ]),
    ).toHaveLength(0);
  });

  test("the window is a parameter, and its boundary is inclusive", () => {
    const pair = [
      c("bbb", "staging(eroyaz): from def", "2026-09-20T12:02:00Z"),
      c("aaa", "staging(eroyaz): from abc", "2026-09-20T12:00:00Z"),
    ];
    expect(selfSupersedes(pair, 120)).toHaveLength(1);
    expect(selfSupersedes(pair, 119)).toHaveLength(0);
  });

  test("commits handed over OLDEST-first are refused rather than reported", () => {
    // A negative gap means the caller's ordering is not the one documented.
    // Reporting the pair anyway would name the wrong commit as the canceller
    // — an answer that looks precise and points at the wrong thing.
    expect(
      selfSupersedes([
        c("aaa", "staging(eroyaz): from abc", "2026-09-20T12:00:00Z"),
        c("bbb", "render-log: rendered STAGING/eroyaz", "2026-09-20T12:00:10Z"),
      ]),
    ).toHaveLength(0);
  });

  test("an unparseable date is not a zero-second gap", () => {
    // `Date.parse` gives NaN, and `NaN > withinSeconds` is false — so without
    // the explicit finite check this would report a pair with
    // `secondsApart: NaN`, which renders as a real finding.
    expect(
      selfSupersedes([
        c("bbb", "staging(eroyaz): from def", "not a date"),
        c("aaa", "staging(eroyaz): from abc", "2026-09-20T12:00:00Z"),
      ]),
    ).toHaveLength(0);
  });

  test("a run of three finds both adjacent pairs", () => {
    const found = selfSupersedes([
      c("ccc", "render-log: rendered STAGING/eroyaz", "2026-09-20T12:00:20Z"),
      c("bbb", "staging(eroyaz): from def", "2026-09-20T12:00:10Z"),
      c("aaa", "staging(eroyaz): from abc", "2026-09-20T12:00:00Z"),
    ]);
    expect(found.map((f) => f.by)).toEqual(["ccc", "bbb"]);
  });

  test("a commit that is not a deploy breaks the chain rather than bridging it", () => {
    // Only ADJACENT commits are paired. A merge landing between two staging
    // pushes means the second did not cancel the first's build — something
    // else did, and this must not claim otherwise.
    expect(
      selfSupersedes([
        c("ccc", "staging(eroyaz): from ghi", "2026-09-20T12:00:20Z"),
        c("bbb", "Merge branch 'main'", "2026-09-20T12:00:10Z"),
        c("aaa", "staging(eroyaz): from abc", "2026-09-20T12:00:00Z"),
      ]),
    ).toHaveLength(0);
  });

  test("two commits that are not deploys are never paired with each other", () => {
    // Both slugs undefined. Without the `!a` guard, `undefined !== undefined`
    // is false and the pair is reported — a finding whose slug renders as
    // `undefined`, from two main-site commits that have nothing to do with a
    // preview. The guard is what keeps "could not tell which slug" from
    // becoming "these two are the same slug".
    expect(
      selfSupersedes([
        c("bbb", "Merge branch 'main'", "2026-09-20T12:00:10Z"),
        c("aaa", "deploy: main site", "2026-09-20T12:00:00Z"),
      ]),
    ).toHaveLength(0);
  });

  test("an empty or single-commit history finds nothing", () => {
    expect(selfSupersedes([])).toHaveLength(0);
    expect(selfSupersedes([c("aaa", "staging(eroyaz): from abc", "2026-09-20T12:00:00Z")])).toHaveLength(0);
  });
});
