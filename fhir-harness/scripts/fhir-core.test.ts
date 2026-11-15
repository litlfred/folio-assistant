import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

import { FhirCorePinsKind, FhirCoreReleaseKind, FhirCoreReleaseSchema, isCoreDefinition } from "../schemas/fhir-core.ts";
import { sha512Integrity } from "./fhir-cache-seed-npm.ts";
import {
  checkCore,
  indexReleases,
  LAYER_ROOT,
  materialiseReleases,
  readManifest,
  resolveCanonical,
  sha1Hex,
  tgzFiles,
} from "./fhir-core.ts";

const BASE = "http://hl7.org/fhir/StructureDefinition/";

function tarEntry(name: string, body: Buffer): Buffer {
  const h = Buffer.alloc(512);
  h.write(name, 0, "utf8");
  h.write("0000644\0", 100);
  h.write("0000000\0", 108);
  h.write("0000000\0", 116);
  h.write(`${body.length.toString(8).padStart(11, "0")}\0`, 124);
  h.write("00000000000\0", 136);
  h.write("        ", 148);
  h.write("0", 156);
  h.write("ustar\0", 257);
  h.write("00", 263);
  let sum = 0;
  for (const b of h) sum += b;
  h.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
  return Buffer.concat([h, body, Buffer.alloc(Math.ceil(body.length / 512) * 512 - body.length)]);
}

function sd(id: string, kind: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { resourceType: "StructureDefinition", id, url: BASE + id, name: id, version: "4.0.1", kind, type: id, abstract: false, ...extra };
}

/** A tiny hl7.fhir.r4.core: two root types, a datatype, a resource, a profile, an extension and a logical model. */
function corePackage(): Buffer {
  const files: [string, unknown][] = [
    ["package/package.json", { name: "hl7.fhir.r4.core", version: "4.0.1" }],
    ["package/StructureDefinition-Element.json", sd("Element", "complex-type", { abstract: true })],
    ["package/StructureDefinition-Resource.json", sd("Resource", "resource", { abstract: true })],
    ["package/StructureDefinition-Coding.json", sd("Coding", "complex-type", { derivation: "specialization", baseDefinition: `${BASE}Element` })],
    ["package/StructureDefinition-Patient.json", sd("Patient", "resource", { derivation: "specialization", baseDefinition: `${BASE}DomainResource` })],
    ["package/StructureDefinition-vitalsigns.json", sd("vitalsigns", "resource", { type: "Observation", derivation: "constraint", baseDefinition: `${BASE}Observation` })],
    ["package/StructureDefinition-patient-birthTime.json", sd("patient-birthTime", "complex-type", { type: "Extension", derivation: "constraint" })],
    ["package/StructureDefinition-Definition.json", sd("Definition", "logical")],
    ["package/ValueSet-x.json", { resourceType: "ValueSet", id: "x" }],
  ];
  return gzipSync(Buffer.concat([...files.map(([n, j]) => tarEntry(n, Buffer.from(JSON.stringify(j)))), Buffer.alloc(1024)]));
}

function writePins(root: string, tgz: Buffer, release = "R4"): void {
  mkdirSync(join(root, "fhir-core"), { recursive: true });
  writeFileSync(
    join(root, "fhir-core", "pins.json"),
    JSON.stringify({
      $schema: "folio-fhir-core-pins/v1",
      registry: "https://packages.fhir.org",
      note: "test",
      releases: [
        {
          release,
          fhirVersion: "4.0.1",
          package: {
            name: "hl7.fhir.r4.core",
            version: "4.0.1",
            tarball: "https://packages.fhir.org/hl7.fhir.r4.core/4.0.1",
            shasum: sha1Hex(tgz),
            integrity: sha512Integrity(tgz),
          },
        },
      ],
    }),
  );
}

const quiet = () => {};

describe("fhir-core", () => {
  let root: string;
  let tgz: Buffer;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "fhir-core-"));
    tgz = corePackage();
    writePins(root, tgz);
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  describe("selection", () => {
    test("keeps types, resources and root types, and leaves out profiles, extensions and logical models", () => {
      expect(isCoreDefinition(sd("Element", "complex-type"))).toBe(true);
      expect(isCoreDefinition(sd("Patient", "resource", { derivation: "specialization" }))).toBe(true);
      expect(isCoreDefinition(sd("string", "primitive-type", { derivation: "specialization" }))).toBe(true);
      expect(isCoreDefinition(sd("vitalsigns", "resource", { derivation: "constraint" }))).toBe(false);
      expect(isCoreDefinition(sd("Definition", "logical"))).toBe(false);
      expect(isCoreDefinition({ ...sd("Patient", "resource"), url: "http://example.org/Patient" })).toBe(false);
    });
  });

  describe("index", () => {
    test("writes a manifest keyed by canonical URL, sorted, with counts and each file's sha256", async () => {
      const fetched: string[] = [];
      const unread = await indexReleases(root, { fetcher: async (u) => (fetched.push(u), tgz), log: quiet });
      expect(unread).toBe(0);
      expect(fetched).toEqual(["https://packages.fhir.org/hl7.fhir.r4.core/4.0.1"]);
      const m = readManifest(root, "R4");
      if (m?.status !== "read") throw new Error("expected a read manifest");
      expect(m.definitions.map((d) => d.id)).toEqual(["Coding", "Element", "Patient", "Resource"]);
      expect(m.counts).toEqual({ "primitive-type": 0, "complex-type": 2, resource: 2, excluded: 3 });
      const coding = m.definitions.find((d) => d.id === "Coding");
      expect(coding?.url).toBe(`${BASE}Coding`);
      expect(coding?.baseDefinition).toBe(`${BASE}Element`);
      expect(m.definitions.find((d) => d.id === "Element")?.derivation).toBeUndefined();
    });

    test("an unreachable package is recorded as unread with the reason, never as an empty graph", async () => {
      const unread = await indexReleases(root, {
        fetcher: async () => {
          throw new Error("connection refused");
        },
        log: quiet,
      });
      expect(unread).toBe(1);
      const raw = JSON.parse(readFileSync(join(root, "fhir-core", "r4", "manifest.json"), "utf8"));
      expect(raw.status).toBe("unread");
      expect(raw.reason).toContain("connection refused");
      expect("definitions" in raw).toBe(false);
    });

    test("bytes that differ from the pin are refused and the release is unread", async () => {
      const other = gzipSync(Buffer.concat([tarEntry("package/package.json", Buffer.from("{}")), Buffer.alloc(1024)]));
      await indexReleases(root, { fetcher: async () => other, log: quiet });
      const m = readManifest(root, "R4");
      expect(m?.status).toBe("unread");
      expect(m?.status === "unread" && m.reason).toContain("sha1");
    });

    test("a tarball in --tgz-dir is used, and still checked against the pin", async () => {
      const dir = join(root, "tgz");
      mkdirSync(dir);
      writeFileSync(join(dir, "hl7.fhir.r4.core-4.0.1.tgz"), tgz);
      const unread = await indexReleases(root, { tgzDir: dir, fetcher: async () => Buffer.alloc(0), log: quiet });
      expect(unread).toBe(0);
    });
  });

  describe("materialise, check and resolve", () => {
    test("bodies are written byte for byte and check holds them to the manifest", async () => {
      await indexReleases(root, { fetcher: async () => tgz, log: quiet });
      expect(checkCore(root).errors).toEqual([]);
      expect(resolveCanonical(root, `${BASE}Coding`, "R4").status).toBe("undetermined");
      expect(await materialiseReleases(root, { fetcher: async () => tgz, log: quiet })).toBe(0);
      const body = readFileSync(join(root, "fhir-core", "r4", "StructureDefinition-Coding.json"));
      expect(body.equals(tgzFiles(tgz).get("package/StructureDefinition-Coding.json") ?? Buffer.alloc(0))).toBe(true);
      expect(checkCore(root).errors).toEqual([]);
      const r = resolveCanonical(root, `${BASE}Coding|4.0.1`, "R4");
      expect(r.status).toBe("found");
      expect(resolveCanonical(root, `${BASE}Base`, "R4").status).toBe("absent");
      expect(existsSync(join(root, "fhir-core", "r4", "StructureDefinition-vitalsigns.json"))).toBe(false);
    });

    test("an edited body, or a file no entry names, fails check", async () => {
      await indexReleases(root, { fetcher: async () => tgz, log: quiet });
      await materialiseReleases(root, { fetcher: async () => tgz, log: quiet });
      writeFileSync(join(root, "fhir-core", "r4", "StructureDefinition-Coding.json"), "{}");
      writeFileSync(join(root, "fhir-core", "r4", "StructureDefinition-Extra.json"), "{}");
      const errors = checkCore(root).errors.join("\n");
      expect(errors).toContain("StructureDefinition-Coding.json: bytes are not the package's");
      expect(errors).toContain("StructureDefinition-Extra.json: no manifest entry names it");
    });

    test("an unread release cannot be materialised and resolves as undetermined", async () => {
      await indexReleases(root, { fetcher: async () => Buffer.alloc(0), log: quiet });
      expect(await materialiseReleases(root, { fetcher: async () => tgz, log: quiet })).toBe(1);
      const r = resolveCanonical(root, `${BASE}Coding`, "R4");
      expect(r.status).toBe("undetermined");
    });

    test("a manifest that names a package other than the pin fails check", async () => {
      await indexReleases(root, { fetcher: async () => tgz, log: quiet });
      writePins(root, gzipSync(Buffer.from("different")));
      expect(checkCore(root).errors.join("\n")).toContain("not the pin's");
    });
  });

  describe("node kinds", () => {
    test("the kinds the validators name judge the files as the schemas do", async () => {
      await indexReleases(root, { fetcher: async () => tgz, log: quiet });
      const read = JSON.parse(readFileSync(join(root, "fhir-core", "r4", "manifest.json"), "utf8"));
      expect(FhirCoreReleaseKind.schema.safeParse(read).success).toBe(true);
      expect(FhirCoreReleaseKind.schema.safeParse({ ...read, extra: 1 }).success).toBe(false);
      const unread = { ...read, status: "unread", reason: "x" };
      expect(FhirCoreReleaseKind.schema.safeParse(unread).success).toBe(false);
      const { counts: _c, definitions: _d, ...head } = unread;
      expect(FhirCoreReleaseKind.schema.safeParse(head).success).toBe(true);
      const pins = JSON.parse(readFileSync(join(root, "fhir-core", "pins.json"), "utf8"));
      expect(FhirCorePinsKind.schema.safeParse(pins).success).toBe(true);
      expect(FhirCorePinsKind.schema.safeParse({ ...pins, releases: [...pins.releases, ...pins.releases] }).success).toBe(false);
    });
  });

  describe("the committed graph", () => {
    test("the committed pins and manifests check clean, one stable release each", () => {
      expect(checkCore(LAYER_ROOT).errors).toEqual([]);
      for (const release of ["R4", "R4B", "R5"] as const) {
        const m = readManifest(LAYER_ROOT, release);
        expect(m).not.toBeNull();
        expect(FhirCoreReleaseSchema.safeParse(m).success).toBe(true);
        if (m?.status === "read") {
          const ids = new Set(m.definitions.map((d) => d.id));
          for (const base of ["Element", "BackboneElement", "DomainResource", "Resource", "Coding", "Reference", "Patient", "string"]) {
            expect(ids.has(base)).toBe(true);
          }
          expect(ids.has("Base")).toBe(release === "R5");
        }
      }
    });
  });
});
