/**
 * Each writer regen runs REPAIRS its check — measured on a staled artefact.
 *
 * Bean `i1q7`. `regen-after-merge.test.ts` asserts the PAIRING: that a check
 * names a writer that exists. That is the assertion that passed while
 * `translate-bpmn:bootstrap` printed "Nothing to do" and wrote nothing, so the
 * pairing was right by name and wrong in effect. This file asserts the effect:
 * stale one artefact on purpose, confirm the check goes red, let regen's own
 * pass run the writer it pairs from `package.json`, and confirm the check goes
 * green. Every artefact is restored to its exact bytes afterwards, so the test
 * leaves the tree as it found it (the gate runner's mutation guard checks).
 *
 * ## Why these pairs and not all of them
 *
 * Running every one of the ~90 writers over a staled fixture is a full regen
 * (5–6 minutes), and most writers have no single artefact a test can stale
 * without knowing the generator. These are the pairs MEASURED broken under
 * regen on 2026-10-01 — each one a merge where `bun run regen` left a gate red
 * and a person ran the writer by hand — plus the root `translate-bpmn` pair as
 * the control the bootstrap one should have matched. The class-wide guard is
 * the runtime one: a writer that exits non-zero is reported `writer-failed` by
 * regen itself, for every pair, rather than read as a real defect.
 *
 * Moved here from `cat-harness/scripts/tests/regen-writers.test.ts` to the
 * checkout's own test home `test/` (bean `7zz1`, owner ruling 2026-10-06
 * "Top-level instance"): every test in it runs the checkout's real regen
 * writers, whose artefacts span instances (`bat:sync` wraps scripts in
 * folio-assistant-sci and the root `.claude/`), which only the whole checkout
 * holds. Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. Paths are
 * composed from ORIGIN_DIR, the directory it was written in, so nothing it
 * reads changed.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { regenPass, writerFor, type Runner } from "../cat-harness/scripts/regen-after-merge.ts";
import { chromiumExecutable } from "../cat-harness/scripts/bpmn-render.ts";
import { repoRootFor } from "../cat-harness/schemas/cat-harness.ts";

/** The directory this test was written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move to the checkout's test home (bean `7zz1`). */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");


const REPO = repoRootFor(join(ORIGIN_DIR, "..", ".."));
const SCRIPTS = (JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8")) as {
  scripts: Record<string, string>;
}).scripts;

const runner: Runner = (script) => spawnSync("bun", ["run", script], { cwd: REPO, encoding: "utf-8" }).status === 0;

/** The first file in a directory with this suffix, so a rename does not silently skip the case. */
function firstIn(dir: string, suffix: string): string {
  const f = readdirSync(join(REPO, dir)).filter((n) => n.endsWith(suffix)).sort()[0];
  if (f === undefined) throw new Error(`no *${suffix} under ${dir} — the fixture this case stales is gone`);
  return join(dir, f);
}

/** The outermost ancestor of `abs` that does not exist yet (it may be `abs` itself). */
function firstMissingAncestor(abs: string): string {
  let p = abs;
  while (!existsSync(dirname(p))) p = dirname(p);
  return p;
}

function hasBrowser(): boolean {
  if (chromiumExecutable() !== undefined) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { chromium } = require("playwright") as typeof import("playwright");
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}

interface Case {
  check: string;
  /** Repo-relative path of the artefact staled. */
  artefact: () => string;
  /** Turn the committed bytes into a version no writer would emit. */
  stale: (text: string) => string;
  needsBrowser?: boolean;
}

const CASES: Case[] = [
  {
    check: "translate-bpmn:bootstrap:check",
    artefact: () => firstIn("cat-harness/translations/es/bootstrap/processes", ".pot"),
    stale: (t) => `${t}\nmsgid "a string no diagram carries (i1q7 fixture)"\nmsgstr ""\n`,
  },
  {
    check: "translate-bpmn:check",
    artefact: () => firstIn("cat-harness/translations/es/processes", ".pot"),
    stale: (t) => `${t}\nmsgid "a string no diagram carries (i1q7 fixture)"\nmsgstr ""\n`,
  },
  // `check:published-instance-exports` was a case here, staling
  // `test/results/kg-export.bootstrap.qa-results.json`. Since bean `5hox` that
  // directory declares `storage`: the check reads its baseline from the
  // `qa-reports` branch (`--against`) or reports UNKNOWN, and a staled WORKING
  // copy is no longer a record it can go red on. Staleness of a stored file is
  // not a regen question; the record is written by `qa-publish`.
  {
    check: "bat:sync:check",
    artefact: () => firstIn("cat-harness/scripts", ".bat"),
    stale: (t) => `${t}REM hand edit (i1q7 fixture)\r\n`,
  },
  {
    check: "render:bpmn:check",
    artefact: () => firstIn("cat-harness/docs/assets/img/workflows", ".svg"),
    stale: (t) => t.replace("</svg>", "<!-- stale (i1q7 fixture) --></svg>"),
    needsBrowser: true,
  },
];

describe("every writer regen pairs for these gates turns a STALED artefact's check green (bean i1q7)", () => {
  const browser = hasBrowser();
  for (const c of CASES) {
    test.skipIf(c.needsBrowser === true && !browser)(
      `${c.check}: red on a staled artefact, green after regen runs \`${writerFor(SCRIPTS, c.check) ?? "(none)"}\``,
      async () => {
        const writer = writerFor(SCRIPTS, c.check);
        expect(writer, `${c.check} has no writer regen can run`).toBeDefined();
        const rel = c.artefact();
        const abs = join(REPO, rel);
        // A derived QA artefact may be absent — the committed corpus is
        // leaving `main` (bean `cxcn`, reader audit F7). Then the WRITER
        // produces it fresh first, and the directory it had to create is
        // removed afterwards, so the test asserts on a fresh run rather than
        // on the committed copy, and leaves the checkout as it found it.
        const createdDir = existsSync(abs) ? undefined : firstMissingAncestor(abs);
        if (createdDir !== undefined) expect(runner(writer!), `${writer} could not produce ${rel}`).toBe(true);
        const original = readFileSync(abs, "utf-8");
        const staled = c.stale(original);
        expect(staled, `the fixture did not change ${rel}`).not.toBe(original);
        try {
          writeFileSync(abs, staled);
          // The control: without it a check that is ALWAYS green would pass this test.
          expect(runner(c.check), `${c.check} did not go red on a staled ${rel}`).toBe(false);
          const { results } = await regenPass([{ check: c.check, writer }], runner);
          expect(results[0]).toEqual({ check: c.check, writer, outcome: "regenerated" });
          expect(readFileSync(abs, "utf-8"), `${writer} left ${rel} staled`).not.toBe(staled);
        } finally {
          if (createdDir !== undefined) rmSync(createdDir, { recursive: true, force: true });
          else writeFileSync(abs, original);
        }
      },
      120_000,
    );
  }
});
