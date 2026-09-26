#!/usr/bin/env bun
/**
 * Materialized content is READ-ONLY, and this is what enforces it.
 *
 * @module cat-harness/scripts/check-materialized-fixity
 * @covers computed — it follows every node whose `materialization.state` is `materialized`,
 *   which is a property of NODES rather than of kinds
 *
 * ## The rule, in the owner's words
 *
 * 2026-09-21: *"if we have a mateiralized `<stub>/<sub-graph>`, the contents
 * of it should be immutable (expect for publication worfklow purposes or so)
 * … you would need to copy/mateiralize it to your own `folio/` in order to
 * mess around with it."*
 *
 * And 2026-09-22, choosing between advising and enforcing: **enforce from the
 * start.**
 *
 * ## Why editing in place is a defect rather than a mess
 *
 * A `materialized` node is a copy of somebody else's artefact. who-iris's
 * catalogue asserts *this is what IRIS holds*. Edit one of those bytes in
 * place and the assertion is false for that item while
 * `materialization.state` still reads `materialized` — a claim that outlives
 * the thing it described, which is the failure this repository keeps meeting
 * in other costumes.
 *
 * ## The mechanism was already here and nothing read it
 *
 * `schemas/materialization.ts` says so in as many words: *"The fixity data
 * already exists. Every ingested entry's `structure.json` carries `sha256` and
 * `bytes` … **Nothing reads them as fixity today.**"*
 *
 * So enforcement needs no new metadata and — importantly — no attribution of
 * a commit to a process step. It asks a question about BYTES: does this file
 * still hash to what its record says? A check that tried instead to decide
 * *who* wrote and *under which task* would need every writer to announce
 * itself, and would pass for anyone who forgot to.
 *
 * ## How the publication exception works, without being a carve-out
 *
 * The owner's exception — *"expect for publication worfklow purposes or so"* —
 * needs no special case here, and that is the design rather than a shortcut.
 *
 * A publication step that legitimately rewrites a materialized artefact
 * (signing, stamping, versioning) **updates the fixity in the same change**.
 * The check then passes, and the record now describes what is actually there.
 * A step that rewrites without updating fixity fails — correctly, because it
 * has forked the upstream without saying so, which is precisely what the rule
 * exists to prevent.
 *
 * In other words the exception is not "these actors may skip the rule"; it is
 * **"say what you did"**. That is checkable, where a list of permitted writers
 * is a list that goes stale the first time somebody adds a sixth one.
 *
 * ## The third state is a finding, not a pass
 *
 * A materialized artefact with **no** fixity cannot be verified, and
 * `materialization.ts` is explicit that *"an archival copy with no Fixity is
 * not an archive — it is a file somebody kept"*. So it is reported, and it is
 * reported SEPARATELY from a mismatch: one says the bytes changed, the other
 * says nobody can tell. Collapsing them would let an unverifiable artefact
 * read as a verified one.
 *
 * Usage:
 *   bun run cat-harness/scripts/check-materialized-fixity.ts
 *   bun run cat-harness/scripts/check-materialized-fixity.ts --json
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { declarationPathIn } from "../schemas/cat-harness.js";

const REPO = resolve(import.meta.dir, "..", "..");

/** One materialized artefact, as the corpus records it. */
export interface MaterializedRecord {
  /** Where the record was found, repo-relative — so a finding can be opened. */
  readonly source: string;
  /** The node or entry id, where one is carried. */
  readonly id?: string;
  /** A human label for the artefact — a bitstream name, usually. */
  readonly name?: string;
  /** Path to the bytes, relative to the instance that declared them. */
  readonly localPath?: string;
  /** Absolute path to the bytes, when `localPath` resolved. */
  readonly abs?: string;
  readonly algorithm?: string;
  readonly digest?: string;
  /**
   * The whole materialization object as the corpus wrote it. Carried so a
   * second reader (`cache-index.ts`, bean `54rk`) gets `bytes`, `purpose`,
   * `materializedAt` and `expiresAt` from THIS walk rather than writing its
   * own, which would be a second answer to "where are the records".
   */
  readonly record?: Readonly<Record<string, unknown>>;
}

export type Verdict =
  | { kind: "verified"; record: MaterializedRecord }
  /** The bytes are not what the record says. Somebody edited a copy in place. */
  | { kind: "mismatch"; record: MaterializedRecord; actual: string }
  /** Declared materialized, bytes absent. Different from edited. */
  | { kind: "absent"; record: MaterializedRecord }
  /** No fixity, so unverifiable — never rendered as verified. */
  | { kind: "unverifiable"; record: MaterializedRecord; why: string }
  /**
   * A DIRECTORY whose contents are individually materialized and verified.
   *
   * who-iris records a materialization on an item (`library/<id>`, a
   * directory) AND on each bitstream beneath it. A file digest does not apply
   * to a directory, so the item-level record looked "unverifiable" while every
   * byte under it was in fact verified by its parts.
   *
   * That is the `harness-tiles` defect of the same morning, one layer along:
   * reporting a gap that is filled somewhere the check did not look. Naming it
   * as its own verdict keeps it out of BOTH the verified count (nothing was
   * hashed here) and the unverifiable one (nothing is unchecked either).
   */
  | { kind: "covered-by-parts"; record: MaterializedRecord; parts: number };

/** Every instance declaration — `declarationPathIn`, never a shape heuristic. */
function instanceDeclarations(repo: string): string[] {
  const out: string[] = [];
  const at = declarationPathIn(repo);
  if (at && existsSync(at)) out.push(at);
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = declarationPathIn(join(repo, e.name));
    if (p && existsSync(p)) out.push(p);
  }
  return out;
}

/** Every `.json` beneath a directory, bounded so a deep tree cannot hang the gate. */
function jsonFilesUnder(dir: string, depth = 0): string[] {
  if (depth > 6) return [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...jsonFilesUnder(p, depth + 1));
    else if (e.name.endsWith(".json")) out.push(p);
  }
  return out;
}

/**
 * Pull every materialization record out of a parsed JSON document.
 *
 * Walks rather than reading a fixed path, because a materialization is not
 * always in the same place: who-iris carries one per node AND one per
 * bitstream beneath it, and a folio's `structure.json` carries its own. A
 * reader that knew only the shapes it had seen would silently stop finding
 * them the first time a new one appeared — and silently finding nothing is
 * exactly the `dh4f` failure this repository names.
 */
export function materializationsIn(doc: unknown, source: string, inheritedId?: string): MaterializedRecord[] {
  const out: MaterializedRecord[] = [];
  const walk = (v: unknown, id: string | undefined, name: string | undefined): void => {
    if (Array.isArray(v)) {
      for (const x of v) walk(x, id, name);
      return;
    }
    if (typeof v !== "object" || v === null) return;
    const o = v as Record<string, unknown>;
    const ownId = typeof o.id === "string" ? o.id : id;
    const ownName = typeof o.name === "string" ? o.name : name;

    const m = o.materialization as Record<string, unknown> | undefined;
    if (m && m.state === "materialized") {
      const fx = (m.fixity ?? {}) as Record<string, unknown>;
      out.push({
        source,
        ...(ownId ? { id: ownId } : {}),
        ...(ownName ? { name: ownName } : {}),
        ...(typeof m.localPath === "string" ? { localPath: m.localPath } : {}),
        ...(typeof fx.algorithm === "string" ? { algorithm: fx.algorithm } : {}),
        ...(typeof fx.digest === "string" ? { digest: fx.digest } : {}),
        record: m,
      });
    }
    for (const [k, child] of Object.entries(o)) {
      if (k === "materialization") continue;
      walk(child, ownId, ownName);
    }
  };
  walk(doc, inheritedId, undefined);
  return out;
}

/** Every materialized artefact declared anywhere in the checkout. */
export function collect(repo = REPO): MaterializedRecord[] {
  const out: MaterializedRecord[] = [];
  for (const declPath of instanceDeclarations(repo)) {
    const instanceRoot = join(declPath, "..");
    let d: { directories?: { path?: string; scope?: string }[] };
    try {
      d = JSON.parse(readFileSync(declPath, "utf-8"));
    } catch {
      // `kg:schema:check` owns an unparseable declaration; a second voice here
      // would report one defect under two names.
      continue;
    }
    for (const entry of d.directories ?? []) {
      if (!entry.path) continue;
      const root = entry.scope === "repository" ? repo : instanceRoot;
      const dir = join(root, entry.path);
      if (!existsSync(dir)) continue;
      for (const f of jsonFilesUnder(dir)) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(readFileSync(f, "utf-8"));
        } catch {
          continue;
        }
        for (const rec of materializationsIn(parsed, relative(repo, f))) {
          // `localPath` is INSTANCE-relative. Resolving it against the
          // catalogue directory instead yields a plausible-looking path that
          // does not exist — a probe error made three times in one session on
          // 2026-09-22, each time returning a believable answer rather than
          // an error.
          const abs = rec.localPath ? join(instanceRoot, rec.localPath) : undefined;
          out.push({ ...rec, ...(abs ? { abs } : {}) });
        }
      }
    }
  }
  // Deduped on source+id+localPath: one artefact may be described by a node
  // and by its own sidecar, and counting it twice would inflate every number
  // this gate prints.
  const seen = new Set<string>();
  return out.filter((r) => {
    const k = `${r.source}|${r.id ?? ""}|${r.localPath ?? ""}|${r.digest ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Verify one record against the bytes on disk. */
export function verify(rec: MaterializedRecord, all: readonly MaterializedRecord[] = []): Verdict {
  // A directory is checked THROUGH its parts, never by hashing it. Asked
  // before the fixity questions below, because "this has no digest" is the
  // wrong complaint about a directory — it could not have one.
  if (rec.localPath && rec.abs && existsSync(rec.abs) && statSync(rec.abs).isDirectory()) {
    // PARTS ARE FOUND BY NODE, NOT BY PATH PREFIX — and the first version of
    // this used the prefix, which found nothing.
    //
    // who-iris's item records `library/<id>` (the ingested form) while its
    // bitstreams record `uploads/<id>/<file>` (the original capture). Two
    // different trees describing one item, so "beneath this directory" is
    // simply the wrong question. What relates them is the document they are
    // declared in: a bitstream belongs to the node whose file it appears in.
    const parts = all.filter((o) => o !== rec && o.source === rec.source && o.digest !== undefined);
    if (parts.length > 0) return { kind: "covered-by-parts", record: rec, parts: parts.length };
    return { kind: "unverifiable", record: rec, why: "a directory whose node declares no verified parts" };
  }
  if (!rec.localPath) {
    // A materialized artefact with no path to its bytes. Not a mismatch — it
    // is a record nothing can check, which is its own finding.
    return { kind: "unverifiable", record: rec, why: "no localPath — nothing to hash" };
  }
  // EXISTENCE IS ASKED BEFORE FIXITY, and the order is the point.
  //
  // It was the other way round, and that masked a strictly worse fact with a
  // milder one: two smart-immunizations artefacts are declared `materialized`
  // with no file behind them at all, and because they also carried no digest
  // they were reported as "no fixity digest recorded" — filed beside 217
  // artefacts that are merely unverified.
  //
  // "Declared materialized and the bytes are not there" is a broken claim
  // whatever its fixity says. Asking about the digest first let the absence
  // hide inside a softer category, which is the same shape as reporting an
  // unverifiable artefact as a verified one.
  if (!rec.abs || !existsSync(rec.abs)) return { kind: "absent", record: rec };
  if (!rec.digest) {
    return { kind: "unverifiable", record: rec, why: "no fixity digest recorded" };
  }
  if (rec.algorithm !== undefined && rec.algorithm !== "sha256") {
    return { kind: "unverifiable", record: rec, why: `unsupported algorithm "${rec.algorithm}"` };
  }
  let actual: string;
  try {
    actual = createHash("sha256").update(readFileSync(rec.abs)).digest("hex");
  } catch (e) {
    return { kind: "unverifiable", record: rec, why: `could not read the bytes: ${String(e)}` };
  }
  return actual === rec.digest ? { kind: "verified", record: rec } : { kind: "mismatch", record: rec, actual };
}

export function run(repo = REPO): Verdict[] {
  const all = collect(repo);
  return all.map((r) => verify(r, all));
}

if (import.meta.main) {
  const json = process.argv.includes("--json");
  const verdicts = run();
  const by = (k: Verdict["kind"]): Verdict[] => verdicts.filter((v) => v.kind === k);
  const mismatch = by("mismatch");
  const absent = by("absent");
  const unverifiable = by("unverifiable");
  const verified = by("verified");
  const covered = by("covered-by-parts");

  if (json) {
    console.log(JSON.stringify({ verdicts }, null, 2));
  } else {
    console.log(
      `materialized artefacts: ${verdicts.length} — ` +
        `${verified.length} verified, ${covered.length} covered by their parts, ` +
        `${mismatch.length} edited in place, ${absent.length} missing, ` +
        `${unverifiable.length} unverifiable`,
    );
    for (const v of mismatch) {
      const r = v.record;
      console.error(
        `::error::materialized content was edited in place: ${r.localPath} (${r.name ?? r.id ?? "?"})\n` +
          `  recorded ${r.digest}\n  actual   ${(v as { actual: string }).actual}\n` +
          `  declared in ${r.source}\n` +
          `  A materialized artefact is a copy of somebody else's. Copy it into your own folio/ and edit\n` +
          `  the copy — or, if this was a publication step, update the fixity in the same change so the\n` +
          `  record says what the bytes are.`,
      );
    }
    for (const v of absent) {
      console.error(
        `::error::declared materialized, bytes absent: ${v.record.localPath} — declared in ${v.record.source}`,
      );
    }
    for (const v of unverifiable) {
      // A WARNING, not an error, and deliberately not silence. "Nobody can
      // check this" is a different claim from "this is unchanged", and
      // rendering it as a pass is how an unverifiable artefact becomes a
      // verified one in somebody's summary.
      console.warn(
        `::warning::cannot verify ${v.record.localPath ?? v.record.id ?? v.record.source}: ` +
          `${(v as { why: string }).why} — declared in ${v.record.source}`,
      );
    }
  }

  // Unverifiable does NOT fail: the owner ruled "enforce from the start" about
  // EDITING, and failing on an artefact that never carried fixity would block
  // work on a gap somebody else left rather than on a change somebody made.
  // It is reported every run so the gap stays visible instead of settling in.
  process.exit(mismatch.length + absent.length > 0 ? 1 : 0);
}
