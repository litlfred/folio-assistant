/**
 * The attestation store (bean `8wj1`, arc `3fva`, defect C11).
 *
 * Two halves. The unit half pins the four read states, the composition and the
 * refusals. The corpus half runs against THIS repository's committed reports
 * and store, and is what "the 13 agent entries are byte-identical in
 * `test/attestations/`" means as a check rather than a claim.
 */
import { describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  attestationKeyForDerived,
  attestationPath,
  blockAttestationKey,
  composeCriteria,
  entryIdentity,
  finalizeCriteria,
  isAsciiEscaped,
  jsonText,
  readAttestations,
  resolvePrior,
  splitCriteria,
  storeMarkerPath,
  storeState,
  translationAttestationKey,
  writeAttestations,
  type CriteriaMap,
} from "./qa-attestations";
import { derivedReports, migrate } from "../../scripts/qa-attestations-migrate";

const INSTANCE = join(import.meta.dir, "..", "..");

const script = (tag: string) => ({ result: "pass", reviewer: { kind: "script", id: `s-${tag}` }, field_hash: { md: tag } });
const agent = (tag: string) => ({ result: "fail", reviewer: { kind: "agent", id: `a-${tag}` }, notes: tag });

function instance(withStore: boolean): { root: string; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "qa-attest-"));
  if (withStore) writeAttestations(root, blockAttestationKey(root, join(root, "seed")), { c: [agent("seed")] });
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

describe("split and compose", () => {
  test("compose(split(x)) is x when attestations lead, key order included", () => {
    const criteria: CriteriaMap = { a: [agent("1"), script("1")], b: [script("2")], c: [agent("3")] };
    const s = splitCriteria(criteria);
    expect(Object.keys(s.script)).toEqual(["a", "b", "c"]);
    expect(JSON.stringify(composeCriteria(s.script, s.attestations))).toBe(JSON.stringify(criteria));
  });

  test("a malformed entry is kept as an attestation, never dropped as a script one", () => {
    const s = splitCriteria({ a: [{} as never, script("x")] });
    expect(s.attestations.a).toHaveLength(1);
  });
});

describe("read states", () => {
  test("no directory at all is `no-store`, never `miss`", () => {
    const t = instance(false);
    try {
      expect(readAttestations(t.root, blockAttestationKey(t.root, join(t.root, "x"))).state).toBe("no-store");
    } finally {
      t.cleanup();
    }
  });

  test("a store directory without its marker is `unknown`, not empty", () => {
    const t = instance(false);
    try {
      mkdirSync(join(t.root, "test", "attestations"), { recursive: true });
      expect(storeState(t.root).state).toBe("unknown");
      expect(readAttestations(t.root, blockAttestationKey(t.root, join(t.root, "x"))).state).toBe("unknown");
    } finally {
      t.cleanup();
    }
  });

  test("present store, no file for the subject: `miss`; a garbled file: `corrupt`", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "content", "b"));
      expect(readAttestations(t.root, key).state).toBe("miss");
      mkdirSync(join(t.root, "test", "attestations", "block-qa", "content"), { recursive: true });
      writeFileSync(attestationPath(t.root, key), "{ nope");
      expect(readAttestations(t.root, key).state).toBe("corrupt");
    } finally {
      t.cleanup();
    }
  });

  test("a store file holding a script entry is `corrupt`", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      writeFileSync(attestationPath(t.root, key), JSON.stringify({ $schema: "qa-attestations/v1", family: "block-qa", subject: "b", criteria: { c: [script("x")] } }));
      expect(readAttestations(t.root, key).state).toBe("corrupt");
    } finally {
      t.cleanup();
    }
  });
});

describe("resolvePrior — C11", () => {
  test("PRIOR ABSENT, store present: the attestations come from the store", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      writeAttestations(t.root, key, { c: [agent("kept")] });
      const r = resolvePrior(t.root, key, undefined);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const out = finalizeCriteria(r, { c: [script("fresh")], d: [script("d")] }, "script");
      expect(out.c!.map(entryIdentity)).toEqual([agent("kept"), script("fresh")].map(entryIdentity));
    } finally {
      t.cleanup();
    }
  });

  test("a script writer that overwrote the whole array still keeps the attestation", () => {
    const t = instance(true);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      writeAttestations(t.root, key, { c: [agent("kept")] });
      const r = resolvePrior(t.root, key, { criteria: { c: [agent("kept"), script("old")] } });
      if (!r.ok) throw new Error(r.reason);
      expect(finalizeCriteria(r, { c: [script("new")] }, "script").c).toHaveLength(2);
    } finally {
      t.cleanup();
    }
  });

  test("store present, prior carries an attestation the store does not hold: `unmigrated`", () => {
    const t = instance(true);
    try {
      const r = resolvePrior(t.root, blockAttestationKey(t.root, join(t.root, "b")), { criteria: { c: [agent("stray")] } });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.state).toBe("unmigrated");
    } finally {
      t.cleanup();
    }
  });

  test("store unreadable: refused, never a blank prior", () => {
    const t = instance(false);
    try {
      mkdirSync(join(t.root, "test", "attestations"), { recursive: true });
      const r = resolvePrior(t.root, blockAttestationKey(t.root, join(t.root, "b")), undefined);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.state).toBe("unknown");
    } finally {
      t.cleanup();
    }
  });

  test("no store: the prior's attestations are ADOPTED into a new store on save", () => {
    const t = instance(false);
    try {
      const key = blockAttestationKey(t.root, join(t.root, "b"));
      const r = resolvePrior(t.root, key, { criteria: { c: [script("s"), agent("a")] } });
      if (!r.ok) throw new Error(r.reason);
      expect(r.adopt).toBe(true);
      finalizeCriteria(r, { c: [script("s2")] }, "script");
      expect(existsSync(storeMarkerPath(t.root))).toBe(true);
      const back = readAttestations(t.root, key);
      expect(back.state).toBe("hit");
      if (back.state === "hit") expect(back.criteria.c!.map(entryIdentity)).toEqual([entryIdentity(agent("a"))]);
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
      const back = readAttestations(t.root, key);
      expect(back.state).toBe("hit");
      expect(attestationPath(t.root, key).endsWith(join("translation-qa", "p.fr.attestations.json"))).toBe(true);
    } finally {
      t.cleanup();
    }
  });
});

// ── The committed corpus ──────────────────────────────────────────────

/** Every derived report in this instance that carries an attestation. */
function corpus(): { path: string; text: string; doc: { criteria: CriteriaMap } }[] {
  return derivedReports(INSTANCE)
    .map((path) => {
      const text = readFileSync(path, "utf-8");
      return { path, text, doc: JSON.parse(text) as { criteria: CriteriaMap } };
    })
    .filter((f) => Object.keys(splitCriteria(f.doc.criteria).attestations).length > 0);
}

describe("this repository's attestations (the D2 split, measured)", () => {
  test("the store is present — a writer here can never get `no-store`", () => {
    expect(storeState(INSTANCE).state).toBe("present");
  });

  test("13 attestations in 12 derived files: 11 block-qa, 2 translation-qa, and none missing from the store", () => {
    const r = migrate(INSTANCE, { check: true });
    expect(r.unreadable).toEqual([]);
    expect(r.entries).toBe(13);
    expect(r.filesWithAttestations).toBe(12);
    expect(r.byFamily).toEqual({ "block-qa": 11, "translation-qa": 2 });
    expect(r.missing).toEqual([]);
  });

  test("every attestation is byte-identical in the store", () => {
    let n = 0;
    for (const f of corpus()) {
      const key = attestationKeyForDerived(INSTANCE, f.path)!;
      const read = readAttestations(INSTANCE, key);
      expect(read.state).toBe("hit");
      if (read.state !== "hit") continue;
      for (const [id, list] of Object.entries(splitCriteria(f.doc.criteria).attestations)) {
        expect((read.criteria[id] ?? []).map(entryIdentity)).toEqual(list.map(entryIdentity));
        n += list.length;
      }
    }
    expect(n).toBe(13);
  });

  test("every attestation's TEXT is the same bytes in the derived report and in the store", () => {
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
      const read = readAttestations(INSTANCE, attestationKeyForDerived(INSTANCE, f.path)!);
      if (read.state !== "hit") throw new Error(`${f.path}: ${read.state}`);
      const { script } = splitCriteria(f.doc.criteria);
      const rebuilt = jsonText({ ...f.doc, criteria: composeCriteria(script, read.criteria) }, isAsciiEscaped(f.text)) + "\n";
      expect(rebuilt).toBe(f.text);
    }
  });

  test("the migration is idempotent, and from scratch it writes exactly the committed store", () => {
    const tmp = mkdtempSync(join(tmpdir(), "qa-attest-corpus-"));
    try {
      for (const fam of ["block-qa", "translation-qa"]) {
        cpSync(join(INSTANCE, "test", "results", fam), join(tmp, "test", "results", fam), { recursive: true });
      }
      const first = migrate(tmp);
      expect(first.added).toBe(13);
      expect(first.storeFilesWritten).toBe(12);
      const second = migrate(tmp);
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
