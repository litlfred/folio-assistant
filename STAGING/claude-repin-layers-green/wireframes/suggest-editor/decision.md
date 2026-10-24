# ✍ Suggest editor — decision

**Chosen: candidate A** (one screen, changes marked as you type). Owner, 2026-10-14, choosing from the options put to them. The blind review (`reviews/agent-blind-1.md`) recommended A independently.

**Underline: left out of the toolbar.** Owner, 2026-10-14: "Leave it out". Markdown has no underline, and underline is the insertion mark. The dialog says so where the button would be.

## Why A

From the review:
- It is the only candidate that marks changes *while typing*, which is what the owner asked for.
- It takes one screen and one Submit, where B needs Next and Back.
- Its toolbar is complete, with every button named.

## Changes the build carries, from the review

1. **Mobile toolbar:** it wraps to a second row rather than clipping, so the Visual/Raw switch stays reachable. Every target is at least 44 px.
2. **Resize:** a 44 px corner grip, plus **Larger** and **Full screen** buttons, so resizing is a choice and not only a drag. On a phone the dialog is always full screen.
3. **Change marks:**
   - `<ins>` and `<del>`, so a screen reader announces them;
   - green and red that reach 4.5:1 contrast on white;
   - a thicker underline for insertions, with a gap between a deletion and the insertion next to it;
   - links styled apart from insertions.
4. **Mobile footer:** the helper text sits above the buttons, and Submit and Cancel are full width.
5. **Controls:** real `<button>`s with accessible names. Focus stays in the dialog, and Esc closes it.
6. **Kept from the current build:** the variables-and-checks line, the raw pane, the paper profile (math, and the raw pane first for proof kinds), and the "visual editor could not load" fallback.

## Deferred

From B: "show only changes" and previous/next-change buttons. These are tracked on the bean, not built now.
