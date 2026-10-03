#!/usr/bin/env bun
/**
 * Declared prose ↔ code pairs, and whether the prose was re-read after the
 * code moved.
 *
 * @module scripts/prose-code-pairs
 *
 * Bean `cuxx` (stage B of feature `flbx`), issue #1042, requirements R1, R2,
 * R6 and R7. The question this answers is deliberately NOT "is the prose
 * true" — that is stage A (mechanical claims) and stage C (a reviewer). It is
 * the cheaper one underneath both: **did the code change while the prose that
 * describes it stood still?** A yes asserts nothing about truth, so it cannot
 * cry wolf, which `77ex` recorded as the way a prose checker gets switched off.
 *
 * ## Declared pairs only (R1)
 *
 * A pair is taken from a declaration the corpus already makes, never inferred
 * from wording:
 *
 * | kind | prose | code | declared by |
 * |---|---|---|---|
 * | `implements` | a `.bpmn` diagram | the `.github/workflows/*.yml` it draws | `# bpmn: <diagram>` in the workflow (`workflow-bpmn.ts`) |
 * | `co-located` | a skill `.md` | the same-stem `.ts` beside it | the file sitting there |
 *
 * A paper block's `.md` ↔ `lean.ref` pair is the third declared kind; it lives
 * in a folio, not in this platform, so it is named in {@link PAIR_KINDS_NOT_SCANNED}
 * rather than silently missing.
 *
 * ## One-sided change, keyed by content hash (R2)
 *
 * Each pair's last-accepted state is kept as an ATTESTATION, carried across
 * runs the way `block-qa` carries a reviewer entry with its `field_hash`. It
 * lived in the subject's kg-qa sidecar until bean `2gst` (2026-10-01) moved it
 * to the attestation store, `test/attestations/kg-qa/` — owner ruling D2 (a):
 * a judgement stays on main while the derived sidecar moves to the
 * `qa-reports` branch. A store that cannot be read is `unknown`, never a
 * fresh baseline ({@link evaluatePairsFrom}):
 *
 * - no attestation yet → a `baseline` is recorded; it claims only "unchanged
 *   since first seen", and the pair passes;
 * - code changed, prose did not → **finding**: the prose was not re-read;
 *   the old attestation is kept, so the finding stays until somebody attests;
 * - prose changed (with or without code) → passes, and the attestation moves to
 *   the new state: whoever edited the prose wrote it against the current code.
 *
 * The last rule is the one R2 states ("one side changes and the other does
 * not"), and it is what keeps this quiet: a prose edit never raises anything.
 *
 * ## Attesting (the re-review mark)
 *
 *   bun run pairs:attest -- --sidecar cat-harness/test/results/kg-qa/processes/ci-health-watch.kg-qa.json \
 *     --by human --reason "re-read the report step against the new exit codes"
 *
 * rewrites that subject's attestations in the store to the current hashes with who and why,
 * and the next `kg:audit` passes it. `--by` is required and is `agent` or
 * `human`; a reason is required too, because a mark with no reason is a mark
 * nobody can review.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import type { KgCriterionEntry, KgFinding } from "../schemas/kg-qa.js";
import {
  kgAttestationFor,
  readAttestationFile,
  serialiseAttestations,
  type KgAttestations,
} from "../schemas/qa-attestations.js";
import { workflowsImplementing } from "./workflow-bpmn.js";

/** The declared pair kinds this platform can see. */
export const PAIR_KINDS = ["implements", "co-located"] as const;
export type PairKind = (typeof PAIR_KINDS)[number];

/** Declared kinds with no instances in this repository — reported, not dropped. */
export const PAIR_KINDS_NOT_SCANNED = ["block-lean (a paper folio's .md ↔ lean.ref)"] as const;

/** The criterion id, one place. */
export const PAIR_CRITERION = "prose-reviewed-since-code-changed";

export interface ProseCodePair {
  kind: PairKind;
  /** Repo-relative paths, so a workflow outside the instance root still has one spelling. */
  prose: string;
  code: string;
}

export interface PairAttestation extends ProseCodePair {
  prose_hash: string;
  code_hash: string;
  /** `baseline` = recorded on first sight, asserting nothing; the others are a re-read. */
  by: "baseline" | "agent" | "human";
  reason?: string;
}

const hashOf = (abs: string): string | null =>
  existsSync(abs) ? createHash("sha256").update(readFileSync(abs)).digest("hex").slice(0, 12) : null;

/**
 * The pairs one kg-qa subject declares.
 *
 * `instanceRoot` is what `subject.path` is relative to; `repoRoot` is what a
 * workflow path is relative to. Both are needed because `.github/` sits above
 * the instance.
 */
export function discoverPairs(
  subject: { kind: string; path: string | null },
  instanceRoot: string,
  repoRoot: string,
): ProseCodePair[] {
  if (!subject.path) return [];
  const abs = join(instanceRoot, subject.path);
  if (!existsSync(abs)) return [];
  const prose = relative(repoRoot, abs);
  if (subject.kind === "process") {
    // The workflow names the diagram (bean `61ca`), so the pair is found by
    // asking which workflows point here — the diagram names none of them.
    return workflowsImplementing(repoRoot, prose).map((code) => ({ kind: "implements" as const, prose, code }));
  }
  if (subject.kind === "skill" && abs.endsWith(".md")) {
    const ts = `${abs.slice(0, -3)}.ts`;
    return existsSync(ts) ? [{ kind: "co-located", prose, code: relative(repoRoot, ts) }] : [];
  }
  return [];
}

const key = (p: ProseCodePair): string => `${p.kind}|${p.prose}|${p.code}`;

/**
 * Judge each pair against its previous attestation.
 *
 * Returns the criterion entry and the attestations to write back. Pure over
 * the file system reads it makes, so the three cases are testable directly.
 */
export function evaluatePairs(
  pairs: ProseCodePair[],
  previous: PairAttestation[],
  repoRoot: string,
): { entry: KgCriterionEntry; attestations: PairAttestation[] } {
  if (pairs.length === 0) return { entry: { result: "n/a", findings: [] }, attestations: [] };
  const prior = new Map(previous.map((a) => [key(a), a]));
  const findings: KgFinding[] = [];
  const unknown: KgFinding[] = [];
  const attestations: PairAttestation[] = [];
  for (const p of pairs) {
    const proseHash = hashOf(resolve(repoRoot, p.prose));
    const codeHash = hashOf(resolve(repoRoot, p.code));
    if (proseHash === null || codeHash === null) {
      // A declared side that is not there is not a pass: the pair could not be judged.
      unknown.push({ where: p.code, detail: `declared ${p.kind} pair has a missing side (${proseHash === null ? p.prose : p.code}).` });
      const was = prior.get(key(p));
      if (was) attestations.push(was);
      continue;
    }
    const was = prior.get(key(p));
    if (!was) {
      attestations.push({ ...p, prose_hash: proseHash, code_hash: codeHash, by: "baseline" });
      continue;
    }
    const codeMoved = was.code_hash !== codeHash;
    const proseMoved = was.prose_hash !== proseHash;
    if (codeMoved && !proseMoved) {
      findings.push({
        where: p.code,
        detail:
          `${p.code} changed since ${p.prose} was last ${was.by === "baseline" ? "seen" : `attested (${was.by})`}, ` +
          `and the prose did not. Re-read it; if it still holds, run pairs:attest with a reason.`,
      });
      attestations.push(was);
    } else if (codeMoved || proseMoved) {
      // The prose moved: its author wrote it against the code as it now is.
      attestations.push({ ...was, prose_hash: proseHash, code_hash: codeHash });
    } else {
      attestations.push(was);
    }
  }
  if (unknown.length > 0 && findings.length === 0) return { entry: { result: "unknown", findings: unknown }, attestations };
  return { entry: { result: findings.length ? "fail" : "pass", findings: [...findings, ...unknown] }, attestations };
}

/**
 * The prior attestations, in the four states of `readAttestationFile`.
 *
 * `hit` and `miss` carry a list — a miss is a store that is there and holds
 * nothing for this subject, which is genuinely "first sight". `corrupt` and
 * `unknown` carry NO list on purpose: the `de9k` leftover was a reader that
 * answered `[]` for a file it could not parse, so the next run re-baselined
 * the subject and the judgement was gone without a word (C1, C4).
 */
export type AttestationsRead =
  | { state: "hit" | "miss"; attestations: PairAttestation[] }
  | { state: "corrupt" | "unknown"; reason: string };

/** Attestations recorded in the store file for one subject. */
export function readAttestations(storeFile: string, storeRoot: string): AttestationsRead {
  const r = readAttestationFile(storeFile, storeRoot);
  if (r.state === "hit") {
    const file = r.file as KgAttestations;
    return { state: "hit", attestations: (file.pair_attestations ?? []) as PairAttestation[] };
  }
  if (r.state === "miss") return { state: "miss", attestations: [] };
  return { state: r.state, reason: r.reason };
}

/**
 * {@link evaluatePairs} over a read that may not have answered.
 *
 * With no declared pair the store is irrelevant and the criterion is `n/a`.
 * With pairs and a `corrupt` or `unknown` read the criterion is `unknown`, and
 * `attestations` is `undefined` — the caller must write NOTHING back, because
 * writing fresh baselines over an unread store is exactly the loss this exists
 * to prevent.
 */
export function evaluatePairsFrom(
  pairs: ProseCodePair[],
  read: AttestationsRead,
  repoRoot: string,
): { entry: KgCriterionEntry; attestations: PairAttestation[] | undefined } {
  if (pairs.length === 0) return { entry: { result: "n/a", findings: [] }, attestations: [] };
  if (!("attestations" in read)) {
    return {
      entry: { result: "unknown", findings: [{ where: "attestations", detail: `prior attestations are ${read.state}: ${read.reason}. Not re-baselined.` }] },
      attestations: undefined,
    };
  }
  return evaluatePairs(pairs, read.attestations, repoRoot);
}

/**
 * Rewrite a subject's attestations to the current hashes, with who and why.
 *
 * Works on the STORE file (`schemas/qa-attestations.ts`), never on a kg-qa
 * sidecar. Refuses anything but a hit: attesting over a corrupt file would
 * overwrite a judgement nobody has read, and attesting where none is recorded
 * has no pair to attest — run `kg:audit` first.
 */
export function attest(
  storeFile: string,
  storeRoot: string,
  by: "agent" | "human",
  reason: string,
  repoRoot: string,
): number {
  const r = readAttestationFile(storeFile, storeRoot);
  if (r.state !== "hit") throw new Error(`cannot attest ${storeFile}: ${r.state} (${r.reason})`);
  const json = r.file as KgAttestations;
  const list = (json.pair_attestations ?? []) as PairAttestation[];
  for (const a of list) {
    const ph = hashOf(resolve(repoRoot, a.prose));
    const ch = hashOf(resolve(repoRoot, a.code));
    if (ph) a.prose_hash = ph;
    if (ch) a.code_hash = ch;
    a.by = by;
    a.reason = reason;
  }
  writeFileSync(storeFile, serialiseAttestations(json));
  return list.length;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const opt = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const sidecar = opt("--sidecar");
  const by = opt("--by");
  const reason = opt("--reason")?.trim();
  if (!sidecar || (by !== "agent" && by !== "human") || !reason) {
    console.error(
      "usage: bun run pairs:attest -- --sidecar <kg-qa sidecar path> --by agent|human --reason \"…\"\n" +
        "Both --by and --reason are required: a re-review mark with no reason cannot be reviewed.\n" +
        "The attestation is written to the store (test/attestations/kg-qa/…), not to the sidecar.",
    );
    process.exit(2);
  }
  const host = resolve(import.meta.dir, "..");
  const repoRoot = resolve(host, "..");
  const abs = resolve(process.cwd(), sidecar);
  // The sidecar path names the SUBJECT; the store file is found from it. It
  // need not exist itself — once derived results leave main it will not.
  const where = kgAttestationFor(abs, repoRoot, host);
  if (where === undefined) {
    console.error(`${sidecar} is under no instance's kg-qa tree`);
    process.exit(2);
  }
  try {
    const n = attest(where.file, where.storeRoot, by, reason, repoRoot);
    console.log(`attested ${n} pair(s) in ${relative(repoRoot, where.file)} — now run \`bun run kg:audit\``);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
