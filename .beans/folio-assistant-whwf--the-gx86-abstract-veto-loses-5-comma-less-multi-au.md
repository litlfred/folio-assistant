---
# folio-assistant-whwf
title: The gx86 abstract veto loses 5 comma-less multi-author bylines — and the corpus has not been re-run
status: todo
type: bug
priority: normal
created_at: 2026-08-24T19:48:09Z
updated_at: 2026-08-24T19:48:09Z
---

Residue from `folio-assistant-gx86`, whose fix landed in 432f8b7 with a measured
A/B: **46 titles improved, 8 regressed; 73 bylines recovered, 7 lost.** The 73
and the 46 are the reason to keep the change. This bean is the 7.

## The 7 lost bylines, enumerated — and 2 of them are wins

Derived mechanically from the A/B rows (`old_a` non-empty, `new_a` empty):

**Not regressions — the old "byline" was title text, and losing it is correct:**

| doc | old_a |
|---|---|
| `arxiv-1604.01247v2` | `AND PARTICLE PHYSICS` |
| `gambaudo-ghys-braids-signatures-2005` | `BRAIDS AND SIGNATURES` |

So the honest score is **73 recovered / 5 lost**, not 7, and the headline
understates the fix.

**Genuine regressions (5).** In every one the byline text is now *inside the
title* — nothing stopped the title, so the byline was never offered:

| doc | byline lost | title now ends |
|---|---|---|
| `arxiv-hep-th-0001202v2` | `D. J. Broadhurst 1) and D. Kreimer 2)` | `...rooted trees D. J. Broadhurst 1) and D. Kreimer 2)` |
| `arxiv-hep-th-9811173v1` | `J. M. Borwein a) and D. J. Broadhurst b)` | `...knots and links J. M. Borwein a) and D. J. Broadhurst b)` |
| `arxiv-hep-th-9310164v2` | `John W. Barrett & Bruce W. Westbury` | `SPHERICAL CATEGORIES John W. Barrett & Bruce W. Westbury` |
| `arxiv-math-0304010v1` | `Vladimir Ivanov and Grigori Olshanski` | `...ON YOUNG DIAGRAMS Vladimir Ivanov and Grigori Olshanski In memory of Sergei Kerov (1946-2000)` |
| `arxiv-2607.29018v1` | `Chenhui Lv*1 and Sanming Zhou 2` | `...symmetric groups Chenhui Lv*1 and Sanming Zhou 2 1School of Mathematical Sciences...` |

All five are **comma-less multi-author bylines joined by "and"/"&"** — the most
common two-author form there is.

## Confirmed cause for 2 of the 5, and it falsifies the veto's premise

`looks_like_byline`, route 1:

```python
if RE_AUTHOR_HINT.search(line):
    if in_abstract and "," not in line:
        return False
    return True
```

with

```python
in_abstract = bool(abstract_words and words and
                   sum(1 for w in words if w in abstract_words) * 2 >= len(words))
```

Two problems, both visible in `arxiv-hep-th-0001202v2`:

1. **"Majority" collapses to "any single hit" on a two-name byline.**
   `D. J. Broadhurst 1) and D. Kreimer 2)` yields `words = ['broadhurst',
   'kreimer']` — initials and digits are filtered by the `len >= 3` test — so
   one match satisfies `1 * 2 >= 2`. The docstring's defence, *"Majority rather
   than any single hit, so a paper whose author shares a surname with its
   subject ... is not derailed by one coincidence"*, is true for a long byline
   and false for exactly the short one this case is.
2. **Authors ARE named in their own abstracts.** The premise is *"an author is
   rarely named in their own abstract"*. In `hep-th/0001202` the abstract names
   **both** Broadhurst and Kreimer; in `hep-th/9811173` it names Broadhurst.
   Self-reference in a physics abstract is ordinary, not exotic.

The comment above the veto states the assumption that fails: *"a genuine
multi-author byline separates with commas."* Two-author bylines conventionally
do not.

## Unexplained: 3 of the 5

Replaying the veto against the stored `authors_raw` for `hep-th-9310164v2`,
`math-0304010v1` and `2607.29018v1` gives `in_abstract = False`, so the veto is
**not** what dropped them. Another gate did — candidates in
`parse_front_matter`: `RE_AUTHORS.match`, the `len(l) < 120` cap,
`RE_TITLE_STOP` breaking early, or `rejoin_caps` altering the line before
`looks_like_byline` sees it. Instrument, do not guess: the line reaching
`looks_like_byline` is not the stored `authors_raw`.

## The operational fact that makes this urgent-ish

**The corpus has not been re-run.** `library/*/structure.json` in qou still holds
pre-fix output, and for all five of these it holds the *correct* byline. So the
regression is latent: it appears the moment someone re-runs `pdf-structure.py`
over `library/`. Fix this before that re-run, or the re-run trades 5 correct
bylines for the 73.

## Suggested fix order

1. Require **at least two** abstract hits before the veto fires, i.e.
   `hits >= 2 and hits * 2 >= len(words)`. Cheap, and it retires both confirmed
   cases without touching the title-continuation case the veto exists for
   (`PLANE AND A BINODAL CUBIC CURVE` has four content words, none of them
   names).
2. Then instrument the remaining three.
3. Re-run the full 382-document A/B before and after; the numbers in gx86 are
   the baseline to beat.

Reproduce: `scripts/pdf-structure.py` over qou `library/`, diff `metadata.title`
and `metadata.authors_raw` against the committed `structure.json`.
