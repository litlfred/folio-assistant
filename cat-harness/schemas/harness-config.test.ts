/**
 * Tests for schemas/harness-config.ts — cross-folio dependency schema and resolution.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  FolioAssistantDependencySchema,
  HarnessConfigSchema,
  readHarnessConfig,
  resolveDependencyPath,
  resolveDependencyTree,
  flattenDependencies,
  resolveSkillDirs,
  resolveTranslationDirs,
  materialiseDeclaredDirectories,
} from "./harness-config";
import { instanceConfigPathIn, writeInstanceConfig } from "../test/support/instance-fixture.js";

const TMP = join(import.meta.dir, "__test_folio_config__");

beforeAll(() => {
  mkdirSync(TMP, { recursive: true });

  // Root folio with skills and translations
  mkdirSync(join(TMP, "skills"), { recursive: true });
  mkdirSync(join(TMP, "translations", "fr"), { recursive: true });
  writeFileSync(join(TMP, "translations", "fr", "index.po"), "msgid\nmsgstr", "utf-8");

  // Dependency A with skills and translations
  const depA = join(TMP, "dep-a");
  mkdirSync(join(depA, "skills"), { recursive: true });
  mkdirSync(join(depA, "translations", "fr"), { recursive: true });
  writeInstanceConfig(depA, JSON.stringify({
    translation: { translationDir: "translations" },
  }));

  // Dependency B (transitive dep of A)
  const depB = join(TMP, "dep-b");
  mkdirSync(join(depB, "skills"), { recursive: true });
  writeInstanceConfig(depB, JSON.stringify({
    translation: { translationDir: "translations" },
  }));

  // A depends on B
  writeInstanceConfig(depA, JSON.stringify({
    translation: { translationDir: "translations" },
    dependencies: {
      folioAssistant: [
        { name: "dep-b", path: depB },
      ],
    },
  }));

  // Root config
  writeInstanceConfig(TMP, JSON.stringify({
    contentType: "document",
    translation: {
      defaultLocale: "en",
      supportedLocales: ["ar", "zh", "en", "fr", "ru", "es"],
      translationDir: "translations",
    },
    dependencies: {
      folioAssistant: [
        { name: "dep-a", path: depA },
      ],
    },
  }));
});

afterAll(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe("FolioAssistantDependencySchema", () => {
  it("validates a dependency with path", () => {
    const result = FolioAssistantDependencySchema.safeParse({
      name: "test-dep",
      path: "./deps/test",
    });
    expect(result.success).toBe(true);
  });

  it("validates a dependency with git", () => {
    const result = FolioAssistantDependencySchema.safeParse({
      name: "test-dep",
      git: "https://github.com/test/repo.git",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a dependency with neither path nor git", () => {
    const result = FolioAssistantDependencySchema.safeParse({
      name: "test-dep",
    });
    expect(result.success).toBe(false);
  });

  it("validates provides array", () => {
    const result = FolioAssistantDependencySchema.safeParse({
      name: "test-dep",
      path: "./test",
      provides: ["skills", "translations"],
    });
    expect(result.success).toBe(true);
  });
});

describe("HarnessConfigSchema", () => {
  it("parses minimal config", () => {
    const result = HarnessConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("parses full config", () => {
    const result = HarnessConfigSchema.safeParse({
      contentType: "document",
      adapter: "document",
      translation: {
        defaultLocale: "en",
        supportedLocales: ["en", "fr"],
      },
      dependencies: {
        folioAssistant: [
          { name: "dep-a", path: "./dep-a" },
        ],
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("readHarnessConfig", () => {
  it("reads a valid config", () => {
    const config = readHarnessConfig(TMP);
    expect(config).not.toBeNull();
    expect(config!.contentType).toBe("document");
  });

  it("returns null for missing directory", () => {
    const config = readHarnessConfig("/nonexistent/path");
    expect(config).toBeNull();
  });
});

describe("resolveDependencyPath", () => {
  it("resolves an absolute path", () => {
    const depA = join(TMP, "dep-a");
    const result = resolveDependencyPath(TMP, { name: "dep-a", path: depA });
    expect(result).toBe(depA);
  });

  it("returns null for nonexistent path", () => {
    const result = resolveDependencyPath(TMP, {
      name: "ghost",
      path: "/nonexistent/path",
    });
    expect(result).toBeNull();
  });
});

describe("resolveDependencyTree", () => {
  it("resolves direct dependencies", () => {
    const tree = resolveDependencyTree(TMP);
    expect(tree).toHaveLength(1);
    expect(tree[0].dependency.name).toBe("dep-a");
  });

  it("resolves transitive dependencies", () => {
    const tree = resolveDependencyTree(TMP);
    expect(tree[0].transitive).toHaveLength(1);
    expect(tree[0].transitive[0].dependency.name).toBe("dep-b");
  });

  it("detects cycles", () => {
    // Create a cycle: dep-b depends on root
    const depB = join(TMP, "dep-b");
    const origConfig = JSON.parse(
      readFileSync(instanceConfigPathIn(depB), "utf-8"),
    );
    writeInstanceConfig(depB, JSON.stringify({
      ...origConfig,
      dependencies: {
        folioAssistant: [{ name: "root", path: TMP }],
      },
    }));

    // Should not infinite loop
    const tree = resolveDependencyTree(TMP);
    expect(tree).toHaveLength(1);

    // Restore original
    writeInstanceConfig(depB, JSON.stringify(origConfig));
  });
});

describe("flattenDependencies", () => {
  it("returns depth-first order", () => {
    const tree = resolveDependencyTree(TMP);
    const flat = flattenDependencies(tree);
    // dep-b (transitive) should come before dep-a (direct)
    expect(flat).toHaveLength(2);
    expect(flat[0].dependency.name).toBe("dep-b");
    expect(flat[1].dependency.name).toBe("dep-a");
  });
});

describe("resolveSkillDirs", () => {
  it("returns directories in overlay order", () => {
    const dirs = resolveSkillDirs(TMP);
    // dep-b skills, dep-a skills, root skills
    expect(dirs.length).toBeGreaterThanOrEqual(2);
    // Root is last (highest priority)
    expect(dirs[dirs.length - 1]).toBe(join(TMP, "skills"));
  });
});

describe("resolveTranslationDirs", () => {
  it("returns translation directories", () => {
    const dirs = resolveTranslationDirs(TMP);
    expect(dirs.length).toBeGreaterThanOrEqual(1);
    // Root is last
    expect(dirs[dirs.length - 1]).toBe(join(TMP, "translations"));
  });
});

/**
 * A downstream instance INHERITS the ingestion directories, and gets them made.
 *
 * The owner, 2026-09-20: *"please add back uploads/ folder … library/ should
 * also be added in at initation."*
 *
 * **"Add back" turned out not to mean restore.** Both directories are present,
 * declared and populated in this checkout — `uploads/` with the raw queue,
 * `library/` with 1455 tracked files — so the ask is about what a *newly
 * initiated* instance gets, not about this one. Measured before anything was
 * written, so that nobody goes looking for a deletion to revert or "restores" a
 * directory over one that already has contents.
 *
 * And a newly initiated instance **already gets both**: they are declared
 * instance-scoped in `cat-harness/harness.json`, so `resolveDirectories` hands
 * them to every dependent and `materialiseDeclaredDirectories` — which
 * `init-folio` calls — creates them in the dependent's own root.
 *
 * So why a test rather than nothing? Because that property holds by a chain of
 * four facts, **none of which is stated anywhere**, and one of them is a single
 * absent JSON key. Adding `"scope": "repository"` to the `uploads` entry would
 * be a plausible-looking edit that silently stops every downstream folio getting
 * an ingestion queue — `resolveDirectories` skips a repository-scoped entry for
 * a dependency on purpose, and the folio would simply have nowhere to drop a
 * file. Nothing would fail. This is what makes that loud.
 */
describe("a dependent instance inherits the ingestion directories", () => {
  // Its OWN temporary root, deliberately NOT under `TMP`. `TMP` already holds a
  // `translations/` for the tests above, and `materialiseDirectories` now
  // refuses a declared directory that is empty at its resolved path while a
  // twin at the other scope holds content — *"that is what a missing or wrong
  // `scope` looks like"*. A downstream folio nested inside `TMP` inherits
  // `translations/` instance-scoped, finds it empty, sees `TMP/translations`
  // full, and trips that guard. The guard is right; the nesting was the
  // mistake.
  const DOWN = mkdtempSync(join(tmpdir(), "downstream-folio-"));

  beforeAll(() => {
    mkdirSync(DOWN, { recursive: true });
    // The downstream folio is an INSTANCE — it declares itself, and its config
    // is named after that declaration. A bare `harness.config.json` here would
    // be a file `resolveHarnessConfigPath` no longer looks for.
    writeInstanceConfig(
      DOWN,
      JSON.stringify({
        contentType: "document",
        dependencies: {
          folioAssistant: [{ name: "folio-assistant", path: join(import.meta.dir, "..") }],
        },
      }),
    );
  });

  it("materialises uploads/ and library/ in the DEPENDENT's own root", () => {
    // An instance inherits the CONVENTION — an id and a relative path — not a
    // licence to write into the dependency's checkout. `absPath` pointing back
    // into cat-harness/ would be the equivalent of creating folders inside
    // node_modules.
    const made = materialiseDeclaredDirectories(DOWN, { dryRun: true });
    for (const id of ["uploads", "library"]) {
      const dir = made.find((d) => d.id === id);
      expect(dir, `no "${id}" among ${made.map((d) => d.id).join(", ")}`).toBeDefined();
      expect(dir!.absPath.startsWith(DOWN)).toBe(true);
      expect(dir!.declaredBy).toBe("cat-harness");
    }
  });

  it("they are inherited, not defaults — the declaring instance is named", () => {
    // `DEFAULT_DIRECTORIES` entries report `(default)`. If these ever came
    // through that path instead, an instance declaring nothing would still get
    // them and the declaration would have stopped being what decides.
    const made = materialiseDeclaredDirectories(DOWN, { dryRun: true });
    for (const id of ["uploads", "library"]) {
      expect(made.find((d) => d.id === id)!.declaredBy).not.toBe("(default)");
    }
  });

  it("the work plan is NOT inherited, which is the contrast that makes this mean something", () => {
    // `beans/` and `todos/` are repository-scoped: a dependency's repository is
    // a different checkout, so inheriting them would point every consumer at
    // somebody else's work plan. Their absence here is what shows the test can
    // tell inherited from not.
    const ids = materialiseDeclaredDirectories(DOWN, { dryRun: true }).map((d) => d.id);
    expect(ids).not.toContain("beans");
    expect(ids).not.toContain("todos");
  });

  it("uploads/ and library/ are DISTINCT declarations, not one directory twice", () => {
    // Their own keep-markers record why: `uploads/` is the incoming queue, raw
    // files as dropped, and is NOT greppable as corpus — the corpus checklist
    // searches `library/` only. A source still sitting in uploads/ therefore
    // reads as absent to every consumer while the file is on disk. Collapsing
    // them would make that failure silent.
    const made = materialiseDeclaredDirectories(DOWN, { dryRun: true });
    const up = made.find((d) => d.id === "uploads")!;
    const lib = made.find((d) => d.id === "library")!;
    expect(up.absPath).not.toBe(lib.absPath);
    expect(up.path).not.toBe(lib.path);
  });
});

/**
 * A dependent instance materialises its own `docs/` — bean `n0nf`, issue #638.
 *
 * ## Why this is a test and not a line in the declaration
 *
 * `docs` was `dependents: "skip"`, and the argument for that was GOOD: a
 * dependent should **inherit the pages** rather than get an empty directory to
 * refill. The owner's compose ruling (2026-09-21) does not overturn it — under
 * an overlay a dependent gets both, the pages *and* somewhere to override one —
 * so the flip to `reproduce` is the second half of that argument arriving, not
 * a reversal of it.
 *
 * Which is exactly why it needs a test. **Flipping one JSON word back is a
 * plausible-looking edit**, the old rationale still reads persuasively in the
 * same entry, and nothing else in the repository would fail: a downstream folio
 * would simply have nowhere declared to document itself, silently. That is the
 * shape `wwi6` guards for `uploads/` and `library/`, and this is the same guard
 * pointed at `docs`.
 *
 * ## It asserts the CONTRAST, not just the presence
 *
 * `schemas` and `tools` are the platform's own and must stay unmaterialised.
 * Asserting only that `docs` appears would pass just as well against a build
 * that inherited everything — which is the junk the `dependents` field exists
 * to prevent, and would read as success.
 */
describe("a dependent instance materialises its own docs/", () => {
  const DOWN = mkdtempSync(join(tmpdir(), "docsdependent-"));

  beforeAll(() => {
    mkdirSync(DOWN, { recursive: true });
    writeInstanceConfig(
      DOWN,
      JSON.stringify({
        contentType: "document",
        dependencies: {
          folioAssistant: [{ name: "folio-assistant", path: join(import.meta.dir, "..") }],
        },
      }),
    );
  });

  it("materialises docs/ in the DEPENDENT's own root, attributed to cat-harness", () => {
    const made = materialiseDeclaredDirectories(DOWN, { dryRun: true });
    const docs = made.find((d) => d.id === "docs");
    expect(docs, `no "docs" among ${made.map((d) => d.id).join(", ")}`).toBeDefined();
    // Its OWN root — an instance inherits the CONVENTION, not a licence to
    // write into the dependency's checkout.
    expect(docs!.absPath.startsWith(DOWN)).toBe(true);
    expect(docs!.declaredBy).toBe("cat-harness");
  });

  it("...and NOT the platform's own directories, which is the contrast", () => {
    // Without this, a build that inherited all twelve would pass the test
    // above. `schemas/` and `tools/` are where the PLATFORM's content lives,
    // not part of the shape a folio has.
    const ids = materialiseDeclaredDirectories(DOWN, { dryRun: true }).map((d) => d.id);
    expect(ids).toContain("docs");
    for (const own of ["schemas", "tools"]) expect(ids).not.toContain(own);
  });

  it("the work plan is still NOT inherited — repository-scoped, and unaffected", () => {
    // Guards the blast radius of the flip: changing one entry's `dependents`
    // must not move anything keyed on `scope`.
    const ids = materialiseDeclaredDirectories(DOWN, { dryRun: true }).map((d) => d.id);
    expect(ids).not.toContain("beans");
    expect(ids).not.toContain("todos");
  });
});
