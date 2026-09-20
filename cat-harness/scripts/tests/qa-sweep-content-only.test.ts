/**
 * A sweep runs on ACTIVE content, and the declaration says which that is.
 *
 * Owner, 2026-09-20: *"qa-sweep skips fsh-guts"*, and the general form in the
 * same breath — *"qasweep is only on active/working content, unless explicit
 * otherwise"*.
 *
 * ## It is the existing axis, not a new one
 *
 * `fsh-guts` declares `holds: "context"` — *"Read, never written by a
 * process"* — because what is in it is deprecated or superseded. So the rule
 * needs no directory name: `graphLayer` already answers it, and a graph
 * retired tomorrow is skipped the day it is declared.
 *
 * ## Why this is a guard and not a fix
 *
 * Measured 2026-09-20 before writing it: `walkBlocks` over `fsh-guts/` yields
 * **0** blocks, because the only `.ts` in there is a script rather than a
 * manifest. Nothing is wrong today. The rule exists for the day somebody
 * retires a real block into it — which is what the directory is FOR — at
 * which point a sweep would report findings about material nobody maintains,
 * and a reader could not tell those from live ones.
 *
 * @module cat-harness/scripts/tests/qa-sweep-content-only.test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { walkBlocks } from "../../content/pipeline/qa-utils.js";

/** A block manifest `walkBlocks` will admit without importing it. */
const MANIFEST = 'import { prose } from "./builders";\nexport default prose({ label: "probe", body: "x" });\n';

/**
 * A repo with one block in a `content` directory and one in a `context` one.
 *
 * `.git` so `findContentRepoRoot` stops here rather than walking out into the
 * real checkout and reading ITS declaration — which would make the fixture
 * depend on this repository's layout.
 */
function fixture(): { root: string } {
  const root = mkdtempSync(join(tmpdir(), "sweep-scope-"));
  mkdirSync(join(root, ".git"), { recursive: true });
  writeFileSync(
    join(root, "harness.json"),
    JSON.stringify({
      name: "probe",
      description: "one content directory and one retired one",
      directories: [
        { id: "folio", path: "folio/", dependents: "reproduce", graphs: ["folio"] },
        { id: "fsh-guts", path: "fsh-guts/", dependents: "skip", graphs: ["fsh-guts"] },
      ],
    }),
  );
  for (const d of ["folio", "fsh-guts"]) {
    mkdirSync(join(root, d), { recursive: true });
    writeFileSync(join(root, d, "probe.ts"), MANIFEST);
  }
  return { root };
}

const walked = (root: string, opts = {}) =>
  [...walkBlocks(root, { verify: false, includeUnlabelled: true, ...opts })]
    .map((b) => b.ts.slice(root.length + 1));

describe("a sweep walks content and skips what is declared retired", () => {
  test("the fixture is real — both blocks exist and are admissible", () => {
    // A filter over nothing passes. Proved by asking for everything first.
    const all = walked(fixture().root, { includeNonContent: true });
    expect(all.sort()).toEqual(["folio/probe.ts", "fsh-guts/probe.ts"]);
  });

  test("by default the `fsh-guts` block is NOT walked", () => {
    expect(walked(fixture().root)).toEqual(["folio/probe.ts"]);
  });

  test("`includeNonContent` is the 'unless explicit otherwise'", () => {
    const { root } = fixture();
    expect(walked(root, { includeNonContent: true })).toContain("fsh-guts/probe.ts");
  });

  test("the FOLIO is never the thing skipped — the corpus is what a sweep is for", () => {
    // The failure that would matter most: a rule meant to exclude retired
    // material excluding the active corpus instead, and reporting clean.
    expect(walked(fixture().root)).toContain("folio/probe.ts");
  });

  test("an entry declaring NO graphs is walked — silence is not evidence of retirement", () => {
    const root = mkdtempSync(join(tmpdir(), "sweep-scope-bare-"));
    mkdirSync(join(root, ".git"), { recursive: true });
    writeFileSync(
      join(root, "harness.json"),
      JSON.stringify({
        name: "probe",
        description: "an entry with no graphs",
        directories: [{ id: "odd", path: "odd/", dependents: "skip", graphs: [] }],
      }),
    );
    mkdirSync(join(root, "odd"), { recursive: true });
    writeFileSync(join(root, "odd", "probe.ts"), MANIFEST);
    expect(walked(root)).toEqual(["odd/probe.ts"]);
  });

  test("a MALFORMED declaration walks everything rather than nothing", () => {
    // A walker that refuses to enumerate because a config is broken turns a
    // config fault into a total QA outage — reporting clean by looking at
    // nothing, which is the failure this repository names most often.
    const root = mkdtempSync(join(tmpdir(), "sweep-scope-bad-"));
    mkdirSync(join(root, ".git"), { recursive: true });
    writeFileSync(join(root, "harness.json"), "{ not json at all");
    mkdirSync(join(root, "folio"), { recursive: true });
    writeFileSync(join(root, "folio", "probe.ts"), MANIFEST);
    expect(walked(root)).toEqual(["folio/probe.ts"]);
  });
});

describe("why the skip needs no 'unknown layer' arm", () => {
  test("an unknown graph kind THROWS in readDeclaration, so it never reaches the filter", async () => {
    // The first draft of the skip carried `l !== undefined` for the case of a
    // kind `graphLayer` cannot place. That case cannot arise, and this is the
    // measurement rather than the argument: an unknown kind is refused at the
    // declaration, and a registered one always has `holds` because the schema
    // requires it. Unreachable defensive code is the `no-runs` defect from
    // bean `lr7h`, one file along.
    const { readDeclaration } = await import("../../schemas/cat-harness.js");
    const root = mkdtempSync(join(tmpdir(), "sweep-scope-unknown-"));
    writeFileSync(
      join(root, "harness.json"),
      JSON.stringify({
        name: "probe",
        description: "names a kind nothing registers",
        directories: [{ id: "x", path: "x/", dependents: "skip", graphs: ["totally-made-up"] }],
      }),
    );
    expect(() => readDeclaration(root)).toThrow(/unknown graph kind/);
  });

  test("...and such a repo is WALKED, not silently emptied", () => {
    // The throw is caught by the walker, which then skips nothing. A config
    // fault must not become a total QA outage.
    const root = mkdtempSync(join(tmpdir(), "sweep-scope-unknown2-"));
    mkdirSync(join(root, ".git"), { recursive: true });
    writeFileSync(
      join(root, "harness.json"),
      JSON.stringify({
        name: "probe",
        description: "names a kind nothing registers",
        directories: [{ id: "x", path: "x/", dependents: "skip", graphs: ["totally-made-up"] }],
      }),
    );
    mkdirSync(join(root, "x"), { recursive: true });
    writeFileSync(join(root, "x", "probe.ts"), MANIFEST);
    expect(walked(root)).toEqual(["x/probe.ts"]);
  });
});
