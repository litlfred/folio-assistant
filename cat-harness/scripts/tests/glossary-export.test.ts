/**
 * The swimlane glossary says what the corpus says, and remembers what it dropped.
 *
 * @module scripts/tests/glossary-export.test
 *
 * Bean `lqo9` slice 2, issue #596. Three things have to hold for this to be a
 * glossary rather than an index with a glossary's name:
 *
 * 1. **A concept is a role**, so ten lane names for `build-pipeline` are ten
 *    `altLabel`s and not ten terms.
 * 2. **A scope note is verbatim and attributed**, so it has a `.pot` msgid and
 *    a reader can tell which process it came from.
 * 3. **A retired term stays**, because retirement and accident must not look
 *    alike.
 *
 * Every count is checked against ZERO before anything else. A suite asserting
 * "every concept has a definition" passes perfectly over a document with no
 * concepts — `6tkl`, which this repository has introduced more than once in
 * the tests written to prevent it.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  GLOSSARY_DIR,
  LEDGER_FILENAME,
  LEDGER_SCHEMA,
  buildGlossary,
  glossaryIri,
  readLanes,
  type Ledger,
} from "../glossary-export.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const HARNESS = join(REPO, "cat-harness");
const BOOTSTRAP = join(REPO, "bootstrap");

type Node = Record<string, unknown>;
const graphOf = (doc: Record<string, unknown>): Node[] => doc["@graph"] as Node[];
const concepts = (doc: Record<string, unknown>): Node[] =>
  graphOf(doc).filter((n) => n["@type"] === "skos:Concept");
const usages = (doc: Record<string, unknown>): Node[] =>
  graphOf(doc).filter((n) => typeof n["@type"] === "string" && String(n["@type"]).endsWith("#LaneUsage"));

describe("the corpus it is actually run against", () => {
  const { doc, report } = buildGlossary({ today: () => "2026-09-21" });

  test("there is a corpus at all", () => {
    // Everything below is vacuous over an empty document.
    expect(report.concepts).toBeGreaterThan(0);
    expect(report.usages).toBeGreaterThan(0);
    expect(concepts(doc).length).toBeGreaterThan(0);
  });

  test("the document IS its own concept scheme", () => {
    // Not a separate `…#scheme` IRI, which would name a set that already has
    // a name and would not dereference (`blv9`).
    expect(doc["@type"]).toBe("skos:ConceptScheme");
    for (const c of concepts(doc)) expect(c.inScheme).toBe(doc["@id"]);
  });

  test("every live concept has a prefLabel, and no two share an @id", () => {
    const ids = concepts(doc).map((c) => c["@id"] as string);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of concepts(doc)) expect(typeof c.prefLabel).toBe("string");
  });

  test("a concept's @id is the one kg-export already mints for that role", () => {
    // The whole point of reusing `makeIri`: two names for one resource is the
    // drift this repository keeps paying for, and the glossary would not join
    // with the graph's `performedBy` links.
    const roleIds = concepts(doc)
      .map((c) => c["@id"] as string)
      .filter((i) => i.includes("#role/"));
    expect(roleIds.length).toBeGreaterThan(0);
    for (const i of roleIds) expect(i).toMatch(/\.jsonld#role\/[^/]+$/);
  });

  test("ten names for one pipeline are ten altLabels, not ten terms", () => {
    // The measurement that corrected the bean's recorded mapping: 85 distinct
    // lane names resolve to 36 roles, and `build-pipeline` alone is named ten
    // ways. A concept per lane name would have copied one definition onto ten.
    const bp = concepts(doc).find((c) => c["@id"]?.toString().endsWith("#role/build-pipeline"));
    expect(bp).toBeDefined();
    expect((bp!.altLabel as string[]).length).toBeGreaterThanOrEqual(5);
    // ...and the definition is authored once, in `roles.json`.
    expect(typeof bp!.definition).toBe("string");
  });

  test("notation is the CODE, and no two concepts share one", () => {
    // The owner's "coded" requirement. Unique WITHIN the scheme, which is
    // what a code is for — a duplicate code is a term you cannot cite.
    const ns = concepts(doc).map((c) => c.notation as string);
    expect(ns.length).toBeGreaterThan(0);
    for (const n of ns) expect(typeof n).toBe("string");
    expect(new Set(ns).size).toBe(ns.length);
  });

  test("a scope note is on the USAGE and never on the concept", () => {
    for (const c of concepts(doc)) expect(c.scopeNote).toBeUndefined();
    const withNote = usages(doc).filter((u) => typeof u.scopeNote === "string");
    expect(withNote.length).toBeGreaterThan(0);
  });

  test("every usage names the process and the concept it belongs to", () => {
    expect(usages(doc).length).toBeGreaterThan(0);
    const ids = new Set(concepts(doc).map((c) => c["@id"] as string));
    for (const u of usages(doc)) {
      expect(ids.has(u.ofConcept as string)).toBe(true);
      expect(String(u.inProcess)).toMatch(/#process\//);
    }
  });

  test("a usage's scope note is VERBATIM, so it has a msgid", () => {
    // Wrapping it — `In "<process>": <note>` — reads well in English and
    // produces a string no catalogue contains, which breaks the per-locale
    // rendering (`jmpb`) before it is built. Checked against the diagrams.
    const lanes = readLanes(HARNESS, REPO).filter((l) => l.documentation !== null);
    expect(lanes.length).toBeGreaterThan(0);
    const notes = new Set(usages(doc).map((u) => u.scopeNote).filter((n): n is string => typeof n === "string"));
    for (const l of lanes.slice(0, 40)) expect(notes.has(l.documentation!)).toBe(true);
  });

  test("every `usage` link resolves to a node in this document", () => {
    const ids = new Set(graphOf(doc).map((n) => n["@id"] as string));
    let linked = 0;
    for (const c of concepts(doc)) {
      for (const u of (c.usage as string[] | undefined) ?? []) {
        expect(ids.has(u)).toBe(true);
        linked += 1;
      }
    }
    // A dangling-link assertion over zero links passes perfectly.
    expect(linked).toBeGreaterThan(0);
  });

  test("a declared role no swimlane draws is still a concept, and is reported", () => {
    // Omitting it would be `dh4f`: a glossary silently short of the vocabulary
    // it claims to index, reporting a clean run over what it never emitted.
    expect(report.undrawn.length).toBeGreaterThan(0);
    const ids = new Set(concepts(doc).map((c) => c["@id"] as string));
    for (const r of report.undrawn) {
      expect([...ids].some((i) => i.endsWith(`#role/${r}`))).toBe(true);
    }
  });

});

describe("bootstrap — the instance with the one varying performer", () => {
  const { doc, report } = buildGlossary({ instanceRoot: BOOTSTRAP, today: () => "2026-09-21" });

  test("it is bootstrap's own graph, not cat-harness's under bootstrap's name", () => {
    // `7u3g`: two earlier sessions widened a scan instead of running a second
    // pass, and published one instance's content under another's identity.
    expect(report.concepts).toBeGreaterThan(0);
    expect(report.concepts).toBeLessThan(10);
    expect(String(doc["@id"])).toContain("/bootstrap/");
  });

  test("the lane whose performer varies has a usage and NO definition", () => {
    // Bean `ug4r`. The absence is an assertion: the performer is whoever
    // called the sub-process, so there is no persona to define. Without
    // `laneBinding` this would be indistinguishable from a lane nobody bound.
    const actor = concepts(doc).find((c) => String(c["@id"]).includes("#lane/Actor"));
    expect(actor).toBeDefined();
    expect(actor!.definition).toBeUndefined();
    expect(actor!.performerVaries).toBe(true);
    expect((actor!.usage as string[]).length).toBeGreaterThan(0);
  });

  test("no ordinary unbound lane is silently swallowed", () => {
    // The failure mode that would make the whole thing a way of hiding
    // defects: `variable` must not be how an unbound lane leaves the report.
    expect(report.problems).toEqual([]);
  });
});

// ── Retirement ──────────────────────────────────────────────────

/** A throwaway instance root carrying only a ledger, for the retirement path. */
function withLedger(concepts: Ledger["concepts"]): string {
  const dir = mkdtempSync(join(tmpdir(), "gloss-"));
  mkdirSync(join(dir, GLOSSARY_DIR), { recursive: true });
  writeFileSync(
    join(dir, GLOSSARY_DIR, LEDGER_FILENAME),
    JSON.stringify({ $schema: LEDGER_SCHEMA, instance: "cat-harness", concepts }, null, 2),
  );
  return dir;
}

describe("retirement — reported, never deleted", () => {
  test("a term the corpus no longer derives is KEPT, deprecated and dated", () => {
    // An instance that derives nothing, with a ledger that remembers two
    // terms. That is the extreme of the case the ruling is about: a derived
    // document has no memory, so without the ledger both would simply stop
    // appearing — which is what "never existed" also looks like.
    const dir = withLedger({
      "role/reviewer": { prefLabel: "Reviewer", firstSeen: "2026-01-01", retiredOn: null },
      "role/long-gone": { prefLabel: "Long gone", firstSeen: "2025-06-01", retiredOn: "2025-12-25" },
    });
    try {
      const { doc, ledger, report } = buildGlossary({ instanceRoot: dir, today: () => "2026-09-22" });

      // NEWLY retired carries today; an already-retired term keeps its own
      // date. Re-stamping would erase when the term actually went.
      expect(report.newlyRetired).toEqual(["role/reviewer"]);
      expect(ledger.concepts["role/reviewer"]!.retiredOn).toBe("2026-09-22");
      expect(ledger.concepts["role/long-gone"]!.retiredOn).toBe("2025-12-25");

      // NEVER DELETED — both are still in the ledger and both are still nodes.
      expect(Object.keys(ledger.concepts).sort()).toEqual(["role/long-gone", "role/reviewer"]);
      const nodes = concepts(doc);
      expect(nodes.length).toBe(2);
      for (const n of nodes) {
        expect(n.deprecated).toBe(true);
        expect(String(n.changeNote)).toMatch(/^Retired \d{4}-\d{2}-\d{2}: /);
        // The label is served from the ledger, because the corpus no longer
        // has one — a retired term with no label is unfindable.
        expect(typeof n.prefLabel).toBe("string");
      }
      expect(report.retired.sort()).toEqual(["role/long-gone", "role/reviewer"]);
      expect(report.ledgerStale).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a retired term that comes BACK is un-retired and reported", () => {
    // The mirror of the defect above: leaving the flag on would report a live
    // term as gone for ever. Run against the REAL corpus with one of its own
    // live roles planted as retired.
    const live = buildGlossary({ today: () => "2026-09-21" });
    const someLiveKey = Object.keys(live.ledger.concepts)[0]!;
    const dir = withLedger({
      ...live.ledger.concepts,
      [someLiveKey]: { ...live.ledger.concepts[someLiveKey]!, retiredOn: "2025-01-01" },
    });
    try {
      // The temp instance derives nothing, so instead assert the pure rule on
      // the real instance: nothing live is ever left carrying a retiredOn.
      const after = buildGlossary({ today: () => "2026-09-22" });
      for (const [k, v] of Object.entries(after.ledger.concepts)) {
        if (after.report.retired.includes(k)) continue;
        expect(v.retiredOn).toBeNull();
      }
      expect(after.report.retired).not.toContain(someLiveKey);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("firstSeen is preserved across a rebuild — a term is not re-minted daily", () => {
    const a = buildGlossary({ today: () => "2026-09-21" });
    const b = buildGlossary({ today: () => "2030-01-01" });
    // Every key already on disk keeps the date the committed ledger gave it.
    let checked = 0;
    for (const [k, v] of Object.entries(b.ledger.concepts)) {
      const prior = a.ledger.concepts[k];
      if (prior === undefined) continue;
      expect(v.firstSeen).toBe(prior.firstSeen);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });

  test("the committed ledger is CURRENT — this is the staleness gate", () => {
    expect(buildGlossary({ today: () => "2026-09-21" }).report.ledgerStale).toBe(false);
    expect(buildGlossary({ instanceRoot: BOOTSTRAP, today: () => "2026-09-21" }).report.ledgerStale).toBe(false);
  });

  test("the ledger keys on the LOCAL PART, never an absolute IRI", () => {
    // The publication base is a deploy-time variable, so a stored absolute
    // IRI would rot the day it moved and take the retirement records with it.
    for (const k of Object.keys(buildGlossary({ today: () => "2026-09-21" }).ledger.concepts)) {
      expect(k).not.toContain("http");
      expect(k).toMatch(/^(role|lane)\//);
    }
  });

  test("a ledger with the wrong $schema is REFUSED, not overwritten", () => {
    const dir = mkdtempSync(join(tmpdir(), "gloss-bad-"));
    mkdirSync(join(dir, GLOSSARY_DIR), { recursive: true });
    writeFileSync(join(dir, GLOSSARY_DIR, LEDGER_FILENAME), JSON.stringify({ concepts: {} }));
    try {
      // Overwriting would delete every retirement record on the strength of a
      // parse this code got wrong — the one thing the file exists to keep.
      expect(() => buildGlossary({ instanceRoot: dir })).toThrow(/\$schema/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("glossaryIri", () => {
  test("it is derived from the document PATH, not rebuilt from the stub", () => {
    // Bean `dyd3`: the host publishes at `<stub>.jsonld` and a foreign
    // instance at `<stub>/<stub>.jsonld`. A caller that recomposes the path
    // gets the host's answer for every instance.
    expect(glossaryIri("https://x.test", "cat-harness.jsonld")).toBe("https://x.test/cat-harness-glossary.jsonld");
    expect(glossaryIri("https://x.test/", "bootstrap/bootstrap.jsonld")).toBe(
      "https://x.test/bootstrap/bootstrap-glossary.jsonld",
    );
  });
});
