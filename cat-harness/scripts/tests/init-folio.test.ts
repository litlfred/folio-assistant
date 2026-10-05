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

import { spawnSync } from "child_process";

import { parse as parseYaml } from "yaml";

import {
  enclosingRepoRoot,
  folioTemplates,
  initFolio,
  initInstance,
  isValidSlug,
  renderTemplate,
  slugify,
  templatesDir,
  TEMPLATE_PLACEHOLDER_RE,
  type InitFolioOptions,
} from "../init-folio";
import { instanceConfigFilename } from "../../schemas/harness-config.js";
import { instanceDeclarationFilename, readDeclaration } from "../../schemas/cat-harness.js";
import { declarationChain, resolveSkillDirs } from "../../schemas/harness-config.js";
import { nodeOfKind, parseTodoGraph } from "../../schemas/todo-graph.js";

/**
 * The scaffold names its config after the folio's SLUG, not after the temp
 * directory it happens to land in. A fixture helper that composes the name
 * from `basename(dir)` is right for a fixture that declares itself and wrong
 * here, because `folio_init` is the thing under test and it writes the
 * declaration too.
 */
const SLUG = "cold-chain-guidance";
const SCAFFOLD_CONFIG = instanceConfigFilename(SLUG);
const scaffoldConfigIn = (dir: string): string => join(dir, SCAFFOLD_CONFIG);

/**
 * The platform as a folio links it: the REPOSITORY root, which contains
 * `cat-harness/`.
 *
 * Bean `b963`. This read `resolve(import.meta.dir, "../..")`, which was the
 * repository root while these tests lived at `scripts/tests/` and silently
 * became the `cat-harness/` directory when they moved to
 * `cat-harness/scripts/tests/`. The test went on passing — by modelling a
 * layout that no longer exists, and thereby asserting that `init-folio` should
 * emit the pre-split paths.
 *
 * What a folio actually does is `git submodule add …/folio-assistant.git
 * folio-assistant`, so the linked directory is the repository root and the
 * platform's code is under `cat-harness/` inside it.
 */
const REPO_ROOT = resolve(import.meta.dir, "../../..");
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
  test("a DOCUMENT folio's staging caller is ON and builds with build-document-site (fyu2)", () => {
    const d = tmp();
    const r = initFolio(opts(d, { contentType: "document" }));
    const wf = readFileSync(join(d, ".github/workflows/staging.yml"), "utf-8");
    expect(wf).toContain("uses: litlfred/folio-assistant/.github/workflows/folio-staging.yml@main");
    expect(wf.split("\n").some((l) => /^\s*pull_request:/.test(l))).toBe(true);
    expect(wf).toContain("folio-assistant-core/scripts/build-document-site.ts --out _site");
    // A reviewer's tagged comment refreshes the preview's review comments (423d).
    expect(wf.split("\n").some((l) => /^\s*issue_comment:/.test(l))).toBe(true);
    expect(wf).toContain("issues: read");
    // A push to main publishes main's site: the before side of every preview (5uuf).
    expect(wf).toMatch(/^\s*push:\n\s*branches: \[main\]$/m);
    expect(r.notes.join(" ")).not.toContain("wired but OFF");
    expect(readFileSync(join(d, ".gitignore"), "utf-8")).toContain("_site/");
  });

  test("a new folio declares a todos graph with a feedback directory, so a review decision has somewhere to go (423d)", () => {
    const d = tmp();
    initFolio(opts(d, { contentType: "document" }));
    const g = parseTodoGraph(JSON.parse(readFileSync(join(d, "todos", "todos.json"), "utf-8")));
    const fb = nodeOfKind(g, "todo-feedback");
    expect(fb?.path).toBe("feedback");
    // Declared AND present: a declared-but-absent directory is the dh4f defect.
    for (const n of g.directories) expect(existsSync(join(d, "todos", n.path))).toBe(true);
  });

  test("a folio in a SUBFOLDER of a repository gets no workflow GitHub would never read, and is told why (zdfa)", () => {
    const repo = tmp();
    expect(spawnSync("git", ["init", "-q"], { cwd: repo }).status).toBe(0);
    const sub = join(repo, "guides", "handbook");
    expect(enclosingRepoRoot(sub)).not.toBeNull();
    const r = initFolio(opts(sub, { contentType: "document", skipVcs: false, link: "sibling" }));
    expect(existsSync(join(sub, ".github/workflows/staging.yml"))).toBe(false);
    expect(r.notes.join(" ")).toContain("cannot stage a folio below it");
    // Never a repository nested inside another by accident.
    expect(existsSync(join(sub, ".git"))).toBe(false);
    expect(r.notes.join(" ")).toContain("no git init");
  });

  test("a folio at its repository's root is not enclosed (zdfa)", () => {
    const d = tmp();
    expect(enclosingRepoRoot(d)).toBeNull();
    expect(spawnSync("git", ["init", "-q"], { cwd: d }).status).toBe(0);
    expect(enclosingRepoRoot(d)).toBeNull();
  });

  test("a PAPER folio's staging caller is OFF: dispatch-only, and its build refuses until set (ojcx)", () => {
    const d = tmp();
    const r = initFolio(opts(d, { contentType: "paper" }));
    const wf = readFileSync(join(d, ".github/workflows/staging.yml"), "utf-8");
    expect(wf.split("\n").some((l) => /^\s*pull_request:/.test(l))).toBe(false);
    expect(wf.split("\n").some((l) => /^\s*issue_comment:/.test(l))).toBe(false);
    expect(wf.split("\n").some((l) => /^\s*push:/.test(l))).toBe(false);
    expect(wf).toContain("exit 1");
    expect(r.notes.join(" ")).toContain("Staging previews are wired but OFF");
  });

  test("every file the layout needs, and no subject matter", () => {
    const d = tmp();
    const r = initFolio(opts(d));
    for (const f of [
      SCAFFOLD_CONFIG,
      ".mcp.json",
      ".beans.yml",
      "folio/schema/builders.ts",
      "folio/schema/types.ts",
      "folio/cold-chain-guidance/cold-chain-guidance.ts",
      "folio/cold-chain-guidance/introduction/introduction.ts",
      "folio/cold-chain-guidance/introduction/overview.ts",
      "folio/cold-chain-guidance/introduction/overview.md",
      "uploads/README.md",
      "library/README.md",
      "AGENTS.md",
      "CLAUDE.md",
      "GEMINI.md",
      ".github/workflows/staging.yml",
    ]) {
      expect(r.created).toContain(f);
      expect(existsSync(join(d, f))).toBe(true);
    }
  });

  test("the config selects the adapter matching the content type", () => {
    // `toBe`, not `toContain`, and that is the whole point of this test now.
    //
    // It pinned the SUBSTRINGS `adapters/document/index.ts` and
    // `adapters/paper/index.ts` until 2026-09-30, and both survive a wrong
    // answer: when `adapters/paper/` moved to `folio-assistant-sci/` (bean
    // `y5si`), the old composed path
    // `./folio-assistant/cat-harness/adapters/paper/index.ts` still contained
    // its substring while naming a file that does not exist. A gate that
    // cannot tell the right path from the broken one is not covering the
    // thing it looks like it covers, so each full path is written out.
    //
    // The two differ in their INSTANCE, which is the fact worth pinning, and
    // since 2026-09-30 NEITHER is under `cat-harness/`: `document` under
    // `folio-assistant-core/` (bean `ybp4`, step 2 of the adapters closure)
    // and `paper` under `folio-assistant-sci/` (bean `y5si`, step 1). That is
    // the whole closure — the escape axis reads 0 because the harness no
    // longer holds an adapter that imports upward.
    //
    // This assertion is why `toBe` replaced `toContain`, and it earned that on
    // the very next move: the document path changed instance, and a substring
    // pin on `adapters/document/index.ts` would have passed over it silently.
    // A change that re-composes both from one template breaks this line.
    const doc = tmp();
    initFolio(opts(doc));
    const docCfg = JSON.parse(readFileSync(scaffoldConfigIn(doc), "utf-8"));
    expect(docCfg.contentType).toBe("document");
    expect(docCfg.adapterModule).toBe("./folio-assistant/folio-assistant-core/adapters/document/index.ts");
    // The document entry's `module` now starts `../` too, exactly as paper's
    // does, so it has to RESOLVE rather than carry the segment through.
    expect(docCfg.adapterModule).not.toContain("..");

    const pap = tmp();
    initFolio(opts(pap, { contentType: "paper" }));
    const papCfg = JSON.parse(readFileSync(scaffoldConfigIn(pap), "utf-8"));
    expect(papCfg.contentType).toBe("paper");
    expect(papCfg.adapterModule).toBe("./folio-assistant/folio-assistant-sci/adapters/paper/index.ts");
  });

  test("the adapter path is normalised, and a non-default link path is honoured", () => {
    // The paper entry's `module` in `BUILTIN_ADAPTERS` starts `../`, because
    // it is relative to `cat-harness/`. Joining it to the link path has to
    // RESOLVE that segment rather than leave it in the string: a config
    // carrying `vendor/fa/cat-harness/../folio-assistant-sci/...` resolves to
    // the same file, but it reads as a mistake and would not survive anyone
    // tidying it by hand.
    const d = tmp();
    initFolio(opts(d, { contentType: "paper", assistantPath: "vendor/fa" }));
    const cfg = JSON.parse(readFileSync(scaffoldConfigIn(d), "utf-8"));
    expect(cfg.adapterModule).toBe("./vendor/fa/folio-assistant-sci/adapters/paper/index.ts");
    expect(cfg.adapterModule).not.toContain("..");
  });

  test("the builder shim is the only place the platform path is written", () => {
    const d = tmp();
    initFolio(opts(d, { assistantPath: "vendor/fa" }));
    expect(readFileSync(join(d, "folio/schema/builders.ts"), "utf-8")).toContain(
      "../../vendor/fa/cat-harness/schemas/builders",
    );
    // Manifests reach the platform only through the shim, so re-linking the
    // platform is a two-file edit rather than a sweep over the corpus.
    const manifest = readFileSync(join(d, "folio/cold-chain-guidance/cold-chain-guidance.ts"), "utf-8");
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

/**
 * Bean `52dz`. Seven workflows sat in the platform's `.github/workflows/`
 * where they could never run — each needed a folio — and the owner ruled they
 * become templates `folio_init` writes: the three QA ones for every folio,
 * the four Lean ones (and what they call) for a paper folio only.
 */
describe("workflow templates (52dz)", () => {
  const GENERIC = ["qa-sweep.yml", "qa-sweep-nightly.yml", "section-title-audit.yml"];
  const LEAN = ["blueprint.yml", "lean-build.yml", "lean-build-sidecar.yml", "lean_ci.yml"];
  const LEAN_SUPPORT = [
    ".github/actions/lake-cache-restore/action.yml",
    ".github/scripts/axiom_report.py",
    ".github/scripts/extract_proof_objects.py",
    ".github/scripts/update_proof_status.py",
    ".github/scripts/generate_dependency_graph.py",
    ".github/scripts/folio_lean/config.py",
  ];

  /** Every file the scaffold wrote under `.github/`. */
  function githubFiles(r: { created: string[] }): string[] {
    return r.created.filter((f) => f.startsWith(".github/"));
  }

  test("a DOCUMENT folio gets the three generic workflows and none of the Lean ones", () => {
    const d = tmp();
    const r = initFolio(opts(d));
    for (const wf of GENERIC) {
      expect(r.created).toContain(`.github/workflows/${wf}`);
      expect(existsSync(join(d, ".github/workflows", wf))).toBe(true);
    }
    for (const wf of LEAN) expect(existsSync(join(d, ".github/workflows", wf))).toBe(false);
    // Nor the scripts and action only the Lean workflows call.
    for (const f of LEAN_SUPPORT) expect(existsSync(join(d, f))).toBe(false);
  });

  test("a PAPER folio gets the generic workflows AND the Lean ones, with what they call", () => {
    const d = tmp();
    const r = initFolio(opts(d, { contentType: "paper" }));
    for (const wf of [...GENERIC, ...LEAN]) {
      expect(r.created).toContain(`.github/workflows/${wf}`);
      expect(existsSync(join(d, ".github/workflows", wf))).toBe(true);
    }
    for (const f of LEAN_SUPPORT) {
      expect(r.created).toContain(f);
      expect(existsSync(join(d, f))).toBe(true);
    }
  });

  test("the Lean workflows' local action and scripts are ones the scaffold wrote", () => {
    // `uses: ./.github/actions/<x>` and `python3 .github/scripts/<y>` resolve in
    // the FOLIO, so each must be something this scaffold put there.
    const d = tmp();
    initFolio(opts(d, { contentType: "paper" }));
    for (const wf of LEAN) {
      const body = readFileSync(join(d, ".github/workflows", wf), "utf-8");
      for (const m of body.matchAll(/uses:\s*\.\/(\.github\/actions\/[\w-]+)/g)) {
        expect(existsSync(join(d, m[1]!, "action.yml")), `${wf} uses ${m[1]}`).toBe(true);
      }
      for (const m of body.matchAll(/python3\s+(\.github\/scripts\/[\w-]+\.py)/g)) {
        expect(existsSync(join(d, m[1]!)), `${wf} runs ${m[1]}`).toBe(true);
      }
    }
  });

  test("nothing written names one folio's papers, and no placeholder is left", () => {
    for (const contentType of ["document", "paper"] as const) {
      const d = tmp();
      // A non-default platform path, so a placeholder that was never
      // substituted cannot pass by coinciding with the default.
      const r = initFolio(opts(d, { contentType, assistantPath: "vendor/fa" }));
      const written = githubFiles(r);
      expect(written.length).toBeGreaterThan(0);
      for (const f of written) {
        const body = readFileSync(join(d, f), "utf-8");
        expect(body.toLowerCase(), `${f} names qou`).not.toContain("qou");
        expect([...body.matchAll(TEMPLATE_PLACEHOLDER_RE)].map((m) => m[0]), `${f} placeholders`).toEqual([]);
      }
      // ...and the substitution happened: the platform path the caller chose
      // is the one the QA sweep runs from.
      expect(readFileSync(join(d, ".github/workflows/qa-sweep.yml"), "utf-8")).toContain(
        "vendor/fa/cat-harness/content/pipeline/qa-sweep.ts",
      );
      // GitHub's own `${{ … }}` expressions survive substitution untouched.
      expect(readFileSync(join(d, ".github/workflows/qa-sweep-nightly.yml"), "utf-8")).toContain(
        "${{ github.run_id }}",
      );
    }
  });

  test("an unknown placeholder is refused, not written through", () => {
    const values = { assistant: "a", folio: "f", platform_git: "g", platform_repo: "r" };
    expect(renderTemplate("run: {{assistant}}/x ${{ github.ref }}", values)).toBe("run: a/x ${{ github.ref }}");
    expect(() => renderTemplate("run: {{nope}}", values)).toThrow(/unknown template placeholder/);
  });

  test("every template parses as YAML, before and after substitution", () => {
    const values = { assistant: "folio-assistant", folio: "folio", platform_git: "g", platform_repo: "o/r" };
    const ymls = folioTemplates("paper").filter((t) => t.target.endsWith(".yml"));
    // Guard against a green run over nothing if the directory moves.
    expect(ymls.length).toBeGreaterThanOrEqual(GENERIC.length + LEAN.length + 1);
    for (const t of ymls) {
      const raw = readFileSync(t.source, "utf-8");
      expect(() => parseYaml(raw), t.source).not.toThrow();
      const doc = parseYaml(renderTemplate(raw, values)) as Record<string, unknown>;
      expect(typeof doc.name, `${t.source} has a name`).toBe("string");
    }
  });

  test("the templates come from the declared directory, not a path written in code", () => {
    // `folio-templates` is looked up by id; the directory it names must hold
    // both profiles the content types ask for.
    const dir = templatesDir();
    expect(existsSync(join(dir, "document"))).toBe(true);
    expect(existsSync(join(dir, "paper"))).toBe(true);
    expect(folioTemplates("document").every((t) => !t.target.includes("lean"))).toBe(true);
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
    expect(existsSync(scaffoldConfigIn(d))).toBe(false);
    expect(existsSync(join(d, "folio"))).toBe(false);
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
    // Link the platform where harness.config.json says it is. Everything below
    // then resolves exactly as it would in a real folio.
    symlinkSync(REPO_ROOT, join(d, "folio-assistant"));

    const { buildDocumentMarkdown } = await import("../../content/pipeline/render-markdown");
    const result = await buildDocumentMarkdown(
      join(d, "folio/cold-chain-guidance/cold-chain-guidance.ts"),
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
    symlinkSync(REPO_ROOT, join(d, "folio-assistant"));

    const { checkFolioProfile } = await import("../../content/pipeline/profile-check");
    const r = checkFolioProfile(d);
    expect(r.profile).toBe("document");
    expect(r.declaredBy).toContain(SCAFFOLD_CONFIG);
    expect(r.blocksChecked).toBe(1);
    expect(r.violations).toEqual([]);
  });
});

/**
 * Bean `mer2`, owner's ruling 2026-10-01: split the operation. An instance-init
 * writes the instance-level artefacts with NO content type, and `initFolio` is
 * that plus the adapter's scaffold. This is what makes the MVP the owner ruled
 * in `tndo` expressible for a layer that carries no adapter.
 */
describe("a contentless instance (mer2)", () => {
  const instanceOpts = (dir: string) => ({
    targetDir: dir,
    slug: SLUG,
    title: "Cold Chain Guidance",
    link: "submodule" as const,
    skipVcs: true,
  });

  // The instance-level set the ruling lists, hardcoded rather than derived from
  // the scaffolder, so the test fails if initiation stops writing any of them.
  const INSTANCE_LEVEL = [
    instanceDeclarationFilename(SLUG),
    SCAFFOLD_CONFIG,
    ".mcp.json",
    ".claude/settings.json",
    ".gitignore",
    ".beans.yml",
    "beans/.gitkeep",
    "todos/todos.json",
    "todos/items/.gitkeep",
    "todos/feedback/.gitkeep",
    "todos/verdicts/.gitkeep",
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
  ];

  test("writes every instance-level artefact, and nothing an adapter owns", () => {
    const d = tmp();
    const r = initInstance(instanceOpts(d));
    for (const f of INSTANCE_LEVEL) {
      expect(r.created).toContain(f);
      expect(existsSync(join(d, f))).toBe(true);
    }
    // declared-path-literal: asserting the scaffold did NOT create the folio layout.
    for (const absent of ["folio", "uploads", "library", ".github"]) {
      expect(existsSync(join(d, absent))).toBe(false);
    }
    expect(r.created.some((f) => f.startsWith("folio/"))).toBe(false);
  });

  test("the config names no adapter and the declaration no folio directory", () => {
    const d = tmp();
    initInstance(instanceOpts(d));
    const config = JSON.parse(readFileSync(scaffoldConfigIn(d), "utf-8"));
    expect(config.contentType).toBeUndefined();
    expect(config.adapter).toBeUndefined();
    expect(config.adapterModule).toBeUndefined();
    const decl = readDeclaration(d);
    expect(decl?.name).toBe(SLUG);
    expect(decl?.directories).toEqual([]);
  });

  test("a folio's instance half is the instance's — the two cannot drift", () => {
    const bare = tmp();
    const folio = tmp();
    initInstance(instanceOpts(bare));
    const r = initFolio(opts(folio));
    for (const f of INSTANCE_LEVEL) expect(r.created).toContain(f);
    // The files with no content-type dependence are byte-identical.
    for (const f of [".mcp.json", ".claude/settings.json", ".beans.yml", "todos/todos.json"]) {
      expect(readFileSync(join(folio, f), "utf-8")).toBe(readFileSync(join(bare, f), "utf-8"));
    }
  });

  // Done-when 3: assert what was PRODUCED — a declaration that loads and
  // graphs that resolve — rather than inferring success from no throw.
  for (const [label, run] of [
    ["instance", (d: string) => initInstance(instanceOpts(d))],
    ["document folio", (d: string) => initFolio(opts(d))],
    ["paper folio", (d: string) => initFolio(opts(d, { contentType: "paper" }))],
  ] as const) {
    test(`probe — the ${label}'s declaration loads and every declared directory exists`, () => {
      const d = tmp();
      run(d);
      const decl = readDeclaration(d);
      expect(decl).toBeDefined();
      for (const dir of decl!.directories) expect(existsSync(join(d, dir.path))).toBe(true);
    });
  }

  test("a folio's probe sees the content type it asked for, not a fallback", () => {
    const d = tmp();
    initFolio(opts(d, { contentType: "paper" }));
    const config = JSON.parse(readFileSync(scaffoldConfigIn(d), "utf-8"));
    expect(config.contentType).toBe("paper");
    expect(config.adapter).toBe("paper");
  });

  test("the CLI scaffolds an instance with no --type and no --author", () => {
    const d = tmp();
    const r = spawnSync(
      "bun",
      ["run", join(REPO_ROOT, "cat-harness/scripts/init-folio.ts"), "--instance", "--dir", d, "--title", "Cold Chain Guidance", "--skip-vcs"],
      { encoding: "utf-8" },
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("no content type");
    expect(existsSync(join(d, instanceDeclarationFilename(SLUG)))).toBe(true);
    // declared-path-literal: asserting the scaffold did NOT create the folio layout.
    expect(existsSync(join(d, "folio"))).toBe(false);
  });

  test("the CLI refuses --instance with a --type, rather than silently dropping it", () => {
    const d = tmp();
    const r = spawnSync(
      "bun",
      ["run", join(REPO_ROOT, "cat-harness/scripts/init-folio.ts"), "--instance", "--type", "paper", "--dir", d, "--title", "X", "--skip-vcs"],
      { encoding: "utf-8" },
    );
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("--instance takes no --type");
  });
});

/**
 * Bean `zmdo`, measured 2026-10-04: a scaffolded instance's declaration chain
 * was the instance ALONE — 0 skill directories reachable, for a contentless
 * instance and a document folio alike — because neither scaffold said what it
 * stands on. The config now names one layer and the layers' own `needs` carry
 * the rest.
 */
describe("a scaffold says what it stands on (zmdo)", () => {
  const chainNames = (d: string) => declarationChain(d).map((c) => c.name);
  const skillRoots = (d: string) => resolveSkillDirs(d).map((x) => x.split("/").slice(-2).join("/"));

  test("a contentless instance stands on cat-harness, and reaches its skills through the stack", () => {
    const d = tmp();
    initInstance({ targetDir: d, slug: SLUG, title: "Cold Chain Guidance", link: "submodule", skipVcs: true });
    const config = JSON.parse(readFileSync(scaffoldConfigIn(d), "utf-8"));
    expect(config.dependencies).toEqual({ folioAssistant: [{ name: "cat-harness", path: "folio-assistant/cat-harness" }] });
    symlinkSync(REPO_ROOT, join(d, "folio-assistant"));
    const chain = chainNames(d);
    expect(chain).toContain("cat-harness");
    expect(chain).toContain("bootstrap");
    expect(chain).not.toContain("folio-assistant-core");
    expect(skillRoots(d)).toContain("cat-harness/skills");
  });

  test("a document folio stands on its adapter's instance, folio-assistant-core", () => {
    const d = tmp();
    initFolio(opts(d));
    const config = JSON.parse(readFileSync(scaffoldConfigIn(d), "utf-8"));
    expect(config.dependencies).toEqual({
      folioAssistant: [{ name: "folio-assistant-core", path: "folio-assistant/folio-assistant-core" }],
    });
    symlinkSync(REPO_ROOT, join(d, "folio-assistant"));
    const chain = chainNames(d);
    expect(chain).toContain("folio-assistant-core");
    expect(chain).toContain("cat-harness");
    expect(skillRoots(d)).toContain("folio-assistant-core/skills");
  });

  test("a paper folio stands on folio-assistant-sci; a sibling link path is honoured", () => {
    const d = tmp();
    initFolio(opts(d, { contentType: "paper", link: "sibling", assistantPath: "../platform" }));
    const config = JSON.parse(readFileSync(scaffoldConfigIn(d), "utf-8"));
    expect(config.dependencies).toEqual({
      folioAssistant: [{ name: "folio-assistant-sci", path: "../platform/folio-assistant-sci" }],
    });
  });
});
