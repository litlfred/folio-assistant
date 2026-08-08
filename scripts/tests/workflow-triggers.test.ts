/**
 * A workflow's header must not describe triggers it does not have.
 *
 * All 34 workflows arrived in one commit (`109a4ff`, the repo split) with
 * every trigger neutered to `workflow_dispatch` and their prose left
 * describing the FOLIO's triggers. Since then exactly three acquired a
 * real one — `atomic-mass-gen-check`, `docs-site`, and
 * `code-quality-gates`, whose header insisted *"the ratchet only works if
 * something runs it"* while the file had never run once.
 *
 * The neutering was right: the platform has no `content/<paper>/`, no
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

const DIR = join(import.meta.dir, "../../.github/workflows");
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
  if (/nightly|schedule|cron|daily|weekly|monthly/i.test(h) && !t.has("schedule"))
    out.push("schedule");
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

  test("the three workflows that DO fire are still wired", () => {
    // Guards the other direction: this suite must not be satisfiable by
    // neutering the remaining live triggers and annotating them.
    const live: Record<string, string[]> = {
      "code-quality-gates.yml": ["pull_request", "push"],
      "docs-site.yml": ["push"],
      "atomic-mass-gen-check.yml": ["pull_request", "push"],
    };
    for (const [f, want] of Object.entries(live)) {
      const t = triggers(readFileSync(join(DIR, f), "utf-8"));
      for (const w of want) expect({ f, w, has: t.has(w) }).toEqual({ f, w, has: true });
    }
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
