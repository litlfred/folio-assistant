#!/usr/bin/env bun
/**
 * Regenerate everything adding a skill stales — one command, bean `v625`.
 *
 * ## Why this exists rather than a documented list
 *
 * `v625` cost twice in one hour on 2026-09-26. Six skills reached `main` with
 * no package-manifest entry and no reference page; the fix merged; forty
 * minutes later a seventh landed with the same gap, from a different session.
 *
 * The second one rules out documentation as the remedy. The commit that fixed
 * the first six wrote the chain out in full, and it was written **before** the
 * next author needed it. Prose in a merged commit is not reachable from the
 * moment of authoring — so the remedy has to be a command, not a paragraph.
 *
 * ## The list was DERIVED BY EXPERIMENT, and my remembered one was wrong
 *
 * This matters more than the list. Three times before measuring, this chain
 * was written down from memory of incidents, and each time it was wrong:
 *
 * - it named `gen-docs-pages`, `docs:harness`, `translation:index` and
 *   `state:visualizer`, **none of which adding a skill stales**. They had gone
 *   red in the same sessions for unrelated reasons and were attributed here.
 * - it omitted `glossary:page`, `docs:auto`, `kg:audit` and `kg:detangle`,
 *   **all four of which it does stale**. Two were already red on a red `main`,
 *   so they were filtered out as "not mine"; two were masked (below).
 *
 * The method that worked: add a throwaway skill to a green tree, run each
 * check **individually**, and subtract a baseline measured the same way.
 *
 * ## `bun run gates` CANNOT derive this, and that is the subtle part
 *
 * The first experiment ran `gates` and reported four stale artefacts.
 * `kg:audit:check` and `kg:detangle:check` were green in it — and red when run
 * on their own against the identical tree. `bun test` runs those writers, so
 * by the time the checks execute the artefacts have been repaired. That is
 * bean `ymsu`'s blind spot: a gate that writes what a later gate reads.
 *
 * Running the checks in sequence perturbs too — a later loop found
 * `kg:audit:check` green again, because something earlier in it wrote.
 * **Only an isolated run of one check against a known tree measures anything**,
 * which is why the table below cites per-check runs and not a `gates` summary.
 *
 * ## The five, each measured alone, red before and green after
 *
 * | writer | the check it clears |
 * |---|---|
 * | `gen-skill-docs.ts` | `gen-skill-docs.ts --check` |
 * | `glossary:page` | `check:glossary` |
 * | `docs:auto` | `docs:auto:check` |
 * | `kg:audit` | `kg:audit:check` |
 * | `kg:detangle` | `kg:detangle:check` |
 *
 * `check:ci-invocations` also goes green, and is not a sixth step: it re-runs
 * the CI invocations, one of which is `gen-skill-docs --check`, so it is
 * downstream of step 1 rather than an obligation of its own.
 *
 * ## They are NOT order-dependent, and the earlier claim that they were is wrong
 *
 * Measured by running all five in reverse and re-checking: still green. An
 * earlier session asserted this chain was order-sensitive. The ordering it
 * observed is real but belongs to a **different pair** — `gen-docs-pages`
 * writes what `docs:harness` reads — and neither is in this chain. The claim
 * was true of something else and attached to this.
 *
 * The fixed order below is for deterministic output, not dependency.
 *
 * ## What it does not do
 *
 * It does not add the package-manifest entry. That is the author's assertion
 * that the file is a skill of that package, not a derivable fact, and a
 * command that guessed it would register files someone was still drafting.
 * `skill package manifests cover the package` fails loudly when it is missing,
 * and this script says so rather than papering over it.
 *
 * @module scripts/skill-register
 * @covers cat-harness
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildQaResult, writeQaResult } from "./qa-results.js";

/**
 * This instance's root — `cat-harness/`, one level up from `scripts/`.
 *
 * NOT `process.cwd()`, and that is a correction rather than a preference.
 * `writeQaResult` composes `<root>/test/results/`, so a cwd-relative root puts
 * the sidecar wherever the command happened to be invoked from — measured:
 * run from the repository root it landed in a fresh top-level `test/results/`,
 * a directory no instance declares and no sweep reads. Every sibling here
 * derives the root from its own module path for that reason
 * (`check-layout-norms.ts`, `check-harness-state.ts`), so the sidecar goes to
 * the same place whoever runs the command and from wherever.
 */
const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** One regeneration step: the writer, and the check that proves it landed. */
interface Step {
  /** What to run, as `bun run` arguments. */
  readonly write: readonly string[];
  /** The same program asking rather than writing — the repo-wide `--check` convention. */
  readonly verify: readonly string[];
  /** Why this is in the chain, so a reader can re-derive rather than trust. */
  readonly because: string;
}

/**
 * The chain. Hand-declared, because no file states which artefacts a skill
 * feeds — but every entry was measured red-then-green in isolation, and
 * {@link main} re-proves sufficiency at runtime rather than asserting it.
 */
export const STEPS: readonly Step[] = [
  {
    write: ["cat-harness/scripts/gen-skill-docs.ts"],
    verify: ["cat-harness/scripts/gen-skill-docs.ts", "--check"],
    because: "the skill's published reference page",
  },
  {
    write: ["glossary:page"],
    verify: ["check:glossary"],
    because: "the glossary page and its SKOS projection",
  },
  {
    write: ["docs:auto"],
    verify: ["docs:auto:check"],
    because: "the generated docs index",
  },
  {
    write: ["kg:audit"],
    verify: ["kg:audit:check"],
    because: "the skill's kg-qa sidecar — masked inside `gates` by `bun test`",
  },
  {
    write: ["kg:detangle"],
    verify: ["kg:detangle:check"],
    because: "the skills subgraph gains a node, so its detangle sidecar moves",
  },
];

function run(args: readonly string[]): number {
  const r = spawnSync("bun", ["run", ...args], { stdio: "inherit" });
  return r.status ?? 1;
}

/**
 * The flags, and why each exists rather than being inferred.
 *
 * `--check` predates the others: verify without writing. The rest were added
 * on the owner's instruction (2026-09-26) alongside the QA report and the gate,
 * because a command that only ever streams to a terminal cannot be read by CI,
 * by a sibling session, or by a person asking *"was this ever checked?"*.
 */
export interface Flags {
  /** Verify only — regenerate nothing. What CI runs. */
  check: boolean;
  /** Print the chain and exit 0. Writes nothing, verifies nothing. */
  dryRun: boolean;
  /** Emit the report as JSON on stdout instead of prose. Implies no colour, no prompts. */
  json: boolean;
  /** Skip the committed QA sidecar. For a scratch tree that must not be dirtied. */
  noReport: boolean;
}

export function parseFlags(argv: readonly string[]): Flags {
  return {
    check: argv.includes("--check"),
    dryRun: argv.includes("--dry-run"),
    json: argv.includes("--json"),
    noReport: argv.includes("--no-report"),
  };
}

/** One step's verdict, as the report and the JSON both carry it. */
export interface StepVerdict {
  /** The `--check` invocation, exactly as run. */
  verify: string;
  /** What staling it means for a reader — the step's own `because`. */
  because: string;
  /**
   * Was the check RUN at all? Emitted on every step, never left to absence.
   *
   * `--dry-run` produces `ran: false`, and a reader must be able to tell that
   * from a clean verify. An absent `current` would have carried that fact
   * implicitly, which is the rule this repository states on `hasInstructions`
   * in `kg-export`: absence must not be the carrier of a fact.
   */
  ran: boolean;
  /** `true` only when the check exited 0. Absent iff `ran` is false. */
  current?: boolean;
}

/**
 * Write the run's verdicts as a committed `qa-results/v1` sidecar.
 *
 * **Why a file and not just the console.** The five checks in this chain are the
 * only ones nothing else verifies UNMASKED — `bun test` runs the `kg-audit` and
 * `detangle` writers, so by the time `gates` reaches their checks the artefacts
 * are already repaired (bean `ymsu`). A printed verdict is gone the moment the
 * terminal scrolls, which makes *"never verified"* and *"verified clean"* the
 * same observation. That is the exact confusion this repository builds sidecars
 * to prevent.
 *
 * `ran: false` on every step is therefore a REAL state and not a placeholder:
 * it says the chain was listed and not run (`--dry-run`). It is emitted rather
 * than implied, because absence must not be the carrier of a fact.
 */
export function writeReport(root: string, verdicts: readonly StepVerdict[]): string {
  return writeQaResult(
    root,
    "skill-register",
    buildQaResult({
      script: "cat-harness/scripts/skill-register.ts",
      scriptAbsPath: fileURLToPath(import.meta.url),
      subject: { kind: "corpus", id: "skill-registration-chain" },
      families: {
        "registration-chain": {
          summary:
            "Each artefact that adding a skill stales, with the verdict of its own `--check` run " +
            "INDIVIDUALLY rather than through `bun run gates`. The distinction is the point: " +
            "`bun test` runs the kg-audit and detangle writers, so a gates run repairs two of " +
            "these before their checks read them and reports as current what is not (bean `ymsu`). " +
            "`ran: false` means the step was listed but not run — what `--dry-run` produces — and is " +
            "not a pass. It is emitted on every entry so that absence never carries that fact.",
          entries: verdicts as unknown[],
        },
      },
    }),
  );
}

function main(): number {
  const flags = parseFlags(process.argv);
  const checking = flags.check;

  if (process.argv.includes("--help")) {
    console.log(
      `skill-register — regenerate everything adding a skill stales (bean \`v625\`).\n\n` +
        `  bun run skill:register              regenerate, then verify\n` +
        `  bun run skill:register --check      verify only — what CI runs\n` +
        `  bun run skill:register --dry-run    print the chain; write and verify nothing\n` +
        `  bun run skill:register --json       emit the verdicts as JSON\n` +
        `  bun run skill:register --no-report  skip the committed QA sidecar\n\n` +
        `It deliberately does NOT add a package-manifest entry: which package a\n` +
        `file belongs to is your assertion, not a derivable fact.\n`,
    );
    return 0;
  }

  // The vacuity guard `gates.ts` argues for: a runner that executes an empty
  // list exits 0 and reads as a clean sweep. An empty chain is a defect in
  // this file, never a tree that needs nothing.
  if (STEPS.length === 0) {
    console.error("skill-register: the chain is empty — that is a bug here, not a clean tree.");
    return 1;
  }

  if (flags.dryRun) {
    // Listed, not run. The report records `current: undefined` for each, which
    // is a third state rather than a pass — see `writeReport`.
    const listed: StepVerdict[] = STEPS.map((st) => ({ verify: st.verify.join(" "), because: st.because, ran: false }));
    if (flags.json) console.log(JSON.stringify({ dryRun: true, steps: listed }, null, 2));
    else {
      console.log(`\nWould regenerate ${STEPS.length} artefact(s), then verify each:\n`);
      for (const st of listed) console.log(`  ${st.verify}\n      (${st.because})`);
      console.log("");
    }
    if (!flags.noReport) writeReport(INSTANCE_ROOT, listed);
    return 0;
  }

  if (!checking) {
    console.log(`\nRegenerating ${STEPS.length} artefact(s) that adding a skill stales.\n`);
    for (const s of STEPS) {
      console.log(`── ${s.write.join(" ")}   (${s.because})`);
      const rc = run(s.write);
      if (rc !== 0) {
        console.error(`\nskill-register: \`${s.write.join(" ")}\` exited ${rc}. Stopping.`);
        return rc;
      }
    }
  }

  // Verification is the point. The list above is hand-maintained and so can
  // UNDER-declare; this cannot make the command claim success falsely, because
  // what it reports is the checks' own verdicts rather than "I ran five things".
  if (!flags.json) console.log(`\nVerifying — each check run on its own, never through \`gates\`:\n`);
  const red: string[] = [];
  const verdicts: StepVerdict[] = [];
  for (const s of STEPS) {
    const rc = run(s.verify);
    verdicts.push({ verify: s.verify.join(" "), because: s.because, ran: true, current: rc === 0 });
    if (!flags.json) console.log(`${rc === 0 ? "  ✓" : "  ✗"} ${s.verify.join(" ")}`);
    if (rc !== 0) red.push(s.verify.join(" "));
  }

  // Written BEFORE the exit branches, so a red run is recorded rather than only
  // printed. A sidecar that exists only on success cannot distinguish "clean"
  // from "never ran".
  const reportAt = flags.noReport ? undefined : writeReport(INSTANCE_ROOT, verdicts);
  if (flags.json) {
    console.log(JSON.stringify({ checking, red, steps: verdicts, report: reportAt }, null, 2));
    return red.length > 0 ? 1 : 0;
  }
  if (reportAt !== undefined) console.log(`\n  report → ${reportAt}`);

  if (red.length > 0) {
    console.error(
      `\n${red.length} check(s) still red after regenerating:\n` +
        red.map((r) => `    ${r}`).join("\n") +
        `\n\nThe usual cause is a MISSING PACKAGE-MANIFEST ENTRY — this command\n` +
        `deliberately does not add one, because which package a file belongs to\n` +
        `is your assertion, not a derivable fact. Add the skill's slug to its\n` +
        `\`skills/<package>/package-manifest.json\` and run this again.\n\n` +
        `If the entry is there and a check is still red, the chain above is\n` +
        `incomplete: measure it by running that ONE check against a clean tree\n` +
        `with and without your skill. Do NOT measure through \`bun run gates\` —\n` +
        `\`bun test\` runs some of these writers and repairs what later gates\n` +
        `read (bean \`ymsu\`), so gates reports artefacts as current that are not.\n`,
    );
    return 1;
  }

  console.log(`\n✓ ${STEPS.length} artefact(s) current. Commit them with the skill.\n`);
  return 0;
}

if (import.meta.main) process.exit(main());
