/**
 * Is an ingested document L1 — WHO guideline content the SMART knowledge graph
 * describes — and which kind of publication is it? Bean `mffs`.
 *
 * Owner, 2026-10-07: *"do all 3 (declared, inferred and decided)"*. The answer
 * is recorded on the intake (`classifications`, `cat-harness/schemas/intake.ts`)
 * from up to three sources and resolved here by precedence:
 *
 * | source | who | smart-kg derivation |
 * |---|---|---|
 * | `declared` | a person said so | `decided` (and the evidence names them and the date) |
 * | `context` | the process that acquired it decided, e.g. a DAK's library step fetching what Component 1 cites | `derived` |
 * | `inferred` | {@link inferL1} read it off the Dublin Core record | `inferred` |
 *
 * The highest-precedence record wins; every lower one that disagrees is
 * reported, never dropped. No record at all is `undetermined` — the L1 step
 * then does nothing and says so, rather than treating silence as "no".
 *
 * The scheme, its codes and the inference rule are the content type's, so they
 * live here and not in the platform's intake schema.
 *
 * @module smart-base/scripts/l1-membership
 */
import type { DublinCoreRecord, Intake, IntakeClassification } from "../platform.js";

/** The SMART knowledge-graph layer scheme; `code` is the layer (`l1`). */
export const LAYER_SCHEME = "https://smart.who.int/kg/layer";
const PRECEDENCE = ["declared", "context", "inferred"] as const;
const DERIVATION = { declared: "decided", context: "derived", inferred: "inferred" } as const;

export interface L1Decision {
  status: "member" | "not-member" | "undetermined";
  publicationType?: string;
  /** The record that decided it, and its smart-kg derivation. */
  decidedBy?: IntakeClassification;
  derivation?: "decided" | "derived" | "inferred";
  /** Lower-precedence records that say otherwise — reported, never dropped. */
  disagreements: string[];
}

const dc = (rec: DublinCoreRecord, element: string, qualifier?: string): string[] =>
  rec.fields.filter((f) => f.element === element && f.qualifier === qualifier).flatMap((f) => f.values.map((v) => v.value));

/**
 * The inference rule, from the repository's own metadata only — never from the
 * PDF's prose. Undetermined when no rule fires: most of a library is neither.
 *
 * Checked in this order, because the signals overlap: a DAK's title says
 * "recommendations" and DDCC's says "implementation guidance".
 */
export function inferL1(rec: DublinCoreRecord): IntakeClassification | undefined {
  const title = dc(rec, "title")[0] ?? "";
  const series = dc(rec, "relation", "ispartofseries").join("; ");
  const mk = (member: boolean, basis: string, publicationType?: string): IntakeClassification => ({
    scheme: LAYER_SCHEME,
    code: "l1",
    member,
    ...(publicationType ? { properties: { publicationType } } : {}),
    source: "inferred",
    basis: `smart-base/scripts/l1-membership.ts inferL1: ${basis}`,
  });
  if (/smart guidelines/i.test(series)) return mk(false, `dc.relation.ispartofseries = '${series}': a SMART Guidelines digital adaptation kit, an L2 artefact`);
  if (/\btechnical specifications?\b/i.test(title)) return mk(false, `dc.title says 'technical specification': a data and interoperability specification, not guideline content`);
  if (/\bsummary tables?\b/i.test(title)) return mk(true, `dc.title says 'summary table'`, "summary-table");
  if (/\bposition paper\b/i.test(title)) return mk(true, `dc.title says 'position paper'`, "position-paper");
  if (/\bclassification\b/i.test(title)) return mk(true, `dc.title says 'classification'`, "classification");
  if (/\bguidance\b/i.test(title)) return mk(true, `dc.title says 'guidance'`, "implementation-guidance");
  // A guideline's subtype (standard, consolidated, interim…) turns on its GRC
  // history, which the record does not carry — so membership only.
  if (/\bguidelines?\b|\brecommendations\b/i.test(title)) return mk(true, `dc.title says 'guideline' or 'recommendations'; its subtype needs the GRC record`);
  return undefined;
}

/** Resolve the intake's records plus the inferred one by precedence. */
export function decideL1(intake: Intake | undefined, rec: DublinCoreRecord | undefined): L1Decision {
  const recorded = (intake?.classifications ?? []).filter((c) => c.scheme === LAYER_SCHEME && c.code === "l1");
  const inferred = rec && !recorded.some((c) => c.source === "inferred") ? inferL1(rec) : undefined;
  const all = [...recorded, ...(inferred ? [inferred] : [])].sort((a, b) => PRECEDENCE.indexOf(a.source) - PRECEDENCE.indexOf(b.source));
  const top = all[0];
  if (!top) return { status: "undetermined", disagreements: [] };
  const type = (c: IntakeClassification) => c.properties?.publicationType;
  const disagreements = all
    .slice(1)
    .filter((c) => c.member !== top.member || (top.member && type(c) && type(top) && type(c) !== type(top)))
    .map((c) => `${c.source} says ${c.member ? `L1${type(c) ? ` (${type(c)})` : ""}` : "not L1"} — ${c.basis}; ${top.source} wins`);
  return {
    status: top.member ? "member" : "not-member",
    // A lower record may supply the type the deciding one left out, if it agrees on membership.
    publicationType: top.member ? (type(top) ?? all.find((c) => c.member && type(c))?.properties?.publicationType) : undefined,
    decidedBy: top,
    derivation: DERIVATION[top.source],
    disagreements,
  };
}
