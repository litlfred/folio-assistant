/**
 * QA ATTESTATIONS — the judgement half of a QA verdict, kept on `main` where a
 * `git rm` of derived results cannot reach it.
 *
 * Bean `2gst` (arc `3fva`, reader audit family F1). Owner rulings that bind
 * it, 2026-10-01: **D2 (a)** — every non-script verdict stays on main; derived
 * script verdicts move to the `qa-reports` branch — and **the 26 `baseline`
 * pair attestations count as judgements**, because a regenerated baseline
 * forgets the drift it recorded (that is defect C4 in
 * `docs/proposals/qa-readers-audit-2026-10-01.md`).
 *
 * ## Why a separate tree rather than a field in the sidecar
 *
 * Until this module, `pair_attestations` and `voice_reviews` lived INSIDE the
 * `kg-qa/v1` sidecars beside script verdicts. A mixed file has no home under
 * D2: moving it to the branch takes the judgements with it, and keeping it on
 * main keeps the derived half the arc exists to move. Worse, every reader
 * treated an absent sidecar as "no attestation yet", so deleting the derived
 * tree re-baselined every pair and the `prose-reviewed-since-code-changed`
 * findings went 13 → 0 (measured, C4). Split by provenance, each half has one
 * home and the derived half can be deleted without touching the other.
 *
 * ## Layout — ONE convention for every QA family
 *
 * ```
 * <instance>/test/attestations/            the declared `attestations` directory
 * └── <family>/<mirrored subject path>/<stem>.attestations.json
 * ```
 *
 * `<family>` is the derived family the judgements sit beside — `kg-qa` here,
 * `block-qa` and `translation-qa` for bean `8wj1` — and the mirror below it is
 * EXACTLY the one that family's derived tree uses, so the attestation for a
 * subject is found by swapping the tree root and the suffix, never by a second
 * path rule. A hosted instance (one with no `attestations` directory of its
 * own, audited from a host) lives under `<host>/test/attestations/<stub>/`,
 * the same three answers {@link attestationsHomeFor} shares with `kgQaHomeFor`.
 *
 * ## The envelope — `qa-attestations/v1`
 *
 * ```json
 * { "$schema": "qa-attestations/v1",
 *   "family": "kg-qa",
 *   "subject": { "kind": "skill", "id": "…", "path": "…" },
 *   "pair_attestations": [ … ],      // kg-qa
 *   "voice_reviews": [ … ] }         // kg-qa
 * ```
 *
 * A family adds its own judgement arrays; the envelope (`$schema`, `family`,
 * `subject`) is shared. Each judgement is keyed by the subject plus what it
 * attests and the HASH it attested, so a stale one is detectable by
 * recomputing the hash: a pair attestation carries `prose_hash` and
 * `code_hash`, a voice review `skill_hash` and `voice_hash`.
 *
 * Entries are stored byte-for-byte as their writer produced them (same keys,
 * same order); `migrate-kg-attestations.ts` verifies that against the corpus.
 *
 * ## Four read states, and a miss is not "nothing attested" unless it is
 *
 * {@link readAttestationFile} answers `hit` / `miss` / `corrupt` / `unknown`,
 * the vocabulary `scripts/qa-store.ts` uses:
 *
 * - `miss` — the store is there and this subject has no file: genuinely never
 *   attested. The ONLY state a caller may treat as "first sight".
 * - `unknown` — the declared attestations directory itself is absent (the
 *   store, not one subject's file), so whether the subject was attested
 *   cannot be determined. Never a re-baseline. A hosted instance's subtree
 *   that does not exist yet is a `miss`: the store is there, empty for it.
 * - `corrupt` — the file is there and does not parse or validate. Never `[]`,
 *   and never overwritten: the next writer refuses it (the `de9k` leftover,
 *   which C1's conflict markers made live).
 *
 * @module schemas/qa-attestations
 * @graphNode schema
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { z } from "zod";

import {
  artefactStub,
  defaultGraphKinds,
  instanceRootsIn,
  kgQaHomeFor,
  readDeclaration,
  resolveDirectories,
  type GraphKindRegistry,
} from "./cat-harness";

/** The `$schema` tag every attestation file carries. */
export const QA_ATTESTATIONS_SCHEMA = "qa-attestations/v1" as const;

/** The graph kind (and the declared directory id) that holds them. */
export const ATTESTATIONS_GRAPH_KIND = "attestations" as const;

/** The file suffix, one place. */
export const ATTESTATIONS_SUFFIX = ".attestations.json";

/**
 * The derived families a judgement may sit beside. `kg-qa` is this bean's;
 * the other two are named so bean `8wj1` extends one list rather than adding
 * a second.
 */
export const ATTESTATION_FAMILIES = ["kg-qa", "block-qa", "translation-qa"] as const;
export type AttestationFamily = (typeof ATTESTATION_FAMILIES)[number];

/** One declared prose ↔ code pair's accepted state. Paths are repo-relative. */
export const PairAttestationSchema = z.object({
  kind: z.enum(["implements", "co-located"]),
  prose: z.string().min(1),
  code: z.string().min(1),
  prose_hash: z.string().min(1),
  code_hash: z.string().min(1),
  /** `baseline` counts as a judgement (owner, 2026-10-01): it records the state the drift is measured from. */
  by: z.enum(["baseline", "agent", "human"]),
  reason: z.string().min(1).optional(),
});
export type PairAttestationEntry = z.infer<typeof PairAttestationSchema>;

/** One review of a skill against one voice. Hashes pin what was reviewed. */
export const VoiceReviewSchema = z.object({
  voice: z.string().min(1),
  instance: z.string().min(1),
  skill_hash: z.string().min(1),
  voice_hash: z.string().min(1),
  by: z.enum(["agent", "human"]),
  at: z.string().min(1),
  verdicts: z.array(
    z.object({
      rule: z.string().min(1),
      result: z.enum(["pass", "fail", "n/a"]),
      note: z.string().min(1).optional(),
    }),
  ),
});
export type VoiceReviewEntry = z.infer<typeof VoiceReviewSchema>;

/** The subject, exactly as the derived report beside it names it. */
export const AttestationSubjectSchema = z.object({
  kind: z.string().min(1),
  id: z.string().min(1),
  path: z.string().nullable(),
});

/** The envelope every family shares. A family's own arrays are added by `.extend`. */
export const QaAttestationsBaseSchema = z.object({
  $schema: z.literal(QA_ATTESTATIONS_SCHEMA),
  family: z.enum(ATTESTATION_FAMILIES),
  subject: AttestationSubjectSchema,
});

/** The `kg-qa` family: pair attestations and voice reviews. */
export const KgAttestationsSchema = QaAttestationsBaseSchema.extend({
  family: z.literal("kg-qa"),
  pair_attestations: z.array(PairAttestationSchema).optional(),
  voice_reviews: z.array(VoiceReviewSchema).optional(),
}).strict();
export type KgAttestations = z.infer<typeof KgAttestationsSchema>;

/**
 * Every `qa-attestations/v1` file. A union on `family` so `kg_validate` and
 * the registry have ONE validator per `$schema`; `8wj1` adds its members here.
 */
export const QaAttestationsSchema = z.discriminatedUnion("family", [KgAttestationsSchema]);
export type QaAttestations = z.infer<typeof QaAttestationsSchema>;

// ── Where ────────────────────────────────────────────────────────────────

/**
 * Where an instance's attestations live — the same three answers as
 * `kgQaHomeFor` (`schemas/cat-harness.ts`), for the same reason:
 *
 * - **own** — the instance declares an `attestations` directory;
 * - **hosted** — it does not, and `hostRoot` does: `<host dir>/<stub>`;
 * - **convention** — neither: `<instance>/test/attestations`.
 */
export function attestationsHomeFor(
  instanceRoot: string,
  hostRoot?: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): {
  root: string;
  by: "own" | "hosted" | "convention";
  /**
   * The DECLARED directory whose absence makes every read `unknown`: the
   * instance's own, or the host's for a hosted instance. A hosted subtree
   * that does not exist yet is a store with nothing in it (a `miss`), not a
   * missing store — only the declared directory going is "store absent".
   */
  storeRoot: string;
} {
  const find = (root: string) =>
    resolveDirectories([{ name: "(local)", root, own: true }], registry).find((d) =>
      (d.graphKinds as readonly string[]).includes(ATTESTATIONS_GRAPH_KIND),
    );
  const own = find(instanceRoot);
  if (own !== undefined) return { root: own.absPath, by: "own", storeRoot: own.absPath };
  if (hostRoot !== undefined && resolve(hostRoot) !== resolve(instanceRoot)) {
    const host = find(hostRoot);
    const decl = readDeclaration(instanceRoot);
    if (host !== undefined && decl !== undefined && decl !== null) {
      return { root: join(host.absPath, artefactStub(decl)), by: "hosted", storeRoot: host.absPath };
    }
  }
  // declared-path-literal: the base case for an instance that declares no
  // `attestations` directory and is hosted by nobody.
  const conv = join(instanceRoot, "test", "attestations");
  return { root: conv, by: "convention", storeRoot: conv };
}

/**
 * The attestation file for a derived sidecar: the same mirrored path under
 * `<attestationsHome>/<family>/` instead of `<derivedTree>/`, with the family
 * suffix swapped for {@link ATTESTATIONS_SUFFIX}.
 *
 * Derived from the sidecar path rather than recomputed from the subject so
 * there is ONE mirror rule (`kgQaSidecarPath` for kg-qa) and two trees that
 * cannot disagree about it. Throws when the sidecar is not under the tree:
 * a composed path outside the store is a caller's bug, never a quiet miss.
 */
export function attestationPathFor(
  sidecarAbs: string,
  derivedTree: string,
  attestationsHome: string,
  family: AttestationFamily,
  derivedSuffix: string = `.${family}.json`,
): string {
  const rel = relative(resolve(derivedTree), resolve(sidecarAbs));
  if (rel.startsWith("..") || rel === "" || rel.startsWith(sep)) {
    throw new Error(`${sidecarAbs} is not under the derived tree ${derivedTree}`);
  }
  if (!rel.endsWith(derivedSuffix)) throw new Error(`${sidecarAbs} does not end in ${derivedSuffix}`);
  return join(attestationsHome, family, `${rel.slice(0, -derivedSuffix.length)}${ATTESTATIONS_SUFFIX}`);
}

// ── Read ─────────────────────────────────────────────────────────────────

export type AttestationRead =
  | { state: "hit"; path: string; text: string; file: QaAttestations }
  | { state: "miss"; path: string; reason: string }
  | { state: "corrupt"; path: string; reason: string }
  | { state: "unknown"; path: string; reason: string };

/**
 * Read one attestation file, in four states.
 *
 * `storeRoot` is the declared attestations directory (`storeRoot` from
 * {@link attestationsHomeFor}): when IT is absent the store is not there to
 * consult, which is `unknown`, not `miss` — the distinction that keeps a
 * deleted or unfetched store from reading as "never attested".
 */
export function readAttestationFile(path: string, storeRoot: string): AttestationRead {
  if (!existsSync(storeRoot)) {
    // No absolute path in the reason: it is written into committed sidecars.
    return { state: "unknown", path, reason: "the attestation store is absent, so whether this subject was attested cannot be determined" };
  }
  if (!existsSync(path)) return { state: "miss", path, reason: "no attestation recorded for this subject" };
  let text: string;
  try {
    text = readFileSync(path, "utf-8");
  } catch (e) {
    return { state: "unknown", path, reason: `unreadable: ${e instanceof Error ? e.message : String(e)}` };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { state: "corrupt", path, reason: `not JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  const parsed = QaAttestationsSchema.safeParse(json);
  if (!parsed.success) {
    return { state: "corrupt", path, reason: `not ${QA_ATTESTATIONS_SCHEMA}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}` };
  }
  // The RAW object, not `parsed.data`: zod rebuilds an object in schema key
  // order, and a writer that round-trips through it would reorder an entry
  // the store promises to keep byte-for-byte.
  return { state: "hit", path, text, file: json as QaAttestations };
}

/** The one serialisation, so writer, migration and `--check` agree on bytes. */
export function serialiseAttestations(file: QaAttestations): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

// ── The kg-qa family's trees ─────────────────────────────────────────────

/** One instance's `kg-qa/` derived tree and the attestation home it maps onto. */
export interface KgAttestationTree {
  /** Repo-relative instance root, `.` for the checkout root. */
  instance: string;
  /** Absolute `<qa home>/kg-qa`. */
  kgTree: string;
  /** Absolute attestations home (the `<family>` directory goes under it). */
  attHome: string;
  /** The declared directory whose absence is "store absent" — see `attestationsHomeFor`. */
  storeRoot: string;
}

/** The suffix `kgQaSidecarPath` composes. */
export const KG_QA_SIDECAR_SUFFIX = ".kg-qa.json";

/**
 * Every instance's `kg-qa/` tree with its attestation home, as `kg-audit`
 * resolves them when `hostRoot` is the auditor's instance. Deduplicated on the
 * tree, since two instance roots can share a hosted home.
 */
export function kgAttestationTrees(repoRoot: string, hostRoot: string): KgAttestationTree[] {
  const out = new Map<string, KgAttestationTree>();
  for (const root of instanceRootsIn(repoRoot)) {
    const kgTree = resolve(kgQaHomeFor(root, hostRoot).root, "kg-qa");
    if (out.has(kgTree)) continue;
    const home = attestationsHomeFor(root, hostRoot);
    out.set(kgTree, { instance: relative(repoRoot, root) || ".", kgTree, attHome: home.root, storeRoot: home.storeRoot });
  }
  return [...out.values()];
}

/**
 * The attestation file and family tree for a kg-qa sidecar path, or
 * `undefined` when the path is under no instance's `kg-qa/` tree.
 */
export function kgAttestationFor(
  sidecarAbs: string,
  repoRoot: string,
  hostRoot: string,
): { file: string; storeRoot: string } | undefined {
  const abs = resolve(sidecarAbs);
  const tree = kgAttestationTrees(repoRoot, hostRoot)
    .filter((t) => abs.startsWith(`${t.kgTree}${sep}`))
    // The deepest tree wins: a hosted home sits beside, never inside, the
    // host's own tree, but a longest match costs nothing and is never wrong.
    .sort((a, b) => b.kgTree.length - a.kgTree.length)[0];
  if (tree === undefined) return undefined;
  return {
    file: attestationPathFor(abs, tree.kgTree, tree.attHome, "kg-qa", KG_QA_SIDECAR_SUFFIX),
    storeRoot: tree.storeRoot,
  };
}
