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
 * same order); `scripts/migrate-qa-attestations.ts` verifies that against the corpus.
 *
 * ## Five read states, and a miss is not "nothing attested" unless it is
 *
 * {@link readAttestationFile} answers `hit` / `miss` / `absent` / `corrupt` /
 * `unknown`, the vocabulary `scripts/qa-store.ts` uses plus `absent`:
 *
 * - `miss` — the store is there and this subject has no file. A hosted
 *   instance's subtree that does not exist yet is a `miss` too.
 * - `absent` — the store directory itself is not there: a folio that has never
 *   had one.
 * - `unknown` — the store path is there and could not be read.
 * - `corrupt` — the file is there and does not parse or validate. Never `[]`,
 *   and never overwritten: the next writer refuses it (the `de9k` leftover,
 *   which C1's conflict markers made live).
 *
 * ## Auto-move on first save (owner ruling 2, 2026-10-01)
 *
 * On `miss` or `absent`, a WRITER looks at the prior derived file before it
 * treats the subject as first sight. Judgements still inside that file have no
 * store entry, so the writer MOVES them into the store as it saves — it does
 * not refuse and wait for a manual migration. The store file is written
 * before the derived one, and on `kg-qa` the derived sidecar it then writes
 * carries no judgement. `absent` was `unknown`, a refusal, until that ruling.
 *
 * What still refuses: `corrupt` and `unknown` — a writer cannot tell what an
 * unreadable file held, so it writes nothing and exits non-zero — and a prior
 * derived file that cannot be parsed while the store has no entry, for the
 * same reason. A `hit` is the source: the prior derived file is never read for
 * judgements then.
 *
 * One case no rule can see: a store AND a prior derived file that are BOTH
 * gone. Nothing is left to read, so nothing can say a judgement existed. The
 * store is committed on main, so its deletion is a diff a reviewer sees.
 *
 * ## The other two families: `block-qa` and `translation-qa` (bean `8wj1`)
 *
 * Their judgements are `criteria` entries whose `reviewer.kind` is not
 * `script` — an agent's adjudication or a human ruling. Their member of the
 * union carries a `criteria` map with the derived report's own shape and
 * ONLY those entries ({@link CriteriaAttestationsSchema} refuses a script
 * one), so an entry moves between the two files without being rewritten. The
 * subject is `{kind: "block", id, path}` with `id` and `path` both the
 * instance-relative subject root (the `.ts`/`.md` stem the derived mirror is
 * built from); `translation-qa` adds `locale`.
 *
 * Unlike `kg-qa`, a derived block or translation report still carries a
 * PROJECTION of its judgements, because ~30 readers (and the published site)
 * take `criteria[id][0]` as the operative verdict. A writer composes that
 * projection from the store ({@link resolvePrior}, {@link finalizeCriteria});
 * it is never the source once the store holds the subject. Retiring the
 * projection is reader work for bean `5hox`, not a writer's.
 *
 * @module schemas/qa-attestations
 * @graphNode schema
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import { z } from "zod";

import {
  artefactStub,
  defaultGraphTypologies,
  instanceRootsIn,
  kgQaHomeFor,
  readDeclaration,
  resolveDirectories,
  type GraphTypologyRegistry,
} from "./cat-harness";

/** The `$schema` tag every attestation file carries. */
export const QA_ATTESTATIONS_SCHEMA = "qa-attestations/v1" as const;

/** The graph typology (and the declared directory id) that holds them. */
export const ATTESTATIONS_GRAPH_TYPOLOGY = "attestations" as const;

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
 * Is this criterion entry a judgement? Anything that is not recognisably a
 * script entry — including a malformed one with no reviewer — counts as one:
 * that is `preserveNonScriptEntries`' rule in `qa-utils.ts`, for its reason
 * (dropping a malformed human entry would break "human always preserved").
 */
export function isAttestation(e: unknown): boolean {
  return (e as { reviewer?: { kind?: unknown } | null } | null)?.reviewer?.kind !== "script";
}

/** One block or translation judgement, kept opaque: the store never rewrites an entry. */
export const AttestedEntrySchema = z
  .record(z.string(), z.unknown())
  .refine(isAttestation, { message: "a script entry is derived: the attestation store holds judgements only" });

/** Criterion id → its judgements, the derived report's own `criteria` shape. */
export const CriteriaAttestationsSchema = z.record(z.string(), z.array(AttestedEntrySchema));

/** The `block-qa` family (bean `8wj1`): a block's agent and human verdicts. */
export const BlockAttestationsSchema = QaAttestationsBaseSchema.extend({
  family: z.literal("block-qa"),
  criteria: CriteriaAttestationsSchema,
}).strict();

/** The `translation-qa` family (bean `8wj1`): one (subject, locale) pair's agent and human verdicts. */
export const TranslationAttestationsSchema = QaAttestationsBaseSchema.extend({
  family: z.literal("translation-qa"),
  locale: z.string().min(1),
  criteria: CriteriaAttestationsSchema,
}).strict();

/**
 * Every `qa-attestations/v1` file. A union on `family` so `kg_validate` and
 * the registry have ONE validator per `$schema`.
 */
export const QaAttestationsSchema = z.discriminatedUnion("family", [
  KgAttestationsSchema,
  BlockAttestationsSchema,
  TranslationAttestationsSchema,
]);
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
  registry: GraphTypologyRegistry = defaultGraphTypologies,
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
      (d.graphTypologies as readonly string[]).includes(ATTESTATIONS_GRAPH_TYPOLOGY),
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
  | { state: "absent"; path: string; reason: string }
  | { state: "corrupt"; path: string; reason: string }
  | { state: "unknown"; path: string; reason: string };

/**
 * Read one attestation file, in five states.
 *
 * `storeRoot` is the attestations directory (`storeRoot` from
 * {@link attestationsHomeFor}): when IT is absent the store is not there to
 * consult, which is `absent`, not `miss`. A writer then moves the prior
 * derived file's judgements into a new store as it saves (owner ruling 2,
 * 2026-10-01); see the module comment.
 */
export function readAttestationFile(path: string, storeRoot: string): AttestationRead {
  try {
    if (!existsSync(storeRoot)) {
      // No absolute path in the reason: it is written into committed sidecars.
      return { state: "absent", path, reason: "this instance has no attestation store yet" };
    }
    if (!statSync(storeRoot).isDirectory()) {
      return { state: "unknown", path, reason: "the attestation store path is not a directory" };
    }
  } catch (e) {
    return { state: "unknown", path, reason: `the attestation store could not be read: ${e instanceof Error ? e.message : String(e)}` };
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

/**
 * Is this JSON text ASCII-escaped — every non-ASCII character written as
 * `\uXXXX`, the way Python's `json.dumps` writes it?
 *
 * Measured 2026-10-01: 10 of the 12 derived block/translation reports carrying
 * a judgement are, and `JSON.stringify` would rewrite `—` as `—`. Same
 * string, other bytes. A store file keeps the style of the file its entries
 * came from, so their bytes survive the move rather than only their value.
 */
export function isAsciiEscaped(text: string): boolean {
  return /\\u[0-9a-fA-F]{4}/.test(text) && !/[^\x00-\x7f]/.test(text);
}

/** `JSON.stringify(value, null, 2)`, optionally ASCII-escaped in lowercase hex. */
export function jsonText(value: unknown, asciiEscape = false): string {
  const text = JSON.stringify(value, null, 2);
  return asciiEscape ? text.replace(/[^\x00-\x7f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")) : text;
}

/** The one serialisation, so writer, migration and `--check` agree on bytes. */
export function serialiseAttestations(file: QaAttestations, asciiEscape = false): string {
  return `${jsonText(file, asciiEscape)}\n`;
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

/** The kg-qa judgement arrays, in the order the pre-split sidecar carried them. */
export const KG_JUDGEMENT_FIELDS = ["pair_attestations", "voice_reviews"] as const;

/**
 * The judgements a PRIOR kg-qa sidecar still carries inside it, read raw —
 * the half of ruling 2 that a kg-qa reader needs on a `miss` or `absent`.
 *
 * `KgQaReportSchema` refuses a sidecar that carries one, so this never goes
 * through it: it is the one read that EXPECTS the old mixed shape. An absent
 * sidecar is `none` (nothing to move); one that will not parse is `unknown`,
 * because it may be holding judgements nobody can read.
 */
export function priorKgJudgements(
  sidecarAbs: string | undefined,
): { state: "none" } | { state: "found"; pair_attestations: unknown[]; voice_reviews: unknown[] } | { state: "unknown"; reason: string } {
  if (sidecarAbs === undefined || !existsSync(sidecarAbs)) return { state: "none" };
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(readFileSync(sidecarAbs, "utf-8")) as Record<string, unknown>;
  } catch (e) {
    return { state: "unknown", reason: `the prior sidecar does not parse, and may hold judgements: ${e instanceof Error ? e.message : String(e)}` };
  }
  const arr = (k: string) => (Array.isArray(json[k]) ? (json[k] as unknown[]) : []);
  const pairs = arr("pair_attestations");
  const reviews = arr("voice_reviews");
  if (pairs.length === 0 && reviews.length === 0) return { state: "none" };
  return { state: "found", pair_attestations: pairs, voice_reviews: reviews };
}

// ── The block-qa and translation-qa families (bean `8wj1`) ──────────────

/** The families whose judgements are `criteria` entries. */
export const CRITERIA_FAMILIES = ["block-qa", "translation-qa"] as const satisfies readonly AttestationFamily[];
export type CriteriaFamily = (typeof CRITERIA_FAMILIES)[number];

/** An entry, kept opaque: the store never rewrites one. */
export type QaEntryLike = { reviewer?: { kind?: unknown } | null } & Record<string, unknown>;
export type CriteriaMap<E = QaEntryLike> = Record<string, E[]>;

/** Which subject's judgements, in which family. */
export interface AttestationKey {
  family: CriteriaFamily;
  /** The subject root relative to the instance root, POSIX, without extension. */
  subject: string;
  /** `translation-qa` only. */
  locale?: string;
}

/** The derived suffix per family; the translation one carries the locale. */
const DERIVED_SUFFIX: Record<CriteriaFamily, RegExp> = {
  "block-qa": /\.qa\.json$/,
  "translation-qa": /\.([A-Za-z0-9_-]+)\.translation-qa\.json$/,
};

const posix = (p: string) => p.split(sep).join("/");

const homes = new Map<string, ReturnType<typeof attestationsHomeFor>>();
/**
 * The attestation home a block/translation writer uses: {@link attestationsHomeFor}
 * with no host, because a block writer runs against the content repository it
 * writes. Cached per instance root: a sweep asks once per block.
 */
export function criteriaAttestationsHome(instanceRoot: string): ReturnType<typeof attestationsHomeFor> {
  const k = resolve(instanceRoot);
  let h = homes.get(k);
  if (h === undefined) homes.set(k, (h = attestationsHomeFor(k)));
  return h;
}

/**
 * The store file for one subject: `<home>/<family>/<subject>[.<locale>].attestations.json`.
 * The same path {@link attestationPathFor} gives for the subject's derived
 * report under `test/results/<family>/`, composed from the subject rather than
 * the report because a writer may hold only the subject (its report absent).
 */
export function attestationPath(instanceRoot: string, key: AttestationKey): string {
  const tail = key.locale ? `${key.subject}.${key.locale}` : key.subject;
  return join(criteriaAttestationsHome(instanceRoot).root, key.family, tail + ATTESTATIONS_SUFFIX);
}

/** The key for a block, from its root (the `.ts` path without extension). */
export function blockAttestationKey(instanceRoot: string, blockRoot: string): AttestationKey {
  return { family: "block-qa", subject: posix(relative(instanceRoot, blockRoot)) };
}

/** The key for a (subject, locale) translation verdict. */
export function translationAttestationKey(instanceRoot: string, subjectRoot: string, locale: string): AttestationKey {
  return { family: "translation-qa", subject: posix(relative(instanceRoot, subjectRoot)), locale };
}

/**
 * The key for a derived report, given its path: either under
 * `test/results/<family>/` or the legacy sibling beside its subject.
 * `undefined` for a path that is neither.
 */
export function attestationKeyForDerived(instanceRoot: string, derivedAbs: string): AttestationKey | undefined {
  for (const family of CRITERIA_FAMILIES) {
    const m = DERIVED_SUFFIX[family].exec(derivedAbs);
    if (!m) continue;
    const stripped = derivedAbs.slice(0, m.index);
    const resultsBase = join(instanceRoot, "test", "results", family);
    const underResults = relative(resultsBase, stripped);
    const subjectAbs = underResults.startsWith("..") ? stripped : join(instanceRoot, underResults);
    const subject = posix(relative(instanceRoot, subjectAbs));
    if (subject.startsWith("..")) return undefined;
    return family === "translation-qa" ? { family, subject, locale: m[1]! } : { family, subject };
  }
  return undefined;
}

/** The subject object a block/translation file names. */
export function criteriaSubject(key: AttestationKey): z.infer<typeof AttestationSubjectSchema> {
  return { kind: "block", id: key.subject, path: key.subject };
}

/** Canonical identity of an entry: its exact serialisation, key order included. */
export function entryIdentity(e: unknown): string {
  return JSON.stringify(e);
}

/**
 * Split a criteria map into its script half and its judgement half. The script
 * half keeps EVERY criterion key, in order, even one left empty — so composing
 * the two halves back reproduces the original key order.
 */
export function splitCriteria<E>(criteria: CriteriaMap<E> | undefined): { script: CriteriaMap<E>; attestations: CriteriaMap<E> } {
  const script: CriteriaMap<E> = {};
  const attestations: CriteriaMap<E> = {};
  for (const [id, entries] of Object.entries(criteria ?? {})) {
    const list = Array.isArray(entries) ? entries : [];
    script[id] = list.filter((e) => !isAttestation(e));
    const att = list.filter((e) => isAttestation(e));
    if (att.length > 0) attestations[id] = att;
  }
  return { script, attestations };
}

/**
 * Compose a report's criteria from a script half and the store's judgements:
 * per criterion, judgements FIRST, then the script entries — the invariant
 * `insertAdjudication` in `qa-utils.ts` states for the block family. Key
 * order: the script half's, then any criterion only the store has.
 */
export function composeCriteria<E>(script: CriteriaMap<E>, attestations: CriteriaMap<E>): CriteriaMap<E> {
  const out: CriteriaMap<E> = {};
  for (const [id, entries] of Object.entries(script)) out[id] = [...(attestations[id] ?? []), ...entries];
  for (const [id, entries] of Object.entries(attestations)) if (!(id in out)) out[id] = [...entries];
  return out;
}

/**
 * Every judgement in `expected` that `actual` does not hold, as
 * `<criterion>|<reviewer kind>/<reviewer id>`. The after-check every writer
 * runs before it saves: an empty list is the only licence to write.
 */
export function missingAttestations(actual: CriteriaMap<unknown> | undefined, expected: CriteriaMap<unknown>): string[] {
  const out: string[] = [];
  for (const [id, entries] of Object.entries(expected)) {
    const have = new Set((actual?.[id] ?? []).map(entryIdentity));
    for (const e of entries) {
      if (!have.has(entryIdentity(e))) {
        const r = (e as QaEntryLike | null)?.reviewer as { kind?: unknown; id?: unknown } | undefined;
        out.push(`${id}|${String(r?.kind ?? "?")}/${String(r?.id ?? "?")}`);
      }
    }
  }
  return out;
}

export type CriteriaAttestationRead =
  | { state: "hit"; path: string; text: string; criteria: CriteriaMap }
  | { state: "miss" | "absent"; path: string }
  | { state: "corrupt" | "unknown"; path: string; reason: string };

/** Read one subject's block/translation judgements, through {@link readAttestationFile}. */
export function readCriteriaAttestations(instanceRoot: string, key: AttestationKey): CriteriaAttestationRead {
  const path = attestationPath(instanceRoot, key);
  const r = readAttestationFile(path, criteriaAttestationsHome(instanceRoot).storeRoot);
  if (r.state === "miss" || r.state === "absent") return { state: r.state, path };
  if (r.state !== "hit") return { state: r.state, path, reason: r.reason };
  const f = r.file;
  const locale = f.family === "translation-qa" ? f.locale : undefined;
  if (f.family !== key.family || f.subject.path !== key.subject || locale !== key.locale) {
    const name = `${f.family}:${f.subject.path ?? f.subject.id}${locale ? `@${locale}` : ""}`;
    return { state: "corrupt", path, reason: `names ${name}, not ${key.family}:${key.subject}${key.locale ? `@${key.locale}` : ""}` };
  }
  return { state: "hit", path, text: r.text, criteria: (f as unknown as { criteria: CriteriaMap }).criteria };
}

/** Serialise one subject's file. One function, so the migration and the writers agree on every byte. */
export function renderCriteriaAttestations(key: AttestationKey, criteria: CriteriaMap<unknown>, asciiEscape = false): string {
  const doc: Record<string, unknown> = { $schema: QA_ATTESTATIONS_SCHEMA, family: key.family, subject: criteriaSubject(key) };
  if (key.locale) doc["locale"] = key.locale;
  doc["criteria"] = criteria;
  return serialiseAttestations(doc as unknown as QaAttestations, asciiEscape);
}

/**
 * Write one subject's judgements, creating the store if needed — that is the
 * first save of ruling 2. Writes only when the content changes. An empty map
 * is still written when a file exists: a retraction is recorded, never
 * expressed by deleting the file.
 */
export function writeCriteriaAttestations(
  instanceRoot: string,
  key: AttestationKey,
  criteria: CriteriaMap<unknown>,
  opts: { asciiEscape?: boolean } = {},
): boolean {
  const path = attestationPath(instanceRoot, key);
  const nonEmpty = Object.fromEntries(Object.entries(criteria).filter(([, v]) => v.length > 0));
  if (Object.keys(nonEmpty).length === 0 && !existsSync(path)) return false;
  const before = existsSync(path) ? readFileSync(path, "utf-8") : undefined;
  // An existing file keeps the escaping it was written in; a new one takes the caller's.
  const body = renderCriteriaAttestations(key, nonEmpty, before !== undefined ? isAsciiEscaped(before) : (opts.asciiEscape ?? false));
  if (before === body) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  return true;
}

/** The command that adds judgements still inside derived files to the store, for every family. */
export const MIGRATE_COMMAND = "bun run qa:attestations:migrate";

/** The criteria type of a report, so a writer gets its judgements back in its own entry type. */
export type CriteriaOf<R> = R extends { criteria?: infer C } ? NonNullable<C> : CriteriaMap;

/** The answer a writer acts on: proceed with these, or refuse. */
export type PriorResolution<R> =
  | {
      ok: true;
      /** The prior report with its judgement half re-sourced from the store; `undefined` when there was no prior. */
      prior: R | undefined;
      /** The subject's judgements: the store's, or on `miss`/`absent` the prior's own (to be moved). */
      attestations: CriteriaOf<R>;
      /** The store path for this subject. */
      path: string;
      instanceRoot: string;
      key: AttestationKey;
      /** True when the prior carried judgements with no store entry: saving MOVES them into the store (ruling 2). */
      adopt: boolean;
    }
  | { ok: false; state: "corrupt" | "unknown" | "conflict"; path: string; reason: string };

/**
 * Resolve what a read-modify-write writer starts from.
 *
 * `prior` is the derived report the writer read (or `undefined`).
 *
 * - `hit` — the store's judgements are the source; the prior's are never
 *   read as judgements. A prior carrying one the store does NOT hold is a
 *   `conflict` and refused: it is either a judgement some writer put only in
 *   the derived file or one retracted from the store and not from the
 *   projection, and a writer cannot tell which.
 * - `miss` / `absent` — the subject has no store entry. The prior's
 *   judgements are MOVED: the writer writes them to the store as it saves
 *   (owner ruling 2, 2026-10-01). Not a refusal.
 * - `corrupt` / `unknown` — refused; the writer writes NOTHING for this subject.
 */
export function resolvePrior<R extends { criteria?: CriteriaMap<unknown> }>(
  instanceRoot: string,
  key: AttestationKey,
  prior: R | undefined,
): PriorResolution<R> {
  const read = readCriteriaAttestations(instanceRoot, key);
  if (read.state === "corrupt" || read.state === "unknown") {
    return { ok: false, state: read.state, path: read.path, reason: read.reason };
  }
  const split = prior ? splitCriteria(prior.criteria) : { script: {}, attestations: {} };
  if (read.state !== "hit") {
    // `miss` or `absent`: no store entry, so the prior's judgements are moved.
    const adopt = Object.keys(split.attestations).length > 0;
    const composed = prior ? ({ ...prior, criteria: composeCriteria(split.script, split.attestations) } as R) : undefined;
    return { ok: true, prior: composed, attestations: split.attestations as CriteriaOf<R>, path: read.path, instanceRoot, key, adopt };
  }
  const unheld = missingAttestations(read.criteria, split.attestations);
  if (unheld.length > 0) {
    return {
      ok: false,
      state: "conflict",
      path: read.path,
      reason:
        `the prior report carries ${unheld.length} judgement(s) the store's file for this subject does not hold (${unheld.join(", ")}). ` +
        `Run \`${MIGRATE_COMMAND}\` to add them to the store — or, if one was retracted from the store, remove it from the derived report too`,
    };
  }
  const composed = prior ? ({ ...prior, criteria: composeCriteria(split.script, read.criteria) } as R) : undefined;
  return { ok: true, prior: composed, attestations: read.criteria as CriteriaOf<R>, path: read.path, instanceRoot, key, adopt: false };
}

/** The resolution a writer may proceed with. */
export type PriorOk = Omit<Extract<PriorResolution<unknown>, { ok: true }>, "attestations"> & { attestations: CriteriaMap<unknown> };

/**
 * Finalise the criteria a writer is about to save. THROWS — before the writer
 * has written its report — if a judgement would not survive.
 *
 * - `"script"`: a writer that produces script entries only. Its judgement half
 *   is replaced by the store's, whatever it did to non-script entries on the
 *   way. When the resolution `adopt`s, the moved judgements are written to the
 *   store first (ruling 2).
 * - `"attesting"`: a writer that adds, replaces or removes a non-script entry.
 *   Its judgement half is written to the store FIRST, read back, and the
 *   derived projection is composed from it.
 *
 * `dryRun` computes and checks, and writes nothing.
 */
export function finalizeCriteria<E>(
  res: PriorOk,
  criteria: CriteriaMap<E>,
  mode: "script" | "attesting",
  opts: { dryRun?: boolean; asciiEscape?: boolean } = {},
): CriteriaMap<E> {
  const split = splitCriteria(criteria);
  const attestations = (mode === "attesting" ? split.attestations : res.attestations) as CriteriaMap<E>;
  if (!opts.dryRun && (mode === "attesting" || res.adopt)) {
    writeCriteriaAttestations(res.instanceRoot, res.key, attestations, { asciiEscape: opts.asciiEscape });
    const back = readCriteriaAttestations(res.instanceRoot, res.key);
    const held = back.state === "hit" ? back.criteria : {};
    const lost = missingAttestations(held, attestations);
    if (lost.length > 0) throw new Error(`the attestation store did not take ${lost.join(", ")} at ${back.path}`);
  }
  const out = composeCriteria(split.script, attestations);
  const dropped = missingAttestations(out, attestations);
  if (dropped.length > 0) throw new Error(`composition dropped ${dropped.join(", ")}`);
  return out;
}

/** One line for a refusal, in the shape every writer prints. */
export function refusalLine(writer: string, subject: string, r: { state: string; path: string; reason: string }): string {
  return `${writer}: UNKNOWN ${subject} — attestation store ${r.state} at ${r.path}: ${r.reason}. Nothing was written for it.`;
}
