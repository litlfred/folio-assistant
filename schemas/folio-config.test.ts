/**
 * Tests for schemas/folio-config.ts — cross-folio dependency schema and resolution.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  FolioAssistantDependencySchema,
  FolioConfigSchema,
  readFolioConfig,
  resolveDependencyPath,
  resolveDependencyTree,
  flattenDependencies,
  resolveSkillDirs,
  resolveTranslationDirs,
} from "./folio-config";

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
  writeFileSync(join(depA, "folio.config.json"), JSON.stringify({
    translation: { translationDir: "translations" },
  }), "utf-8");

  // Dependency B (transitive dep of A)
  const depB = join(TMP, "dep-b");
  mkdirSync(join(depB, "skills"), { recursive: true });
  writeFileSync(join(depB, "folio.config.json"), JSON.stringify({
    translation: { translationDir: "translations" },
  }), "utf-8");

  // A depends on B
  writeFileSync(join(depA, "folio.config.json"), JSON.stringify({
    translation: { translationDir: "translations" },
    dependencies: {
      folioAssistant: [
        { name: "dep-b", path: depB },
      ],
    },
  }), "utf-8");

  // Root config
  writeFileSync(join(TMP, "folio.config.json"), JSON.stringify({
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
  }), "utf-8");
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

describe("FolioConfigSchema", () => {
  it("parses minimal config", () => {
    const result = FolioConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("parses full config", () => {
    const result = FolioConfigSchema.safeParse({
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

describe("readFolioConfig", () => {
  it("reads a valid config", () => {
    const config = readFolioConfig(TMP);
    expect(config).not.toBeNull();
    expect(config!.contentType).toBe("document");
  });

  it("returns null for missing directory", () => {
    const config = readFolioConfig("/nonexistent/path");
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
      require("node:fs").readFileSync(join(depB, "folio.config.json"), "utf-8"),
    );
    writeFileSync(join(depB, "folio.config.json"), JSON.stringify({
      ...origConfig,
      dependencies: {
        folioAssistant: [{ name: "root", path: TMP }],
      },
    }), "utf-8");

    // Should not infinite loop
    const tree = resolveDependencyTree(TMP);
    expect(tree).toHaveLength(1);

    // Restore original
    writeFileSync(join(depB, "folio.config.json"), JSON.stringify(origConfig), "utf-8");
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
