/**
 * The `folio-run-context/v1` of one L1 extraction run — which checkout, which
 * mounts, which script and which inputs — built in TypeScript and VALIDATED
 * against cat-harness's own schema (`cat-harness/schemas/run-context.ts`).
 *
 * Nothing here adds a field. It is the TypeScript twin of cat-harness-tools'
 * `scripts/_run_context.py` (the writer the ingest scripts use): the same
 * `platform` / `mounts` / `invoker` / `inputs` rules, the same
 * `run-context.json` file name beside the output, and the reference computed
 * by cat-harness's own `runContextRef`, so a reader of either writer agrees
 * on the digest.
 *
 * A context changes on every commit (its `platform.commit` is the checkout's
 * HEAD), so the outputs a `--check` compares carry only the REFERENCE, and
 * `--check` ignores it — the same treatment `generatedAt` gets.
 *
 * @module smart-base/scripts/l1-run-context
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { RUN_CONTEXT_SCHEMA_TAG, RunContextSchema, runContextRef, type RunContext, type RunContextRef } from "../../cat-harness-tools/schemas/sdlc/run-context.ts";

export const RUN_CONTEXT_FILENAME = "run-context.json";

function git(cwd: string, ...args: string[]): string | undefined {
  try {
    const out = execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

const sha256File = (p: string): string | undefined => {
  try {
    return createHash("sha256").update(readFileSync(p)).digest("hex");
  } catch {
    return undefined;
  }
};

/** `test-run.ts#hashBasis`, byte for byte: sorted paths, each `path\0bytes\0`, 12-char prefix. */
export function hashBasis(root: string, paths: string[]): { hash: string; inputs: string[] } {
  const inputs = [...paths].sort();
  const h = createHash("sha256");
  for (const p of inputs) {
    let data: Buffer;
    try {
      data = readFileSync(join(root, p));
    } catch {
      return { hash: "unknown", inputs };
    }
    h.update(Buffer.concat([Buffer.from(p, "utf8"), Buffer.from([0]), data, Buffer.from([0])]));
  }
  return { hash: h.digest("hex").slice(0, 12), inputs };
}

/** `RunMountsSchema` for a checkout, from its `index.lock.json` — `_run_context.py#mounts_of`. */
export function mountsOf(root: string): RunContext["mounts"] {
  const lock = join(root, "index.lock.json");
  if (!existsSync(lock)) return { state: "could-not-determine", reason: `no index.lock.json at ${root}` };
  let doc: { instances?: { instance?: string; repository?: string; sha?: string }[] };
  try {
    doc = JSON.parse(readFileSync(lock, "utf8"));
  } catch (e) {
    return { state: "could-not-determine", reason: `index.lock.json will not parse: ${(e as Error).message}` };
  }
  const instances = (doc.instances ?? [])
    .filter((i) => i.instance && i.repository && i.sha)
    .map((i) => ({ instance: i.instance!, repository: i.repository!, sha: i.sha! }));
  if (!instances.length) return { state: "none" };
  return { state: "locked", lock: { file: "index.lock.json", sha256: sha256File(lock)! }, instances } as RunContext["mounts"];
}

/**
 * The context of a run of `script` over `inputs`, or `undefined` when no git
 * checkout can be named for `platform` (the schema has no state for that, so
 * the caller reports it instead of writing a context that lies).
 */
export function buildRunContext(script: string, inputs: string[], where: string): RunContext | undefined {
  const top = git(existsSync(where) ? where : dirname(where), "rev-parse", "--show-toplevel") ?? git(dirname(script), "rev-parse", "--show-toplevel");
  const sha = top ? git(top, "rev-parse", "HEAD") : undefined;
  if (!top || !sha || !/^[0-9a-f]{40}$/.test(sha)) return undefined;
  const rel = (p: string) => relative(top, resolve(p));
  const ctx = {
    $schema: RUN_CONTEXT_SCHEMA_TAG,
    platform: { commit: sha },
    mounts: mountsOf(top),
    releases: [],
    invoker: { kind: "system" as const, id: rel(script), script_hash: sha256File(script) ?? "unknown" },
    inputs: inputs.length ? [hashBasis(top, inputs.map(rel))] : [],
  };
  return RunContextSchema.parse(ctx);
}

/** Write `<dir>/run-context.json`; return the reference a record carries. */
export function writeRunContext(ctx: RunContext, dir: string): RunContextRef {
  writeFileSync(join(dir, RUN_CONTEXT_FILENAME), JSON.stringify(ctx, null, 2) + "\n");
  return runContextRef(ctx);
}

export { runContextRef, type RunContext, type RunContextRef };
