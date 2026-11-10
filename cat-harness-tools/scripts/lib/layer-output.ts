/**
 * Where a step writes, and reads back, a file it COMPUTES for a layer: one
 * output root per layer, outside the mounts.
 *
 * @module scripts/lib/layer-output
 * @graphNode none — a path resolver every writer of a layer's computed files calls
 *
 * Owner ruling on bean `cat-tools-sm8r`, item 4 ("no CI step writes inside a
 * mount"), planned in the bean before any code. A mounted layer is
 * READ-ONLY in a checkout that mounts it: its directory holds the pinned
 * bytes and nothing else, so `mount-from-lock.sh --check` stays `current`
 * after a local gate run, and no later `state:mount` refuses an "edited"
 * mount. Measured 2026-11-06: earlier jobs' writers (the IG index, the QA
 * working copy, glossary pages, the docs) wrote into every mounted layer and
 * reddened all eight `state:mount` steps of a local run.
 *
 * ## The rule
 *
 * - A **mounted** layer (one the checkout's `index.lock.json` lists with a
 *   mount path): its computed files go under
 *   `build/layers/<instance>/<the same instance-relative path>`.
 * - A **local** layer (the checkout's own, `source.local`): its computed
 *   files go where they always have, inside the layer. A layer building
 *   itself changes nothing.
 *
 * Reading is an OVERLAY: the output root when the file is there, else the
 * layer's own path, which for a mount is the pinned bytes.
 *
 * Nothing else may join a layer path to a computed file; the write-site
 * check that enforces that is plan step 1's second half.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { inputSiteReached } from "../../schemas/sdlc/input-trace.js";

/** The directory, under the checkout root, that holds every mounted layer's computed files. */
// input-site: inert #ccbbe842 — names where a writer WRITES; the one read of it, in readPathFor, reports itself to the input trace
export const LAYER_OUTPUT_ROOT = "build/layers";

/** The parts of an `index.lock.json` layer entry this module reads. */
interface LockInstance {
  instance: string;
  path?: string;
}

/**
 * The checkout's MOUNTED layers, as `instance → mount path` (relative to
 * the root). Read from `index.lock.json`; a checkout with no lock mounts
 * nothing, so the map is empty and every layer is local.
 *
 * Throws on a lock that is present but does not parse: treating an
 * unreadable lock as "nothing mounted" would send every write into the
 * mounts, the very thing this module exists to stop.
 */
export function mountedInstances(root: string): Map<string, string> {
  const file = join(resolve(root), "index.lock.json");
  const out = new Map<string, string>();
  if (!existsSync(file)) return out;
  let lock: { instances?: LockInstance[] };
  try {
    lock = JSON.parse(readFileSync(file, "utf-8")) as typeof lock;
  } catch (e) {
    throw new Error(`${file} does not parse, so which instances are mounted cannot be determined: ${String(e)}`);
  }
  for (const i of lock.instances ?? []) {
    if (typeof i.instance === "string" && typeof i.path === "string" && i.path !== "") out.set(i.instance, i.path);
  }
  return out;
}

/** One layer as a writer names it: its name, and its path in the checkout (relative to the root). */
export interface LayerRef {
  instance: string;
  /** Where the layer's files are in the checkout: its mount path, or the local layer's directory ("" or "." for the root). */
  path: string;
}

/**
 * Where a writer writes `rel` (instance-relative) for `layer`: under
 * {@link LAYER_OUTPUT_ROOT} when the layer is mounted, else inside the
 * layer. Pass `mounted` to avoid re-reading the lock in a loop.
 */
export function outputPathFor(root: string, layer: LayerRef, rel: string, mounted: Map<string, string> = mountedInstances(root)): string {
  const r = resolve(root);
  return mounted.has(layer.instance) ? join(r, LAYER_OUTPUT_ROOT, layer.instance, rel) : join(r, layer.path, rel);
}

/**
 * Where a reader reads `rel` for `layer`: the output root when a writer put
 * the file there, else the layer's own path (for a mount, the pinned bytes).
 */
export function readPathFor(root: string, layer: LayerRef, rel: string, mounted: Map<string, string> = mountedInstances(root)): string {
  const computed = outputPathFor(root, layer, rel, mounted);
  // A computed file is build output, which the tree digest leaves out, so a
  // check that reads one cannot be skipped on its fingerprint.
  if (mounted.has(layer.instance)) inputSiteReached(`layer-output: ${layer.instance}/${rel}`);
  return existsSync(computed) ? computed : join(resolve(root), layer.path, rel);
}
