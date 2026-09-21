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
import { describe, test, it, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";

import {
  SECTIONS,
  leanLibName,
  runReadmeSync,
  syncSections,
  type SectionContext,
} from "../../content/pipeline/readme-sections";
import { loadReadmeConfig } from "../../content/pipeline/readme-toc";
import { AGENT_INSTRUCTIONS_ROLE, assetRolePurpose, INSTANCE_README_ROLE, instanceRootsIn } from "../../schemas/cat-harness.js";
import { FIXTURE_CONFIG, FIXTURE_INSTANCE, declareInstance , writeFixtureFile} from "../../test/support/instance-fixture.js";
import {  } from "../../schemas/cat-harness.js";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/** A folio root with one paper and whatever extra files a test needs. */
function folio(files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "folio-sec-"));
  dirs.push(root);
  // A config filename is composed from the instance's NAME, so a fixture that
  // hands `folio()` a `FIXTURE_CONFIG` entry has to be an instance called
  // `fixture` for that name to be the one anything looks for. Pinned rather
  // than taken from the mkdtemp basename, which is random per run.
  declareInstance(root, FIXTURE_INSTANCE);
  mkdirSync(join(root, "folio", "solo", "intro"), { recursive: true });
  writeFileSync(
    join(root, "folio", "solo", "solo.ts"),
    `export default paper({ title: "Solo", chapters: [ chapterRef({ dir: "intro" }) ] });\n`,
  );
  writeFileSync(join(root, "folio", "solo", "intro", "intro.ts"), `export default chapter({ title: "Intro" });\n`);
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFixtureFile(root, rel, body);
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
  test("prose above and below a marker survives verbatim", async () => {
    const root = folio();
    const readme = `# My Folio\n\nAuthored prose.\n\n${markers("folio:workflows")}\n\nMore prose.\n`;
    const out = syncSections(readme, ctx(root));

    expect(out.content).toContain("# My Folio");
    expect(out.content).toContain("Authored prose.");
    expect(out.content).toContain("More prose.");
  });

  test("a README with no markers is left byte-identical", async () => {
    const root = folio();
    const readme = "# Untouched\n\nAll of this is mine.\n";
    const out = syncSections(readme, ctx(root));

    expect(out.content).toBe(readme);
    expect(out.written).toEqual([]);
    expect(out.changed).toBe(false);
  });

  test("registered sections the README omits are absent, not errors", async () => {
    const root = folio();
    const out = syncSections(`# F\n\n${markers("folio:toc")}\n`, ctx(root));

    expect(out.written).toEqual(["folio:toc"]);
    expect(out.absent).toContain("folio:workflows");
    expect(out.absent).toContain("folio:lean-modules");
  });

  test("runReadmeSync writes nothing and explains itself when no marker exists", async () => {
    const root = folio({ "README.md": "# Mine\n\nNothing generated here.\n" });
    const before = readFileSync(join(root, "README.md"), "utf-8");
    const result = await runReadmeSync({ root });

    expect(result.exitCode).toBe(0);
    expect(result.text).toContain("carries no generated-section markers");
    expect(readFileSync(join(root, "README.md"), "utf-8")).toBe(before);
  });
});

describe("workflows section", () => {
  test("descriptions come from each workflow's own name:", async () => {
    const root = folio({
      ".github/workflows/build.yml": "name: Build and Publish\non: push\n",
      ".github/workflows/lint.yaml": 'name: "Lint"\non: push\n',
    });
    const md = SECTIONS.find((s) => s.marker === "folio:workflows")!.render(ctx(root)).markdown;

    expect(md).toContain("| `build.yml` | Build and Publish |");
    // Quotes stripped, and .yaml is picked up as well as .yml.
    expect(md).toContain("| `lint.yaml` | Lint |");
  });

  test("a workflow with no name: is listed with a blank cell and a note", async () => {
    const root = folio({ ".github/workflows/nameless.yml": "on: push\njobs: {}\n" });
    const out = SECTIONS.find((s) => s.marker === "folio:workflows")!.render(ctx(root));

    expect(out.markdown).toContain("| `nameless.yml` |  |");
    expect(out.notes.join(" ")).toContain("no `name:` field");
  });

  test("no workflows directory renders a sentence, not an empty table", async () => {
    const root = folio();
    const md = SECTIONS.find((s) => s.marker === "folio:workflows")!.render(ctx(root)).markdown;

    expect(md).not.toContain("| Workflow |");
    expect(md).toContain("_No");
  });
});

describe("lean modules section", () => {
  test("the namespace is the folio's own Lake library, not a hardcoded one", async () => {
    const root = folio({
      "folio/solo/lean/lakefile.toml": '[[lean_lib]]\nname = "Solo"\n',
      "folio/solo/lean/Solo/Basic.lean": "-- basic\n",
    });
    expect(leanLibName(root, "solo")).toBe("Solo");

    const md = SECTIONS.find((s) => s.marker === "folio:lean-modules")!.render(ctx(root)).markdown;
    expect(md).toContain("`Solo.Basic`");
    expect(md).not.toContain("QOU.");
  });

  test("no lean_lib means unprefixed modules and a note — never an invented namespace", async () => {
    const root = folio({ "folio/solo/lean/Basic.lean": "-- basic\n" });
    const out = SECTIONS.find((s) => s.marker === "folio:lean-modules")!.render(ctx(root));

    expect(out.markdown).toContain("| `Basic` |");
    expect(out.notes.join(" ")).toContain("no [[lean_lib]]");
  });

  test("a folio with no Lean at all renders a sentence", async () => {
    const root = folio();
    const md = SECTIONS.find((s) => s.marker === "folio:lean-modules")!.render(ctx(root)).markdown;
    expect(md).toContain("_No papers with Lean sources");
  });
});

describe("simulators section", () => {
  test("a configured directory that is absent here is left unchanged, not blanked", async () => {
    // The regression this guards: qou configures `folio-assistant/simulators`,
    // which exists only once the platform submodule is checked out. A clone
    // without it replaced a correct nine-row table with "no simulators".
    const root = folio({
      [FIXTURE_CONFIG]: JSON.stringify({ simulators: { dir: "not-checked-out" } }),
      "README.md": `# F\n\n<!-- folio:simulators:begin -->\n\n| Simulator | File |\n|---|---|\n| Kept | \`x.html\` |\n\n<!-- folio:simulators:end -->\n`,
    });
    const out = SECTIONS.find((s) => s.marker === "folio:simulators")!.render(ctx(root));
    expect(out.skip).toBe(true);

    const result = await runReadmeSync({ root });
    expect(result.exitCode).toBe(0);
    expect(result.text).toContain("left unchanged");
    // The table that was there is still there.
    expect(readFileSync(join(root, "README.md"), "utf-8")).toContain("| Kept | `x.html` |");
  });

  test("a directory that exists but holds nothing is a determined empty", async () => {
    const root = folio({ [FIXTURE_CONFIG]: JSON.stringify({ simulators: { dir: "sims" } }) });
    mkdirSync(join(root, "sims"), { recursive: true });
    const out = SECTIONS.find((s) => s.marker === "folio:simulators")!.render(ctx(root));

    expect(out.skip).toBeUndefined();
    expect(out.markdown).toContain("_No simulators");
  });

  test("the directory comes from harness.config.json, not a fixed path", async () => {
    const root = folio({
      [FIXTURE_CONFIG]: JSON.stringify({ simulators: { dir: "sims" } }),
      "sims/bring_surface.html": "<html></html>",
    });
    const md = SECTIONS.find((s) => s.marker === "folio:simulators")!.render(ctx(root)).markdown;

    expect(md).toContain("Bring Surface");
    expect(md).toContain("(sims/bring_surface.html)");
  });
});

describe("runReadmeSync", () => {
  test("--check reports staleness without writing, then a run fixes it", async () => {
    const root = folio({
      ".github/workflows/ci.yml": "name: CI\non: push\n",
      "README.md": `# F\n\n${markers("folio:workflows")}\n`,
    });

    const stale = await runReadmeSync({ root, check: true });
    expect(stale.exitCode).toBe(1);
    expect(readFileSync(join(root, "README.md"), "utf-8")).not.toContain("| `ci.yml` |");

    expect((await runReadmeSync({ root })).exitCode).toBe(0);
    expect(readFileSync(join(root, "README.md"), "utf-8")).toContain("| `ci.yml` | CI |");

    // Now current: --check passes and a second run is a no-op.
    expect((await runReadmeSync({ root, check: true })).exitCode).toBe(0);
    expect((await runReadmeSync({ root })).text).toContain("already current");
  });

  test("an unknown --only section is refused by name", async () => {
    const root = folio({ "README.md": `# F\n\n${markers("folio:toc")}\n` });
    const result = await runReadmeSync({ root, only: ["folio:nope"] });

    expect(result.exitCode).toBe(2);
    expect(result.text).toContain("Unknown section(s): folio:nope");
  });

  test("--only leaves the other marked sections alone", async () => {
    const root = folio({
      ".github/workflows/ci.yml": "name: CI\non: push\n",
      "README.md": `# F\n\n${markers("folio:toc")}\n\n${markers("folio:workflows")}\n`,
    });
    await runReadmeSync({ root, only: ["folio:workflows"] });
    const written = readFileSync(join(root, "README.md"), "utf-8");

    expect(written).toContain("| `ci.yml` | CI |");
    // The TOC region is still the empty pair it started as.
    expect(written).toContain("<!-- folio:toc:begin -->\n<!-- folio:toc:end -->");
  });

  test("a missing README is an error, not a silently created file", async () => {
    const root = folio();
    expect((await runReadmeSync({ root })).exitCode).toBe(2);
  });
});

describe("cat-harness:instances — both entries, per instance (issue #592)", () => {
  const repo = resolve(import.meta.dir, "..", "..", "..");
  const section = SECTIONS.find((s) => s.marker === "cat-harness:instances")!;
  const out = section.render({ root: repo, cfg: loadReadmeConfig(repo), fetch: false });

  it("renders a row for every instance that declares a harness.json", () => {
    const declared = instanceRootsIn(repo).length;
    const rows = out.markdown.split("\n").filter((l) => l.startsWith("| `"));
    expect(rows).toHaveLength(declared);
    expect(declared).toBeGreaterThan(1);
  });

  it("indexes the instances INSIDE this repository, not the directory holding it", () => {
    // `repoRootFor(root)` is `root/..`, which for the repository root itself
    // walks out of the repository: the first draft rendered a one-row table
    // listing this repository as its own child.
    expect(out.markdown).toContain("| `cat-harness` |");
    expect(out.markdown).toContain("| `bootstrap` |");
  });

  it("a declared `scope: \"repository\"` directory is linked at the REPOSITORY root", () => {
    // cat-harness declares `memory/` with `scope: "repository"`. Composing
    // `./cat-harness/memory/` rendered a link to a directory that is not
    // there — and a dead link in a generated table is worse than a missing
    // row, because the row asserts the entry exists.
    expect(out.markdown).toContain("[memory](memory/)");
    expect(out.markdown).not.toContain("./cat-harness/memory/");
  });

  // The gap behaviour is tested against a FIXTURE rather than the real tree.
  // It used to assert on `who-style-guide`, which had no agent entry when this
  // was written and has one now — so the test was measuring the repository's
  // state rather than the renderer's behaviour, and closing the gap broke it.
  // A property worth keeping must not depend on the corpus still being wrong.
  function repoWith(instances: Record<string, unknown>): string {
    const root = mkdtempSync(join(tmpdir(), "instances-"));
    writeDeclaration(root, JSON.stringify({ name: "root" }));
    for (const [name, decl] of Object.entries(instances)) {
      mkdirSync(join(root, name), { recursive: true });
      writeDeclaration(join(root, name), JSON.stringify(decl));
    }
    return root;
  }

  it("an instance with no agent entry gets an em dash, never a guessed path", () => {
    const root = repoWith({
      mute: { name: "mute", assets: [{ id: "r", src: "README.md", role: "instance-readme" }] },
    });
    const r = section.render({ root, cfg: loadReadmeConfig(root), fetch: false });
    const row = r.markdown.split("\n").find((l) => l.startsWith("| `mute`"))!;
    expect(row).toContain("| — |");
    expect(row).not.toContain("mute/AGENTS.md");
    rmSync(root, { recursive: true, force: true });
  });

  it("states the gap as a count AND says which check names them", () => {
    // A count in prose is a claim; this one has to carry where the list is.
    const root = repoWith({
      mute: { name: "mute", assets: [{ id: "r", src: "README.md", role: "instance-readme" }] },
    });
    const r = section.render({ root, cfg: loadReadmeConfig(root), fetch: false });
    expect(r.markdown).toMatch(/\*\*\d+ of \d+\*\* declare no `agent-instructions`/);
    expect(r.markdown).toContain("check:subgraph-coverage");
    rmSync(root, { recursive: true, force: true });
  });

  it("every instance in THIS repository now carries both entries", () => {
    // The state the fixtures above deliberately do not depend on: eight
    // instances were mute when this section was written, and none is now.
    const rows = out.markdown.split("\n").filter((l) => l.startsWith("| `"));
    for (const row of rows) expect(row).toContain("AGENTS.md");
    expect(out.markdown).not.toContain("declare no `agent-instructions`");
  });

  it("carries each role's purpose from the one place it is declared", () => {
    expect(out.markdown).toContain(assetRolePurpose(AGENT_INSTRUCTIONS_ROLE)!);
    expect(out.markdown).toContain(assetRolePurpose(INSTANCE_README_ROLE)!);
  });

  it("an unreadable tree is UNDETERMINED, not 'this repository has no instances'", () => {
    const empty = mkdtempSync(join(tmpdir(), "no-instances-"));
    const r = section.render({ root: empty, cfg: loadReadmeConfig(empty), fetch: false });
    expect(r.skip).toBe(true);
    expect(r.markdown).toBe("");
    rmSync(empty, { recursive: true, force: true });
  });
});
