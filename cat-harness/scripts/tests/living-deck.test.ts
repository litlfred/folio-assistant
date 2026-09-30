/**
 * The living deck's alignment claims, re-checked against the KG — bean `scfh`.
 *
 * `docs/living-deck.md` says, slide by slide, where the 2026-09-30 snapshot
 * agrees with the knowledge graph and where it does not. Those sentences are
 * the part of the page that goes stale silently: the deck they came from went
 * stale exactly that way, which is why the owner asked for a living one. So each
 * claim the page makes about the KG is asserted here. When one fails, the KG
 * moved: update the slide's note in `content/docs/living-deck/` and this test
 * together. Do not relax the assertion alone.
 *
 * @module scripts/tests/living-deck
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { ActorDefSchema } from "../../schemas/role-graph.ts";

const H = resolve(import.meta.dir, "../..");
const REPO = resolve(H, "..");
const DECK = join(H, "content/docs/living-deck");
const read = (p: string) => readFileSync(p, "utf-8");

describe("living deck: every claim about the KG still holds", () => {
  test("slide 1 — the layers page lists all five SMART layers", () => {
    const t = read(join(H, "content/docs/fhir-content/the-three-layers.md"));
    for (const l of ["**L1** Narrative", "**L2** Operational", "**L3** Machine readable", "L4 Executable", "L5 Dynamic"]) {
      expect(t).toContain(l);
    }
  });

  test("slide 6 — the lifecycle process still has the six lanes and eight tasks shown", () => {
    const x = read(join(H, "processes/content-lifecycle.bpmn"));
    expect([...x.matchAll(/<bpmn:lane [^>]*name=/g)]).toHaveLength(6);
    for (const skill of ["content-plan", "todo-manager", "content-author", "content-test",
      "content-publish", "content-feedback", "content-retire"]) expect(x).toContain(`[${skill}]`);
  });

  test("slide 8 — the generated UML has the Voice Profile class the snapshot lacks", () => {
    expect(read(join(H, "docs/assets/img/uml/harness-schemas.svg"))).toContain("VoiceProfileSchema");
  });

  test("slide 4 — the ingested SMART Base index still holds 25 StructureDefinition pages", () => {
    const ids = new Set<string>();
    const walk = (d: string) => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else for (const m of read(p).matchAll(/"StructureDefinition-[A-Za-z]*/g)) ids.add(m[0]);
      }
    };
    walk(join(REPO, "smart-base/fhir-artifact-index"));
    expect(ids.size).toBe(25);
  });

  test("slide 10 — smart-kg/ is still gone from the repository", () => {
    expect(existsSync(join(REPO, "smart-kg"))).toBe(false);
  });

  test("slide 13 — three taskable actor kinds, plus `external`, and the skill says so", () => {
    const kinds = (ActorDefSchema.shape.kind as unknown as { options: string[] }).options;
    expect([...kinds].sort()).toEqual(["agent", "external", "person", "system"]);
    const skill = read(join(H, "skills/folio-core/role-model.md"));
    expect(skill).toContain("An actor is one of three kinds — human, agentic, mechanical");
    expect(skill).toMatch(/`external` is the fourth/);
  });

  test("every generated asset the deck shows exists", () => {
    const md = readdirSync(DECK).filter((f) => f.endsWith(".md")).map((f) => read(join(DECK, f))).join("\n");
    const assets = [...md.matchAll(/\]\((assets\/[^)\s]+)\)/g)].map((m) => m[1]!);
    expect(assets.length).toBeGreaterThan(0);
    for (const a of assets) expect(existsSync(join(H, "docs", a)), a).toBe(true);
  });
});
