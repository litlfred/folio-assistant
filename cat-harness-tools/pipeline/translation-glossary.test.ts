/**
 * `translation:glossary:check` — the layered term base and its three rules,
 * and the "Glossary consistency" section of the KG QA report.
 *
 * Run: bun test pipeline/translation-glossary.test.ts
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TOOLS_ROOT } from "../scripts/lib/roots.ts";
import { glossaryConsistencyMarkdown } from "../scripts/kg-qa-report.ts";
import {
  checkLocale,
  glossaryResult,
  glossarySources,
  readSchemeScope,
  renders,
  termBase,
  uses,
  type GlossarySource,
} from "./translation-glossary.ts";

const HEADER = 'msgid ""\nmsgstr ""\n"Content-Type: text/plain; charset=UTF-8\\n"\n';
/** A scheme entry: a label (`#.` comment) or definition. */
const label = (id: string, str: string, flags = "") =>
  `\n#. Glossary term label: https://example.org/t/${id.toLowerCase()}\n${flags ? `#, ${flags}\n` : ""}msgid "${id}"\nmsgstr "${str}"\n`;
const plain = (id: string, str: string) => `\nmsgid "${id}"\nmsgstr "${str}"\n`;

let base: string;
const w = (rel: string, text: string): string => {
  const p = join(base, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, text);
  return p;
};

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "translation-glossary-"));
});
afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("matching", () => {
  test("a term is a whole word of the prose, case-insensitive", () => {
    expect(uses("Health worker", "Every health worker signs in.")).toBe(true);
    expect(uses("Actor", "The cat-harness-actor list")).toBe(false); // part of an identifier
    expect(uses("Actor", "See `Actor` in code")).toBe(false); // inside code
  });
  test("a short all-caps acronym is case-sensitive", () => {
    expect(uses("DID", "a DID document")).toBe(true);
    expect(uses("DID", "what did it do")).toBe(false);
  });
  test("a rendering is found by stem, or by substring in zh and ar", () => {
    expect(renders("agent de santé", "Les agents de santé arrivent", "fr")).toBe(true);
    expect(renders("agent de santé", "Le soignant arrive", "fr")).toBe(false);
    expect(renders("卫生工作者", "每位卫生工作者登录", "zh")).toBe(true);
    expect(renders("العامل الصحي", "يسجل العامل الصحي الدخول", "ar")).toBe(true);
  });
});

describe("termBase — the lower layer fixes, a higher one may only add", () => {
  let lower: string, higher: string, mine: string, ref: string;
  beforeAll(() => {
    lower = w("tb/lower/fr/glossary/core--terms.po", HEADER + label("Actor", "Acteur") + label("Skill", "Compétence"));
    higher = w(
      "tb/higher/fr/glossary/app--terms.po",
      HEADER +
        label("Actor", "Intervenant") + // a different translation of a term fixed below
        label("Health worker", "Agent de santé") + // a new term: allowed
        label("Localised", "x", "localised") + // fixes nothing
        label("Empty", "") + // fixes nothing
        label("A long label that is really a sentence of prose and not a term at all here", "x"),
    );
    mine = w("tb/mine/fr/glossary.po", HEADER + plain("Skill", "Savoir-faire") + plain("Clinic", "Clinique"));
    ref = w("tb/ref/fr/who.po", HEADER + label("Immunization", "Vaccination"));
  });
  const src = (): GlossarySource[] => [
    { layer: "who", file: ref, reference: true },
    { layer: "core", file: lower, reference: false },
    { layer: "app", file: higher, reference: false },
    { layer: "app", file: mine, reference: false },
  ];

  const get = (tb: ReturnType<typeof termBase>, label: string) => [...tb.terms.values()].filter((t) => t.term.toLowerCase() === label);

  test("each term binds in its scheme when no subject is declared; empty, localised and long labels fix nothing", () => {
    const tb = termBase("app", "fr", src());
    expect(get(tb, "actor").map((t) => [t.scope, t.fixed, t.inScope])).toEqual([
      ["core--terms", "Acteur", false],
      ["app--terms", "Intervenant", true],
    ]);
    expect(get(tb, "health worker")[0]).toMatchObject({ fixed: "Agent de santé", layer: "app", inScope: true });
    expect(get(tb, "immunization")[0]).toMatchObject({ layer: "who", scope: "reference:who", inScope: true });
    expect(get(tb, "localised")).toEqual([]);
    expect(get(tb, "empty")).toEqual([]);
    expect([...tb.terms.values()].some((t) => t.term.startsWith("A long label"))).toBe(false);
  });
  test("the instance translating another area's label otherwise is a sense check, not an override", () => {
    const tb = termBase("app", "fr", src());
    expect(tb.overrides).toEqual([]);
    expect(tb.senseOverrides.map((o) => `${o.term}:${o.fixed.scope}->${o.layer}`)).toEqual(["Actor:core--terms->app", "Skill:core--terms->app"]);
  });
  test("in ONE subject area the lower layer fixes, and a second translation is an override", () => {
    const shared = (x: GlossarySource): GlossarySource => ({ ...x, scope: "harness-vocabulary" });
    const tb = termBase("app", "fr", [shared(src()[1]!), shared(src()[2]!)]);
    expect(get(tb, "actor").map((t) => t.fixed)).toEqual(["Acteur"]);
    expect(tb.overrides.map((o) => `${o.term}:${o.fixed.layer}->${o.layer}`)).toEqual(["Actor:core->app"]);
  });
  test("a term's own subject overrides its scheme's; a term that is not authored fixes nothing", () => {
    const s = { ...src()[1]!, scope: "harness-vocabulary", termScopes: new Map<string, string | null>([["actor", "digital-health-trust"], ["skill", null]]) };
    const tb = termBase("app", "fr", [s]);
    expect(get(tb, "actor")[0]!.scope).toBe("digital-health-trust");
    expect(get(tb, "skill")).toEqual([]);
  });
  test("an instance binds in the subject areas it declares", () => {
    const tb = termBase("app", "fr", [{ ...src()[1]!, scope: "digital-health-trust" }], new Set(["digital-health-trust"]));
    expect(get(tb, "actor")[0]!.inScope).toBe(true);
  });
  test("a reference glossary binds every instance", () => {
    const tb = termBase("app", "fr", [
      ...src(),
      { layer: "app", file: w("tb/mine2/fr/glossary.po", HEADER + plain("Immunization", "Immunisation")), reference: false },
    ]);
    expect(tb.overrides.map((o) => o.term)).toEqual(["Immunization"]);
  });
});

describe("subject areas are read from the glossary each scheme catalogue names", () => {
  test("readSchemeScope: the scheme's subject, a term's own, and non-authored terms", () => {
    const f = w(
      "scope/x.glossary.json",
      JSON.stringify({
        $schema: "folio-glossary/v1",
        id: "terms",
        title: "T",
        subject: "harness-vocabulary",
        terms: [
          { id: "actor", prefLabel: "Actor", altLabel: ["Participant"], status: "authored", definition: "d" },
          { id: "policy", prefLabel: { en: "Policy" }, subject: "digital-health-trust", status: "authored", definition: "d" },
          { id: "draft", prefLabel: "Draft", status: "candidate" },
        ],
      }),
    );
    const sc = readSchemeScope(f)!;
    expect(sc.subject).toBe("harness-vocabulary");
    expect(sc.terms.get("policy")).toBe("digital-health-trust");
    expect(sc.terms.get("draft")).toBeNull();
    expect(sc.terms.has("actor")).toBe(false); // the scheme's subject applies
    expect(readSchemeScope(w("scope/not.json", "{}"))).toBeUndefined();
  });
  test("glossarySources finds the glossary from the catalogue's #: reference", () => {
    const root = join(base, "scoped");
    mkdirSync(join(root, "glossary"), { recursive: true });
    mkdirSync(join(root, "translations", "fr", "glossary"), { recursive: true });
    writeFileSync(
      join(root, "acme.json"),
      JSON.stringify({
        name: "acme",
        directories: [
          { id: "translations", path: "translations/", graphTypologies: ["translation-sources"] },
          { id: "glossary", path: "glossary/", graphTypologies: ["glossary"] },
        ],
      }),
    );
    writeFileSync(
      join(root, "glossary", "health.glossary.json"),
      JSON.stringify({ $schema: "folio-glossary/v1", id: "health", title: "H", subject: "who-health-guidance", terms: [{ id: "hw", prefLabel: "Health worker", status: "authored", definition: "d" }] }),
    );
    writeFileSync(
      join(root, "translations", "fr", "glossary", "acme--health.po"),
      HEADER + `\n#: glossary/health.glossary.json:1\n#. Glossary term label: https://example.org/t/hw\nmsgid "Health worker"\nmsgstr "Agent de santé"\n`,
    );
    const src = glossarySources(root, "fr").find((x) => x.file.endsWith("acme--health.po"))!;
    expect(src.scope).toBe("who-health-guidance");
  });
});

/** A one-instance checkout: `acme` with its own glossary and two content catalogues. */
function acme(dir: string, declare = true): string {
  const root = join(base, dir);
  mkdirSync(join(root, "translations", "fr", "glossary"), { recursive: true });
  writeFileSync(
    join(root, "acme.json"),
    JSON.stringify({ name: "acme", directories: declare ? [{ id: "translations", path: "translations/", graphTypologies: ["translation-sources"] }] : [] }),
  );
  writeFileSync(join(root, "translations", "fr", "glossary", "acme--terms.po"), HEADER + label("Health worker", "Agent de santé"));
  writeFileSync(
    join(root, "translations", "fr", "page.po"),
    HEADER +
      plain("Every health worker signs in.", "Chaque soignant se connecte.") + // not the fixed term
      plain("The clinic opens.", "La clinique ouvre.") +
      plain("Health worker", "Agent de santé") + // the term on its own
      plain("Actor", "Acteur"),
  );
  writeFileSync(
    join(root, "translations", "fr", "other.po"),
    HEADER + plain("A health worker arrives.", "Un agent de santé arrive.") + plain("Actor", "Intervenant"),
  );
  return root;
}

describe("checkLocale — the three rules, and scope", () => {
  test("flags a msgstr that does not use an in-scope fixed term, and a term rendered two ways", () => {
    const root = acme("chk");
    const platform = w("chk-platform/fr/glossary/core--terms.po", HEADER + label("Actor", "Acteur") + label("Clinic", "Centre"));
    const r = checkLocale(root, join(root, "translations"), "fr", [], [
      { layer: "core", file: platform, reference: false },
      ...glossarySources(root, "fr"),
    ]);
    expect(r.findings.map((f) => `${f.rule}:${f.term}`).sort()).toEqual([
      "inconsistent:Actor", // page.po «Acteur», other.po «Intervenant»
      "not-fixed-rendering:Health worker", // page.po: «soignant», not «agent de santé»
    ]);
    // Platform terms in health content: notes, not violations — "Clinic" in a
    // sentence, and "Actor" rendered otherwise in other.po.
    expect(r.sense.map((n) => n.term).sort()).toEqual(["Actor", "Clinic"]);
  });
  test("a clean locale has no findings", () => {
    const root = join(base, "clean");
    mkdirSync(join(root, "translations", "fr", "glossary"), { recursive: true });
    writeFileSync(
      join(root, "acme.json"),
      JSON.stringify({ name: "acme", directories: [{ id: "translations", path: "translations/", graphTypologies: ["translation-sources"] }] }),
    );
    writeFileSync(join(root, "translations", "fr", "glossary", "acme--terms.po"), HEADER + label("Health worker", "Agent de santé"));
    writeFileSync(join(root, "translations", "fr", "page.po"), HEADER + plain("A health worker arrives.", "Un agent de santé arrive."));
    const r = checkLocale(root, join(root, "translations"), "fr", [], glossarySources(root, "fr"));
    expect(r.findings).toEqual([]);
    expect(r.fixedTerms).toBe(1);
  });
});

function run(args: string[], cwd: string) {
  const r = spawnSync("bun", [join(TOOLS_ROOT, "pipeline", "translation-glossary.ts"), ...args], { cwd, encoding: "utf-8" });
  return { code: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

describe("the CLI: one finding per line, exit 0 / 1 / 2", () => {
  test("findings exit 1, one per line", () => {
    const root = acme("cli");
    const r = run(["--check", "--instance", root, "--locale", "fr"], base);
    expect(r.code).toBe(1);
    // No layer below fixes "Actor" here, so only the instance's own term binds.
    expect(r.out.split("\n").filter((l) => l.startsWith("✗ fr "))).toEqual([
      '✗ fr not-fixed-rendering «Health worker» → «Agent de santé» (acme) not used in translations/fr/page.po: "Every health worker signs in."',
    ]);
    expect(existsSync(join(root, "test", "results", "glossary-consistency.qa-results.json"))).toBe(false);
  });
  test("an override by a --layer reference term exits 1", () => {
    const root = acme("cli-ref");
    writeFileSync(join(root, "translations", "fr", "glossary.po"), HEADER + plain("Immunization", "Immunisation"));
    const ref = w("cli-ref-who/fr/who.po", HEADER + label("Immunization", "Vaccination"));
    const r = run(["--check", "--instance", root, "--locale", "fr", "--layer", `who=${ref.replace("/fr/", "/{locale}/")}`], base);
    expect(r.out).toContain("✗ fr override «Immunization»: who fixes «Vaccination»");
    expect(r.code).toBe(1);
  });
  test("cannot determine: an undeclared instance, or an unknown locale, exits 2", () => {
    expect(run(["--check", "--instance", acme("cli-bare", false)], base).code).toBe(2);
    expect(run(["--check", "--instance", acme("cli-loc"), "--locale", "xx"], base).code).toBe(2);
  });
  test("without --check it writes the qa-results record, one family per locale", () => {
    const root = acme("cli-write");
    run(["--instance", root], base);
    const rec = JSON.parse(readFileSync(join(root, "test", "results", "glossary-consistency.qa-results.json"), "utf-8"));
    expect(rec.$schema).toBe("qa-results/v1");
    expect(rec.subject).toEqual({ kind: "glossary-consistency", id: "acme" });
    expect(Object.keys(rec.families)).toEqual(["fr"]);
    expect(rec.families.fr.count).toBe(1);
  });
});

describe("the KG QA report's Glossary consistency section", () => {
  test("one sub-section per locale, its findings in a table", () => {
    const rec = glossaryResult("acme", [
      { locale: "fr", fixedTerms: 3, catalogues: 2, sense: [], findings: [{ rule: "inconsistent", term: "Actor", rendering: ["a.po: Acteur", "b.po: Intervenant"] }] },
      { locale: "ar", fixedTerms: 3, catalogues: 2, sense: [], findings: [] },
    ]);
    const md = glossaryConsistencyMarkdown(rec, { href: "assets/kg-qa/acme/glossary-consistency.qa-results.json", level: 3 }).join("\n");
    expect(md).toContain("### Glossary consistency");
    expect(md).toContain("#### fr");
    expect(md).toContain("#### ar");
    expect(md).toContain("| `inconsistent` | Actor |");
    expect(md).toContain("No findings.");
  });
});
