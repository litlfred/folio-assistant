# ✍ Suggest editor — intent

## Covers

The dialog that opens from **✍ suggest** beside every ✎ edit link on every page the platform publishes. A folio document, a paper, a library entry and an IG page all use the same dialog, from cat-harness-tools `src/core/edit-links.ts` (`EDIT_LINKS_RUNTIME`, the suggest section) and its published copy `site-chrome/assets/js/edit-links.js`. Bean folio-assistant-4dx7, and dth-hrh tasks #8, #12, #13 and #16.

It is shared chrome with no declared visualiser, like `navbar` and `kg-viewer`, so it covers nothing in `index.json` but is still checked.

## Who it is for

A **reader who is not a Git user**: a WHO technical working-group member, a country reviewer, or a paper's co-author. They see a sentence they would change and want to propose it without leaving the page, without an account beyond GitHub, and without learning Markdown.

The owner has low dexterity. Every control must be a large target, reachable by keyboard, and a choice rather than typing wherever possible.

## What they need to do

1. **Change the text in place.** Use a small formatting toolbar, as in any word processor.
2. **See what they changed while they change it.** Track changes, with *new text in green, underlined* and *removed text in red, struck through*. Colour must never be the only channel: underline and strikethrough carry the meaning on their own.
3. **Say why.** A *Why* field in the dialog, whose text becomes the issue's **Why** section, so the reviewer reads the reason next to the change.
4. **Make the editor as big as they need.** The dialog is *resizable*.
5. **Submit.** A prefilled GitHub issue opens, with the block, its source, the diff and the why.

Owner, 2026-10-14, on the first build: *"i thought there would be a small toolbar (bold, underline, etc.). also would expect it to be resizable. new things in green, underlined. deleted things in red/marktrhough. the github issue has a why... cant we preopulate that with a field "why" in the popup?"*

## What it must show

- **The block's name** (its label, e.g. `prose:about-this-draft`), not its file path.
- **The editor**, with:
  - a toolbar: bold, italic, strikethrough, heading, bullet list, numbered list, link, inline code, undo and redo;
  - for a paper, also math, plus the raw-LaTeX toggle (owner: *"both"*);
  - the track changes.
- **Variables and checks:** each `{{ variable }}` with its current value, and any syntax error or reference warning, compact and secondary.
- **Why**, a multi-line field.
- **Submit as an issue** and **Cancel.**
- A plain explanation when the visual editor cannot load, which then offers raw Markdown editing.

### A conflict in the asks

Markdown has **no underline**. An underline button would have to write HTML `<u>`, which the folio renderers do not all keep. An underline used for formatting would also be indistinguishable from the insertion mark.

**Both candidates therefore leave underline out of the toolbar and say so**, offering bold, italic and strikethrough. This is for the owner to confirm.

## Constraints

- **Mid-fidelity, monochrome:** colours are named in notes, not drawn. Insertions are shown underlined and deletions struck through, which are the non-colour channels the build keeps.
- **Web 1280×800 and mobile 390×844.** On mobile the dialog becomes a full-screen sheet, so "resizable" means it fills the screen.
- **Real content:** the dth-hrh block `prose:about-this-draft`, with one sentence edited.

## Drawn as-is from

The built dth-hrh site with https://github.com/litlfred/cat-harness-tools/pull/218 (`2ed5a90`), served at `/dth-hrh/` and driven in Chromium on 2026-10-14. The screenshot is in the PR that adds this directory.
