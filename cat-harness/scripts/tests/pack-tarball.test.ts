import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BINARY_RELEASE_SCHEMA_TAG, BinaryReleaseSchema } from "../../schemas/binary-release.js";
import { packTarball } from "../pack-tarball.js";
import { retrieveNpmKg } from "../kg-retrieve-npm.js";

describe("pack-tarball and kg-retrieve-npm tooling", () => {
  test("packTarball builds npm tarball and creates valid folio-binary-release/v1 record", () => {
    const tmp = mkdtempSync(join(tmpdir(), "pack-test-"));
    const pkgDir = join(tmp, "my-kg-pkg");
    mkdirSync(pkgDir, { recursive: true });

    // Authored instance setup
    writeFileSync(
      join(pkgDir, "package.json"),
      JSON.stringify(
        {
          name: "@test-scope/test-kg",
          version: "1.2.3",
          description: "Test Knowledge Graph Package",
          files: ["my-kg.json", "skills", "schemas", "package.json"],
        },
        null,
        2
      )
    );

    writeFileSync(
      join(pkgDir, "my-kg.json"),
      JSON.stringify(
        {
          name: "test-kg",
          directories: [
            { id: "skills", path: "skills/", graphTypologies: ["cat-harness"] },
            { id: "schemas", path: "schemas/", graphTypologies: ["code"] },
          ],
          assets: [
            {
              id: "npm-manifest",
              src: "package.json",
              role: "package-manifest",
              title: "package.json",
              description: "The npm pre-packaging source manifest",
            },
          ],
        },
        null,
        2
      )
    );

    mkdirSync(join(pkgDir, "skills"), { recursive: true });
    writeFileSync(join(pkgDir, "skills", "my-skill.md"), "# My Skill\nInstructions.\n");

    mkdirSync(join(pkgDir, "schemas"), { recursive: true });
    writeFileSync(join(pkgDir, "schemas", "my-schema.ts"), "export const a = 1;\n");

    const outDir = join(tmp, "dist");
    const result = packTarball({
      root: pkgDir,
      destination: outDir,
      repository: "testowner/test-kg",
    });

    expect(existsSync(result.tarballPath)).toBe(true);
    expect(result.tarballName).toBe("test-scope-test-kg-1.2.3.tgz");
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);

    // Verify release document
    const rel = result.releaseRecord;
    expect(rel.$schema).toBe(BINARY_RELEASE_SCHEMA_TAG);
    expect(rel.release.version).toBe("1.2.3");
    expect(rel.release.tag).toBe("v1.2.3");
    expect(rel.origin.repository).toBe("testowner/test-kg");
    expect(rel.assets.length).toBe(1);
    expect(rel.assets[0]!.name).toBe(result.tarballName);
    expect(rel.assets[0]!.bytes).toBe(result.bytes);
    expect(rel.assets[0]!.digest?.digest).toBe(result.sha256);
    expect(rel.assets[0]!.disposition).toBe("published");

    // Must strictly validate against BinaryReleaseSchema
    expect(BinaryReleaseSchema.safeParse(rel).success).toBe(true);
    expect(result.releasePath && existsSync(result.releasePath)).toBe(true);

    // Test round-trip with kg-retrieve-npm
    const retrieved = retrieveNpmKg({
      pkg: result.tarballPath,
      release: result.releasePath,
      view: "both",
    });

    expect(retrieved.verifiedAgainstRelease).toBe(true);
    expect(retrieved.viewSummary.instanceDeclarations).toContain("my-kg.json");
    expect(retrieved.viewSummary.skillsCount).toBe(1);
    expect(retrieved.viewSummary.schemasCount).toBe(1);
    expect(retrieved.viewSummary.manifest?.name).toBe("@test-scope/test-kg");
    expect(retrieved.viewSummary.manifest?.version).toBe("1.2.3");

    rmSync(tmp, { recursive: true, force: true });
  });

  test("kg-retrieve-npm refuses tarball when release digest mismatches", () => {
    const tmp = mkdtempSync(join(tmpdir(), "retrieve-fail-test-"));
    const tgzPath = join(tmp, "fake.tgz");
    writeFileSync(tgzPath, "fake tarball content");

    const releaseDoc = {
      $schema: BINARY_RELEASE_SCHEMA_TAG,
      release: { id: "pkg-v1.0.0", version: "1.0.0" },
      origin: { kind: "github-release", repository: "test/pkg" },
      assets: [
        {
          name: "fake.tgz",
          bytes: 12345,
          digest: { algorithm: "sha256", digest: "0".repeat(64) },
          fetchedFrom: "https://example.com/fake.tgz",
          disposition: "published",
        },
      ],
    };
    const relFile = join(tmp, "release.json");
    writeFileSync(relFile, JSON.stringify(releaseDoc, null, 2));

    expect(() =>
      retrieveNpmKg({
        pkg: tgzPath,
        release: relFile,
      })
    ).toThrow();

    rmSync(tmp, { recursive: true, force: true });
  });
});
