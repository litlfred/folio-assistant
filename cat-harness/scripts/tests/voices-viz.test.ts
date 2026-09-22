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
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readVoicesGraph, type VoicesGraph } from "../voices-graph.ts";
import { viewerHtml } from "../gen-voices-viz.ts";
import { shippedVoices, overlaySeverityOf } from "../../content/pipeline/voice-criteria.ts";
import { overlayCriterionId } from "../../content/pipeline/voice-criteria.ts";
import { directoriesForGraph, instanceRootsIn, repoRootFor } from "../../schemas/cat-harness.ts";

const INSTANCE = join(import.meta.dir, "..", "..");
/** The repository root — `repoRootFor` takes an INSTANCE root and is `dirname`. */
const REPO = repoRootFor(INSTANCE);

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
  test("a declared-but-absent directory IS reported, on a fixture that cannot be closed", () => {
    // This asserted "at least one is false today", and its own comment named
    // the hazard: closing the gap and a reader that DROPS absent directories
    // make the corpus look identical. The gap was then closed — `agent-skills`
    // shipped its voices on 2026-09-22, bean `26tu` — and the assertion went
    // red for the good reason.
    //
    // A test whose subject is a defect expires when the defect is fixed, so
    // the subject is now a fixture: an instance declaring a `voices` directory
    // that is not there. It asserts the READER's behaviour, which is the thing
    // that must never regress, and no amount of tidying the corpus can make it
    // vacuous.
    const root = mkdtempSync(join(tmpdir(), "voices-absent-"));
    const inst = join(root, "myinst");
    mkdirSync(inst, { recursive: true });
    writeFileSync(
      join(inst, "myinst.json"),
      JSON.stringify({
        name: "myinst",
        directories: [
          {
            id: "voices",
            path: "skills/voices/",
            graphKinds: ["voices"],
            dependents: "skip",
            description: "declared and deliberately absent — the fixture for this test",
          },
        ],
      }),
    );
    try {
      const g = readVoicesGraph([inst], root)!;
      expect(g).not.toBeNull();
      const absent = g.directories.filter((d) => !d.present);
      expect(absent.length).toBe(1);
      expect(absent[0]!.voices).toEqual([]);
      expect(absent[0]!.dir).toContain("skills/voices");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("...and the corpus's directories are all ACCOUNTED FOR, present or not", () => {
    // The other half, and the one the old assertion was really protecting: a
    // reader that silently dropped an absent directory would pass the fixture
    // above only if it dropped it there too — but a reader that drops them
    // only when SOME are present would not. So every declared voices directory
    // must appear in the graph, whatever its state on disk.
    const declared = instanceRootsIn(REPO).flatMap((r) => directoriesForGraph(r, "voices"));
    expect(G.directories.length).toBe(declared.length);
    for (const d of G.directories) {
      expect(typeof d.present).toBe("boolean");
      if (!d.present) expect(d.voices).toEqual([]);
    }
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

describe("the provenance QA flag — a question for a person, not a gate", () => {
  test("`house` is never flagged, however its rules cite — the owner's ruling", () => {
    // Owner, 2026-09-21: "c) keep, but is a QA flag". `milnor` declares
    // `house` and all twelve rules cite an ingested paper, because the
    // citations are evidence FOR this project's standard rather than its
    // source. A flag here would reverse a decision that was actually made.
    const milnor = G.voices.find((v) => v.id === "milnor");
    expect(milnor).toBeDefined();
    expect(milnor!.provenance).toBe("house");
    expect(milnor!.rules.every((r) => r.citation === "library")).toBe(true);
    expect(milnor!.provenanceFlags).toEqual([]);
  });

  test("...and it fires on the voice that IS mixed, so the exemption is not a blanket", () => {
    // The falsification. A flag that fires on nothing is indistinguishable
    // from one that cannot fire, and the corpus contains exactly one case:
    // `technical-writer` declares `assertion` while three of its nine rules
    // cite a node of this project's own graph.
    const flagged = G.voices.filter((v) => v.provenanceFlags.length > 0);
    expect(flagged.map((v) => v.id)).toEqual(["technical-writer"]);
    const f = flagged[0]!.provenanceFlags[0]!;
    expect(f.code).toBe("declared-outside-cites-inside");
    expect(f.ruleIds.length).toBe(3);
    // Plain text: the detail is escaped into HTML by the viewer, so markup
    // here reaches the reader as literal characters.
    expect(f.detail).not.toContain("`");
  });

  test("the flag is advisory — nothing about it is a severity the sidecars carry", () => {
    // The distinction the owner's ruling turns on. An overlay criterion has a
    // severity and a QA sidecar; a provenance flag has neither, because a
    // voice that is a synthesis of composite sources is the NORMAL case and
    // refusing it would encode per-rule attribution one level down.
    for (const v of G.voices) {
      for (const f of v.provenanceFlags) {
        expect(f).not.toHaveProperty("severity");
      }
    }
  });

  test("the viewer renders provenance at all, which it did not before", () => {
    // It showed the instance, the path, the rule count, the overlay criterion
    // and the SKILL.md — and never the field this whole section is about.
    const html = viewerHtml("../../assets/voices/index.json");
    expect(html).toContain("renderFlags");
    expect(html).toContain("provenance <b>");
    expect(html).toContain("pflag");
  });
});

describe("vendor overrides live in a reserved sub-sub-graph", () => {
  // Owner, 2026-09-22: "vendor overides go in sub-sub-grahiphs like
  // voice/vendors or voices-vendors". The nested spelling was taken, because
  // the flat one needs a SECOND declared graph for one concept.
  //
  // These run against a throwaway directory rather than the corpus, because
  // this repository ships no vendor override yet — and a test that can only
  // assert once content exists is a test that does not guard the layout the
  // content is about to be written into.

  const profile = (id: string, overrides?: string) =>
    JSON.stringify({
      $schema: "folio-voice/v1",
      id,
      title: `${id} — a fixture voice`,
      description: `The ${id} voice, used only by this test.`,
      provenance: "evidence",
      sources: [{ title: "A fixture source" }],
      ...(overrides === undefined ? {} : { extends: { voiceId: overrides } }),
      rules: [
        {
          id: `${id}-one-rule`,
          title: `${id} keeps at least one rule`,
          description: "A voice with no rules does not parse, so the fixture carries one.",
          category: "structure",
          severity: "minor",
          source: { kgRef: "skills/folio-core/technical-documentation.md", quote: "a fixture quote" },
        },
      ],
    });

  function fixture(): string {
    const root = mkdtempSync(join(tmpdir(), "voices-vendors-"));
    const voices = join(root, "skills", "voices");
    mkdirSync(join(voices, "base-voice"), { recursive: true });
    writeFileSync(join(voices, "base-voice", "voice.json"), profile("base-voice"));
    mkdirSync(join(voices, "vendors", "base-voice-acme"), { recursive: true });
    writeFileSync(
      join(voices, "vendors", "base-voice-acme", "voice.json"),
      profile("base-voice-acme", "base-voice"),
    );
    return root;
  }

  test("a voice under `vendors/` is LOADED, not silently skipped", async () => {
    // The defect this guards is `dh4f`: the reader scanned one level and took a
    // directory for a voice only where it held a `voice.json`. `vendors/` holds
    // none, so every override under it would have read as absent — a clean run
    // over real content.
    const { loadVoices } = await import("../../schemas/voices.ts");
    const root = fixture();
    try {
      const ids = loadVoices(root).map((v) => v.id).sort();
      expect(ids).toEqual(["base-voice", "base-voice-acme"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("`vendors` itself is never loaded AS a voice", async () => {
    const { loadVoices } = await import("../../schemas/voices.ts");
    const root = fixture();
    try {
      expect(loadVoices(root).map((v) => v.id)).not.toContain("vendors");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("the FILE carries the relation, not the path", async () => {
    // The directory is where a person looks. Nothing downstream may infer
    // "this overrides that" from a path, which is the standing rule that a
    // declaration inside the file is the contract.
    const { loadVoices } = await import("../../schemas/voices.ts");
    const root = fixture();
    try {
      const vendor = loadVoices(root).find((v) => v.id === "base-voice-acme")!;
      expect(vendor.extends?.voiceId).toBe("base-voice");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("recursion is ONE reserved name deep, not arbitrary", async () => {
    // "Any directory, any depth" is a rule nobody can check, and it would make
    // an unrelated nested directory a silent part of the graph.
    const { loadVoices } = await import("../../schemas/voices.ts");
    const root = fixture();
    const stray = join(root, "skills", "voices", "notes", "draft");
    mkdirSync(stray, { recursive: true });
    writeFileSync(join(stray, "voice.json"), profile("draft"));
    try {
      expect(loadVoices(root).map((v) => v.id)).not.toContain("draft");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
