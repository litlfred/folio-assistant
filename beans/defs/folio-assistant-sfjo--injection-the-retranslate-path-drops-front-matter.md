---
# folio-assistant-sfjo
title: 'INJECTION: the retranslate path DROPS front-matter keys — 5 locales lost `description:`, and `ar` lost `dir: rtl`'
status: todo
type: bug
priority: high
parent: folio-assistant-bzyu
created_at: 2026-09-26T19:43:43Z
updated_at: 2026-09-26T19:43:43Z
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

## Why `dir:` is the serious one

`ar/index.md` carried `dir: rtl`. Without it the Arabic landing page renders
**left-to-right**. That is not a cosmetic diff; it is the page being wrong for
its readers, and no gate here asserts that an RTL locale declares its
direction.

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

- [ ] The six dropped keys are restored VERBATIM from `3f0518b81ea` (not
      re-translated — the strings already existed in translated form, so this
      is byte restoration, and #206 reserves translation adjudication to a
      human).
- [ ] `docs:auto:check` is green WITHOUT regenerating away the descriptions.
- [ ] The injection path is fixed so it preserves front-matter keys it was not
      asked to change — or, if that is `rmor`'s fix, measured to be so.
- [ ] A gate asserts an RTL locale's page declares `dir: rtl`. Nothing does.
