/**
 * Folio Assistant — source-relevance API routes.
 *
 * Presents the source ledger (`content/bib-qa-verifications.json`) to the
 * author: what has been uploaded, whether it bears on the folio, which of
 * its results are usable, whether it is already cited, and what to do next.
 *
 *   GET  /api/relevance/ledger?verdict=&status=&cited=  → triaged rows
 *   GET  /api/relevance/queue                            → untriaged rows
 *   GET  /api/relevance/summary                          → counts for a dashboard
 *   POST /api/relevance/adjudicate                       → accept/revise a verdict
 *
 * ## The join happens here
 *
 * The ledger stores no bibliographic metadata — only a reference `id`.  These
 * handlers read `content/schema/references.ts` and join title/authors/year
 * onto each row at request time.  That is the whole point of the split: one
 * writer for metadata, many readers.  Do not cache the joined shape back into
 * the ledger.
 *
 * ## Adjudication
 *
 * A relevance verdict produced by an agent is a claim.  `POST
 * /api/relevance/adjudicate` is how a human accepts, revises, or rejects it,
 * writing `human_adjudicated` alongside — never overwriting — the agent's
 * `assessed_by`.  Both survive, so the dashboard can distinguish "an agent
 * thinks this is core" from "the author agrees".
 *
 * @module folio-assistant/routes/relevance
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { hasRole, forbidden, getUserRole } from "../core/rbac.js";
import { log } from "../core/logging.js";
import type {
  LedgerEntry,
  RelevanceVerdict,
  SourceLedger,
} from "../../schemas/bib-verification.js";

const CORS = { "Access-Control-Allow-Origin": "*" };

interface RelevanceRoutesConfig {
  /** Repo root directory. */
  repoRoot: string;
}

/** Bibliographic facts, read from references.ts and joined onto a row. */
interface RefFacts {
  title: string | null;
  authors: string | null;
  year: string | null;
  url: string | null;
}

function ledgerPath(repoRoot: string): string {
  return join(repoRoot, "content", "bib-qa-verifications.json");
}

function readLedger(repoRoot: string): SourceLedger {
  const p = ledgerPath(repoRoot);
  if (!existsSync(p)) return { _schema: "source-ledger/v1", entries: [] };
  return JSON.parse(readFileSync(p, "utf-8"));
}

/**
 * Read `references.ts` for the facts the ledger deliberately does not store.
 *
 * A regex read rather than an import: `references.ts` is a 470-entry
 * TypeScript module, and the route needs four strings per entry, not the
 * validated CSL objects.  It is also never executed this way.
 */
function readRefFacts(repoRoot: string): Map<string, RefFacts> {
  const p = join(repoRoot, "content", "schema", "references.ts");
  const out = new Map<string, RefFacts>();
  if (!existsSync(p)) return out;
  const src = readFileSync(p, "utf-8");

  for (const m of src.matchAll(/ref\(\{(.*?)\n\s*\}\)/gs)) {
    const body = m[1];
    const id = body.match(/\bid:\s*"([^"]+)"/)?.[1];
    if (!id) continue;

    const title = body.match(/\n\s*title:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? null;
    const year = body.match(/"date-parts":\s*\[\[\s*(\d{4})/)?.[1] ?? null;
    const url =
      body.match(/\bURL:\s*"([^"]+)"/)?.[1] ??
      (body.match(/\bDOI:\s*"([^"]+)"/)?.[1]
        ? `https://doi.org/${body.match(/\bDOI:\s*"([^"]+)"/)?.[1]}`
        : null);

    const families = [...body.matchAll(/\bfamily:\s*"((?:[^"\\]|\\.)*)"/g)].map((f) => f[1]);
    const literals = [...body.matchAll(/\bliteral:\s*"((?:[^"\\]|\\.)*)"/g)].map((f) => f[1]);
    const names = families.length ? families : literals;
    const authors = names.length
      ? names.length > 3
        ? `${names[0]} et al.`
        : names.join(", ")
      : null;

    out.set(id, { title: title?.replace(/\\"/g, '"') ?? null, authors, year, url });
  }
  return out;
}

/** A ledger row plus the reference facts joined in for display. */
function decorate(e: LedgerEntry, facts: Map<string, RefFacts>, repoRoot: string) {
  const file = e.source?.kind === "upload" ? e.source.file : null;
  const ref = e.id ? (facts.get(e.id) ?? null) : null;
  return {
    ...e,
    /** Joined at read time from references.ts — never stored in the ledger. */
    reference: ref,
    /** True when the row cites a local document that is not in the repo. */
    sourceMissing: file ? !existsSync(join(repoRoot, file)) : false,
    /** True when the document backs no reference yet. */
    orphan: e.id === null,
  };
}

// ── GET ──────────────────────────────────────────────────────────

export async function handleRelevanceGet(
  url: URL,
  config: RelevanceRoutesConfig,
): Promise<Response | null> {
  const path = url.pathname;
  if (!path.startsWith("/api/relevance/")) return null;

  const ledger = readLedger(config.repoRoot);
  const facts = readRefFacts(config.repoRoot);

  if (path === "/api/relevance/summary") {
    const byVerdict: Record<string, number> = {};
    let triaged = 0;
    let orphans = 0;
    let missing = 0;
    let openActions = 0;
    for (const e of ledger.entries) {
      if (e.id === null) orphans++;
      if (e.source?.kind === "upload" && !existsSync(join(config.repoRoot, e.source.file))) {
        missing++;
      }
      if (!e.relevance) continue;
      triaged++;
      byVerdict[e.relevance.verdict] = (byVerdict[e.relevance.verdict] ?? 0) + 1;
      openActions += e.relevance.proposedActions.filter((a) => a.action !== "no-action").length;
    }
    return Response.json(
      {
        total: ledger.entries.length,
        triaged,
        untriaged: ledger.entries.length - triaged,
        orphans,
        sourceMissing: missing,
        openActions,
        byVerdict,
      },
      { headers: CORS },
    );
  }

  if (path === "/api/relevance/queue") {
    // What the author has not looked at yet.  Uploaded documents first:
    // an external row with no local copy cannot be read here anyway.
    const rows = ledger.entries
      .filter((e) => !e.relevance)
      .sort((a, b) => Number(b.source?.kind === "upload") - Number(a.source?.kind === "upload"))
      .map((e) => decorate(e, facts, config.repoRoot));
    return Response.json({ count: rows.length, entries: rows }, { headers: CORS });
  }

  if (path === "/api/relevance/ledger") {
    const verdict = url.searchParams.get("verdict");
    const status = url.searchParams.get("status");
    const cited = url.searchParams.get("cited");

    let rows = ledger.entries.filter((e) => e.relevance);
    if (verdict) rows = rows.filter((e) => e.relevance?.verdict === verdict);
    if (status) rows = rows.filter((e) => e.status === status);
    if (cited === "false") rows = rows.filter((e) => e.id === null);
    if (cited === "true") rows = rows.filter((e) => e.id !== null);

    // Most actionable first: core before supporting, and within a verdict,
    // the rows carrying the most outstanding proposals.
    const rank: Record<RelevanceVerdict, number> = {
      core: 0,
      supporting: 1,
      undetermined: 2,
      tangential: 3,
      "not-relevant": 4,
    };
    rows.sort((a, b) => {
      const d = rank[a.relevance!.verdict] - rank[b.relevance!.verdict];
      if (d !== 0) return d;
      return b.relevance!.proposedActions.length - a.relevance!.proposedActions.length;
    });

    return Response.json(
      {
        count: rows.length,
        entries: rows.map((e) => decorate(e, facts, config.repoRoot)),
      },
      { headers: CORS },
    );
  }

  return null;
}

// ── POST ─────────────────────────────────────────────────────────

interface AdjudicatePayload {
  /** Upload path, or reference id for an external row. */
  key: string;
  /** Accept the agent's verdict, or replace it. */
  verdict?: RelevanceVerdict;
  who: string;
  note?: string;
}

export async function handleRelevancePost(
  req: Request,
  url: URL,
  config: RelevanceRoutesConfig,
): Promise<Response | null> {
  if (url.pathname !== "/api/relevance/adjudicate") return null;

  if (!hasRole(req, "collaborator")) {
    return forbidden("adjudicating a relevance verdict", "collaborator");
  }

  let payload: AdjudicatePayload;
  try {
    payload = (await req.json()) as AdjudicatePayload;
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400, headers: CORS });
  }
  if (!payload?.key || !payload?.who) {
    return Response.json({ error: "key and who are required" }, { status: 400, headers: CORS });
  }

  const ledger = readLedger(config.repoRoot);
  const entry = ledger.entries.find(
    (e) => (e.source?.kind === "upload" ? e.source.file : e.id) === payload.key,
  );
  if (!entry) {
    return Response.json({ error: "no such ledger row" }, { status: 404, headers: CORS });
  }
  if (!entry.relevance) {
    return Response.json(
      { error: "row has no relevance assessment to adjudicate" },
      { status: 409, headers: CORS },
    );
  }

  // The agent's claim is preserved: a human decision is recorded alongside
  // `assessed_by`, never in place of it.
  if (payload.verdict) entry.relevance.verdict = payload.verdict;
  entry.relevance.human_adjudicated = {
    who: payload.who,
    at: new Date().toISOString(),
    ...(payload.note ? { note: payload.note } : {}),
  };

  writeFileSync(ledgerPath(config.repoRoot), `${JSON.stringify(ledger, null, 2)}\n`);
  log("relevance", `adjudicated ${payload.key} by ${getUserRole(req)}`);

  return Response.json({ ok: true, entry }, { headers: CORS });
}
