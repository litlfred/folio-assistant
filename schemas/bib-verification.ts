/**
 * Bibliography verification schema — `content/bib-qa-verifications.json`.
 *
 * This file is the typed contract for the per-paper verification roster.
 * Each entry records a single examination of a reference against either a
 * local PDF or an external source.  Until 2026-05-31 the `verified_by`
 * field was free-text ("Claude (claude-opus-4-7)" etc.) and downstream
 * tools had no way to distinguish an agent claim from a human
 * adjudication.  The discriminated `Verifier` union below makes that
 * distinction first-class so the dashboard, `validate-bib`, and the
 * authors-note disclosure can treat the two cases differently.
 *
 * Migration history:
 *   2026-05-19  initial roster with free-text `verified_by`
 *   2026-05-20  `_verified_by_caveat` schema-level annotation
 *   2026-05-31  Verifier discriminated union (this commit)
 *
 * Backward-compat note: `bib-qa.ts` and `validate-bib.ts` parse the new
 * shape strictly.  The migration script
 * `content/pipeline/migrate-bib-verifier.ts` converts every legacy
 * free-text entry to the structured shape in one pass.
 */

/** Verification statuses for a single reference. */
export type VerificationStatus =
  | "verified-clean"      // PDF inspected, citations match
  | "partial"              // title+publisher upgrade; awaiting PDF
  | "fixed"                // misattributions corrected post-verification
  | "uncited"              // bib orphan — no citation site in the paper
  | "paper-mismatch"       // local PDF metadata != bib entry
  | "unfetchable"          // URL/DOI did not resolve
  | "pending-placement";   // intended-to-keep entry, citation site TBD

/** Discriminated union: agent-only vs human-adjudicated verifier.
 *
 * The two cases convey different epistemic weight.  `kind: "agent"` is a
 * machine-generated claim awaiting human review; `kind: "human"` is a
 * human adjudication, which may have been assisted by an agent but is
 * the human's stated position. */
export type Verifier =
  | {
      kind: "agent";
      /** The model identifier (e.g. `claude-opus-4-7`).  Bare model
       *  string only — no surrounding parens, no "Claude" prefix. */
      model: string;
    }
  | {
      kind: "human";
      /** The human's preferred attribution name. */
      name: string;
      /** Optional record of an agent that assisted with this
       *  verification.  Present when the human reviewed an agent-
       *  generated draft and accepted (with or without edits). */
      agent_assistance?: {
        model: string;
      };
    };

/** A single verification entry.  One per reference id in
 *  `content/schema/references.ts` that has been examined. */
export interface VerificationEntry {
  /** Reference id (matches a key in `references.ts`). */
  id: string;
  /** Current verification status. */
  status: VerificationStatus;
  /** Path to a local PDF that was inspected, if any. */
  local_pdf?: string | null;
  /** ISO 8601 timestamp of the verification. */
  verified_at?: string;
  /** Who / what produced the verification claim. */
  verified_by: Verifier;
  /** Separate human-adjudication provenance.  Distinct from
   *  `verified_by`: an entry can be `verified_by: { kind: "agent", ... }`
   *  and *also* carry `human_adjudicated` if a human has subsequently
   *  reviewed the agent's claim.  Status transitions like
   *  `paper-mismatch` and `uncited` (which trigger reference removal /
   *  metadata rewrite) SHOULD require this field to be set. */
  human_adjudicated?: {
    who: string;
    at: string;
    note?: string;
  };
  /** Number of citation-site fixes applied as part of this verification. */
  fixes_applied?: number;
  /** Reference to the commit that landed the fixes, if any. */
  fix_commit?: string;
  /** Free-text note for the verifier's reasoning. */
  note?: string;
}

/** Top-level JSON shape of `bib-qa-verifications.json`. */
export interface VerificationRoster {
  /** Self-describing schema string. */
  _schema: string;
  /** Statement of what this file is authoritative for. */
  _authoritative_for?: string;
  /** The verification entries. */
  entries: VerificationEntry[];
}

/** Type guard: is this an agent-only verifier? */
export function isAgentVerifier(v: Verifier): v is Extract<Verifier, { kind: "agent" }> {
  return v.kind === "agent";
}

/** Type guard: is this a human verifier? */
export function isHumanVerifier(v: Verifier): v is Extract<Verifier, { kind: "human" }> {
  return v.kind === "human";
}

/** Render a Verifier as a short human-readable string for dashboards. */
export function verifierLabel(v: Verifier): string {
  if (v.kind === "agent") return `agent (${v.model})`;
  const base = `human (${v.name})`;
  return v.agent_assistance ? `${base}, assisted by ${v.agent_assistance.model}` : base;
}
