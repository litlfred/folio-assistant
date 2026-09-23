/**
 * The durable record of a detangle measurement — what is pinned, and what is not.
 *
 * @module schemas/detangle-sidecar
 * @graphNode schema
 *
 * ## Why a committed file rather than a console report
 *
 * `kg-detangle` computes the arrow-direction model and, until 2026-09-21,
 * nothing recorded its output: no npm script, no gate, no workflow (bean
 * `sb6z`). So a regression in the authority map, the boundary arithmetic or
 * the cohesion computation was invisible until somebody happened to run it by
 * hand AND happened to remember what the numbers were last time.
 *
 * That last clause is the real gap. A printed verdict is gone the moment the
 * terminal scrolls, which makes "this has been wrong since it was written" and
 * "this broke in the commit under review" indistinguishable — the same
 * argument `kg:audit` records for writing sidecars instead of printing.
 *
 * ## WHAT IS PINNED, and the owner's ruling on it
 *
 * Owner, 2026-09-21: *"pin size, cohesion, authority counts. not verdict"*.
 *
 * | field | pinned | why |
 * |---|---|---|
 * | `size` | yes | a derived fact about the node set |
 * | `internal`, `inbound`, `outbound` | yes | see below — a ratio never travels alone |
 * | `cohesion` | yes | a derived fact |
 * | `enforcedBoundary`, `recordedBoundary`, `proseMentions` | yes | the authority counts |
 * | `role` | **no** | derived from the counts above; pinning it duplicates them |
 * | `verdict`, `clauses` | **no** | the ruling's explicit exclusion |
 *
 * **Why `verdict` is excluded is worth keeping.** It is the field a reviewer
 * most wants pinned and the one most likely to churn on unrelated edits: it is
 * a threshold comparison, so a group sitting near a boundary flips on a change
 * that moved nothing about that group. A sidecar that churns is a sidecar
 * people stop reading, and then the staleness check is noise rather than a
 * signal.
 *
 * **The raw counts ride with `cohesion` because this package says they must.**
 * `detangle.ts` on `oneWayness`: *"Reported with the raw counts, never instead
 * of them."* `cohesion` is `internal / (internal + inbound + outbound)`, so
 * pinning the ratio alone would let a change that preserves it — three edges
 * becoming thirty, say — pass unrecorded. That is not a widening of the
 * ruling; it is what pinning `cohesion` MEANS under this package's own rule.
 */

/** The pinned measurement for one candidate group. */
export interface DetangleSidecar {
  /** The schema tag, so the file declares what it is rather than being identified by shape. */
  readonly $schema: "folio-detangle-sidecar/v1";
  /** The group this measures — the same string `measure()` takes. */
  readonly group: string;
  /** Node count. */
  readonly size: number;
  /** Edges with both ends inside. */
  readonly internal: number;
  /** Edges from outside in. */
  readonly inbound: number;
  /** Edges from inside out. */
  readonly outbound: number;
  /** `internal / (internal + inbound + outbound)`, rounded — see {@link COHESION_DP}. */
  readonly cohesion: number;
  /** Boundary edges whose direction is a FACT. */
  readonly enforcedBoundary: number;
  /** Boundary edges whose direction is a FILING DECISION — symmetric coupling. */
  readonly recordedBoundary: number;
  /** Cross-group prose mentions. Neither a dependency nor a coupling. */
  readonly proseMentions: number;
}

/**
 * Decimal places `cohesion` is pinned at.
 *
 * A float compared exactly would make the check fail on the last bit of a
 * division that nothing about the graph changed. Two places is the precision
 * the report already prints (`coh` column, `toFixed(2)`), so the pinned value
 * and the displayed one cannot disagree — which is its own small defect class.
 */
export const COHESION_DP = 2;

/** The fields, in the order they are written. One list, so the writer and the comparer cannot drift. */
export const PINNED_FIELDS = [
  "group",
  "size",
  "internal",
  "inbound",
  "outbound",
  "cohesion",
  "enforcedBoundary",
  "recordedBoundary",
  "proseMentions",
] as const;

/**
 * Build the sidecar for a measurement.
 *
 * Takes the whole `DetangleMetrics` and picks, rather than being handed the
 * subset: the picking IS the ruling, and putting it here means a field added
 * to `DetangleMetrics` later is excluded by default rather than silently
 * pinned because somebody spread an object.
 */
export function sidecarFor(m: {
  group: string;
  size: number;
  internal: number;
  inbound: number;
  outbound: number;
  cohesion: number;
  enforcedBoundary: number;
  recordedBoundary: number;
  proseMentions: number;
}): DetangleSidecar {
  return {
    $schema: "folio-detangle-sidecar/v1",
    group: m.group,
    size: m.size,
    internal: m.internal,
    inbound: m.inbound,
    outbound: m.outbound,
    cohesion: Number(m.cohesion.toFixed(COHESION_DP)),
    enforcedBoundary: m.enforcedBoundary,
    recordedBoundary: m.recordedBoundary,
    proseMentions: m.proseMentions,
  };
}

/** Where a group's sidecar lives, relative to the results directory. */
export function sidecarPathFor(group: string): string {
  return `${group}.detangle.json`;
}

/**
 * The fields that differ between a fresh measurement and a committed one.
 *
 * Returns field names rather than a boolean, because "it is stale" is not a
 * useful thing to tell somebody: the question they have next is WHICH number
 * moved, and a diff of two JSON blobs makes them find it themselves.
 */
export function staleFields(committed: unknown, fresh: DetangleSidecar): string[] {
  const c = committed as Record<string, unknown> | null;
  if (c === null || typeof c !== "object") return [...PINNED_FIELDS];
  return PINNED_FIELDS.filter((f) => c[f] !== (fresh as unknown as Record<string, unknown>)[f]);
}
