---
# folio-assistant-07p7
title: the fr catalogues are stale on main, no gate compares them, and every sweep dirties the tree
status: completed
type: bug
priority: normal
created_at: 2026-09-20T09:26:40Z
updated_at: 2026-09-20T10:15:27Z
parent: folio-assistant-1xhc
---

## Measured 2026-09-20, on main at `d953f5da`

A clean checkout, one `bun run gates --all`, and `git status` is dirty:

```
 M cat-harness/translations/fr/agent-onboarding.po    190 +++---
 M cat-harness/translations/fr/agent-onboarding.pot   194 +++---
?? cat-harness/translations/fr/agent-onboarding.md
?? cat-harness/translations/fr/status.json
```

**Every hunk is a line reference.** No `msgid` and no `msgstr` changes — only
`#: agent-onboarding.md:8` becoming `#: agent-onboarding.md:10`, ~190 times,
because `docs/guides/agent-onboarding.md` gained lines and the committed
catalogue still points at the old ones. The translations themselves are fine.

Two facts, and the second is why it has survived:

1. **The committed catalogues are stale.** `.po` and `.pot` are tracked for
   every language (`git ls-files cat-harness/translations/`), so they are
   meant to be current, and `fr/agent-onboarding` is not.
2. **Nothing compares them.** There is a writer and no `:check`. Contrast
   `readme:sync` / `readme:sync:check` and `render:bpmn` / `render:bpmn:check`,
   which both exist precisely so a generated artefact cannot drift unnoticed.
   So CI is green over a stale catalogue, and the only symptom is a dirty tree
   in front of whoever ran the sweep — who reasonably reverts it as somebody
   else's churn. I did, three times, across this session.

That is bean `xom7`'s shape again: *a red workflow looks exactly like a green
one from in here*, one level down. A generated file with no staleness check is
a generated file nobody can tell is wrong.

`translate-kg-viewer:check` (bean `ot9a`) DOES compare catalogues and passes —
it checks the kg-viewer strings, not the docs catalogues. Two different
artefacts; the gate for the second does not exist.

## The churn half is FIXED — and it was mine

Measured after filing this: the writer is `scripts/translation/simulate-translation.ts`,
which ended in a bare `main();` rather than the `if (import.meta.main) main();`
that 61 other entry points here use. So **importing** it ran the whole
simulation and wrote four files.

What imports it is `scripts/tests/declared-directory-resolves.test.ts` — a test
I added in #482, which imports every module that calls `directoryForGraph` in a
fresh subprocess to prove each can resolve one. From that commit, a plain
`bun test` mutated the working tree, and whoever ran the suite reverted the
result as somebody else's churn. I did, four times, before measuring where it
came from rather than reverting a fifth.

Guarded in #483, with a regression test in that same file asserting the import
loop leaves `git status --porcelain` unchanged — compared before against after,
not asserted clean, since a tree that was already dirty is not its business.
Mutation-checked: removing the guard fails that test by name.

## What is still open

**Main committed the regeneration** in the nine commits it moved while #483 was
open, so the ~190 stale `#:` references are gone and `agent-onboarding.md` and
`status.json` are now tracked. That closes today's instance and none of the
mechanism: nothing compares the catalogues, so they go stale again the next
time that source file gains a line.

And the regeneration no longer happens by accident, which makes the staleness
QUIET rather than noisy. That is worse, not better. The only signal this defect
ever had was a dirty working tree, and both halves of it have now been removed
— one by committing the output, one by guarding the writer. A `:check` in the
gate set is what it needed all along, and it is the only thing left that can
fail.

## Also: two generated files are neither tracked nor ignored

`translations/fr/agent-onboarding.md` and `translations/fr/status.json` were
written by the sweep, appeared as untracked, and `git check-ignore` matched
neither — a third thing that was neither output nor artefact. **Main settled
this by committing them**, so they are artefacts now. Recorded because the
decision was made by a commit rather than stated anywhere, and the next
generated file lands in the same gap.

## Done when

- [x] the sweep stops writing them by accident — `simulate-translation.ts`
      guarded, with a regression test (#483)
- [x] the `fr/agent-onboarding` catalogues are regenerated and committed (on main, 2026-09-20)
- [ ] a `:check` exists that fails on a stale catalogue, and it is in the
      gate set — the point is a gate that can FAIL, not a regeneration
- [ ] `agent-onboarding.md` and `status.json` are tracked or ignored, decided
      rather than left
- [ ] it is verified against every language, not only `fr` — `fr` may simply
      be the one whose source moved

## Not this bean

Fixing the churn by committing the regeneration alone. That makes the tree
clean today and stale again the next time the source file gains a line, which
is exactly how it got here.

---

## Resolved 2026-09-20 — and the headline I nearly shipped was WRONG

The first measurement said all five published translations of
`agent-onboarding.md` were five headings adrift from their source. It came
from `grep -c '^#'`, which counts the `#` COMMENT lines in each page's YAML
front matter as headings. Strip the front matter and **every translation
matches its source exactly** — 11 headings, same levels, same numbering, in
all five locales.

The brief for this bean named that as its falsifier and checked it first,
which is the only reason it did not ship. A count from a grep is a claim.

## What is actually true

Two catalogue families already had a writer AND a reader —
`workflows/*.pot` (205 files, `translate-bpmn:check`) and `kg-viewer.*`
(15, `translate-kg-viewer:check`). The **docs pages** had a writer and
nothing that read it back: five published translations, catalogues for three
locales, a template for one.

`translation:index:check` indexes which pages have translations. It does not
compare them.

## What the new gate found on its FIRST run

Not `agent-onboarding` — the **landing page**. `docs/index.md` gained a
section, *"Four things, in order"*, and **no translation followed**. All five
locales are missing it; every other section is present and in order. That is
a section a reader cannot reach in their language, on the site's front door,
and nothing could have reported it.

Recorded rather than fixed: a faithful translation is a translator's job, and
this bean's own history is the argument for not guessing — the first
measurement here was wrong, and a wrong translation is far harder to notice
than a wrong count.

## The design flaw MUTATION found, twice

The backlog first exempted the whole PAGE, so a recorded translation could
drift further in silence — a second way to go quiet, which is the failure this
bean is an instance of. Found by re-levelling a heading in `docs/fr/index.md`
and watching the suite pass.

The fix pinned each entry to `6 -> 5` headings. **The same mutation passed
again**: re-levelling changes no count. An entry now records the full
{@link shapeOf} of both sides, and anything but that exact shape is new drift.

Seven mutations, each caught by a named test. `check:declared-paths` also
caught a hardcoded `"translations"` literal in the new module on the commit
that introduced it — resolved from the `translation-sources` declaration now.

Gates 52 -> **53**, and `unrunScripts` (bean `ot9a`) forced the new check to be
wired rather than merely declared.

## Done when

- [x] the sweep stops writing the catalogues by accident (#483)
- [x] the `fr/agent-onboarding` catalogues regenerated and committed (main)
- [x] a `:check` exists that fails on drift, and it is in the gate set
- [x] the generated files are tracked or ignored, decided (main tracked them)
- [x] verified across every language, not only `fr` — all five, and the
      finding is on `index`, not on the page this bean was about

## Left open, deliberately

The five landing-page translations are missing a section. That needs a
translator, not this gate. `es/agent-onboarding` and `zh/agent-onboarding`
are published with no `.po` at all; a catalogue cannot be derived from a
finished translation without inventing the segmentation.
