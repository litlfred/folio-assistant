---
# folio-assistant-sbfb
title: "folio-assistant had no avatar, and the missing-avatar finding was never reported"
status: completed
type: bug
priority: normal
created_at: 2026-09-22T06:45:00Z
updated_at: 2026-09-22T06:45:00Z
parent: folio-assistant-6lb8
---

Owner: *"folio assistant icon is messed up still. I want theme like in
avaatars"*, and separately *"Not too subtle but pronounced"* about the glass
handle.

## Measured before changing anything

| instance | own avatar? | tone |
|---|---|---|
| `bootstrap` | yes | 96 |
| `cat-harness` | yes | 268 |
| **`folio-assistant`** | **no** | **0 — the GENERIC question mark** |
| `who-iris` | no | 0 |
| `smart-trust` | no | 0 |

`avatarFor("folio-assistant")` returned GENERIC, whose `reads` is literally
*"a question mark — no avatar is declared for this kind"*. **That is the
messed-up icon**, and it is not a rendering fault: nothing declared a mark.

**The table's own header has carried the instruction the whole time** —
*"bootstrap has avatar, so does cat-harness, folio-asst"*. Two of the three
were there.

## The second defect: the finding was never reported

`harness-tiles.ts` says in its header:

> An instance with no avatar of its own takes `GENERIC`, which is **reported
> as a finding** rather than rendered as a blank.

**Nothing reported it.** `genericAvatar` has two references in the whole
corpus — its own declaration and its assignment — and no consumer. So the
question mark shipped silently and surfaced the only way left: the owner
looked at the site.

`schemas/avatars.ts` names the gap too and points at bean `4kj4` for it;
`4kj4` turned out to be about the per-KIND fan, so **that pointer was stale
as well**. `check-avatar-instances.ts` is the check both comments describe.

## The check, and why EXEMPT rather than inventing two marks

`who-iris` and `smart-trust` replicate WHO's identity. Choosing a glyph for
them here would be this repository inventing a mark for an organisation that
has one, so they are **exempt with that reason printed on every clean run** —
the shape `check-invocation-parity` already uses. **A stale exemption is
itself a finding**: an entry naming an instance that is gone, or one that has
since declared art, fails.

**It found its own misconfiguration first.** `repoRootFor(process.cwd())`
walks up from what it is handed, so run from the repository root it returned
the PARENT, found no `*.config.json`, and reported **0 instantiated
harnesses** — at which point both exemptions read as stale and it exited 1.
That is `dh4f` avoided rather than repeated: the guard fired instead of the
check reporting a clean run over nothing. Resolved from `import.meta.dir`
like every sibling check.

Falsified both ways: removing `folio-assistant`'s entry again → exit 1 naming
it; adding an exemption for an instance that HAS art → exit 1 naming that.

## The handle, made pronounced — and three numbers I got wrong

The first draft was an 0.8rem label in the chrome colour. Now 3.25rem,
0.95rem semibold, an accent fill, a 2px accent border and a shadow.

**ONE palette for both schemes, no light override**, which fixes a defect the
draft had: a control that is violet in one scheme and grey in the other is
TWO controls, and a reader switching schemes learns it twice.

**Three claims in my own comments were wrong and are corrected with computed
values:**

- claimed *"`#efecff` on `#4a34b8` is 10.4:1"* — it is **7.32:1**;
- claimed *"the edge clears SC 1.4.11's 3:1 as a boundary"* against its own
  fill — that pair is **1.41:1**, and its own fill is not what 1.4.11 asks
  about;
- the draft's dark fill `#2c2352` sat at **1.05:1 against the page** — the
  opposite of pronounced.

What shipped, every ratio computed:

    #ffffff on #4a34b8 ......... 8.49:1   text, needs 4.5
    #4a34b8 vs the LIGHT page .. 8.49:1   the fill separates it
    #4a34b8 vs the DARK page ... 1.77:1   the fill does NOT
    #8c74f0 vs the DARK page ... 4.20:1   <- so the BORDER does, SC 1.4.11
    #8c74f0 vs the LIGHT page .. 3.58:1

**The border is load-bearing in dark.** Drop it and the handle vanishes into
the page. Written into the stylesheet, because this file has now shipped two
contrast failures from pairs that looked fine — `23bc`, and this handle at
1.39:1 when it carried `color: inherit`.

## Summary of Changes

- `schemas/avatars.ts` — `folio-assistant` declared: tone **236**, between
  `folio` (224) and `tools` (250) and near `folio-assistant-core`'s 212, on
  the same family reasoning the three kinds under `cat-harness` are given.
  The glyph is the core's leaf **held in a frame**, so an instance and its
  core are not two unrelated marks.
- `scripts/check-avatar-instances.ts` — the instance axis, with EXEMPT and a
  stale-exemption finding.
- `package.json` + `code-quality-gates.yml` — registered, because a check
  nothing runs is the defect this bean is about.
- `docs-ui.css` — the handle, pronounced, one palette, ratios computed.

## Done when

- [x] `folio-assistant` has its own mark, themed the avatar way — a declared
      hue from which both schemes derive
- [x] a missing instance avatar is a REPORTED finding, not a silent question
      mark
- [x] the check is registered in CI rather than written and never run
- [x] exemptions carry reasons, print on clean runs, and go stale loudly
- [x] falsified both ways
- [x] the handle is pronounced, with every contrast ratio computed

## Not done

**`who-iris` and `smart-trust` still take GENERIC**, now visibly and with a
reason rather than silently. Their marks are theirs to choose.
