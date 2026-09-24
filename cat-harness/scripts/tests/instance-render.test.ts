/**
 * The conformance check has to FAIL on each thing it claims to catch.
 *
 * Bean `z4mq` item 3. Written against temp instances rather than only this
 * repository, because the repository currently passes — and a test that only
 * asserts "the repo renders" would go on passing if the check were gutted to
 * `return { verdict: "rendered" }`. Each case below perturbs one thing.
 *
 * @module scripts/tests/instance-render.test
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { declaredKinds, instancesIn, renderInstance } from "../check-instance-render.ts";
import { repoRootFor, declarationPathIn } from "../../schemas/cat-harness.js";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A throwaway instance. `decl === null` writes no declaration at all. */
function instance(decl: unknown | null, files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "render-"));
  made.push(root);
  if (decl !== null) writeDeclaration(root, JSON.stringify(decl));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  return root;
}

describe("could not determine is a THIRD state, never a pass", () => {
  test("no declaration is undetermined, not failed and not rendered", () => {
    // The distinction that matters: an instance nobody declared has not been
    // shown to render badly, it has not been shown at all. Calling it `failed`
    // would be as wrong as calling it `rendered` — one invents a defect, the
    // other invents a clean run.
    return renderInstance(instance(null)).then((r) => {
      expect(r.verdict).toBe("undetermined");
      expect(r.reasons.join(" ")).toContain("nothing declares what this instance is");
    });
  });

  test("a declaration that will not parse is undetermined too", async () => {
    const root = mkdtempSync(join(tmpdir(), "render-bad-"));
    made.push(root);
    writeDeclaration(root, "{ not json", "broken");
    const r = await renderInstance(root);
    expect(r.verdict).toBe("undetermined");
    expect(r.nodeCount).toBe(0);
  });

  test("undetermined carries NO published kinds — it never looked", async () => {
    // Guard against the shape where an unreadable instance still reports an
    // empty `published` that a consumer reads as "publishes nothing".
    const r = await renderInstance(instance(null));
    expect(r.published).toEqual([]);
    expect(r.declared).toEqual([]);
  });
});

describe("an empty render is a failure, not an empty success", () => {
  test("zero nodes fails, and says why in those words", async () => {
    // THE DEFECT THIS WHOLE MODULE EXISTS FOR. `collectSkills` resolved
    // bootstrap's declared directory against the wrong root, found nothing,
    // and continued — the export succeeded and the graph silently lost every
    // skill. "Did it throw" cannot see that; a node count can.
    const r = await renderInstance(instance({ name: "empty", directories: [] }));
    expect(r.verdict).toBe("failed");
    expect(r.nodeCount).toBe(0);
    expect(r.reasons.join(" ")).toContain("empty graph is a failure");
  });
});

describe("declared means TRANSITIVELY declared", () => {
  test("a nested graph file's kinds count as the instance's", () => {
    // `beans/beans.json` declares `bean-defs` and `workflow-state`; reading
    // only `harness.json` reports them as kinds the instance smuggled in.
    // Measured before this was written: that mistake gives cat-harness five
    // undeclared kinds where the true figure is one.
    const root = instance(
      { name: "n", directories: [{ id: "beans", path: "beans/", graphKinds: ["beans"] }] },
      {
        "beans/beans.json": JSON.stringify({
          name: "beans",
          directories: [
            { id: "defs", path: "defs", graphKinds: ["bean-defs"] },
            { id: "workflows", path: "workflows", graphKinds: ["workflow-state"] },
          ],
        }),
      },
    );
    const kinds = declaredKinds(root, JSON.parse(readFileSync(declarationPathIn(root)!, "utf-8")));
    expect([...kinds].sort()).toEqual(["bean-defs", "beans", "workflow-state"]);
  });

  test("`kinds` is read as well as `graphs` — the bean graph uses both spellings", () => {
    const root = instance(
      { name: "n", directories: [{ id: "beans", path: "beans/", graphKinds: ["beans"] }] },
      {
        "beans/beans.json": JSON.stringify({
          name: "beans",
          directories: [{ id: "defs", path: "defs", kinds: ["bean-defs"] }],
        }),
      },
    );
    const kinds = declaredKinds(root, JSON.parse(readFileSync(declarationPathIn(root)!, "utf-8")));
    expect([...kinds]).toContain("bean-defs");
  });

  test("an unparseable nested file does not manufacture an undeclared kind", () => {
    // Understating `declared` would invent a finding. That file's problem is
    // `check:harness-dirs`'s to report, and it does so loudly.
    const root = instance(
      { name: "n", directories: [{ id: "beans", path: "beans/", graphKinds: ["beans"] }] },
      { "beans/beans.json": "{ not json" },
    );
    const kinds = declaredKinds(root, JSON.parse(readFileSync(declarationPathIn(root)!, "utf-8")));
    expect([...kinds]).toEqual(["beans"]);
  });
});

describe("this repository's own instances", () => {
  const REPO = repoRootFor(resolve(import.meta.dir, "../.."));

  test("every instance is found — otherwise everything below is vacuous", () => {
    // This asserted exactly `["cat-harness", "bootstrap"]`, and it PASSED for
    // the whole period that list was wrong: `instancesIn` returned a literal
    // and this test pinned the same literal, so the two agreed with each other
    // and neither looked at the repository. `folio-assist-core` and the root
    // were instances the gate never rendered (bean `6tkl`).
    //
    // The order is root-first then sorted, which is what `instanceRootsIn`
    // promises so that a report is stable.
    //
    // Updated 2026-09-20 when it fired as designed: seven instances arrived on
    // one branch and `folio-assist-core` became `folio-assistant-core`. This
    // list is the new truth, and it is the SECOND place that truth is written
    // — `schemas/cat-harness.test.ts` holds the other. Two copies is a real
    // cost and it is taken deliberately: they assert different things (that
    // discovery finds them, and that each one RENDERS), and deriving either
    // from `instanceRootsIn` would make the test agree with the function by
    // construction, which is exactly how the `["cat-harness", "bootstrap"]`
    // literal passed for the whole period it was wrong.
    const found = instancesIn(REPO).map((p) => p.split("/").pop());
    expect(found).toEqual([
      "folio-assistant",
      "agent-skills",
      "bootstrap",
      "cat-harness",
      // Alphabetical, and the ORDER moved with the rename: `folio-assist-sci`
      // sorted BEFORE `folio-assistant-core` ("assist-" < "assista"), and
      // `folio-assistant-sci` sorts after it. The list is the assertion, so
      // the swap is the visible half of the rename.
      // Added 2026-09-22 with the owner's stack ruling
      // (`core->fhir-harness->smart-base->siblings{smart-l1, smart-dak,
      // smart-ig}`, issue #963). It is the BASE the note above is about: the
      // bare FHIR IG pipeline, with no WHO, DAK or SMART assumption, which is
      // what `nsbb` had been asking for since 2026-09-21. It sorts here rather
      // than beside the `smart-*` entries because it is deliberately NOT one
      // of them -- the WHO package may reference this layer and this layer may
      // never reference the WHO package.
      "fhir-harness",
      "folio-assistant-core",
      "folio-assistant-sci",
      "large-datasets",
      // Added 2026-09-21 with the FHIR IG artefact-index ingest (issue #689).
      // It fired as designed, which is what this list is for: `smart-trust/`
      // declares a `harness.json` and is therefore an instance, sorting
      // between `large-datasets` and `who-iris`. A directory with no
      // `harness.json` is not an instance and is correctly absent — `smart-kg/`
      // was the example until it was removed (bean `wg7r`).
      // Added 2026-09-21 with the second ingested IG (bean qrnz). PROVISIONAL:
      // the owner has since ruled that a per-IG harness should not exist at all
      // (bean nsbb), so this entry and `smart-trust` below are both expected to
      // collapse into a `smart-base` instance. It is listed because it EXISTS
      // today, which is the only thing this assertion is about.
      // Added 2026-09-22 (issue #877) -- `smart-base`, the instance `nsbb`
      // called for. Listed here as well as in `schemas/cat-harness.test.ts`
      // because the two assert different things: that discovery FINDS it,
      // and that it RENDERS. The duplication is the deliberate cost noted
      // above.
      "smart-base",
      // Added 2026-09-22 (issue #975) — the three siblings of the owner's
      // stack ruling, `core->fhir-harness->smart-base->siblings{smart-l1,
      // smart-dak, smart-ig}`. They were named in the ruling and in
      // `smart-stack-layering` for a whole PR while no directory declared any
      // of them, so the stack existed in prose and nowhere a consumer could
      // read it. Each declares NO directories, deliberately: that is the
      // `folio-assistant-core` precedent, because a declared-but-absent
      // directory is the `dh4f` defect.
      "smart-dak",
      "smart-ig",
      "smart-immunizations",
      "smart-l1",
      "smart-trust",
      "who-iris",
      "who-style-guide",
    ]);
    // Named individually rather than only as a list: these two are the ones
    // the old literal omitted, so if a future edit narrows the set again, the
    // failure should say which instance stopped being checked.
    expect(found).toContain("folio-assistant-core");
    expect(found).toContain("folio-assistant");
  });

  test("every instance renders, and none renders nothing", async () => {
    for (const root of instancesIn(REPO)) {
      const r = await renderInstance(root);
      expect({ [r.name]: r.verdict }).toEqual({ [r.name]: "rendered" });
      expect(r.nodeCount).toBeGreaterThan(0);
    }
  });

  test("bootstrap's OWN skills are in its render — the silent drop, pinned", async () => {
    // `confirm-harness` lives only in `bootstrap/skills/`. When `skillMdDirs`
    // resolved that repository-scoped directory against the instance root, the
    // skill vanished from the graph and `hasSkill` dangled. Nothing failed.
    const boot = instancesIn(REPO).find((p) => p.endsWith("bootstrap"))!;
    const r = await renderInstance(boot);
    expect(r.nodeCount).toBeGreaterThan(10);
  });

  test("an instance publishes only the kinds it declares — the count is now ZERO", async () => {
    // THIS TEST PREDICTED ITS OWN REPLACEMENT. It read, in #463:
    //
    //   "a check becomes an error once its count is zero. The count is 16
    //    because `collectGraphKinds()` emits the global registry into every
    //    instance ... this test is what will fail, correctly, on the day
    //    somebody makes it fatal without clearing the count."
    //
    // Bean `3jj9` cleared the count: `collectGraphKinds` now takes a root and
    // filters by `declaredKinds`, so bootstrap publishes the one kind it
    // declares instead of all 16. The finding is fatal from the same change,
    // which is the repository's standing rule applied rather than deferred.
    const boot = instancesIn(REPO).find((p) => p.endsWith("bootstrap"))!;
    const r = await renderInstance(boot);
    expect(r.verdict).toBe("rendered");
    expect(r.undeclared).toEqual([]);
    // `beans` was the named example of a kind bootstrap advertised and could
    // not reach. Keeping it named guards the specific regression.
    expect(r.undeclared).not.toContain("beans");
  });

  test("...and the guard is not vacuous — bootstrap really does publish kinds", async () => {
    // `undeclared: []` is satisfied trivially by publishing nothing at all,
    // which is the `dh4f` defect this whole check exists to refuse. So assert
    // the positive half too.
    const boot = instancesIn(REPO).find((p) => p.endsWith("bootstrap"))!;
    const r = await renderInstance(boot);
    expect(r.published.length).toBeGreaterThan(0);
    expect(r.declared.length).toBeGreaterThan(0);
    // Was `published > declared` — the 16-vs-1 gap, asserted as an inequality
    // so it would survive either number moving. The gap is closed, so the
    // relation that matters now is containment.
    for (const k of r.published) expect(r.declared).toContain(k);
  });
});
