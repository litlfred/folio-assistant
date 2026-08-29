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
import { assemble, toHtml, dakIdentity } from "../../scripts/dak-pdf";

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

describe("DAK identity is declared, never inferred", () => {
  // sgex's agent guidance documents the rule WHO's own tooling relies on: a
  // repository is a DAK iff its root sushi-config.yaml declares a dependency
  // on smart.who.int.base. Verified against all three WHO repositories in
  // hand — smart-dak-immz and smart-dak-bds pin `current`, smart-immunizations
  // pins `0.2.0`. Nothing below looks at directory names or at which input/
  // subdirectories happen to exist.
  function withConfig(yaml: string): string {
    const d = mkdtempSync(join(tmpdir(), "ident-"));
    writeFileSync(join(d, "sushi-config.yaml"), yaml);
    return d;
  }

  test("a declared smart.who.int.base dependency makes it a DAK", () => {
    const d = withConfig("dependencies:\n  smart.who.int.base: current\n");
    expect(dakIdentity(d)).toEqual({ isDak: true, baseVersion: "current" });
    rmSync(d, { recursive: true, force: true });
  });

  test("a pinned version is carried, not just the fact of the dependency", () => {
    const d = withConfig("dependencies:\n  smart.who.int.base: 0.2.0\n");
    expect(dakIdentity(d).baseVersion).toBe("0.2.0");
    rmSync(d, { recursive: true, force: true });
  });

  test("SUSHI's object dependency form is read too", () => {
    const d = withConfig("dependencies:\n  smart.who.int.base:\n    version: 1.2.3\n");
    expect(dakIdentity(d)).toEqual({ isDak: true, baseVersion: "1.2.3" });
    rmSync(d, { recursive: true, force: true });
  });

  test("other WHO-adjacent dependencies do not qualify a repository", () => {
    const d = withConfig("dependencies:\n  hl7.fhir.uv.cpg: 2.0.0\n");
    const id = dakIdentity(d);
    expect(id.isDak).toBe(false);
    expect(id.reason).toContain("smart.who.int.base");
    rmSync(d, { recursive: true, force: true });
  });

  test("looking like a DAK is not being one", () => {
    // input/business-processes/ and input/dictionary/ are exactly what a
    // structural heuristic would key on. The rule ignores them.
    const d = mkdtempSync(join(tmpdir(), "lookalike-"));
    mkdirSync(join(d, "input", "business-processes"), { recursive: true });
    mkdirSync(join(d, "input", "dictionary"), { recursive: true });
    expect(dakIdentity(d).isDak).toBe(false);
    rmSync(d, { recursive: true, force: true });
  });

  test("each way of not being a DAK gives its own reason", () => {
    const missing = mkdtempSync(join(tmpdir(), "nocfg-"));
    expect(dakIdentity(missing).reason).toContain("no sushi-config.yaml");
    rmSync(missing, { recursive: true, force: true });

    const noDeps = withConfig('title: "Something else"\n');
    expect(dakIdentity(noDeps).reason).toContain("no dependencies");
    rmSync(noDeps, { recursive: true, force: true });

    const broken = withConfig("dependencies:\n\tbad: [unclosed\n");
    expect(dakIdentity(broken).isDak).toBe(false);
    rmSync(broken, { recursive: true, force: true });
  });

  test("a non-DAK is rendered but says so on its cover", () => {
    // Rendering it anyway is useful; letting the cover call it a Digital
    // Adaptation Kit on this tool's say-so is not.
    const html = toHtml(assemble(ROOT));
    expect(html).toContain("Not a recognised DAK");
    expect(html).not.toContain(">Digital Adaptation Kit");
  });

  test("a real DAK's cover names the base version it pins", () => {
    const d = withConfig('title: "Real"\ndependencies:\n  smart.who.int.base: current\n');
    mkdirSync(join(d, "input", "pagecontent"), { recursive: true });
    writeFileSync(join(d, "input", "pagecontent", "a.md"), "hi\n");
    const html = toHtml(assemble(d));
    expect(html).toContain("Digital Adaptation Kit");
    expect(html).toContain("smart.who.int.base");
    expect(html).not.toContain("Not a recognised DAK");
    rmSync(d, { recursive: true, force: true });
  });

  test("the title comes from the IG's own title, not a nested one", () => {
    // Indentation alone kept the old /^title:/m from matching a nested title,
    // so this pins behaviour the parse now guarantees structurally rather than
    // a defect it repaired.
    const d = withConfig('pages:\n  index.md:\n    title: "A page"\ntitle: "The IG"\n');
    expect(assemble(d).title).toBe("The IG");
    rmSync(d, { recursive: true, force: true });
  });
});
