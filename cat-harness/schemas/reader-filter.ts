/**
 * The filter a READER applies to a board, which commits nothing.
 *
 * @module schemas/reader-filter
 * @graphNode schema
 *
 * ## Two filters, and the whole value of this module is that they are two
 *
 * CRDM Q3 gave a board a DECLARED filter — {@link module:schemas/board}'s
 * `pages` and `kinds` — which says what the board IS. The owner's later
 * *"be able to filter out by kind properties things on miror board"* is a
 * different object: a reader narrowing their own view, at view time.
 *
 * **Conflating them would make one reader's temporary view edit the board
 * everyone else opens.** That is not a hypothetical about this codebase; it is
 * what happens the moment a "filter" control writes to `boards/<id>.json`
 * because that is where the other filter lives. So this module holds no
 * `$schema` tag, no file name, no reader and no writer — like
 * `window-stack.ts`, **it is state, not a document**, and the absence is the
 * design rather than an omission.
 *
 * ## The reader's filter can only NARROW
 *
 * Composition is `boardContent` first, then this. A reader cannot use their
 * filter to see something the board does not show, which keeps the declared
 * filter meaningful: a board scoped to one page stays scoped to one page
 * however its reader is filtering. {@link visibleOn} enforces the order so no
 * caller has to remember it, and `reader-filter.test.ts` asserts the subset
 * property over generated cases rather than trusting the composition to stay
 * written that way.
 *
 * ## Same logic as the declared filter, deliberately
 *
 * OR within an axis, AND across them. A reader who has learned what the
 * board's filter means has learned what theirs means; two filters with two
 * logics on one surface is a thing nobody can predict the result of.
 *
 * An axis that is ABSENT does not filter. An axis present but EMPTY is
 * refused by {@link readerFilterProblem} rather than treated as "match
 * nothing": an empty selection is a control in a state its reader did not
 * choose deliberately, and silently showing them a blank board is the least
 * useful reading of it.
 */

/** What a reader is narrowing by. Absent axes do not filter. */
export interface ReaderFilter {
  /** Kinds to keep. OR within the list. */
  kinds?: readonly string[];
  /**
   * Kind properties to keep, keyed by property name — the owner's *"filter out
   * by kind properties"*. OR within a property's values, AND across
   * properties.
   */
  properties?: Readonly<Record<string, readonly string[]>>;
}

/** Nothing selected: every node the board shows stays shown. */
export const NO_READER_FILTER: ReaderFilter = {};

/** What a reader's filter matches on — a board node plus its own properties. */
export interface FilterableNode {
  kind?: string;
  /** The node's own properties, e.g. `{ status: "open", priority: "high" }`. */
  properties?: Readonly<Record<string, string>>;
}

/**
 * Why this filter cannot be applied, or `undefined` when it can.
 *
 * An EMPTY axis is the case worth refusing. `kinds: []` reads as "match
 * nothing" to a naive implementation and as "no kind filter" to a careless
 * one, and neither is what a reader who has just cleared every checkbox
 * meant. Reporting it lets the caller put the control back rather than paint
 * an empty board that looks like a folio with no content.
 */
export function readerFilterProblem(filter: ReaderFilter): string | undefined {
  if (filter.kinds !== undefined && filter.kinds.length === 0) {
    return "the kind filter is on with nothing selected, which is not a choice a reader makes deliberately";
  }
  for (const [name, values] of Object.entries(filter.properties ?? {})) {
    if (values.length === 0) {
      return `the "${name}" filter is on with nothing selected, which is not a choice a reader makes deliberately`;
    }
  }
  return undefined;
}

/**
 * Does this node survive the reader's filter?
 *
 * A node with no `kind` is excluded by a `kinds` filter rather than passing
 * it — the same total answer `boardShows` gives, and for the same reason: a
 * node that cannot answer the question has not answered it yes.
 */
export function readerShows(filter: ReaderFilter, node: FilterableNode): boolean {
  if (filter.kinds !== undefined) {
    if (node.kind === undefined || !filter.kinds.includes(node.kind)) return false;
  }
  for (const [name, values] of Object.entries(filter.properties ?? {})) {
    const have = node.properties?.[name];
    if (have === undefined || !values.includes(have)) return false;
  }
  return true;
}

/**
 * Every value a reader could filter this property by, in the nodes given.
 *
 * What a control populates itself from, so the options are the corpus's rather
 * than a list somebody maintains beside it. Sorted, because an option list
 * that reorders between renders is one a reader cannot build a habit on.
 */
export function propertyValues(
  nodes: readonly FilterableNode[],
  name: string,
): string[] {
  const seen = new Set<string>();
  for (const n of nodes) {
    const v = n.properties?.[name];
    if (v !== undefined) seen.add(v);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, "en"));
}

/**
 * What a reader sees: the board's content, then narrowed by their filter.
 *
 * **The order is enforced here so no caller has to remember it.** Applying the
 * reader's filter first and the board's second gives the same answer today and
 * stops giving it the moment either filter grows a rule that is not a plain
 * conjunction — and by then the caller that got it backwards is in another
 * file.
 *
 * Takes `boardContent` as a function rather than importing `board.ts`, so this
 * module keeps the same discipline that one holds against the content graph:
 * it names what it reads and imports nothing.
 */
export function visibleOn<T extends FilterableNode>(
  boardContent: readonly T[],
  filter: ReaderFilter,
): T[] {
  return boardContent.filter((n) => readerShows(filter, n));
}
