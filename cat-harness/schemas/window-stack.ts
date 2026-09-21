/**
 * Which cards are OPEN on a board, and in what order they stack.
 *
 * @module schemas/window-stack
 * @graphNode schema
 *
 * ## Two mechanisms, and this module is deliberately only one of them
 *
 * | | trigger | who |
 * |---|---|---|
 * | **semantic zoom** | the card's rendered width crosses a declared threshold | automatic |
 * | **open / close** | opening a card, or `[x]` | a person |
 *
 * {@link module:schemas/semantic-zoom} owns the first. This owns the second,
 * and the split is the whole finding: the owner, 2026-09-20 —
 *
 * > open is like window, avatar/tiles project open panels onto window. sum
 * > functionality, need to handle z-order.. selecting any part raises
 *
 * **An open card is a WINDOW, not a zoom state.** It is projected ON TO the
 * board rather than being the card grown large. That is why nothing in
 * `semantic-zoom.ts` mentions windows and nothing here mentions widths: the
 * card goes on becoming its avatar as the board shrinks, and the window it
 * spawned is a different object that simply stays. An implementation that
 * needed the zoom path to ask "…unless it is open" would have conflated them,
 * and the flag would be the conflation made permanent.
 *
 * ## SESSION-ONLY, and the reason is a file-write per raise
 *
 * `board-positions.ts` carries `x` and `y` and deliberately no `z` —
 * *"stacking order is a rendering decision the board makes from the
 * document."* Raising is the most frequent gesture on a board, so a committed
 * `z` would make every selection a write and every two concurrent readers a
 * merge conflict, to record something neither of them chose deliberately.
 *
 * So the stack lives for as long as the page does, and this module holds no
 * schema, no `$schema` tag and no file: **it is state, not a document**, and
 * saying so in the type is cheaper than a reader inferring it from the absence
 * of a Zod object. The owner's default, stated with the alternative: if it
 * should persist, it is one optional field in the DI document and this module
 * gains a serialiser — which is why the shape below is already a plain array
 * of ids.
 *
 * ## Why an ARRAY rather than a map of z-numbers
 *
 * The array IS the order, bottom to top, so there is no second fact to keep in
 * step. A `Record<id, number>` can hold two cards at the same z, or a gap, or
 * a z for a card that is not open — three states that mean nothing and that
 * every consumer would have to defend against. `zIndexOf` derives the number
 * on the way out, which is the only place it is needed.
 */

/** The open cards, bottom of the stack first. A card appears at most once. */
export type WindowStack = {
  readonly open: readonly string[];
};

/** Nothing open. The state a board starts in — *"start everyrting in avatar"*. */
export const EMPTY_STACK: WindowStack = { open: [] };

/** Is this card open as a window? */
export function isOpen(stack: WindowStack, id: string): boolean {
  return stack.open.includes(id);
}

/**
 * Open a card, at the top of the stack.
 *
 * Opening an ALREADY open card raises it rather than adding a second entry.
 * That is not a convenience: a card twice in the array is a card with two
 * z-indices, and the caller cannot tell an accidental double-open from a
 * deliberate one — so the invariant is kept here rather than at every call
 * site.
 */
export function openWindow(stack: WindowStack, id: string): WindowStack {
  return { open: [...stack.open.filter((o) => o !== id), id] };
}

/**
 * Close a card back to its avatar.
 *
 * Closing one that is not open is a no-op rather than an error: a stale click
 * on a card another gesture already closed is not a defect, and throwing would
 * turn it into one.
 */
export function closeWindow(stack: WindowStack, id: string): WindowStack {
  return { open: stack.open.filter((o) => o !== id) };
}

/**
 * Raise a card to the top — *"selecting any part raises"*.
 *
 * Raising a card that is NOT open leaves the stack alone. It does not open it:
 * selection and opening are different gestures, and a raise that could open
 * would make a stray click on the board's background spawn a window.
 */
export function raise(stack: WindowStack, id: string): WindowStack {
  return isOpen(stack, id) ? openWindow(stack, id) : stack;
}

/**
 * The stacking index for a card, or `undefined` when it is not open.
 *
 * Derived from the array's order every time rather than stored. `undefined` is
 * the honest answer for a closed card — a renderer that received `0` could not
 * tell "bottom of the stack" from "not on it".
 */
export function zIndexOf(stack: WindowStack, id: string): number | undefined {
  const at = stack.open.indexOf(id);
  return at === -1 ? undefined : at + 1;
}

/** The card currently on top, or `undefined` when nothing is open. */
export function topmost(stack: WindowStack): string | undefined {
  return stack.open.length === 0 ? undefined : stack.open[stack.open.length - 1];
}
