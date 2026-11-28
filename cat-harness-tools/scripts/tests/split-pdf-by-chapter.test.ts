/**
 * `split-pdf-by-chapter.py` on a folio laid out as qou is (owner, 2026-11-28,
 * qou site audit gap 3: the README links per-chapter PDFs, a glossary and the
 * appendices, and nothing built them). The script used to read the manifest
 * and the chapter titles from `content/` beside ITSELF, so from any folio it
 * found no manifest; it now reads the folio checkout (`--repo`, default the
 * current directory), `content/` or `folio/`, splits the appendices when
 * main.pdf carries them, and splits outline entries that are not chapters
 * (`--extra`).
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve(import.meta.dir, "..", "split-pdf-by-chapter.py");
const havePypdf = spawnSync("python3", ["-c", "import pypdf"]).status === 0;

/** A PDF of `pages` blank pages with one top-level outline entry per [title, page]. */
function fixturePdf(path: string, pages: number, outline: [string, number][]): void {
  const py = [
    "import sys, json",
    "from pypdf import PdfWriter",
    "w = PdfWriter()",
    `for _ in range(${pages}): w.add_blank_page(width=200, height=200)`,
    `for t, p in json.loads(sys.argv[2]): w.add_outline_item(t, p)`,
    "w.write(sys.argv[1])",
  ].join("\n");
  const r = spawnSync("python3", ["-c", py, path, JSON.stringify(outline)], { encoding: "utf-8" });
  if (r.status !== 0) throw new Error(r.stderr);
}

function folio(): string {
  const repo = mkdtempSync(join(tmpdir(), "split-folio-"));
  const paper = join(repo, "folio", "p");
  const chapter = (dir: string, title: string) => {
    mkdirSync(join(paper, dir), { recursive: true });
    writeFileSync(join(paper, dir, `${dir}.ts`), `export default chapter({ title: "${title}" });\n`);
  };
  chapter("intro", "Introduction");
  chapter("braids", "Braids and Knots");
  chapter("appendix-tables", "Reference Tables");
  writeFileSync(
    join(paper, "p.ts"),
    [
      "export default paper({ chapters: [",
      '  chapterRef({ dir: "intro" }),',
      "  chapterRef({",
      '    dir: "braids",',
      '    partTitle: "Mechanics",',
      "  }),",
      '  // chapterRef({ dir: "retired" }),',
      '  chapterRef({ dir: "appendix-tables" }),',
      "] });",
    ].join("\n"),
  );
  return repo;
}

describe("split-pdf-by-chapter.py on a folio/ checkout", () => {
  test("splits every chapter, the appendices and the glossary, reading the folio and not the platform", () => {
    if (!havePypdf) return;
    const repo = folio();
    const pdf = join(repo, "main.pdf");
    fixturePdf(pdf, 10, [["Introduction", 0], ["Braids and Knots", 2], ["Reference Tables", 6], ["Glossary", 8]]);
    const out = join(repo, "chapters");
    const r = spawnSync("python3", [SCRIPT, "--pdf", pdf, "--paper", "p", "--out-dir", out, "--include-appendices", "--extra", "glossary=Glossary"], { cwd: repo, encoding: "utf-8" });
    expect(r.stderr).not.toContain("ERROR");
    expect(r.status).toBe(0);
    for (const f of ["intro.pdf", "braids.pdf", "appendix-tables.pdf", "glossary.pdf"]) expect(existsSync(join(out, f))).toBe(true);
    expect(existsSync(join(out, "retired.pdf"))).toBe(false);
    const m = JSON.parse(readFileSync(join(out, "pdf-split-manifest.json"), "utf-8")) as { outputs: { slug: string; pages: [number, number] | null }[] };
    const pages = Object.fromEntries(m.outputs.map((o) => [o.slug, o.pages]));
    expect(pages["braids"]).toEqual([3, 6]);
    expect(pages["appendix-tables"]).toEqual([7, 8]);
    expect(pages["glossary"]).toEqual([9, 10]);
  });

  test("without --include-appendices an appendix is left to its standalone build", () => {
    if (!havePypdf) return;
    const repo = folio();
    const pdf = join(repo, "main.pdf");
    fixturePdf(pdf, 6, [["Introduction", 0], ["Braids and Knots", 2]]);
    const out = join(repo, "chapters");
    const r = spawnSync("python3", [SCRIPT, "--pdf", pdf, "--paper", "p", "--repo", repo, "--out-dir", out], { encoding: "utf-8" });
    expect(r.status).toBe(0);
    expect(existsSync(join(out, "braids.pdf"))).toBe(true);
    expect(existsSync(join(out, "appendix-tables.pdf"))).toBe(false);
  });

  test("a malformed --extra is refused", () => {
    if (!havePypdf) return;
    const repo = folio();
    const pdf = join(repo, "main.pdf");
    fixturePdf(pdf, 2, [["Introduction", 0]]);
    const r = spawnSync("python3", [SCRIPT, "--pdf", pdf, "--paper", "p", "--extra", "Glossary"], { cwd: repo, encoding: "utf-8" });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("--extra wants");
  });
});
