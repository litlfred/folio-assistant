/**
 * One fat tile per initiated harness — ordered by declaration, linked by
 * presence, honest about both gaps.
 *
 * The tests that matter are the ones that would pass for a generator that
 * quietly linked nothing, or that hardcoded the bootstrap's name.
 *
 * @module scripts/tests/harness-tiles.test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DECLARATION_FILENAME, siteDirFor } from "../../schemas/cat-harness.js";
import { harnessTiles, ownStatePage, subjectPage } from "../harness-tiles.js";

/** A repo with a site-owning harness and any number of siblings. */
function fixture(
  instances: Record<string, unknown>,
  pages: readonly string[] = [],
): { repo: string; names: string[] } {
  const repo = mkdtempSync(join(tmpdir(), "harness-tiles-"));
  for (const [name, decl] of Object.entries(instances)) {
    const dir = name === "" ? repo : join(repo, name);
    mkdirSync(dir, { recursive: true });
    // `dependents` is REQUIRED on every directory entry and has no default on
    // purpose, so a fixture that omitted it would fail in `readDeclaration`
    // rather than in the assertion. Filled in here so each test states only
    // the fields it is about.
    const d = decl as { directories?: Array<Record<string, unknown>> };
    for (const entry of d.directories ?? []) entry["dependents"] ??= "skip";
    writeFileSync(join(dir, DECLARATION_FILENAME), JSON.stringify(decl, null, 2));
  }
  // The site root is READ from the host's declaration, never written here.
  // `site-dir-single-answer.test.ts` guards that rule across the whole tree,
  // and a fixture that hardcoded the default would be a second answer to
  // "where does this instance publish" — in the tests of all places.
  const site = siteDirFor(join(repo, "host"));
  for (const p of pages) {
    const dir = join(repo, "host", site, p);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), "<!doctype html>");
  }
  return { repo, names: Object.keys(instances).filter((n) => n !== "").sort() };
}

/**
 * Give an instance its own site directory — what `folioRoot` looks for.
 *
 * The path is READ from that instance's declaration rather than written here.
 * `site-dir-single-answer.test.ts` guards that rule across the whole tree, and
 * it caught this helper's first version hardcoding the default.
 */
function giveOwnSite(repo: string, name: string): void {
  mkdirSync(join(repo, name, siteDirFor(join(repo, name))), { recursive: true });
}

const host = (extra: Record<string, unknown> = {}) => ({
  name: "host",
  directories: [{ id: "beans", path: "beans/", graphs: ["beans"] }],
  ...extra,
});

const tilesOf = (f: { repo: string; names: string[] }) =>
  harnessTiles(f.repo, join(f.repo, "host"), f.names);

describe("the ORDER is the declared dependency stack, bottom to top", () => {
  test("the spine reads foundation-last, which is the owner's sentence", () => {
    // Owner, 2026-09-20: "So bootsteap, cat harness, fa-core, f-a, from bottom
    // to top." Computed from `needs`, never written out as names.
    const f = fixture({
      host: host({ needs: [] }),
      mid: { name: "mid", directories: [], needs: ["host"] },
      top: { name: "top", directories: [], needs: ["mid"] },
    });
    expect(tilesOf(f).map((t) => t.name)).toEqual(["top", "mid", "host"]);
  });

  test("it is the DECLARATION, not alphabetical luck", () => {
    // `a` sorts first by name and sits at the bottom by rule; a comparator
    // that happened to agree with the alphabet would pass the test above.
    const f = fixture({
      host: host({ needs: ["a"] }),
      a: { name: "a", directories: [], needs: [] },
    });
    expect(tilesOf(f).map((t) => t.name)).toEqual(["host", "a"]);
  });

  test("an instance that declares NO needs sits BELOW the spine's head, and says so", () => {
    // Owner, 2026-09-21: "in reverse dep order (so bootsrap on bottom,
    // folio-asst, on top)". The first version put the whole unplaced group
    // above the spine, which left the most derived instance eighth from the
    // top — both endpoints of that sentence were wrong.
    // Absent is not `[]`. A node that needs nothing is free to sort first in
    // `flattenDependencies`, which would put an unlabelled instance on the
    // floor beside the bootstrap — asserting something nobody declared.
    const f = fixture({
      host: host({ needs: [] }),
      top: { name: "top", directories: [], needs: ["host"] },
      loose: { name: "loose", directories: [] },
    });
    const tiles = tilesOf(f);
    expect(tiles.map((t) => t.name)).toEqual(["top", "loose", "host"]);
    expect(tiles.find((t) => t.name === "loose")!.findings.join(" ")).toContain("alphabetical rather than derived");
  });

  test("the declared FLOOR is last even when its layer was never declared", () => {
    // The second rule, and the reason it is kept separate: an exempt instance
    // with no `needs` is undetermined, and undetermined floats to the top of
    // the unplaced group — which would put the bootstrap above everything it
    // underpins.
    const f = fixture({
      host: host({ needs: [] }),
      boot: {
        name: "boot",
        directories: [],
        renderExemption: { of: ["visualiser"], reason: "it is the floor", owes: "its own graph" },
      },
    });
    const tiles = tilesOf(f);
    expect(tiles[tiles.length - 1]!.name).toBe("boot");
    expect(tiles[tiles.length - 1]!.footer).toBe(true);
  });

  test("the two rules AGREE on the real repository — the floor is also the deepest layer", () => {
    const f = fixture({
      host: host({ needs: ["boot"] }),
      boot: {
        name: "boot",
        directories: [],
        needs: [],
        renderExemption: { of: ["visualiser"], reason: "floor", owes: "graph" },
      },
    });
    expect(tilesOf(f).map((t) => t.name)).toEqual(["host", "boot"]);
  });

  test("a CYCLE is reported and falls back to alphabetical — it does not blank the navbar", () => {
    // `flattenDependencies` returns an empty order on a broken graph, which is
    // right for a pipeline and wrong for a sidebar: showing nothing hides
    // every instance over one typo.
    const f = fixture({
      host: host({ needs: ["b"] }),
      b: { name: "b", directories: [], needs: ["host"] },
    });
    const tiles = tilesOf(f);
    expect(tiles.map((t) => t.name)).toEqual(["b", "host"]);
    expect(tiles.flatMap((t) => t.findings).join(" ")).toContain("cycle");
  });

  test("a dependency naming no instance is reported, never silently dropped", () => {
    const f = fixture({ host: host({ needs: ["ghost"] }) });
    expect(tilesOf(f)[0]!.findings.join(" ")).toContain('needs "ghost"');
  });
});

describe("a link is DECLARATION-driven and PRESENCE-checked", () => {
  test("a declared graph with a published page becomes a link", () => {
    const f = fixture(
      { host: host(), who: { name: "who", directories: [{ id: "lib", path: "library/", graphs: ["library"] }] } },
      ["host/library/who"],
    );
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.visualisations).toEqual([{ kind: "library", path: "/host/library/who/" }]);
  });

  test("a declared graph with NO page is not linked, and is reported", () => {
    // The `pb04` rule: a dead link is worse than no link. The assertion is on
    // BOTH halves, because a generator that dropped the entry silently would
    // satisfy "not linked" and hide the gap.
    const f = fixture({
      host: host(),
      who: { name: "who", directories: [{ id: "lib", path: "library/", graphs: ["library"] }] },
    });
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.visualisations).toEqual([{ kind: "library" }]);
    expect(who.findings.join(" ")).toContain("no published viewer");
  });

  test("a page published under a kind the instance does NOT declare is reported, not linked", () => {
    // `flh4`'s other half. The declaration decides what a tile claims to show,
    // so this cannot become a link — but silence would hide a working viewer
    // behind a rule, and the remedy is one line in a declaration.
    const f = fixture({ host: host(), who: { name: "who", directories: [] } }, ["host/library/who"]);
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.visualisations).toEqual([]);
    expect(who.findings.join(" ")).toContain("does not declare");
  });

  test("the site-owning instance elides its own name, as state-visualizer does", () => {
    const f = fixture({ host: host() }, ["beans"]);
    expect(tilesOf(f)[0]!.visualisations).toEqual([{ kind: "beans", path: "/beans/" }]);
  });

  test("a sibling gets NO page at the elided path — that namespace is the owner's", () => {
    // `/beans/` is the host's. A sibling declaring a `beans` graph must not
    // pick up the host's page as though it were its own.
    const f = fixture({ host: host(), who: { name: "who", directories: [{ id: "b", path: "b/", graphs: ["beans"] }] } }, [
      "beans",
    ]);
    expect(tilesOf(f).find((t) => t.name === "who")!.visualisations).toEqual([{ kind: "beans" }]);
  });
});

describe("the stats are DERIVED, so they cannot disagree with the tile", () => {
  test("views counts only what is actually linked", () => {
    const f = fixture(
      {
        host: host(),
        who: {
          name: "who",
          directories: [
            { id: "lib", path: "library/", graphs: ["library"] },
            { id: "sch", path: "schemas/", graphs: ["schemas"] },
          ],
        },
      },
      ["host/library/who"],
    );
    const who = tilesOf(f).find((t) => t.name === "who")!;
    const by = Object.fromEntries(who.stats.map((s) => [s.id, s.value]));
    expect(by).toEqual({ directories: 2, kinds: 2, views: 1 });
    expect(who.visualisations.filter((v) => v.path).length).toBe(by["views"]);
  });

  test("every stat carries a label, because a badge with no name is an unnamed control", () => {
    const f = fixture({ host: host() });
    for (const s of tilesOf(f)[0]!.stats) expect(s.label.length).toBeGreaterThan(0);
  });

  test("two directories holding the same graph count as one KIND", () => {
    const f = fixture({
      host: host({
        directories: [
          { id: "a", path: "a/", graphs: ["beans"] },
          { id: "b", path: "b/", graphs: ["beans"] },
        ],
      }),
    });
    const by = Object.fromEntries(tilesOf(f)[0]!.stats.map((s) => [s.id, s.value]));
    expect(by).toEqual({ directories: 2, kinds: 1, views: 0 });
  });
});

describe("an instance with no avatar says so rather than rendering blank", () => {
  test("a name with no declared avatar takes the generic one and is reported", () => {
    const f = fixture({ host: host(), who: { name: "who", directories: [] } });
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.genericAvatar).toBe(true);
    expect(who.findings.join(" ")).toContain("no avatar declared");
  });

  test("a name that IS a declared kind takes its own hue", () => {
    // `cat-harness` is in the avatar registry, so its tile is themed by the
    // mechanism that already exists rather than by a second palette.
    const f = fixture({ "cat-harness": { name: "cat-harness", directories: [] }, host: host() });
    const ch = tilesOf(f).find((t) => t.name === "cat-harness")!;
    expect(ch.genericAvatar).toBe(false);
    expect(ch.tone).toBeGreaterThan(0);
  });
});

describe("the published paths are the OTHER generators' rules, read rather than restated", () => {
  test("a subject page is handler/kind/subject — never subject first", () => {
    // `gen-library-viz.ts` is emphatic: `<base>/who-iris/` is who-iris
    // presenting itself, and a viewer parked there would squat on the
    // instance's own site.
    expect(subjectPage("cat-harness", "library", "who-iris")).toBe("/cat-harness/library/who-iris/");
  });

  test("the owner's own state graph elides the name", () => {
    expect(ownStatePage("beans")).toBe("/beans/");
  });
});

describe("a repository with nothing to show", () => {
  test("no site-owning declaration yields no tiles rather than throwing", () => {
    const repo = mkdtempSync(join(tmpdir(), "harness-tiles-"));
    expect(harnessTiles(repo, join(repo, "host"), [])).toEqual([]);
  });

  test("an instance directory with no harness.json is skipped, not guessed at", () => {
    const f = fixture({ host: host() });
    mkdirSync(join(f.repo, "not-an-instance"), { recursive: true });
    expect(harnessTiles(f.repo, join(f.repo, "host"), ["host", "not-an-instance"])).toHaveLength(1);
  });
});

describe("the tile opens the INSTANCE, not a kind handler's view of it", () => {
  test("an instance with its own docs/ links to its themed root", () => {
    // Owner, 2026-09-21: "cliking shoud go to folio view, not the schema
    // viweer", and `mount-instance-docs`: "who-iris themed at `/who-iris/`".
    const f = fixture(
      { host: host(), who: { name: "who", directories: [{ id: "s", path: "s/", graphs: ["schemas"] }] } },
      ["host/schemas/who"],
    );
    giveOwnSite(f.repo, "who");
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect({ href: who.href, kind: who.hrefKind }).toEqual({ href: "/who/", kind: "folio" });
  });

  test("an instance WITHOUT its own docs/ falls back to a viewer, and says so", () => {
    const f = fixture(
      { host: host(), who: { name: "who", directories: [{ id: "s", path: "s/", graphs: ["schemas"] }] } },
      ["host/schemas/who"],
    );
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.hrefKind).toBe("viewer");
    expect(who.findings.join(" ")).toContain("rather than the instance's own themed root");
  });

  test("an instance with neither is NOT a link", () => {
    // `pb04`: a dead link invites a click and then reads as "this site is
    // broken". No target is a better answer than a guessed one.
    const f = fixture({ host: host(), who: { name: "who", directories: [] } });
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.href).toBeUndefined();
    expect(who.hrefKind).toBeUndefined();
  });

  test("the folio view WINS over a viewer that also exists", () => {
    // The defect the owner reported: the first version took whichever viewer
    // sorted first, which for a schemas-only instance is the schema viewer.
    const f = fixture(
      { host: host(), who: { name: "who", directories: [{ id: "s", path: "s/", graphs: ["schemas"] }] } },
      ["host/schemas/who"],
    );
    giveOwnSite(f.repo, "who");
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.href).toBe("/who/");
    // ...and the viewer is still reachable, listed rather than dropped.
    expect(who.visualisations.filter((v) => v.path).map((v) => v.path)).toEqual(["/host/schemas/who/"]);
  });
});
