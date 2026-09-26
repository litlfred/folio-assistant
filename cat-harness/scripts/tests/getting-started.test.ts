/**
 * The onboarding path: intent triage, the repo scan, and the Pages report.
 *
 * What is worth testing here is not that the code runs — it is that the three
 * places where a wrong answer would be *confidently* wrong stay honest:
 *
 *   1. `folio-intent.dmn` returns `ask` on both ambiguous filesystem states,
 *      and never invents a branch. An agent cannot route past a question the
 *      table did not ask.
 *   2. `scan-repo-content` leaves what it cannot classify in a third bucket
 *      rather than filing it on a guess.
 *   3. `pages-bootstrap` distinguishes a measured 404 from a failed check.
 *
 * Each of those is a case where the tempting shortcut produces output that
 * looks exactly like a correct answer, which is why they get tests and the
 * formatting does not.
 */

import { describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";

import { evaluate, loadDecisionTable, possibleOutcomes } from "../../src/workflow/decision-table.js";
import { loadProcessModel } from "../../src/workflow/process-model.js";
import { classify, scanRepo } from "../scan-repo-content.js";
import { derivePagesUrl, outcomeFor, parseRemote, type PagesOutcome } from "../pages-bootstrap.js";

const INSTANCE_ROOT = resolve(import.meta.dir, "..", "..");
const WORKFLOWS = join(INSTANCE_ROOT, "processes");

describe("folio-intent.dmn — five requests, one sentence", () => {
  const load = () =>
    loadDecisionTable(join(WORKFLOWS, "decisions", "folio-intent.dmn"), "Decision_FolioIntent");

  test("a bare non-folio directory is the ONE state that answers itself", async () => {
    const t = await load();
    expect(
      evaluate(t, { statedIntent: "unstated", isFolio: false, repoHasContent: false }).outcome,
    ).toBe("new-repo");
  });

  test("an existing folio is ambiguous — add-folio, new-repo and new-content all fit", async () => {
    const t = await load();
    expect(
      evaluate(t, { statedIntent: "unstated", isFolio: true, repoHasContent: true }).outcome,
    ).toBe("ask");
  });

  test("somebody's repository is never overlaid on inference", async () => {
    const t = await load();
    expect(
      evaluate(t, { statedIntent: "unstated", isFolio: false, repoHasContent: true }).outcome,
    ).toBe("ask");
  });

  test("what the user actually said beats every filesystem heuristic", async () => {
    const t = await load();
    // The misspeak case: they are standing in a folio and said they want a
    // document. Scaffolding a second folio here is the bug this table exists
    // to stop, and `isFolio` must not be able to override them.
    expect(
      evaluate(t, { statedIntent: "new-content", isFolio: true, repoHasContent: true }).outcome,
    ).toBe("new-content");
    // And the converse: they asked to overlay a directory that happens to be bare.
    expect(
      evaluate(t, { statedIntent: "overlay", isFolio: false, repoHasContent: false }).outcome,
    ).toBe("overlay");
  });

  test("every outcome the table can return names a real branch of the gateway", async () => {
    const t = await load();
    const model = await loadProcessModel(join(WORKFLOWS, "getting-started.bpmn"));
    const gateway = model.nodes.get("Gateway_Intent");
    expect(gateway).toBeDefined();
    const branches = gateway!.outgoing.map((f) => model.flows.get(f)!.name);
    for (const o of possibleOutcomes(t)) expect(branches).toContain(o);
    // `ask` in particular: it is an OUTCOME, not an agent's decision to ask.
    expect(possibleOutcomes(t)).toContain("ask");
  });
});

describe("pages-live-gate.dmn — 'could not check' is not 'not yet'", () => {
  const load = () =>
    loadDecisionTable(join(WORKFLOWS, "decisions", "pages-live-gate.dmn"), "Decision_PagesLive");

  test("a measured 404 is `not-yet`; a failed request is `unknown`", async () => {
    const t = await load();
    expect(evaluate(t, { pagesUrlKnown: true, probe: "not-found" }).outcome).toBe("not-yet");
    expect(evaluate(t, { pagesUrlKnown: true, probe: "error" }).outcome).toBe("unknown");
    expect(evaluate(t, { pagesUrlKnown: true, probe: "unchecked" }).outcome).toBe("unknown");
    expect(evaluate(t, { pagesUrlKnown: true, probe: "ok" }).outcome).toBe("live");
  });

  test("no URL means unknown whatever a probe claims to have found", async () => {
    const t = await load();
    expect(evaluate(t, { pagesUrlKnown: false, probe: "ok" }).outcome).toBe("unknown");
  });

  test("the script's own decision agrees with the table it documents", async () => {
    const t = await load();
    for (const pagesUrlKnown of [true, false]) {
      for (const probe of ["ok", "not-found", "error", "unchecked"] as const) {
        // The table's outcome is typed `unknown` by the evaluator, which knows
        // nothing about this particular table's range. Narrowing it to
        // PagesOutcome is the assertion: if the DMN ever returns a fourth
        // value, this line is where it surfaces.
        expect(outcomeFor({ pagesUrlKnown, probe })).toBe(
          evaluate(t, { pagesUrlKnown, probe }).outcome as PagesOutcome,
        );
      }
    }
  });
});

describe("scan-repo-content — the third bucket", () => {
  test("a directory convention beats the extension", () => {
    // An author who filed a .md under references/ meant it as a reference.
    expect(classify("references/smith-2019.md").bucket).toBe("library");
    expect(classify("docs/chapter-1.pdf").bucket).toBe("content");
  });

  test("source material and prose land where they should on extension alone", () => {
    expect(classify("smith-2019.pdf").bucket).toBe("library");
    expect(classify("outline.md").bucket).toBe("content");
  });

  test("what it cannot place is reported, not filed on a guess", () => {
    const c = classify("src/index.ts");
    expect(c.bucket).toBe("unclassified");
    expect(c.why).toContain(".ts");
  });

  test("every classification carries a reason an author can argue with", () => {
    for (const p of ["a.pdf", "notes/b.md", "c.xyz", "Makefile"]) {
      expect(classify(p).why.length).toBeGreaterThan(0);
    }
  });

  test("scanning this repo writes nothing and leaves source code unclassified", () => {
    const r = scanRepo(INSTANCE_ROOT);
    expect(r.source).toBe("git");
    expect(r.entries.length).toBeGreaterThan(0);
    // Source code is not the author's subject matter, and a scanner that
    // claimed it would be proposing to import the platform into the folio.
    expect(r.totals.unclassified.files).toBeGreaterThan(0);
    // Groups are per directory, because the author answers per directory.
    expect(r.groups.every((g) => g.examples.length <= 5)).toBe(true);
  });
});

describe("pages-bootstrap — deriving the address", () => {
  test("parses every shape a GitHub remote comes in", () => {
    for (const remote of [
      "git@github.com:litlfred/folio-assistant.git",
      "https://github.com/litlfred/folio-assistant.git",
      "https://github.com/litlfred/folio-assistant",
      "ssh://git@github.com/litlfred/folio-assistant.git",
    ]) {
      expect(parseRemote(remote)).toEqual({ owner: "litlfred", repo: "folio-assistant" });
    }
  });

  test("an unparseable remote yields no URL rather than a guessed one", () => {
    expect(parseRemote("not a url")).toBeUndefined();
    // A wrong URL is worse than none: it is what the author pastes to somebody else.
    const r = derivePagesUrl("/nonexistent-directory-for-this-test");
    expect(r.url).toBeUndefined();
  });

  test("this repo's own address is derived from the remote", () => {
    const r = derivePagesUrl(INSTANCE_ROOT);
    expect(r.url).toBe("https://litlfred.github.io/folio-assistant/");
    expect(r.urlSource).toBe("git remote");
  });
});
