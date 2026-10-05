/**
 * The living deck's alignment claims, re-checked against the KG — bean `scfh`.
 *
 * `docs/harnessed-kg-overview.md` says, slide by slide, where the 2026-09-30 snapshot
 * agrees with the knowledge graph and where it does not. Those sentences are
 * the part of the page that goes stale silently: the deck they came from went
 * stale exactly that way, which is why the owner asked for a living one. So each
 * claim the page makes about the KG is asserted here. When one fails, the KG
 * moved: update the slide's note in `content/docs/harnessed-kg-overview/` and this test
 * together. Do not relax the assertion alone.
 *
 * @module scripts/tests/harnessed-kg-overview
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.ts";
import { ActorDefSchema } from "../../schemas/role-graph.ts";
import { ownKgRoots, workflowFile } from "../known-skills.ts";

const H = resolve(import.meta.dir, "../..");
const REPO = resolve(H, "..");
const DECK = join(H, "content/docs/harnessed-kg-overview");
/** The published site root, from the declaration — never a literal. */
const SITE = join(H, siteDirFor(H));
const read = (p: string) => readFileSync(p, "utf-8");

/**
 * A skill's file, found under the instance's declared knowledge-graph roots
 * rather than at a literal path — skills move between topic directories
 * (`role-model` left `skills/folio-core/` for `skills/process/process-core/`).
 */
function skillFile(name: string): string {
  const hits: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === `${name}.md`) hits.push(p);
    }
  };
  for (const r of ownKgRoots(H)) if (existsSync(r)) walk(r);
  expect(hits, `skill ${name} under the declared kg roots`).toHaveLength(1);
  return hits[0]!;
}

describe("living deck: every claim about the KG still holds", () => {
  test("slide 1 — the layers page lists all five SMART layers", () => {
    const t = read(join(H, "content/docs/fhir-content/the-three-layers.md"));
    for (const l of ["**L1** Narrative", "**L2** Operational", "**L3** Machine readable", "L4 Executable", "L5 Dynamic"]) {
      expect(t).toContain(l);
    }
  });

  test("slide 6 — the lifecycle process still has the six lanes and eight tasks shown", () => {
    const x = read(workflowFile(H, "content-lifecycle.bpmn"));
    expect([...x.matchAll(/<bpmn:lane [^>]*name=/g)]).toHaveLength(6);
    for (const skill of ["content-plan", "todo-manager", "content-author", "content-test",
      "content-publish", "content-feedback", "content-retire"]) expect(x).toContain(`[${skill}]`);
  });

  test("slide 8 — the generated UML has the Voice Profile class the snapshot lacks", () => {
    expect(read(join(SITE, "assets/img/uml/harness-schemas.svg"))).toContain("VoiceProfileSchema");
  });

  test("slide 2 — the CDN decision is recorded, MADR-shaped, with at least two real options", () => {
    const bean = readdirSync(join(REPO, "beans/defs")).find((f) => f.startsWith("folio-assistant-l9v6"));
    expect(bean, "bean l9v6 (the CDN decision record) is missing").toBeDefined();
    const body = read(join(REPO, "beans/defs", bean!));
    const opts = body.split("## Considered options")[1]!.split("\n## ")[0]!.match(/^- /gm) ?? [];
    expect(opts.length).toBeGreaterThanOrEqual(2);
    expect(body).toContain("## Decision outcome");
  });

  // Slide 3's two claims (ten DAK components; the squares figure is current)
  // moved to smart-base/scripts/gen-dak-components-figure.test.ts with the
  // generator and the DAK vocabulary (bean 1335). Core no longer imports
  // either, so a core test asserting them would be core importing a harness.

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

  test("slide 10 — the taxonomy still uses smart-kg as its example, and says it is its own repository", () => {
    const t = read(join(SITE, "architecture/repo-taxonomy.md"));
    expect(t).toContain("`smart-kg` and `smart-kg-tools` is the worked example");
    expect(t).toContain("`smart-kg` is already its own repository");
    // Its stub left this checkout for that reason (bean `wg7r`).
    expect(existsSync(join(REPO, "smart-kg"))).toBe(false);
  });

  test("slide 13 — three taskable actor kinds, plus `external`, and the skill says so", () => {
    const kinds = (ActorDefSchema.shape.kind as unknown as { options: string[] }).options;
    expect([...kinds].sort()).toEqual(["agent", "external", "person", "system"]);
    const skill = read(skillFile("role-model"));
    expect(skill).toContain("An actor is one of three kinds — human, agentic, mechanical");
    expect(skill).toMatch(/`external` is the fourth/);
  });

  test("every generated asset the deck shows exists", () => {
    const md = readdirSync(DECK).filter((f) => f.endsWith(".md")).map((f) => read(join(DECK, f))).join("\n");
    // Written through `relative_url` since the deck's page moved under
    // `docs/cat-harness/` (bean `kc7k`); a bare relative path would resolve there.
    const assets = [...md.matchAll(/\]\(\{\{ '\/(assets\/[^']+)' \| relative_url \}\}\)/g)].map((m) => m[1]!);
    expect(assets.length).toBeGreaterThan(0);
    for (const a of assets) expect(existsSync(join(SITE, a)), a).toBe(true);
  });

  test("every deck picture the page shows exists, and is the library entry's own image", () => {
    const md = readdirSync(DECK).filter((f) => f.endsWith(".md")).map((f) => read(join(DECK, f))).join("\n");
    const shown = [...new Set([...md.matchAll(/'\/(assets\/img\/kg-deck\/[^']+)' \| relative_url/g)].map((m) => m[1]!))];
    expect(shown.length).toBeGreaterThan(0);
    const entry = join(H, "library/kg-folio-asst-2026-09-30");
    const raw = JSON.parse(read(join(entry, "images.json"))) as unknown;
    const recs = (Array.isArray(raw) ? raw : (raw as { images: unknown[] }).images) as Array<{ file: string }>;
    const held = new Set(recs.map((r) => resolve(entry, r.file)));
    for (const a of shown) {
      expect(existsSync(join(SITE, a)), a).toBe(true);
      expect(held.has(join(SITE, a)), `${a} is not an image of the library entry`).toBe(true);
    }
  });
});
