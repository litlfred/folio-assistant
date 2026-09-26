---
# folio-assistant-ll11
title: 'GAPS: no check for undeclared files on disk, and the engineer art is 16x heavier than its siblings'
status: completed
type: task
priority: normal
created_at: 2026-09-20T06:23:14Z
updated_at: 2026-09-20T12:40:27Z
parent: folio-assistant-o3xy
---

Two gaps `mggs` surfaced but deliberately did not fix, so they are not lost.

## 1. Nothing checks for a file on disk that no declaration names

`check-declared-assets.ts` walks **declared -> disk** only: it reports a
declared asset that is missing, a dead link, or one it could not check. There is
no reverse sweep, and its `DECLARED_INSTANCES` is `["cat-harness", "bootstrap"]`
— the repository root is deliberately not an instance since the move.

Measured cost, 2026-09-20: commit `0301fbd2` added three 1.6-1.8 MB PNGs at the
repository root, with spaces and commas in their filenames, and **no gate
noticed**. They sat outside every instance, undeclared, invisible. They were
found only because somebody went looking for them by hand. An automated pass
then misread them as a regeneration of the existing landing art and recommended
overwriting three declared `.webp` files; opening the image showed a completely
different costume. Both halves of that near-miss trace to the same absence: a
file nothing declares is a file nothing reasons about.

This is the `dh4f` shape inverted. `dh4f` is "declared but absent, so a consumer
scans nothing and reports a clean run". This is "present but undeclared, so no
consumer ever sees it at all".

**Done when** a sweep reports files on disk under an instance's asset-bearing
directories that no declaration names, with the repository root included
explicitly rather than by accident, and it can fail.

## 2. The engineering landing art is PNG at ~1.6 MB a crop

`cat-harness/docs/assets/img/harness/landing-engineer-{laptop,mobile,card}.png`
are 1,597,650 / 1,755,166 / 1,688,979 bytes. Their `.webp` siblings for the
original art are 102,904 / 128,970 / 100,350 — roughly **16x smaller**.

They are PNG because no converter was available in the environment where they
arrived: no `cwebp`, no ImageMagick, no PIL. Declared as PNG rather than renamed
to imply a conversion that did not happen.

Only ONE is loaded per viewport — `<picture>` picks a crop — so a visitor pays
~1.6 MB, not 5 MB. Still the heaviest thing on the landing page by an order of
magnitude, and the landing page is the first thing anybody loads.

**Done when** the three are webp at comparable quality, `harness.json`'s `src`
and byte-sensitive expectations follow, and the PNGs are removed only after the
webp are verified to render — never the other way round.


_2026-09-20_ — **BOTH HALVES ADDRESSED**, one fully and one pending a deletion
the owner has to authorise.

## 1. The reverse sweep exists — `scripts/check-undeclared-files.ts`

`bun run check:undeclared-files`, with `--check` to fail. It sweeps the
**repository root explicitly**, because that is precisely where the gap is:
`check-declared-assets` is scoped to `DECLARED_INSTANCES`, the root is
deliberately not an instance, so every existing sweep skips it.

A root entry is accounted for when it is an **instance** (a directory declaring
its own `harness.json` — so a new one counts the moment it exists, not when
somebody remembers a list), a **repository-scoped declared directory**
(`beans/`, `todos/`), **infrastructure** (a list with a REASON per entry, never
a pattern — `*.json` would account for any JSON anybody drops here, which is the
failure being caught), or **something git ignores** (asked of git, not listed;
`_kg/` is the case that forced it).

**FINDINGS, live:** four files, 1.8 MB.

```
  1.2 MB  Publication and information products style guide_files.zip
  233 KB  Publication and information products style guide-info.pdf
  201 KB  Publication and information products style guide.pdf
   92 KB  Publication and information products style guide.html
```

The bean and PR #478 recorded *one* root PDF. There are **four** files — the
sweep found three nobody had mentioned, on its first run. It **reports** and
never moves or deletes: `deletion-requires-confirmation`, and these are
somebody's uploaded documents.

Two false positives it taught me about, both now accounted for with reasons:
`tools/` at the root is the **deliberate merged Tool barrel** that five modules
import as `../tools/index.js`, and `test-results/` is playwright's `outputDir`
— which, unlike `_kg/`, is **not gitignored**, an inconsistency worth someone's
attention but not a defect to fix inside a sweep.

20 tests, including the falsifier pair: a gitignored directory is skipped, and
**the same directory unignored is reported**. Without the second, the first
passes equally well for a sweep that never reports a directory at all.

## 2. The art is webp — 21.2 MB → 2.2 MB

The bean said the PNGs were PNG because no converter was available. Still true
of the CLI here — no `cwebp`, no ImageMagick, no PIL — **but Chromium is**, and
a canvas `toDataURL('image/webp', 0.90)` is a converter. Eleven files:

| role | before | after | ratio |
|---|---|---|---|
| engineer (3) | 5.04 MB | 474 KB | 9.9–11.8× |
| library (3) | 6.91 MB | 813 KB | 8.4–8.6× |
| analyst (3) | 6.04 MB | 637 KB | 9.3–9.7× |
| architecture (2) | 3.24 MB | 293 KB | 10.3–11.9× |

**Every dimension preserved**, checked rather than assumed. `harness.json`'s
`src` follows — 11 entries, and the diff is 22 lines all of which are `"src"`
lines, so nothing else in that ASCII-escaped file moved.

Verified by **rendering**, which is the bean's own condition: the board built
and screenshotted at 1280 wide, three backdrops loading as webp at their true
natural dimensions, **no failed requests**, and visually indistinguishable from
the PNG render — unsurprising behind a 0.90 scrim.

Also a real cross-check of `theme-art-intake`'s reader: Chromium emits `VP8X`,
a sub-format the reader was written for but had never been fed. It measured it
correctly.

## What is NOT done, and why

**The 11 PNGs are still on disk**, now orphaned — 21.2 MB that nothing
declares. I did not delete them. The bean's own wording authorises removal
"after the webp are verified to render", and they are verified; but that wording
is an agent's, not the owner's, and
`deletion-requires-confirmation` says an agent never removes a durable artefact
on its own initiative — it reports what would go, with sizes, and waits.

So: **21.2 MB across 11 files under `cat-harness/docs/assets/img/harness/`,
ready to delete on one word.**

**And they are currently unflagged**, which is the sweep's own limitation: it
covers the repository root, where the measured incident was, and not instance
asset directories. Extending it there would have caught these eleven
immediately. That is the obvious next step for this check and is worth its own
bean rather than being quietly folded in here.
