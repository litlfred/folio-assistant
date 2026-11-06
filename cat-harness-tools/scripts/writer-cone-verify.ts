#!/usr/bin/env bun
/**
 * The writers' half of the rerun-and-measure dry run: after a FULL
 * `derive:publish`, which writers could the previous deploy's records have
 * skipped, and would skipping them have been right?
 *
 * @module cat-harness-tools/scripts/writer-cone-verify
 * @covers none — a measurement logged beside the deploy; it gates nothing and
 * its logic is covered by `scripts/tests/writer-cone.test.ts`
 *
 * It skips nothing and changes nothing: the full build already ran. It reads
 * the previous deploy's records (published at `writer-cone/records.json`
 * beside `build.json`) and judges each writer with `verifyWriters`. A
 * `skip-unsafe` writer is the number that must stay at zero before any writer
 * is actually skipped.
 *
 * Usage (from the index root, after derive:publish):
 *   bun run cat-harness-tools/scripts/writer-cone-verify.ts --prev <records.json> [--out verdicts.json] [--summary "$GITHUB_STEP_SUMMARY"]
 */
import { appendFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { declaredPlan, writersOf } from "./derive-at-publish.ts";
import { outputsByWriter } from "./derive-cache.ts";
import { FileDigests } from "./input-hash.ts";
import { scriptsOf } from "../schemas/sdlc/script-table.ts";
import { loadWriterRecords, verifySummary, verifyWriters, writerBase } from "./writer-cone.ts";

/** Every file under `paths` (files or directories), repo-relative. */
export function filesUnder(root: string, paths: readonly string[]): string[] {
  const out: string[] = [];
  const stack = paths.map((p) => join(root, p.replace(/\/$/, "")));
  while (stack.length) {
    const abs = stack.pop()!;
    if (!existsSync(abs)) continue;
    const st = statSync(abs);
    if (st.isDirectory()) for (const n of readdirSync(abs)) stack.push(join(abs, n));
    else if (st.isFile()) out.push(relative(root, abs).split("\\").join("/"));
  }
  return out.sort();
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const arg = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const root = resolve(arg("--root") ?? ".");
  const prevPath = arg("--prev");
  const prev = prevPath ? loadWriterRecords(root, resolve(prevPath)) : undefined;
  if (!prev) {
    const msg = `writer-cone-verify: no previous writer records${prevPath ? ` at ${prevPath}` : ""}: nothing to judge (a deploy before records, or another record version)\n`;
    process.stderr.write(msg);
    const s = arg("--summary");
    if (s) appendFileSync(s, `### Writers, rerun and measure — dry run (bean \`fwtz\`)\n\n${msg}`);
    process.exit(0);
  }
  const plan = declaredPlan(root);
  const writers = writersOf(plan);
  const byWriter = outputsByWriter(plan, root);
  const scripts = scriptsOf(root);
  const digests = new FileDigests(root);
  const verdicts = verifyWriters({
    prev,
    writers,
    base: (w) => writerBase(root, scripts, w, digests),
    root,
    digests,
    filesNow: (w) => filesUnder(root, byWriter.get(w) ?? []),
  });
  const out = arg("--out");
  if (out) writeFileSync(out, JSON.stringify({ prev: prev.sha, verdicts }, null, 2) + "\n");
  const text = verifySummary(verdicts, prev.sha);
  process.stderr.write(text);
  const s = arg("--summary");
  if (s) appendFileSync(s, text);
}
