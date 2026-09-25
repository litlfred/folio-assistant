/**
 * bootstrap defines its own terms, and nothing in it points above it
 * (owner, 2026-09-23: "bootstrap = self definitional. no semantic leakage, no
 * graph leakage").
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { findDeclarationFile, instanceRootsIn } from "./cat-harness.ts";
import { CLASS_GLOSSES } from "./vocabulary.ts";
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

describe("FR-7: bootstrap holds no program code", () => {
  test("no file in bootstrap/ is a program", () => {
    const code: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(m?[jt]sx?|py|sh)$/.test(f)) code.push(p.slice(BOOTSTRAP.length + 1));
      }
    };
    walk(BOOTSTRAP);
    expect(code).toEqual([]);
  });
});

describe("nothing in bootstrap/ names anything above it (bean iwtn)", () => {
  /**
   * What is allowed, and why. Anything else that matches LEAKS fails.
   * - The publication address and the source repository: bootstrap's own
   *   location, not a reference to another Harness.
   * - The `folio-*` schema identifiers: structural names shared with the
   *   platform, renamed in a later stage of bean 12s9. The `folio:` diagram
   *   prefix is GONE from bootstrap (stage 2): its diagrams write
   *   `bootstrap.processes:`, so it is no longer allowed here.
   */
  const ALLOW = [
    /https:\/\/litlfred\.github\.io\/folio-assistant\//g,
    /https:\/\/github\.com\/litlfred\/folio-assistant\//g,
    /"folio-[a-z-]+\/v1"/g,
  ];
  /** Structural, awaiting the owner's ruling (bean iwtn). Each entry is `file: the leaking text`. */
  const PENDING: string[] = [];
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) {
        if (f !== "translations") walk(p);
      } else files.push(p);
    }
  };
  walk(BOOTSTRAP);

  test("only the listed structural names remain", () => {
    const found: string[] = [];
    for (const p of files) {
      let text = readFileSync(p, "utf-8");
      for (const a of ALLOW) text = text.replace(a, "");
      for (const line of text.split("\n")) {
        if (LEAKS.some((re) => re.test(line))) found.push(`${p.slice(BOOTSTRAP.length + 1)}: ${line.trim()}`);
      }
    }
    expect(found.sort()).toEqual([...PENDING].sort());
  });
});
