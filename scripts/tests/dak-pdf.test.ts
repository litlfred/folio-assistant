/**
 * The DAK PDF renderer's assembly step.
 *
 * §12.16 established that no DAK PDF renderer exists anywhere — smart-base's
 * only PDF dependency reads PDFs rather than writing them — so this is the
 * first thing producing the third representation §12.15 calls for.
 *
 * The behaviour worth pinning is **what it admits it left out**. A DAK's
 * substance lives largely in workbooks and BPMN diagrams that this first cut
 * does not render; a PDF that dropped them silently would look complete and be
 * misleading to exactly the person least able to notice. So omissions are
 * carried in the assembly, printed in the run summary, *and* printed inside
 * the document.
 *
 * Assembly is a pure function of the tree, so these need no Chromium.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { assemble, toHtml } from "../../scripts/dak-pdf";

const ROOT = mkdtempSync(join(tmpdir(), "dak-pdf-"));

beforeAll(() => {
  mkdirSync(join(ROOT, "input", "pagecontent"), { recursive: true });
  mkdirSync(join(ROOT, "input", "business-processes"), { recursive: true });
  mkdirSync(join(ROOT, "input", "dictionary"), { recursive: true });

  writeFileSync(join(ROOT, "sushi-config.yaml"), 'id: who.dak\ntitle: "Test DAK"\n');
  writeFileSync(join(ROOT, "input", "pagecontent", "index.md"), "# Overview\n\nSome *narrative*.\n");
  writeFileSync(join(ROOT, "input", "pagecontent", "b-processes.md"), "## Processes\n\nText.\n");
  writeFileSync(join(ROOT, "input", "pagecontent", "empty.md"), "   \n");
  writeFileSync(join(ROOT, "input", "business-processes", "A.bpmn"), "<definitions/>");
  writeFileSync(join(ROOT, "input", "dictionary", "dd.xlsx"), "PK");
});

afterAll(() => {
  try {
    rmSync(ROOT, { recursive: true, force: true });
  } catch {}
});

describe("assembly", () => {
  test("takes its title from sushi-config, not the directory name", () => {
    expect(assemble(ROOT).title).toBe("Test DAK");
  });

  test("falls back to the directory when there is no config", () => {
    const bare = mkdtempSync(join(tmpdir(), "bare-dak-"));
    mkdirSync(join(bare, "input", "pagecontent"), { recursive: true });
    writeFileSync(join(bare, "input", "pagecontent", "x.md"), "hi\n");
    expect(assemble(bare).title).toBe(bare.split("/").pop()!);
    rmSync(bare, { recursive: true, force: true });
  });

  test("renders markdown narrative to HTML", () => {
    const s = assemble(ROOT).sections.find((x) => x.title === "index")!;
    expect(s.html).toContain("<h1>Overview</h1>");
    expect(s.html).toContain("<em>narrative</em>");
  });

  test("skips an empty page rather than emitting a blank section", () => {
    expect(assemble(ROOT).sections.map((s) => s.title)).not.toContain("empty");
  });

  test("every section records where it came from", () => {
    for (const s of assemble(ROOT).sections) expect(s.source.length).toBeGreaterThan(0);
  });
});

describe("omissions are declared, never silent", () => {
  test("BPMN present but not drawn is reported", () => {
    const o = assemble(ROOT).omissions.join(" | ");
    expect(o).toContain("BPMN");
    expect(o).toContain("not drawn");
  });

  test("workbooks are reported with a count", () => {
    expect(assemble(ROOT).omissions.join(" | ")).toMatch(/1 workbook\(s\) not rendered/);
  });

  test("a DAK with no narrative says so rather than rendering nothing quietly", () => {
    const empty = mkdtempSync(join(tmpdir(), "no-narrative-"));
    expect(assemble(empty).omissions.join(" ")).toContain("no input/pagecontent/");
    rmSync(empty, { recursive: true, force: true });
  });

  test("the omissions reach the DOCUMENT, not just the run log", () => {
    // Whoever reads the PDF is the one who needs to know what is missing from
    // it, and they never see stdout.
    const html = toHtml(assemble(ROOT));
    expect(html).toContain("Not included in this rendering");
    expect(html).toContain("BPMN");
  });
});

describe("html", () => {
  test("carries a cover, a contents list and one anchor per section", () => {
    const a = assemble(ROOT);
    const html = toHtml(a);
    expect(html).toContain('class="cover"');
    expect(html).toContain('id="toc"');
    for (let i = 0; i < a.sections.length; i++) expect(html).toContain(`id="s${i}"`);
  });

  test("escapes titles rather than trusting the tree", () => {
    const evil = mkdtempSync(join(tmpdir(), "evil-dak-"));
    mkdirSync(join(evil, "input", "pagecontent"), { recursive: true });
    writeFileSync(join(evil, "sushi-config.yaml"), 'title: "<script>x</script>"\n');
    writeFileSync(join(evil, "input", "pagecontent", "a.md"), "hi\n");
    const html = toHtml(assemble(evil));
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>x</script>");
    rmSync(evil, { recursive: true, force: true });
  });
});
