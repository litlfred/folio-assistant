import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import {
  checkCached,
  exact,
  fromMirror,
  fromSite,
  parseCliArgs,
  parseSushiConfigDeps,
  readPackageJsonFromTgz,
  seedFhirCache,
  sha512Hex,
  unpackTgz,
  validPart,
} from "./fhir-cache-seed-npm.ts";

/** Helper to create a minimal in-memory gzipped tar archive containing package/package.json. */
function createMockTgz(name: string, version: string, dependencies: Record<string, string> = {}): Buffer {
  const jsonContent = Buffer.from(
    JSON.stringify({
      name,
      version,
      dependencies,
    }),
    "utf-8",
  );

  // 512-byte tar header
  const header = Buffer.alloc(512);
  const path = "package/package.json";
  header.write(path, 0, 100, "utf-8"); // file name
  header.write("0000644\0", 100, 8, "utf-8"); // file mode
  header.write("0000000\0", 108, 8, "utf-8"); // uid
  header.write("0000000\0", 116, 8, "utf-8"); // gid
  const sizeOctal = jsonContent.length.toString(8).padStart(11, "0") + " ";
  header.write(sizeOctal, 124, 12, "utf-8"); // file size
  header.write("00000000000\0", 136, 12, "utf-8"); // mtime
  header.write("0", 156, 1, "utf-8"); // typeflag: normal file
  header.write("ustar\0", 257, 6, "utf-8"); // magic
  header.write("00", 263, 2, "utf-8"); // version

  // Checksum calculation (sum of all 512 bytes with chksum field treated as 8 spaces)
  header.fill(" ", 148, 156);
  let sum = 0;
  for (let i = 0; i < 512; i++) {
    sum += header[i];
  }
  const chksumOctal = sum.toString(8).padStart(6, "0") + "\0 ";
  header.write(chksumOctal, 148, 8, "utf-8");

  // Padding to multiple of 512
  const padLen = (512 - (jsonContent.length % 512)) % 512;
  const padding = Buffer.alloc(padLen);
  const endBlocks = Buffer.alloc(1024); // two empty 512-byte blocks

  const tarData = Buffer.concat([header, jsonContent, padding, endBlocks]);
  return gzipSync(tarData);
}

describe("fhir-cache-seed-npm", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "seed-test-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  describe("validPart", () => {
    test("accepts safe names and versions", () => {
      expect(validPart("hl7.fhir.r4.core")).toBe(true);
      expect(validPart("org.example.base")).toBe(true);
      expect(validPart("1.0.0")).toBe(true);
      expect(validPart("2.0.0-ballot")).toBe(true);
      expect(validPart("current")).toBe(true);
    });

    test("refuses dangerous strings that could cause traversal or command injection", () => {
      expect(validPart("")).toBe(false);
      expect(validPart("-rf")).toBe(false);
      expect(validPart("--registry=evil")).toBe(false);
      expect(validPart("../x")).toBe(false);
      expect(validPart("a/b")).toBe(false);
      expect(validPart("a\\b")).toBe(false);
      expect(validPart("a\0b")).toBe(false);
      expect(validPart(" a")).toBe(false);
      expect(validPart("a ")).toBe(false);
    });
  });

  describe("exact", () => {
    test("recognizes concrete semantic versions and current", () => {
      expect(exact("1.0.0")).toBe(true);
      expect(exact("4.0.1")).toBe(true);
      expect(exact("2.0.0-ballot")).toBe(true);
      expect(exact("2022.4.20221006")).toBe(true);
      expect(exact("current")).toBe(true);
    });

    test("refuses wildcards and ranges", () => {
      expect(exact("1.0.x")).toBe(false);
      expect(exact("^1.0.0")).toBe(false);
      expect(exact("~1.0.0")).toBe(false);
      expect(exact("latest")).toBe(false);
      expect(exact("dev")).toBe(false);
    });
  });

  describe("parseSushiConfigDeps", () => {
    test("extracts fhirVersion and dependencies from sushi-config.yaml", () => {
      const configPath = join(tmp, "sushi-config.yaml");
      writeFileSync(
        configPath,
        `
id: my.test.ig
fhirVersion: 4.0.1
dependencies:
  hl7.terminology: 7.3.0
  hl7.fhir.uv.extensions.r4: 5.3.0
  hl7.fhir.uv.cql:
    id: cql
    version: 2.0.0
    reason: test
  hl7.fhir.uv.sdc:
    id: sdc
    version: 4.0.0
`,
      );

      const deps = parseSushiConfigDeps(configPath);
      expect(deps).toContain("hl7.fhir.r4.core#4.0.1");
      expect(deps).toContain("hl7.terminology#7.3.0");
      expect(deps).toContain("hl7.fhir.uv.extensions.r4#5.3.0");
      expect(deps).toContain("hl7.fhir.uv.cql#2.0.0");
      expect(deps).toContain("hl7.fhir.uv.sdc#4.0.0");
    });

    test("ignores comments and comment blocks without breaking early", () => {
      const configPath = join(tmp, "sushi-config.yaml");
      writeFileSync(
        configPath,
        `
fhirVersion: 4.0.1
dependencies:
#  hl7.fhir.core:
#    id: r4b
#    version: 4.6.0
  hl7.terminology: 7.3.0
#  ignored.dep: 1.0.0
  hl7.fhir.uv.crmi:
    id: crmi
    version: 2.0.0
`,
      );

      const deps = parseSushiConfigDeps(configPath);
      expect(deps).toEqual([
        "hl7.fhir.r4.core#4.0.1",
        "hl7.terminology#7.3.0",
        "hl7.fhir.uv.crmi#2.0.0",
      ]);
    });
  });

  describe("checkCached", () => {
    test("accepts matching package entry", () => {
      const pkgDir = join(tmp, "a.b#1.0.0");
      mkdirSync(join(pkgDir, "package"), { recursive: true });
      writeFileSync(
        join(pkgDir, "package", "package.json"),
        JSON.stringify({ name: "a.b", version: "1.0.0" }),
      );

      expect(checkCached(pkgDir, "a.b", "1.0.0")).toBeNull();
    });

    test("accepts @hl7/ scoped name", () => {
      const pkgDir = join(tmp, "hl7.fhir.r4.core#4.0.1");
      mkdirSync(join(pkgDir, "package"), { recursive: true });
      writeFileSync(
        join(pkgDir, "package", "package.json"),
        JSON.stringify({ name: "@hl7/hl7.fhir.r4.core", version: "4.0.1" }),
      );

      expect(checkCached(pkgDir, "hl7.fhir.r4.core", "4.0.1")).toBeNull();
    });

    test("refuses mismatched version or name", () => {
      const pkgDir = join(tmp, "a.b#1.0.0");
      mkdirSync(join(pkgDir, "package"), { recursive: true });
      writeFileSync(
        join(pkgDir, "package", "package.json"),
        JSON.stringify({ name: "a.b", version: "2.0.0" }),
      );

      expect(checkCached(pkgDir, "a.b", "1.0.0")).not.toBeNull();
    });
  });

  describe("tarball reading & unpacking", () => {
    test("reads package.json in memory from tgz buffer", () => {
      const tgz = createMockTgz("my.pkg", "1.2.3", { "dep.a": "1.0.0" });
      const pj = readPackageJsonFromTgz(tgz);
      expect(pj).not.toBeNull();
      expect(pj?.name).toBe("my.pkg");
      expect(pj?.version).toBe("1.2.3");
      expect((pj?.dependencies as Record<string, string>)?.["dep.a"]).toBe("1.0.0");
    });

    test("unpacks files into target directory safely", () => {
      const tgz = createMockTgz("my.pkg", "1.2.3");
      const dest = join(tmp, "my.pkg#1.2.3");
      unpackTgz(tgz, dest);

      expect(existsSync(join(dest, "package", "package.json"))).toBe(true);
      expect(checkCached(dest, "my.pkg", "1.2.3")).toBeNull();
    });
  });

  describe("site repositories (--site-repo)", () => {
    test("parses PREFIX=OWNER/REPO[@BRANCH], repeatable", () => {
      const p = parseCliArgs([
        "--site-repo", "org.example.=example/site",
        "--site-repo", "org.other.=other/pages@gh-pages",
      ]);
      expect(p.siteRepos).toEqual({
        "org.example.": "example/site",
        "org.other.": "other/pages@gh-pages",
      });
    });

    test("no site repository unless the caller maps the prefix", async () => {
      expect(await fromSite("org.example.base", "1.0.0")).toBeNull();
      expect(await fromSite("org.example.base", "1.0.0", { "org.other.": "o/r" })).toBeNull();
    });

    test("refuses a malformed repository before any network call", async () => {
      expect(await fromSite("org.example.base", "1.0.0", { "org.example.": "not a repo" })).toBeNull();
    });
  });

  describe("fromMirror", () => {
    test("accepts file matching SHA512SUMS and internal package.json", () => {
      const mirrorDir = join(tmp, "mirror");
      mkdirSync(mirrorDir, { recursive: true });
      const tgz = createMockTgz("pkg.x", "1.0.0");
      const fileName = "pkg.x#1.0.0.tgz";
      writeFileSync(join(mirrorDir, fileName), tgz);
      const hash = sha512Hex(tgz);
      writeFileSync(join(mirrorDir, "SHA512SUMS"), `${hash}  ${fileName}\n`);

      const res = fromMirror(mirrorDir, null, "pkg.x", "1.0.0");
      expect("data" in res).toBe(true);
      if ("data" in res) {
        expect(res.provenance.file).toBe(fileName);
      }
    });

    test("refuses file with mismatched hash or missing from SHA512SUMS", () => {
      const mirrorDir = join(tmp, "mirror");
      mkdirSync(mirrorDir, { recursive: true });
      const tgz = createMockTgz("pkg.x", "1.0.0");
      const fileName = "pkg.x#1.0.0.tgz";
      writeFileSync(join(mirrorDir, fileName), tgz);
      writeFileSync(join(mirrorDir, "SHA512SUMS"), `00000000  ${fileName}\n`);

      const res = fromMirror(mirrorDir, null, "pkg.x", "1.0.0");
      expect("error" in res).toBe(true);
    });
  });

  describe("recursive transitive dependency resolution", () => {
    test("recursively follows dependencies across cache and mirror and outputs missing packages to --missing-out", async () => {
      const cacheDir = join(tmp, "cache");
      const mirrorDir = join(tmp, "mirror");
      const missingOut = join(tmp, "missing.txt");
      mkdirSync(cacheDir, { recursive: true });
      mkdirSync(mirrorDir, { recursive: true });

      // Package A: in cache, depends on B#1.0.0 and C#1.0.0
      const aDir = join(cacheDir, "pkg.a#1.0.0", "package");
      mkdirSync(aDir, { recursive: true });
      writeFileSync(
        join(aDir, "package.json"),
        JSON.stringify({
          name: "pkg.a",
          version: "1.0.0",
          dependencies: {
            "pkg.b": "1.0.0",
            "pkg.c": "1.0.0",
          },
        }),
      );

      // Package B: in mirror, depends on D#2.0.0 (which will be missing)
      const bTgz = createMockTgz("pkg.b", "1.0.0", { "pkg.d": "2.0.0" });
      const bFile = "pkg.b#1.0.0.tgz";
      writeFileSync(join(mirrorDir, bFile), bTgz);

      // Package C: in mirror, depends on E#1.0.0 (which is also in mirror, leaf)
      const cTgz = createMockTgz("pkg.c", "1.0.0", { "pkg.e": "1.0.0" });
      const cFile = "pkg.c#1.0.0.tgz";
      writeFileSync(join(mirrorDir, cFile), cTgz);

      const eTgz = createMockTgz("pkg.e", "1.0.0");
      const eFile = "pkg.e#1.0.0.tgz";
      writeFileSync(join(mirrorDir, eFile), eTgz);

      // Write SHA512SUMS for mirror
      const sumsContent = [
        `${sha512Hex(bTgz)}  ${bFile}`,
        `${sha512Hex(cTgz)}  ${cFile}`,
        `${sha512Hex(eTgz)}  ${eFile}`,
      ].join("\n");
      writeFileSync(join(mirrorDir, "SHA512SUMS"), sumsContent);

      const logs: string[] = [];
      const res = await seedFhirCache({
        cacheDir,
        mirror: mirrorDir,
        missingOut,
        wanted: ["pkg.a#1.0.0"],
        logger: { log: (m) => logs.push(m), error: (m) => logs.push(m) },
        resolveNpmFn: () => ({ ok: false, reasons: ["not on npm"] }),
      });

      // Verification:
      // pkg.a was already in cache
      // pkg.b was installed from mirror
      // pkg.c was installed from mirror
      // pkg.e was installed from mirror (transitive dep of pkg.c)
      // pkg.d was missing (transitive dep of pkg.b)
      expect(res.exitCode).toBe(1);
      expect(res.installed.map((i) => i.spec)).toContain("pkg.a#1.0.0");
      expect(res.installed.map((i) => i.spec)).toContain("pkg.b#1.0.0");
      expect(res.installed.map((i) => i.spec)).toContain("pkg.c#1.0.0");
      expect(res.installed.map((i) => i.spec)).toContain("pkg.e#1.0.0");

      expect(res.missing.map((m) => m.spec)).toEqual(["pkg.d#2.0.0"]);

      // Verify --missing-out file contents
      expect(existsSync(missingOut)).toBe(true);
      const missingText = readFileSync(missingOut, "utf-8").trim();
      expect(missingText).toBe("pkg.d#2.0.0");
    });

    test("terminates without infinite loop on cyclic dependencies", async () => {
      const cacheDir = join(tmp, "cache");
      mkdirSync(cacheDir, { recursive: true });

      // Package X depends on Y; Package Y depends on X
      const xDir = join(cacheDir, "pkg.x#1.0.0", "package");
      const yDir = join(cacheDir, "pkg.y#1.0.0", "package");
      mkdirSync(xDir, { recursive: true });
      mkdirSync(yDir, { recursive: true });

      writeFileSync(
        join(xDir, "package.json"),
        JSON.stringify({ name: "pkg.x", version: "1.0.0", dependencies: { "pkg.y": "1.0.0" } }),
      );
      writeFileSync(
        join(yDir, "package.json"),
        JSON.stringify({ name: "pkg.y", version: "1.0.0", dependencies: { "pkg.x": "1.0.0" } }),
      );

      const res = await seedFhirCache({
        cacheDir,
        wanted: ["pkg.x#1.0.0"],
        logger: { log: () => {}, error: () => {} },
      });

      expect(res.exitCode).toBe(0);
      expect(res.installed.map((i) => i.spec)).toEqual(["pkg.x#1.0.0", "pkg.y#1.0.0"]);
      expect(res.missing).toHaveLength(0);
    });

    test("correctly lists the 4 smart-base packages when they are absent from mirror and npm", async () => {
      const cacheDir = join(tmp, "cache");
      const mirrorDir = join(tmp, "mirror");
      const missingOut = join(tmp, "missing.txt");
      mkdirSync(cacheDir, { recursive: true });
      mkdirSync(mirrorDir, { recursive: true });

      // Create sushi-config for smart-base
      const configPath = join(tmp, "smart-base-sushi-config.yaml");
      writeFileSync(
        configPath,
        `
fhirVersion: 4.0.1
dependencies:
  hl7.terminology: 7.3.0
  hl7.fhir.uv.extensions.r4: 5.3.0
  hl7.fhir.uv.cql:
    id: cql
    version: 2.0.0
  hl7.fhir.uv.cpg:
    id: cpg
    version: 2.0.0
  hl7.fhir.uv.crmi:
    id: crmi
    version: 2.0.0
  hl7.fhir.uv.sdc:
    id: sdc
    version: 4.0.0
`,
      );

      // Pre-seed mirror with extensions.r4#5.3.0 only
      const extTgz = createMockTgz("hl7.fhir.uv.extensions.r4", "5.3.0");
      const extFile = "hl7.fhir.uv.extensions.r4#5.3.0.tgz";
      writeFileSync(join(mirrorDir, extFile), extTgz);
      writeFileSync(join(mirrorDir, "SHA512SUMS"), `${sha512Hex(extTgz)}  ${extFile}\n`);

      // Pre-populate core package in cache
      const coreDir = join(cacheDir, "hl7.fhir.r4.core#4.0.1", "package");
      mkdirSync(coreDir, { recursive: true });
      writeFileSync(
        join(coreDir, "package.json"),
        JSON.stringify({ name: "hl7.fhir.r4.core", version: "4.0.1" }),
      );

      // Pre-populate cpg package in cache
      const cpgDir = join(cacheDir, "hl7.fhir.uv.cpg#2.0.0", "package");
      mkdirSync(cpgDir, { recursive: true });
      writeFileSync(
        join(cpgDir, "package.json"),
        JSON.stringify({ name: "hl7.fhir.uv.cpg", version: "2.0.0" }),
      );

      const res = await seedFhirCache({
        cacheDir,
        sushiConfigPath: configPath,
        mirror: mirrorDir,
        missingOut,
        logger: { log: () => {}, error: () => {} },
        resolveNpmFn: () => ({ ok: false, reasons: ["not on npm"] }),
      });

      expect(res.exitCode).toBe(1);
      const missingSpecs = res.missing.map((m) => m.spec);
      expect(missingSpecs).toContain("hl7.terminology#7.3.0");
      expect(missingSpecs).toContain("hl7.fhir.uv.cql#2.0.0");
      expect(missingSpecs).toContain("hl7.fhir.uv.crmi#2.0.0");
      expect(missingSpecs).toContain("hl7.fhir.uv.sdc#4.0.0");

      const fileLines = readFileSync(missingOut, "utf-8").trim().split("\n");
      expect(fileLines).toContain("hl7.terminology#7.3.0");
      expect(fileLines).toContain("hl7.fhir.uv.cql#2.0.0");
      expect(fileLines).toContain("hl7.fhir.uv.crmi#2.0.0");
      expect(fileLines).toContain("hl7.fhir.uv.sdc#4.0.0");
    });
  });
});
