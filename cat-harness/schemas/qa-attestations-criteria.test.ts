/**
 * The attestation store's block-qa and translation-qa families (bean `8wj1`,
 * arc `3fva`, defect C11), on the schema and API bean `2gst` declared.
 *
 * Two halves. The unit half pins the read states, the composition, the
 * refusals and owner ruling 2 (auto-move on first save). The corpus half runs
 * against THIS repository's committed reports and store, and is what "the 13
 * agent entries are byte-identical in `test/attestations/`" means as a check
 * rather than a claim.
 */
import { describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  attestationKeyForDerived,
  attestationPath,
  attestationPathFor,
  blockAttestationKey,
  composeCriteria,
  criteriaAttestationsHome,
  entryIdentity,
  finalizeCriteria,
  isAsciiEscaped,
  jsonText,
  QaAttestationsSchema,
  readCriteriaAttestations,
  resolvePrior,
  splitCriteria,
  translationAttestationKey,
  writeCriteriaAttestations,
  type CriteriaMap,
} from "./qa-attestations";
import { derivedReports, migrateCriteria } from "../scripts/migrate-qa-attestations";

const INSTANCE = join(import.meta.dir, "..");

const script = (tag: string) => ({ result: "pass", reviewer: { kind: "script", id: `s-${tag}` }, field_hash: { md: tag } });
const agent = (tag: string) => ({ result: "fail", reviewer: { kind: "agent", id: `a-${tag}` }, notes: tag });

/** A throwaway instance with no declaration: its store is the convention path. */
function instance(withStore: boolean): { root: string; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "qa-attest-"));
  if (withStore) writeCriteriaAttestations(root, blockAttestationKey(root, join(root, "seed")), { c: [agent("seed")] });
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

describe("the envelope — 2gst's, with the 8wj1 families as union members", () => {
  test("a block-qa file carries {kind, id, path} as its subject and validates", () => {
    const t = instance(true);
    try {
      const file = JSON.parse(readFileSync(attestationPath(t.root, blockAttestationKey(t.root, join(t.root, "seed"))), "utf-8"));
      expect(file.subject).toEqual({ kind: "block", id: "seed", path: "seed" });
      expect(QaAttestationsSchema.safeParse(file).success).toBe(true);
    } finally {
      t.cleanup();
    }
  });

  test("a script entry, a missing locale on translation-qa, or a stray field is refused", () => {
    const base = { $schema: "qa-attestations/v1", family: "block-qa", subject: { kind: "block", id: "b", path: "b" } };
    expect(QaAttestationsSchema.safeParse({ ...base, criteria: { c: [agent("x")] } }).success).toBe(true);
    expect(QaAttestationsSchema.safeParse({ ...base, criteria: { c: [script("x")] } }).success).toBe(false);
    expect(QaAttestationsSchema.safeParse({ ...base, family: "translation-qa", criteria: {} }).success).toBe(false);
    expect(QaAttestationsSchema.safeParse({ ...base, family: "translation-qa", locale: "fr", criteria: {} }).success).toBe(true);
    expect(QaAttestationsSchema.safeParse({ ...base, criteria: {}, totals: {} }).success).toBe(false);
  });

  test("the subject-composed path is the same one attestationPathFor gives for the derived report", () => {
    const t = instance(false);
    try {
      const key = translationAttestationKey(t.root, join(t.root, "content", "p"), "fr");
      const derived = join(t.root, "test", "results", "translation-qa", "content", "p.fr.translation-qa.json");
      const viaReport = attestationPathFor(derived, join(t.root, "test", "results", "translation-qa"), criteriaAttestationsHome(t.root).root, "translation-qa", ".translation-qa.json");
      expect(attestationPath(t.root, key)).toBe(viaReport);
      expect(attestationKeyForDerived(t.root, derived)).toEqual(key);
    } finally {
      t.cleanup();
    }
  });
});

describe("split and compose", () => {
  test("compose(split(x)) is x when judgements lead, key order included", () => {
    const criteria: CriteriaMap = { a: [agent("1"), script("1")], b: [script("2")], c: [agent("3")] };
    const s = splitCriteria(criteria);
    expect(Object.keys(s.script)).toEqual(["a", "b", "c"]);
    expect(JSON.stringify(composeCriteria(s.script, s.attestations))).toBe(JSON.stringify(criteria));
  });

  test("a malformed entry is kept as a judgement, never dropped as a script one", () => {
    const s = splitCriteria({ a: [{} as never, script("x")] });
    expect(s.attestations.a).toHaveLength(1);
  });
});

describe("read states", () => {
  test("no store directory at all is `absent` — not a refusal", () => {
    const t = instance(false);
    try {
      expect(readCriteriaAttestations(t.root, blockAttestationKey(t.root, join(t.root, "x"))).state).toBe("absent");
    } finally {
      t.cleanup();
    }
  });

  test("present store, no file for the subject: `miss`; a garbled file: `corrupt`", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "content", "b"));
      expect(readCriteriaAttestations(t.root, key).state).toBe("miss");
      mkdirSync(join(t.root, "test", "attestations", "block-qa", "content"), { recursive: true });
      writeFileSync(attestationPath(t.root, key), "{ nope");
      expect(readCriteriaAttestations(t.root, key).state).toBe("corrupt");
    } finally {
      t.cleanup();
    }
  });

  test("a store file holding a script entry, or naming another subject, is `corrupt`", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      const subject = { kind: "block", id: "b", path: "b" };
      writeFileSync(attestationPath(t.root, key), JSON.stringify({ $schema: "qa-attestations/v1", family: "block-qa", subject, criteria: { c: [script("x")] } }));
      expect(readCriteriaAttestations(t.root, key).state).toBe("corrupt");
      writeFileSync(attestationPath(t.root, key), JSON.stringify({ $schema: "qa-attestations/v1", family: "block-qa", subject: { ...subject, path: "other" }, criteria: {} }));
      expect(readCriteriaAttestations(t.root, key).state).toBe("corrupt");
    } finally {
      t.cleanup();
    }
  });
});

describe("owner ruling 2 — auto-move on first save", () => {
  test("(a) prior holds a judgement, NO store: after the write it is in the store, verbatim", () => {
    const t = instance(false);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      const r = resolvePrior(t.root, key, { criteria: { c: [script("s"), agent("a")] } });
      if (!r.ok) throw new Error(r.reason);
      expect(r.adopt).toBe(true);
      const out = finalizeCriteria(r, { c: [script("s2")] }, "script");
      const back = readCriteriaAttestations(t.root, key);
      expect(back.state).toBe("hit");
      if (back.state === "hit") expect(back.criteria.c!.map(entryIdentity)).toEqual([entryIdentity(agent("a"))]);
      // The derived report's half is composed FROM the store: judgement first.
      expect(out.c!.map(entryIdentity)).toEqual([agent("a"), script("s2")].map(entryIdentity));
    } finally {
      t.cleanup();
    }
  });

  test("(a') store present but no entry for this subject: moved the same way", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      const r = resolvePrior(t.root, key, { criteria: { c: [agent("a")] } });
      if (!r.ok) throw new Error(r.reason);
      expect(r.adopt).toBe(true);
      finalizeCriteria(r, { c: [] }, "script");
      expect(readCriteriaAttestations(t.root, key).state).toBe("hit");
    } finally {
      t.cleanup();
    }
  });

  test("(b) a CORRUPT store file is refused: nothing to write with", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      writeFileSync(attestationPath(t.root, key), "<<<<<<< ours\n");
      const r = resolvePrior(t.root, key, { criteria: { c: [agent("a")] } });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.state).toBe("corrupt");
      expect(readFileSync(attestationPath(t.root, key), "utf-8")).toBe("<<<<<<< ours\n");
    } finally {
      t.cleanup();
    }
  });

  test("(b') a store path that is not a directory is `unknown`, and refused", () => {
    const t = instance(false);
    try {
      mkdirSync(join(t.root, "test"), { recursive: true });
      writeFileSync(join(t.root, "test", "attestations"), "");
      const r = resolvePrior(t.root, blockAttestationKey(t.root, join(t.root, "b")), undefined);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.state).toBe("unknown");
    } finally {
      t.cleanup();
    }
  });

  test("(c) store HIT: the store is the source, and a prior's stale projection does not change it", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      writeCriteriaAttestations(t.root, key, { c: [agent("kept"), agent("added-later")] });
      // The prior carries only the old projection — one of the two.
      const r = resolvePrior(t.root, key, { criteria: { c: [agent("kept"), script("old")] } });
      if (!r.ok) throw new Error(r.reason);
      expect(r.adopt).toBe(false);
      const out = finalizeCriteria(r, { c: [script("new")] }, "script");
      expect(out.c!.map(entryIdentity)).toEqual([agent("kept"), agent("added-later"), script("new")].map(entryIdentity));
    } finally {
      t.cleanup();
    }
  });

  test("(c') store HIT and the prior holds a judgement the store lacks: a conflict, refused, never dropped", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      writeCriteriaAttestations(t.root, key, { c: [agent("kept")] });
      const r = resolvePrior(t.root, key, { criteria: { c: [agent("stray")] } });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.state).toBe("conflict");
    } finally {
      t.cleanup();
    }
  });

  test("an attesting writer's new entry is in the store before the derived report is composed", () => {
    const t = instance(true);
    try {
      const key = translationAttestationKey(t.root, join(t.root, "p"), "fr");
      const r = resolvePrior(t.root, key, undefined);
      if (!r.ok) throw new Error(r.reason);
      finalizeCriteria(r, { c: [agent("new"), script("s")] }, "attesting");
      const back = readCriteriaAttestations(t.root, key);
      expect(back.state).toBe("hit");
      expect(attestationPath(t.root, key).endsWith(join("translation-qa", "p.fr.attestations.json"))).toBe(true);
    } finally {
      t.cleanup();
    }
  });
});

// ── The committed corpus ──────────────────────────────────────────────

/** Every derived report in this instance that carries a judgement. */
function corpus(): { path: string; text: string; doc: { criteria: CriteriaMap } }[] {
  return derivedReports(INSTANCE)
    .map((path) => {
      const text = readFileSync(path, "utf-8");
      return { path, text, doc: JSON.parse(text) as { criteria: CriteriaMap } };
    })
    .filter((f) => Object.keys(splitCriteria(f.doc.criteria).attestations).length > 0);
}

describe("this repository's block and translation judgements (the D2 split, measured)", () => {
  test("the store is the DECLARED one — no marker file decides presence", () => {
    expect(criteriaAttestationsHome(INSTANCE).by).toBe("own");
    expect(existsSync(join(INSTANCE, "test", "attestations", "attestations.store.json"))).toBe(false);
  });

  test("13 judgements in 12 derived files: 11 block-qa, 2 translation-qa, and none missing from the store", () => {
    const r = migrateCriteria(INSTANCE, { check: true });
    expect(r.unreadable).toEqual([]);
    expect(r.entries).toBe(13);
    expect(r.filesWithAttestations).toBe(12);
    expect(r.byFamily).toEqual({ "block-qa": 11, "translation-qa": 2 });
    expect(r.missing).toEqual([]);
  });

  test("every judgement is byte-identical in the store", () => {
    let n = 0;
    for (const f of corpus()) {
      const key = attestationKeyForDerived(INSTANCE, f.path)!;
      const read = readCriteriaAttestations(INSTANCE, key);
      expect(read.state).toBe("hit");
      if (read.state !== "hit") continue;
      for (const [id, list] of Object.entries(splitCriteria(f.doc.criteria).attestations)) {
        expect((read.criteria[id] ?? []).map(entryIdentity)).toEqual(list.map(entryIdentity));
        n += list.length;
      }
    }
    expect(n).toBe(13);
  });

  test("every judgement's TEXT is the same bytes in the derived report and in the store", () => {
    // Both files hold an entry at the same depth (`criteria.<id>[n]`), so its
    // serialised block, escaping included, must occur verbatim in each.
    let n = 0;
    for (const f of corpus()) {
      const key = attestationKeyForDerived(INSTANCE, f.path)!;
      const stored = readFileSync(attestationPath(INSTANCE, key), "utf-8");
      for (const list of Object.values(splitCriteria(f.doc.criteria).attestations)) {
        for (const e of list) {
          const block = jsonText(e, isAsciiEscaped(f.text)).split("\n").join("\n      ");
          expect(f.text).toContain(block);
          expect(stored).toContain(block);
          n++;
        }
      }
    }
    expect(n).toBe(13);
  });

  test("ROUND TRIP: each derived file, recomposed from its script half and the store, is the same bytes", () => {
    const files = corpus();
    expect(files).toHaveLength(12);
    for (const f of files) {
      const read = readCriteriaAttestations(INSTANCE, attestationKeyForDerived(INSTANCE, f.path)!);
      if (read.state !== "hit") throw new Error(`${f.path}: ${read.state}`);
      const { script: s } = splitCriteria(f.doc.criteria);
      const rebuilt = jsonText({ ...f.doc, criteria: composeCriteria(s, read.criteria) }, isAsciiEscaped(f.text)) + "\n";
      expect(rebuilt).toBe(f.text);
    }
  });

  test("ROUND TRIP through ruling 2: with NO store, the first save writes exactly the committed store", () => {
    // A copy of the derived reports and no store at all — what a folio that
    // never migrated looks like. Every subject's first save MOVES its
    // judgements, and the store it builds is the committed one, byte for byte.
    const tmp = mkdtempSync(join(tmpdir(), "qa-attest-corpus-"));
    try {
      for (const fam of ["block-qa", "translation-qa"]) {
        cpSync(join(INSTANCE, "test", "results", fam), join(tmp, "test", "results", fam), { recursive: true });
      }
      let moved = 0;
      for (const f of corpus()) {
        const key = attestationKeyForDerived(INSTANCE, f.path)!;
        const r = resolvePrior(tmp, key, f.doc);
        if (!r.ok) throw new Error(r.reason);
        expect(r.adopt).toBe(true);
        const { script: s } = splitCriteria(f.doc.criteria);
        const out = finalizeCriteria(r, s, "script", { asciiEscape: isAsciiEscaped(f.text) });
        expect(jsonText({ ...f.doc, criteria: out }, isAsciiEscaped(f.text)) + "\n").toBe(f.text);
        expect(readFileSync(attestationPath(tmp, key), "utf-8")).toBe(readFileSync(attestationPath(INSTANCE, key), "utf-8"));
        moved += Object.values(r.attestations).flat().length;
      }
      expect(moved).toBe(13);
      // And the migration, run after, finds nothing left to move.
      const after = migrateCriteria(tmp, { check: true });
      expect(after.alreadyHeld).toBe(13);
      expect(after.missing).toEqual([]);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("the migration is idempotent, and from scratch it writes exactly the committed store", () => {
    const tmp = mkdtempSync(join(tmpdir(), "qa-attest-corpus-"));
    try {
      for (const fam of ["block-qa", "translation-qa"]) {
        cpSync(join(INSTANCE, "test", "results", fam), join(tmp, "test", "results", fam), { recursive: true });
      }
      const first = migrateCriteria(tmp);
      expect(first.added).toBe(13);
      expect(first.storeFilesWritten).toBe(12);
      const second = migrateCriteria(tmp);
      expect(second.added).toBe(0);
      expect(second.storeFilesWritten).toBe(0);
      expect(second.alreadyHeld).toBe(13);
      for (const f of corpus()) {
        const key = attestationKeyForDerived(INSTANCE, f.path)!;
        expect(readFileSync(attestationPath(tmp, key), "utf-8")).toBe(readFileSync(attestationPath(INSTANCE, key), "utf-8"));
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
