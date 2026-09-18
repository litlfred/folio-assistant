---
# folio-assistant-g6yr
title: 'Per-block QA icons: rework translation-qa-sweep to per-node granularity'
status: completed
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-18T19:28:39Z
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


---

**2026-09-18 — the scoping blocker is CLEARED. Profile axis shipped on
`claude/festive-galileo-s7ibx0` (2445e13e). The UI half of this bean is
untouched and still open.**

### What landed

`profiles?: ContentProfile[]` on `QaCriterionDefinition`
(`schemas/block-qa.ts`), resolved by `criterionProfiles()`, gated by
`profileExcludesCriterion()` in a **second** `qa-sweep` gate sitting beside
the adapter gate — not replacing it. `n/a-wrong-profile` is its own outcome
string; a reader can tell which axis fired.

**The default is the opposite of `adapters`, on purpose.** Absent `profiles`
= every profile. Adapters partition (widening points a criterion at a
vocabulary nobody wrote it for); profiles nest (narrowing stops ~110 criteria
running on document folios and reports the silence as a clean sweep). A wrong
`fail` is argued with; a wrong `pass` is believed.

**Eight criteria opted out**, each with its reason in a trailing comment —
one TeX (`voice-unicode-crash`), seven Lean/proof-structure
(`wall-side-correct`, `wall-base-ring-minimal`, `proof-no-trivial-skeleton`,
`detangler-archimedean-wall`, `uses-formal-coverage`, `lean-ref-owns-decl`,
`da-lean-narrative-divergence`). 8 of 118 — the falsification condition
("if most of them need it, the default is wrong") did not trigger.

### Measured, both endpoints, same command

```
rm -f content/docs/crdm-methodology/*.qa.json   # else everything is fresh-skip
bun run content/pipeline/qa-sweep.ts --root content/docs/crdm-methodology \
  --dry-run --json
```

| | pass | fail | n/a |
|---|---|---|---|
| before | 328 | **8** | 336 |
| after, folio declaring `contentType: "document"` | 319 | **3** | 350 |

Exactly the predicted 8 → 3. The five that went were all
`voice-unicode-crash` — `critical`, on `→`/`≤`-class characters whose only
stated defect is that they crash pdflatex.

### 🛑 Three things the next session needs, and the first is a blocker

**1. The gate is INERT in this repo, and correctly so. `folio-assistant` has
no `folio.config.json` at all** — `find . -name folio.config.json` outside
`node_modules` returns nothing; only `folio.config.example.json` exists. So
`readDeclaredFolioProfile` returns `undefined`, the third state falls through
to running every criterion, and re-running the sweep here still gives 8
failures. The 8 → 3 above was measured with a temporary config, written and
deleted, **not committed**.

**And the five false `critical` verdicts are already committed.** All 14
`content/docs/crdm-methodology/*.qa.json` were added today by `kto9`
(94f9561b) and five of them record `voice-unicode-crash: fail` from a script
reviewer. Shipping per-block icons off those sidecars publishes the exact
false criticals this bean flagged — the axis alone does not clear them,
because nothing in this repo declares a content type for the gate to read.

Decide before the UI work: does the platform repo declare
`contentType: "document"` for its own `content/docs/`? It is a real boundary
question, not a formality — `src/index.ts:98` reads the same field to pick
the MCP adapter, so the platform checkout would start defaulting to the
document adapter. Deliberately left for the owner.

**2. `automated: false` criteria bypass BOTH scoping gates.** `qa-sweep`
short-circuits them to `needs-agent` before the adapter gate, so neither
`adapters` nor `profiles` can scope an agent-adjudicated criterion today.
`da-lean-narrative-divergence` is annotated anyway (correct metadata, marked
INERT in a comment). This is why 532 of the 1204 outcomes are `needs-agent`
regardless of profile — including 10 `script-quality` criteria
(`does_not_default_to_float`, `respects_archimedean_wall`, …) queued against
prose blocks with no `applies_to` restricting them. Worth its own bean.

**3. Folio-specificity is a different axis and was deliberately NOT fixed
here.** `canonical-calibration-count` (CODATA anchors),
`canonical-dilogarithm-context`, `framework-canonical` (one folio's math
notation), `detangler-archimedean-wall` (one folio's chapter directory
names) are not paper-only, they are *that folio*-only — a paper folio about
anything else is equally miscategorised. `folioOptionalAxes()` is the
existing mechanism; only `q-usage` uses it. Annotating these as
`profiles: ["paper"]` would have been the same conflation in a new place.

### The 3 surviving failures — unexamined, reported as found

- `roles.md:46` · `voice-status-leak` · critical — table cell
  `| **Needs review** (Phase 1) | …`. A CRDM checkpoint NAME in a table, not
  a status marker on prose. Reads like a phrase-list over-match.
- `what-is-not-built-yet.md:36` · `voice-status-leak` · critical —
  `**Not yet implemented:**`. True to the criterion's letter; the page is a
  deliberate gap inventory, so the finding fights the block's purpose.
- `what-is-not-built-yet.md:58` · `voice-author-notes-pollution` · major —
  the P4 ISO-date pattern on `measured 2026-09-18 on \`main\``. AGENTS.md
  requires exactly that ("a number without its date and command is a claim,
  not evidence"), so criterion and house discipline disagree.

None is a profile problem. All three need an editorial judgement, not a gate.

### Verification

`scripts/tests/profile-scoping.test.ts` — 16 tests, both directions, incl.
an end-to-end sweep subprocess over folios scaffolded by `initFolio`: an
opted-out criterion is `n/a-wrong-profile` in a document folio, an
**unannotated** criterion still runs there (the false-pass assertion), both
run in a paper folio, and a folio with a corrupted config keeps full
coverage. `bun test` 1563 pass / 0 fail · `eslint` 0 · `tsc` 0 ·
`gen-schema-docs`/`gen-skill-docs`/`gen-docs-pages --check` clean.

Not done, deliberately: the UI half (per-node `translation-qa-sweep.ts`,
`gen-docs-pages.ts` anchors, `docs-ui.js` icons); no `.qa.json` sidecar was
committed or deleted; `AGENTS.md` not edited.

---

## Summary of Changes

Shipped in #274, merged to `main` as `52ee58ee`. Verified on the deployed
`gh-pages` artefact, not only locally.

**Two thirds already existed.** The bean's chain was: rework the sweep to
per-node granularity, emit anchors, then render. Checking first — the
falsification step — `emitNode` already pinned a per-node anchor (`{: #id }`)
and already rendered an Edit link with a glyph and a class. Only the data was
missing, and the sidecar already sat beside the block's `.md` in the directory
`readBlock` resolves. The sweep rework was never needed.

**Four states, and the fourth is the point.** ● fail, ◐ warn, ○ pass,
· unswept. `unswept` is shown rather than omitted: a missing icon and a clean
one look identical to a reader and only one is true. A sidecar where every
criterion came back `n/a` checked NOTHING about that block, so it is
`unswept`, not `pass`.

Measured on `main` after merge: **1 fail, 13 pass, 99 unswept**. The fail is
`what-is-not-built-yet`, the known real finding (bean `b7yo`). The 99 are
blocks on pages never swept.

**Verified on the real artefact.** `github.io` is blocked by egress policy,
but staged HTML lands on `gh-pages` and git can read it:
`crdm-methodology.html` carries 1 `fa-qa-fail` with its real counts and 13
`fa-qa-pass`; `agentic-harness.html` carries 10 `fa-qa-unswept`;
`assets/css/docs-ui.css` carries the 7 `fa-qa-*` rules. All three states
render, and the stylesheet shipped with them.

**Two defects found in my own work.** A tautological test (asserting
array-index ordering, which cannot fail) — fixed by making `readQaSummary`
take a directory so the tests reach the real function. And importing the
module regenerated the whole site, so `bun test` was silently rewriting 11
pages — fixed with an `import.meta.main` guard.

## Left open

**How it looks is unverified and needs a human.** Whether ● at 0.75rem reads
as a status or as punctuation, and whether 99 faint `·` across the site is
informative or noise. If the dots read as noise the fix is NOT to hide
`unswept` — that reintroduces the defect — but to sweep the rest of the
corpus so "not checked" becomes rare rather than typical.
