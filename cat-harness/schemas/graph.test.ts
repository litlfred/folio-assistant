/**
 * bootstrap defines its own terms, and nothing in it points above it
 * (owner, 2026-09-23: "bootstrap = self definitional. no semantic leakage, no
 * graph leakage").
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { findDeclarationFile, instanceRootsIn } from "./cat-harness.ts";
import { CLASS_GLOSSES, termLayer } from "./vocabulary.ts";
import { BASE_GRAPH_KINDS } from "./graph-kind-registry.ts";
import {
  BOOTSTRAP_GRAPH_KINDS,
  BOOTSTRAP_TERM_DEFINED_BY,
  BOOTSTRAP_TERM_USES,
  BOOTSTRAP_TERMS,
  KnowledgeGraphDeclarationSchema,
} from "./graph.ts";
import { checkDeclaredOrder } from "./dependency-order.ts";
import { unlinkedTerms } from "../content/pipeline/term-links.ts";

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

  test("the generated schema carries every term as a definition", () => {
    const schema = JSON.parse(readFileSync(join(BOOTSTRAP, "schemas", "graph.schema.json"), "utf-8"));
    expect(Object.keys(schema.$defs).sort()).toEqual(Object.keys(BOOTSTRAP_TERMS).sort());
    for (const [name, def] of Object.entries(BOOTSTRAP_TERMS)) expect(schema.$defs[name].description).toBe(def);
  });
});

describe("the terms are ordered: each definition uses only terms above it", () => {
  // Owner, 2026-09-29: "logically tight, non self-referential definitions".
  // A term is USED when its spaced name appears in a definition, singular or
  // plural, as a whole word; longer names are matched first, so "Node Kind"
  // is not also read as "Node".
  const names = Object.keys(BOOTSTRAP_TERMS).map((k) => ({ key: k, label: k.replace(/([a-z])([A-Z])/g, "$1 $2") }));
  const byLength = [...names].sort((a, b) => b.label.length - a.label.length);
  const uses = (text: string): string[] => {
    let rest = text;
    const found: string[] = [];
    for (const { key, label } of byLength) {
      const re = new RegExp(`\\b${label}(s|es)?\\b`, "g");
      if (re.test(rest)) {
        found.push(key);
        rest = rest.replace(re, " ");
      }
    }
    return found;
  };
  const order = names.map((n) => n.key);
  for (const [i, key] of order.entries()) {
    test(`${key} uses no later term and not itself`, () => {
      const later = uses(BOOTSTRAP_TERMS[key as keyof typeof BOOTSTRAP_TERMS]).filter((u) => order.indexOf(u) >= i);
      expect(later).toEqual([]);
    });
  }

  // The AUTHORED relation is the source; the matcher above is its guard.
  test("the authored uses lists keep the declared order (checkDeclaredOrder)", () => {
    const steps = order.map((id) => ({ id, needs: BOOTSTRAP_TERM_USES[id as keyof typeof BOOTSTRAP_TERM_USES] }));
    expect(checkDeclaredOrder(steps)).toEqual([]);
  });

  test("each authored uses list names exactly the terms its definition's text uses", () => {
    const disagree = order.flatMap((key) => {
      const k = key as keyof typeof BOOTSTRAP_TERMS;
      const said = new Set(uses(BOOTSTRAP_TERMS[k]));
      const authored = new Set(BOOTSTRAP_TERM_USES[k]);
      const onlySaid = [...said].filter((u) => !authored.has(u as never));
      const onlyAuthored = [...authored].filter((u) => !said.has(u));
      return onlySaid.length || onlyAuthored.length ? [`${key}: text ${[...said]} vs authored ${[...authored]}`] : [];
    });
    expect(disagree).toEqual([]);
  });

  test("checkDeclaredOrder names a forward, a self and a missing use", () => {
    expect(
      checkDeclaredOrder([
        { id: "a", needs: ["b"] },
        { id: "b", needs: ["b", "z"] },
      ]),
    ).toEqual([
      { id: "a", uses: "b", kind: "forward" },
      { id: "b", uses: "b", kind: "self" },
      { id: "b", uses: "z", kind: "missing" },
    ]);
  });

  test("every term names the schema that defines it", () => {
    for (const key of order) {
      const by = BOOTSTRAP_TERM_DEFINED_BY[key as keyof typeof BOOTSTRAP_TERM_DEFINED_BY];
      expect(by, key).toMatch(/^(#|https?:\/\/)/);
    }
  });
});

describe("bootstrap/README.md is self-definitional", () => {
  const readme = readFileSync(join(BOOTSTRAP, "README.md"), "utf-8");
  const links = [...readme.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]!);

  test("every link stays inside bootstrap/", () => {
    expect(links.filter((l) => l.startsWith("../") || l.startsWith("/") || /^[a-z]+:/.test(l))).toEqual([]);
  });

  test("every relative link and image resolves to a file in bootstrap/", () => {
    // What a reader of the README actually hits: the diagram pictures and the
    // file list are generated (kg:processes, kg:files), so a generator that
    // wrote a path to nothing would pass its own currency check. This is the
    // consumer-side check `artefact-verification.json` names for them.
    const broken = links
      .filter((l) => !/^[a-z]+:/.test(l) && !l.startsWith("#"))
      .map((l) => l.split("#")[0]!)
      .filter((p) => p !== "" && !existsSync(join(BOOTSTRAP, p)));
    expect(broken).toEqual([]);
  });

  test("names nothing above bootstrap", () => {
    expect(LEAKS.filter((re) => re.test(readme)).map(String)).toEqual([]);
  });

  test("each defined term is linked to its definition once, at its first use", () => {
    // No Tool: "no tools in bootstrap" (owner, 2026-09-29); a Harness defines it.
    for (const term of ["KnowledgeGraph", "Subgraph", "Harness", "Actor", "Role", "Process", "Skill"]) {
      const target = `schemas/graph.schema.json#/$defs/${term}`;
      expect(`${term}: ${links.filter((l) => l === target).length}`).toBe(`${term}: 1`);
    }
  });

  test("every defined term in the prose is a link (owner, 2026-09-29)", () => {
    // Hand-written prose only: the generated regions (`<!-- kg:… -->`) are
    // linked by their generator.
    const text = readme.slice(0, readme.indexOf("<!-- kg:") >= 0 ? readme.indexOf("<!-- kg:") : undefined);
    const targets = Object.keys(BOOTSTRAP_TERMS).map((key) => ({ key, href: "x" }));
    expect(unlinkedTerms(text, targets)).toEqual([]);
  });

  test("each term also links to its drawing, and the drawing's heading exists", () => {
    // The `[src]` link above opens JSON; a person reads the drawn page. Both
    // are asserted, because a link to a heading that was renamed lands at the
    // top of the page with nothing to say it missed.
    // A target is a heading OR an explicit `<a id>`. The Terms table uses the
    // second: the staging site's kramdown gave headings no ids, so a deep link
    // to a heading there landed at the top of the page.
    const page = readFileSync(join(BOOTSTRAP, "schemas", "README.md"), "utf-8");
    const targets = new Set([
      ...[...page.matchAll(/^#{1,6} (.+)$/gm)].map((m) =>
        m[1]!.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim().replace(/ /g, "-"),
      ),
      ...[...page.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]!),
    ]);
    const drawn = links.filter((l) => l.startsWith("schemas/README.md#"));
    expect(drawn.length).toBeGreaterThanOrEqual(7);
    expect(drawn.map((l) => l.split("#")[1]!).filter((a) => !targets.has(a))).toEqual([]);
    // Every term in the table carries its own anchor, so every term can be linked.
    for (const key of Object.keys(BOOTSTRAP_TERMS)) {
      const id = key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/ /g, "-");
      expect(targets.has(id), key).toBe(true);
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
   *
   * The `folio-*` schema identifiers are no longer allowed: bootstrap's own
   * files carry `model-registry/1.0.0` and `glossary-ledger/1.0.0`, each resolving
   * to a schema inside bootstrap (bean r3gy, D2). The `folio:` diagram prefix
   * went earlier (bean 12s9, stage 2).
   */
  const ALLOW = [
    /https:\/\/litlfred\.github\.io\/folio-assistant\//g,
    /https:\/\/github\.com\/litlfred\/folio-assistant\//g,
  ];
  /** Structural, awaiting the owner's ruling (bean iwtn). Each entry is `file: the leaking text`. */
  const PENDING: string[] = [];
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      // No skip. `translations/` used to be excepted here because bootstrap held
      // 15 `.pot` extraction templates, which are tooling OUTPUT — nobody reads
      // a `.pot`, so they contradicted bootstrap's own promise of "a file you
      // read, not something you run" and have moved to
      // `cat-harness/translations/<locale>/bootstrap/processes/`.
      //
      // The exception is gone rather than kept-and-unused, because while it
      // stood this test scanned 23 of 38 files under a name claiming all of
      // them. It now scans every file in `bootstrap/`, which is what it says.
      if (statSync(p).isDirectory()) walk(p);
      else files.push(p);
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

describe("bootstrap's graph kinds are its own (bean r3gy, D1)", () => {
  const decl = JSON.parse(readFileSync(join(BOOTSTRAP, "bootstrap.json"), "utf-8")) as {
    directories: { id: string; graphKinds: string[] }[];
  };
  const own = Object.keys(BOOTSTRAP_GRAPH_KINDS);

  test("every kind bootstrap's declaration uses is defined in bootstrap", () => {
    const used = new Set(decl.directories.flatMap((d) => d.graphKinds));
    expect([...used].filter((k) => !own.includes(k))).toEqual([]);
  });

  test("every kind bootstrap defines, it uses — no definition for a kind it does not hold", () => {
    const used = new Set(decl.directories.flatMap((d) => d.graphKinds));
    expect(own.filter((k) => !used.has(k))).toEqual([]);
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

describe("every $schema a bootstrap file carries is a Node Kind its declaration lists (r3gy D2; nodeSchemas, 2026-09-29)", () => {
  const decl = JSON.parse(readFileSync(join(BOOTSTRAP, "bootstrap.json"), "utf-8")) as {
    nodeSchemas?: Record<string, string>;
  };
  const kinds = decl.nodeSchemas ?? {};

  test("each file's $schema is declared in bootstrap.json's nodeSchemas", () => {
    const undeclared: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (f.endsWith(".json")) {
          const tag = (JSON.parse(readFileSync(p, "utf-8")) as { $schema?: unknown }).$schema;
          if (typeof tag === "string" && !(tag in kinds)) undeclared.push(`${p.slice(BOOTSTRAP.length + 1)}: ${tag}`);
        }
      }
    };
    walk(BOOTSTRAP);
    expect(undeclared).toEqual([]);
  });

  test("a local Node Schema exists inside bootstrap and fixes that very tag", () => {
    const bad: string[] = [];
    for (const [tag, where] of Object.entries(kinds)) {
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(where)) continue; // a published standard
      const p = join(BOOTSTRAP, where);
      if (!p.startsWith(BOOTSTRAP) || !existsSync(p)) {
        bad.push(`${tag}: ${where} is not a file in bootstrap/`);
        continue;
      }
      const c = (JSON.parse(readFileSync(p, "utf-8")) as { properties?: { $schema?: { const?: string } } }).properties?.$schema?.const;
      if (c !== tag) bad.push(`${tag}: ${where} fixes ${JSON.stringify(c)}`);
    }
    expect(bad).toEqual([]);
  });

  test("the two tags that used to name the platform are bootstrap's own", () => {
    expect(kinds["model-registry/1.0.0"]).toBe("schemas/model-registry.schema.json");
    expect(kinds["glossary-ledger/1.0.0"]).toBe("schemas/glossary-ledger.schema.json");
  });

  test("the declaration shape knows the field", () => {
    expect(KnowledgeGraphDeclarationSchema.safeParse(decl).success).toBe(true);
  });
});
