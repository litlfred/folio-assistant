/**
 * Diff the two ways `walkBlocks` can establish a block's identity, over a real
 * corpus.
 *
 * `walkBlocks` reads each block's `kind` and `label` out of its source text.
 * With `{ verify: true }` it imports the module instead and uses what the
 * builder validated. The textual read is wrong in three demonstrated ways —
 * see `scripts/tests/block-walk-verify.test.ts` — but *how often* it is wrong
 * on real content is a question about the content, not about the code, and the
 * corpora live in folio repositories rather than here.
 *
 * So this exists to answer it in one command, before the default is flipped:
 *
 * ```sh
 * bun run content/pipeline/verify-block-walk.ts ../qou/content/qou
 * ```
 *
 * It prints every disagreement, every block that could not be imported, and
 * what the flip would cost in wall-clock. That is the evidence the decision
 * wants. This repo has twice learned the lesson the hard way: `#125` let a
 * non-block into the walk, `qou/3fui` kept 63 real ones out, and in the second
 * case the measurement *reversed* the recommendation the change was argued on.
 *
 * Exit code is 0 whatever it finds — this reports, it does not gate.
 *
 * @module content/pipeline/verify-block-walk
 */

import { resolve } from "path";
import { existsSync } from "fs";
import { walkBlocks, type BlockPaths } from "./qa-utils";
import type { BlockLoadFailure } from "./block-module";

const root = process.argv[2];
if (!root) {
  console.error(
    "usage: bun run content/pipeline/verify-block-walk.ts <content-root>\n" +
      "  e.g. bun run content/pipeline/verify-block-walk.ts ../qou/content/qou",
  );
  process.exit(2);
}
const rootAbs = resolve(root);
if (!existsSync(rootAbs)) {
  console.error(`No such directory: ${rootAbs}`);
  process.exit(2);
}

/** Both modes include unlabelled prose, so the comparison covers what qa-sweep sees. */
const OPTS = { includeUnlabelled: true } as const;

const byPath = (blocks: BlockPaths[]): Map<string, BlockPaths> =>
  new Map(blocks.map((b) => [b.ts, b]));

const t0 = Bun.nanoseconds();
const textual = byPath([...walkBlocks(rootAbs, OPTS)]);
const t1 = Bun.nanoseconds();

const failures: BlockLoadFailure[] = [];
const verified = byPath([
  ...walkBlocks(rootAbs, { ...OPTS, verify: true, onLoadFailure: (f) => failures.push(f) }),
]);
const t2 = Bun.nanoseconds();

const ms = (a: number, b: number): string => ((b - a) / 1e6).toFixed(0);

console.log(`\ncorpus: ${rootAbs}`);
console.log(`  textual walk : ${textual.size} blocks in ${ms(t0, t1)} ms`);
console.log(`  verified walk: ${verified.size} blocks in ${ms(t1, t2)} ms\n`);

/** In the verified walk but not the textual one — a block nothing sweeps today. */
const onlyVerified = [...verified.keys()].filter((p) => !textual.has(p));
/** In the textual walk but not the verified one — would be lost by the flip. */
const onlyTextual = [...textual.keys()].filter((p) => !verified.has(p));
/** Present in both, but the identity differs. */
const disagree = [...verified.entries()].flatMap(([path, v]) => {
  const t = textual.get(path);
  if (!t) return [];
  if (t.label === v.label && t.kind === v.kind) return [];
  return [{ path, textual: t, verified: v }];
});

const section = (title: string, n: number): void =>
  console.log(`${n === 0 ? "  ✓" : "  ✗"} ${title}: ${n}`);

section("blocks only the verified walk finds", onlyVerified.length);
for (const p of onlyVerified) console.log(`        + ${verified.get(p)!.label}  ${p}`);

section("blocks only the textual walk finds", onlyTextual.length);
for (const p of onlyTextual) console.log(`        - ${textual.get(p)!.label}  ${p}`);

section("blocks whose identity differs", disagree.length);
for (const d of disagree) {
  console.log(
    `        ${d.textual.kind} ${d.textual.label}  ->  ${d.verified.kind} ${d.verified.label}\n` +
      `          ${d.path}`,
  );
}

section("blocks that would not import", failures.length);
for (const f of failures) console.log(`        ${f.file}\n          ${f.error}`);

const clean =
  onlyVerified.length === 0 &&
  onlyTextual.length === 0 &&
  disagree.length === 0 &&
  failures.length === 0;

console.log(
  clean
    ? `\nThe two walks agree on every block. Flipping \`verify\` on by default ` +
        `costs ${ms(t1, t2)} ms instead of ${ms(t0, t1)} ms and changes nothing else ` +
        `about this corpus.\n`
    : `\nThe walks disagree. Each line above is a block some QA tool is currently ` +
        `keyed to the wrong identity for, missing entirely, or unable to load — ` +
        `read them before flipping the default.\n`,
);
