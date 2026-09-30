/**
 * A source RECORDED, not held — bean `scfh`, issue #1614.
 *
 * The OMG BPMN and DMN licences forbid posting copies on a network, so their
 * library entries identify the exact PDF and its outline and hold no text. The
 * assertion that matters most is the last: an entry of this kind that DOES
 * carry section text is refused, because that is the copy the kind exists not
 * to make.
 *
 * @module scripts/tests/referenced-source
 */
import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { ReferencedSourceSchema } from "../../schemas/referenced-source.ts";
import { checkEntry, entryKind } from "../check-l1-complete.ts";

const SCRIPT = resolve(import.meta.dir, "../referenced-source.py");
const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

function staged(): string {
  const d = mkdtempSync(join(tmpdir(), "ref-"));
  made.push(d);
  const pdf = join(d, "spec.pdf");
  // A two-page PDF with an embedded outline, written by PyMuPDF.
  const py = [
    "import sys",
    "import pymupdf",
    "doc = pymupdf.open()",
    "for t in ('Scope', 'Conformance'):\n    doc.new_page().insert_text((72, 72), t)",
    "doc.set_toc([[1, 'Scope', 1], [1, 'Conformance', 2]])",
    "doc.save(sys.argv[1])",
  ].join("\n");
  const r = Bun.spawnSync(["python3", "-c", py, pdf]);
  if (r.exitCode !== 0) throw new Error(new TextDecoder().decode(r.stderr));
  const ident = join(d, "id.json");
  writeFileSync(
    ident,
    JSON.stringify({
      title: "Example Spec", version: "1.0", document_number: "formal/00-00-00", date: "2026-01",
      publisher: "Example Org", url: "https://example.org/spec/", withheld: "licence forbids posting copies",
    }),
  );
  const out = join(d, "lib");
  const w = Bun.spawnSync(["python3", SCRIPT, "-o", out, pdf, "--identity", ident]);
  if (w.exitCode !== 0) throw new Error(new TextDecoder().decode(w.stderr));
  const entry = join(out, "spec");
  const g = Bun.spawnSync(["bun", "run", resolve(import.meta.dir, "../../content/pipeline/gen-library-jsonld.ts"), "--entry", entry]);
  if (g.exitCode !== 0) throw new Error(new TextDecoder().decode(g.stderr));
  return entry;
}

test("the record validates, carries the outline, and the entry passes with no text", () => {
  const e = staged();
  const rec = ReferencedSourceSchema.parse(JSON.parse(readFileSync(join(e, "referenced.json"), "utf-8")));
  expect(rec.outline.map((o) => o.title)).toEqual(["Scope", "Conformance"]);
  expect(rec.materialization.state).toBe("referenced");
  const manifest = JSON.parse(readFileSync(join(e, "manifest.jsonld"), "utf-8"));
  expect(manifest.contains).toEqual([]);
  const r = checkEntry(e);
  expect(entryKind((f) => f === "referenced.json")).toBe("referenced");
  expect(r.requirements.filter((q) => q.state === "unmet")).toEqual([]);
});

test("an identity missing a field is refused, never guessed", () => {
  const d = mkdtempSync(join(tmpdir(), "ref-"));
  made.push(d);
  writeFileSync(join(d, "id.json"), JSON.stringify({ title: "x" }));
  writeFileSync(join(d, "a.pdf"), "%PDF-1.4\n");
  const w = Bun.spawnSync(["python3", SCRIPT, "-o", d, join(d, "a.pdf"), "--identity", join(d, "id.json")]);
  expect(w.exitCode).toBe(1);
  expect(new TextDecoder().decode(w.stderr)).toContain("never guess");
});

test("a referenced entry that holds section text is REFUSED", () => {
  const e = staged();
  mkdirSync(join(e, "sections"));
  writeFileSync(join(e, "sections", "s1.md"), "copied clause text\n");
  const req = checkEntry(e).requirements.find((q) => q.name === "referenced-record");
  expect(req?.state).toBe("unmet");
  expect(req?.detail).toContain("sections/");
});
