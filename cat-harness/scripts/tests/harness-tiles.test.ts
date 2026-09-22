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

import { siteDir, siteDirFor } from "../../schemas/cat-harness.js";
import { harnessTiles, ownStatePage, subjectPage } from "../harness-tiles.js";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

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
    writeDeclaration(dir, JSON.stringify(decl, null, 2));
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
  directories: [{ id: "beans", path: "beans/", graphKinds: ["beans"] }],
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
      { host: host(), who: { name: "who", directories: [{ id: "lib", path: "library/", graphKinds: ["library"] }] } },
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
      who: { name: "who", directories: [{ id: "lib", path: "library/", graphKinds: ["library"] }] },
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
    const f = fixture({ host: host(), who: { name: "who", directories: [{ id: "b", path: "b/", graphKinds: ["beans"] }] } }, [
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
            { id: "lib", path: "library/", graphKinds: ["library"] },
            { id: "sch", path: "schemas/", graphKinds: ["schemas"] },
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
          { id: "a", path: "a/", graphKinds: ["beans"] },
          { id: "b", path: "b/", graphKinds: ["beans"] },
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
      { host: host(), who: { name: "who", directories: [{ id: "s", path: "s/", graphKinds: ["schemas"] }] } },
      ["host/schemas/who"],
    );
    giveOwnSite(f.repo, "who");
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect({ href: who.href, kind: who.hrefKind }).toEqual({ href: "/who/", kind: "folio" });
  });

  test("an instance WITHOUT its own docs/ falls back to a viewer, and says so", () => {
    const f = fixture(
      { host: host(), who: { name: "who", directories: [{ id: "s", path: "s/", graphKinds: ["schemas"] }] } },
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
      { host: host(), who: { name: "who", directories: [{ id: "s", path: "s/", graphKinds: ["schemas"] }] } },
      ["host/schemas/who"],
    );
    giveOwnSite(f.repo, "who");
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.href).toBe("/who/");
    // ...and the viewer is still reachable, listed rather than dropped.
    expect(who.visualisations.filter((v) => v.path).map((v) => v.path)).toEqual(["/host/schemas/who/"]);
  });
});

describe("an icon is PUBLISHED, never declared — owner: \"broken image on LHS navbar\"", () => {
  /** An instance declaring an icon at a path under its own site directory. */
  const withIcon = (name: string, extra: Record<string, unknown> = {}) => ({
    name,
    directories: [{ id: "beans", path: "beans/", graphKinds: ["beans"] }],
    icon: "mark",
    // The site directory is read from the DECLARATION, not from disk: this
    // runs before the fixture has written anything, and hardcoding the default
    // here would be the second answer `site-dir-single-answer.test.ts` exists
    // to refuse.
    images: [{ id: "mark", src: `${siteDir({ name, stub: name })}/assets/img/mark.svg`, title: "M" }],
    ...extra,
  });

  test("the site directory's prefix is STRIPPED, because the mount does not carry it", () => {
    // Measured on the served bytes, 2026-09-21:
    //   src="/folio-assistant/STAGING/<branch>/docs/assets/img/icons/cat-mark.svg"
    // `docs/` is the instance's site directory and the build copies its
    // CONTENTS to the mount, so every reader got a 404 and a placeholder.
    const f = fixture({ host: withIcon("host") });
    const [tile] = tilesOf(f).filter((t) => t.name === "host");
    expect(tile.icon?.src).toBe("/assets/img/mark.svg");
    expect(tile.icon?.src).not.toContain(`${siteDirFor(join(f.repo, "host"))}/`);
  });

  test("an instance mounted beneath the site root carries its SITE DIR's mount", () => {
    // THIS TEST ASSERTED `/sibling/...` AND THAT WAS THE BUG, on the premise
    // "the site owner is at `/`; everything else is at `/<name>/`".
    //
    // Disproved by running the mount rather than by reading a file:
    //
    //     who-iris/library/  ->  /who-iris/        (1378 files)
    //     who-iris/docs/     ->  /docs/who-iris/   (4 files)
    //
    // Every instance gets a `<kind>/<name>` route unconditionally; the bare
    // `<name>` route goes to whichever kind claims it FIRST, and for who-iris
    // that is the library. So the front door served 1,378 corpus files and the
    // icon composed against it 404'd — 404 against 200 for the same asset at
    // `/docs/who-iris/assets/...`, on a mounted build.
    //
    // `<kind>/<name>` is the route that always exists, so it is the one to
    // compose against; the bare one is right only by luck.
    const f = fixture({
      host: host(),
      sibling: withIcon("sibling", {
        directories: [
          { id: "beans", path: "beans/", graphKinds: ["beans"] },
          { id: "site", path: `${siteDir({ name: "sibling", stub: "sibling" })}/`, graphKinds: ["docs"] },
        ],
      }),
    });
    giveOwnSite(f.repo, "sibling");
    const [tile] = tilesOf(f).filter((t) => t.name === "sibling");
    expect(tile.icon?.src).toBe("/docs/sibling/assets/img/mark.svg");
  });

  test("no mount means NO icon and a finding — `pb04` one layer down", () => {
    // An `<img>` whose `src` 404s is worse than no `<img>`: a placeholder
    // reads as a broken site rather than as an instance with no art. `sibling`
    // has no site directory of its own, so there is nowhere to serve it from.
    const f = fixture({ host: host(), sibling: withIcon("sibling") });
    const [tile] = tilesOf(f).filter((t) => t.name === "sibling");
    expect(tile.icon).toBeNull();
    expect(tile.findings.join(" ")).toContain("Showing no mark rather than a broken image");
  });

  test("a path outside the site directory is refused rather than rewritten", () => {
    // Guessing would turn a path the instance meant into one it did not, and
    // the result would look exactly like art that failed to load.
    const f = fixture({
      host: {
        name: "host",
        directories: [{ id: "beans", path: "beans/", graphKinds: ["beans"] }],
        icon: "mark",
        images: [{ id: "mark", src: "elsewhere/mark.svg", title: "M" }],
      },
    });
    const [tile] = tilesOf(f).filter((t) => t.name === "host");
    expect(tile.icon).toBeNull();
    expect(tile.findings.join(" ")).toContain("elsewhere/mark.svg");
  });
});

describe("a LABEL identifies its subject, or it is not a label", () => {
  test("two instances with one title are told apart, and both say so", () => {
    // Owner, 2026-09-21: the sidebar showed `folio-assistant` twice — the
    // repository root acting as an instance, and `cat-harness`, whose declared
    // title is the product's name. Both linked `/`.
    const f = fixture({
      host: { name: "host", title: "Shared", directories: [{ id: "b", path: "b/", graphKinds: ["beans"] }] },
      other: { name: "other", title: "Shared", directories: [{ id: "b", path: "b/", graphKinds: ["beans"] }] },
    });
    const labels = tilesOf(f).map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toContain("Shared (host)");
    expect(labels).toContain("Shared (other)");
    for (const t of tilesOf(f)) {
      expect(t.findings.join(" ")).toContain("is also another instance's");
    }
  });

  test("a unique title is left exactly as its author wrote it", () => {
    // A title is a person's choice and is not required to be unique. The
    // qualifier appears only where it carries information.
    const f = fixture({ host: { ...host(), title: "Only one" } });
    expect(tilesOf(f)[0].label).toBe("Only one");
  });

  test("`name (name)` is never emitted — it says nothing twice", () => {
    const f = fixture({
      host: { name: "host", title: "host", directories: [{ id: "b", path: "b/", graphKinds: ["beans"] }] },
      other: { name: "other", title: "host", directories: [{ id: "b", path: "b/", graphKinds: ["beans"] }] },
    });
    const labels = tilesOf(f).map((t) => t.label);
    expect(labels).toContain("host");
    expect(labels).toContain("host (other)");
    expect(labels).not.toContain("host (host)");
  });
});

/* ── A render-exempt instance is still REACHABLE ──────────────────────────
 *
 * Owner, 2026-09-21: *"Boostrap should be clicable. even though it doesnt
 * render itself, cat-bootrap does take over ... render responsibles of
 * bootrstraps json(ld) and documentation."*
 *
 * bootstrap is instantiated, and correctly has no viewer — it declares a
 * `renderExemption`, which is the owner's own 2026-09-20 ruling. So
 * `harness-tiles` found no href and the tab rendered as a greyed `<span>`.
 *
 * NEITHER the declaration NOR `pb04` ("a tab with nowhere to go is not a
 * link") was wrong. What was missing is that the exemption said "I do not
 * render myself" without saying "so go here instead". These cover the field
 * that closes it — and, more importantly, the two ways it can be wrong,
 * because a link invented for an exempt instance 404s for every reader.
 */
describe("a render-exempt instance links to the page another instance publishes for it", () => {
  /* The host's site directory, READ from its declaration rather than written.
   * `site-dir-single-answer.test.ts` guards that across the whole tree and it
   * caught the first version of these tests hardcoding "docs" — in the tests
   * of all places, which is where a second answer to "where does this
   * instance publish" does the most damage. */
  const hostSite = (repo: string) => siteDirFor(join(repo, "host"));

  /** Publish a page for `floor` under the host's site, and return the
   *  repo-relative path an exemption would declare for it. */
  function publishFloorPage(repo: string, file = "initialization.md"): string {
    const rel = join("host", hostSite(repo), "floor");
    mkdirSync(join(repo, rel), { recursive: true });
    writeFileSync(join(repo, rel, file), "# floor\n");
    return join(rel, file);
  }

  const exempt = (reachableAt?: string) => ({
    name: "floor",
    directories: [{ id: "skills", path: "skills/", graphKinds: ["skills"] }],
    renderExemption: {
      of: ["visualiser"],
      reason: "the bottom of the stack renders nothing",
      owes: "its .json/.jsonld is its existence",
      ...(reachableAt === undefined ? {} : { reachableAt }),
    },
  });

  test("with `reachableAt`, the tab is a link and says what KIND of target it is", () => {
    // The page has to exist before the declaration can name it, and the
    // declaration has to be written before `fixture` runs — so the path is
    // composed first, from the host's declared site dir.
    const probe = mkdtempSync(join(tmpdir(), "harness-tiles-probe-"));
    mkdirSync(join(probe, "host"), { recursive: true });
    writeDeclaration(join(probe, "host"), JSON.stringify(host(), null, 2));
    const rel = join("host", hostSite(probe), "floor", "initialization.md");

    const f = fixture({ host: host(), floor: exempt(rel) });
    publishFloorPage(f.repo);

    const floor = tilesOf(f).find((t) => t.name === "floor")!;
    // `.md` publishes as `.html`, and the site-dir prefix is stripped.
    expect(floor.href).toBe("/floor/initialization.html");
    // NOT "viewer" and NOT "folio". A third kind, so a consumer can tell that
    // this tab points at somebody else's page about it.
    expect(floor.hrefKind).toBe("handled");
    expect(floor.findings.join(" ")).toContain("renders nothing of its own");
  });

  test("WITHOUT `reachableAt` it stays unlinked — absent is a real state", () => {
    // An exempt instance with nothing published about it has no honest
    // target, and inventing one would 404 for every reader.
    const f = fixture({ host: host(), floor: exempt() });
    const floor = tilesOf(f).find((t) => t.name === "floor")!;
    expect(floor.href).toBeUndefined();
    expect(floor.hrefKind).toBeUndefined();
  });

  test("a `reachableAt` that names no file is a FINDING, and still unlinked", () => {
    // `flh4`'s defect: a declared path that does not resolve. Distinct from
    // "nothing is published" — one says the declaration is wrong, the other
    // says nobody built it — so the message has to separate them.
    const probe = mkdtempSync(join(tmpdir(), "harness-tiles-probe-"));
    mkdirSync(join(probe, "host"), { recursive: true });
    writeDeclaration(join(probe, "host"), JSON.stringify(host(), null, 2));
    const missing = join("host", hostSite(probe), "floor", "missing.md");

    const f = fixture({ host: host(), floor: exempt(missing) });
    const floor = tilesOf(f).find((t) => t.name === "floor")!;
    expect(floor.href).toBeUndefined();
    expect(floor.findings.join(" ")).toContain("not a file");
  });

  test("a `reachableAt` outside the published site is a FINDING, and still unlinked", () => {
    // The subtler wrong declaration: the file EXISTS, so an existence check
    // alone would pass it — and it is never published, so the link would
    // 404 anyway.
    const f = fixture({ host: host(), floor: exempt("floor/NOTES.md") });
    writeFileSync(join(f.repo, "floor", "NOTES.md"), "# notes\n");
    const floor = tilesOf(f).find((t) => t.name === "floor")!;
    expect(floor.href).toBeUndefined();
    expect(floor.findings.join(" ")).toContain("outside");
  });

  test("an instance with its OWN site ignores `reachableAt` — it is the last resort", () => {
    // The control. `reachableAt` must not outrank a real folio root, or an
    // instance that gained one would keep pointing at somebody else's page.
    const probe = mkdtempSync(join(tmpdir(), "harness-tiles-probe-"));
    mkdirSync(join(probe, "host"), { recursive: true });
    writeDeclaration(join(probe, "host"), JSON.stringify(host(), null, 2));
    const rel = join("host", hostSite(probe), "floor", "initialization.md");

    const f = fixture({ host: host(), floor: exempt(rel) });
    publishFloorPage(f.repo);
    giveOwnSite(f.repo, "floor");

    const floor = tilesOf(f).find((t) => t.name === "floor")!;
    expect(floor.hrefKind).toBe("folio");
  });
});

describe("a DECLARED visualiser is a viewer — the other half of `flh4`", () => {
  /* The host's site directory, READ from its declaration. Same reason as the
   * block above: hardcoding "docs" here is a second answer to "where does
   * this instance publish", in the tests of all places. */
  const hostSite = (repo: string) => siteDirFor(join(repo, "host"));

  /** Publish a page at a NON-conventional path under the host's site, and
   *  return the repo-relative ref a `coverage.visualiser` would declare. */
  function publishAt(repo: string, rel: string): string {
    const dir = join("host", hostSite(repo), rel);
    mkdirSync(join(repo, dir), { recursive: true });
    writeFileSync(join(repo, dir, "index.html"), "<!doctype html>");
    return join(dir, "index.html");
  }

  /* `dependents` is required on every directory entry and has no default, so
   * `fixture` fills it in. These tests rewrite the declaration AFTER that, to
   * point a visualiser at a page only just published, so they fill it the
   * same way rather than restating it on every entry. */
  function decorate<T extends { directories?: Array<Record<string, unknown>> }>(decl: T): T {
    for (const entry of decl.directories ?? []) entry["dependents"] ??= "skip";
    return decl;
  }

  const withViewer = (ref: string) => ({
    name: "who",
    directories: [{ id: "lib", path: "library/", graphKinds: ["library"], coverage: { visualiser: ref } }],
  });

  test("a resolving, published visualiser links its kind at the path it names", () => {
    // The defect this fixes, in one sentence: the tile's `directories` list
    // read `coverage.visualiser` and linked it, while `visualisations` two
    // lines away reported the same kind as having no viewer. One question,
    // two answers — and the wrong one is the one a finding counted.
    const f = fixture({ host: host(), who: { name: "who", directories: [] } });
    const ref = publishAt(f.repo, "translation-status");
    writeDeclaration(join(f.repo, "who"), JSON.stringify(decorate(withViewer(ref)), null, 2));
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.visualisations).toEqual([{ kind: "library", path: "/translation-status/" }]);
    expect(who.findings.join(" ")).not.toContain("no published viewer");
  });

  test("a visualiser that does NOT resolve links nothing, and the gap is still reported", () => {
    // `flh4` is that these are two findings, not one: "the declaration is
    // wrong" and "nobody built it". Both leave the kind unlinked, and a
    // generator that linked the declared path regardless would put a 404
    // behind the tab — `pb04`.
    const f = fixture({ host: host(), who: { name: "who", directories: [] } });
    const ref = join("host", hostSite(f.repo), "nowhere", "index.html");
    writeDeclaration(join(f.repo, "who"), JSON.stringify(decorate(withViewer(ref)), null, 2));
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.visualisations).toEqual([{ kind: "library" }]);
    expect(who.findings.join(" ")).toContain("does not resolve on disk");
    expect(who.findings.join(" ")).toContain("no published viewer");
  });

  test("a page that resolves OUTSIDE the site directory is NOT linked — and is named as built", () => {
    // Two halves, and they were written by two branches that met in a merge.
    //
    // NOT LINKED is this block's rule: the tile links what the SITE serves,
    // and a ref outside the site directory has no published path to compose
    // without resolving it through `withRoutes` — an instance's own mounted
    // `docs/` lands somewhere the strip above cannot guess.
    //
    // NAMED AS BUILT is main's, and it is the better message. "No published
    // viewer" would assert something false about a page that exists; the
    // `undiscovered` finding says exactly what is true — built, and no tile
    // reaches it — which is what tells the next reader which gap to close.
    const f = fixture({ host: host(), who: { name: "who", directories: [] } });
    mkdirSync(join(f.repo, "who", "elsewhere"), { recursive: true });
    writeFileSync(join(f.repo, "who", "elsewhere", "index.html"), "<!doctype html>");
    const ref = join("who", "elsewhere", "index.html");
    writeDeclaration(join(f.repo, "who"), JSON.stringify(decorate(withViewer(ref)), null, 2));
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.visualisations).toEqual([{ kind: "library" }]);
    expect(who.findings.join(" ")).toContain("exists but is not at a conventional path");
    // And NOT the unbuilt message, which is the assertion that would have
    // been false. Without this line the test passes on a report that says
    // both things at once.
    expect(who.findings.join(" ")).not.toContain("no published viewer");
  });

  test("the CONVENTIONAL page wins when a kind resolves both ways", () => {
    // The order is observable, so it is a decision. Preferring the
    // declaration would repoint a link that already works; preferring the
    // convention fills only the gaps, which is all this is for.
    const f = fixture({ host: host(), who: { name: "who", directories: [] } }, ["host/library/who"]);
    const ref = publishAt(f.repo, "somewhere-else");
    writeDeclaration(join(f.repo, "who"), JSON.stringify(decorate(withViewer(ref)), null, 2));
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.visualisations).toEqual([{ kind: "library", path: "/host/library/who/" }]);
  });

  test("one directory's viewer does not vouch for a kind it does not hold", () => {
    // The map is keyed by the kinds the DECLARING directory lists. A viewer
    // for `library` saying nothing about `uploads` is the point: a tile that
    // borrowed it would claim a page that renders another graph.
    const f = fixture({ host: host(), who: { name: "who", directories: [] } });
    const ref = publishAt(f.repo, "lib-view");
    writeDeclaration(
      join(f.repo, "who"),
      JSON.stringify(
        decorate({
          name: "who",
          directories: [
            { id: "lib", path: "library/", graphKinds: ["library"], coverage: { visualiser: ref } },
            { id: "up", path: "uploads/", graphKinds: ["uploads"] },
          ],
        }),
        null,
        2,
      ),
    );
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.visualisations).toEqual([
      { kind: "library", path: "/lib-view/" },
      { kind: "uploads" },
    ]);
    expect(who.findings.join(" ")).toContain("no published viewer — uploads");
  });
});

describe("a render-exempt instance is not missing what it was excused from", () => {
  /* Bean `sbck`, third done-when. bootstrap declares
   * `renderExemption.of: ["visualiser", …]` and the tile went on reporting
   * its graphs as "no published viewer" — a gap raised against a layer
   * excused from exactly that, which is the noise the bean names. */
  const exempt = (extra: Record<string, unknown> = {}) => ({
    name: "floor",
    directories: [{ id: "skills", path: "skills/", graphKinds: ["skills"], dependents: "skip" }],
    renderExemption: {
      of: ["visualiser"],
      reason: "the bottom of the stack renders nothing",
      owes: "its own graph as .jsonld",
      ...extra,
    },
  });

  test("its unrendered kinds are named as EXEMPT, not as a gap", () => {
    const f = fixture({ host: host(), floor: exempt() });
    const floor = tilesOf(f).find((t) => t.name === "floor")!;
    const all = floor.findings.join(" ");
    expect(all).toContain("render no viewer");
    expect(all).toContain("under a declared `renderExemption`");
    // The assertion that would have failed before: the gap wording is gone.
    expect(all).not.toContain("no published viewer");
  });

  test("the kinds are still NAMED, and so is what the layer owes", () => {
    // `2krx`: an opt-out without a reason per entry becomes a silence list.
    // Dropping the finding would make "excused" and "nobody looked"
    // indistinguishable, so the exemption is stated with its substitute —
    // what is unrendered AND what is carried instead, which is the bargain
    // the exemption struck.
    const f = fixture({ host: host(), floor: exempt() });
    const floor = tilesOf(f).find((t) => t.name === "floor")!;
    const f0 = floor.findings.find((x) => x.includes("render no viewer"))!;
    expect(f0).toContain("skills");
    expect(f0).toContain("its own graph as .jsonld");
  });

  test("an instance exempt from something ELSE still gets the gap finding", () => {
    // The control. `isExemptFrom` takes the obligation, and an exemption
    // from `own-docs` says nothing about viewers — without this a rule that
    // read "has any exemption" would pass.
    const f = fixture({
      host: host(),
      floor: exempt({ of: ["own-docs"], owes: "its README on the forge" }),
    });
    const floor = tilesOf(f).find((t) => t.name === "floor")!;
    expect(floor.findings.join(" ")).toContain("no published viewer");
  });

  test("an instance with NO exemption is unaffected", () => {
    const f = fixture({
      host: host(),
      who: { name: "who", directories: [{ id: "lib", path: "library/", graphKinds: ["library"] }] },
    });
    const who = tilesOf(f).find((t) => t.name === "who")!;
    expect(who.findings.join(" ")).toContain("no published viewer");
  });
});

describe("an icon's URL is the SITE DIRECTORY's mount, not the instance's front door", () => {
  // MEASURED, by running `mount-instance-docs` against a built preview rather
  // than by reading either file:
  //
  //     who-iris/library/  ->  /who-iris/        (1378 files)
  //     who-iris/docs/     ->  /docs/who-iris/   (4 files)
  //
  // Every instance gets a `<kind>/<name>` route unconditionally; the bare
  // `<name>` route goes to whichever kind claims it first, and for who-iris
  // that is the LIBRARY. So its front door serves 1,378 corpus files and its
  // docs are somewhere else entirely.
  //
  // The shipped version composed an icon against `folioRoot` — the front door
  // — and produced a URL that 404s. Confirmed against a mounted build: 404 for
  // `/who-iris/assets/...` and 200 for `/docs/who-iris/assets/...`, same asset.
  //
  // The local preview HID it, which is why this is a test and not a comment:
  // `preview:site` does not run the mount, so the asset was absent there for
  // an unrelated reason and the wrong URL looked like the same 404.

  const withIcon = (name: string, kind: string) => ({
    name,
    icon: "mark",
    images: [{ id: "mark", src: `${siteDir({ name })}/assets/m.svg`, title: "M", description: "d" }],
    directories: [{ id: `${name}-site`, path: `${siteDir({ name })}/`, graphKinds: [kind] }],
  });

  test("a mounted instance addresses its icon under its site dir's KIND", () => {
    const f = fixture({ host: host({ needs: [] }), guest: withIcon("guest", "docs") });
    giveOwnSite(f.repo, "guest");
    const guest = tilesOf(f).find((t) => t.name === "guest")!;
    expect(guest.icon?.src).toBe("/docs/guest/assets/m.svg");
  });

  test("...and the kind is the DECLARATION's, not the string `docs`", () => {
    // The whole point: who-iris's bare route is taken by `library`, so a rule
    // that assumed `docs` would be right by luck here and wrong there.
    const f = fixture({ host: host({ needs: [] }), guest: withIcon("guest", "catalogue") });
    giveOwnSite(f.repo, "guest");
    const guest = tilesOf(f).find((t) => t.name === "guest")!;
    expect(guest.icon?.src).toBe("/catalogue/guest/assets/m.svg");
  });

  test("the site OWNER keeps the root — its docs are built in place, not mounted", () => {
    const f = fixture({
      host: { ...host({ needs: [] }), ...withIcon("host", "docs"), name: "host" },
    });
    const h = tilesOf(f).find((t) => t.name === "host")!;
    expect(h.icon?.src).toBe(`/assets/m.svg`);
  });

  test("an instance that classifies its site dir under NO kind gets no icon", () => {
    // `pb04` one layer down, and a real answer rather than a guess: nothing
    // can be said about where a directory nobody classified will be served, so
    // an `<img>` is not emitted at all.
    const f = fixture({
      host: host({ needs: [] }),
      guest: {
        name: "guest",
        icon: "mark",
        images: [{ id: "mark", src: `${siteDir({ name: "guest" })}/assets/m.svg`, title: "M", description: "d" }],
        // A registered kind, on a path that is NOT the site directory — so the
        // site dir itself is classified by nothing.
        directories: [{ id: "beans", path: "beans/", graphKinds: ["beans"] }],
      },
    });
    giveOwnSite(f.repo, "guest");
    const guest = tilesOf(f).find((t) => t.name === "guest")!;
    expect(guest.icon).toBeNull();
  });
});
