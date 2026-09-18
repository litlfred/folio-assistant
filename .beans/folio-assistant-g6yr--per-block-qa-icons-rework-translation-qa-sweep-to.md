---
# folio-assistant-g6yr
title: 'Per-block QA icons: rework translation-qa-sweep to per-node granularity'
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-18T15:24:06Z
---

Asked for directly on #203: "where are the QA icons next to each content block
for the sidecar QA".

**They do not exist — not hidden, never built.** Measured 2026-09-18 on `main`:

- `find content/docs -name "*.qa.json"` → **0 sidecars**
- the generated page carries **no per-block QA markup at all**;
  `mountTranslationBadges` renders one language badge and one QA badge under
  the `h1`, from Jekyll front matter.

**The blocker is upstream of the UI.** `content/pipeline/translation-qa-sweep.ts`
works at PAGE granularity (`PageTranslationStatus`), so there is no per-block
result for an icon to render.

Chain, in order:
1. rework the sweep to per-node granularity
2. `gen-docs-pages.ts` emits per-node anchors + data
3. `docs-ui.js` renders the icon beside each block



---

**2026-09-18 — investigated; BLOCKED on a scoping decision, not on UI work.**

The data layer is real and available. Running the actual QA sweep
(`bun run content/pipeline/qa-sweep.ts --root content/docs/crdm-methodology`)
produced **14 `.qa.json` sidecars, 48 criteria each**, and the results
discriminate between blocks: 328 pass / 8 fail / 336 n/a. `walkBlocks` finds
**116 blocks under content/docs/** — they are labelled `prose` content
objects, so per-block QA is genuinely producible. Nobody had ever run the
sweep over them.

**But 5 of the 8 failures are false, and shipping icons would publish them.**
`voice-unicode-crash` is a paper-adapter criterion whose own comment says the
characters *"crash pdflatex"*. Document-profile folios take no TeX at all
(AGENTS.md: the document render path "never falls back to latexmk,
deliberately"). It is flagging → and ≤ in prose that will never reach pdflatex.

**Root cause — QA criterion scoping has no profile axis.** Measured:

- `adapterForKind('prose')` → `paper`
- `grep -c 'profiles:'` in qa-criteria-registry.ts → **0**
- `qa-sweep.ts` reads folio.config.json only to find the repo root, never to
  read the content type

So criteria scope by ADAPTER (`adapters: ["dak"]`, defaulting to paper) and
adapters are not profiles — the exact conflation AGENTS.md warns about at
length. Every document-profile prose block inherits the paper adapter's
LaTeX-driven criteria.

**Blocked pending a decision** on how to add the profile axis: a `profiles:`
field on QaCriterionDefinition, read from folio.config.json's content type,
defaulting to all profiles so existing criteria keep running. That touches a
shipped gate, so it is a design call rather than a fix to make unilaterally.
Sidecars generated during the investigation were deleted rather than
committed — they encode 5 verdicts now known to be wrong.
