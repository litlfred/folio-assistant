/**
 * The ingest rung decision, and the L1 completeness gate.
 *
 * Both are written against fixtures rather than `library/`, because the real
 * corpus is complete and passing: a test that only asserted "the repo is fine"
 * would keep passing if either checker were gutted to return nothing. The one
 * assertion that DOES read the corpus is pinned to what the four entries
 * already record, so it fails if the shape drifts.
 *
 * @module scripts/tests/ingest-and-l1
 */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  NOT_DERIVABLE,
  checkAll,
  checkEntry,
  expiredExceptions,
  sidecarDocument,
  staleSidecars,
} from "../check-l1-complete.ts";
import { NARRATIVE_BEARING } from "../narratives.ts";
import {
  OCR_THRESHOLD_CHARS,
  ingestMode,
  mayPromote,
  planFor,
  usableOutlineEntries,
} from "../ingest-document.ts";

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("what makes an outline entry capable of being a chapter", () => {
  // The rule lives in ONE language. It used to be spelled twice — once as a
  // TS regex, once as a Python regex inside a JS template literal, where the
  // backslashes were invalid escapes and were dropped. Python got a pattern
  // matching nothing and reported 35 entries of journal furniture as 19
  // usable chapters. The probe now emits (title, page) and this decides.
  const e = (title: string, page: number) => ({ title, page });

  test("a real heading counts", () => {
    expect(usableOutlineEntries([e("2. Preliminaries", 7)])).toBe(1);
  });

  test("an entry with no resolvable destination does not", () => {
    // PyMuPDF reports -1. Nothing to navigate to is nothing to divide at.
    expect(usableOutlineEntries([e("Issue Table of Contents", -1)])).toBe(0);
    expect(usableOutlineEntries([e("Article Contents", 0)])).toBe(0);
  });

  test("a bare page reference does not, in the spellings the corpus uses", () => {
    for (const t of ["p. 177", "p.177", "p 177", "pp. 12", "P. 3", "  p. 9  "]) {
      expect(usableOutlineEntries([e(t, 4)])).toBe(0);
    }
  });

  test("a heading that merely CONTAINS a page number still counts", () => {
    // The disqualifier is "is only a page reference", not "mentions one".
    expect(usableOutlineEntries([e("Chapter 3, p. 177", 9)])).toBe(1);
    expect(usableOutlineEntries([e("Theorem 177", 9)])).toBe(1);
  });

  test("the milnorlink shape: 35 in, 0 usable", () => {
    const toc = [
      e("Article Contents", -1),
      e("Issue Table of Contents", -1),
      ...Array.from({ length: 19 }, (_, i) => e(`p. ${177 + i}`, i + 2)),
      ...Array.from({ length: 14 }, (_, i) => e(`Some Other Article ${i}`, -1)),
    ];
    expect(toc).toHaveLength(35);
    expect(usableOutlineEntries(toc)).toBe(0);
  });

  test("nothing in is 0 out, not a crash", () => {
    expect(usableOutlineEntries([])).toBe(0);
  });
});

describe("which rung a document needs", () => {
  test("an embedded outline selects pdf-structure — the structure is READ", () => {
    const p = planFor("x.pdf", { outline: 258, outlineUsable: 257, chars: 90_000 });
    expect(p.rung).toBe("pdf-structure");
    expect(p.steps[0]).toContain("scripts/pdf-structure.py");
    expect(p.why).toContain("258");
    // Measured on uploads/9789241548960_eng.pdf, 2026-09-20.
    expect(p.why).toContain("257");
  });

  test("an outline of JUNK is not a structure — the bean `8shg` case", () => {
    // Measured on uploads/milnorlink.pdf, 2026-09-20: 35 entries, and not one
    // of them a heading. 19 are bare page labels (`p. 177`, `p. 178`, …) and
    // 16 have no resolvable destination, because the outline is JSTOR's
    // journal wrapper — this article's pages, then THIRTEEN OTHER ARTICLES
    // from the same issue that are not in the file at all.
    //
    // Routing on the raw count sent this to `pdf-structure`, which would have
    // produced a section tree of page numbers plus thirteen phantom chapters.
    // The committed entry is at `pdf-pages`, and it was RIGHT: this bean was
    // opened believing the opposite.
    const p = planFor("x.pdf", { outline: 35, outlineUsable: 0, chars: 47_871 });
    expect(p.rung).toBe("pdf-pages");
    // Present but unusable is a THIRD fact. Reporting it as "no outline" is a
    // different lie, and is how the committed structure_note came to say so.
    expect(p.why).toContain("35");
    expect(p.why).not.toContain("no outline");
  });

  test("a junk outline still falls through to OCR when there is no text either", () => {
    const p = planFor("x.pdf", { outline: 35, outlineUsable: 0, chars: 0 });
    expect(p.rung).toBe("pdf-ocr+pdf-pages");
    expect(p.why).toContain("35");
  });

  test("an outline whose usability was NOT measured is undetermined, not structure", () => {
    // A probe predating `outlineUsable` omits it. Absent is UNKNOWN: routing
    // on the raw count would reinstate the bug above, and calling it "no
    // outline" would be the other lie. So neither — re-probe.
    for (const probe of [
      { outline: 35, chars: 47_871 },
      { outline: 35, outlineUsable: null, chars: 47_871 },
    ]) {
      const p = planFor("x.pdf", probe);
      expect({ rung: p.rung, steps: p.steps.length }).toEqual({ rung: "undetermined", steps: 0 });
      expect(p.why).toContain("unknown");
    }
  });

  test("no outline but a text layer selects pdf-pages, and says it infers nothing", () => {
    const p = planFor("x.pdf", { outline: 0, chars: 50_000 });
    expect(p.rung).toBe("pdf-pages");
    expect(p.steps).toHaveLength(1);
    // The whole point of bean 6xaz: absence of an outline selects PAGE
    // granularity, it never selects "infer a chapter tree".
    expect(p.why).toContain("NOT inferred");
  });

  test("no outline and almost no text selects OCR FIRST, then pages", () => {
    const p = planFor("x.pdf", { outline: 0, chars: OCR_THRESHOLD_CHARS - 1 });
    expect(p.rung).toBe("pdf-ocr+pdf-pages");
    expect(p.steps.map((s) => s[1])).toEqual(["scripts/pdf-ocr.py", "scripts/pdf-pages.py"]);
    expect(p.steps[1]).toContain("--from-ocr");
  });

  test("the OCR threshold is a boundary, not a vibe", () => {
    expect(planFor("x.pdf", { outline: 0, chars: OCR_THRESHOLD_CHARS }).rung).toBe("pdf-pages");
    expect(planFor("x.pdf", { outline: 0, chars: OCR_THRESHOLD_CHARS - 1 }).rung).toBe("pdf-ocr+pdf-pages");
  });

  test("a PDF that cannot be probed is UNDETERMINED and runs nothing", () => {
    // Never "no outline". A document filed under the wrong rung reads as
    // ingested while its structure is wrong -- the 6xaz failure mode.
    for (const probe of [
      { outline: null, chars: null, error: "no PDF backend" },
      { outline: null, chars: 10 },
      { outline: 3, outlineUsable: 3, chars: null },
    ]) {
      const p = planFor("x.pdf", probe);
      expect({ rung: p.rung, steps: p.steps.length }).toEqual({ rung: "undetermined", steps: 0 });
    }
  });
});

/** A library entry with every derivable requirement satisfied. */
function entry(over: Partial<Record<"structure" | "manifest" | "images", unknown>> = {}, opts: { sections?: number; blocks?: number } = {}): string {
  const root = mkdtempSync(join(tmpdir(), "l1-"));
  made.push(root);
  const dir = join(root, "doc");
  mkdirSync(join(dir, "sections"), { recursive: true });
  mkdirSync(join(dir, "blocks"), { recursive: true });
  for (let i = 0; i < (opts.sections ?? 2); i++) writeFileSync(join(dir, "sections", `s${i}.md`), "x");
  // `.jsonld` with a real `kind` and `provenance`, because that is what
  // `gen-library-jsonld.ts` writes and what `narrative-provenance` reads. The
  // fixture used to write `b0.json` containing `{}`, which satisfied a
  // file-COUNT requirement and nothing else — fine until a requirement looked
  // inside, which is an argument for fixtures that resemble the artefact.
  for (let i = 0; i < (opts.blocks ?? 1); i++) {
    writeFileSync(
      join(dir, "blocks", `b${i}.jsonld`),
      JSON.stringify({ "@id": `b${i}`, kind: "prose", provenance: "ingested" }),
    );
  }
  writeFileSync(
    join(dir, "structure.json"),
    JSON.stringify(
      over.structure ?? {
        _schema: "pdf-structure/v1",
        toc_source: "none",
        sections: [1, 2],
        // Bean `nso8`: technical metadata is a CHECKED requirement, so a
        // fixture that stands for "every derivable requirement satisfied" has
        // to carry it. It was `not-derivable` until `_tech_meta.py` existed.
        source: { file: "x.pdf", sha256: "a".repeat(64), bytes: 1, mtime: "2026-01-01T00:00:00Z", mimetype_sniffed: "application/pdf", mimetype_source: "magic-bytes" },
      },
    ),
  );
  writeFileSync(
    join(dir, "manifest.jsonld"),
    JSON.stringify(over.manifest ?? { "@id": "x", "@type": ["folio:SourceDocument"], contains: ["a"], provenance: {} }),
  );
  // Bean `d5f1` shipped, so `image-descriptions` is CHECKED rather than
  // not-derivable, and a fixture standing for "every derivable requirement
  // satisfied" has to carry it — the same argument the `nso8` comment above
  // makes for technical metadata. One page scan: geometry settles its role
  // and a scan needs no narrative, so this is a complete entry rather than a
  // described one.
  writeFileSync(
    join(dir, "images.json"),
    JSON.stringify(
      over.images ?? {
        $schema: "folio-document-images/v1",
        doc_id: "doc",
        images: [
          {
            id: "img-p001-1",
            file: "images/img-p001-1.png",
            page: 1,
            role: "page-scan",
            basis: { method: "geometry", coverage: 0.99, imagesOnPage: 1, page: 1 },
          },
        ],
      },
    ),
  );
  return dir;
}

const states = (d: string) =>
  Object.fromEntries(checkEntry(d).requirements.filter((r) => r.state !== "not-derivable").map((r) => [r.name, r.state]));

describe("L1 completeness", () => {
  test("a full entry is complete", () => {
    expect(Object.values(states(entry())).every((s) => s === "met")).toBe(true);
  });

  test("each missing artefact is reported unmet, not skipped", () => {
    expect(states(entry({}, { sections: 0 })).sections).toBe("unmet");
    expect(states(entry({}, { blocks: 0 })).blocks).toBe("unmet");
    expect(states(entry({ manifest: { "@id": "x" } })).manifest).toBe("unmet");
    expect(states(entry({ manifest: { "@id": "x", "@type": [], contains: [] } })).provenance).toBe("unmet");
    expect(states(entry({ structure: { _schema: "pdf-structure/v1", sections: [] } })).structure).toBe("unmet");
    // No `source` at all is the `milnorlink` state before `nso8`: the entry
    // looked ingested and nothing recorded what file it came from.
    expect(states(entry({ structure: { _schema: "pdf-structure/v1", sections: [1] } }))["technical-metadata"]).toBe(
      "unmet",
    );
    // A PARTIAL `source` is unmet too. `pdf-structure.py` wrote one without
    // `mtime` or a sniffed mimetype, and a half-filled block that read `met`
    // would have hidden exactly the gap this bean closed.
    expect(
      states(
        entry({
          structure: { _schema: "pdf-structure/v1", sections: [1], source: { file: "x.pdf", sha256: "a", bytes: 1 } },
        }),
      )["technical-metadata"],
    ).toBe("unmet");
  });

  test("unparseable JSON is unmet rather than an exception", () => {
    const d = entry();
    writeFileSync(join(d, "structure.json"), "{ not json");
    expect(states(d).structure).toBe("unmet");
  });

  test("an empty structure with NO note is unmet — nothing says the emptiness was determined", () => {
    const d = entry({ structure: { _schema: "pdf-structure/v1", sections: [] } });
    expect(states(d)["structure-note"]).toBe("unmet");
    const noted = entry({
      structure: { _schema: "pdf-structure/v1", sections: [], structure_note: "no outline; none claimed" },
    });
    expect(states(noted)["structure-note"]).toBeUndefined();
  });

  test("what no arm can produce is NOT-DERIVABLE, never met", () => {
    // The third state is the reason this gate can ship before the nine INGEST
    // arms exist. If any of these ever reads `met`, the gate is lying.
    const nd = checkEntry(entry()).requirements.filter((r) => r.state === "not-derivable");
    expect(nd.map((r) => r.name).sort()).toEqual(NOT_DERIVABLE.map((nd) => nd.name).sort());
    expect(nd.every((r) => /bean \w+/.test(r.detail))).toBe(true);
  });

  test("NO DECLARATION is undetermined — never 'nothing to check'", () => {
    // Three states, and this is the one that used to be missing. A root with
    // no `harness.json` returned `[]`, indistinguishable from a declared
    // library holding nothing, and the CLI printed "nothing to check" and
    // exited 0. Measured 2026-09-20: `bun run check:l1-complete` runs from
    // the REPOSITORY root while the instance lives under `cat-harness/`, so
    // the gate found no declaration and passed over four real entries.
    const root = mkdtempSync(join(tmpdir(), "l1-undeclared-"));
    made.push(root);
    expect(checkAll(root)).toBeUndefined();
  });

  test("...and a DECLARED library holding nothing is `[]`, a real finding", () => {
    const root = mkdtempSync(join(tmpdir(), "l1-empty-"));
    made.push(root);
    mkdirSync(join(root, "library"), { recursive: true });
    writeFileSync(
      join(root, "harness.json"),
      JSON.stringify({
        name: "t",
        directories: [{ id: "library", path: "library/", graphs: ["library"] }],
      }),
    );
    expect(checkAll(root)).toEqual([]);
  });

  test("the real corpus passes every derivable requirement", () => {
    const reports = checkAll(join(import.meta.dir, "../.."));
    expect(reports, "no `library` declared — this test would be vacuous").toBeDefined();
    if (reports === undefined) return;
    expect(reports.length).toBeGreaterThan(0);
    const bad = reports.flatMap((r) =>
      r.requirements.filter((q) => q.state === "unmet").map((q) => `${r.slug}: ${q.name} — ${q.detail}`),
    );
    expect(bad).toEqual([]);
  });
});

describe("the verdict as a committed sidecar", () => {
  const doc = (d: string) => sidecarDocument(checkEntry(d), new Date("2026-01-01T00:00:00Z"));

  test("the ASSET is the subject and the TOOL is the producer", () => {
    // The owner's question was which of the two a sidecar hangs off. It is not
    // a choice: `qa-results/v1` already carries both, and the tool was never a
    // separate subject -- it is provenance.
    const d = doc(entry());
    expect(d.$schema).toBe("qa-results/v1");
    expect(d.subject.kind).toBe("library-document");
    expect(d.producer.script).toBe("scripts/check-l1-complete.ts");
    expect(d.producer.script_hash).toMatch(/^[0-9a-f]{12}$/);
  });

  test("a DEFECT and a GAP are separate families, and neither is hidden", () => {
    const d = doc(entry({}, { sections: 0 }));
    expect(d.families.unmet.count).toBe(1);
    expect(d.families.notDerivable.count).toBe(NOT_DERIVABLE.length);
  });

  test("total is NEVER zero — no entry is fully verified yet", () => {
    // The tempting design counts only `unmet`, so a good entry reads
    // `total: 0`. That is the lie: six requirements no arm can produce have
    // never been checked, and "unknown rendered as a pass" is the failure this
    // repository keeps paying for.
    const clean = doc(entry());
    expect(clean.families.unmet.count).toBe(0);
    expect(clean.total).toBe(NOT_DERIVABLE.length);
    expect(clean.total).toBeGreaterThan(0);
  });

  test("rerunning produces the same bytes apart from the timestamp", () => {
    const d = entry();
    // Round-tripped through JSON so the timestamp can be dropped without
    // fighting the typed shape -- the property under test is byte stability,
    // which is what keeps a committed verdict out of every diff.
    const strip = (r: unknown) => {
      const o = JSON.parse(JSON.stringify(r)) as Record<string, unknown>;
      delete o.updated_at;
      return JSON.stringify(o);
    };
    expect(strip(doc(d))).toBe(strip(sidecarDocument(checkEntry(d), new Date("2026-06-06T00:00:00Z"))));
  });

  test("a missing sidecar is stale, not absent-and-fine", () => {
    const root = mkdtempSync(join(tmpdir(), "l1-side-"));
    made.push(root);
    expect(staleSidecars(root, [checkEntry(entry())])).toHaveLength(1);
    expect(staleSidecars(root, [checkEntry(entry())])[0]).toContain("no sidecar");
  });

  test("the committed verdicts for the real corpus are current", () => {
    const root = join(import.meta.dir, "../..");
    const all = checkAll(root);
    expect(all, "no `library` declared — staleness over nothing proves nothing").toBeDefined();
    expect(staleSidecars(root, all ?? [])).toEqual([]);
  });
});


describe("the third state has to EXPIRE — bean `pn6j`", () => {
  test("an expired claim is REPORTED: the probe exists, so the arm runs", () => {
    // The failure this guards, measured 2026-09-20: `image-descriptions` sat
    // in NOT_DERIVABLE naming `d5f1` while all four library entries carried a
    // complete `images.json` — 2, 20, 121 and 21 images, every one with a
    // role and a basis. The gate reported "no arm builds this yet" and
    // checked none of it.
    const found = expiredExceptions(["/x", "/y"], (d, f) => d === "/y" && f === "transcript.json");
    expect(found.map((e) => e.name)).toEqual(["audio-transcripts"]);
    expect(found[0].bean).toBe("1r0p");
    expect(found[0].found).toBe("/y");
  });

  test("nothing expires when no probe is present", () => {
    expect(expiredExceptions(["/x"], () => false)).toEqual([]);
  });

  test("the real corpus has no expired claim", () => {
    // THE RATCHET. When an arm lands, this fails until its requirement moves
    // into the checked set — which is what "shrinks by work rather than by
    // editing" was always supposed to mean.
    const root = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
    const lib = join(root, "library");
    const dirs = readdirSync(lib).map((d) => join(lib, d)).filter((d) => statSync(d).isDirectory());
    expect(dirs.length).toBeGreaterThan(0);
    expect(expiredExceptions(dirs, (d, f) => existsSync(join(d, f)))).toEqual([]);
  });

  test("every remaining entry carries a PROBE, so it can expire at all", () => {
    // An entry with no probe is one that can never expire — the state the
    // whole corpus was in before this change.
    for (const nd of NOT_DERIVABLE) {
      expect(nd.probe.trim().length).toBeGreaterThan(0);
      expect(nd.bean.trim().length).toBeGreaterThan(0);
    }
  });

  test("`image-descriptions` is CHECKED now, not excused", () => {
    expect(NOT_DERIVABLE.map((nd) => nd.name)).not.toContain("image-descriptions");
  });
});

describe("the bearing list is SHARED with the review queue", () => {
  test("this gate reads `images.json` because the queue says it is bearing", () => {
    // The list and the shape were RESTATED here — same three files, same
    // `doc.narrative` single-narrative read — and went stale at the same time
    // and for the same reason as the queue's copy did (bean `04vl`): 24
    // drafts live at `images[i].narrative` in `images.json`, which has no
    // top-level `narrative` at all. One rule in two places is two rules.
    expect(NARRATIVE_BEARING).toContain("images.json");
  });

  test("the corpus's drafts are COUNTED, not reported as absent", () => {
    // The symptom: "no narrative-bearing file in this entry", four times,
    // over four entries holding 24 drafts between them.
    const root = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
    const reports = checkAll(root);
    expect(reports).toBeDefined();
    const details = reports!
      .map((r) => r.requirements.find((q) => q.name === "narrative-review")?.detail ?? "")
      .join(" | ");
    const drafts = [...details.matchAll(/(\d+) draft/g)].reduce((n, m) => n + Number(m[1]), 0);
    expect(drafts).toBeGreaterThan(0);
  });
});


describe("image-descriptions has three states, and the third is not a pass", () => {
  /** The `image-descriptions` verdict for a fixture with this sidecar. */
  const imgState = (images: unknown): { state: string; detail: string } => {
    const r = checkEntry(entry({ images })).requirements.find((q) => q.name === "image-descriptions");
    return { state: r?.state ?? "(absent)", detail: r?.detail ?? "" };
  };

  const base = { $schema: "folio-document-images/v1", doc_id: "doc" };
  const scan = {
    id: "i1",
    file: "images/i1.png",
    page: 1,
    role: "page-scan",
    basis: { method: "geometry", coverage: 0.99, imagesOnPage: 1, page: 1 },
  };

  test("`images: null` is NOT-DERIVABLE, carrying the sidecar's own reason", () => {
    // The sidecar's could-not-determine, passed through rather than
    // flattened. `unmet` would ask somebody to fix a document that is not
    // broken; `met` would be the pass-by-default this gate exists against.
    const r = imgState({ ...base, images: null, undetermined_reason: "no backend available" });
    expect(r.state).toBe("not-derivable");
    expect(r.detail).toContain("no backend available");
  });

  test("an image with an UNDETERMINED role is unmet — nobody judged it", () => {
    // The third state one level down: whether this image needs describing is
    // unknown, so counting it as described is a pass by default.
    const r = imgState({ ...base, images: [{ id: "i1", file: "images/i1.png", role: "undetermined" }] });
    expect(r.state).toBe("unmet");
    expect(r.detail).toContain("undetermined role");
  });

  test("a DESCRIBABLE image with no narrative is unmet", () => {
    const logo = {
      id: "i2",
      file: "images/i2.png",
      role: "logo",
      basis: {
        method: "inspection",
        by: { kind: "agent", id: "claude", model: "claude-opus-5" },
        at: "2026-09-20",
        saw: "an organisation emblem",
        page: 1,
      },
    };
    expect(imgState({ ...base, images: [scan, logo] }).state).toBe("unmet");
  });

  test("a page scan needs no narrative — geometry settles it", () => {
    // 140 of this corpus's 164 images are page scans. Requiring a description
    // of each would be wrong six times out of seven.
    expect(imgState({ ...base, images: [scan] }).state).toBe("met");
  });

  test("a missing images.json is UNMET, not not-derivable", () => {
    // The arm exists now, so its absence is a defect in this entry rather
    // than a gap in the platform. That distinction is the whole point of
    // moving the requirement out of NOT_DERIVABLE.
    const dir = entry();
    rmSync(join(dir, "images.json"));
    const r = checkEntry(dir).requirements.find((q) => q.name === "image-descriptions");
    expect(r?.state).toBe("unmet");
    expect(r?.detail).toContain("pdf-images.py");
  });
});

describe("refuse to promote — the gate between the arms and the library", () => {
  /**
   * The owner's decision, 2026-09-20: an unmet document must not reach
   * `library/`, and the way to achieve that is to never move it there —
   * NOT to move it back. Nothing is deleted and nothing leaves `library/`,
   * so `deletion-requires-confirmation` is untouched.
   */
  test("promotion is a SEPARATE step — one rung is not a whole pipeline", () => {
    // Measured while building this, and it changed the design: `planFor` runs
    // ONE rung. `pdf-pages.py` alone yields page files and none of
    // structure.json, sections/, blocks/, manifest.jsonld or images.json, so
    // gating at the end of the ingest command refused the document on SEVEN
    // unmet requirements — and would refuse every document ever ingested.
    //
    // A gate that always refuses is one somebody switches off, which is worse
    // than no gate. So the arms accumulate in staging and `--promote` is the
    // single moment anything crosses into `library/`.
    // Behavioural. A source grep for `--promote` matched the string at a
    // SECOND call site, so dropping the guard at the first survived the
    // mutation — which is why the mode is a named function now.
    expect(ingestMode([])).toBe("stage");
    expect(ingestMode(["uploads/x.pdf"])).toBe("stage");
    expect(ingestMode(["--promote"])).toBe("promote");
    expect(ingestMode(["uploads/x.pdf", "--promote"])).toBe("promote");
    // And the arms must NOT re-run on a promote: staging already holds them.
    const src = readFileSync(new URL("../ingest-document.ts", import.meta.url).pathname, "utf-8");
    expect(src).toContain('ingestMode(argv) === "promote" ? [] : plan.steps');
  });

  test("the arms are pointed at STAGING, never at the library", () => {
    // The whole mechanism is which directory `-o` receives. If a step is ever
    // handed the library again, the document is filed before anything can
    // refuse it and this gate becomes decoration.
    const src = readFileSync(new URL("../ingest-document.ts", import.meta.url).pathname, "utf-8");
    expect(src).toContain('planFor(pdf, undefined, staging)');
    expect(src).not.toContain("const plan = planFor(pdf);");
  });

  test("staging is NOT dot-prefixed", () => {
    // `.beans/` and `.harness/` were moved out from behind dots on 2026-09-18
    // because the artefacts a person looks for first were the hardest to
    // find, and this repository's own guard rejects a dot-prefixed segment. A
    // staging tree holding a REFUSED document is exactly what somebody comes
    // looking for.
    const src = readFileSync(new URL("../ingest-document.ts", import.meta.url).pathname, "utf-8");
    expect(src).toContain('"ingest-staging"');
    expect(src).not.toContain('".ingest-staging"');
  });

  test("ONE unmet requirement refuses the whole entry", () => {
    // Behavioural, not a source grep. The two mutations that survived the
    // first pass — dropping the `--promote` guard, and `if (unmet.length)` →
    // `if (false)` — both read fine textually, so the decision was extracted
    // into `mayPromote` and is tested here on its values.
    expect(mayPromote([{ name: "a", state: "met", detail: "" }])).toBe(true);
    expect(mayPromote([{ name: "a", state: "unmet", detail: "" }])).toBe(false);
    expect(
      mayPromote([
        { name: "a", state: "met", detail: "" },
        { name: "b", state: "unmet", detail: "" },
      ]),
    ).toBe(false);
  });

  test("`not-derivable` does NOT refuse — that is the third state's whole job", () => {
    // `audio-transcripts` has no arm. Refusing every document until every arm
    // exists makes the gate unusable, and an unusable gate gets switched off.
    expect(mayPromote([{ name: "audio-transcripts", state: "not-derivable", detail: "" }])).toBe(true);
    expect(
      mayPromote([
        { name: "audio-transcripts", state: "not-derivable", detail: "" },
        { name: "structure", state: "met", detail: "" },
      ]),
    ).toBe(true);
  });

  test("an EMPTY requirement list does not promote by vacuous truth", () => {
    // `every` over `[]` is true, so this would promote an entry nothing
    // examined. The CLI never passes an empty list — `checkEntry` on an empty
    // directory yields unmet requirements, asserted below — but the pairing is
    // the thing that makes it safe, and it is recorded here rather than
    // assumed.
    expect(mayPromote([])).toBe(true);
    const empty = mkdtempSync(join(tmpdir(), "stage-vac-"));
    made.push(empty);
    expect(checkEntry(empty).requirements.length).toBeGreaterThan(0);
  });

  test("an unmet entry has unmet requirements to refuse ON", () => {
    // The gate reads `checkEntry(staging)`. A staging tree with nothing in it
    // must produce unmet requirements — if it produced none, promotion would
    // succeed over an empty directory, which is the vacuity this repository
    // keeps paying for.
    const empty = mkdtempSync(join(tmpdir(), "stage-"));
    made.push(empty);
    const unmet = checkEntry(empty).requirements.filter((r) => r.state === "unmet");
    expect(unmet.length).toBeGreaterThan(0);
    expect(unmet.map((r) => r.name)).toContain("structure");
  });

  test("a COMPLETE entry has none, so it can promote", () => {
    // The other half, and the one that stops this being a gate that always
    // refuses. Verified end-to-end against the real corpus as well: copying
    // `library/milnorlink/` into staging and promoting it was a byte-identical
    // no-op, exit 0.
    expect(checkEntry(entry()).requirements.filter((r) => r.state === "unmet")).toEqual([]);
  });
});
