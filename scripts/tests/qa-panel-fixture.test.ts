/**
 * The e2e fixture is frozen. This is what stops it going stale in silence.
 *
 * `tests/fixtures/block-with-one-failure.block.json` is a captured copy of real
 * generator output, because the live sidecar it came from no longer holds a
 * failure to render (bean `tywj`, and `qjyi` / `iumj` for the same defect found
 * by sibling sessions). Freezing buys a stable verdict and costs the one
 * property the e2e spec's own header argues for: a fixture read off disk cannot
 * "agree with the code while the code disagrees with the corpus".
 *
 * So the SHAPE is checked here against what the generator writes today, while
 * the VERDICT stays frozen there. If `qa-witness` grows a field, renames one, or
 * changes how a witness is recorded, this fails and names the difference —
 * rather than the e2e suite passing against a document the generator would no
 * longer produce.
 *
 * **Third state, deliberately.** A checkout with no published sidecars reports
 * `n/a` and passes. "Could not compare" is not "compared and matched", and a
 * shallow or pre-publish tree must not read as a verified one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const FIXTURE = join(ROOT, "tests/fixtures/block-with-one-failure.block.json");
const PUBLISHED = join(ROOT, "docs/assets/qa");

interface Doc {
  $schema?: string;
  criteria: Array<Record<string, unknown> & { witnesses?: Array<Record<string, unknown>> }>;
}

/** Every `*.block.json` the generator has published, at any depth. */
function publishedBlockSidecars(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...publishedBlockSidecars(p));
    else if (e.name.endsWith(".block.json")) out.push(p);
  }
  return out;
}

const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as Doc;
const live = publishedBlockSidecars(PUBLISHED);

describe("the frozen e2e fixture still matches what the generator writes", () => {
  it("is a block sidecar with a severity-bearing failure carrying evidence", () => {
    // What the e2e spec needs from it, asserted where a reader will look for it
    // rather than only inside a Playwright file.
    const fail = fixture.criteria.find((c) => c.result === "fail");
    expect(fail).toBeDefined();
    expect(fail!.id).toBe("voice-status-leak");
    expect(fail!.severity).toBe("critical");
    expect(Array.isArray(fail!.evidence)).toBe(true);
    expect((fail!.evidence as string[]).length).toBeGreaterThan(0);
    expect(fail!.witnesses?.[0]?.kind).toBe("script");
    expect(typeof fail!.witnesses?.[0]?.scriptHash).toBe("string");
  });

  it("declares the same `$schema` as the published sidecars", () => {
    if (live.length === 0) {
      console.log("n/a: no published block sidecars under docs/assets/qa — shape unverified");
      return;
    }
    const schemas = new Set(
      live.map((f) => (JSON.parse(readFileSync(f, "utf8")) as Doc).$schema ?? "<absent>"),
    );
    expect(schemas.has(fixture.$schema ?? "<absent>")).toBe(true);
  });

  it("uses no criterion or witness field the generator has stopped writing", () => {
    if (live.length === 0) {
      console.log("n/a: no published block sidecars under docs/assets/qa — shape unverified");
      return;
    }
    const critKeys = new Set<string>();
    const witKeys = new Set<string>();
    for (const f of live) {
      const doc = JSON.parse(readFileSync(f, "utf8")) as Doc;
      for (const c of doc.criteria) {
        Object.keys(c).forEach((k) => critKeys.add(k));
        for (const w of c.witnesses ?? []) Object.keys(w).forEach((k) => witKeys.add(k));
      }
    }
    // Three fields the CURRENT corpus cannot vouch for, each because it is
    // written only in a state the corpus is not in — which is the whole reason
    // the fixture is frozen rather than read live:
    //
    //  - `evidence` and `severity`, written for a FAILING criterion. #314
    //    measured that no criterion anywhere in the corpus carries `evidence`
    //    any more.
    //  - `changed`, written for a STALE witness, and nothing is stale today.
    //    This one was found by this test on its first run, which is the
    //    behaviour being bought: the set of "fields only a corpus in some other
    //    state would show you" is longer than it looks, and a checker that
    //    enumerated it from memory would have been wrong.
    //
    // They are covered by the schema assertions above instead.
    const vouched = new Set([...critKeys, "evidence", "severity"]);
    const vouchedWitness = new Set([...witKeys, "changed"]);
    for (const c of fixture.criteria) {
      for (const k of Object.keys(c)) {
        expect(vouched.has(k), `criterion field '${k}' is in the fixture but not the corpus`).toBe(
          true,
        );
      }
      for (const w of c.witnesses ?? []) {
        for (const k of Object.keys(w)) {
          expect(
            vouchedWitness.has(k),
            `witness field '${k}' is in the fixture but not the corpus`,
          ).toBe(true);
        }
      }
    }
  });
});
