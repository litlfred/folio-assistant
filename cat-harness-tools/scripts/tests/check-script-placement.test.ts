/**
 * `check:script-placement` over a REMOTE-MOUNTED layer (owner, 2026-10-07,
 * "Option A, by reference"; issue #2467).
 *
 * A mounted instance's `package.json` is that layer's home for
 * `checkoutScripts` only when the mount lock lists it as an asset whose
 * sha256 matches the bytes on disk. A mismatch, or a manifest the lock does
 * not list, is could-not-determine (exit 2), never a silent pass. The lock is
 * written by hand here: the gate reads locks and never the network, and the
 * mount itself is tested in `cat-harness/scripts/tests/remote-mount.test.ts`.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { layersOf, placementVerdict } from "../check-script-placement.ts";

let base: string;
let n = 0;
beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "script-placement-test-"));
});
afterAll(() => rmSync(base, { recursive: true, force: true }));

const MANIFEST = JSON.stringify({ name: "core", checkoutScripts: { "core:run": "bun run core/scripts/run.ts" } }, null, 2) + "\n";
const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");

function put(root: string, rel: string, body: string): void {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
}

/** A downstream with `core` mounted, locked with or without its manifest as an asset. */
function fixture(o: { asset: boolean; manifestOnDisk?: string }): string {
  const root = join(base, `down-${++n}`);
  put(root, "down.json", JSON.stringify({ name: "down", directories: [] }));
  put(root, "core/core.json", JSON.stringify({ name: "core", directories: [] }));
  put(root, "core/scripts/run.ts", "export const x = 1;\n");
  if (o.manifestOnDisk !== undefined) put(root, "core/package.json", o.manifestOnDisk);
  const lock = {
    $schema: "cat-harness-mount-lock/v1",
    mounts: [{ harness: "core", repository: "o/up", ref: "a".repeat(40) }],
    instances: [
      {
        instance: "core",
        repository: "o/up",
        sha: "a".repeat(40),
        upstreamRoot: "core",
        path: "core",
        via: "core",
        pinnedBy: "declared",
        declaration: { file: "core.json", sha256: "0".repeat(64) },
        directories: [],
        assets: o.asset ? [{ id: "manifest", path: "core/package.json", upstreamPath: "core/package.json", sha256: sha256(MANIFEST) }] : [],
      },
    ],
    unmounted: [],
  };
  put(root, "down.mount-lock.json", JSON.stringify(lock, null, 2));
  return root;
}

describe("check:script-placement over a remote-mounted layer", () => {
  test("a matching hash: the mounted layer is a home, and its script is placed there", () => {
    const root = fixture({ asset: true, manifestOnDisk: MANIFEST });
    expect(layersOf(root).has("core")).toBe(true);
    expect(placementVerdict(root)).toMatchObject({ exit: 0 });
  });

  test("a mismatched hash: could-not-determine, naming the manifest", () => {
    const root = fixture({ asset: true, manifestOnDisk: MANIFEST.replace("run.ts", "other.ts") });
    const v = placementVerdict(root);
    expect(v.exit).toBe(2);
    expect(v.lines.join("\n")).toContain("core/package.json");
    expect(v.lines.join("\n")).toContain("does not hash to the lock");
    // not a layer: nothing vouches for it as a home
    expect(layersOf(root).has("core")).toBe(false);
  });

  test("no asset in the lock: a manifest on disk is could-not-determine", () => {
    const root = fixture({ asset: false, manifestOnDisk: MANIFEST });
    const v = placementVerdict(root);
    expect(v.exit).toBe(2);
    expect(v.lines.join("\n")).toContain("does not list core/package.json as an asset");
  });

  test("no asset and no manifest: a determined none, and the gate passes", () => {
    const root = fixture({ asset: false });
    expect(placementVerdict(root).exit).toBe(0);
    expect(layersOf(root).has("core")).toBe(false);
  });
});
