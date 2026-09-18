/**
 * A `<folio:skill ref="…"/>` names a skill that exists.
 *
 * AGENTS.md requires every activity to name the skill that implements it, and
 * nothing checked that the name resolved. Two diagrams referenced skills that
 * had never existed — `corpus-search` and `paper-relevance-triage` — so
 * `workflow_next` would hand an agent the name of something it cannot open,
 * which is worse than naming nothing: it looks like an answer.
 *
 * The full report (including per-diagram coverage, which is NOT gated here) is
 * `bun run check:workflow-refs`. This test gates only the unambiguous half.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadProcessModel, isActivity } from "../../src/workflow/process-model.ts";

const ROOT = join(import.meta.dir, "../..");

function knownSkills(): Set<string> {
  const names = new Set<string>();
  for (const dir of [
    join(ROOT, "skills", "content-lifecycle"),
    join(ROOT, "skills", "folio-core"),
    join(ROOT, "skills", "folio-document-adapter"),
    join(ROOT, "skills", "folio-paper-adapter"),
    join(ROOT, "src", "skills"),
  ]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith(".md")) names.add(f.slice(0, -3));
  }
  const schemaDir = join(ROOT, "schemas", "skills");
  if (existsSync(schemaDir)) {
    for (const e of readdirSync(schemaDir, { withFileTypes: true })) {
      if (e.isDirectory()) names.add(e.name);
    }
  }
  const localRoot = join(ROOT, ".claude", "skills");
  if (existsSync(localRoot)) {
    for (const g of readdirSync(localRoot, { withFileTypes: true })) {
      if (!g.isDirectory()) continue;
      for (const f of readdirSync(join(localRoot, g.name))) {
        if (f.endsWith(".md")) names.add(f.slice(0, -3));
        else if (f.endsWith(".json")) names.add(f.slice(0, -5));
      }
    }
  }
  return names;
}

describe("declared diagram paths resolve", () => {
  test("every bpmnDiagrams entry names a file that exists", async () => {
    // Same failure one layer over. `schemas/translation-tools.ts` listed
    // `skills/workflows/publication-workflow.bpmn`, which has never existed —
    // `docs/publication-workflow.md` is a PAGE embedding three diagrams. The
    // re-render skipped it silently, and a skipped diagram is
    // indistinguishable from one that needed no work.
    const { CONTENT_TYPE_TRANSLATIONS } = await import("../../schemas/translation-tools.ts");
    const missing: string[] = [];
    for (const ct of CONTENT_TYPE_TRANSLATIONS) {
      for (const rel of ct.bpmnDiagrams ?? []) {
        if (!existsSync(join(ROOT, rel))) missing.push(`${ct.contentType} → ${rel}`);
      }
    }
    expect(missing).toEqual([]);
  });

  test("every declared extractModule / injectModule exists", async () => {
    // `bpmn` declared NEITHER while its note described a working re-render,
    // so the capability read as built and was not.
    const { CONTENT_TYPE_TRANSLATIONS } = await import("../../schemas/translation-tools.ts");
    const missing: string[] = [];
    for (const ct of CONTENT_TYPE_TRANSLATIONS) {
      for (const f of ct.formats) {
        for (const rel of [f.extractModule, f.injectModule]) {
          if (rel && !existsSync(join(ROOT, rel))) missing.push(`${ct.contentType}/${f.id} → ${rel}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("workflow skill refs resolve", () => {
  test("the skill index is not empty — a broken index would pass everything", () => {
    // Without this the suite is satisfiable by a resolver that finds nothing
    // and a corpus that references nothing, which is not the property wanted.
    expect(knownSkills().size).toBeGreaterThan(20);
  });

  test("every folio:skill ref names a skill in this repository", async () => {
    const skills = knownSkills();
    const dir = join(ROOT, "skills", "workflows");
    const dangling: string[] = [];

    for (const file of readdirSync(dir).filter((f) => f.endsWith(".bpmn")).sort()) {
      const model = await loadProcessModel(join(dir, file));
      for (const node of [...model.nodes.values()].filter(isActivity)) {
        for (const ref of node.skills ?? []) {
          if (!skills.has(ref)) dangling.push(`${file} · ${node.id} → "${ref}"`);
        }
      }
    }
    expect(dangling).toEqual([]);
  });
});
