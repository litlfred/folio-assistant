/**
 * bootstrap defines its own terms, and nothing in it points above it
 * (owner, 2026-09-23: "bootstrap = self definitional. no semantic leakage, no
 * graph leakage").
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { findDeclarationFile, instanceRootsIn } from "../../cat-harness/schemas/cat-harness.ts";
import { CLASS_GLOSSES } from "../../cat-harness/schemas/vocabulary.ts";
import { BOOTSTRAP_TERMS, KnowledgeGraphDeclarationSchema } from "./graph.ts";

const REPO_ROOT = join(import.meta.dir, "..", "..");
const BOOTSTRAP = join(REPO_ROOT, "bootstrap");
/** Names of things above bootstrap, and outside standards named by acronym alone. */
const LEAKS = [/\bWHO\b/, /\bDAK\b/, /\bSMART\b/i, /cat-harness/, /folio/i, /smart-base/, /\bL[123]\b/];

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

describe("bootstrap's terms are its own", () => {
  test("no definition names anything above bootstrap", () => {
    const leaking = Object.entries(BOOTSTRAP_TERMS).filter(([, d]) => LEAKS.some((re) => re.test(d)));
    expect(leaking).toEqual([]);
  });

  test("the published vocabulary uses bootstrap's definitions, and bootstrap's terms link nowhere above", () => {
    for (const [cls, term] of [["Actor", "Actor"], ["Role", "Role"], ["Skill", "Skill"], ["Process", "Process"], ["Directory", "Subgraph"], ["Tool", "Tool"], ["Harness", "Harness"]] as const) {
      expect(CLASS_GLOSSES[cls]!.gloss).toBe(BOOTSTRAP_TERMS[term]);
    }
    const bootstrapLinks = Object.entries(CLASS_GLOSSES).filter(([, g]) => g.layer === "bootstrap" && g.seeAlso);
    expect(bootstrapLinks.map(([n]) => n)).toEqual([]);
  });

  test("the generated schema carries every term as a definition", () => {
    const schema = JSON.parse(readFileSync(join(BOOTSTRAP, "schemas", "graph.schema.json"), "utf-8"));
    expect(Object.keys(schema.$defs).sort()).toEqual(Object.keys(BOOTSTRAP_TERMS).sort());
    for (const [name, def] of Object.entries(BOOTSTRAP_TERMS)) expect(schema.$defs[name].description).toBe(def);
  });
});

describe("bootstrap/README.md is self-definitional", () => {
  const readme = readFileSync(join(BOOTSTRAP, "README.md"), "utf-8");
  const links = [...readme.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]!);

  test("every link stays inside bootstrap/", () => {
    expect(links.filter((l) => l.startsWith("../") || l.startsWith("/") || /^[a-z]+:/.test(l))).toEqual([]);
  });

  test("names nothing above bootstrap", () => {
    expect(LEAKS.filter((re) => re.test(readme)).map(String)).toEqual([]);
  });

  test("each defined term is linked to its definition once, at its first use", () => {
    for (const term of ["KnowledgeGraph", "Subgraph", "Harness", "Actor", "Role", "Process", "Skill", "Tool"]) {
      const target = `schemas/graph.schema.json#/$defs/${term}`;
      expect(`${term}: ${links.filter((l) => l === target).length}`).toBe(`${term}: 1`);
    }
  });
});
