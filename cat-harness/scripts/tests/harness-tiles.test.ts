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

import { siteDirFor } from "../../schemas/cat-harness.js";
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
    writeFileSync(join(dir, "harness.json"), JSON.stringify(decl, null, 2));
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

const host = (extra: Record<string, unknown> = {}) => ({
  name: "host",
  directories: [{ id: "beans", path: "beans/", graphs: ["beans"] }],
  ...extra,
});

const tilesOf = (f: { repo: string; names: string[] }) =>
  harnessTiles(f.repo, join(f.repo, "host"), f.names);

describe("the ORDER is read from the declaration, never from a name", () => {
  test("an instance exempt from owing a visualiser sorts last", () => {
    // cat-bootstrap's own renderExemption says it in those words — "cat-bootstrap
    // IS the navbar footer" — so this reads the exemption. A checker that
    // tested for the string would state a rule true only for the instance
    // somebody remembered, which is bean `hfkl`'s whole argument.
    const f = fixture({
      host: host(),
      zeta: { name: "zeta", directories: [] },
      alpha: {
        name: "alpha",
        directories: [],
        renderExemption: { of: ["visualiser"], reason: "it is the floor", owes: "its own graph" },
      },
    });
    expect(tilesOf(f).map((t) => t.name)).toEqual(["host", "zeta", "alpha"]);
  });

  test("and it is the EXEMPTION, not alphabetical luck", () => {
    // `alpha` sorts first by name and last by rule; a comparator that happened
    // to agree with the alphabet would pass the test above by accident.
    const f = fixture({
      host: host(),
      alpha: {
        name: "alpha",
        directories: [],
        renderExemption: { of: ["visualiser"], reason: "floor", owes: "graph" },
      },
    });
    const [, last] = tilesOf(f);
    expect(last!.name).toBe("alpha");
    expect(last!.footer).toBe(true);
  });

  test("everything else is alphabetical, so the order does not depend on the disk", () => {
    const f = fixture({ host: host(), zeta: { name: "zeta" }, beta: { name: "beta" } });
    expect(tilesOf(f).map((t) => t.name)).toEqual(["beta", "host", "zeta"]);
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
