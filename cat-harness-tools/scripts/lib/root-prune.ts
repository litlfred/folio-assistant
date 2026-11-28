/**
 * What a ROOT publish keeps of the branch it replaces, and what it prunes.
 *
 * A root publish replaces the publish branch with the built site, keeping the
 * top-level entries it is told to keep (`publish-site.ts --keep`). Until
 * 2026-11-28 that list always held `STAGING/` and `_render-log/`, so a tree
 * no step had written for weeks was carried forward by every publish: qou's
 * gh-pages still served October's `STAGING/` and a `_render-log/` the
 * `site.build` path never writes (owner, 2026-11-28, gap 7 of the qou site
 * audit). The rule is now:
 *
 * - **Always kept**, never overwritten: `branches/` (the previews), `PC/`
 *   (publish-main-site's public-comment tree) and every `site.build.keep`
 *   entry. A kept entry is the branch's, not the build's: what the build wrote
 *   there is not published (qou keeps `papers/`, which paper-pdf.yml owns).
 * - **Kept when this build does not write it**: `papers/`, `lean/` and every
 *   `cat-*` entry. Other workflows write these (a paper PDF, a Lean store, a
 *   layer's QA or sub-graph index), so a build that does not produce one must
 *   not delete it. A build that does produce one replaces it.
 * - **Everything else the build did not write is pruned**: `STAGING/`,
 *   `_render-log/`, and any tree a removed step used to write. A repository
 *   that still needs one lists it in `site.build.keep`.
 *
 * Pure, so the rule is testable without a branch.
 *
 * @module cat-harness-tools/scripts/lib/root-prune
 */

/** Root entries kept when the build does not write them: exact names, or a `prefix*`. */
export const KEPT_WHEN_NOT_BUILT: readonly string[] = ["papers", "lean", "cat-*"];

const matches = (name: string, pattern: string): boolean =>
  pattern.endsWith("*") ? name.startsWith(pattern.slice(0, -1)) : name === pattern;

/** The publish branch's own entries git keeps there and no build writes. */
const BRANCH_OWN = new Set([".git", ".nojekyll"]);

export interface RootKeep {
  /** The entries to pass to `publish-site.ts` as `keep`. */
  keep: string[];
  /** Entries of the published root kept because the build does not write them ({@link KEPT_WHEN_NOT_BUILT}). */
  preserved: string[];
  /** Entries of the published root this publish removes: nothing the build wrote, and not kept. */
  pruned: string[];
}

/**
 * The keep list for a root publish, and what it prunes.
 *
 * @param o.always   entries always kept (`branches`, `PC`, `site.build.keep`)
 * @param o.built    the built site's top-level entries
 * @param o.published the published root's top-level entries, or undefined when it could not be read
 *                    (then nothing can be said to be pruned, and every fixed name of
 *                    {@link KEPT_WHEN_NOT_BUILT} the build does not write is kept, so a
 *                    branch that cannot be listed loses nothing it would have kept)
 */
export function rootPublishKeep(o: { always: readonly string[]; built: readonly string[]; published?: readonly string[] }): RootKeep {
  const built = new Set(o.built);
  const always = new Set(o.always);
  const keep = new Set(o.always);
  const preserved: string[] = [];
  const pruned: string[] = [];
  if (o.published === undefined) {
    for (const p of KEPT_WHEN_NOT_BUILT) if (!p.endsWith("*") && !built.has(p)) keep.add(p);
    return { keep: [...keep], preserved, pruned };
  }
  for (const name of [...o.published].sort()) {
    if (BRANCH_OWN.has(name) || built.has(name) || always.has(name)) continue;
    if (KEPT_WHEN_NOT_BUILT.some((p) => matches(name, p))) {
      keep.add(name);
      preserved.push(name);
    } else pruned.push(name);
  }
  return { keep: [...keep], preserved, pruned };
}
