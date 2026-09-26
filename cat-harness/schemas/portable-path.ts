/**
 * Path segments a checkout can actually create — on every filesystem, not only
 * the one that wrote them.
 *
 * ## The failure this exists to stop
 *
 * A repository is not portable because its code is portable. It is portable
 * because every path in its tree can be CREATED on the filesystems people clone
 * it onto, and that is a property of the filenames, checked by nothing here
 * until 2026-09-21.
 *
 * Measured that day, from a user's terminal: `git clone` of this repository
 * fetched all 647,920 objects and then refused to check out —
 *
 * ```
 * error: invalid path 'cat-harness/test/results/kg-qa/skills/requirements/req:agent-workflow.kg-qa.json'
 * fatal: unable to checkout working tree
 * ```
 *
 * Seven files, one per requirement, named from a subject id of the form
 * `req:<slug>`. NTFS reserves `:` inside a path component for alternate data
 * streams, so Git will not create the file and aborts the whole checkout —
 * **the repository was unclonable on Windows**, for everybody, for every file,
 * not just the seven. The fetch succeeding is what makes this shape so easy to
 * ship: nothing fails for the author, on the machine that wrote the name, and
 * CI runs on Linux where the name is fine.
 *
 * ## Why ENCODE rather than substitute
 *
 * The obvious repair — `:` becomes `-` — is not available here.
 * {@link kgQaSidecarPath} promises collision-freedom, and substitution breaks
 * it: `req:agent-workflow` and a future `req-agent-workflow` would compose the
 * same sidecar, and one verdict would silently overwrite the other. That is the
 * exact defect the mirrored results tree was built to remove, reintroduced one
 * character at a time.
 *
 * Percent-encoding is reversible, so it cannot collide: `%` is itself encoded,
 * which is what makes the mapping injective. `req:agent-workflow` becomes
 * `req%3Aagent-workflow` — legible enough to recognise, and decodable back to
 * the id it names.
 *
 * ## The encoder is not the gate, and the gate does not cover everything
 *
 * Encoding only protects the names a caller routes through here. A
 * hand-authored file lands in the tree unchecked — which is how the seven got
 * there — so {@link unportableSegment} is also the predicate a repository-wide
 * gate runs (`scripts/check-portable-paths.ts`), and a clone-breaking name
 * fails on the day it is committed rather than on the day somebody on Windows
 * tries.
 *
 * **That gate reads `git ls-files`, so it sees TRACKED paths only.** Output a
 * generator writes into an ignored build directory is outside it, and an
 * unportable name there breaks a Windows *build* rather than a clone. Nothing
 * here closes that; it is named so the next reader does not assume otherwise.
 * The cover for those writers is this module's encoding at the composer, which
 * is why the id-to-filename call sites route through {@link portableSegment}
 * rather than relying on the gate to catch them.
 *
 * ## Encoding is not always the right tool
 *
 * Where a segment is also a PUBLIC ROUTE — `scripts/state-visualizer.ts`
 * builds a site directory from a declared graph id — encoding would silently
 * publish `/req%3Ax/` and the declaration would stop saying where the page is.
 * There the id is refused with a message naming the remedy, exactly as a
 * reserved device name is: `aux` has nothing to encode, and some ids simply
 * have to be renamed.
 *
 * @graphNode none — a predicate and an encoder over path strings, not a schema
 * @module schemas/portable-path
 */

/**
 * Characters no Windows path component may contain.
 *
 * `/` is the separator everywhere and `\` is one on Windows, so both are
 * rejected in a SEGMENT even though they are legal bytes in a POSIX filename —
 * a segment carrying either is not one segment.
 */
const RESERVED_CHARS = /[<>:"/\\|?*\u0000-\u001f]/;

/**
 * Windows device names, reserved as the part before the FIRST dot.
 *
 * `CON.txt` is as reserved as `CON`, which is why this is tested against the
 * leading component of the segment rather than against the whole of it.
 */
const RESERVED_NAMES =
  /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])$/i;

/** Why a segment cannot be created, in words a committer can act on. */
export type UnportableReason =
  | "empty"
  | "reserved-character"
  | "reserved-device-name"
  | "trailing-dot-or-space";

/**
 * Why this segment would break a checkout, or `undefined` if it would not.
 *
 * Returns the REASON rather than a boolean because the two failures want
 * different repairs: a reserved character is renamed or encoded, a reserved
 * device name has to be renamed outright — there is no encoding of `aux` that
 * is still `aux`.
 *
 * @param segment one path component — never a whole path.
 */
export function unportableSegment(segment: string): UnportableReason | undefined {
  if (segment.length === 0) return "empty";
  if (RESERVED_CHARS.test(segment)) return "reserved-character";
  // Windows silently STRIPS a trailing dot or space, so `foo.` and `foo` are
  // one file there and two here. A checkout that renames a file underneath you
  // is worse than one that refuses it.
  if (/[. ]$/.test(segment)) return "trailing-dot-or-space";
  const stem = segment.split(".")[0] ?? "";
  if (RESERVED_NAMES.test(stem)) return "reserved-device-name";
  return undefined;
}

/**
 * The first unportable segment of a path, with the reason, or `undefined`.
 *
 * Takes a repo-relative path with `/` separators — what `git ls-files` prints.
 */
export function unportablePath(
  path: string,
): { segment: string; reason: UnportableReason } | undefined {
  for (const segment of path.split("/")) {
    if (segment === "") continue; // A trailing or doubled separator is not a segment.
    const reason = unportableSegment(segment);
    if (reason) return { segment, reason };
  }
  return undefined;
}

/**
 * A segment that every filesystem can create, reversibly derived from `raw`.
 *
 * Percent-encodes `%` first and then each reserved character, so the mapping is
 * injective — see the module comment for why substitution is not an option
 * here. A trailing dot or space is encoded for the same reason it is rejected
 * above: Windows would strip it and quietly alias two names into one.
 *
 * It does NOT rescue a reserved device name, because encoding cannot: `aux`
 * contains nothing to encode. {@link unportableSegment} still reports one, and
 * a subject whose id is `aux` needs a different id.
 */
export function portableSegment(raw: string): string {
  const encoded = raw
    .replace(/%/g, "%25")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
  return encoded.replace(/[. ]$/, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
}
