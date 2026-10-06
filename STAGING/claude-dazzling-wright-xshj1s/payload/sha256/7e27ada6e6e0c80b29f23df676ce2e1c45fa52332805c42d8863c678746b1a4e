---
# folio-assistant-sfjo
title: 'INJECTION: the retranslate path DROPS front-matter keys — 5 locales lost `description:`, and `ar` lost `dir: rtl`'
status: completed
type: bug
priority: normal
created_at: 2026-09-26T19:43:43Z
updated_at: 2026-09-27T08:25:15Z
parent: folio-assistant-bzyu
---

Found 2026-09-26 by bisecting `docs:auto:check` red on main.

## Measured

`docs:auto:check` is green at `3f0518b81ea` and red at `bfec1f9b88b` (#1427,
"retranslate index.md + installation.md"). Bisected across six consecutive
main commits, one check per commit — not inferred from the PR's subject.

#1427 rewrote ten locale files. Comparing front-matter KEYS before and after,
per file:

| file | key(s) lost |
|---|---|
| `ar/index.md` | `description:`, **`dir:`** |
| `es/index.md` | `description:` |
| `fr/index.md` | `description:` |
| `ru/index.md` | `description:` |
| `zh/index.md` | `description:` |
| the five `installation.md` | none — unchanged |

The bodies were retranslated as intended. The front matter was not meant to
change at all, and nothing in the PR mentions it.

## CORRECTION 2026-09-26 — `dir:` is NOT the serious one. I overstated it.

This bean first said: *"Without it the Arabic landing page renders
left-to-right. That is not a cosmetic diff; it is the page being wrong for
its readers."*

**That is false, and the wrong version is kept here on purpose** — the
reusable lesson is the reasoning error, not the conclusion.

`cat-harness/docs/assets/js/docs-ui.js:9805` in `init()`:

```js
var pageLang = (meta && meta.lang) || "en";
var RTL_LANGS = ["ar", "he", "fa", "ur"];
if (RTL_LANGS.indexOf(pageLang) !== -1) {
  document.documentElement.setAttribute("dir", "rtl");
```

`lang: ar` was NOT dropped by #1427, so the JS fallback still fires and the
page still ends up RTL. `docs-ui.css:1387` says so in as many words: *"Applied
when `<html dir="rtl">` or when docs-ui.js detects lang=ar."*

**How the error was made: I inferred the consequence from the KEY'S NAME and
never asked whether anything else supplied the same thing.** A missing
attribute is only a regression if nothing else provides it, and that is a
question about the whole page, not about the diff.

What is left, and it is smaller:

- the direction now arrives at `init()` rather than at parse, so a reader can
  see a left-to-right frame before it flips;
- with JavaScript off there is no fallback at all;
- **UNVERIFIED either way**: whether `dir:` front matter even reaches `<html>`
  in `just-the-docs@v0.12.0`. The theme is a remote gem, not vendored here,
  and egress to it is blocked from this container. Nothing in this repository
  reads `page.dir` — `grep -rn "page\.dir"` over every `.html`/`.md`/`.yml`
  outside `node_modules` returns **zero**. So the server-side half of this may
  do nothing at all.

Restoring the key is still right — it returns a file to the state its author
intended, and a parse-time attribute beats a runtime flip. But this is a minor
defect, not a broken page, and the priority is lowered to match.

## Why the gate red is the SYMPTOM and the obvious fix hides it

`bun run skill:register` on current main regenerates two files and exits 0 —
so the red clears in one command. But the diff it writes is:

    -  <td>&quot;folio-assistant — إطار عمل مهارات وكيل مستقل عن المحتوى.&quot;</td>
    +  <td><span class="none">no description in the artefact</span></td>

five times over. Regenerating would COMMIT the loss and turn the gate green,
making the defect unreachable from CI. I nearly did exactly that: the chain's
own message says "Run \`bun run skill:register\`, then commit what it writes",
and the diff is two files and reads as mechanical.

**The general rule this is an instance of: when a generated artefact goes
stale, read what the regeneration WRITES before committing it. A generator
faithfully recording a regression is indistinguishable, at the gate, from a
generator catching up.**

## Relation to `rmor`

Same mechanism, different casualty. `rmor` is `injectMarkdown` deleting every
blank line in the document; this is the injection path losing front-matter
keys. Whether one fix covers both is unmeasured — do not assume it.

## Done when

- [x] The six dropped keys are restored VERBATIM from `3f0518b81ea` (not
      re-translated — the strings already existed in translated form, so this
      is byte restoration, and #206 reserves translation adjudication to a
      human).
- [x] `docs:auto:check` is green WITHOUT regenerating away the descriptions.
- [x] The injection path is fixed so it preserves front-matter keys it was not
      asked to change — or, if that is `rmor`'s fix, measured to be so.
- [x] Settle whether `dir:` front matter reaches `<html>` in just-the-docs
      v0.12.0 at all. If it does NOT, the key is decorative and the real
      question is whether the JS fallback is the intended mechanism — in
      which case there is nothing to gate.

## 2026-09-26, later — it is not a hypothetical. A sibling did it, within the hour.

This bean warned that regenerating the stale artefact would COMMIT the loss and
turn the gate green. Measured afterwards: that already happened.

`877aade245f` on main — *"chore: regenerate stale docs-auto index and
translation index"*. Counting the marker in the generated file
`cat-harness/docs/cat-harness/docs-auto/index/docs/index.html`:

| commit | `no description in the artefact` |
|---|---|
| `abee3acee29` (before) | 241 |
| `origin/main` (after `877aade245f`) | **246** |

Five, exactly the five locales. The gate is GREEN on main now, and it is green
because the loss is recorded rather than because it was fixed. A later reader
running `docs:auto:check` on main sees a clean run over a page that lost its
descriptions.

The commit is not careless: its subject says truthfully what it did, and the
chain's own message told it to. **That is the point.** The remedy the tool
recommends and the defect are the same keystroke, and nothing in the output
distinguishes "the generator caught up" from "the generator recorded a
regression".

Restoring the source flips it back: regeneration on the merged tree now writes
246 → 241 and `docs:auto:check` exits 0 with the descriptions PRESENT.

### And a second trap, paid on this bean's own PR

#1430's first CI run went red on `docs:auto:check` while the same commit was
green locally. Cause: CI builds `refs/pull/N/merge`, the branch merged with
CURRENT main; I had measured the branch TIP. Main had taken five new bean files
and a batch of translations in between, and the generated index is derived from
those. `nytj` — the merged state neither party evaluates.

**Verifying a generated artefact on the branch tip is not verifying it.** Merge
main first, then regenerate, then check.

_2026-09-27T08:20:47Z_ — Claimed by claude/wonderful-gauss-7frcrw — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Worked 2026-09-27 — two items already satisfied, one ANSWERED, one refuted

### Items 1 and 2 are done, by somebody else

Compared front-matter KEYS per file against `3f0518b81ea`, the pre-loss reference
this bean names: all five `docs/<locale>/index.md` have the same key count as
then, **nothing lost**, and only `title` differs — which is the intended
retranslation. `docs:auto:check` exits 0 **with** the descriptions present, so the
gate was not turned green by regenerating the loss away, which is what this bean
warned about. Verified rather than assumed.

**But the explanatory comment block was NOT restored.** Measured across all five:
6 comment lines inside the front matter at `3f0518b81ea`, **1** now. #1427 deleted
the block explaining what `lang` and `nav_exclude` do and citing
`skills/library/library-core/translation-manager.md`. The keys came back; the documentation
did not. Not restored here — five files of authored prose is the owner's call, not
an agent's.

### Item 3 is REFUTED — it is not `rmor`'s fix, and it is not `injectMarkdown` at all

The bean says *"Whether one fix covers both is unmeasured — do not assume it."* So
it was measured, both ways, on the exact case bisected here (`docs/index.md`
injected with `translations/ar/index.po`):

| | keys lost | front matter byte-identical |
|---|---|---|
| with `rmor`'s fix | **none** | yes |
| with `rmor`'s fix reverted | **none** | yes |

`injectMarkdown` **never** dropped a front-matter key. It has an `inFrontMatter`
branch that `continue`s without touching the line, so the block passes through
unchanged either way. `rmor`'s fix is irrelevant to this bean.

**The real cause, read from the commit rather than from the PR subject.**
`f949a5d06c4` (the non-merge commit under #1427) rewrote the front matter by hand
while retranslating the body — dropping `dir:`, `description:` and the comment
block, and changing `title:`. Its own message says *"Retranslated with explicit
instructions to preserve full content"*, and the front matter was not in scope for
those instructions.

**So there is no code defect to fix.** This is an agent rewriting a file it was
asked to translate the body of. The remedy is process, not a patch: a retranslation
must not author front matter. Item 3's premise — that *"the injection path"* loses
keys — does not hold, and the bean title says so too.

### Item 4 is SETTLED: `dir:` front matter reaches nothing

This bean recorded it UNVERIFIED because egress to the theme gem was blocked.
Egress to rubygems works from this container, so the pinned gem was downloaded and
read, and then the site was BUILT (`bun run preview:site`) rather than reasoned
about:

  * `just-the-docs` 0.12.0 `_layouts/default.html:7` is
    `<html lang="{{ site.lang | default: 'en-US' }}">` — no `dir` attribute
    anywhere in `_layouts` or `_includes`, and `page.dir` appears nowhere.
  * The repository has no `docs/_layouts/`, so nothing overrides it.
  * In the built site, **70 of 70** translated pages carry **no `dir` attribute at
    all**.

So `dir: rtl` is decorative, exactly as this bean suspected, and the JS fallback is
the only mechanism. Restoring the key was still right — it returns the file to its
author's intent — but it changes nothing that renders.

### And a finding beyond this bean: bean `zru7`

The same build shows all **70** translated pages serving `<html lang="en-US">`, and
`docs-ui.js` patches `lang` only inside the RTL branch — so 56 pages (es, fr, ru,
zh) are **never** corrected, with JS on or off. WCAG 3.1.1. Filed as `zru7` rather
than fixed here: it is a change to how every page in the site renders.
