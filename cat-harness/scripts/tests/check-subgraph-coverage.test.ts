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
} from "../check-subgraph-coverage";
import {
  DECLARATION_FILENAME,
  owesVisualiser,
  GraphKindRegistry,
} from "../../schemas/cat-harness";

/** A throwaway instance whose one directory carries `coverage`. */
function instance(
  coverage: unknown,
  opts: { name?: string; realTargets?: string[]; graphs?: string[] } = {},
): { root: string; cleanup: () => void } {
  const base = mkdtempSync(join(tmpdir(), "coverage-"));
  const root = join(base, opts.name ?? "inst");
  mkdirSync(join(root, "thing"), { recursive: true });
  for (const t of opts.realTargets ?? []) {
    const abs = resolve(root, t);
    mkdirSync(abs.slice(0, abs.lastIndexOf("/")), { recursive: true });
    writeFileSync(abs, "x");
  }
  writeFileSync(
    join(root, DECLARATION_FILENAME),
    JSON.stringify({
      name: opts.name ?? "inst",
      directories: [
        {
          id: "thing",
          path: "thing/",
          dependents: "reproduce",
          graphs: opts.graphs ?? ["cat-harness"],
          ...(coverage === undefined ? {} : { coverage }),
        },
      ],
    }),
  );
  return { root, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}

describe("the falsifier the bean asks for", () => {
  it("a subgraph with all three declared and resolving is NOT reported", () => {
    const { root, cleanup } = instance(
      { visualiser: "viz.html", docs: "doc.md", skill: "some-skill" },
      { realTargets: ["viz.html", "doc.md"] },
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
      };
      delete full[missing];
      const { root, cleanup } = instance(full, { realTargets: ["viz.html", "doc.md"] });
      const r = auditInstance(root);
      expect(r.findings.map((f) => f.criterion)).toEqual([missing]);
      expect(r.findings[0]?.severity).toBe("minor");
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
        exempt: { visualiser: "read by an agent at session start; a human page would be pointless" },
      },
      { realTargets: ["doc.md"] },
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
      { docs: "doc.md", skill: "s", exempt: { visualiser: "BECAUSE-THIS-STRING" } },
      { realTargets: ["doc.md"] },
    );
    expect(formatReport([auditInstance(root)])).toContain("BECAUSE-THIS-STRING");
    cleanup();
  });
});

describe("bootstrap's exemption is by layer, and is a second criterion not a hole", () => {
  it("bootstrap is never asked for a visualiser", () => {
    const { root, cleanup } = instance(undefined, { name: "bootstrap" });
    const r = auditInstance(root);
    expect(r.findings.map((f) => f.criterion).sort()).toEqual(["docs", "skill"]);
    cleanup();
  });

  it("any other instance with the same shape IS asked", () => {
    const { root, cleanup } = instance(undefined, { name: "not-bootstrap" });
    const r = auditInstance(root);
    expect(r.findings.map((f) => f.criterion).sort()).toEqual(["docs", "skill", "visualiser"]);
    cleanup();
  });

  it("the exemption is announced in the report rather than applied silently", () => {
    const { root, cleanup } = instance(undefined, { name: "bootstrap" });
    expect(formatReport([auditInstance(root)])).toContain("exempt from `visualiser`");
    cleanup();
  });

  it("is keyed on the instance NAME, so a relocation keeps it", () => {
    expect(VISUALISER_EXEMPT_INSTANCES.has("cat-bootstrap")).toBe(true);
    expect(VISUALISER_EXEMPT_INSTANCES.has("cat-harness")).toBe(false);
  });

  it("AT LEAST ONE exempt name matches a real instance — a rename must not revoke it", () => {
    // The failure this pins actually happened: `bootstrap` was renamed to
    // `cat-bootstrap` on main while this branch was open. A set holding only
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
      { realTargets: ["doc.md"], graphs: ["beans"] },
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
      { realTargets: ["doc.md"], graphs: ["docs"] },
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
        { realTargets: ["doc.md"], graphs: [kind] },
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
      { visualiser: "viz.html", docs: "doc.md", skill: "some-skill" },
      { realTargets: ["viz.html", "doc.md"], graphs: ["beans"] },
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
    writeFileSync(join(root, DECLARATION_FILENAME), "{ not json");
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
    expect(rs.map((r) => r.instance)).toContain("cat-bootstrap");
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
    expect(r?.detail).toContain("nothing says what this instance IS");
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

  it("this repository has exactly the two known offenders", () => {
    // Against the real tree: the root declares no assets at all, and
    // cat-harness borrows the root's README. bootstrap and folio-assist-core
    // each own theirs. If this changes, the check should say so rather than
    // quietly track it.
    const repo = resolve(import.meta.dir, "..", "..", "..");
    const offenders = auditAll(repo).filter((r) => r.readme !== undefined).map((r) => r.instance);
    expect(offenders.sort()).toEqual(["cat-harness", "folio-assistant"]);
  });
});
