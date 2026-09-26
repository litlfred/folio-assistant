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

- [ ] Every page's `available_locales` is checked against the locale files that
      exist, corpus-wide — not just the 13 examined here
- [ ] The direction of the error is established for each finding, with provenance
- [ ] A gate refuses a page whose `available_locales` names a locale with no file,
      or `available_locales` is redefined so the claim is not about existence
- [ ] falsified by breaking: adding a bogus locale to a page's front matter must
      make the new gate red
- [ ] `nav-locale.e2e.ts`'s skip of locale-claiming candidates is revisited — it
      is a workaround and should say whether it still earns its place
