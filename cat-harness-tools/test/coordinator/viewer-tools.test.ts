/**
 * The viewer Tools' `renders` declarations, grounded against the HARNESS
 * declarations (owner, 2026-10-09: *"Need harness to declare visualizer is
 * renderedBy"*).
 *
 * A Tool's `renders` is what it CAN draw; a harness's `visualisers` say what
 * it DOES, each `renderedBy` one Tool. So the two are checked against each
 * other: every visualiser names a Tool that exists, every Tool a visualiser
 * names renders something, and every rendered kind is declared somewhere.
 * `check:visualiser-routes` is the gate over the same facts; this pins them in
 * the test set the checkout runs.
 *
 * Moved here from `cat-harness/scripts/tests/viewer-tools.test.ts` to the
 * checkout's own test home `test/` (bean `7zz1`): it reads every instance's
 * declaration, which only the whole checkout holds.
 */
import { describe, expect, it } from "bun:test";
import { join, resolve } from "node:path";
import { instanceRootsIn, instanceDirectories, isPublishedGraphTypology } from "../../schemas/kg/cat-harness.ts";
// Every instance's Tools: a viewer Tool may live in a dependency's `tools`
// graph (fhir-harness's `ig-pages`).
import { tools } from "../../tools/discover.js";
import { declaredVisualisers } from "../../scripts/viewer-declarations.js";

/** The directory this test was written in (`cat-harness/scripts/tests/`). */
const ORIGIN_DIR = join(import.meta.dir, "../../../cat-harness/scripts/tests");

const REPO = resolve(ORIGIN_DIR, "..", "..", "..");

interface Dir { id: string; graphTypologies?: string[] }

const dirs: { instance: string; dir: Dir }[] = [];
// Own entries AND those declared from within (bean `cmsl`).
for (const root of instanceRootsIn(REPO)) {
  for (const dir of instanceDirectories(root)) dirs.push({ instance: root, dir });
}

const all = tools();
const renderers = all.filter((t) => (t.renders ?? []).length > 0);
const rendered = new Set(renderers.flatMap((t) => t.renders ?? []));
const visualisers = declaredVisualisers(REPO);

describe("viewer Tools declare what they render", () => {
  it("there are viewer Tools, and declared visualisers, at all", () => {
    expect(renderers.length).toBeGreaterThan(0);
    expect(visualisers.length).toBeGreaterThan(0);
  });

  it("every declared visualiser is renderedBy a Tool that exists", () => {
    const ids = new Set(all.map((t) => t.id));
    expect(visualisers.filter((v) => !ids.has(v.renderedBy)).map((v) => `${v.harness}/${v.id} → ${v.renderedBy}`)).toEqual([]);
  });

  /**
   * Kinds a Tool here renders whose only holders are instances this index does
   * not mount — each with the instance that holds it. Listed rather than
   * waived: an entry whose kind starts being declared in the checkout fails
   * below, so the list can only shrink to what is still true.
   */
  const HELD_OUTSIDE: Record<string, string> = {
    // Owner, 2026-10-09: the `archimate` subgraph of cat-harness, whose first
    // instance is smart-ra's DPI-H reference architecture models.
    archimate: "litlfred/smart-ra",
    // Owner, 2026-11-01, Q-SUBG-6 A: a display sub-graph of `processes` for a
    // DAK's business processes. processes-viewer renders it (cat-harness
    // 4fb8e9c); no instance this index mounts declares it yet.
    "business-processes": "a DAK outside this index",
    // Owner, 2026-11-05, option A: journeys-viewer draws the journeys and
    // workshops of litlfred/smart-trust-demo and litlfred/smart-ips-pilgrimage,
    // neither of which this index mounts.
    "user-scenario": "litlfred/smart-trust-demo",
    workshop: "litlfred/smart-trust-demo",
    // Owner, 2026-11-06, option A: journeys-viewer draws the device screens of
    // the same two instances.
    "device-screen": "litlfred/smart-trust-demo",
  };

  it("every rendered kind is declared by some directory", () => {
    const declared = new Set(dirs.flatMap(({ dir }) => dir.graphTypologies ?? []));
    expect([...rendered].filter((k) => !declared.has(k) && !(k in HELD_OUTSIDE))).toEqual([]);
  });

  /**
   * TRANSITIONAL (remove once the cat-harness PR that adds `device-screen` to
   * journeys-viewer's `renders` is on cat-harness main): this layer draws the
   * kind and merges first, and the Tool that renders it is defined in
   * cat-harness, after. Until then the named Tool exists and does not render
   * it yet; that is checked as exactly that, never waived. Once it renders it,
   * the ordinary check holds it.
   */
  const NOT_YET_IN_THE_TOOLS_RENDERS: Record<string, string> = {
    "device-screen": "journeys-viewer",
  };

  it("every kind listed as held outside is still rendered here and still not held here", () => {
    const declared = new Set(dirs.flatMap(({ dir }) => dir.graphTypologies ?? []));
    const ids = new Set(all.map((t) => t.id));
    for (const k of Object.keys(HELD_OUTSIDE)) {
      const toCome = NOT_YET_IN_THE_TOOLS_RENDERS[k];
      if (toCome !== undefined && !rendered.has(k)) {
        // The Tool that will render it is defined; it does not list the kind yet.
        expect(ids.has(toCome), `${k} is to be rendered by ${toCome}, which does not exist`).toBe(true);
        expect(declared.has(k), `${k} is declared in this checkout now — drop it from HELD_OUTSIDE`).toBe(false);
        continue;
      }
      expect(rendered.has(k), `${k} is no longer rendered by any Tool — drop it from HELD_OUTSIDE`).toBe(true);
      expect(declared.has(k), `${k} is declared in this checkout now — drop it from HELD_OUTSIDE`).toBe(false);
    }
  });

  it("no Tool renders an unpublished kind — the Tool graph is published", () => {
    expect([...rendered].filter((k) => !isPublishedGraphTypology(k))).toEqual([]);
  });
});
