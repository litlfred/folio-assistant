/**
 * Every GitHub Actions workflow must parse.
 *
 * `qa-sweep.yml` and `witness-refresh.yml` had been unparseable, and the way
 * that failure presents is the reason this test exists rather than a CI job.
 * GitHub cannot read the `on:` triggers of a file it cannot parse, so instead
 * of not running, the workflow registered a **startup failure against every
 * push** — a run with zero jobs, `conclusion: failure`, and `name` falling
 * back to the file path instead of the workflow's declared `name:`. Thirty
 * such runs sat on one branch. Fetching their logs returns "No failed jobs
 * found", so the failure carries no diagnostic at all.
 *
 * Both had the same cause: content dedented to column 0 inside a `run: |`
 * block scalar. A block scalar ends at the first line indented less than its
 * base, so YAML read the shell body's continuation lines as new mapping keys.
 * In one file that was an embedded `python3 -c "…"` program (since extracted
 * to `scripts/ci/qa-axis-summary.py`); in the other, a `git commit -m` message
 * body. Neither is visible as an error in an editor, and neither shows up in
 * `bun test`, `tsc`, or `eslint` — which is exactly why it survived.
 *
 * A parse check is cheap and total. It runs here, before push, rather than
 * being discovered as an uninformative red X afterwards.
 */
import { describe, test, expect } from "bun:test";
import { checkWorkflows, ghPagesWipesStaging, GH_PAGES_GROUP } from "../check-workflows.js";
import { readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { repoRootFor } from "../../schemas/cat-harness.js";

const WORKFLOW_DIR = join(repoRootFor(resolve(import.meta.dir, "..", "..")), ".github", "workflows");

const files = readdirSync(WORKFLOW_DIR)
  .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
  .sort();

describe("GitHub Actions workflows", () => {
  test("there are workflows to check", () => {
    // Guard against the check silently covering nothing if the directory
    // moves — a green run over zero files reads as coverage that is not there.
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    test(`${file} parses`, () => {
      const src = readFileSync(join(WORKFLOW_DIR, file), "utf-8");
      expect(() => Bun.YAML.parse(src)).not.toThrow();
    });

    test(`${file} declares a name and triggers`, () => {
      // A workflow whose `name:` is missing is reported by file path in the
      // Actions UI — indistinguishable at a glance from the startup-failure
      // presentation above. `on:` missing means it can never run.
      const doc = Bun.YAML.parse(readFileSync(join(WORKFLOW_DIR, file), "utf-8")) as Record<
        string,
        unknown
      >;
      expect(typeof doc?.name, `${file} has no name:`).toBe("string");
      // YAML 1.1 reads a bare `on` as the boolean true; either key is fine.
      const triggers = doc?.on ?? (doc as Record<string, unknown>)?.["true"];
      expect(triggers, `${file} has no on: triggers`).toBeDefined();
    });
  }

  /**
   * `code-quality-gates.yml` runs `bun test`, `bun run lint` and
   * `tsc --noEmit`. Nothing else in this repo does — of 33 workflows, only
   * `atomic-mass-gen-check` and `docs-site` auto-trigger, and neither touches
   * TypeScript.
   *
   * It was written `workflow_dispatch`-only, in a commit whose own message
   * said "no folio-assistant workflow triggers on `pull_request`" and "a
   * ratchet only works if something runs it". So every gate landed since —
   * the suite at 0 failures, eslint with every rule at `error`, `tsc` over all
   * five trees — was enforced by nothing at all, behind a workflow whose
   * header claimed it was the enforcement.
   *
   * A dispatch-only gate is indistinguishable from a working one until you
   * look at the Actions tab and find no runs. This is the check that looks.
   */
  test("every job that pushes gh-pages is protected — by the queue or a retry", () => {
    // A concurrency group serialises only the jobs that NAME it, and this one
    // has been incomplete twice. First `eoix` gave it to feature-staging's two
    // jobs alone, so six other push sites still raced — PR #297 lost a staging
    // push to exactly that on 2026-09-18. Then, less visibly, `blueprint` and
    // `lean_ci` turned out to have had the right idea under a DIFFERENT name
    // (`gh-pages-deploy`), which queues against nothing while reading like a
    // solved problem.
    expect(checkWorkflows().filter((f) => f.kind === "gh-pages-ungrouped")).toEqual([]);
  });

  test("jobs that contend SIMULTANEOUSLY take the retry, not the queue", () => {
    // discoverability-docs runs three jobs in parallel with no `needs:`.
    // GitHub cancels a PENDING job when a newer one queues for the same group,
    // so putting all three in one group loses a publish every run — which is
    // what #300 did, and worse than the race it replaced. They get a retry,
    // safe here because the three write to different directories under one
    // root with `keep_files: true`.
    const text = readFileSync(join(WORKFLOW_DIR, "discoverability-docs.yml"), "utf-8");
    expect(text).not.toContain("group: gh-pages-push");
    // Two push sites per job — the attempt and the retry — for three jobs.
    // Counted the way the checker counts: a COMMENT naming the action is not a
    // use of it, and this file's header mentions it in prose. Counting raw
    // occurrences said 7 and the assertion failed, which is the check working.
    const uses = text
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("#") && /uses:\s*peaceiris\/actions-gh-pages@/.test(l));
    expect(uses).toHaveLength(6);
    expect(text.split("continue-on-error: true").length - 1).toBe(3);
  });

  test("the group is one literal string, because a group matches on the literal", () => {
    expect(GH_PAGES_GROUP).toBe("gh-pages-push");
  });

  test("code-quality-gates.yml actually triggers on pull_request", () => {
    const doc = Bun.YAML.parse(
      readFileSync(join(WORKFLOW_DIR, "code-quality-gates.yml"), "utf-8"),
    ) as Record<string, unknown>;
    const triggers = (doc.on ?? doc["true"]) as Record<string, unknown>;
    expect(Object.keys(triggers).sort()).toContain("pull_request");
  });

  test("code-quality-gates.yml has no paths: filter on pull_request", () => {
    // A `paths:` filter is how a whole-repo gate quietly stops covering the
    // file that broke it — and, because GitHub reports a filtered-out required
    // check as never having run, how a branch protection rule blocks forever.
    const doc = Bun.YAML.parse(
      readFileSync(join(WORKFLOW_DIR, "code-quality-gates.yml"), "utf-8"),
    ) as Record<string, unknown>;
    const triggers = (doc.on ?? doc["true"]) as Record<string, unknown>;
    const pr = triggers.pull_request as Record<string, unknown> | null;
    expect(pr == null || !("paths" in pr)).toBe(true);
  });

  test("the TypeScript gate runs all three checks", () => {
    // Each is a separate ratchet; a gate that runs two of the three reads as
    // full coverage in the Actions UI.
    const doc = Bun.YAML.parse(
      readFileSync(join(WORKFLOW_DIR, "code-quality-gates.yml"), "utf-8"),
    ) as { jobs: Record<string, { steps: Array<{ run?: string }> }> };
    const runs = (doc.jobs.typescript?.steps ?? []).map((s) => s.run ?? "").join("\n");
    expect(runs).toContain("bun test");
    expect(runs).toContain("bun run lint");
    expect(runs).toContain("tsc --noEmit");
  });
});

/**
 * A full replace of `gh-pages` carries the open PRs' previews — bean `plj1`.
 *
 * The real corpus is asserted clean, AND the check is shown to FIRE on a
 * workflow in the shape `docs-site.yml` was in. Only the second half is
 * evidence that the first means anything: a checker that returns `[]` for
 * everything passes the corpus test too, and this defect is invisible to every
 * other signal — the push succeeds, the check run is green, and the artefact
 * is gone minutes later.
 */
describe("gh-pages full-replace vs the STAGING previews", () => {
  /** A workflow in the shape that caused `plj1`. */
  const wipes = [
    "name: W",
    "jobs:",
    "  deploy:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Publish",
    "        uses: peaceiris/actions-gh-pages@v4",
    "        with:",
    "          publish_dir: ./_site",
    "          publish_branch: gh-pages",
    "",
  ].join("\n");

  test("it fires on a root replace with neither keep_files nor destination_dir", () => {
    const found = ghPagesWipesStaging(wipes, "w.yml");
    expect(found.length).toBe(1);
    expect(found[0].kind).toBe("gh-pages-wipes-staging");
    expect(found[0].detail).toContain("STAGING/");
  });

  test("a restore step in front of the push clears it", () => {
    const fixed = wipes.replace(
      "      - name: Publish",
      [
        "      - name: Restore",
        "        run: bun run scripts/restore-staging.ts --site ./_site --state ./.staging-restored.json",
        "      - name: Publish",
      ].join("\n"),
    );
    expect(ghPagesWipesStaging(fixed, "w.yml")).toEqual([]);
  });

  test("a --verify run is NOT a restore — it reports, it does not carry", () => {
    const verifyOnly = wipes.replace(
      "      - name: Publish",
      [
        "      - name: Verify",
        "        run: bun run scripts/restore-staging.ts --verify --state ./.staging-restored.json",
        "      - name: Publish",
      ].join("\n"),
    );
    expect(ghPagesWipesStaging(verifyOnly, "w.yml").length).toBe(1);
  });

  test("keep_files and a scoped destination_dir are each exempt", () => {
    expect(ghPagesWipesStaging(wipes.replace("          publish_branch: gh-pages", "          publish_branch: gh-pages\n          keep_files: true"), "w.yml")).toEqual([]);
    expect(ghPagesWipesStaging(wipes.replace("          publish_branch: gh-pages", "          publish_branch: gh-pages\n          destination_dir: STAGING/x"), "w.yml")).toEqual([]);
  });

  test("no workflow in this repository wipes the previews", () => {
    expect(checkWorkflows().filter((f) => f.kind === "gh-pages-wipes-staging")).toEqual([]);
  });
});

describe("every path that publishes or removes a preview also LOGS it", () => {
  /**
   * The log's whole value is that entries persist and a reader will believe
   * they did. A path that changes `STAGING/` without appending an entry
   * silently breaks that belief — and a silent break is worse than no log,
   * because the next reader concludes from an absent entry that nothing
   * happened. So the wiring is asserted rather than remembered.
   *
   * By JOB, not by counting calls: what matters is that each job which can
   * change the branch carries the tool, not how many times it invokes it.
   */
  const staging = Bun.YAML.parse(
    readFileSync(join(WORKFLOW_DIR, "feature-staging.yml"), "utf-8"),
  ) as { jobs?: Record<string, { steps?: { run?: string; uses?: string; with?: Record<string, unknown> }[] }> };
  const jobs = staging.jobs ?? {};

  const runsOf = (job: string): string =>
    (jobs[job]?.steps ?? []).map((s) => s.run ?? "").join("\n");

  test.each([["stage"], ["cleanup"], ["cleanup-dispatch"]])(
    "`%s` invokes render-log.ts",
    (job) => {
      expect(runsOf(job)).toContain("scripts/render-log.ts");
    },
  );

  test("the change and its record are ONE commit, on EVERY path", () => {
    // A separate log push can fail on its own and leave a preview that
    // vanished — or appeared — with nothing saying why, the exact state bean
    // `plj1` left the branch in. Staging them together is what makes that
    // impossible.
    //
    // `stage` became one commit in PR #552 (bean `bm6d`, 2026-09-20). It used
    // to deploy with `peaceiris/actions-gh-pages` and then push the log in a
    // SECOND commit ten seconds later, which cancelled Pages' own build on 6
    // of the last 10 measured deploys.
    //
    // THE PROPERTY SHIPPED UNPINNED, which is what this line fixes. The list
    // said "in both removal paths" and stopped at `cleanup` +
    // `cleanup-dispatch`, so the one path that had just been MADE atomic was
    // the one path nothing asserted — it could have been split again without
    // failing anything. A property is not defended by the change that
    // establishes it.
    for (const job of ["stage", "cleanup", "cleanup-dispatch"]) {
      const runs = runsOf(job);
      expect(runs).toMatch(/git (?:-C pages )?add -A "STAGING\/\$\w+" _render-log/);
    }
  });

  test("a removal names a reason — the tool refuses without one", () => {
    for (const job of ["cleanup", "cleanup-dispatch"]) {
      const runs = runsOf(job);
      const removed = runs.includes("--event removed");
      expect(removed).toBe(true);
      expect(runs).toContain("--reason");
    }
  });

  test("a refused removal is recorded too — `retained` is why the log is worth reading", () => {
    expect(runsOf("cleanup")).toContain("--event retained");
  });

  test("`cleanup` logs the GATE'S OWN reason, never a restatement of one branch", () => {
    // Bean `1feu` gave the merge the standing a label used to have, so a
    // record hardcoding "carried the staging:cleanup label" would name the
    // wrong rule on every merged PR — worse than no reason, because it reads
    // as evidence. The gate emits `merged | labelled |
    // closed-unmerged-and-unlabelled`; the entry carries that value.
    const steps = jobs["cleanup"]?.steps ?? [];
    const logging = steps.filter((st) => (st.run ?? "").includes("render-log.ts"));
    expect(logging.length).toBeGreaterThan(0);
    for (const st of logging) {
      expect(String((st as { env?: Record<string, string> }).env?.CLEANUP_REASON ?? "")).toContain(
        "steps.check.outputs.reason",
      );
      expect(st.run).toContain("$CLEANUP_REASON");
      // The label is not named as THE reason anywhere a record is written.
      expect(st.run).not.toContain("--reason \"PR #${{ github.event.pull_request.number }} closed and carried");
    }
  });

  test("every job that writes the log checks out the publish branch AND the platform", () => {
    // The tool lives in the platform checkout and writes into the publish
    // branch's. A job holding only one of the two cannot log anything, and
    // would fail at run time rather than here.
    for (const job of ["cleanup", "cleanup-dispatch"]) {
      const steps = jobs[job]?.steps ?? [];
      const paths = steps
        .filter((s) => (s.uses ?? "").startsWith("actions/checkout"))
        .map((s) => String((s.with ?? {}).path ?? ""));
      expect(paths).toContain("source");
      expect(paths).toContain("pages");
    }
  });

  test("the log lives OUTSIDE STAGING/, so `rm -rf STAGING/$SLUG` cannot reach it", () => {
    // Structural rather than guarded. Asserted here as well as in the schema
    // tests because it is the workflow that holds the `rm`.
    const runs = ["stage", "cleanup", "cleanup-dispatch"].map(runsOf).join("\n");
    expect(runs).toContain("--dir pages");
    expect(runs).not.toContain("STAGING/$SLUG/_render-log");
    expect(runs).not.toMatch(/--path "STAGING\/\$\w+\/_render-log/);
  });
});
