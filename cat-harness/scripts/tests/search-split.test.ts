/**
 * search-split — the site index cut into one index per scope (bean `m7mn`,
 * issue #1972 step A).
 *
 * What must hold for a reader's search to stay correct when it loads a scope
 * instead of the whole: every entry lands in exactly ONE scope (the scopes
 * partition the source), the scope rule reads only declared facts, and the
 * output is the same bytes for the same index.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  MANIFEST_SCHEMA,
  PLATFORM,
  SCOPES_DIR,
  SOURCE_PATH,
  declaredInstanceNames,
  render,
  scopeOf,
  split,
  type SearchManifest,
} from "../search-split.ts";

const INSTANCES = new Set(["smart-trust", "who-iris"]);
const LOCALES = new Set(["fr", "ar"]);

describe("scopeOf", () => {
  test("an instance route is that instance's scope", () => {
    expect(scopeOf("/smart-trust/artifacts.html#x", INSTANCES, LOCALES)).toEqual({ id: "smart-trust", kind: "instance" });
  });
  test("a kind route (/<kind>/<instance>/…) is the instance's scope too", () => {
    expect(scopeOf("/library/who-iris/item.html", INSTANCES, LOCALES)).toEqual({ id: "who-iris", kind: "instance" });
  });
  test("a target-locale prefix is that locale's scope", () => {
    expect(scopeOf("/fr/getting-started.html", INSTANCES, LOCALES)).toEqual({ id: "locale-fr", kind: "locale" });
  });
  test("anything else is the platform's", () => {
    for (const u of ["/", "/reference/x.html", "/es/page.html", ""]) {
      expect(scopeOf(u, INSTANCES, LOCALES)).toEqual({ id: PLATFORM, kind: "platform" });
    }
  });
  test("the first segment wins over the second", () => {
    // `/fr/smart-trust/` is a French page that mentions the instance in its path.
    expect(scopeOf("/fr/smart-trust/x.html", INSTANCES, LOCALES).id).toBe("locale-fr");
  });
});

const INDEX = {
  "0": { title: "Home", relUrl: "/" },
  "1": { title: "Trust", relUrl: "/smart-trust/index.html" },
  "2": { title: "Trust 2", relUrl: "/smart-trust/a.html#b" },
  "3": { title: "Accueil", relUrl: "/fr/index.html" },
  "4": { title: "IRIS", relUrl: "/library/who-iris/" },
  "5": { title: "No url" },
};

describe("split", () => {
  test("partitions: every entry in exactly one scope, keys kept", () => {
    const parts = split(INDEX, INSTANCES, LOCALES);
    const keys = [...parts.values()].flatMap((p) => Object.keys(p.entries)).sort();
    expect(keys).toEqual(Object.keys(INDEX).sort());
    expect(Object.keys(parts.get("smart-trust")!.entries)).toEqual(["1", "2"]);
    expect(Object.keys(parts.get(PLATFORM)!.entries)).toEqual(["0", "5"]);
  });
});

describe("render", () => {
  const text = JSON.stringify(INDEX);
  const files = render(text, INSTANCES, LOCALES);
  const manifest = JSON.parse(files.get(`${SCOPES_DIR}/manifest.json`)!) as SearchManifest;

  test("the manifest names every scope file and partitions the source", () => {
    expect(manifest.$schema).toBe(MANIFEST_SCHEMA);
    expect(manifest.source.path).toBe(SOURCE_PATH);
    expect(manifest.source.entries).toBe(6);
    expect(manifest.scopes.reduce((n, s) => n + s.entries, 0)).toBe(6);
    for (const s of manifest.scopes) {
      const body = files.get(s.path)!;
      expect(Object.keys(JSON.parse(body)).length).toBe(s.entries);
      expect(Buffer.byteLength(body)).toBe(s.bytes);
    }
    expect(manifest.scopes.map((s) => s.id)).toEqual(["_platform", "locale-fr", "smart-trust", "who-iris"]);
  });

  test("deterministic: the same index gives the same bytes", () => {
    const again = render(text, INSTANCES, LOCALES);
    expect([...again.entries()]).toEqual([...files.entries()]);
  });

  test("the source hash changes with the source", () => {
    const other = render(JSON.stringify({ ...INDEX, "6": { relUrl: "/x" } }), INSTANCES, LOCALES);
    const m2 = JSON.parse(other.get(`${SCOPES_DIR}/manifest.json`)!) as SearchManifest;
    expect(m2.source.sha256).not.toBe(manifest.source.sha256);
  });
});

describe("the CLI", () => {
  const script = resolve(import.meta.dir, "..", "search-split.ts");
  test("writes, then --check is current; a changed scope file is stale", () => {
    const dir = mkdtempSync(join(tmpdir(), "search-split-"));
    try {
      mkdirSync(join(dir, "assets/js"), { recursive: true });
      writeFileSync(join(dir, SOURCE_PATH), JSON.stringify(INDEX));
      const run = (...a: string[]) => Bun.spawnSync(["bun", "run", script, "--dir", dir, ...a]);
      expect(run().exitCode).toBe(0);
      expect(run("--check").exitCode).toBe(0);
      const m = JSON.parse(readFileSync(join(dir, SCOPES_DIR, "manifest.json"), "utf-8")) as SearchManifest;
      writeFileSync(join(dir, m.scopes[0]!.path), "{}");
      expect(run("--check").exitCode).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a tree with no index is refused, not split into nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "search-split-empty-"));
    try {
      expect(Bun.spawnSync(["bun", "run", script, "--dir", dir]).exitCode).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

test("this checkout's declared instances include the ones the site mounts", () => {
  const names = declaredInstanceNames(resolve(import.meta.dir, "..", "..", ".."));
  for (const n of ["smart-trust", "smart-base", "bootstrap"]) expect(names.has(n)).toBe(true);
});
