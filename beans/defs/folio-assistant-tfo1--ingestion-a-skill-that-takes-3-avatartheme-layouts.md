---
# folio-assistant-tfo1
title: 'INGESTION: a skill that takes 3 avatar/theme layouts, checks them, and says why it refused'
status: todo
type: feature
created_at: 2026-09-20T06:31:08Z
updated_at: 2026-09-20T06:31:08Z
parent: folio-assistant-o3xy
blocking:
    - folio-assistant-d3yq
---

## The ask, owner 2026-09-20 (verbatim)

> want stickys to be if all harnesses fired and that is their sticky to get to
> folio-assistnat. each has own avatar. make skills for avatar theme ingestion
> (need 3 meeting certain formatting constraints), return sucches or explnation
> of falire...

and, minutes later:

> avatar for testing, engineering, architecture
> https://github.com/litlfred/folio-assistant/commit/1b62b57773dafaeaa05f9c7247ac65db00af92d1

## Three things, and the third is the one worth building first

1. **The board records which harnesses FIRED.** A sticky per harness that ran
   during initiation, each linking onward to folio-assistant. That makes the
   landing page a *receipt* of initiation rather than a fixed set of cards —
   and it is the sharpened form of `bp4x`.
2. **Each harness has its own avatar.** Avatars are already per-kind
   (`schemas/avatars.ts`, 19 kinds incl. `bootstrap`, `cat-harness`,
   `folio-assist-core`), so this rides the existing mechanism.
3. **An ingestion skill for avatar/theme art**: takes 3 layouts, checks them
   against formatting constraints, and **returns success or an explanation of
   the failure**.

## Why (3) should be built first — it is the fix for a failure already paid for

This session hit exactly the problem it describes, twice:

- Commit `0301fbd2` put 3 PNGs at the **repository root**, undeclared, with
  spaces and commas in the filenames. No gate saw them: `check-declared-assets`
  walks declared->disk only, and the root is not an instance.
- Two of them were **1px wider** than the layout they matched, so declaring them
  under the existing role would have falsified `images[].width`.
- They were **PNG at ~1.6 MB** where the siblings are ~100 KB webp.
- An automated read then misidentified the subject and recommended overwriting
  three declared files; only opening the image caught it.
- Commit `1b62b57` repeats the pattern: 3 files at the root, and **two of them
  are byte-identical** — `sha256` `30dad51dfc691587...` for both
  `ChatGPT Image Sep 20, 2026, 08_26_47 AM.png` and
  `d1a26515-9bde-455d-84bc-2e5fc196b004.png`, both 1,606,269 bytes. So that
  commit supplies **2 distinct images for 3 named avatars**
  (testing, engineering, architecture). Whether the third is missing or the
  duplicate was an upload slip is a question for the owner, not a thing to
  guess.

Every one of those is a constraint the ingestion skill would have reported
instead of a person finding it. That is the argument for building it before the
next batch of art arrives.

## Constraints it should check (proposed — confirm before building)

Derived from what actually went wrong, not invented:

- **exactly three layouts**, `laptop` / `mobile` / `card` — `theme.ts` refuses a
  theme missing one, so fewer than three cannot be declared anyway
- **distinct content** — reject byte-identical files presented as different
  layouts (the `1b62b57` case)
- **orientation per layout** — laptop landscape, mobile portrait, card square;
  a portrait crop is not a landscape crop scaled down
- **dimensions recorded from the file**, never retyped (the 1px drift)
- **format and weight** — webp preferred, with the PNG-vs-webp 16x size gap
  reported rather than silently accepted
- **a destination inside a declared directory**, and a declaration written in
  the same step, so the art is never a file nothing names
- **returns success or a NAMED failure** — the ask's own words, and the same
  contract the repo already uses for `--check` gates and the kg-audit sidecars:
  a refusal that says "invalid" teaches nobody what to fix

## Relation to existing beans

- `bp4x` — per-initiator stickies. Item (1) here sharpens it: the set is the
  harnesses that *fired*.
- `7deg` — the librarian avatar + Dublin Core. Item (2) is the same mechanism.
- `ll11` — carries the "nothing checks for undeclared files on disk" gap, which
  is the passive half of what this skill does actively.
- `d3yq` — the testing/engineering theme, which was waiting on exactly this art.

## Done when

- [ ] the duplicate-vs-missing question on `1b62b57` is answered
- [ ] the constraint list is confirmed or corrected
- [ ] a skill (and a Tool, if it should be callable) ingests 3 layouts, declares
      them, and returns success or a named failure
- [ ] it refuses every failure above, each proved by a test that can fire
- [ ] avatars exist for testing, engineering and architecture
- [ ] the board reflects which harnesses fired, each with its avatar
