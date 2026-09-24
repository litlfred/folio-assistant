/**
 * Tests for the subgraph-coverage axis (bean `2krx`).
 *
 * The bean names the falsifier and it is the shape of this file: **a subgraph
 * with all three is not reported, and removing any one of them makes it
 * appear.** A test that only checked "findings exist" would pass against an
 * axis that reports everything unconditionally, which is the one failure mode
 * an advisory check is most likely to have and least likely to be caught in.
 */
import { describe, it, expect } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import {
  auditInstance,
  auditAll,
  formatReport,
  CRITERIA,
  VISUALISER_EXEMPT_INSTANCES,
  readmeFinding,
  ownDocsFinding,
} from "../check-subgraph-coverage";
import {
  INSTANCE_README_ROLE,
  owesVisualiser,
  GraphKindRegistry,
  resolveCoveragePath,
  siteDirFor,
} from "../../schemas/cat-harness";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

/**
 * A throwaway instance whose one directory carries `coverage`.
 *
 * **`realTargets` are written at the REPOSITORY root (`base`), not under the
 * instance**, because that is where a `coverage.*` value resolves — the
 * owner's ruling of 2026-09-21 on bean `yt7j`, and what all 45 coverage paths
 * in this repository already do. The fixture wrote them under the instance
 * while `targetExists` accepted either root, so it was passing against the
 * fallback rather than against the convention; eight tests turned red the
 * moment the fallback came out, which is the evidence that they were.
 */
function instance(
  coverage: unknown,
  opts: { name?: string; realTargets?: string[]; graphKinds?: string[] } = {},
): { root: string; cleanup: () => void } {
  const base = mkdtempSync(join(tmpdir(), "coverage-"));
  const root = join(base, opts.name ?? "inst");
  mkdirSync(join(root, "thing"), { recursive: true });
  for (const t of opts.realTargets ?? []) {
    const abs = resolve(base, t);
    mkdirSync(abs.slice(0, abs.lastIndexOf("/")), { recursive: true });
    writeFileSync(abs, "x");
  }
  // A governing skill is declared by the SKILL since #1168 B7b, not by the
  // directory: a fixture asking for `skill: "x"` gets a skill file whose
  // front matter names the directory's kinds, and the directory names none.
  const { skill, ...rest } = (coverage ?? {}) as Record<string, unknown>;
  const kinds = opts.graphKinds ?? ["cat-harness"];
  if (typeof skill === "string") {
    mkdirSync(join(root, "skills"), { recursive: true });
    writeFileSync(
      join(root, "skills", `${skill}.md`),
      `---\nname: ${skill}\ngraph-kinds:\n${kinds.map((k) => `  - ${k}\n`).join("")}---\n# ${skill}\n`,
    );
  }
  writeDeclaration(root, JSON.stringify({
      name: opts.name ?? "inst",
      directories: [
        {
          id: "thing",
          path: "thing/",
          dependents: "reproduce",
          graphKinds: kinds,
          ...(coverage === undefined ? {} : { coverage: rest }),
        },
      ],
    }));
  return { root, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}

describe("the falsifier the bean asks for", () => {
  it("a subgraph with all four declared and resolving is NOT reported", () => {
    const { root, cleanup } = instance(
      { visualiser: "viz.html", docs: "doc.md", skill: "some-skill", serialisations: "thing.jsonld" },
      { realTargets: ["viz.html", "doc.md", "thing.jsonld"] },
    );
    const r = auditInstance(root);
    expect(r.verdict).toBe("checked");
    expect(r.findings).toEqual([]);
    cleanup();
  });

  for (const missing of CRITERIA) {
    it(`removing \`${missing}\` alone makes exactly that one appear`, () => {
      const full: Record<string, string> = {
        visualiser: "viz.html",
        docs: "doc.md",
        skill: "some-skill",
        serialisations: "thing.jsonld",
      };
      delete full[missing];
      const { root, cleanup } = instance(full, {
        realTargets: ["viz.html", "doc.md", "thing.jsonld"],
      });
      const r = auditInstance(root);
      expect(r.findings.map((f) => f.criterion)).toEqual([missing]);
      // SERIALISATIONS are owed by every declared directory, so a missing one
      // is an unmet obligation rather than an unanswered question. The other
      // three are minor here because this fixture's kind owes none of them.
      expect(r.findings[0]?.severity).toBe(missing === "serialisations" ? "major" : "minor");
      cleanup();
    });
  }
});

describe("declared-but-missing is a different problem from undeclared", () => {
  it("a target that does not resolve is MAJOR, not minor", () => {
    // The distinction is the point: somebody claiming a renderer that is not
    // there is a defect, while nobody having said yet is a backlog item. An
    // axis that merged them would rank a typo alongside 20 unwritten viewers.
    const { root, cleanup } = instance({
      visualiser: "nope.html",
      docs: "doc.md",
      skill: "some-skill",
    });
    const r = auditInstance(root);
    const viz = r.findings.filter((f) => f.criterion === "visualiser");
    expect(viz).toHaveLength(1);
    expect(viz[0]?.severity).toBe("major");
    expect(viz[0]?.detail).toContain("does not resolve");
    cleanup();
  });

  it("a bare id with no path separator is not reported as a missing file", () => {
    // A skill or tool is named by id, and checking an id against the
    // filesystem would have the axis report "missing" about something it never
    // looked for. Resolving ids is the KG audit's job.
    const { root, cleanup } = instance({
      visualiser: "viz.html",
      docs: "doc.md",
      skill: "library-ingestion",
    });
    const r = auditInstance(root);
    expect(r.findings.map((f) => f.criterion)).not.toContain("skill");
    cleanup();
  });
});

describe("exemption carries a reason and is honoured", () => {
  it("an exempt criterion is not a finding, and its reason is kept", () => {
    const { root, cleanup } = instance(
      {
        docs: "doc.md",
        skill: "s",
        serialisations: "thing.jsonld",
        exempt: { visualiser: "read by an agent at session start; a human page would be pointless" },
      },
      { realTargets: ["doc.md", "thing.jsonld"] },
    );
    const r = auditInstance(root);
    expect(r.findings).toEqual([]);
    expect(r.exempted).toHaveLength(1);
    expect(r.exempted[0]?.criterion).toBe("visualiser");
    expect(r.exempted[0]?.reason).toContain("session start");
    cleanup();
  });

  it("the reason reaches the report — a waiver nobody sees is a silence list", () => {
    const { root, cleanup } = instance(
      {
        docs: "doc.md",
        skill: "s",
        serialisations: "thing.jsonld",
        exempt: { visualiser: "BECAUSE-THIS-STRING" },
      },
      { realTargets: ["doc.md", "thing.jsonld"] },
    );
    expect(formatReport([auditInstance(root)])).toContain("BECAUSE-THIS-STRING");
    cleanup();
  });
});

describe("serialisations take no waiver — harnesses cannot override being in the KG", () => {
  it("a waiver smuggled past the schema is IGNORED, not honoured", () => {
    // `SubgraphCoverageSchema.exempt` has no `serialisations` key, so `tsc`
    // stops this at the type level and a declaration carrying it does not
    // parse. This pins the RUNTIME half: if one ever reached the checker —
    // through a cast, a hand-written JSON file, or a future schema change
    // made without reading the ruling — it must still not suppress the
    // finding. The owner, 2026-09-20: "harnesses cannot override there being
    // in the KG."
    const { root, cleanup } = instance(
      {
        visualiser: "viz.html",
        docs: "doc.md",
        skill: "s",
        exempt: { serialisations: "we would rather not" },
      } as unknown,
      { realTargets: ["viz.html", "doc.md"] },
    );
    const r = auditInstance(root);
    expect(r.findings.map((f) => f.criterion)).toEqual(["serialisations"]);
    expect(r.findings[0]?.severity).toBe("major");
    // And it is not quietly filed as an exemption either.
    expect(r.exempted.map((e) => e.criterion)).not.toContain("serialisations");
    cleanup();
  });
});

describe("bootstrap's exemption is by layer, and is a second criterion not a hole", () => {
  it("bootstrap is never asked for a visualiser", () => {
    const { root, cleanup } = instance(undefined, { name: "bootstrap" });
    const r = auditInstance(root);
    // `serialisations` is present even here, and that is the ruling rather
    // than an oversight: bootstrap is excused a visualiser precisely because
    // its json/jsonld "is its existence", so it cannot be excused that.
    expect(r.findings.map((f) => f.criterion).sort()).toEqual(["docs", "serialisations", "skill"]);
    cleanup();
  });

  it("any other instance with the same shape IS asked", () => {
    const { root, cleanup } = instance(undefined, { name: "not-bootstrap" });
    const r = auditInstance(root);
    expect(r.findings.map((f) => f.criterion).sort()).toEqual([
      "docs", "serialisations", "skill", "visualiser",
    ]);
    cleanup();
  });

  it("the exemption is announced in the report rather than applied silently", () => {
    const { root, cleanup } = instance(undefined, { name: "bootstrap" });
    expect(formatReport([auditInstance(root)])).toContain("exempt from `visualiser`");
    cleanup();
  });

  it("is keyed on the instance NAME, so a relocation keeps it", () => {
    expect(VISUALISER_EXEMPT_INSTANCES.has("bootstrap")).toBe(true);
    expect(VISUALISER_EXEMPT_INSTANCES.has("cat-harness")).toBe(false);
  });

  it("AT LEAST ONE exempt name matches a real instance — a rename must not revoke it", () => {
    // The failure this pins actually happened: `bootstrap` was renamed to
    // `bootstrap` on main while this branch was open. A set holding only
    // the old name matches nothing, the owner's exemption silently stops
    // firing, and the only symptom is one extra minor finding among fifty.
    // Asserting against the instances discovery really finds turns that
    // silence into a failure.
    const repo = resolve(import.meta.dir, "..", "..", "..");
    const real = auditAll(repo).map((r) => r.instance);
    const matched = [...VISUALISER_EXEMPT_INSTANCES].filter((n) => real.includes(n));
    expect(matched.length).toBeGreaterThan(0);
  });
});

describe("an unmet OBLIGATION outranks an unanswered question", () => {
  // The owner, 2026-09-20: a directory an instance declares or initiates and
  // writes to — `beans/`, `todos/`, `fsh-guts/` — owes a visualiser "as
  // requiement of handler". So a missing one there is a promise unkept, not a
  // question nobody has answered, and the axis has to rank them apart.

  it("a kind that OWES a visualiser and has none is MAJOR", () => {
    const { root, cleanup } = instance(
      { docs: "doc.md", skill: "some-skill" },
      { realTargets: ["doc.md"], graphKinds: ["beans"] },
    );
    const viz = auditInstance(root).findings.filter((f) => f.criterion === "visualiser");
    expect(viz).toHaveLength(1);
    expect(viz[0]?.severity).toBe("major");
    expect(viz[0]?.detail).toContain("owes one");
    cleanup();
  });

  it("a SELF-RENDERING kind with none is minor — it never owed one", () => {
    // `docs` is `renderable`, so its pages ARE the view. Reporting it as an
    // unmet obligation would demand a second rendering of the same thing.
    const { root, cleanup } = instance(
      { docs: "doc.md", skill: "some-skill" },
      { realTargets: ["doc.md"], graphKinds: ["docs"] },
    );
    const viz = auditInstance(root).findings.filter((f) => f.criterion === "visualiser");
    expect(viz).toHaveLength(1);
    expect(viz[0]?.severity).toBe("minor");
    cleanup();
  });

  it("the obligation does NOT key on `holds`, because fsh-guts moved category", () => {
    // The load-bearing case, and the one that falsified the first design.
    // "holds: state owes a visualiser" covers beans and todos and MISSES
    // `fsh-guts`, which the owner names in the same sentence — `mhh9`
    // reclassified it from `state` to `context` the same day. A rule derived
    // from `holds` would have silently stopped requiring it.
    //
    // Asserted together so the pair cannot drift: both owe one, and they do
    // not share a `holds` value.
    for (const kind of ["beans", "fsh-guts"]) {
      const { root, cleanup } = instance(
        { docs: "doc.md", skill: "some-skill" },
        { realTargets: ["doc.md"], graphKinds: [kind] },
      );
      const viz = auditInstance(root).findings.filter((f) => f.criterion === "visualiser");
      expect({ kind, severity: viz[0]?.severity }).toEqual({ kind, severity: "major" });
      cleanup();
    }
  });

  it("an UNKNOWN kind owes one by default — tested on the function, not a fixture", () => {
    // Tested directly because it cannot be reached through a declaration: the
    // schema rejects an unregistered graph kind, so `auditInstance` never sees
    // one. The branch is still the load-bearing default — a kind nobody has
    // classified must not escape the obligation by being unmentioned — and a
    // test routed through a fixture would have quietly asserted nothing.
    expect(owesVisualiser("a-kind-invented-for-this-test")).toBe(true);
  });

  it("the three layers land where the owner's parenthetical puts them", () => {
    // "not part of the static KG" is the discriminator, so `content` is the
    // only layer exempt. Asserted as a table so a kind changing layer shows up
    // here rather than as a severity that quietly moved.
    expect({
      state: owesVisualiser("beans"),
      context: owesVisualiser("fsh-guts"),
      derived: owesVisualiser("library"),
      content: owesVisualiser("schemas"),
      renderable: owesVisualiser("docs"),
    }).toEqual({ state: true, context: true, derived: true, content: false, renderable: false });
  });

  it("a RENDERABLE kind is exempt even when it is not content", () => {
    // Found by a surviving mutation: deleting the `renderable` branch broke
    // nothing, because every renderable kind today is ALSO `holds: "content"`
    // and the second check covered for the first. A branch no test can reach
    // is a claim nobody has checked, so this builds the case that separates
    // them — a renderable kind that is not content — rather than leaving the
    // line as untested intent.
    const registry = new GraphKindRegistry({
      "live-board": {
        type: "https://example.invalid/ns#LiveBoardGraph",
        renderable: true,
        holds: "state",
        summary: "A state graph that renders itself. Hypothetical, and the point.",
      },
    });
    // Exempt because it renders itself, NOT because of its layer: `state`
    // would otherwise owe one, which is what makes this case discriminating.
    expect(owesVisualiser("live-board", registry)).toBe(false);
    expect(owesVisualiser("beans")).toBe(true);
  });

  it("a declared visualiser that resolves is not a finding, whatever the kind owes", () => {
    // Vacuity guard. Without it, a bug making every visualiser finding major
    // would pass all four tests above.
    const { root, cleanup } = instance(
      { visualiser: "viz.html", docs: "doc.md", skill: "some-skill", serialisations: "thing.jsonld" },
      { realTargets: ["viz.html", "doc.md", "thing.jsonld"], graphKinds: ["beans"] },
    );
    expect(auditInstance(root).findings.filter((f) => f.criterion === "visualiser")).toHaveLength(0);
    cleanup();
  });
});

describe("could not determine is never a clean run", () => {
  it("an unreadable declaration is undetermined, not zero findings", () => {
    const base = mkdtempSync(join(tmpdir(), "coverage-bad-"));
    const root = join(base, "broken");
    mkdirSync(root, { recursive: true });
    writeDeclaration(root, "{ not json", "broken");
    const r = auditInstance(root);
    expect(r.verdict).toBe("undetermined");
    expect(r.reason).toBeDefined();
    expect(formatReport([r])).toContain("not a clean run");
    rmSync(base, { recursive: true, force: true });
  });
});

describe("this repository", () => {
  it("is audited across every instance discovery finds", () => {
    // Against the REAL repo, like `instanceRootsIn`'s own test: a fixture
    // would keep passing if the axis silently stopped seeing an instance.
    const repo = resolve(import.meta.dir, "..", "..", "..");
    const rs = auditAll(repo);
    expect(rs.map((r) => r.instance)).toContain("cat-harness");
    expect(rs.map((r) => r.instance)).toContain("bootstrap");
    expect(rs.every((r) => r.verdict === "checked")).toBe(true);
  });
});

describe("every instance needs a starting README OF ITS OWN (bean `ie9l`)", () => {
  const decl = (assets: unknown) => ({ assets }) as Parameters<typeof readmeFinding>[1];

  it("an instance with its own instance-readme is clean", () => {
    const base = mkdtempSync(join(tmpdir(), "readme-"));
    writeFileSync(join(base, "README.md"), "#");
    expect(
      readmeFinding(base, decl([{ role: "instance-readme", src: "README.md" }]), false),
    ).toBeUndefined();
    rmSync(base, { recursive: true, force: true });
  });

  it("declaring no instance-readme at all is MAJOR", () => {
    const r = readmeFinding("/nowhere", decl([]), false);
    expect(r?.severity).toBe("major");
    expect(r?.detail).toContain("What this instance IS, for a reader");
  });

  it("BORROWING the repository's README is MAJOR — the case check-declared-assets cannot see", () => {
    // That gate verifies an asset RESOLVES, and a repository-scoped README
    // resolves perfectly. What is wrong is that one file is doing two jobs,
    // which is a question about ownership rather than existence.
    const r = readmeFinding(
      "/repo/cat-harness",
      decl([{ role: "instance-readme", src: "README.md", scope: "repository" }]),
      false,
    );
    expect(r?.severity).toBe("major");
    expect(r?.detail).toContain("two jobs");
  });

  it("...but the repository ROOT may legitimately own the repository's README", () => {
    // The falsifier for the rule above: if it fired on the root too, the check
    // would be demanding every instance avoid a file only one of them can own.
    const base = mkdtempSync(join(tmpdir(), "readme-root-"));
    writeFileSync(join(base, "README.md"), "#");
    expect(
      readmeFinding(base, decl([{ role: "instance-readme", src: "README.md", scope: "repository" }]), true),
    ).toBeUndefined();
    rmSync(base, { recursive: true, force: true });
  });

  it("a declared README that is not on disk is MAJOR", () => {
    const base = mkdtempSync(join(tmpdir(), "readme-gone-"));
    const r = readmeFinding(base, decl([{ role: "instance-readme", src: "README.md" }]), false);
    expect(r?.severity).toBe("major");
    expect(r?.detail).toContain("not there");
    rmSync(base, { recursive: true, force: true });
  });

  it("this repository has no README offender left", () => {
    // It had exactly two — the root declared no assets at all, and cat-harness
    // borrowed the root's README. Issue #592 split them, so every instance now
    // owns its own. Asserted as EMPTY rather than deleted: a list that went to
    // zero and a check that stopped looking are indistinguishable from a
    // deleted test, and this is the fix's only durable witness.
    const repo = resolve(import.meta.dir, "..", "..", "..");
    const offenders = auditAll(repo).filter((r) => r.readme !== undefined).map((r) => r.instance);
    expect(offenders.sort()).toEqual([]);
  });

  it("the AGENT half is asked about too, and no instance is mute any more", () => {
    // Measured 2026-09-20 when the criterion was added: ten of eleven
    // instances declared `instance-readme` and TWO declared
    // `agent-instructions`. Eight were readable by a person and mute to an
    // agent — including `folio-assistant-core`, which HAD an AGENTS.md on disk
    // and did not declare it (a finding, not an exemption: an undeclared file
    // is one no checker has a reason to look at — the `v8gh` property).
    //
    // All eight were written and declared. Asserted as EMPTY rather than
    // deleted, for the same reason as the README list above: a list that went
    // to zero and a check that stopped looking are indistinguishable once the
    // assertion is gone, and this is the fix's only durable witness.
    const repo = resolve(import.meta.dir, "..", "..", "..");
    const mute = auditAll(repo).filter((r) => r.agentInstructions !== undefined).map((r) => r.instance);
    expect(mute.sort()).toEqual([]);
  });
});

describe("the own-docs axis — an instance owes documentation of its own", () => {
  // Bean `op30`. `<instance>/docs/` is the instance's SOURCE documentation. A
  // handler's rendering of a subject — `<base>/cat-harness/docs/<subject>/` —
  // is documentation ABOUT that subject, and an axis that conflated the two
  // would pass a repository where half the documentation is missing.

  /**
   * A REAL instance root — with a declaration, so `siteDirFor` resolves.
   *
   * A bare temp directory is not a weaker fixture, it is a different case:
   * `siteDirFor` throws on one, which is the UNKNOWN state rather than the
   * missing-docs state. Both are exercised, separately and on purpose.
   */
  function inst(opts: { docs?: boolean } = {}): string {
    const root = mkdtempSync(join(tmpdir(), "op30-"));
    writeDeclaration(root, JSON.stringify({ name: "probe", directories: [] }));
    // `siteDirFor`, not the literal — the same rule the code under test
    // follows, and the guard that fires on the string does not exempt tests.
    if (opts.docs) mkdirSync(join(root, siteDirFor(root)), { recursive: true });
    return root;
  }

  it("reports an instance with no docs/ of its own", () => {
    const f = ownDocsFinding(inst(), {});
    expect(f?.severity).toBe("minor");
    expect(f?.detail).toContain("no `docs/` of its own");
  });

  it("says nothing about an instance that has one", () => {
    expect(ownDocsFinding(inst({ docs: true }), {})).toBeUndefined();
  });

  it("is MINOR, never major — it fires on most of the corpus on the day it lands", () => {
    // The severity is the staging. A check that fires on ten of twelve
    // subjects as a defect is one people learn to skim, and then the real
    // finding beside it goes unread too.
    expect(ownDocsFinding(inst(), {})?.severity).toBe("minor");
  });

  it("honours a declared exemption, and reads it from the DECLARATION", () => {
    // Never from an instance-name literal in the checker — the rule that kept
    // bootstrap's visualiser exemption alive through a rename.
    const exempt = {
      renderExemption: {
        of: ["own-docs" as const],
        reason: "the floor layer documents itself in its json/jsonld",
        owes: "bootstrap.jsonld",
      },
    };
    expect(ownDocsFinding(inst(), exempt)).toBeUndefined();
  });

  it("an exemption from a DIFFERENT obligation does not excuse this one", () => {
    const other = {
      renderExemption: {
        of: ["visualiser" as const],
        reason: "it is the navbar footer",
        owes: "bootstrap.jsonld",
      },
    };
    expect(ownDocsFinding(inst(), other)).toBeDefined();
  });

  it("an instance with no declaration ARGUMENT is still asked the question", () => {
    // `undefined` is not an exemption. An instance that declares nothing has
    // not been excused; it has said nothing.
    expect(ownDocsFinding(inst(), undefined)).toBeDefined();
    expect(ownDocsFinding(inst({ docs: true }), undefined)).toBeUndefined();
  });

  it("an UNRESOLVABLE site root is reported as unknown, never as satisfied", () => {
    // The third state, and the one the first draft got wrong: it returned
    // `undefined` on the throw, which reads as "has documentation". A bare
    // directory has no declaration, so `siteDirFor` cannot answer — and
    // "cannot answer" is not "yes".
    const bare = mkdtempSync(join(tmpdir(), "op30-bare-"));
    const f = ownDocsFinding(bare, {});
    expect(f).toBeDefined();
    expect(f?.detail).toContain("UNKNOWN");
    expect(f?.detail).not.toContain("has no `docs/` of its own");
  });

  it("is reported as its own line, separate from the README axis", () => {
    // They were argued for as separate because the satisfying sets were
    // disjoint. Measured 2026-09-21 they are not — every instance declares a
    // README, so docs is a strict subset. They stay separate for the reason
    // that survives: "can a reader enter" and "is there anything to read once
    // inside" are different questions.
    const report = formatReport(auditAll(resolve(".")));
    expect(report).toContain("no `docs/` OF THEIR OWN");
    expect(report).toContain("advisory, not gated");
  });
});


describe("coverage.* resolves against the REPOSITORY root and nothing else — bean `yt7j`", () => {
  // The owner's ruling of 2026-09-21. Before it, `targetExists` tried the
  // instance root and fell back to the repository root, accepting either —
  // which reads as tolerance and is the opposite: a path incorrect in its
  // declared base passed anyway through the other, so the axis could not
  // enforce the convention its own schema documents.

  it("a target at the repository root resolves", () => {
    const { root, cleanup } = instance({ visualiser: "viz.html" }, { realTargets: ["viz.html"] });
    expect(auditInstance(root).findings.filter((f) => f.criterion === "visualiser")).toEqual([]);
    cleanup();
  });

  it("THE FALSIFICATION: a target that exists ONLY under the instance is a finding", () => {
    // The fallback's removal has to be provable, not asserted. This fixture
    // plants the file where the old code would have found it and nowhere else;
    // if the instance root is still being tried, this test goes green and says
    // nothing.
    const base = mkdtempSync(join(tmpdir(), "coverage-inst-only-"));
    const root = join(base, "inst");
    mkdirSync(join(root, "thing"), { recursive: true });
    writeFileSync(join(root, "viz.html"), "x"); // under the INSTANCE, not the repo
    writeDeclaration(root, JSON.stringify({
        name: "inst",
        directories: [
          {
            id: "thing",
            path: "thing/",
            dependents: "reproduce",
            graphKinds: ["cat-harness"],
            coverage: { visualiser: "viz.html" },
          },
        ],
      }));
    const viz = auditInstance(root).findings.filter((f) => f.criterion === "visualiser");
    expect(viz).toHaveLength(1);
    expect(viz[0]?.severity).toBe("major");
    expect(viz[0]?.detail).toContain("does not resolve");
    rmSync(base, { recursive: true, force: true });
  });

  it("resolveCoveragePath composes from the root it is handed, and checks nothing", () => {
    // It does not verify existence on purpose: a caller asking "does this
    // resolve" needs to say WHERE it looked, and folding the question in here
    // would hand every consumer a bare boolean instead.
    expect(resolveCoveragePath("/repo", "cat-harness/docs/x.html")).toBe(
      "/repo/cat-harness/docs/x.html",
    );
    expect(resolveCoveragePath("/repo/", "a/b.md")).toBe("/repo/a/b.md");
  });

  it("a governing skill is found by its declaration, never looked up as a path", () => {
    // The skill names the kind it governs (#1168 B7b); nothing about it is a
    // path, so "missing" here would be the axis lying about what it looked at.
    const { root, cleanup } = instance({ skill: "some-skill" });
    expect(auditInstance(root).findings.filter((f) => f.criterion === "skill")).toEqual([]);
    cleanup();
  });
});

describe("the repository root is recognised as itself — bean `yt7j`", () => {
  // `isRoot` was `resolve(root) === resolve(repoRootFor(root))`: a directory
  // compared with its own PARENT, equal only at the filesystem root. So the
  // guard "the repository root legitimately owns the repository's files" could
  // never fire for the one instance it exists for. Latent rather than visible
  // — this repository's root declaration carries no `scope: "repository"`
  // asset today — which is exactly why it needs a test rather than a sighting.

  /** An instance declaring one asset, optionally repository-scoped. */
  function withAsset(scope: string | undefined): { root: string; cleanup: () => void } {
    const base = mkdtempSync(join(tmpdir(), "coverage-root-"));
    const root = join(base, "inst");
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, "README.md"), "x");
    writeDeclaration(root, JSON.stringify({
        name: "inst",
        directories: [],
        assets: [
          { id: "inst-readme", role: INSTANCE_README_ROLE, src: "README.md", ...(scope ? { scope } : {}) },
        ],
      }));
    return { root, cleanup: () => rmSync(base, { recursive: true, force: true }) };
  }

  it("an instance BELOW the root borrowing a repository-scoped asset is a finding", () => {
    const { root, cleanup } = withAsset("repository");
    const r = auditInstance(root, join(root, ".."));
    expect(r.readme?.severity).toBe("major");
    expect(r.readme?.detail).toContain("one file doing two jobs");
    cleanup();
  });

  it("the repository root declaring the same asset is NOT a finding", () => {
    // The whole point of the guard, and what the broken formula suppressed.
    const { root, cleanup } = withAsset("repository");
    expect(auditInstance(root, root).readme).toBeUndefined();
    cleanup();
  });

  it("an unscoped asset is fine either way, which is why this stayed latent", () => {
    const { root, cleanup } = withAsset(undefined);
    expect(auditInstance(root, root).readme).toBeUndefined();
    expect(auditInstance(root, join(root, "..")).readme).toBeUndefined();
    cleanup();
  });
});
