/**
 * A workflow's header must not describe triggers it does not have.
 *
 * All 34 workflows arrived in one commit (`109a4ff`, the repo split) with
 * every trigger neutered to `workflow_dispatch` and their prose left
 * describing the FOLIO's triggers. Since then four acquired a real one —
 * `atomic-mass-gen-check`, `docs-site`, `code-quality-gates`, whose header
 * insisted *"the ratchet only works if something runs it"* while the file
 * had never run once, and `ci-health` (`workflow_run`, bean `kgho`).
 *
 * The count is stated here and PINNED in the live-wiring test below, which
 * is the only copy that can fail. A number in a docblock is a claim; that
 * map is the measurement.
 *
 * The neutering was right: the platform has no `folio/<paper>/`, no
 * `chapters/`, no `tools/`, so a content sweep here would sweep nothing
 * and report clean. What was wrong is that no file said so, leaving every
 * reader — human or agent — to infer automation that does not exist.
 *
 * This is the forcing function. Each workflow either has the triggers its
 * header advertises, or carries a `TRIGGERS, ACTUAL:` note stating what
 * it really does and why. A new bulk copy cannot quietly land 30 more
 * dispatch-only files whose prose claims otherwise.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

// `.github/` belongs to the REPOSITORY, which is one level above the instance
// this file now sits in. `"../../"` reached both while they were one directory.
const DIR = join(import.meta.dir, "../../../.github/workflows");
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".yml"));

/** The `on:` block's trigger names. */
function triggers(src: string): Set<string> {
  const m = src.match(/^on:\s*\n((?:[ \t]+.*\n|\n)*?)(?=^\S)/m);
  if (m) return new Set([...m[1].matchAll(/^ {2}([a-z_]+):/gm)].map((x) => x[1]));
  const inline = src.match(/^on:\s*(.+)$/m);
  return new Set(
    inline ? inline[1].replace(/[[\]]/g, "").split(",").map((s) => s.trim()).filter(Boolean) : [],
  );
}

/** Everything before `on:` — the prose that makes claims. */
function header(src: string): string {
  const i = src.indexOf("\non:");
  return i < 0 ? src : src.slice(0, i);
}

/** Triggers the prose advertises but the `on:` block lacks. */
function unbackedClaims(src: string): string[] {
  const t = triggers(src);
  const h = header(src);
  const out: string[] = [];
  if (/\bPRs?\b|pull request/i.test(h) && !t.has("pull_request")) out.push("pull_request");
  if (/\bon (each|every) (main )?(commit|push)|push to main|main commit/i.test(h) && !t.has("push"))
    out.push("push");
  // `schedule` is matched only in its TRIGGER senses ("on a schedule",
  // "scheduled"), never as a bare noun. `feature-staging.yml`'s header
  // opens "Author changes the immunization schedule \u2192 agent opens a
  // feature branch" \u2014 domain language in a worked example, not a claim
  // about cron. Matching the bare word failed that file for two days and
  // would fail every WHO guideline workflow that says "immunization
  // schedule" or "dosing schedule". The other words have no such noun use
  // in a workflow header.
  if (/nightly|\bon a schedule\b|\bscheduled\b|cron|daily|weekly|monthly/i.test(h) && !t.has("schedule"))
    out.push("schedule");
  // `workflow_run` — added 2026-09-30 (bean `kgho`), and its absence was a real
  // hole rather than an omission for tidiness. `ci-health.yml`'s header now says
  // it fires "on the failure itself"; before this clause a header could make
  // exactly that claim with no `workflow_run:` trigger and this suite would pass
  // it. That is `1xhc` — a gate that does not fire looks like one that passed —
  // reproduced inside the test built to prevent it, one trigger kind short.
  //
  // Narrow, for the same reason the `schedule` pattern is narrow. "on the
  // failure itself" and "when <something> completes" are trigger claims; the
  // bare words "fail" and "complete" are not, and a workflow header is full of
  // both ("the job fails", "the sweep completes"). Matching those would fail
  // half the directory on prose about its own steps.
  if (
    /\bon (the )?(failure|failing run)\b|\bwhen (a|the) [a-z- ]*run (completes|fails)|\bworkflow_run\b/i.test(h) &&
    !t.has("workflow_run")
  )
    out.push("workflow_run");
  return out;
}

describe("workflow triggers match what their headers claim", () => {
  test("every workflow has an `on:` block with at least one trigger", () => {
    for (const f of FILES) {
      const t = triggers(readFileSync(join(DIR, f), "utf-8"));
      expect({ f, count: t.size > 0 }).toEqual({ f, count: true });
    }
  });

  test("a header claiming a trigger it lacks must say so explicitly", () => {
    // The whole point. Prose describing a nightly schedule on a file with
    // no `schedule:` is how `qa-sweep-nightly` came to exist for months
    // without ever running — while the staleness it was built to prevent
    // went on accumulating.
    const lying: string[] = [];
    for (const f of FILES) {
      const src = readFileSync(join(DIR, f), "utf-8");
      const claims = unbackedClaims(src);
      if (claims.length === 0) continue;
      if (src.includes("TRIGGERS, ACTUAL")) continue;
      lying.push(`${f} claims ${claims.join("+")} but has ${[...triggers(src)].join(",")}`);
    }
    expect(lying).toEqual([]);
  });

  test("`schedule` as a noun is not a cron claim, but a real one still is", () => {
    // Guards the narrowing above in BOTH directions. `feature-staging.yml`
    // failed for two days on the word "immunization schedule" in a worked
    // example; narrowing the pattern to fix that must not buy silence on a
    // header that genuinely advertises cron it does not have.
    const dispatchOnly = "on:\n  workflow_dispatch:\n";
    const noun = `# Author changes the immunization schedule -> agent stages it.\n${dispatchOnly}`;
    const dosing = `# Recomputes the dosing schedule table.\n${dispatchOnly}`;
    expect(unbackedClaims(noun)).toEqual([]);
    expect(unbackedClaims(dosing)).toEqual([]);

    for (const lie of [
      "# Runs on a schedule to sweep the corpus.",
      "# This workflow is scheduled every morning.",
      "# Nightly QA sweep.",
      "# Runs daily.",
      "# A cron job keeps the index fresh.",
    ]) {
      expect({ lie, claims: unbackedClaims(`${lie}\n${dispatchOnly}`) }).toEqual({
        lie,
        claims: ["schedule"],
      });
    }

    // ...and a real `schedule:` trigger clears even the trigger senses.
    // `jobs:` is load-bearing in the fixture, not decoration: `triggers()`
    // ends the `on:` block at the next non-indented line, so a fixture that
    // stops after the cron parses as NO triggers at all.
    const scheduled = "# Runs on a schedule.\non:\n  schedule:\n    - cron: '0 0 * * *'\njobs:\n";
    expect([...triggers(scheduled)]).toEqual(["schedule"]);
    expect(unbackedClaims(scheduled)).toEqual([]);
  });

  test("the note names why, not just that", () => {
    // A bare "dispatch only" note would restate the `on:` block and
    // explain nothing. Each has to say what the workflow needs that the
    // platform does not have, or that it is a real gap awaiting a call.
    for (const f of FILES) {
      const src = readFileSync(join(DIR, f), "utf-8");
      if (!src.includes("TRIGGERS, ACTUAL")) continue;
      const note = src.slice(src.indexOf("TRIGGERS, ACTUAL"));
      expect({ f, explains: /folio|tools\/|platform|owner's decision/i.test(note) }).toEqual({
        f,
        explains: true,
      });
    }
  });

  test("the workflows that DO fire on an event are still wired", () => {
    // Guards the other direction: this suite must not be satisfiable by
    // neutering the remaining live triggers and annotating them.
    const live: Record<string, string[]> = {
      "code-quality-gates.yml": ["pull_request", "push"],
      "docs-site.yml": ["push"],
      "atomic-mass-gen-check.yml": ["pull_request", "push"],
      // `ci-health.yml` joined them 2026-09-30 (bean `kgho`). Both are pinned:
      // `schedule` is the quiet-stretch backstop `ynu8` built, `workflow_run` is
      // the active-stretch one, and they answer different questions — dropping
      // either leaves a blind spot that the other does not cover.
      "ci-health.yml": ["schedule", "workflow_run"],
    };
    for (const [f, want] of Object.entries(live)) {
      const t = triggers(readFileSync(join(DIR, f), "utf-8"));
      for (const w of want) expect({ f, w, has: t.has(w) }).toEqual({ f, w, has: true });
    }
  });

  test("a header claiming it fires on a failure must have `workflow_run`", () => {
    // Both directions, as the `schedule` test does. Bean `kgho`: before this
    // clause existed, the first header to make this claim could have made it
    // with no trigger at all.
    const dispatchOnly = "on:\n  workflow_dispatch:\n";
    for (const lie of [
      "# Fires on the failure itself.",
      // No cron word here on purpose: "not only weekly" would ALSO claim
      // `schedule`, and this fixture is isolating the new clause.
      "# Runs on the failing run, not only on a timer.",
      "# Sweeps when a gating run completes.",
      "# A workflow_run trigger reports the red immediately.",
    ]) {
      expect({ lie, claims: unbackedClaims(`${lie}\n${dispatchOnly}`) }).toEqual({
        lie,
        claims: ["workflow_run"],
      });
    }

    // ...and the prose a workflow header is FULL of is not a claim. Matching
    // bare "fails" or "completes" would fail half the directory on sentences
    // about its own steps, which is how the `schedule` pattern broke
    // `feature-staging.yml` for two days.
    for (const innocent of [
      "# On `could not check` the job fails and the issue is left untouched.",
      "# The step completes in about 40s.",
      "# A failure here is reported by next week's run.",
    ]) {
      expect({ innocent, claims: unbackedClaims(`${innocent}\n${dispatchOnly}`) }).toEqual({
        innocent,
        claims: [],
      });
    }

    // A real trigger clears it.
    const wired =
      "# Fires on the failure itself.\non:\n  workflow_run:\n    workflows: [\"X\"]\njobs:\n";
    expect([...triggers(wired)]).toEqual(["workflow_run"]);
    expect(unbackedClaims(wired)).toEqual([]);
  });

  test("every `workflow_run` names workflows that actually exist, by their declared `name:`", () => {
    // THE failure this trigger kind invites, and nothing else here would catch
    // it. `workflow_run.workflows` matches on a workflow's `name:`, not its
    // filename, and GitHub does not warn about a name that matches nothing — the
    // trigger simply never fires. A rename three files away silently disarms it,
    // which is `1xhc` exactly: indistinguishable from a workflow that ran and
    // found nothing wrong.
    const declared = new Set(
      FILES.map((f) => /^name:\s*(.+)$/m.exec(readFileSync(join(DIR, f), "utf-8"))?.[1]?.trim())
        .filter((n): n is string => !!n)
        .map((n) => n.replace(/^["']|["']$/g, "")),
    );

    const dangling: string[] = [];
    for (const f of FILES) {
      const src = readFileSync(join(DIR, f), "utf-8");
      // The `workflows:` list inside an `on.workflow_run:` block. Inline-array
      // form only, which is what every one here uses; a block-sequence form
      // would read as no names, so it is asserted against rather than assumed
      // away — a silent zero is the thing this test exists to refuse.
      const m = /^  workflow_run:\s*\n(?:[ \t]+#.*\n|\s*\n)*[ \t]+workflows:\s*\[(.+?)\]/m.exec(src);
      if (!/^  workflow_run:/m.test(src)) continue;
      expect({ f, parsedItsWorkflowList: m !== null }).toEqual({ f, parsedItsWorkflowList: true });
      for (const raw of m![1].split(",")) {
        const name = raw.trim().replace(/^["']|["']$/g, "");
        if (!declared.has(name)) dangling.push(`${f} -> ${JSON.stringify(name)}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  test("no workflow references PR context while unable to receive a PR event", () => {
    // `wrapper-tests` set `concurrency.group` from
    // `github.event.pull_request.head.ref` — a field that can never be
    // populated under dispatch-only, so the expression was dead. Dead
    // PR-context is the signature of a trigger that was removed without
    // the body being revisited.
    const dead: string[] = [];
    for (const f of FILES) {
      const src = readFileSync(join(DIR, f), "utf-8");
      if (triggers(src).has("pull_request") || triggers(src).has("workflow_call")) continue;
      if (!/github\.event\.pull_request/.test(src)) continue;
      if (src.includes("TRIGGERS, ACTUAL")) continue;
      dead.push(f);
    }
    expect(dead).toEqual([]);
  });
});
