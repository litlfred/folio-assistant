/**
 * `folio_init` — the scaffolder.
 *
 * The failures worth guarding against are not "did it write files" but the
 * three that produce a folio which *looks* right and does not work: a layout
 * whose manifests cannot find each other, a re-run that silently replaces an
 * author's work, and a document folio scaffolded with paper defaults.
 *
 * The end-to-end test is the load-bearing one: it scaffolds into a temp dir,
 * links the platform, and renders. A layout mistake shows up there and
 * nowhere else, because every individual file is syntactically fine.
 */
import { describe, test, expect, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, symlinkSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";

import { initFolio, isValidSlug, slugify, type InitFolioOptions } from "../init-folio";

const PLATFORM = resolve(import.meta.dir, "../..");
const dirs: string[] = [];

function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), "folio-init-"));
  dirs.push(d);
  return d;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function opts(dir: string, over: Partial<InitFolioOptions> = {}): InitFolioOptions {
  return {
    targetDir: dir,
    contentType: "document",
    slug: "cold-chain-guidance",
    title: "Cold Chain Guidance",
    authors: ["A. Author"],
    link: "sibling",
    assistantPath: "folio-assistant",
    skipVcs: true,
    ...over,
  };
}

describe("slug validation", () => {
  test("accepts lowercase hyphen-joined words", () => {
    expect(isValidSlug("cold-chain-guidance")).toBe(true);
    expect(isValidSlug("qou")).toBe(true);
    expect(isValidSlug("l2-dak")).toBe(true);
  });

  test("rejects what breaks as a directory, a module name or a URL path", () => {
    for (const bad of ["Cold Chain", "cold_chain", "-lead", "trail-", "double--hyphen", "", "a/b", "Ünïcode"]) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });

  test("a reserved slug is refused rather than silently undiscovered", () => {
    // content/schema/ and content/pipeline/ have platform meanings; a document
    // there would never be found by discovery, with no error to explain why.
    const d = tmp();
    expect(() => initFolio(opts(d, { slug: "schema" }))).toThrow(/reserved/);
    expect(() => initFolio(opts(d, { slug: "pipeline" }))).toThrow(/reserved/);
  });

  test("an invalid slug names all three things it has to be", () => {
    const d = tmp();
    expect(() => initFolio(opts(d, { slug: "Cold Chain" }))).toThrow(/directory name/);
  });

  test("slugify derives one from a title", () => {
    expect(slugify("Cold Chain Guidance")).toBe("cold-chain-guidance");
    expect(slugify("WHO ANC (2016) — Recommendations!")).toBe("who-anc-2016-recommendations");
  });
});

describe("required inputs", () => {
  test("an empty author list is refused, not defaulted", () => {
    const d = tmp();
    expect(() => initFolio(opts(d, { authors: [] }))).toThrow(/author/i);
  });
});

describe("what gets written", () => {
  test("every file the layout needs, and no subject matter", () => {
    const d = tmp();
    const r = initFolio(opts(d));
    for (const f of [
      "folio.config.json",
      ".mcp.json",
      ".beans.yml",
      "content/schema/builders.ts",
      "content/schema/types.ts",
      "content/cold-chain-guidance/cold-chain-guidance.ts",
      "content/cold-chain-guidance/introduction/introduction.ts",
      "content/cold-chain-guidance/introduction/overview.ts",
      "content/cold-chain-guidance/introduction/overview.md",
      "uploads/README.md",
      "library/README.md",
      "AGENTS.md",
      "CLAUDE.md",
      "GEMINI.md",
    ]) {
      expect(r.created).toContain(f);
      expect(existsSync(join(d, f))).toBe(true);
    }
  });

  test("the config selects the adapter matching the content type", () => {
    const doc = tmp();
    initFolio(opts(doc));
    const docCfg = JSON.parse(readFileSync(join(doc, "folio.config.json"), "utf-8"));
    expect(docCfg.contentType).toBe("document");
    expect(docCfg.adapterModule).toContain("adapters/document/index.ts");

    const pap = tmp();
    initFolio(opts(pap, { contentType: "paper" }));
    const papCfg = JSON.parse(readFileSync(join(pap, "folio.config.json"), "utf-8"));
    expect(papCfg.contentType).toBe("paper");
    expect(papCfg.adapterModule).toContain("adapters/paper/index.ts");
  });

  test("the builder shim is the only place the platform path is written", () => {
    const d = tmp();
    initFolio(opts(d, { assistantPath: "vendor/fa" }));
    expect(readFileSync(join(d, "content/schema/builders.ts"), "utf-8")).toContain("../../vendor/fa/schemas/builders");
    // Manifests reach the platform only through the shim, so re-linking the
    // platform is a two-file edit rather than a sweep over the corpus.
    const manifest = readFileSync(join(d, "content/cold-chain-guidance/cold-chain-guidance.ts"), "utf-8");
    expect(manifest).toContain("../schema/builders");
    expect(manifest).not.toContain("vendor/fa");
  });

  test("AGENTS.md tells a document folio which kinds it may not use", () => {
    const d = tmp();
    initFolio(opts(d));
    const agents = readFileSync(join(d, "AGENTS.md"), "utf-8");
    expect(agents).toContain("normative-statements");
    for (const k of ["theorem", "lemma", "proof"]) expect(agents).toContain(k);
  });

  test("CLAUDE.md and GEMINI.md are stubs pointing at AGENTS.md", () => {
    const d = tmp();
    initFolio(opts(d));
    for (const f of ["CLAUDE.md", "GEMINI.md"]) {
      const body = readFileSync(join(d, f), "utf-8");
      expect(body).toContain("AGENTS.md");
      expect(body.length).toBeLessThan(400);
    }
  });

  test("a paper folio gitignores Lean artifacts; a document folio does not", () => {
    const pap = tmp();
    initFolio(opts(pap, { contentType: "paper" }));
    expect(readFileSync(join(pap, ".gitignore"), "utf-8")).toContain(".lake/");

    const doc = tmp();
    initFolio(opts(doc));
    expect(readFileSync(join(doc, ".gitignore"), "utf-8")).not.toContain(".lake/");
  });
});

describe("re-running is safe", () => {
  test("existing files are skipped, not overwritten", () => {
    const d = tmp();
    initFolio(opts(d));
    writeFileSync(join(d, "AGENTS.md"), "# my own guidance\n", "utf-8");

    const second = initFolio(opts(d));
    expect(second.created).toEqual([]);
    expect(second.skipped).toContain("AGENTS.md");
    expect(readFileSync(join(d, "AGENTS.md"), "utf-8")).toBe("# my own guidance\n");
  });

  test("force overwrites, and says so", () => {
    const d = tmp();
    initFolio(opts(d));
    writeFileSync(join(d, "AGENTS.md"), "# my own guidance\n", "utf-8");

    const second = initFolio(opts(d, { force: true }));
    expect(second.skipped).toEqual([]);
    expect(readFileSync(join(d, "AGENTS.md"), "utf-8")).toContain("This is a **folio**");
  });

  test("a dry run writes nothing but reports everything", () => {
    const d = tmp();
    const r = initFolio(opts(d, { dryRun: true }));
    expect(r.created.length).toBeGreaterThan(10);
    expect(existsSync(join(d, "folio.config.json"))).toBe(false);
    expect(existsSync(join(d, "content"))).toBe(false);
  });

  test("a missing platform is reported, not left to fail at import time", () => {
    const d = tmp();
    const r = initFolio(opts(d));
    expect(r.notes.join(" ")).toContain("does not exist yet");
  });
});

describe("the scaffolded folio actually builds", () => {
  test("renders to Markdown with no issues, through its own shim", async () => {
    const d = tmp();
    initFolio(opts(d));
    // Link the platform where folio.config.json says it is. Everything below
    // then resolves exactly as it would in a real folio.
    symlinkSync(PLATFORM, join(d, "folio-assistant"));

    const { buildDocumentMarkdown } = await import("../../content/pipeline/render-markdown");
    const result = await buildDocumentMarkdown(
      join(d, "content/cold-chain-guidance/cold-chain-guidance.ts"),
    );

    expect(result.issues).toEqual([]);
    expect(result.blockCount).toBe(1);
    expect(result.chapterSlugs).toEqual(["introduction"]);
    expect(result.markdown).toContain("# Cold Chain Guidance");
    expect(result.markdown).toContain("## Introduction");
    expect(result.markdown).toContain("### Overview");
    // The starter block is listed in a section, so it renders. A scaffold that
    // wrote the files but forgot the blocks[] entry would pass every other
    // assertion here and produce an empty document.
    expect(result.markdown).toContain("unit of authorship");
    expect(result.markdown).not.toContain("Missing block");
  });

  test("the scaffolded document folio conforms to its own declared profile", async () => {
    const d = tmp();
    initFolio(opts(d));
    symlinkSync(PLATFORM, join(d, "folio-assistant"));

    const { checkFolioProfile } = await import("../../content/pipeline/profile-check");
    const r = checkFolioProfile(d);
    expect(r.profile).toBe("document");
    expect(r.declaredBy).toContain("folio.config.json");
    expect(r.blocksChecked).toBe(1);
    expect(r.violations).toEqual([]);
  });
});
