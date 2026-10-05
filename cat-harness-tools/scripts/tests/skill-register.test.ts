/**
 * `skill-register` — the command that makes adding a skill a one-command change,
 * and the gate that refuses one that arrived without it.
 *
 * Beans `v625` (the chain) and `nfv3` (the declaration audit and the gate). Two
 * commands one letter apart were consolidated on 2026-09-26 at the owner's
 * decision, and so were their two suites.
 *
 * ## Two assertion shapes, and both are load-bearing
 *
 * **The chain half does NOT re-measure which artefacts a skill stales.** That
 * needs a throwaway skill and per-check isolated runs — a session's work rather
 * than a unit test. These guard the ways the declaration could rot between such
 * measurements, in both directions: a step silently dropped, and a step added
 * back from memory.
 *
 * **The audit half is falsified on synthetic packages.** The real-corpus test is
 * `✓ every skill declared`, and on its own that is worth nothing: it passes
 * identically whether the checker works or returns empty lists. So every finder
 * is falsified against a package where the defect is present BY CONSTRUCTION,
 * and the real corpus carries an anti-vacuity floor — a rename of the declared
 * skills directory must not turn the suite green over nothing, which is the
 * zero-subject trap this repository has paid for more than once (bean `dh4f`).
 *
 * Two of those cases exist because they were found by breaking the tool rather
 * than by designing it: deleting a registered probe left an orphaned `kg-qa`
 * sidecar that no regeneration can settle, and left a manifest entry pointing at
 * nothing — `manifest-skill-exists` at severity **critical**.
 *
 * @module cat-harness/scripts/tests/skill-register
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  CHAIN,
  CHECKS,
  STEPS,
  audit,
  parseFlags,
  writeReport,
  writesReport,
  dangling,
  frontMatterKeys,
  missingScripts,
  retiredKeys,
  skillPackages,
  unlisted,
  withoutKey,
} from "../../../cat-harness/scripts/skill-register.js";

const ROOT = join(import.meta.dir, "..", "..", "..");
const scripts = (): Record<string, string> =>
  JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts;

/* ─────────────────────────────── the chain ─────────────────────────────── */

test("the chain is not empty", () => {
  // A runner over an empty list exits 0 and reads as a clean sweep — the
  // vacuity failure `gates.ts` names. `skill-register.ts` guards this at
  // runtime too; this catches it in CI rather than on somebody's next skill.
  expect(STEPS.length).toBeGreaterThan(0);
});

/**
 * A step's HEAD is what `bun run` resolves; the rest are flags.
 *
 * `v625` moved a step to an argument list, so asking whether the whole list is
 * a script would report `["x", "--check"]` as unresolvable — a false red on a
 * legal step. Only the head is looked up.
 */
function head(args: readonly string[]): string {
  return args[0]!;
}

describe("every step resolves to something runnable", () => {
  for (const s of STEPS) {
    test(`\`${s.write.join(" ")}\` exists`, () => {
      const t = head(s.write);
      const ok = t in scripts() || existsSync(join(ROOT, t));
      expect(
        ok,
        `\`${t}\` is neither an npm script nor a file. A step that cannot run is ` +
          `worse than a missing step: the command reports it, exits non-zero, and ` +
          `the author cannot tell a broken chain from their own mistake.`,
      ).toBe(true);
    });

    test(`\`${s.verify.join(" ")}\` exists`, () => {
      const t = head(s.verify);
      const ok = t in scripts() || existsSync(join(ROOT, t));
      expect(ok, `verify target \`${t}\` is neither an npm script nor a file.`).toBe(true);
    });
  }
});

/**
 * The same question the loop above asks per step, asked once over the whole
 * list — which is what the command itself exits 2 on. Keeping both is
 * deliberate: the loop names the offending step, this proves the command's own
 * guard agrees with the tree.
 */
test("every CHAIN and CHECKS entry is a package.json script", () => {
  expect(missingScripts()).toEqual([]);
});

test("each step carries a reason, so the list can be re-derived rather than trusted", () => {
  // The list is hand-maintained and was WRONG four times before it was
  // measured. A bare entry invites the next person to trust it; an entry that
  // says what it clears invites them to check.
  for (const s of STEPS) {
    expect(s.because.length, `\`${s.write}\` has no reason recorded`).toBeGreaterThan(10);
  }
});

test("the two steps `gates` MASKS are still in the chain", () => {
  // The regression that would be invisible. `kg:audit:check` and
  // `kg:detangle:check` are green inside `bun run gates` on a tree where they
  // are red on their own, because `bun test` runs those writers first (bean
  // `ymsu`). So anyone re-deriving this chain THROUGH gates will conclude they
  // do not belong and delete them — and the deletion will look correct.
  for (const masked of ["kg:audit", "kg:detangle"]) {
    expect(
      CHAIN,
      `\`${masked}\` is missing. It IS staled by adding a skill — measured red on ` +
        `its own against a tree where \`bun run gates\` reported it green, because ` +
        `\`bun test\` runs the writer first. Do not re-derive this chain through ` +
        `gates; run the one check in isolation.`,
    ).toContain(masked);
  }
});

test("the four that adding a skill does NOT stale are absent", () => {
  // The other direction, and the one that actually happened: these were
  // asserted to be in the chain three times, in a bean and two commit
  // messages, on the strength of having gone red in the same sessions. They
  // were measured red for unrelated reasons. Re-adding them is not harmless —
  // it is four extra generators an author must run, three of which touch the
  // docs site, so the command would dirty trees it has no business touching.
  for (const notInChain of [
    "gen-docs-pages",
    "docs:harness",
    "translation:index",
    "state:visualizer",
  ]) {
    expect(
      CHAIN.some((w) => w.includes(notInChain)),
      `\`${notInChain}\` is in the chain, and measurement says it should not be: ` +
        `adding a skill does not stale it. If you measured otherwise, put the ` +
        `isolated red-then-green run in the docblock — do not add it from memory ` +
        `of a session where other things were also stale.`,
    ).toBe(false);
  }
});

/**
 * **Two wrong assertions have stood in this place, and the second was worse.**
 *
 * The first asserted `CHAIN.length > 5`, encoding a nine-step chain that had
 * been inferred rather than measured — so correcting the chain to the measured
 * five failed a test. That is exactly what the sibling test above warns about in
 * prose: a count in a test goes stale exactly as a count in prose does.
 *
 * The second replaced it with *every check ends in `:check`*, which looked like
 * a property and was a **naming convention this repository does not hold**. It
 * excluded `check:glossary` — `glossary-page.ts --check`, the checker for what
 * `glossary:page` writes — and so forced the pairing onto `glossary:check`,
 * which is `glossary-export.ts --check` over the SKOS projection: a different
 * program. A convention test drove out a correct pairing and installed a defect,
 * and it passed.
 *
 * What is asserted here now holds by construction rather than by convention: no
 * step verifies itself with its own writer, and no writer appears twice. Both
 * are false for a real defect and neither moves when the measured chain does.
 */
test("no step verifies itself with its writer, and no writer repeats", () => {
  expect(CHECKS.length).toBe(CHAIN.length);
  // Compared as the JOINED command, not as the arrays. `v625` moved a step to
  // `readonly string[]`, and `expect(arrayA).not.toBe(arrayB)` is true of every
  // pair of distinct arrays — so this assertion would have kept passing while
  // measuring nothing. A test that cannot fail is the `1xhc` shape inside the
  // suite, and this one is the reason the joined form is what `CHAIN` exports.
  for (const s of STEPS) expect(s.verify.join(" ")).not.toBe(s.write.join(" "));
  expect(new Set(CHAIN).size).toBe(CHAIN.length);
});

test("a step's arguments are a non-empty list, and its head is what runs", () => {
  // The shape `missingScripts` and the runner both assume. An empty list would
  // make `bun run` print its own help and exit 0 — a step that silently does
  // nothing while reading as a pass.
  for (const s of STEPS) {
    expect(s.write.length, `a step has no write arguments: ${JSON.stringify(s)}`).toBeGreaterThan(0);
    expect(s.verify.length, `a step has no verify arguments: ${JSON.stringify(s)}`).toBeGreaterThan(0);
  }
});

/* ────────────────────────── the declaration audit ────────────────────────── */

/** A throwaway instance with one skill package, shaped as the real tree is. */
function fixture(
  pkg: string,
  listed: string[],
  files: Record<string, string>,
): { instance: string; cleanup: () => void } {
  const instance = mkdtempSync(join(tmpdir(), "skill-register-"));
  const dir = join(instance, "skills", pkg);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "package-manifest.json"),
    `${JSON.stringify({ name: pkg, version: "0.1.0", skills: listed }, null, 2)}\n`,
  );
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, `${name}.md`), body);
  }
  return { instance, cleanup: () => rmSync(instance, { recursive: true, force: true }) };
}

const WITH_ROLES = "---\nname: a\nroles: [reader, collaborator, owner]\n---\n\n# A\n";
const PLAIN = "---\nname: b\n---\n\n# B\n";

describe("front matter is read, not grepped", () => {
  test("top-level keys only", () => {
    expect(frontMatterKeys(WITH_ROLES)).toEqual(["name", "roles"]);
  });

  test("a file with no front matter has no keys, and does not throw", () => {
    expect(frontMatterKeys("# Just a heading\n")).toEqual([]);
    expect(frontMatterKeys("")).toEqual([]);
  });

  /**
   * The distinction a grep cannot make. `roles:` is retired as a SKILL field
   * and live as an axis inside a `folio-memory/v1` entry — the same seven
   * letters, a different field, which is why `check-retired-front-matter.ts`
   * carries `exceptSchemas`.
   */
  test("an indented `roles:` under another key is not a top-level roles", () => {
    expect(frontMatterKeys("---\nname: a\ntags:\n  roles: [x]\n---\n")).toEqual(["name", "tags"]);
  });
});

describe("withoutKey", () => {
  test("removes the key and leaves the rest intact", () => {
    const out = withoutKey(WITH_ROLES, "roles");
    expect(frontMatterKeys(out)).toEqual(["name"]);
    expect(out).toContain("# A");
    expect(out).not.toContain("roles");
  });

  test("removes a block value's continuation lines too", () => {
    const src = "---\nname: a\nroles:\n  - reader\n  - owner\ndescription: keep me\n---\n\nbody\n";
    const out = withoutKey(src, "roles");
    expect(frontMatterKeys(out)).toEqual(["name", "description"]);
    expect(out).toContain("description: keep me");
    expect(out).not.toContain("reader");
  });

  test("a file without the key is returned unchanged", () => {
    expect(withoutKey(PLAIN, "roles")).toBe(PLAIN);
  });
});

describe("the finders discriminate — falsified on a synthetic package", () => {
  test("an unlisted skill is found, and a listed one is not", () => {
    const f = fixture("p", ["listed"], { listed: PLAIN, missing: PLAIN });
    try {
      const got = unlisted(skillPackages(f.instance)).map((u) => u.skill);
      expect(got).toEqual(["missing"]);
    } finally {
      f.cleanup();
    }
  });

  test("a retired key is found, and a clean file is not", () => {
    const f = fixture("p", ["a", "b"], { a: WITH_ROLES, b: PLAIN });
    try {
      const got = retiredKeys(skillPackages(f.instance)).map((r) => `${r.skill}:${r.key}`);
      expect(got).toEqual(["a:roles"]);
    } finally {
      f.cleanup();
    }
  });

  test("a manifest entry with no file is found — the direction breaking the tool revealed", () => {
    const f = fixture("p", ["real", "ghost"], { real: PLAIN });
    try {
      const got = dangling(skillPackages(f.instance)).map((d) => d.skill);
      expect(got).toEqual(["ghost"]);
      // And it is NOT confused with the opposite defect.
      expect(unlisted(skillPackages(f.instance))).toEqual([]);
    } finally {
      f.cleanup();
    }
  });

  test("a correct package yields nothing from any finder", () => {
    const f = fixture("p", ["a"], { a: PLAIN });
    try {
      const pkgs = skillPackages(f.instance);
      expect(unlisted(pkgs)).toEqual([]);
      expect(retiredKeys(pkgs)).toEqual([]);
      expect(dangling(pkgs)).toEqual([]);
    } finally {
      f.cleanup();
    }
  });

  test("a directory with no manifest is not a package", () => {
    const instance = mkdtempSync(join(tmpdir(), "skill-register-"));
    try {
      mkdirSync(join(instance, "skills", "nope"), { recursive: true });
      writeFileSync(join(instance, "skills", "nope", "x.md"), PLAIN);
      expect(skillPackages(instance)).toEqual([]);
    } finally {
      rmSync(instance, { recursive: true, force: true });
    }
  });

  test("no skills/ directory yields no packages rather than throwing", () => {
    const instance = mkdtempSync(join(tmpdir(), "skill-register-"));
    try {
      expect(skillPackages(instance)).toEqual([]);
    } finally {
      rmSync(instance, { recursive: true, force: true });
    }
  });
});

describe("the real corpus", () => {
  test("every skill is declared, none carries a retired key, nothing dangles", () => {
    const f = audit();
    expect(f.unlisted.map((u) => `${u.pkg}/${u.skill}`)).toEqual([]);
    expect(f.retired.map((r) => `${r.pkg}/${r.skill}:${r.key}`)).toEqual([]);
    expect(f.dangling.map((d) => `${d.pkg}/${d.skill}`)).toEqual([]);
  });

  /**
   * The vacuity guard. Without it the assertion above passes over an empty
   * corpus — a rename of the declared skills directory or a broken reader would
   * read as clean, which is the `dh4f` shape this repository keeps paying for. A
   * floor rather than an exact count, because a count in a test goes stale
   * exactly as a count in prose does.
   */
  test("it found packages and skills — otherwise the check above proves nothing", () => {
    const f = audit();
    expect(f.packages).toBeGreaterThan(3);
    expect(f.skills).toBeGreaterThan(50);
  });
});


/* ─────────────────────────── the flags and the report ─────────────────────────
 * `v625`'s half of the suite, kept whole across the consolidation. The report
 * tests gained the third argument the merge added — the declaration findings —
 * and one test of their own, because a sidecar that recorded only the chain
 * would report a clean run over a skill registered nowhere.
 */

describe("flags", () => {
  test("every flag is off by default, so a bare run regenerates and reports", () => {
    const f = parseFlags([]);
    expect(f).toEqual({ check: false, dryRun: false, json: false, noReport: false });
  });

  test("each flag is recognised on its own", () => {
    expect(parseFlags(["--check"]).check).toBe(true);
    expect(parseFlags(["--dry-run"]).dryRun).toBe(true);
    expect(parseFlags(["--json"]).json).toBe(true);
    expect(parseFlags(["--no-report"]).noReport).toBe(true);
  });

  test("an unrelated argument sets nothing", () => {
    // `bun run` passes its own arguments through, and a flag parser that
    // matched loosely would turn `--help` into a silent `--check`.
    expect(parseFlags(["--help", "somefile.md"])).toEqual({
      check: false,
      dryRun: false,
      json: false,
      noReport: false,
    });
  });

  // Bean `bo44`. Measured 2026-10-01: `skill:register:check`, the form CI runs,
  // rewrote `test/results/skill-register.qa-results.json` whenever it
  // differed, so the gate was a writer of the record it reports into. The gate
  // form writes nothing; the sidecar is the author's command's to write.
  test("the gate form (--check) never writes the sidecar; the author's form does", () => {
    expect(writesReport(parseFlags(["--check"]))).toBe(false);
    expect(writesReport(parseFlags(["--check", "--json"]))).toBe(false);
    expect(writesReport(parseFlags([]))).toBe(true);
    expect(writesReport(parseFlags(["--no-report"]))).toBe(false);
  });
});

describe("the report", () => {
  test("lands under the INSTANCE root, not the caller's cwd", () => {
    // The defect this pins, measured 2026-09-26: `writeReport` was called with
    // `process.cwd()`, so running the command from the repository root wrote
    // `test/results/skill-register.qa-results.json` — a fresh top-level
    // directory no instance declares and no sweep reads. `writeQaResult`
    // composes `<root>/test/results/`, so the root must be the instance's.
    const dir = mkdtempSync(join(tmpdir(), "skill-register-report-"));
    try {
      const at = writeReport(
        dir,
        [{ verify: "kg:detangle:check", because: "x", ran: true, current: true }],
        [],
      );
      expect(at).toBe(join(dir, "test", "results", "skill-register.qa-results.json"));
      expect(existsSync(at)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("`ran` is present on EVERY entry, so absence never carries the fact", () => {
    // The invariant. A sidecar whose entries omit `ran` when nothing ran makes
    // "listed but not run" and "run and clean" the same bytes — which is the
    // confusion the sidecar exists to prevent, reproduced inside it. A
    // `--dry-run` report is the case that would tempt the omission.
    const dir = mkdtempSync(join(tmpdir(), "skill-register-ran-"));
    try {
      const at = writeReport(
        dir,
        STEPS.map((s) => ({ verify: s.verify.join(" "), because: s.because, ran: false })),
        [],
      );
      const entries = JSON.parse(readFileSync(at, "utf8")).families["registration-chain"].entries;
      expect(entries.length).toBe(STEPS.length);
      for (const e of entries) {
        expect(Object.hasOwn(e, "ran"), `an entry omits \`ran\`: ${JSON.stringify(e)}`).toBe(true);
        expect(e.ran).toBe(false);
        // `current` is absent precisely when nothing ran — a step that did not
        // run has no verdict, and emitting `current: false` would report it as
        // measured and red.
        expect(Object.hasOwn(e, "current")).toBe(false);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a red verdict is recorded rather than only printed", () => {
    // A sidecar written only on success cannot tell "clean" from "never ran",
    // so the report is written BEFORE the exit branches. This pins that a
    // failing step reaches the file at all.
    const dir = mkdtempSync(join(tmpdir(), "skill-register-red-"));
    try {
      const at = writeReport(
        dir,
        [
          {
            verify: "kg:detangle:check",
            because: "the skills subgraph gains a node",
            ran: true,
            current: false,
          },
        ],
        [],
      );
      const fam = JSON.parse(readFileSync(at, "utf8")).families["registration-chain"];
      expect(fam.entries[0].ran).toBe(true);
      expect(fam.entries[0].current).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the declaration findings are a family of their own, present even when empty", () => {
    // The consolidation's own addition. `v625`'s sidecar carried the chain
    // alone, so a tree whose chain was current but whose skill was in no
    // manifest produced a sidecar that read as clean. An EMPTY family is the
    // load-bearing case: it says audited-and-found-nothing, which is a
    // different claim from a family that is not there at all.
    const dir = mkdtempSync(join(tmpdir(), "skill-register-decl-"));
    try {
      const clean = JSON.parse(
        readFileSync(writeReport(dir, [{ verify: "x:check", because: "y", ran: true, current: true }], []), "utf8"),
      );
      expect(Object.hasOwn(clean.families, "declarations")).toBe(true);
      expect(clean.families.declarations.entries).toEqual([]);

      const found = JSON.parse(
        readFileSync(
          writeReport(
            dir,
            [{ verify: "x:check", because: "y", ran: true, current: true }],
            [{ finding: "undeclared", subject: "folio-core/probe", remedy: "add the slug" }],
          ),
          "utf8",
        ),
      );
      expect(found.families.declarations.entries.length).toBe(1);
      expect(found.families.declarations.entries[0].finding).toBe("undeclared");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
