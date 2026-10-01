/**
 * The ATTESTATION store: every non-script QA verdict, kept on main under
 * `test/attestations/`, apart from the derived reports it used to live inside.
 *
 * Bean `8wj1` (arc `3fva`, reader-audit family F4, defect C11). Owner ruling
 * D2 (a), 2026-10-01: a verdict whose `reviewer.kind` is not `script` — an
 * agent's or a human's judgement — cannot be regenerated from the tree, so it
 * stays on main; the derived script verdicts move to the `qa-reports` branch.
 *
 * ## Why a store, and not "read the prior file more carefully"
 *
 * Eight writers kept the 13 attestations only by reading the PRIOR derived
 * report and carrying its non-script entries forward. With the prior absent —
 * which is exactly what moving `test/results/` off main makes normal — each of
 * them wrote a report holding only its own entries, and nothing said so. The
 * fix is not a better read of a file that is going away. It is a second source
 * the writers read FROM, and a refusal when that source cannot be read.
 *
 * ## Layout
 *
 * ```
 * <instance>/test/attestations/
 * ├── attestations.store.json                     the store marker (qa-attestations-store/v1)
 * ├── block-qa/<block path>.attestations.json      one per block that has any
 * └── translation-qa/<subject path>.<locale>.attestations.json
 * ```
 *
 * The path MIRRORS the derived report's path under `test/results/<family>/`,
 * with the family suffix (`.qa.json`, `.<locale>.translation-qa.json`) replaced
 * by `.attestations.json` and the locale kept. Mirrored for the reason
 * `qa-paths.ts` gives: block stems repeat across chapters, so flat collides.
 *
 * Each file is `qa-attestations/v1`:
 *
 * ```json
 * { "$schema": "qa-attestations/v1", "family": "block-qa",
 *   "subject": "content/docs/x/y", "locale": "fr",   // locale: translation only
 *   "criteria": { "<criterion id>": [ <entry, verbatim> ] } }
 * ```
 *
 * `criteria` has the SAME shape as the derived report's `criteria`, so an entry
 * moves between the two without being rewritten — the migration preserves
 * every byte of it, and `qa-attestations.test.ts` checks that on the real
 * corpus.
 *
 * ## Four read states, and the one that is not a miss
 *
 * | state | meaning | a writer may proceed? |
 * |---|---|---|
 * | `hit` | the subject's file is there and parses | yes |
 * | `miss` | the store is present and holds nothing for this subject | yes |
 * | `no-store` | this instance has never had a store (no marker, no directory) | yes, ADOPTING the prior's attestations |
 * | `corrupt` / `unknown` | present but unusable, or the read failed | **no**: report UNKNOWN, write nothing |
 *
 * `no-store` is what a downstream folio that has never migrated looks like. Its
 * attestations, if any, are still inside its derived reports, and there is no
 * store anything could have been retracted from, so a writer moves the prior's
 * attestations into the store as it saves. Once a store exists, a prior
 * carrying an attestation the store does not hold is `unmigrated` and refused,
 * with the command that fixes it (`bun run qa:attestations:migrate`).
 *
 * The one case no rule here can see: an instance whose store AND derived
 * report are both gone. Nothing is left to read, so nothing can say an
 * attestation existed. In this repository the marker is committed and a test
 * fails if it goes; a declaration of the store directory would let a writer
 * tell "never had one" from "lost it" anywhere (an open question on `8wj1`).
 *
 * ## How a writer composes a report
 *
 * The store is the source of truth for the attestation half. A derived report
 * still CARRIES a copy of its subject's attestations — every reader that takes
 * `criteria[id][0]` as the operative verdict keeps working — but that copy is a
 * projection: once a store exists, no writer reads attestations from it. {@link composeCriteria}
 * puts a criterion's attestations FIRST and its script entries after, which is
 * the invariant `insertAdjudication` in `qa-utils.ts` states for the block
 * family. On the committed corpus that composition reproduces every derived
 * file byte for byte (checked by the round-trip test).
 *
 * The guard against an unmigrated file is the reason a derived copy is still
 * READ at all: a non-script entry in the prior that the store does not hold is
 * either unmigrated or retracted, and a writer cannot tell which — so it
 * refuses rather than guessing. To retract an attestation, remove it from the
 * store AND from the derived report's projection.
 *
 * @module content/pipeline/qa-attestations
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

// ── Constants ────────────────────────────────────────────────────────────

/** The store, relative to an instance root. */
export const ATTESTATIONS_DIR = join("test", "attestations");
/** One spelling of the per-subject suffix, so a scan and a compose cannot disagree. */
export const ATTESTATIONS_SUFFIX = ".attestations.json";
export const ATTESTATIONS_SCHEMA = "qa-attestations/v1";
/** The file that says "this instance HAS a store", so absence is decidable. */
export const STORE_MARKER = "attestations.store.json";
export const STORE_SCHEMA = "qa-attestations-store/v1";
/** The command that moves attestations out of derived reports into the store. */
export const MIGRATE_COMMAND = "bun run qa:attestations:migrate";

/** The derived families this store serves. kg-qa is bean `2gst`'s. */
export const ATTESTATION_FAMILIES = ["block-qa", "translation-qa"] as const;
export type AttestationFamily = (typeof ATTESTATION_FAMILIES)[number];

/** The derived suffix per family; the translation one carries the locale. */
const DERIVED_SUFFIX: Record<AttestationFamily, RegExp> = {
  "block-qa": /\.qa\.json$/,
  "translation-qa": /\.([A-Za-z0-9_-]+)\.translation-qa\.json$/,
};

// ── Types ────────────────────────────────────────────────────────────────

/** An entry, kept opaque: the store never rewrites one. */
export type QaEntryLike = { reviewer?: { kind?: unknown } | null } & Record<string, unknown>;
export type CriteriaMap<E = QaEntryLike> = Record<string, E[]>;

/** Where one subject's attestations live. */
export interface AttestationKey {
  family: AttestationFamily;
  /** The subject path relative to the instance root, without extension. */
  subject: string;
  /** Translation family only. */
  locale?: string;
}

export interface AttestationFile {
  $schema: typeof ATTESTATIONS_SCHEMA;
  family: AttestationFamily;
  subject: string;
  locale?: string;
  criteria: CriteriaMap;
}

export interface StoreMarker {
  $schema: typeof STORE_SCHEMA;
  description: string;
}

export type AttestationRead =
  | { state: "hit"; path: string; criteria: CriteriaMap }
  | { state: "miss"; path: string }
  | { state: "no-store"; path: string }
  | { state: "corrupt" | "unknown"; path: string; reason: string };

/** The answer a writer acts on: proceed with these, or refuse. */
export type PriorResolution<R> =
  | {
      ok: true;
      /** The prior report with its attestation half re-sourced from the store; `undefined` when there was no prior. */
      prior: R | undefined;
      /** The subject's attestations: the store's, or on a `no-store` instance the prior's own (adopted). */
      attestations: CriteriaMap;
      /** The store path for this subject. */
      path: string;
      instanceRoot: string;
      key: AttestationKey;
      /** True on a `no-store` instance whose prior carried attestations: saving moves them into the store. */
      adopt: boolean;
    }
  | { ok: false; state: "corrupt" | "unknown" | "unmigrated"; path: string; reason: string };

// ── Classification ───────────────────────────────────────────────────────

/**
 * Is this entry an attestation?
 *
 * Anything that is not recognisably a script entry — including a malformed
 * one with no reviewer — is kept as one. That is `preserveNonScriptEntries`'
 * rule in `qa-utils.ts`, for its reason: dropping a malformed human entry
 * would break "human always preserved".
 */
export function isAttestation(e: unknown): boolean {
  return (e as QaEntryLike | null)?.reviewer?.kind !== "script";
}

/** Canonical identity of an entry: its exact serialisation, key order included. */
export function entryIdentity(e: unknown): string {
  return JSON.stringify(e);
}

/**
 * Split a criteria map into its script half and its attestation half.
 *
 * The script half keeps EVERY criterion key, in order, even one left empty —
 * so composing the two halves back reproduces the original key order.
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
 * Compose a report's criteria from a script half and the store's attestations:
 * per criterion, attestations FIRST, then the script entries.
 *
 * Key order: the script half's keys in their order, then any criterion only
 * the store has, in the store's order.
 */
export function composeCriteria<E>(script: CriteriaMap<E>, attestations: CriteriaMap<E>): CriteriaMap<E> {
  const out: CriteriaMap<E> = {};
  for (const [id, entries] of Object.entries(script)) out[id] = [...(attestations[id] ?? []), ...entries];
  for (const [id, entries] of Object.entries(attestations)) if (!(id in out)) out[id] = [...entries];
  return out;
}

/**
 * Every attestation in `expected` that `actual` does not hold, as
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

// ── Paths ────────────────────────────────────────────────────────────────

const posix = (p: string) => p.split(sep).join("/");

export function storeRoot(instanceRoot: string): string {
  return join(instanceRoot, ATTESTATIONS_DIR);
}

export function storeMarkerPath(instanceRoot: string): string {
  return join(storeRoot(instanceRoot), STORE_MARKER);
}

/** The store file for one subject. */
export function attestationPath(instanceRoot: string, key: AttestationKey): string {
  const tail = key.locale ? `${key.subject}.${key.locale}` : key.subject;
  return join(storeRoot(instanceRoot), key.family, tail + ATTESTATIONS_SUFFIX);
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
  for (const family of ATTESTATION_FAMILIES) {
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

// ── IO ───────────────────────────────────────────────────────────────────

/** Does this instance have a store? Three answers, the third never a "no". */
export function storeState(instanceRoot: string): { state: "present" } | { state: "absent" } | { state: "unknown"; reason: string } {
  const root = storeRoot(instanceRoot);
  const marker = storeMarkerPath(instanceRoot);
  try {
    if (!existsSync(root)) return { state: "absent" };
    if (!statSync(root).isDirectory()) return { state: "unknown", reason: `${root} is not a directory` };
    if (!existsSync(marker)) {
      return { state: "unknown", reason: `${root} exists without its marker ${STORE_MARKER} — a store whose presence cannot be confirmed is not read as empty` };
    }
    const doc = JSON.parse(readFileSync(marker, "utf-8")) as { $schema?: unknown };
    if (doc?.$schema !== STORE_SCHEMA) return { state: "unknown", reason: `${marker} is not ${STORE_SCHEMA}` };
    return { state: "present" };
  } catch (err) {
    return { state: "unknown", reason: `${marker}: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/** Read one subject's attestations. */
export function readAttestations(instanceRoot: string, key: AttestationKey): AttestationRead {
  const path = attestationPath(instanceRoot, key);
  const store = storeState(instanceRoot);
  if (store.state === "absent") return { state: "no-store", path };
  if (store.state === "unknown") return { state: "unknown", path, reason: store.reason };
  let text: string;
  try {
    if (!existsSync(path)) return { state: "miss", path };
    text = readFileSync(path, "utf-8");
  } catch (err) {
    return { state: "unknown", path, reason: err instanceof Error ? err.message : String(err) };
  }
  let doc: Partial<AttestationFile>;
  try {
    doc = JSON.parse(text) as Partial<AttestationFile>;
  } catch (err) {
    return { state: "corrupt", path, reason: `not valid JSON: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (doc?.$schema !== ATTESTATIONS_SCHEMA) return { state: "corrupt", path, reason: `not ${ATTESTATIONS_SCHEMA}` };
  if (doc.family !== key.family || doc.subject !== key.subject || (doc.locale ?? undefined) !== key.locale) {
    return {
      state: "corrupt",
      path,
      reason: `names ${doc.family}:${doc.subject}${doc.locale ? `@${doc.locale}` : ""}, not ${key.family}:${key.subject}${key.locale ? `@${key.locale}` : ""}`,
    };
  }
  const criteria = doc.criteria;
  if (!criteria || typeof criteria !== "object" || Array.isArray(criteria)) return { state: "corrupt", path, reason: "no `criteria` object" };
  for (const [id, entries] of Object.entries(criteria)) {
    if (!Array.isArray(entries)) return { state: "corrupt", path, reason: `criteria.${id} is not an array` };
    if (entries.some((e) => !isAttestation(e))) {
      return { state: "corrupt", path, reason: `criteria.${id} holds a script entry — the store holds attestations only` };
    }
  }
  return { state: "hit", path, criteria: criteria as CriteriaMap };
}

const MARKER_BODY: StoreMarker = {
  $schema: STORE_SCHEMA,
  description:
    "The attestation store: every QA verdict whose reviewer.kind is not `script` (an agent's or a human's judgement), " +
    "kept on main per owner ruling D2 (a), 2026-10-01, while derived script verdicts move to the `qa-reports` branch. " +
    "One `<family>/<subject path>.attestations.json` per subject, mirroring `test/results/<family>/`. " +
    "Writers read attestations from HERE, never from a prior derived report. " +
    "Module: content/pipeline/qa-attestations.ts; bean folio-assistant-8wj1.",
};

/** Create the store marker if it is absent. Idempotent; never rewrites one that is there. */
export function ensureStore(instanceRoot: string): boolean {
  const marker = storeMarkerPath(instanceRoot);
  if (existsSync(marker)) return false;
  mkdirSync(dirname(marker), { recursive: true });
  writeFileSync(marker, JSON.stringify(MARKER_BODY, null, 2) + "\n");
  return true;
}

/**
 * Is this JSON text ASCII-escaped — every non-ASCII character written as
 * `\uXXXX`, the way Python's `json.dumps` writes it?
 *
 * Measured 2026-10-01: 10 of the 12 derived reports carrying an attestation
 * are, and `JSON.stringify` would rewrite `—` as `—`. Same string, other
 * bytes. The store keeps the style of the file an entry came from, so the
 * entry's bytes survive the move rather than only its value.
 */
export function isAsciiEscaped(text: string): boolean {
  return /\\u[0-9a-fA-F]{4}/.test(text) && !/[^\x00-\x7f]/.test(text);
}

/** `JSON.stringify(value, null, 2)`, optionally ASCII-escaped in lowercase hex. */
export function jsonText(value: unknown, asciiEscape = false): string {
  const text = JSON.stringify(value, null, 2);
  return asciiEscape ? text.replace(/[^\x00-\x7f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")) : text;
}

/** Serialise one subject's file. One function, so the migration and the writers agree on every byte. */
export function renderAttestationFile(key: AttestationKey, criteria: CriteriaMap<unknown>, asciiEscape = false): string {
  const doc: Record<string, unknown> = { $schema: ATTESTATIONS_SCHEMA, family: key.family, subject: key.subject };
  if (key.locale) doc.locale = key.locale;
  doc.criteria = criteria;
  return jsonText(doc, asciiEscape) + "\n";
}

/**
 * Write one subject's attestations, creating the store if needed. Writes only
 * when the content changes. An empty map is still written when a file exists —
 * a retraction is recorded, never expressed by deleting the file.
 */
export function writeAttestations(
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
  const body = renderAttestationFile(key, nonEmpty, before !== undefined ? isAsciiEscaped(before) : (opts.asciiEscape ?? false));
  if (before === body) return false;
  ensureStore(instanceRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  return true;
}

// ── The writer's two calls ───────────────────────────────────────────────

/**
 * Resolve what a read-modify-write writer starts from.
 *
 * `prior` is the derived report the writer read (or `undefined`). The answer
 * re-sources its attestation half from the store. It refuses — and the writer
 * must then write NOTHING for this subject — when:
 *
 * - the store, or this subject's file in it, is `corrupt` or `unknown`;
 * - the store is present and the prior carries an attestation it does not
 *   hold: `unmigrated`, or retracted from the store and not from the
 *   projection. A writer cannot tell which, so it does not guess.
 *
 * On a `no-store` instance (one that has never migrated) the prior's own
 * attestations are ADOPTED: the writer moves them into the store, verbatim,
 * when it saves. There is no store to retract from, so nothing can be
 * resurrected, and a downstream folio migrates subject by subject as its
 * writers run instead of refusing until somebody runs the migration.
 */
export function resolvePrior<R extends { criteria?: CriteriaMap<unknown> }>(
  instanceRoot: string,
  key: AttestationKey,
  prior: R | undefined,
): PriorResolution<R> {
  const read = readAttestations(instanceRoot, key);
  if (read.state === "corrupt" || read.state === "unknown") {
    return { ok: false, state: read.state, path: read.path, reason: read.reason };
  }
  const split = prior ? splitCriteria(prior.criteria) : { script: {}, attestations: {} };
  if (read.state === "no-store") {
    const adopt = Object.keys(split.attestations).length > 0;
    const composed = prior ? ({ ...prior, criteria: composeCriteria(split.script, split.attestations) } as R) : undefined;
    return { ok: true, prior: composed, attestations: split.attestations as CriteriaMap, path: read.path, instanceRoot, key, adopt };
  }
  const stored: CriteriaMap = read.state === "hit" ? read.criteria : {};
  const unheld = missingAttestations(stored, split.attestations);
  if (unheld.length > 0) {
    return {
      ok: false,
      state: "unmigrated",
      path: read.path,
      reason:
        `the prior report carries ${unheld.length} attestation(s) the store does not hold (${unheld.join(", ")}). ` +
        `Run \`${MIGRATE_COMMAND}\` — or, if one was retracted from the store, remove it from the derived report too`,
    };
  }
  const composed = prior ? ({ ...prior, criteria: composeCriteria(split.script, stored) } as R) : undefined;
  return { ok: true, prior: composed, attestations: stored, path: read.path, instanceRoot, key, adopt: false };
}

/** The resolution a writer may proceed with. */
export type PriorOk = Extract<PriorResolution<unknown>, { ok: true }>;

/**
 * Finalise the criteria a writer is about to save. THROWS — before the writer
 * has written its report — if an attestation would not survive.
 *
 * - `"script"`: a writer that produces script entries only. Its attestation
 *   half is replaced by the store's, whatever it did to non-script entries on
 *   the way; a writer that overwrote a whole criterion array is how an
 *   adjudication used to vanish. On a `no-store` instance the adopted
 *   attestations are written to the store first.
 * - `"attesting"`: a writer that adds, replaces or removes a non-script entry.
 *   Its attestation half is written to the store FIRST, read back, and the
 *   derived projection is composed from it.
 *
 * `dryRun` computes and checks, and writes nothing.
 */
export function finalizeCriteria<E>(
  res: PriorOk,
  criteria: CriteriaMap<E>,
  mode: "script" | "attesting",
  opts: { dryRun?: boolean } = {},
): CriteriaMap<E> {
  const split = splitCriteria(criteria);
  const attestations = (mode === "attesting" ? split.attestations : res.attestations) as CriteriaMap<E>;
  if (!opts.dryRun && (mode === "attesting" || res.adopt)) {
    writeAttestations(res.instanceRoot, res.key, attestations);
    const back = readAttestations(res.instanceRoot, res.key);
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
