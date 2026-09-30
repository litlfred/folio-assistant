/**
 * cat-harness's READING of bootstrap: the tests that were in bootstrap's own
 * `graph.test.ts` but exercise harness code — the declaration reader, the
 * published vocabulary, the graph-kind registry. They moved out when
 * bootstrap-tools was re-created (bean `xsqm`), because a test of the harness
 * belongs with the harness: bootstrap-tools may import nothing above bootstrap.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { findDeclarationFile, instanceRootsIn } from "./cat-harness.ts";
import { CLASS_GLOSSES, termLayer } from "./vocabulary.ts";
import { BASE_GRAPH_KINDS } from "./graph-kind-registry.ts";
import { BOOTSTRAP_GRAPH_KINDS, BOOTSTRAP_TERMS, KnowledgeGraphDeclarationSchema } from "../../bootstrap-tools/schemas/graph.ts";

const REPO_ROOT = join(import.meta.dir, "..", "..");

describe("every declaration in this repository is a Knowledge Graph declaration", () => {
  const roots = instanceRootsIn(REPO_ROOT);
  test("there are declarations to check", () => expect(roots.length).toBeGreaterThan(3));
  for (const root of roots) {
    test(root.slice(REPO_ROOT.length) || "/", () => {
      const file = join(root, findDeclarationFile(root)!);
      const r = KnowledgeGraphDeclarationSchema.safeParse(JSON.parse(readFileSync(file, "utf-8")));
      expect(r.success ? "ok" : JSON.stringify(r.error.issues.slice(0, 2))).toBe("ok");
    });
  }
});

describe("the harness reads bootstrap's terms and kinds as bootstrap states them", () => {
  const own = Object.keys(BOOTSTRAP_GRAPH_KINDS);
  test("the published vocabulary uses bootstrap's definitions, and bootstrap's terms link nowhere above", () => {
    for (const [cls, term] of [["Actor", "Actor"], ["Role", "Role"], ["Skill", "Skill"], ["Process", "Process"], ["Directory", "Subgraph"], ["Harness", "Harness"]] as const) {
      expect(CLASS_GLOSSES[cls]!.gloss).toBe(BOOTSTRAP_TERMS[term]);
      // A term bootstrap defines is bootstrap's, IRI included (v3: Harness moved).
      expect(CLASS_GLOSSES[cls]!.layer, cls).toBe("bootstrap");
    }
    // Owner, 2026-09-29: "no tools in bootstrap". A Harness defines Tool.
    expect("Tool" in BOOTSTRAP_TERMS).toBe(false);
    expect(CLASS_GLOSSES.Tool!.layer ?? "harness").toBe("harness");
    const bootstrapLinks = Object.entries(CLASS_GLOSSES).filter(([, g]) => g.layer === "bootstrap" && g.seeAlso);
    expect(bootstrapLinks.map(([n]) => n)).toEqual([]);
  });

  test("the harness's registry reads bootstrap's sentence, and mints the type in bootstrap's layer", () => {
    for (const k of own) {
      const def = BASE_GRAPH_KINDS[k as keyof typeof BASE_GRAPH_KINDS];
      expect(def, k).toBeDefined();
      expect(def.summary).toBe(BOOTSTRAP_GRAPH_KINDS[k as keyof typeof BOOTSTRAP_GRAPH_KINDS]);
      const local = def.type.split("#").pop()!;
      expect(termLayer(local), `${k} → ${local}`).toBe("bootstrap");
    }
  });
});
