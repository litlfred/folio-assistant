/**
 * `readme_sync` — the generated-section registry.
 *
 * The property under test is the one its predecessor could not have.
 * `generate-readme.sh` ended in `cp "$OUT" README.md`: it replaced the whole
 * file, so running it in the wrong folio destroyed that folio's README. Every
 * test here that looks like bookkeeping — untouched prose, absent markers,
 * no-markers-at-all — is really asserting that no code path writes outside a
 * region the folio explicitly marked.
 */
import { describe, test, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import {
  SECTIONS,
  leanLibName,
  runReadmeSync,
  syncSections,
  type SectionContext,
} from "../../content/pipeline/readme-sections";
import { loadReadmeConfig } from "../../content/pipeline/readme-toc";

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/** A folio root with one paper and whatever extra files a test needs. */
function folio(files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "folio-sec-"));
  dirs.push(root);
  mkdirSync(join(root, "content", "solo", "intro"), { recursive: true });
  writeFileSync(
    join(root, "content", "solo", "solo.ts"),
    `export default paper({ title: "Solo", chapters: [ chapterRef({ dir: "intro" }) ] });\n`,
  );
  writeFileSync(join(root, "content", "solo", "intro", "intro.ts"), `export default chapter({ title: "Intro" });\n`);
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }
  return root;
}

function ctx(root: string): SectionContext {
  return { root, cfg: loadReadmeConfig(root), fetch: false };
}

function markers(name: string): string {
  return `<!-- ${name}:begin -->\n<!-- ${name}:end -->`;
}

describe("nothing outside a marked region is ever written", () => {
  test("prose above and below a marker survives verbatim", () => {
    const root = folio();
    const readme = `# My Folio\n\nAuthored prose.\n\n${markers("folio:workflows")}\n\nMore prose.\n`;
    const out = syncSections(readme, ctx(root));

    expect(out.content).toContain("# My Folio");
    expect(out.content).toContain("Authored prose.");
    expect(out.content).toContain("More prose.");
  });

  test("a README with no markers is left byte-identical", () => {
    const root = folio();
    const readme = "# Untouched\n\nAll of this is mine.\n";
    const out = syncSections(readme, ctx(root));

    expect(out.content).toBe(readme);
    expect(out.written).toEqual([]);
    expect(out.changed).toBe(false);
  });

  test("registered sections the README omits are absent, not errors", () => {
    const root = folio();
    const out = syncSections(`# F\n\n${markers("folio:toc")}\n`, ctx(root));

    expect(out.written).toEqual(["folio:toc"]);
    expect(out.absent).toContain("folio:workflows");
    expect(out.absent).toContain("folio:lean-modules");
  });

  test("runReadmeSync writes nothing and explains itself when no marker exists", () => {
    const root = folio({ "README.md": "# Mine\n\nNothing generated here.\n" });
    const before = readFileSync(join(root, "README.md"), "utf-8");
    const result = runReadmeSync({ root });

    expect(result.exitCode).toBe(0);
    expect(result.text).toContain("carries no generated-section markers");
    expect(readFileSync(join(root, "README.md"), "utf-8")).toBe(before);
  });
});

describe("workflows section", () => {
  test("descriptions come from each workflow's own name:", () => {
    const root = folio({
      ".github/workflows/build.yml": "name: Build and Publish\non: push\n",
      ".github/workflows/lint.yaml": 'name: "Lint"\non: push\n',
    });
    const md = SECTIONS.find((s) => s.marker === "folio:workflows")!.render(ctx(root)).markdown;

    expect(md).toContain("| `build.yml` | Build and Publish |");
    // Quotes stripped, and .yaml is picked up as well as .yml.
    expect(md).toContain("| `lint.yaml` | Lint |");
  });

  test("a workflow with no name: is listed with a blank cell and a note", () => {
    const root = folio({ ".github/workflows/nameless.yml": "on: push\njobs: {}\n" });
    const out = SECTIONS.find((s) => s.marker === "folio:workflows")!.render(ctx(root));

    expect(out.markdown).toContain("| `nameless.yml` |  |");
    expect(out.notes.join(" ")).toContain("no `name:` field");
  });

  test("no workflows directory renders a sentence, not an empty table", () => {
    const root = folio();
    const md = SECTIONS.find((s) => s.marker === "folio:workflows")!.render(ctx(root)).markdown;

    expect(md).not.toContain("| Workflow |");
    expect(md).toContain("_No");
  });
});

describe("lean modules section", () => {
  test("the namespace is the folio's own Lake library, not a hardcoded one", () => {
    const root = folio({
      "content/solo/lean/lakefile.toml": '[[lean_lib]]\nname = "Solo"\n',
      "content/solo/lean/Solo/Basic.lean": "-- basic\n",
    });
    expect(leanLibName(root, "solo")).toBe("Solo");

    const md = SECTIONS.find((s) => s.marker === "folio:lean-modules")!.render(ctx(root)).markdown;
    expect(md).toContain("`Solo.Basic`");
    expect(md).not.toContain("QOU.");
  });

  test("no lean_lib means unprefixed modules and a note — never an invented namespace", () => {
    const root = folio({ "content/solo/lean/Basic.lean": "-- basic\n" });
    const out = SECTIONS.find((s) => s.marker === "folio:lean-modules")!.render(ctx(root));

    expect(out.markdown).toContain("| `Basic` |");
    expect(out.notes.join(" ")).toContain("no [[lean_lib]]");
  });

  test("a folio with no Lean at all renders a sentence", () => {
    const root = folio();
    const md = SECTIONS.find((s) => s.marker === "folio:lean-modules")!.render(ctx(root)).markdown;
    expect(md).toContain("_No papers with Lean sources");
  });
});

describe("simulators section", () => {
  test("a configured directory that is absent here is left unchanged, not blanked", () => {
    // The regression this guards: qou configures `folio-assistant/simulators`,
    // which exists only once the platform submodule is checked out. A clone
    // without it replaced a correct nine-row table with "no simulators".
    const root = folio({
      "folio.config.json": JSON.stringify({ simulators: { dir: "not-checked-out" } }),
      "README.md": `# F\n\n<!-- folio:simulators:begin -->\n\n| Simulator | File |\n|---|---|\n| Kept | \`x.html\` |\n\n<!-- folio:simulators:end -->\n`,
    });
    const out = SECTIONS.find((s) => s.marker === "folio:simulators")!.render(ctx(root));
    expect(out.skip).toBe(true);

    const result = runReadmeSync({ root });
    expect(result.exitCode).toBe(0);
    expect(result.text).toContain("left unchanged");
    // The table that was there is still there.
    expect(readFileSync(join(root, "README.md"), "utf-8")).toContain("| Kept | `x.html` |");
  });

  test("a directory that exists but holds nothing is a determined empty", () => {
    const root = folio({ "folio.config.json": JSON.stringify({ simulators: { dir: "sims" } }) });
    mkdirSync(join(root, "sims"), { recursive: true });
    const out = SECTIONS.find((s) => s.marker === "folio:simulators")!.render(ctx(root));

    expect(out.skip).toBeUndefined();
    expect(out.markdown).toContain("_No simulators");
  });

  test("the directory comes from folio.config.json, not a fixed path", () => {
    const root = folio({
      "folio.config.json": JSON.stringify({ simulators: { dir: "sims" } }),
      "sims/bring_surface.html": "<html></html>",
    });
    const md = SECTIONS.find((s) => s.marker === "folio:simulators")!.render(ctx(root)).markdown;

    expect(md).toContain("Bring Surface");
    expect(md).toContain("(sims/bring_surface.html)");
  });
});

describe("runReadmeSync", () => {
  test("--check reports staleness without writing, then a run fixes it", () => {
    const root = folio({
      ".github/workflows/ci.yml": "name: CI\non: push\n",
      "README.md": `# F\n\n${markers("folio:workflows")}\n`,
    });

    const stale = runReadmeSync({ root, check: true });
    expect(stale.exitCode).toBe(1);
    expect(readFileSync(join(root, "README.md"), "utf-8")).not.toContain("| `ci.yml` |");

    expect(runReadmeSync({ root }).exitCode).toBe(0);
    expect(readFileSync(join(root, "README.md"), "utf-8")).toContain("| `ci.yml` | CI |");

    // Now current: --check passes and a second run is a no-op.
    expect(runReadmeSync({ root, check: true }).exitCode).toBe(0);
    expect(runReadmeSync({ root }).text).toContain("already current");
  });

  test("an unknown --only section is refused by name", () => {
    const root = folio({ "README.md": `# F\n\n${markers("folio:toc")}\n` });
    const result = runReadmeSync({ root, only: ["folio:nope"] });

    expect(result.exitCode).toBe(2);
    expect(result.text).toContain("Unknown section(s): folio:nope");
  });

  test("--only leaves the other marked sections alone", () => {
    const root = folio({
      ".github/workflows/ci.yml": "name: CI\non: push\n",
      "README.md": `# F\n\n${markers("folio:toc")}\n\n${markers("folio:workflows")}\n`,
    });
    runReadmeSync({ root, only: ["folio:workflows"] });
    const written = readFileSync(join(root, "README.md"), "utf-8");

    expect(written).toContain("| `ci.yml` | CI |");
    // The TOC region is still the empty pair it started as.
    expect(written).toContain("<!-- folio:toc:begin -->\n<!-- folio:toc:end -->");
  });

  test("a missing README is an error, not a silently created file", () => {
    const root = folio();
    expect(runReadmeSync({ root }).exitCode).toBe(2);
  });
});
