/**
 * The deletion path: the preflight's verdicts, and the dispatch job's guards.
 *
 * ## Why the workflow is PARSED rather than run
 *
 * Because running it would remove a review preview, and that is the one thing
 * this change must not do: `skills/folio-core/deletion-requires-confirmation.md`
 * holds that an agent never removes a durable artefact on its own initiative,
 * and a staging preview is named there as durable. The properties that matter
 * here are all about WHICH STEP RUNS AND WHEN — `if:` expressions, `env:`
 * bindings, the order of the preflight against the removal — and those are
 * statically checkable. `test/health/workflow.test.ts` reads `health-check.yml`
 * the same way and for the same reason.
 *
 * ## What each group is defending
 *
 * - **The guard** — a deletion trigger reachable by a typo, or by a
 *   confirmation copied from a previous run, is not a confirmation.
 * - **The preflight** — a dispatch that removes a preview still in use is bean
 *   `w2g5` one level out, and worse, because the sweep only proposes while
 *   this acts.
 * - **The shell** — `pull_request_target` carries the base repository's token,
 *   which is why the `cleanup` job binds `head.ref` to `env`. The same shape
 *   must not come back through an input that reaches `rm`.
 *
 * @module scripts/tests/staging-cleanup.test
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "bun:test";
import { parse } from "yaml";

import type { BranchEvidenceSet, Probe } from "../../test/health/checks.ts";
import { preflight, slugProblem } from "../staging-cleanup-preflight.ts";
import { repoRootFor } from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "..", "..");
const WORKFLOW = resolve(repoRootFor(ROOT), ".github/workflows/feature-staging.yml");

interface Step {
  name?: string;
  id?: string;
  if?: string;
  run?: string;
  uses?: string;
  env?: Record<string, string>;
  with?: Record<string, unknown>;
  "working-directory"?: string;
}

const text = readFileSync(WORKFLOW, "utf-8");
const wf = parse(text) as {
  on: { workflow_dispatch?: { inputs?: Record<string, { type?: string; default?: unknown; required?: boolean }> } };
  jobs: Record<string, { if?: string; steps: Step[] }>;
};
const job = wf.jobs["cleanup-dispatch"];
const stepNamed = (fragment: string): Step | undefined =>
  job.steps.find((s) => (s.name ?? "").toLowerCase().includes(fragment.toLowerCase()));

const NOW = new Date("2026-09-19T12:00:00Z");
const branches = (over: Partial<BranchEvidenceSet> = {}): Probe<BranchEvidenceSet> => ({
  state: "ok",
  value: { candidates: [], defaultBranch: "main", command: "fixture", ...over },
});

describe("the dispatch cleanup exists and is reachable", () => {
  it("is a job of its own, so the label path is untouched", () => {
    expect(job).toBeDefined();
    expect(wf.jobs.cleanup.if).toBe("github.event.action == 'closed'");
  });

  it("takes a slug and a confirmation, both optional so an ordinary staging dispatch still works", () => {
    const inputs = wf.on.workflow_dispatch?.inputs ?? {};
    expect(Object.keys(inputs)).toContain("cleanup_slug");
    expect(Object.keys(inputs)).toContain("cleanup_confirm");
    for (const name of ["cleanup_slug", "cleanup_confirm"]) {
      expect(inputs[name].required).toBe(false);
      expect(inputs[name].default).toBe("");
    }
  });

  it("runs ONLY on a dispatch that named a slug", () => {
    expect(job.if).toBe("github.event_name == 'workflow_dispatch' && inputs.cleanup_slug != ''");
  });

  it("does not also deploy a preview while being asked to remove one", () => {
    // `github.event.action` is empty on `workflow_dispatch`, so the staging
    // job's original condition alone would have let both run.
    expect(wf.jobs.stage.if).toContain("inputs.cleanup_slug == ''");
  });

  it("gives a dispatched cleanup its own concurrency group, so two of them do not cancel each other", () => {
    expect(text).toContain("group: staging-${{ github.event.pull_request.head.ref || inputs.cleanup_slug || github.ref_name }}");
  });
});

describe("the guard", () => {
  const guard = stepNamed("Validate the slug and the confirmation");

  it("binds both inputs to `env:` rather than interpolating them into the script", () => {
    // The rule the `cleanup` job's own comment states: an interpolated value
    // is substituted into the script TEXT before the shell parses it. This
    // one reaches `rm`.
    expect(guard?.env?.CLEANUP_SLUG).toBe("${{ inputs.cleanup_slug }}");
    expect(guard?.env?.CLEANUP_CONFIRM).toBe("${{ inputs.cleanup_confirm }}");
    expect(guard?.run).toContain('SLUG="$CLEANUP_SLUG"');
    expect(guard?.run).not.toContain("${{ inputs.cleanup_slug }}");
  });

  it("refuses a slug that is a path, or that carries anything the slug pipeline cannot produce", () => {
    expect(guard?.run).toContain('""|.|..)');
    expect(guard?.run).toContain("*[!A-Za-z0-9._-]*)");
  });

  it("requires the confirmation to REPEAT the slug, so it names the artefact it confirms", () => {
    expect(guard?.run).toContain('if [ "$CLEANUP_CONFIRM" != "$SLUG" ]; then');
    expect(guard?.run).toContain("exit 1");
    expect(guard?.run).toContain("Nothing was removed");
  });

  it("removes with `rm -rf --` and a quoted variable, never an interpolated one", () => {
    const remove = stepNamed("Remove the preview");
    expect(remove?.run).toContain('rm -rf -- "STAGING/$CLEANUP_SLUG"');
    expect(remove?.env?.CLEANUP_SLUG).toBe("${{ steps.guard.outputs.slug }}");
  });
});

describe("the preflight", () => {
  it("runs BEFORE the publish branch is even checked out, let alone removed from", () => {
    const names = job.steps.map((s) => s.name ?? s.uses ?? "");
    const pre = names.findIndex((n) => n.includes("Refuse to remove a preview that is still in use"));
    const remove = names.findIndex((n) => n.includes("Remove the preview"));
    expect(pre).toBeGreaterThan(-1);
    expect(remove).toBeGreaterThan(pre);
    // No `continue-on-error` anywhere in the job: a preflight whose failure
    // does not stop the run is not a preflight.
    expect(text.slice(text.indexOf("cleanup-dispatch:"))).not.toContain("continue-on-error");
  });

  it("calls the ONE implementation of liveness, not a second one written in bash", () => {
    expect(stepNamed("Refuse to remove")?.run).toContain("scripts/staging-cleanup-preflight.ts");
  });

  it("checks out the full history, without which the preflight refuses every dispatch", () => {
    const checkout = job.steps.find((s) => (s.with ?? {})["path"] === "source");
    expect(checkout?.with?.["fetch-depth"]).toBe(0);
  });

  it("records what it removed, with the size and the run that did it", () => {
    const remove = stepNamed("Remove the preview")?.run ?? "";
    expect(remove).toContain("du -sh");
    expect(remove).toContain("$RUN_URL");
    expect(remove).toContain("Dispatched by $DISPATCHED_BY");
  });

  it("protects the gh-pages push against the race, like every other writer of that ref", () => {
    const remove = stepNamed("Remove the preview")?.run ?? "";
    expect(remove).toContain("for attempt in 1 2 3");
    expect(remove).toContain("git pull --rebase origin gh-pages");
  });
});

describe("the preflight's verdicts", () => {
  it("allows removal when every signal was evaluated and every one said no", () => {
    const v = preflight(
      "claude-merged-last-week",
      { state: "ok", value: [] },
      branches({
        candidates: [
          { ref: "claude/merged-last-week", mergedIntoDefault: true, headCommittedAt: "2026-09-08T09:00:00Z" },
        ],
      }),
      NOW,
    );
    expect(v.decision).toBe("remove");
  });

  it("REFUSES the `brave-hypatia` shape — the case the health check was rewritten for", () => {
    const v = preflight(
      "claude-brave-hypatia-r820sf",
      { state: "ok", value: [] },
      branches({
        candidates: [
          { ref: "claude/brave-hypatia-r820sf", mergedIntoDefault: false, headCommittedAt: "2026-09-19T11:58:00Z" },
        ],
      }),
      NOW,
    );
    expect(v.decision).toBe("refuse-live");
    if (v.decision !== "refuse-live") return;
    expect(v.why).toContain("unmerged-branch");
    expect(v.why).toContain("recent-commit");
  });

  it("REFUSES on could-not-tell — the opposite direction to the sweep, and for the same reason", () => {
    // In the health check `unknown` means "do not accuse". Here it means "do
    // not delete". Both err away from removal, which is the only recoverable
    // direction.
    const rateLimited = preflight(
      "claude-anything",
      { state: "unknown", reason: "GitHub API returned 403" },
      branches(),
      NOW,
    );
    expect(rateLimited.decision).toBe("refuse-unknown");

    const noGit = preflight(
      "claude-anything",
      { state: "ok", value: [] },
      { state: "unknown", reason: "git ls-remote --heads origin exited 128" },
      NOW,
    );
    expect(noGit.decision).toBe("refuse-unknown");

    const blindBranch = preflight(
      "claude-unreadable",
      { state: "ok", value: [] },
      branches({
        candidates: [
          {
            ref: "claude/unreadable",
            headCommittedAt: "2026-09-01T00:00:00Z",
            unevaluated: "git merge-base --is-ancestor exited 128: bad object",
          },
        ],
      }),
      NOW,
    );
    expect(blindBranch.decision).toBe("refuse-unknown");
    if (blindBranch.decision !== "refuse-unknown") return;
    expect(blindBranch.why).toContain("bad object");
  });

  it("refuses a slug that is a path or carries an impossible character, before asking anything", () => {
    for (const bad of ["", ".", "..", "../../etc", "a/b", "a b", "a;rm -rf /", "*"]) {
      expect(slugProblem(bad)).toBeDefined();
      expect(preflight(bad, { state: "ok", value: [] }, branches(), NOW).decision).toBe("refuse-unknown");
    }
    expect(slugProblem("claude-health-checks")).toBeUndefined();
    expect(slugProblem("release.v1-0-rc1")).toBeUndefined();
  });
});

describe("the close-event gate — merged removes, closed-unmerged does not", () => {
  // Owner, 2026-09-20: "change policy, if merged to main, then staging goes
  // away". Bean `folio-assistant-1feu`.
  //
  // This is the `cleanup` job, not `cleanup-dispatch` above. The distinction
  // it encodes is about WHERE THE CONTENT LIVES: a merged PR's preview shows
  // what the main site now shows, so it is redundant; a closed-unmerged one
  // is the only rendering of that work, so it is the last copy.
  const closeJob = wf.jobs["cleanup"];
  const gate = closeJob.steps.find((s) => s.id === "check");

  it("reads `merged` off the event, and binds it to env rather than interpolating", () => {
    // Same reason as LABELS_JSON on the line above it: anything from the
    // event payload reaching the script body directly is an injection site,
    // and this job runs on `pull_request_target` with `contents: write`.
    expect(gate?.env?.MERGED).toBe("${{ github.event.pull_request.merged }}");
    expect(gate?.run ?? "").toContain('"$MERGED"');
  });

  it("a merged PR confirms WITHOUT a label", () => {
    const run = gate?.run ?? "";
    // The merged branch comes first and does not consult LABELS at all.
    const merged = run.slice(run.indexOf('if [ "$MERGED" = "true" ]'), run.indexOf("elif"));
    expect(merged).toContain("confirmed=true");
    expect(merged).not.toContain("LABELS");
  });

  it("closed-unmerged still requires the label — the last-copy case", () => {
    const run = gate?.run ?? "";
    const rest = run.slice(run.indexOf("elif"));
    expect(rest).toContain("staging:cleanup");
    expect(rest).toContain("confirmed=false");
  });

  it("records WHICH rule removed it, so a reader can tell merge from label", () => {
    // Without this the two paths are indistinguishable after the fact, and
    // "was this removed because someone decided, or because it merged?" is
    // exactly the question an audit of a deletion asks.
    const run = gate?.run ?? "";
    expect(run).toContain("reason=merged");
    expect(run).toContain("reason=labelled");
    expect(run).toContain("reason=closed-unmerged-and-unlabelled");
  });

  it("still fires only on close — it has not been widened to reach an OPEN PR", () => {
    // The `plj1` guard. That failure deleted every open PR's preview, and no
    // policy change about MERGED pull requests may reach one.
    expect(closeJob.if).toContain("github.event.action == 'closed'");
  });
});
