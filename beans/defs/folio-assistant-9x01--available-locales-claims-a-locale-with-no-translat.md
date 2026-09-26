---
# folio-assistant-9x01
title: available_locales claims a locale with no translated page behind it, and nothing checks the two against each other
status: todo
type: bug
priority: normal
created_at: 2026-09-26T14:26:44Z
updated_at: 2026-09-26T14:26:44Z
parent: folio-assistant-bzyu
---

Found while fixing an e2e fixture (bean `6bhf`, PR #1408), not while looking for
it — so the measurement below is narrow on purpose and the sweep is part of the
work.

## The contradiction

`cat-harness/docs/crdm-methodology.md` declares

    available_locales: ["en","fr"]

and there is **no `cat-harness/docs/fr/crdm-methodology.md`**. It is also absent
from `docs/_data/translations.json`, which is derived from the files that actually
exist. So the page advertises a French version, the index says there is none, and
the filesystem agrees with the index.

Measured 2026-09-26 over the 13 top-level pages the index does not list: one
claims a non-source locale (`crdm-methodology`), four declare `["en"]`, and the
rest declare nothing. The pages the index DOES list were not examined — that is
the sweep this bean is for.

## Why it matters rather than being cosmetic

`available_locales` is what a page says about itself; `translations.json` is what
the generator found. A consumer that trusts the front matter offers a reader a
link to a page that does not exist; a consumer that trusts the index ignores a
claim somebody wrote deliberately. **Two answers to one question**, which is the
shape this repository keeps paying for.

It also cost a real decision: `crdm-methodology` sorts first among the candidates
for `nav-locale.e2e.ts`'s no-translation fixture, so it would have been chosen as
the page standing for "has no translation" while asserting in its own front matter
that it has one. The fixture now skips any page claiming a non-source locale, and
that skip is a workaround for this bean, not a fix for it.

## What is NOT known

Which of the two is wrong. Either the front matter is aspirational — somebody
listed the locales they intend — or a French page was removed and its declaration
was left. `git log` on the file will say, and the answer decides the fix:

- aspirational → `available_locales` means something other than "these exist",
  and it needs a name that says so, or removal
- residue → drop the stale entry, and add the check that would have caught it

## Done when

- [x] Every page's `available_locales` is checked against the locale files that
      exist, corpus-wide — **584 source pages** swept, 6 disagreements, all six
      explained. See §"Swept 2026-09-26"
- [x] The direction of the error is established for each finding, with provenance
      — and it is **not the direction this bean assumed**
- [ ] A gate refuses a page whose `available_locales` names a locale with no file,
      or `available_locales` is redefined so the claim is not about existence —
      **the sweep says REDEFINE, and the blast radius makes it the owner's call**
- [ ] falsified by breaking: adding a bogus locale to a page's front matter must
      make the new gate red
- [ ] `nav-locale.e2e.ts`'s skip of locale-claiming candidates is revisited — it
      is a workaround and should say whether it still earns its place

## Swept 2026-09-26 — the field is ACCURATE, and its name is what lies

### The premise above is wrong, and wrong in a useful way

This bean opens by calling `crdm-methodology`'s `available_locales: ["en","fr"]`
a claim with "no translated page behind it", and treats the field as
hand-authored. Both halves are wrong:

**It is GENERATED.** `gen-docs-pages.ts:735` stamps it, and every page it writes
carries a banner saying so. Running the generator in **write** mode changes the
field on no page at all — measured — so it is not stale front matter anybody can
correct by editing.

**It is derived from the `.po` CATALOGUES, not from the rendered pages.** The
generator's own comment at `gen-docs-pages.ts:708` says it: *"it resolves
`translations/<locale>/<stem>.po`, and the source language has no such directory
by construction"* (`localesAvailableFor`, issue #687, bean `czct`).

### The sweep

584 source pages, 70 translated pages, 24 declaring `available_locales`, 560 not.
Six disagreements between what a page claims, what locale files exist, and what
`docs/_data/translations.json` says:

| page | claims | files | index | `.po` |
|---|---|---|---|---|
| `crdm-methodology` | `fr` | — | — | **`fr` exists** |
| `agentic-harness` | — | all 5 | all 5 | none |
| `beans-and-todos` | — | all 5 | all 5 | none |
| `document-ingestion` | — | all 5 | all 5 | none |
| `evidence` | — | all 5 | all 5 | none |
| `publication-workflow` | — | all 5 | all 5 | none |

**Every one is correct by the derivation's definition.** `crdm-methodology` has
`translations/fr/crdm-methodology.po`, so `fr` is stamped; the five others have no
catalogue at all, so only `en` is. The field is not lying about catalogues.

Two of my own measurements were wrong before this one and are worth recording,
because both were path assumptions rather than typos: the first sweep built a
nested page's translation path as `docs/<locale>/guides/x.md` when the layout puts
the locale **beside** the file (`docs/guides/<locale>/x.md`), which reported five
real translations as absent; and it counted the translated pages themselves as
source pages, because it tested only the FIRST path segment for a locale.

### So what is actually wrong

1. **The NAME and the JSON-LD key lie.** `head_custom.html:253` publishes
   `"availableLocales": {{ page.available_locales }}` into structured data on
   every page. A consumer reads that as "this page is available in these
   locales". For `crdm-methodology` the live site therefore asserts availability
   in French while **no French page exists** — a false claim in machine-readable
   metadata, which is worse than a wrong word in prose because nothing invites a
   human to sanity-check it.
2. **`crdm-methodology` has a catalogue and no rendered page.** The opposite
   direction from this bean's assumption: the translation exists as a catalogue
   and was never rendered. That is a real gap and it is not #206's.
3. **The other five are #206's**, not a defect — they are the same missing
   catalogues `translation:drift:check` is deliberately red about (bean `ngxj`).
   `available_locales` is a SECOND SYMPTOM of that one cause, which is worth
   knowing before anybody "fixes" the field.
4. **Every generated page names a command that does not exist.** The banner says
   *"`docs:pages:check` fails on the difference"*; `bun run docs:pages:check`
   exits with `Script not found`. The real invocation is
   `bun run cat-harness/scripts/gen-docs-pages.ts --check`, which CI does run
   (`code-quality-gates.yml:1377`). A reader who tries the documented command
   gets a non-zero exit and may conclude the guard is absent — the same shape as
   AGENTS.md's pre-split `scripts/` paths.

### Why the remaining box is the owner's call, not mine

"Add a gate" is the wrong fix: the field is accurate, so a gate comparing it to
rendered pages would fail on five pages that are correct, and the only true
finding it would catch is `crdm-methodology` — whose real problem is a missing
page. "Redefine" is right, and its blast radius is a stamped field on 24 pages, a
published JSON-LD key, a generator, `po-resolve`, a badge computation and two e2e
files. That is a decision about what the site promises its consumers, so it is
recorded here and put to the owner rather than chosen.
