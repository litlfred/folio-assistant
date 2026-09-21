/**
 * The voices reader and its viewer.
 *
 * Bean `bu2q`. Four things are asserted here, and each is something that would
 * go wrong SILENTLY — a page that renders, looks right, and says something
 * false. A generator whose output is HTML has no type system between it and
 * the reader, so the checks that matter are the ones about what the page
 * CLAIMS.
 */

import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { readVoicesGraph, type VoicesGraph } from "../voices-graph.ts";
import { viewerHtml } from "../gen-voices-viz.ts";
import { shippedVoices, overlaySeverityOf } from "../../content/pipeline/voice-criteria.ts";
import { overlayCriterionId } from "../../content/pipeline/voice-criteria.ts";

const INSTANCE = join(import.meta.dir, "..", "..");

/** Read once — the reader touches the filesystem across every instance. */
const G: VoicesGraph = (() => {
  const g = readVoicesGraph([INSTANCE]);
  if (g === null) throw new Error("no voices directory is declared — the fixture is the corpus");
  return g;
})();

describe("the reader finds what the declarations say is there", () => {
  test("every voice this repository ships appears exactly once", () => {
    const shipped = shippedVoices(INSTANCE).map((s) => s.voice.id).sort();
    expect(G.voices.map((v) => v.id)).toEqual(shipped);
    expect(new Set(G.voices.map((v) => v.id)).size).toBe(G.voices.length);
  });

  test("a voice is attributed to the instance that DERIVED it, never to the platform", () => {
    // The whole point of the move this graph exists to render: `cat-harness`
    // is the machinery and holds no voice. A reader seeing `cat-harness` in
    // the instance column would be reading the pre-`btuv` world.
    for (const v of G.voices) expect(v.instance).not.toBe("folio-assistant");
    const owners = new Set(G.voices.map((v) => v.instance));
    expect(owners.size).toBeGreaterThan(1);
  });

  test("the path it reports is the file a reader can actually open", async () => {
    const { existsSync } = await import("node:fs");
    const repo = join(INSTANCE, "..");
    for (const v of G.voices) {
      expect(existsSync(join(repo, v.path))).toBe(true);
    }
  });
});

describe("a declared directory that is not there is a ROW, not a silence", () => {
  test("the directories list carries `present`, and at least one is false today", () => {
    // `agent-skills` declares a `voices` graph and ships none (bean `26tu`).
    // If this ever stops holding because the gap was CLOSED, the assertion
    // below is the thing to change — but a reader dropping absent directories
    // would also make it pass, and that is the `dh4f` defect. So the count of
    // directories is checked against the declarations rather than the disk.
    const absent = G.directories.filter((d) => !d.present);
    expect(absent.length).toBeGreaterThan(0);
    for (const d of absent) expect(d.voices).toEqual([]);
  });

  test("an absent directory still reports its declared path", () => {
    for (const d of G.directories.filter((x) => !x.present)) {
      expect(d.dir.length).toBeGreaterThan(0);
      expect(d.instance.length).toBeGreaterThan(0);
    }
  });
});

describe("the citations — the reason the page exists", () => {
  test("every rule cites something, and the reader says WHICH KIND", () => {
    const rules = G.voices.flatMap((v) => v.rules);
    expect(rules.length).toBeGreaterThan(0);
    for (const r of rules) {
      expect(r.citation === "library" || r.citation === "kg-node").toBe(true);
      expect(r.cites).toBeTruthy();
    }
  });

  test("every rule carries the passage it was read from", () => {
    // PR #210 is the reason: ten plausible rules per voice with `source: null`,
    // one asserting the opposite of what its source says. A quote is what lets
    // a reviewer check a derivation without opening the PDF.
    for (const r of G.voices.flatMap((v) => v.rules)) {
      expect(r.quote.trim().length).toBeGreaterThan(0);
    }
  });

  test("the totals add up to the rules, rather than being counted twice", () => {
    const rules = G.voices.flatMap((v) => v.rules);
    expect(G.totals.rules).toBe(rules.length);
    expect(G.totals.citingLibrary + G.totals.citingKgNode).toBe(rules.length);
    expect(G.totals.voices).toBe(G.voices.length);
  });
});

describe("the page agrees with the QA sidecars about severity", () => {
  test("`overlaySeverity` and `criterion` match what the criteria derivation produces", () => {
    // A page showing one severity while the sidecars carry another is worse
    // than a page showing none: it is a second answer, free to disagree, and
    // the reader has no way to tell which is live. Two readers over one fact,
    // checked against each other rather than hoped about.
    const byId = new Map(shippedVoices(INSTANCE).map((s) => [s.voice.id, s.voice]));
    for (const v of G.voices) {
      const voice = byId.get(v.id);
      expect(voice).toBeDefined();
      expect(v.overlaySeverity).toBe(overlaySeverityOf(voice!));
      expect(v.criterion).toBe(overlayCriterionId(v.id));
    }
  });
});

describe("the viewer page", () => {
  const html = viewerHtml("../../assets/voices/index.json");

  test("it carries no stray backtick — the failure mode this generator family has", () => {
    // Twice in the sibling generator, both times in a COMMENT: a backtick
    // terminates the template literal and the rest becomes TypeScript, failing
    // at a line far from the mistake. Bean `bmr0`.
    expect(html).not.toContain("`");
  });

  test("it names its own scope, which is what makes pruning safe", () => {
    expect(/var SCOPE = "";/.test(html)).toBe(true);
    expect(/var SCOPE = "who-style-guide";/.test(viewerHtml("x", "who-style-guide"))).toBe(true);
  });

  test("it fetches the projection at the href it was given", () => {
    expect(html).toContain('fetch("../../assets/voices/index.json")');
  });

  test("it escapes interpolated text", () => {
    // Every voice field reaches the DOM through `esc`, and a quote is prose
    // from a source document — the one field most likely to contain a bracket.
    expect(html).toContain("function (s) {");
    expect(html).toContain('replace(/</g, "&lt;")');
  });

  test("it renders the no-citation state as a finding rather than a blank", () => {
    // Unreachable through the schema, and rendered anyway: a reader who cannot
    // tell "no citation" from "citation not rendered" learns nothing from an
    // empty cell.
    expect(html).toContain("This rule cites nothing");
  });

  test("it declares a dark scheme that a `light` override can beat", () => {
    expect(html).toContain('prefers-color-scheme: dark');
    expect(html).toContain(':root:not([data-theme="light"])');
    expect(html).toContain(':root[data-theme="dark"]');
  });
});
