#!/usr/bin/env bun
/**
 * fhir-core.ts — load the FHIR core specification's StructureDefinitions for
 * each stable release as a declared graph (`fhir-core/`, typology
 * `fhir-core-definitions`; schema `schemas/fhir-core.ts`).
 *
 * Usage (from the checkout root, or `--root` the layer):
 *   bun run fhir-harness/scripts/fhir-core.ts index       [--root DIR] [--release R4] [--tgz-dir DIR]
 *   bun run fhir-harness/scripts/fhir-core.ts materialise [--root DIR] [--release R4] [--tgz-dir DIR]
 *   bun run fhir-harness/scripts/fhir-core.ts check       [--root DIR]
 *   bun run fhir-harness/scripts/fhir-core.ts resolve <canonical-url> [--root DIR] [--release R4]
 *
 * `index` reads each pinned package (from `--tgz-dir` when it holds
 * `<name>-<version>.tgz`, else from its pinned packages.fhir.org URL), refuses
 * bytes whose sha1 or sha512 differs from the pin, and writes the release's
 * manifest. A package that cannot be fetched or verified writes an `unread`
 * manifest naming why, and the command exits 1.
 *
 * `materialise` writes the chosen StructureDefinitions, byte for byte as the
 * package holds them, beside the manifest; it refuses a file whose sha256 is not
 * the manifest's, and refuses an `unread` release.
 *
 * `check` is offline: the pins and manifests parse, each manifest names its
 * pin's package, and every materialised body matches its entry. A body not
 * materialised is reported and is not a failure (the bodies are not committed).
 *
 * `resolve` prints the file a canonical URL is kept in, or exits 1 when the
 * release holds no such definition and 2 when the release is unread or not
 * materialised: the lookup a reader resolving element types by canonical uses.
 *
 * Exit codes: 0 ok, 1 a failure, 2 usage or could not determine.
 *
 * @module fhir-harness/scripts/fhir-core
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

import {
  CORE_SD_BASE,
  type CoreDefinition,
  FHIR_CORE_RELEASE_TAG,
  type FhirCorePin,
  FhirCorePinsSchema,
  type FhirCoreReleaseManifest,
    type FhirRelease,
  FhirReleaseSchema,
  isCoreDefinition,
  parseRelease,
  RELEASE_DIR,
  SELECTION,
} from "../schemas/fhir-core.ts";
import { sha512Integrity } from "./fhir-cache-seed-npm.ts";

/** The layer root this script belongs to. */
export const LAYER_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CORE_DIR = "fhir-core";
export const PINS_FILE = "pins.json";
export const MANIFEST_FILE = "manifest.json";

export function sha1Hex(data: Buffer): string {
  return createHash("sha1").update(data).digest("hex");
}
export function sha256Hex(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Every regular file in a .tgz, by its path inside the archive (`package/...`). In memory; nothing is written. */
export function tgzFiles(tgz: Buffer): Map<string, Buffer> {
  const buf = gunzipSync(tgz);
  const out = new Map<string, Buffer>();
  let off = 0;
  let longName: string | undefined;
  while (off + 512 <= buf.length) {
    const header = buf.subarray(off, off + 512);
    let name = header.toString("utf8", 0, 100).replace(/\0.*$/s, "");
    if (!name) break;
    if (header.toString("utf8", 257, 262) === "ustar") {
      const prefix = header.toString("utf8", 345, 500).replace(/\0.*$/s, "");
      if (prefix) name = `${prefix}/${name}`;
    }
    const type = String.fromCharCode(header[156] ?? 0);
    const size = parseInt(header.toString("utf8", 124, 136).replace(/\0.*$/s, "").trim(), 8) || 0;
    const body = buf.subarray(off + 512, off + 512 + size);
    if (type === "L") longName = body.toString("utf8").replace(/\0.*$/s, "");
    else {
      if (type === "0" || type === "\0") out.set((longName ?? name).replace(/^\.\//, ""), Buffer.from(body));
      longName = undefined;
    }
    off += 512 + Math.ceil(size / 512) * 512;
  }
  return out;
}

/** Why `data` is not the pinned tarball, or null when both hashes match. */
export function pinMismatch(pin: FhirCorePin, data: Buffer): string | null {
  const sha1 = sha1Hex(data);
  if (sha1 !== pin.package.shasum) return `sha1 ${sha1} is not the pinned ${pin.package.shasum}`;
  const integrity = sha512Integrity(data);
  if (integrity !== pin.package.integrity) return `sha512 ${integrity} is not the pinned ${pin.package.integrity}`;
  return null;
}

export function readPins(root: string): FhirCorePin[] {
  const path = join(root, CORE_DIR, PINS_FILE);
  return FhirCorePinsSchema.parse(JSON.parse(readFileSync(path, "utf8"))).releases;
}

export function manifestPath(root: string, release: FhirRelease): string {
  return join(root, CORE_DIR, RELEASE_DIR[release], MANIFEST_FILE);
}

export function readManifest(root: string, release: FhirRelease): FhirCoreReleaseManifest | null {
  const p = manifestPath(root, release);
  return existsSync(p) ? parseRelease(JSON.parse(readFileSync(p, "utf8"))) : null;
}

/** The chosen definitions in a package, each with its bytes, sorted by canonical URL. */
export function selectDefinitions(
  pin: FhirCorePin,
  files: Map<string, Buffer>,
): { definitions: { entry: CoreDefinition; bytes: Buffer }[]; excluded: number } {
  const chosen: { entry: CoreDefinition; bytes: Buffer }[] = [];
  let excluded = 0;
  for (const [path, bytes] of files) {
    if (!/^package\/StructureDefinition-[^/]+\.json$/.test(path)) continue;
    const sd = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
    if (sd.resourceType !== "StructureDefinition") continue;
    if (!isCoreDefinition(sd)) {
      excluded++;
      continue;
    }
    const id = sd.id as string;
    const entry: CoreDefinition = {
      url: CORE_SD_BASE + id,
      id,
      name: String(sd.name),
      version: String(sd.version ?? sd.fhirVersion),
      kind: sd.kind as CoreDefinition["kind"],
      type: String(sd.type),
      abstract: sd.abstract === true,
      ...(sd.derivation === "specialization" ? { derivation: "specialization" as const } : {}),
      ...(typeof sd.baseDefinition === "string" ? { baseDefinition: sd.baseDefinition } : {}),
      file: `StructureDefinition-${id}.json`,
      sha256: sha256Hex(bytes),
    };
    if (path !== `package/${entry.file}`) throw new Error(`${path} holds ${entry.url}, not the file its id names`);
    chosen.push({ entry, bytes });
  }
  chosen.sort((a, b) => (a.entry.url < b.entry.url ? -1 : a.entry.url > b.entry.url ? 1 : 0));
  return { definitions: chosen, excluded };
}

export function readManifestFromPackage(pin: FhirCorePin, tgz: Buffer): FhirCoreReleaseManifest {
  const { definitions, excluded } = selectDefinitions(pin, tgzFiles(tgz));
  const count = (k: CoreDefinition["kind"]) => definitions.filter((d) => d.entry.kind === k).length;
  return parseRelease({
    $schema: FHIR_CORE_RELEASE_TAG,
    release: pin.release,
    fhirVersion: pin.fhirVersion,
    package: pin.package,
    selection: SELECTION,
    status: "read",
    counts: { "primitive-type": count("primitive-type"), "complex-type": count("complex-type"), resource: count("resource"), excluded },
    definitions: definitions.map((d) => d.entry),
  });
}

export function unreadManifest(pin: FhirCorePin, reason: string): FhirCoreReleaseManifest {
  return parseRelease({
    $schema: FHIR_CORE_RELEASE_TAG,
    release: pin.release,
    fhirVersion: pin.fhirVersion,
    package: pin.package,
    selection: SELECTION,
    status: "unread",
    reason,
  });
}

export type Fetcher = (url: string) => Promise<Buffer>;

export const httpFetch: Fetcher = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
  return Buffer.from(await r.arrayBuffer());
};

/** The pinned tarball's bytes, verified, or the reason it could not be obtained. */
export async function obtain(pin: FhirCorePin, tgzDir: string | undefined, fetcher: Fetcher): Promise<Buffer | string> {
  let data: Buffer;
  const local = tgzDir ? join(tgzDir, `${pin.package.name}-${pin.package.version}.tgz`) : undefined;
  try {
    data = local && existsSync(local) ? readFileSync(local) : await fetcher(pin.package.tarball);
  } catch (e) {
    return `could not fetch ${pin.package.tarball}: ${(e as Error).message}`;
  }
  const bad = pinMismatch(pin, data);
  return bad ? `${pin.package.name}#${pin.package.version}: ${bad}` : data;
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** Read each pinned release and write its manifest. Returns the number of releases left unread. */
export async function indexReleases(root: string, opts: { release?: FhirRelease; tgzDir?: string; fetcher?: Fetcher; log?: (s: string) => void }): Promise<number> {
  const log = opts.log ?? console.log;
  let unread = 0;
  for (const pin of readPins(root).filter((p) => !opts.release || p.release === opts.release)) {
    const got = await obtain(pin, opts.tgzDir, opts.fetcher ?? httpFetch);
    let m: FhirCoreReleaseManifest;
    if (typeof got === "string") m = unreadManifest(pin, got);
    else {
      try {
        m = readManifestFromPackage(pin, got);
      } catch (e) {
        m = unreadManifest(pin, `${pin.package.name}#${pin.package.version} could not be read: ${(e as Error).message}`);
      }
    }
    writeJson(manifestPath(root, pin.release), m);
    if (m.status === "unread") {
      unread++;
      log(`${pin.release}: UNREAD — ${m.reason}`);
    } else log(`${pin.release}: ${m.definitions.length} definitions (${m.counts.excluded} excluded) from ${pin.package.name}#${pin.package.version}`);
  }
  return unread;
}

/** Write each read release's chosen definitions, byte for byte. Returns the number of releases that could not be. */
export async function materialiseReleases(root: string, opts: { release?: FhirRelease; tgzDir?: string; fetcher?: Fetcher; log?: (s: string) => void }): Promise<number> {
  const log = opts.log ?? console.log;
  let failed = 0;
  for (const pin of readPins(root).filter((p) => !opts.release || p.release === opts.release)) {
    const m = readManifest(root, pin.release);
    if (!m || m.status === "unread") {
      failed++;
      log(`${pin.release}: could not determine — ${m ? `unread: ${m.reason}` : "no manifest; run `index` first"}`);
      continue;
    }
    const got = await obtain(pin, opts.tgzDir, opts.fetcher ?? httpFetch);
    if (typeof got === "string") {
      failed++;
      log(`${pin.release}: could not determine — ${got}`);
      continue;
    }
    const files = tgzFiles(got);
    const dir = join(root, CORE_DIR, RELEASE_DIR[pin.release]);
    mkdirSync(dir, { recursive: true });
    let bad = 0;
    for (const d of m.definitions) {
      const bytes = files.get(`package/${d.file}`);
      if (!bytes || sha256Hex(bytes) !== d.sha256) {
        bad++;
        log(`${pin.release}: ${d.url} — ${bytes ? "bytes differ from the manifest" : "not in the package"}`);
        continue;
      }
      writeFileSync(join(dir, d.file), bytes);
    }
    if (bad) failed++;
    log(`${pin.release}: ${m.definitions.length - bad} of ${m.definitions.length} materialised`);
  }
  return failed;
}

export interface CheckReport {
  errors: string[];
  notes: string[];
}

/** Offline: pins and manifests parse and agree, and every materialised body is the one its entry names. */
export function checkCore(root: string): CheckReport {
  const errors: string[] = [];
  const notes: string[] = [];
  let pins: FhirCorePin[];
  try {
    pins = readPins(root);
  } catch (e) {
    return { errors: [`${CORE_DIR}/${PINS_FILE}: ${(e as Error).message}`], notes };
  }
  const releaseDirs = new Set(pins.map((p) => RELEASE_DIR[p.release]));
  for (const ent of readdirSync(join(root, CORE_DIR), { withFileTypes: true })) {
    if (ent.isDirectory() && !releaseDirs.has(ent.name)) errors.push(`${CORE_DIR}/${ent.name}/: no pin names this release`);
  }
  for (const pin of pins) {
    const rel = `${CORE_DIR}/${RELEASE_DIR[pin.release]}/${MANIFEST_FILE}`;
    let m: FhirCoreReleaseManifest | null;
    try {
      m = readManifest(root, pin.release);
    } catch (e) {
      errors.push(`${rel}: ${(e as Error).message}`);
      continue;
    }
    if (!m) {
      errors.push(`${rel}: missing — run \`fhir-core.ts index --release ${pin.release}\` (an unreachable package writes an unread manifest, never none)`);
      continue;
    }
    if (m.release !== pin.release || m.fhirVersion !== pin.fhirVersion || JSON.stringify(m.package) !== JSON.stringify(pin.package)) {
      errors.push(`${rel}: names ${m.package.name}#${m.package.version} (${m.package.shasum}), not the pin's ${pin.package.name}#${pin.package.version} (${pin.package.shasum}); re-run index`);
    }
    if (m.status === "unread") {
      notes.push(`${pin.release}: unread — ${m.reason}`);
      continue;
    }
    const dir = join(root, CORE_DIR, RELEASE_DIR[pin.release]);
    const listed = new Set(m.definitions.map((d) => d.file));
    let present = 0;
    for (const d of m.definitions) {
      const p = join(dir, d.file);
      if (!existsSync(p)) continue;
      present++;
      if (sha256Hex(readFileSync(p)) !== d.sha256) errors.push(`${CORE_DIR}/${RELEASE_DIR[pin.release]}/${d.file}: bytes are not the package's (sha256 differs from the manifest)`);
    }
    for (const f of readdirSync(dir)) {
      if (f !== MANIFEST_FILE && !listed.has(f)) errors.push(`${CORE_DIR}/${RELEASE_DIR[pin.release]}/${f}: no manifest entry names it`);
    }
    notes.push(`${pin.release}: ${m.definitions.length} definitions, ${present} materialised`);
  }
  return { errors, notes };
}

export type Resolution =
  | { status: "found"; release: FhirRelease; path: string; definition: CoreDefinition }
  | { status: "absent"; release: FhirRelease }
  | { status: "undetermined"; release: FhirRelease; reason: string };

/** Where a canonical URL's StructureDefinition is kept for one release. */
export function resolveCanonical(root: string, url: string, release: FhirRelease): Resolution {
  const canonical = url.split("|")[0] ?? url;
  let m: FhirCoreReleaseManifest | null;
  try {
    m = readManifest(root, release);
  } catch (e) {
    return { status: "undetermined", release, reason: (e as Error).message };
  }
  if (!m) return { status: "undetermined", release, reason: "no manifest" };
  if (m.status === "unread") return { status: "undetermined", release, reason: `unread: ${m.reason}` };
  const d = m.definitions.find((x) => x.url === canonical);
  if (!d) return { status: "absent", release };
  const path = join(root, CORE_DIR, RELEASE_DIR[release], d.file);
  if (!existsSync(path)) return { status: "undetermined", release, reason: `${d.file} is not materialised; run \`fhir-core.ts materialise --release ${release}\`` };
  return { status: "found", release, path, definition: d };
}

function arg(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

export async function main(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  const root = resolve(arg(rest, "--root") ?? LAYER_ROOT);
  const relArg = arg(rest, "--release");
  const parsedRelease = relArg === undefined ? undefined : FhirReleaseSchema.safeParse(relArg.toUpperCase());
  if (parsedRelease && !parsedRelease.success) {
    console.error(`--release must be one of ${FhirReleaseSchema.options.join(", ")}`);
    return 2;
  }
  const release = parsedRelease?.data;
  const tgzDir = arg(rest, "--tgz-dir");
  switch (cmd) {
    case "index":
      return (await indexReleases(root, { release, tgzDir })) ? 1 : 0;
    case "materialise":
      return (await materialiseReleases(root, { release, tgzDir })) ? 2 : 0;
    case "check": {
      const r = checkCore(root);
      for (const n of r.notes) console.log(n);
      for (const e of r.errors) console.error(`error: ${e}`);
      return r.errors.length ? 1 : 0;
    }
    case "resolve": {
      const url = rest.find((a, i) => !a.startsWith("--") && !(rest[i - 1] ?? "").startsWith("--"));
      if (!url) {
        console.error("resolve needs a canonical URL");
        return 2;
      }
      const r = resolveCanonical(root, url, release ?? "R4");
      if (r.status === "found") console.log(r.path);
      else console.error(r.status === "absent" ? `${r.release} holds no ${url}` : `could not determine: ${r.reason}`);
      return r.status === "found" ? 0 : r.status === "absent" ? 1 : 2;
    }
    default:
      console.error("usage: fhir-core.ts index|materialise|check|resolve <url> [--root DIR] [--release R4|R4B|R5] [--tgz-dir DIR]");
      return 2;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
