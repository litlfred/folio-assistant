/**
 * A layer's namespace DOCUMENT is published at the path its terms name.
 *
 * Every term hangs off a layer's namespace IRI — `fac:Catalogue` is
 * `…/folio-assistant-core/ns#Catalogue` — and the workflows publish one
 * document per layer so that IRI dereferences. The directory they publish
 * into was a LITERAL in a shell loop, and the IRI is a constant in
 * `schemas/namespaces.ts`. Nothing compared them.
 *
 * They drifted. #477 renamed the core instance from `folio-assist-core` to
 * `folio-assistant-core` and moved `CORE_NS` with it; both workflows kept
 * publishing to `_site/folio-assist-core/ns.jsonld`. So from that merge until
 * 2026-09-20, **every `fac:` term dereferenced to nothing** — the document sat
 * at a path no term named, and the path every term named had no document.
 *
 * `docs-site.yml` says the rule in its own comment — *"each of those is an IRI
 * stem, so each needs a document or `bs:Actor` dereferences to nothing — the
 * very defect this work exists to fix"* — and `ns-export.ts` asserts the
 * outcome outright: *"Every term lives in its layer's namespace … each of
 * which IS a file and dereferences."* Both were false for one of the three,
 * and no check read either claim.
 *
 * This is that comparison. It reads the loop out of the YAML rather than
 * restating the pairs, so a fourth layer is covered the day it is added.
 *
 * @module scripts/tests/ns-document-resolves
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { namespaceForLayer } from "../../schemas/namespaces.ts";

const REPO = join(import.meta.dir, "../../..");

/** The workflows that publish per-layer namespace documents. */
const WORKFLOWS = [".github/workflows/docs-site.yml", ".github/workflows/feature-staging.yml"] as const;

type Layer = "bootstrap" | "harness" | "core";

/**
 * The `layer:directory` pairs a workflow publishes namespace documents for.
 *
 * Read out of the `for pair in …` line rather than listed here. A test that
 * restated the pairs would pass while the workflow said something else, which
 * is the exact failure being guarded.
 */
function pairsIn(workflow: string): Array<{ layer: Layer; dir: string }> {
  const yaml = readFileSync(join(REPO, workflow), "utf-8");
  const line = yaml.split("\n").find((l) => l.includes("for pair in"));
  if (!line) throw new Error(`${workflow}: no \`for pair in …\` loop — has the publishing step been renamed?`);
  return [...line.matchAll(/"([a-z-]+):([a-z0-9-]+)"/g)].map((m) => ({
    layer: m[1] as Layer,
    dir: m[2]!,
  }));
}

/** The path segment a layer's namespace IRI names, e.g. `folio-assistant-core`. */
function segmentOf(layer: Layer): string {
  const ns = namespaceForLayer(layer);
  const m = ns.match(/\/([^/]+)\/ns#$/);
  if (!m) throw new Error(`namespace for ${layer} is not <base>/<segment>/ns#: ${ns}`);
  return m[1]!;
}

describe("a layer's namespace document is published where its terms say it is", () => {
  for (const workflow of WORKFLOWS) {
    test(`${workflow} publishes each layer under its own IRI segment`, () => {
      const pairs = pairsIn(workflow);

      // Vacuity guard FIRST. `check-declared-assets` shipped the version
      // without one and reported "0 across 0 instances, exit 0" (bean `6tkl`);
      // a regex that stops matching would otherwise turn this into a test that
      // asserts nothing and passes forever.
      expect(pairs.length).toBeGreaterThanOrEqual(3);

      const mismatched = pairs
        .filter((p) => p.dir !== segmentOf(p.layer))
        .map((p) => `${p.layer}: published to ${p.dir}, but its terms name ${segmentOf(p.layer)}`);
      expect(mismatched).toEqual([]);
    });
  }

  test("the two workflows agree with each other", () => {
    // They publish the same documents into two different trees, so a fix
    // applied to one and not the other leaves previews lying about the site.
    // That is how the original drift survived: docs-site and feature-staging
    // carried the same literal and both were wrong, so neither contradicted
    // the other.
    const [a, b] = WORKFLOWS.map(pairsIn);
    expect(a!.length).toBeGreaterThanOrEqual(3);
    expect(b).toEqual(a!);
  });

  test("every layer with a namespace is published by the loop", () => {
    // The inverse direction. The checks above pass if a layer is simply
    // dropped from the loop — its document then does not exist at all, which
    // is worse than existing at the wrong path.
    const published = new Set(pairsIn(WORKFLOWS[0]).map((p) => p.layer));
    for (const layer of ["bootstrap", "harness", "core"] as const) {
      expect({ layer, published: published.has(layer) }).toEqual({ layer, published: true });
    }
  });
});
