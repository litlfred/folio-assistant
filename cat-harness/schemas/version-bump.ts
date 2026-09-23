/**
 * version-bump.ts — `instance-versioning.md` §4: what a version MEANS, and
 * what makes it go up.
 *
 * > **A version governs a surface.** For a code library that is the exported
 * > API. For an instance it is the **declared** surface, and this repository
 * > already knows how to enumerate it: graph kinds, skill ids, tool ids, block
 * > kinds, asset roles, declared directories — everything `kg-export` walks.
 *
 * | bump | when |
 * |---|---|
 * | **major** | a consumer must change something — a subject **removed or renamed** |
 * | **minor** | something **added** that a consumer may use |
 * | **patch** | everything else, prose included |
 *
 * ## Why a diff rather than a commit message
 *
 * §4.1, and it is the argument for the whole section: **a commit message is a
 * claim about a change; an exported-graph diff IS the change.** A `feat:`
 * prefix on a commit that removed a skill id yields a minor bump under
 * `release-please`'s heuristic, and a broken consumer. The diff cannot make
 * that mistake.
 *
 * ## §4.1's falsifier was run before this module was written
 *
 * The proposal refused to have §4 built on trust:
 *
 * > **The falsifier, and it should be tested before this is built:** if the
 * > exported surface churns on changes that are not consumer-visible … then
 * > the computed bump is noise and every release reads as major. Measure the
 * > surface diff across the last twenty commits on `main` before committing to
 * > this.
 *
 * Measured 2026-09-23 over the last 20 commits on `main`, following
 * `--first-parent`: **18 patch, 1 minor, 1 major**, and both non-patch calls
 * correct on inspection. The surface does not churn, so this exists.
 *
 * **The first run of that measurement said the opposite, and the reason is
 * worth carrying here.** `git log -21` without `--first-parent` interleaves
 * sibling branch tips, so consecutive entries are not parent→child; it read
 * 3 major / 5 minor / 12 patch, which would have failed the falsifier, and
 * every bit of that signal was one branch's five nodes oscillating in and out
 * of the comparison. Anyone re-running it must walk the mainline.
 *
 * ## One known characteristic, reported rather than hidden
 *
 * A **rename reads as major** — the old id is removed and a new one added.
 * That is the conservative direction and it is honest (a consumer resolving
 * the old id does break), but it means a major does not imply that capability
 * was withdrawn. {@link SurfaceDiff} carries `added` and `removed` separately
 * so a caller can see a rename for what it is rather than inferring it from
 * the verdict.
 *
 * @graphNode schema
 * @module schemas/version-bump
 */

/** A version bump, in increasing order of what it costs a consumer. */
export type Bump = "patch" | "minor" | "major";

/** `major` > `minor` > `patch`, so the strictest of several can be taken. */
export const BUMP_RANK: Readonly<Record<Bump, number>> = { patch: 0, minor: 1, major: 2 };

/**
 * One subject in the exported surface: its type and its id, together.
 *
 * **Together, not the id alone.** A node keeping its id while changing its
 * `@type` is a different thing under the same name — precisely the change a
 * consumer must be told about — and keying on the id would score it `patch`.
 */
export interface SurfaceSubject {
  type: string;
  id: string;
}

export interface SurfaceDiff {
  added: SurfaceSubject[];
  removed: SurfaceSubject[];
  bump: Bump;
}

/** The shape this reads out of an exported document. Deliberately minimal. */
interface ExportedGraph {
  "@graph"?: unknown[];
}

function key(s: SurfaceSubject): string {
  return `${s.type}\t${s.id}`;
}

/**
 * The consumer-visible surface of an exported graph.
 *
 * Every `@graph` node with an `@id`. Deliberately NOT a hand-picked subset of
 * types: §4 lists "graph kinds, skill ids, tool ids, block kinds, asset roles,
 * declared directories" as examples of the declared surface rather than as its
 * definition, and a list maintained here would silently stop covering a type
 * added to the exporter. The falsifier measured the whole surface and found it
 * stable, so the whole surface is what this reads.
 *
 * A node without an `@id` is not a subject a consumer can resolve, so it is
 * not part of the surface — and a node with an `@id` but no `@type` is scored
 * under `?` rather than dropped, since losing it would make an untyped node
 * invisible to the diff.
 */
export function surfaceOf(doc: unknown): SurfaceSubject[] {
  const graph = (doc as ExportedGraph)?.["@graph"];
  if (!Array.isArray(graph)) return [];
  const seen = new Map<string, SurfaceSubject>();
  for (const node of graph) {
    const o = node as Record<string, unknown>;
    const id = o["@id"];
    if (typeof id !== "string" || id === "") continue;
    const rawType = o["@type"];
    const type = Array.isArray(rawType)
      ? rawType.map(String).sort().join("+")
      : typeof rawType === "string"
        ? rawType
        : "?";
    const subject = { type, id };
    seen.set(key(subject), subject);
  }
  return [...seen.values()].sort((a, b) => key(a).localeCompare(key(b)));
}

/**
 * The bump the change from `before` to `after` requires.
 *
 * A removal outranks an addition: a release that both adds and removes is
 * major, because the removal is the part a consumer must act on.
 */
export function diffSurface(
  before: readonly SurfaceSubject[],
  after: readonly SurfaceSubject[],
): SurfaceDiff {
  const b = new Set(before.map(key));
  const a = new Set(after.map(key));
  const added = after.filter((s) => !b.has(key(s)));
  const removed = before.filter((s) => !a.has(key(s)));
  const bump: Bump = removed.length > 0 ? "major" : added.length > 0 ? "minor" : "patch";
  return { added, removed, bump };
}

/** The version a bump applied to `from` produces. */
export function applyBump(from: string, bump: Bump): string {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(from);
  // `current` and `dev` are pseudo-versions with no triple to bump. Returned
  // unchanged rather than coerced to `0.0.1`: they are a STAGING choice
  // (§3.3), and inventing a release number for one would be this module
  // asserting a publication that nobody made.
  if (m === null) return from;
  const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Whether a declared version clears the computed floor.
 *
 * §4.1: the gate *"fails when the declared `version` is lower than the
 * computed one. It never writes the version — the author may always bump
 * further than computed (a prose rewrite released as minor is their call), but
 * never less."*
 *
 * So this compares against a FLOOR rather than an exact expectation, and the
 * asymmetry is the point: under-bumping breaks a consumer silently, while
 * over-bumping costs them a version number.
 */
export function clearsFloor(declared: string, floor: string): boolean {
  const parse = (v: string): [number, number, number] | undefined => {
    const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v);
    return m === null ? undefined : [Number(m[1]), Number(m[2]), Number(m[3])];
  };
  const d = parse(declared);
  const f = parse(floor);
  // A pseudo-version cannot be compared. `false` would fail every staging
  // build; `true` would pass one silently. The caller is given `undefined`
  // -shaped honesty instead, via a separate predicate — here, an unparseable
  // pair is NOT a pass, and the gate reports it as undetermined.
  if (d === undefined || f === undefined) return false;
  for (let i = 0; i < 3; i += 1) {
    if (d[i]! > f[i]!) return true;
    if (d[i]! < f[i]!) return false;
  }
  return true;
}

/** Whether both versions are comparable triples — see {@link clearsFloor}. */
export function comparable(...versions: string[]): boolean {
  return versions.every((v) => /^\d+\.\d+\.\d+/.test(v));
}
