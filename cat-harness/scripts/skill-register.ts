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
 * `check:ci-invocations` also goes green, and is not a step of its own: it
 * re-runs the CI invocations, one of which is `gen-skill-docs --check`, so it
 * is downstream of step 1.
 *
 * **`gen-uml-overview` was added as a sixth step on the day this shipped**, and
 * how it was missed is the same lesson one turn later. The per-check sweep that
 * derived the first five ran the checks IN SEQUENCE, and sequence perturbs —
 * something earlier in that loop wrote, so `uml:overview:check` read as green.
 * It surfaced an hour later when an ordinary skill EDIT moved the kg-qa and
 * detangle sidecars and the UML overview, which renders that tree, went stale
 * behind them.
 *
 * So the derivation method has a stated limit: isolating one check against a
 * known tree is necessary and was not sufficient, because a check can be
 * perturbed by a NEIGHBOUR in the same sweep. The runtime verification below is
 * what catches that — it reports the checks' verdicts, so an under-declared
 * list fails loudly rather than passing quietly.
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
 */
import { spawnSync } from "node:child_process";

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
  {
    write: ["cat-harness/scripts/gen-uml-overview.ts"],
    verify: ["uml:overview:check"],
    because: "the UML overview renders the QA tree the two steps above just wrote",
  },
];

function run(args: readonly string[]): number {
  const r = spawnSync("bun", ["run", ...args], { stdio: "inherit" });
  return r.status ?? 1;
}

function main(): number {
  const checking = process.argv.includes("--check");

  // The vacuity guard `gates.ts` argues for: a runner that executes an empty
  // list exits 0 and reads as a clean sweep. An empty chain is a defect in
  // this file, never a tree that needs nothing.
  if (STEPS.length === 0) {
    console.error("skill-register: the chain is empty — that is a bug here, not a clean tree.");
    return 1;
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
  console.log(`\nVerifying — each check run on its own, never through \`gates\`:\n`);
  const red: string[] = [];
  for (const s of STEPS) {
    const rc = run(s.verify);
    console.log(`${rc === 0 ? "  ✓" : "  ✗"} ${s.verify.join(" ")}`);
    if (rc !== 0) red.push(s.verify.join(" "));
  }

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
