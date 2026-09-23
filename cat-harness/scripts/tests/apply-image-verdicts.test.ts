/**
 * `runStaging` — applying a judgement to a document that is not in a library
 * yet. Bean `8suc`.
 *
 * The cycle it breaks: `ingest --promote` refuses an entry whose
 * `image-descriptions` requirement is unmet, and until 2026-09-23 both writers
 * of a narrative resolved their targets through
 * `directoriesForGraph(root, "library")`. So a document with describable
 * images could not be promoted without descriptions and could not be given
 * descriptions without being promoted.
 *
 * What these tests are mostly about is the EXIT CODE, because staging mode
 * inverts the whole-corpus rule deliberately. There, finding no verdicts at
 * all is an error — a completed pass over no work. Here it is the expected
 * state of every first ingest, since nobody has looked at the images yet, and
 * an exit 1 would make the fourth arm fail on every new document. Getting that
 * backwards would not look like a bug; it would look like ingestion being
 * broken for everything.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runStaging } from "../apply-image-verdicts.ts";

const BY = { kind: "agent", id: "claude", model: "claude-opus-5" };

/** A sidecar as `pdf-images.py` leaves it: geometry only, nothing described. */
function sidecar(docId: string) {
  return {
    $schema: "folio-document-images/v1",
    doc_id: docId,
    images: [
      {
        id: "img-p003-1",
        file: "images/img-p003-1.png",
        role: "figure",
        basis: { method: "geometry", coverage: 0.0004, imagesOnPage: 1, page: 3 },
        narrative: { text: null, state: "not-authored" },
      },
    ],
  };
}

/** A staged entry plus the library beside it, both empty of judgements. */
function fixture(docId = "arxiv-test-1") {
  const root = mkdtempSync(join(tmpdir(), "8suc-"));
  const entry = join(root, "staging", docId);
  const lib = join(root, "library");
  mkdirSync(entry, { recursive: true });
  mkdirSync(lib, { recursive: true });
  writeFileSync(join(entry, "images.json"), JSON.stringify(sidecar(docId), null, 2) + "\n");
  return { root, entry, lib, docId, path: join(entry, "images.json") };
}

function writeVerdicts(lib: string, verdicts: Record<string, unknown>) {
  writeFileSync(
    join(lib, "image-verdicts.json"),
    JSON.stringify({ inspected_by: BY, inspected_at: "2026-09-23", verdicts }, null, 2) + "\n",
  );
}

const LOGO = {
  role: "logo",
  saw: "the OpenHands mark beside its label",
  draft: "OpenHands' logo: two raised yellow hands.",
};

describe("runStaging — the exit code is the point", () => {
  test("NO verdicts file at all is exit 0, not an error", () => {
    // Every FIRST ingest is this case: the arm runs before anybody has looked
    // at the images. The whole-corpus mode exits 1 here on purpose; copying
    // that rule across would fail ingestion for every new document, which is
    // why the two runners are separate bodies rather than one with a flag.
    const f = fixture();
    const before = readFileSync(f.path, "utf-8");
    expect(runStaging(f.entry, f.lib, false)).toBe(0);
    expect(readFileSync(f.path, "utf-8")).toBe(before);
  });

  test("a verdicts file with nothing for THIS document is exit 0", () => {
    // The library already judges other documents; this one has not been looked
    // at. Distinct from the case above and reached by a different branch, so
    // it is asserted rather than assumed to follow.
    const f = fixture();
    writeVerdicts(f.lib, { "some-other-doc": { "img-p001-1": LOGO } });
    const before = readFileSync(f.path, "utf-8");
    expect(runStaging(f.entry, f.lib, false)).toBe(0);
    expect(readFileSync(f.path, "utf-8")).toBe(before);
  });

  test("an ORPHANED verdict IS an error, and writes nothing", () => {
    // A verdict naming an image the sidecar does not have is a wrong verdicts
    // file, not a missing judgement — the one case staging mode must still
    // refuse. Writing the rest first and reporting afterwards would leave a
    // half-applied sidecar behind a non-zero exit.
    const f = fixture();
    writeVerdicts(f.lib, { [f.docId]: { "img-p999-9": LOGO } });
    const before = readFileSync(f.path, "utf-8");
    expect(runStaging(f.entry, f.lib, false)).toBe(1);
    expect(readFileSync(f.path, "utf-8")).toBe(before);
  });

  test("a missing images.json is an error — an arm did not run", () => {
    // Not the absent-verdicts case: `pdf-images.py` writes this sidecar before
    // the verdict arm ever runs, so its absence means the pipeline is broken
    // rather than the judgement merely absent.
    const f = fixture();
    expect(runStaging(join(f.root, "staging", "no-such-doc"), f.lib, false)).toBe(1);
  });
});

describe("runStaging — what it writes", () => {
  test("applies the verdict, and the narrative lands as a DRAFT", () => {
    // Only a human may confirm one (`schemas/narrative.ts`). A script that
    // could emit `confirmed` would make an agent's description
    // indistinguishable from an accepted one.
    const f = fixture();
    writeVerdicts(f.lib, { [f.docId]: { "img-p003-1": LOGO } });
    expect(runStaging(f.entry, f.lib, false)).toBe(0);

    const out = JSON.parse(readFileSync(f.path, "utf-8"));
    expect(out.images[0].role).toBe("logo");
    expect(out.images[0].basis.method).toBe("inspection");
    expect(out.images[0].narrative.state).toBe("draft");
    expect(out.images[0].narrative.text).toBe(LOGO.draft);
  });

  test("the geometry basis is REPLACED by an inspection basis", () => {
    // `logo` cannot sit on a geometry basis at all — the schema refuses it,
    // because no measurement of a placed rectangle distinguishes a mark from a
    // chart. So this is not cosmetic: leaving the basis alone would produce a
    // sidecar that fails its own validation on the way out.
    const f = fixture();
    writeVerdicts(f.lib, { [f.docId]: { "img-p003-1": LOGO } });
    runStaging(f.entry, f.lib, false);

    const out = JSON.parse(readFileSync(f.path, "utf-8"));
    expect(out.images[0].basis.coverage).toBeUndefined();
    expect(out.images[0].basis.saw).toBe(LOGO.saw);
    expect(out.images[0].basis.by).toEqual(BY);
    expect(out.images[0].basis.at).toBe("2026-09-23");
  });

  test("--check reports without writing", () => {
    const f = fixture();
    writeVerdicts(f.lib, { [f.docId]: { "img-p003-1": LOGO } });
    const before = readFileSync(f.path, "utf-8");
    expect(runStaging(f.entry, f.lib, true)).toBe(0);
    expect(readFileSync(f.path, "utf-8")).toBe(before);
  });

  test("applying twice is idempotent — which is what makes a re-run safe", () => {
    // `pdf-images.py` rewrites the sidecar from scratch on every ingest, so
    // the fourth arm runs again over a freshly-geometric file each time. If
    // the second application differed from the first, a re-run would drift the
    // corpus without anybody touching a verdict.
    const f = fixture();
    writeVerdicts(f.lib, { [f.docId]: { "img-p003-1": LOGO } });
    runStaging(f.entry, f.lib, false);
    const once = readFileSync(f.path, "utf-8");
    runStaging(f.entry, f.lib, false);
    expect(readFileSync(f.path, "utf-8")).toBe(once);
  });
});
