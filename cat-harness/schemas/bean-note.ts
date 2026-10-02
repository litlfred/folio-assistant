/**
 * A BEAN NOTE — one pull request's addendum to a bean, in a file of its own.
 *
 * Bean `m61r`, issue #1853. `ob3m` (the navbar wireframe findings) was appended
 * to by one sibling pull request per finding. Each merge put every other open
 * pull request in conflict on that one bean, and the merge-main bot refuses a
 * bean conflict on purpose (`beans: refuse` in `merge-conflict-patterns.ts`),
 * so each needed a hand-merge: #1798, #1805, #1807, #1808 and #1819 within a
 * few hours on 2026-10-02.
 *
 * The owner chose per-PR notes over appends (option 1 of 3; teaching the bot to
 * union that one bean was rejected). A note is a file of its own, so two pull
 * requests adding notes touch two different paths and git merges them with
 * nothing to resolve.
 *
 * ## The naming rule is the whole design
 *
 * ```
 * <bean-id>--<YYYY-MM-DD>--<branch slug>.md
 * ```
 *
 * The **branch** is the key that makes two writers disjoint. Git refuses two
 * branches of one name on one remote, and one branch is one pull request's
 * head, so two pull requests open at the same time can never share it. It is
 * also known at the FIRST commit, which a pull request number is not — and the
 * rule is to open the pull request after that commit, not before it.
 *
 * A **date + finding slug** was considered and refused as the key: two
 * sessions working the same finding on the same day choose the same slug, which
 * is exactly the collision this exists to remove. The date stays, as a prefix
 * after the bean id, because it sorts a bean's notes in the order they were
 * started.
 *
 * One branch writes one file per bean. A second note from the same branch is a
 * new section in the same file, found by its front matter (`bean` + `branch`)
 * rather than recomputed from today's date — so a branch that runs over
 * midnight does not split its notes. Only that branch ever writes the file, so
 * appending to it cannot conflict with a sibling.
 *
 * ## The file declares what it is
 *
 * Front matter carries `$schema: folio-bean-note/v1`, the bean, the branch and
 * the date the note was started. A file in the notes directory that does not
 * carry the tag is a finding, never silently skipped, and the check recomputes
 * each file's name from its own front matter: a note whose name does not match
 * is one somebody named by hand, which is how the rule would be lost.
 *
 * @module cat-harness/schemas/bean-note
 * @graphNode schema
 */
import { z } from "zod";

/** The tag every note carries, so the file declares what it is. */
export const BEAN_NOTE_TAG = "folio-bean-note/v1";

/** `folio-assistant-ob3m` — the prefix the `beans` CLI mints, then a short id. */
const BeanId = z.string().regex(/^[a-z0-9][a-z0-9-]*-[a-z0-9]{4}$/, "a bean id, e.g. folio-assistant-ob3m");

/** A calendar date, UTC, as the note's start. */
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "a YYYY-MM-DD date");

export const BeanNoteFrontMatterSchema = z
  .object({
    $schema: z.literal(BEAN_NOTE_TAG),
    /** The bean this note adds to. It must exist in the bean store. */
    bean: BeanId,
    /** The branch that wrote it — the key that keeps two writers apart. */
    branch: z.string().min(1),
    /** When this branch started its note on this bean (UTC). */
    created: IsoDate,
  })
  .strict();

export type BeanNoteFrontMatter = z.infer<typeof BeanNoteFrontMatterSchema>;

/**
 * A branch name as a file-name segment: `/` and anything outside
 * `[A-Za-z0-9._-]` become `-`.
 *
 * Not injective — `a/b` and `a-b` meet — and that is accepted rather than
 * hidden: the writer refuses to append to a note whose front matter names a
 * different branch, so a meeting is an error at write time, never a silent
 * merge of two branches' notes into one file.
 */
export function branchSlug(branch: string): string {
  const slug = branch.replace(/[^A-Za-z0-9._-]/g, "-").replace(/^[.-]+/, "");
  if (!slug) throw new Error(`branch "${branch}" has no characters usable in a file name`);
  return slug;
}

/** The one name a note may have — see the module docblock for why. */
export function noteFileName(bean: string, created: string, branch: string): string {
  return `${bean}--${created}--${branchSlug(branch)}.md`;
}
