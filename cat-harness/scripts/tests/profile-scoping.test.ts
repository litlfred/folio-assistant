/**
 * QA criterion scoping by content PROFILE — the second axis, beside adapters.
 *
 * `adapterForKind("prose")` is `"paper"`, and correctly so: profiles nest
 * inside one adapter's vocabulary, so a document folio's prose block is a
 * paper-adapter kind and sails through the adapter gate. Which meant every
 * document-profile block inherited the paper adapter's LaTeX- and
 * Lean-shaped criteria. Measured on `content/docs/crdm-methodology`
 * (2026-09-18, sidecars removed first so nothing was `fresh-skip`):
 * 328 pass / 8 fail / 336 n/a, and **five of the eight failures** were
 * `voice-unicode-crash` — a criterion whose own description says the
 * characters "crash pdflatex" — firing on prose in a folio whose render path
 * never invokes latexmk.
 *
 * Two properties are load-bearing and both are asserted here, in both
 * directions, because the second one fails INVISIBLY:
 *
 * 1. An opted-out criterion is `n/a`'d in a document folio, under its own
 *    outcome string — not the adapter's.
 * 2. An **unannotated** criterion still runs there. `profiles` defaults to
 *    every profile, the opposite of `adapters`; had it defaulted narrow like
 *    `adapters` does, ~110 criteria would have stopped running on document
 *    folios and reported the silence as a clean sweep. A wrong `fail` gets
 *    argued with; a wrong `pass` gets believed.
 *
 * 3. And "could not determine" is a third state that RUNS the criterion. A
 *    folio with no readable `harness.config.json` must not lose coverage
 *    because a tool could not read its configuration.
 */
import { describe, test, expect, afterEach } from "bun:test";
import { repoRootFor } from "../../schemas/cat-harness.js";
import { mkdtempSync, rmSync, appendFileSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

import {
  criterionProfiles,
  criterionAdapters,
  profileExcludesCriterion,
} from "../../schemas/block-qa";
import { CONTENT_PROFILES, CONTENT_ADAPTERS } from "../../schemas/block-kinds";
import { QA_CRITERIA_REGISTRY } from "../../content/pipeline/qa-criteria-registry";
import { readDeclaredFolioProfile, readFolioProfile } from "../../content/pipeline/profile-check";
import { initFolio } from "../init-folio";
import { writeInstanceConfig } from "../../test/support/instance-fixture.js";
import { instanceConfigFilename } from "../../schemas/harness-config.js";

const PLATFORM_ROOT = join(import.meta.dir, "..", "..");
const SWEEP = join(PLATFORM_ROOT, "content", "pipeline", "qa-sweep.ts");

/** A criterion that opts out of the document profile, and one that does not. */
const PAPER_ONLY = "voice-unicode-crash";
const EVERY_PROFILE = "voice-status-leak";

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

// ── Unit: the scope helpers ──────────────────────────────────────

describe("criterionProfiles — the default runs the other way from adapters", () => {
  test("absent means EVERY profile, not one of them", () => {
    // The single most consequential line in this change. `criterionAdapters`
    // defaults narrow because adapters partition; this defaults wide because
    // profiles nest and every existing criterion was written against the
    // document vocabulary with the math kinds as an addition.
    expect(criterionProfiles({})).toEqual(CONTENT_PROFILES);
    expect(criterionAdapters({})).toEqual(["paper"]);
  });

  test("an explicit scope is honoured", () => {
    expect(criterionProfiles({ profiles: ["paper"] })).toEqual(["paper"]);
    expect(criterionProfiles({ profiles: ["document"] })).toEqual(["document"]);
  });

  test("every criterion resolves to a non-empty scope", () => {
    for (const def of QA_CRITERIA_REGISTRY) {
      expect({ id: def.id, n: criterionProfiles(def).length > 0 }).toEqual({
        id: def.id,
        n: true,
      });
    }
  });

  test("the axis is an opt-out for a minority, not a re-scoping of the registry", () => {
    // The falsification condition stated when this was designed: if MOST
    // criteria needed `profiles: ["paper"]`, the default was wrong and the
    // axis should have defaulted narrow like `adapters`. It did not — so this
    // pins that the registry stays overwhelmingly profile-agnostic, and a
    // change that quietly opts half of it out has to argue with this test.
    const optedOut = QA_CRITERIA_REGISTRY.filter((d) => d.profiles !== undefined);
    expect(optedOut.length).toBeGreaterThan(0);
    expect(optedOut.length * 4).toBeLessThan(QA_CRITERIA_REGISTRY.length);
  });

  test("an opted-out criterion names `paper`, never `document` alone", () => {
    // A document-only criterion would be a different thing entirely — a rule
    // that a paper folio is exempt from — and nothing in the registry is one.
    // Left unasserted, `profiles: ["document"]` would be a silent way to
    // switch a criterion off for every paper folio in existence.
    for (const def of QA_CRITERIA_REGISTRY) {
      if (!def.profiles) continue;
      expect({ id: def.id, p: def.profiles }).toEqual({ id: def.id, p: ["paper"] });
    }
  });

  test("profiles and adapters stay orthogonal", () => {
    // Conflating them is the documented trap. A criterion scoped to the `dak`
    // adapter must not also be carrying a profile opt-out: profiles restrict
    // the PAPER adapter's vocabulary and say nothing about WHO L2/L3 kinds,
    // so the pair would read as a constraint that cannot be satisfied.
    for (const def of QA_CRITERIA_REGISTRY) {
      if (criterionAdapters(def).includes("paper")) continue;
      expect({ id: def.id, p: def.profiles }).toEqual({ id: def.id, p: undefined });
    }
    // And neither axis leaked into the other's value space.
    for (const p of CONTENT_PROFILES) {
      if (p === "paper") continue;
      expect(CONTENT_ADAPTERS as readonly string[]).not.toContain(p);
    }
  });
});

describe("profileExcludesCriterion — the third state", () => {
  test("excludes an opted-out criterion from a document folio", () => {
    expect(profileExcludesCriterion({ profiles: ["paper"] }, "document")).toBe(true);
  });

  test("never excludes an unannotated criterion", () => {
    expect(profileExcludesCriterion({}, "document")).toBe(false);
    expect(profileExcludesCriterion({}, "paper")).toBe(false);
  });

  test("an UNDETERMINED profile runs the criterion, it does not skip it", () => {
    // Not symmetry for its own sake: this is the difference between "this
    // folio is a document, so the TeX criterion does not apply" and "I could
    // not read this folio's config, so I skipped a critical check and
    // reported a clean sweep". Only the first is a verdict.
    expect(profileExcludesCriterion({ profiles: ["paper"] }, undefined)).toBe(false);
    expect(profileExcludesCriterion({ profiles: ["document"] }, undefined)).toBe(false);
  });
});

describe("readDeclaredFolioProfile — undetermined is not `paper`", () => {
  function folio(config?: string): string {
    const d = mkdtempSync(join(tmpdir(), "profile-scope-"));
    dirs.push(d);
    if (config !== undefined) writeInstanceConfig(d, config);
    return d;
  }

  test("a declared contentType resolves, and says where from", () => {
    const d = folio('{"contentType":"document"}');
    expect(readDeclaredFolioProfile(d).profile).toBe("document");
    expect(readDeclaredFolioProfile(d).declaredBy).toContain('contentType: "document"');
  });

  test("no config, no contentType, and unparseable config are all undetermined", () => {
    expect(readDeclaredFolioProfile(folio()).profile).toBeUndefined();
    expect(readDeclaredFolioProfile(folio("{}")).profile).toBeUndefined();
    expect(readDeclaredFolioProfile(folio("{ not json")).profile).toBeUndefined();
    for (const c of [undefined, "{}", "{ not json"]) {
      expect(readDeclaredFolioProfile(folio(c)).declaredBy).toContain("undetermined");
    }
  });

  test("the validator-facing reader still resolves undetermined to paper", () => {
    // Two callers, two right answers. `readFolioProfile` answers "may this
    // folio contain this block?", where the wider vocabulary is safe; the
    // declared reader answers "may I skip this check?", where it is not.
    expect(readFolioProfile(folio()).profile).toBe("paper");
    expect(readFolioProfile(folio()).declaredBy).toContain("default");
  });
});

// ── End to end: the sweep itself ─────────────────────────────────

/** Scaffold a folio and return `{ root, blockRoot }`. */
function scaffoldFolio(contentType: "paper" | "document"): {
  root: string;
  blockRoot: string;
} {
  const d = mkdtempSync(join(tmpdir(), `profile-sweep-${contentType}-`));
  dirs.push(d);
  initFolio({
    targetDir: d,
    contentType,
    slug: "cold-chain-guidance",
    title: "Cold Chain Guidance",
    authors: ["A. Author"],
    link: "sibling",
    assistantPath: "folio-assistant",
    skipVcs: true,
  });
  return {
    root: d,
    blockRoot: join(d, "folio", "cold-chain-guidance", "introduction", "overview"),
  };
}

/** Outcome of every criterion for one block, as the sweep reports it. */
function sweepOutcomes(root: string, blockRoot: string): Record<string, string> {
  const res = spawnSync(
    "bun",
    ["run", SWEEP, blockRoot + ".ts", "--dry-run", "--json"],
    { cwd: root, encoding: "utf-8", timeout: 600_000 },
  );
  if (res.status !== 0) {
    throw new Error(`qa-sweep exited ${res.status}\n${res.stderr}`);
  }
  const report = JSON.parse(res.stdout) as {
    results: Array<{ details: Array<{ criterion: string; outcome: string }> }>;
  };
  expect(report.results).toHaveLength(1);
  return Object.fromEntries(report.results[0].details.map((d) => [d.criterion, d.outcome]));
}

describe("the sweep's profile gate, end to end", () => {
  test("a paper-only criterion is n/a'd in a document folio, under its OWN outcome", () => {
    const { root, blockRoot } = scaffoldFolio("document");
    const out = sweepOutcomes(root, blockRoot);
    expect(out[PAPER_ONLY]).toBe("n/a-wrong-profile");
    // Not the adapter's string. A downstream reader — the per-block QA icons
    // this was built for — has to be able to say WHICH axis excluded it:
    // "wrong vocabulary" and "this folio takes no TeX" call for different
    // follow-up, and one shared string cannot carry both.
    expect(out[PAPER_ONLY]).not.toBe("n/a-wrong-adapter");
  });

  test("an UNANNOTATED criterion still runs in a document folio", () => {
    // The assertion that catches the false-pass regression. If `profiles`
    // ever defaults narrow, or a bulk annotation sweeps the registry, this is
    // where it shows up — and nowhere else, because the symptom of the bug is
    // silence.
    const { root, blockRoot } = scaffoldFolio("document");
    const out = sweepOutcomes(root, blockRoot);
    expect(out[EVERY_PROFILE]).toBeDefined();
    expect(out[EVERY_PROFILE]).not.toBe("n/a-wrong-profile");
    // And the gate is narrow in fact, not just in principle: the great
    // majority of what the sweep considered still got considered.
    const excluded = Object.values(out).filter((o) => o === "n/a-wrong-profile").length;
    expect(excluded * 4).toBeLessThan(Object.keys(out).length);
  });

  test("the same criterion runs in a paper folio — the gate is profile-driven", () => {
    // Without this, a criterion that had simply stopped working everywhere
    // would pass the document-folio assertion above.
    const { root, blockRoot } = scaffoldFolio("paper");
    const out = sweepOutcomes(root, blockRoot);
    expect(out[PAPER_ONLY]).not.toBe("n/a-wrong-profile");
    expect(out[EVERY_PROFILE]).not.toBe("n/a-wrong-profile");
  });

  test("a folio whose config cannot be read keeps its coverage", () => {
    // Third state, end to end. The config is corrupted rather than deleted,
    // because deleting it also removes the marker `findContentRepoRoot` walks
    // up to — and a test that changed two things at once would not show which
    // one the gate reacted to.
    const { root, blockRoot } = scaffoldFolio("document");
    // Named after the SLUG the scaffold declared, not after the temp
    // directory it landed in: `folio_init` writes the declaration and the
    // config together, and the declaration is what the filename comes from.
    const configPath = join(root, instanceConfigFilename("cold-chain-guidance"));
    expect(readFileSync(configPath, "utf-8")).toContain("document");
    appendFileSync(configPath, "\n{ truncated", "utf-8");
    expect(readDeclaredFolioProfile(root).profile).toBeUndefined();
    const out = sweepOutcomes(root, blockRoot);
    for (const outcome of Object.values(out)) {
      expect(outcome).not.toBe("n/a-wrong-profile");
    }
  });
});

/**
 * `zkgs`'s gate, over THIS REPOSITORY rather than a fixture.
 *
 * The bean's condition was stated exactly: *"the gate is that
 * `readDeclaredFolioProfile()` on this repository returns `document` rather
 * than the third state, and that a test fails if it regresses."* Every other
 * test here builds a throwaway folio, so none of them could have caught it —
 * the defect was in how the REAL tree is walked, and a fixture has no
 * `cat-harness/` to stop at.
 *
 * ## What it was
 *
 * `findContentRepoRoot()` walks up to the nearest ancestor declaring a folio
 * directory. `cat-harness` declares `folio/`, so the walk stopped there while
 * the configuration sat one level up, and nothing read it. The profile came
 * back UNDETERMINED on a repository that had declared `document` — and the
 * third state runs every criterion, so the paper adapter's LaTeX-shaped axes
 * fired `critical` on prose that never reaches pdflatex. The committed
 * sidecars proved it was happening.
 *
 * ## It was fixed by a RENAME, not by a patch
 *
 * The bean listed three candidate fixes and chose none, because each changed
 * what every pipeline consumer sees. What actually resolved it was
 * `harness.config.json` → `<name>.config.json` (2026-09-21): every instance
 * now carries its own config at its own root, so the walk no longer has to
 * survive passing a folio directory. That is option C's ending — the config
 * root resolved separately and declaration-driven — reached by another road.
 *
 * ## Why reading the live tree is right HERE
 *
 * `yag0` this week was a test that derived its EXPECTATION from the data it
 * was checking, and so passed on broken data. This does the opposite: the
 * expectation is `document`, pinned here independently, and the subject is
 * the real walk over the real tree — which is the only thing that can fail
 * the way `zkgs` failed.
 */
describe("readDeclaredFolioProfile over the real repository (bean `zkgs`)", () => {
  const REPO = repoRootFor(resolve(import.meta.dir, "../.."));

  // WALKED ONCE EACH, not per assertion. `readDeclaredFolioProfile` walks the
  // real tree, and calling it five times added ~5s to this file — enough to
  // push the pre-existing end-to-end sweep test below past its 5s timeout.
  // A test that makes a SIBLING fail is still this test's defect.
  const atRoot = readDeclaredFolioProfile(REPO);
  const atCatHarness = readDeclaredFolioProfile(join(REPO, "cat-harness"));

  test("the repository root resolves to `document`, not the third state", () => {
    expect(atRoot.profile).toBe("document");
  });

  /**
   * The assertion that actually catches a regression. `profile` alone is
   * weak — an undetermined read and a correct one differ by a field nobody
   * looks at. `declaredBy` names the FILE, so it is only right when the
   * config was genuinely read.
   */
  test("and it says WHICH config it read — the half that proves the walk arrived", () => {
    expect(atRoot.declaredBy).toContain(".config.json");
    expect(atRoot.declaredBy).not.toContain("undetermined");
  });

  /**
   * The instance one level down must resolve too, and to its OWN config.
   * This is the pair the defect lived between: the walk stopped here, and
   * the root above went unread. Both answering is what `zkgs` asked for.
   */
  test("`cat-harness/` resolves to its own config, not the root's", () => {
    expect(atCatHarness.profile).toBe("document");
    expect(atCatHarness.declaredBy).toContain("cat-harness.config.json");
  });
});
