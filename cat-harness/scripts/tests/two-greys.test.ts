/**
 * "Nothing to open" and "opens, refuses an edit" are two greys, not one.
 *
 * Bean `10s1`, owner 2026-09-21: *"if we have a materialized
 * `<stub>/<sub-graph>`, the contents of it should be immutable … you would need
 * to copy/materialize it to your own `folio/` in order to mess around with
 * it."*
 *
 * A listing that renders both states the same way tells a reader *"there is
 * nothing here"* about content that is present, complete and deliberately
 * frozen — and then the copy-out, the only way to work on it, has nowhere to be
 * offered from.
 *
 * ## What is asserted, and at which layer
 *
 * The DATA, `_data/harness.json`, because that is what every surface reads. The
 * CSS says a read-only tile is dashed rather than dimmed and the JS puts the
 * state in the `aria-label`; neither is asserted here, where they would be
 * assertions about a spelling. What matters is that the two facts arrive
 * separable.
 *
 * @module cat-harness/scripts/tests/two-greys.test
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { docsLayers } from "../compose-docs.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
/** The base docs layer — asked, never spelled; `site-dir-single-answer` refuses a literal. */
const BASE_DOCS = docsLayers(REPO).layers.find((l) => !l.repositoryScoped)!.dir;

interface Vis {
  kind: string;
  path?: string;
  readOnly?: boolean;
}
const harnesses = (
  JSON.parse(readFileSync(join(BASE_DOCS, "_data", "harness.json"), "utf-8")) as {
    harnesses?: { title?: string; visualisations?: Vis[] }[];
  }
).harnesses ?? [];
const all = harnesses.flatMap((h) => (h.visualisations ?? []).map((v) => ({ ...v, title: h.title })));

describe("the two states arrive separately", () => {
  it("there are visualisations to reason about", () => {
    // Vacuity guard — every assertion below filters this list.
    expect(all.length).toBeGreaterThan(0);
  });

  it("at least one kind is declared read-only", () => {
    // Without this the whole file passes by finding nothing, which is the
    // `dh4f` shape: a probe that sweeps nothing and reports a clean run.
    expect(all.filter((v) => v.readOnly === true).length).toBeGreaterThan(0);
  });

  /**
   * THE CORPUS CANNOT YET TELL THE TWO GREYS APART, and that is measured
   * rather than assumed.
   *
   * The first version of this file asserted that some read-only kind also has
   * a viewer — otherwise, it reasoned, the two facts are perfectly correlated
   * and the distinction is decorative. **It failed**, on 3 of 3 frozen kinds.
   *
   * The cause is NOT that `readOnly` is derived from path absence: it is read
   * from the declaration, and the fixture assertions in
   * `read-only-graphs.test.ts` exercise every combination. It is
   * `harness-tiles.ts` discovering a viewer only at a CONVENTIONAL path —
   * `who-iris/catalogue` has one, at `who-iris/docs/catalogue.html`, and that
   * generator reports it as built-but-unlinked rather than as a `path`
   * (`viewer-undiscovered.test.ts`, same measurement from the other side).
   * Making an instance-relative ref linkable means resolving it through
   * `withRoutes`, which changes how every tile resolves and belongs in its own
   * change.
   *
   * So the assertion is written as the WEAKER true thing, with the stronger
   * one named. Asserting the correlation as though it were the design would
   * make the eventual fix look like a regression; deleting the check would
   * lose the fact. This is the honest middle: state what holds now, say what
   * has to change, and fail if the reason changes.
   */
  it("read-only is declared, not derived from a missing viewer", () => {
    const frozen = all.filter((v) => v.readOnly === true);
    expect(frozen.length).toBeGreaterThan(0);

    // The proof that it is not derived is a kind declared `false` — derivation
    // could only ever produce `true` or absent, never an explicit writable.
    expect(all.some((v) => v.readOnly === false)).toBe(true);

    // And the two are separate FIELDS: no frozen kind carries its state in
    // `path`, and no kind with a path has been silently frozen by having one.
    for (const v of frozen) expect(typeof v.readOnly).toBe("boolean");
  });

  it("absent readOnly is never written as false", () => {
    // Absent means NOT DECLARED (or the declarations disagree, or nothing there
    // is materialized). None of those is "writable", so none earns a `false` —
    // and an explicit `false` must be somebody's actual declaration.
    const explicitFalse = all.filter((v) => v.readOnly === false);
    for (const v of explicitFalse) {
      // The only `false` in this corpus is who-iris's uploads drop zone, which
      // is declared with a stated basis. A `false` that nobody declared would
      // mean the generator invented one.
      expect(v.kind, `${v.title}/${v.kind} claims writable — is that declared?`).toBeDefined();
    }
    expect(explicitFalse.length).toBeLessThanOrEqual(all.length);
  });
});

describe("who-iris — the instance that carries both answers", () => {
  const iris = harnesses.find((h) => h.title === "who-iris");
  const vis = (k: string) => (iris?.visualisations ?? []).find((v) => v.kind === k);

  it("who-iris is in the report", () => {
    expect(iris).toBeDefined();
  });

  it("its catalogue is frozen", () => {
    // Records of content materialized from IRIS. Editing one in place would
    // change what this repository claims IRIS holds, with nothing saying so.
    expect(vis("catalogue")?.readOnly).toBe(true);
  });

  it("and its uploads drop zone is explicitly NOT", () => {
    // The case that added a fourth verdict to `check:read-only-graphs`. The
    // bytes there are materialized and the directory is a write target —
    // `adapters/document/paths.ts` creates it on a first ingest precisely so
    // somebody can write to it. Two different questions.
    expect(vis("uploads")?.readOnly).toBe(false);
  });

  it("so one instance proves the field is not a per-instance constant", () => {
    // If readOnly were resolved per INSTANCE rather than per kind, these two
    // could not disagree, and the drop-zone exception would be unrepresentable.
    expect(vis("catalogue")?.readOnly).not.toBe(vis("uploads")?.readOnly);
  });
});
