#!/usr/bin/env bun
/**
 * Every artefact a NEW GRAPH KIND owes, performed and then verified — the
 * `skill:register` of kinds.
 *
 * @module scripts/kind-register
 * @covers cat-harness, kinds — it loads every declared kind node (which parses each against folio-graph-kind/v1) and checks each owes nothing
 *
 * ## The measurement that made this a command rather than a list
 *
 * Adding the `auto-docs` kind (#2022, bean `06e3`) I ran **six hand-picked
 * `check:*` commands** and every one passed. `bun run gates` then found **5
 * failures across 217**, and `bun test` found two more. Seven obligations, of
 * which a careful hand-picked subset found none:
 *
 * | obligation | found by | kind |
 * |---|---|---|
 * | `readme:subgraphs` — READMEs whose regions count files | `gates` | generated |
 * | `handler:index` — `published-graphs.md` | `gates` | generated |
 * | `docs:harness` — `docs/_data/harness.json`, read by the navbar | `gates` | generated |
 * | `navbar:include` — the generated nav partial | `gates` | generated |
 * | `avatars:css` — the stylesheet, both schemes | **`bun test`** | generated |
 * | the **avatar** — glyph, hue, a sentence | `gates` | **authored** |
 * | the **row** in `directory-conventions.md` | **`bun test`** | **authored** |
 *
 * `skill-registration`'s own record is that its equivalent list *"was recalled
 * wrong four times before it was measured"* (beans `v625`, `nfv3`). A command
 * is the remedy because **each stale artefact's failure names a generated file,
 * never the kind you added** — so the cause is invisible from the symptom.
 *
 * ## Why each check is run on its own, never through `gates`
 *
 * Bean `ymsu`: `bun test` runs some of these writers, so a `gates` run can
 * repair an artefact and then report it current. `skill:register` already
 * answers this by invoking each `--check` separately against the identical
 * tree, and this does the same. Two of the seven were found by `bun test` and
 * not by `gates`, which is that hazard from the other side.
 *
 * ## The two AUTHORED artefacts are reported, never written
 *
 * An avatar's hue is a design decision and a table row is prose. A command that
 * invented either would be worse than one that names them.
 *
 * ## The hue check this command DOES NOT have, and why
 *
 * It was going to fail on an exact hue collision — the one unambiguous case —
 * because the `auto-docs` glyph was first given tone **164**, 16° from
 * `requirements` at 148, and two green page-glyphs told apart only by bullets
 * versus ticks. No gate caught it; rendering them side by side did.
 *
 * **Running that rule over the real corpus killed it.** 11 exact collisions
 * across 58 kinds, and every one is deliberate: a shared hue marks a FAMILY.
 * Tone 28 is the work plan (`beans`, `bean-defs`, `attestations`,
 * `issue-marks`); tone 268 is the harness and its sources; and tone 199 settles
 * it beyond inference, because the convention is written into the data — both
 * `who-iris` and `smart-base` say *"in WHO blue"* in their own `reads` string.
 *
 * So hue is **reported and never graded**, all of it. A gate failing on 11
 * deliberate decisions is not a strict gate, it is a wrong one. And the
 * `auto-docs` defect was never "same hue" anyway: it was two similar GLYPHS at
 * similar hues, which no number over one field expresses. The clearance table
 * earns its place as input to the person choosing a tone — which is exactly
 * where {@link authoredGaps} sends them.
 *
 * Exit codes: 0 clean · 1 any stale artefact or any authored gap.
 */
import { spawnSync } from "node:child_process";

import { defaultGraphKinds } from "../schemas/cat-harness.js";
import { AVATARS, hasAvatar } from "../schemas/avatars.js";
import { documentedKinds, KIND_TABLE_DOC } from "./kind-table.ts";
// `folio` is registered by CORE as a load-time side effect, so the harness alone
// does not know it exists. Same import, same reason, as `check-declared-dirs`.
import "../schemas/folio-graph-kind.js";

export interface Step {
  /** What to run, as `bun run` arguments. */
  readonly write: readonly string[];
  /** The same question asked rather than written. */
  readonly verify: readonly string[];
  /** Why this is in the chain, so a reader can re-derive rather than trust. */
  readonly because: string;
}

/**
 * The five GENERATED obligations, in order.
 *
 * Hand-declared, because no file states which artefacts a kind feeds — but each
 * was measured stale-then-current on #2022 by adding one kind, and {@link main}
 * re-proves every one at runtime rather than asserting it here.
 */
export const STEPS: readonly Step[] = [
  {
    write: ["avatars:css"],
    verify: ["avatars:css:check"],
    because:
      "the avatar stylesheet, in BOTH colour schemes. Found by `bun test` and not by `gates` on #2022, " +
      "which is bean `ymsu` from the other side",
  },
  {
    write: ["docs:harness"],
    verify: ["docs:harness:check"],
    because: "`docs/_data/harness.json`, which the site navbar reads — so a missing kind is a missing tile",
  },
  {
    write: ["navbar:include"],
    verify: ["navbar:include:check"],
    because: "the generated navigation partial the theme includes",
  },
  {
    write: ["handler:index"],
    verify: ["handler:index:check"],
    because: "`docs/cat-harness/published-graphs.md`, the index of what this instance publishes",
  },
  {
    write: ["readme:subgraphs"],
    verify: ["readme:sync:check"],
    because:
      "the directory READMEs whose generated regions COUNT files. `readme:sync:check` rather than a " +
      "`readme:subgraphs:check`, because the regions are written by the sync and checked by it",
  },
] as const;

/** An artefact a person must write, and which kind owes it. */
export interface AuthoredGap {
  kind: string;
  owes: "avatar" | "kind-table-row";
  detail: string;
}

/**
 * The authored obligations, per registered kind.
 *
 * Reported against the KIND, which is the point: `avatars:css:check` fails
 * naming a stylesheet, and `graph-kind-docs.test.ts` fails naming a table, and
 * neither says which kind you added.
 */
export function authoredGaps(root?: string): AuthoredGap[] {
  const out: AuthoredGap[] = [];
  const documented = new Set(documentedKinds(root));
  for (const kind of defaultGraphKinds.names()) {
    if (!hasAvatar(kind)) {
      out.push({
        kind,
        owes: "avatar",
        detail:
          `no entry in \`schemas/avatars.ts\`. It needs a glyph (24x24 path data), a \`tone\` ` +
          `(hue, 0-359) and a \`reads\` sentence saying why that mark. Check the clearance report ` +
          `below before choosing the tone.`,
      });
    }
    if (!documented.has(kind)) {
      out.push({
        kind,
        owes: "kind-table-row",
        detail: `no row in \`${KIND_TABLE_DOC}\`. Columns: kind, declared by, contents, renderable.`,
      });
    }
  }
  return out;
}

/** Two kinds sharing a hue exactly, plus how close the nearest neighbour is. */
export interface HueReport {
  collisions: Array<{ tone: number; kinds: string[] }>;
  /** Every kind's nearest neighbour by hue, closest first. */
  nearest: Array<{ kind: string; neighbour: string; degrees: number }>;
}

/**
 * Hue clearance across the avatars.
 *
 * **Nothing here is a finding.** Measured over the real corpus: 11 exact
 * collisions across 58 kinds, every one deliberate, because a shared hue marks a
 * family — and two kinds say *"in WHO blue"* in their own `reads` string, so the
 * convention is in the data rather than inferred from it. A near-miss is no more
 * gradeable: hue is one of three signals and the glyph and the `reads` sentence
 * are the others.
 *
 * It is reported so the person choosing a tone can see the field they are
 * choosing in. Reading a number off this table is their judgement; a cutoff
 * would make it a gate's.
 */
export function hueReport(): HueReport {
  const byTone = new Map<number, string[]>();
  for (const [kind, a] of Object.entries(AVATARS)) {
    byTone.set(a.tone, [...(byTone.get(a.tone) ?? []), kind]);
  }
  const collisions = [...byTone.entries()]
    .filter(([, ks]) => ks.length > 1)
    .map(([tone, kinds]) => ({ tone, kinds: [...kinds].sort() }))
    .sort((a, b) => a.tone - b.tone);

  // Circular distance: 350 and 10 are 20 apart, not 340.
  const gap = (a: number, b: number): number => {
    const d = Math.abs(a - b) % 360;
    return Math.min(d, 360 - d);
  };
  const entries = Object.entries(AVATARS);
  const nearest = entries
    .map(([kind, a]) => {
      let neighbour = "";
      let degrees = 360;
      for (const [other, b] of entries) {
        if (other === kind) continue;
        const d = gap(a.tone, b.tone);
        if (d < degrees) {
          degrees = d;
          neighbour = other;
        }
      }
      return { kind, neighbour, degrees };
    })
    .sort((a, b) => a.degrees - b.degrees);
  return { collisions, nearest };
}

function run(args: readonly string[]): number {
  const r = spawnSync("bun", ["run", ...args], { stdio: "inherit", cwd: process.cwd() });
  return r.status ?? (r.error ? 128 : 0);
}

function verifyQuietly(args: readonly string[]): { code: number; output: string } {
  const r = spawnSync("bun", ["run", ...args], { encoding: "utf-8", cwd: process.cwd() });
  return { code: r.status ?? (r.error ? 128 : 0), output: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

export function main(argv: readonly string[]): number {
  const check = argv.includes("--check");
  const kinds = defaultGraphKinds.names();

  if (!check) {
    console.log(`Writing — ${STEPS.length} generated artefact(s) a graph kind owes:\n`);
    for (const s of STEPS) {
      const rc = run(s.write);
      if (rc !== 0) {
        console.error(`\n✗ \`bun run ${s.write.join(" ")}\` exited ${rc} — ${s.because}`);
        return 1;
      }
    }
  }

  // Each on its own, never through `gates` (bean `ymsu`).
  console.log(`\nVerifying — each check run on its own, never through \`gates\`:\n`);
  const red: string[] = [];
  for (const s of STEPS) {
    const { code, output } = verifyQuietly(s.verify);
    const name = s.verify.join(" ");
    if (code === 0) {
      console.log(`  ✓ ${name}`);
    } else {
      red.push(name);
      console.log(`  ✗ ${name} — ${s.because}`);
      for (const line of output.trim().split("\n").slice(-4)) console.log(`      ${line}`);
    }
  }

  const gaps = authoredGaps();
  const hues = hueReport();

  if (gaps.length > 0) {
    console.log(`\n${gaps.length} AUTHORED artefact(s) — a person writes these, this command does not:\n`);
    for (const g of gaps) console.log(`  · ${g.kind} owes its ${g.owes}: ${g.detail}`);
  }

  if (hues.collisions.length > 0) {
    // Reported, never graded: a shared tone marks a FAMILY. See `hueReport`.
    console.log(`\n${hues.collisions.length} shared tone(s) — a family colour, not a collision:\n`);
    for (const c of hues.collisions) console.log(`  · tone ${c.tone}: ${c.kinds.join(", ")}`);
  }

  // Reported and NOT graded, on purpose — see `hueReport`.
  const tight = hues.nearest.slice(0, 3);
  if (tight.length > 0) {
    console.log(`\nTightest hue clearances (reported, not graded — the threshold is nobody's to invent):`);
    for (const n of tight) console.log(`  ${n.degrees}° between ${n.kind} and ${n.neighbour}`);
  }

  // Hue is NOT a term here — see `hueReport` for the measurement that removed it.
  const failed = red.length + gaps.length;
  if (failed > 0) {
    console.error(
      `\n✗ ${red.length} stale artefact(s) and ${gaps.length} authored gap(s) across ` +
        `${kinds.length} registered kind(s).` +
        (check ? `\n  Run \`bun run kind:register\` to perform the generated ones.` : ``),
    );
    return 1;
  }
  console.log(
    `\n✓ ${STEPS.length} generated artefact(s) current and ${kinds.length} registered kind(s) ` +
      `carry an avatar and a table row. Commit them with the kind.`,
  );
  return 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
