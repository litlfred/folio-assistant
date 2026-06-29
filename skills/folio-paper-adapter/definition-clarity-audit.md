---
name: definition-clarity-audit
roles: [reader, collaborator, owner]
user_invocable: true
description: >-
  Definition / statement clarity + concision audit. A content block can
  validate (schema-clean, refs resolve, formal-proof sibling present) and still
  read badly: the defined term is never emphasised, the definition is buried
  under paragraphs of motivation, or one `definition` block silently bundles
  three or four distinct definienda. No existing QA axis (voice / structure /
  bib / proof / …) measures clarity of the statement itself. Use when asked to
  "bold defined terms", "tighten definitions", "no rambling definitions", "one
  definition per block", "tight theorem/proposition/lemma statements", or to set
  up / run a clarity audit. Also runs the inverse audit — a non-`definition`
  block that secretly carries a definition (`clarity-defn-misplaced`) — plus a
  statement-purity check (`clarity-stmt-pure`: a theorem/prop/lemma/conjecture
  carries only its claim; embedded remark / interpretation moves to a follow-on
  `remark`) and a register check (`clarity-grad-style`: graduate-level
  formal-math prose — no contractions, second-person, hype, colloquialism, or
  emoji). Emits per-block QA sidecar params under the `clarity-*` criteria via
  `content/pipeline/definition-clarity-audit.ts`.
---

# definition-clarity-audit

A content block can be **schema-clean, ref-resolving, proof-backed** and still be
hard to read. The four QA axes that already exist guard *correctness* and
*voice*; none guards **clarity of the statement itself**. This skill adds that
axis — `clarity` — with eight audit parameters (four definition/statement
forward checks + the purity + register checks + one inverse check).

The owner's framing (2026-06-26):

> *bold defined terms… there is a lot of preamble which should not be in defn…
> a lot of the definitions are long and very unclear… each thing should get its
> own definition… no multiple definitions in a content block… similarly,
> theorem/prop/lemma should have a no-rambling/tight-statement audit param…
> a theorem, prop, lemma, conjecture or similar statement should not have
> remarks or interpretation in them — it should be a follow-on remark… [each
> content block should follow the] style of a graduate-level formal math book.*

## The eight audit parameters (criterion ids)

The first four are **forward** checks on blocks that *are* definitions/statements;
`clarity-stmt-pure`, `clarity-grad-style`, and `clarity-rhetorical-header` are three further forward checks; the
last is the **inverse** — a definition hiding in the wrong block kind.

| Criterion | Applies to | Passes when | Fails when |
|---|---|---|---|
| **`clarity-defterm-bold`** | `definition` | the principal defined term is marked at its definition site by markdown bold `**…**` **or** a `:defterm[…]{#slug}` directive | the term appears only as plain text / `*italic*` — never emphasised |
| **`clarity-defn-single`** | `definition` | the block defines exactly **one** concept | the block bundles several definienda (many bold section-headers, ≥2 `defines[]` entries, or several "we define / is defined as" lead-ins) |
| **`clarity-defn-tight`** | `definition` | the definition is stated tightly, near the top | rambling: long prose, a stack of downstream-realisation sub-sections, or a long motivational preamble before the actual definition |
| **`clarity-stmt-tight`** | `theorem` / `proposition` / `lemma` / `corollary` | the claim is stated tightly | the **statement** rambles. **Inline-proof words are excluded** from the count (calibration 2026-06-28: 71/86 majors were proof-driven, not rambling-statement — the check now measures only the text before the first `**Proof.**`/`## Proof` marker) |
| **`clarity-stmt-pure`** | `theorem` / `proposition` / `lemma` / `corollary` / `conjecture` | the block carries **only the claim** — hypotheses + conclusion | the statement embeds **remark / interpretation / motivation** prose — an interpretive sub-section (`**Physical meaning.**`, `**Interpretation.**`, `**Remark.**` → **major**) or interpretive lead-ins ("intuitively", "in other words", "physically", "this means that" → **minor**/**major**). Such commentary belongs in a *follow-on* `remark` block (`interprets:` the statement) |
| **`clarity-proof-pure`** | `proof` (`prf:`) blocks + provable blocks with an **inline** `**Proof.**` | the proof carries **only its argument** | the proof embeds exposition that belongs in a `remark` — an interpretive sub-section (`**Physical meaning.**`, `**Discussion.**` → **major**) or interpretive lead-ins ("intuitively", "this means that" → **minor**). The proof argument stays; the exposition moves to a follow-on `remark`. (Same detectors as `stmt-pure`, applied to the proof region.) |
| **`clarity-grad-style`** | every prose-bearing kind (definition / statement / conjecture / example / remark / prose) | the prose reads in the register of a **graduate-level formal mathematics text** | informal register: contractions ("don't", "we'll", "let's"), second-person ("you"), hype adjectives ("remarkable", "beautiful", "elegant"), colloquialism ("basically", "a lot of", "of course"), exclamation marks, or emoji. An emoji or `!` is on its own a hard violation (→ **major**) |
| **`clarity-rhetorical-header`** | every prose-bearing kind | every section header (bold `**…**` or ATX `## …`) reads in **noun-phrase academic register** | a header is a **rhetorical question** (ends with `?`, or opens with Why/What/How/When/Where/… → **major**) or **colloquial framing** (`Consequence.`, `The upshot.`, `Why this matters`, `What X actually was` → **minor**). Owner directive 2026-06-27: such headers are not graduate-academic; reword to a noun phrase (`Why genus 4?` → `The genus-4 selection.`; `Consequence.` → `Corollary.`). The *content* may stay — only the header changes |
| **`clarity-defn-misplaced`** | **non-**`definition` kinds (remark, prose, theorem, conjecture, example, …) | the block carries no definition — no `defines[]`, no `:defterm[…]`, few defining verbs | the block secretly **is** a definition: it declares `defines[]` or marks a `:defterm[…]{#slug}` define-site (→ **major**), or leads in with ≥ 2 defining verbs (→ **minor**). **Glossary blocks** (tag `"glossary"`) are exempt (`n/a`) — they define terminology by design |

### Worked example — `def:some-concept`

A definition block that opens with a long motivational preamble before defining
anything is the motivating case and trips three criteria at once:

- opens with a **long motivational preamble** ("Beyond the surrounding theory …
  this object admits a canonical primitive …") before any definition — and never
  bolds the term **some-concept** → `clarity-defterm-bold` **fail**;
- crams **many bold sub-sections** (`Iterated definition.`, `Key identity.`,
  `Alternative interpretation.`, `Base-case independence.`, `Native algebraic
  home.`, `Cross-context behaviour.`, `Domain realisation.`, `Role in the larger
  story.`, `Physical meaning.`) into a **long prose body** → `clarity-defn-single`
  **fail** (major) and `clarity-defn-tight` **fail** (major).

The remedy (a follow-up, not the audit itself) is to split it into atomic
blocks — `def:atomic-primitive`, `def:some-concept` (the concept only, term
**bolded**), `prop:some-concept-identity`, `rem:some-concept-alternative`,
`rem:some-concept-domain`, etc. — each tight, each defining one thing.

### Worked examples — the two new criteria

- **`clarity-stmt-pure`.** Several `proposition` blocks carry an embedded
  `**Interpretation.**` / `**Remark.**` sub-section *inside* the proposition
  (`prop:some-result-1`, `prop:some-result-2`, …). The proposition should be just
  its claim; the interpretation becomes a follow-on `rem:…` with `interprets:`
  set to the proposition's label (`the project authoring conventions` structure).
- **`clarity-grad-style`.** Some blocks carry results-table check marks
  (`✓`, U+2713) — a register slip caught as **major**; others carry a
  sentence-final `!`. The fix is to drop the table glyph / exclamation and state
  the result in prose. (These also surface on the `one-voice` emoji axis — fix
  once.)

## The scanner

`content/pipeline/definition-clarity-audit.ts` is a project-local,
**self-contained** scanner (no schema import — it parses `.ts` manifest + `.md`
prose by regex, exactly like `lean-vacuity-axiom-audit.ts`).

```bash
# full corpus → JSON + Markdown report
bun run content/pipeline/definition-clarity-audit.ts \
  --md   docs/audits/2026-06-26-definition-clarity-audit.md \
  --json docs/audits/2026-06-26-definition-clarity-audit.json

# one chapter, one criterion
bun run content/pipeline/definition-clarity-audit.ts \
  content/<paper>/<chapter> \
  --only clarity-defterm-bold

# upsert reviewer.kind="script" candidate entries into <block>.qa.json
bun run content/pipeline/definition-clarity-audit.ts --write-sidecars
```

Flags: `[root …]` (default `content/`), `--json`, `--md`, `--only <criterion>`,
`--branch <name>` (blob-url branch), `--write-sidecars`, `--top N` (offenders per
criterion in the MD, default 25), `--quiet`. Exit code is **1 when candidates
exist**, so it can gate a pre-commit hook or CI.

### Heuristics & thresholds

All thresholds live in one `const T = {…}` block at the top of the scanner; tune
there, not in the per-criterion functions.

- **`clarity-defterm-bold`** — derive the principal term from the block `title`
  (text before the first parenthetical, math-stripped, stop-words dropped). The
  term counts as *marked* if any `**…**` or `:defterm[…]` span shares ≥ `0.5` of
  the term's tokens. Titles that are *fully mathematical* (no plain-text term)
  return `n/a`.
- **`clarity-defn-single`** — fail if `defines[]` entries ≥ `2`, or defining-verb
  lead-ins ≥ `3`. **Bold section-headers do NOT trigger this** (calibration
  2026-06-26: 59/59 bold-header majors were false positives — a stack of bold
  sub-sections is a *tightness* signal owned by `defn-tight`, not a
  multiple-definienda signal). `boldHeaders` is kept as an informational metric.
- **`clarity-defn-tight`** — fail if prose words > `250`, or bold sub-sections ≥
  `3`, or preamble words (before the first display-math / marked term) > `60`.
- **`clarity-stmt-tight`** — fail if prose words > `300`, or bold sub-sections ≥
  `3`, or preamble words (before the first display-math) > `80`. **Inline-proof
  words are stripped** before counting (`stripProof`: everything from the first
  `**Proof.**`/`## Proof`/`*Proof*` marker is excluded), so the check measures
  the statement, not the proof (calibration 2026-06-28). `totalWords` retained
  as an informational metric.
- **`clarity-proof-pure`** — runs on `proof` (`prf:`) blocks and provable blocks
  with an inline proof. Fail if the **proof region** has ≥ `1` interpretive
  sub-section (→ **major**) or ≥ `pureLeadIns` interpretive lead-ins (→ **minor**);
  `n/a` for a provable block with no inline proof. Fix: move the exposition to a
  follow-on `remark`, keep the proof to its argument.
- **`clarity-stmt-pure`** — fail if ≥ `1` interpretive bold sub-section
  (`**Interpretation.**`, `**Physical meaning.**`, `**Remark.**`,
  `**Motivation.**`, `**Discussion.**`, plus a qualifier + meaning/
  interpretation/picture/content/reading — `**Physical interpretation.**`,
  `**Geometric interpretation.**`, `**Number-theoretic content.**`, … →
  **major**) **or** ≥ `1` interpretive
  lead-in phrase ("intuitively", "in other words", "this means that",
  "physically", "the upshot", "one should think of", … → **minor**, or **major**
  at ≥ 3). A `*-proof` lives in its own block, so a statement block is *just*
  its claim; the commentary is the *follow-on* `remark`.
- **`clarity-grad-style`** — count register hits = contractions + second-person
  + hype adjectives + colloquialisms + exclamations + emoji. Fail if emoji ≥ `1`
  **or** exclamation ≥ `1` (hard violations, **major**) **or** total hits ≥ `2`
  (**minor**, **major** at ≥ `4`). Exclusions baked into the detectors:
  possessive `'s` is fine ("Cauchy's theorem"); domain-specific terms that happen
  to match a hype-word denylist may be whitelisted in the scanner's `const T`
  exclusions (e.g. a domain term like "magic number"); mathematical arrows
  (U+2190–U+21FF) are not emoji; factorials in prose (`3!`), GitHub-alert
  markers (`> [!NOTE]`), and HTML comments are not exclamations.
- **`clarity-defn-misplaced`** — runs on every block whose kind is **not**
  `definition` / `diagram` / `simulator`. `defines[]` ≥ `1` **or** a
  `:defterm[…]` directive → **major** (a canonical define-site on a
  non-`definition` block); otherwise defining-verb lead-ins ≥ `2` → **minor**.
  Glossary blocks (tag `"glossary"`) short-circuit to `n/a`.

## Agent-confirm protocol (high-recall → adjudicated)

Like `lean-vacuity-axiom-audit`, a `fail` is a **candidate, not a verdict**. The
heuristics are deliberately high-recall. For a durable disposition the agent:

1. opens the block `.md` + `.ts`;
2. confirms the candidate against the rubric below (or marks it a false positive
   — e.g. a `definition` whose title term is genuinely all-math is `n/a` for
   `defterm-bold`; a block with 3 short clarifying notes that are *not* separate
   definitions is a `defn-single` false positive);
3. records the adjudicated `reviewer.kind="agent"` sidecar entry (once the
   `clarity-*` ids are registered in the canonical qa-sweep registry — see the
   registry note below).

### Fix prescriptions

| Criterion | Fix |
|---|---|
| `clarity-defterm-bold` | bold the term at first definition: `the **some-concept**` (or register it in `defines[]` + wrap with `:defterm[…]{#slug}` per `the project authoring conventions`, the stronger glossary form). |
| `clarity-defn-single` | split the block — one `definition` per definiendum; demote interpretation sub-sections to `remark` blocks with `interprets:`; promote sub-statements to their own `proposition`/`lemma`. Mind the `uses[]` graph: downstream blocks that cite the old label point at the *primary* split product. |
| `clarity-defn-tight` | move motivation to a sibling `prose`/`remark` block; lead with the definition; push "downstream realisation" / "physical meaning" paragraphs out to `remark` blocks (`interprets:` the definition). |
| `clarity-stmt-tight` | strip preamble from the statement block; the hypotheses + conclusion only. Motivation → a preceding `prose` block; consequences → a following `remark`. |
| `clarity-stmt-pure` | cut the interpretive sub-section / lead-in from the statement block and re-home it as a **follow-on `remark`** block (`interprets: "<this label>"`), per `the project authoring conventions`. The provable/conjectural block keeps only its hypotheses + conclusion; the physical / geometric / intuition prose lives in the remark. (A `conjecture` may keep a short scope caveat that is *part of the claim*; what moves is *interpretation*, not the conditional banner.) |
| `clarity-grad-style` | rewrite to the formal register: spell out contractions, drop second-person address (impersonal "one" / passive), delete hype adjectives, replace colloquialisms, remove `!`/emoji (a results-table `✓`/`✗` becomes prose or is dropped). Overlaps `one-voice-audit` Category B/E (AI-slop / emoji) — if a one-voice sidecar already flagged the same emoji, fix once. |
| `clarity-rhetorical-header` | reword the header to a noun phrase in academic register; keep the body. `Why X is canonical.` → `Canonicity of X.`; `Why genus 4?` → `The genus-4 selection.`; `What the ML picture was.` → `Relation to the Mittag-Leffler picture.`; `Consequence.` → `Corollary.` (or fold the consequence into the preceding text / promote to its own `corollary` block). Pairs with the `clarity-stmt-pure` fix when the rhetorical header also fronts embedded interpretation. |
| `clarity-defn-misplaced` | promote the hidden definition to its own `definition` block (with a `.lean` sibling, per the type system); leave behind a `remark`/`prose` that `uses:` (or `interprets:`) it. Move the `defines[]` entry and the `:defterm[…]` site to the new block. If the block legitimately defines terminology as a Mathlib wrapper, retag it `"glossary"` instead. |

> **Content fixes are collaborator-level and graph-aware.** Splitting a block
> touches `uses[]`, chapter manifests, and any `:refterm`/`#label` links. Run
> `bun run scripts/run-validate.ts content/<paper>` after, and prefer one PR per
> chapter of splits over a mega-PR.

## Relationship to existing systems

- **Complements `the project authoring conventions` (`\defterm`/`:defterm`).** §4c enforces that any
  term in a block's `defines[]` is wrapped *everywhere*. `clarity-defterm-bold`
  is upstream of that: it catches a `definition` whose principal term is never
  emphasised *at all* — including the common case (e.g. `def:some-concept`)
  where the term was never even registered in `defines[]`, so §4c never fires.
- **Complements `detangler-block-tanglement`.** The detangler measures
  cross-block tanglement (dependency structure); `clarity-defn-single` measures
  *intra-block* bundling (one block, many definienda). Different axis.
- **Complements `one-voice-audit`.** One-voice guards *voice* (status leaks,
  AI-slop, emoji); `clarity-*` guards *structure & concision*. A block can be
  perfect voice and still ramble. The overlap is `clarity-grad-style`:
  one-voice's emoji / AI-slop categories and `clarity-grad-style` both flag
  emoji and `!`, so a finding may appear on both axes — fix once. The
  `clarity-grad-style` *register* signals (contractions, second-person, hype,
  colloquialism) are finer-grained than one-voice and specific to the
  "graduate-level formal math book" bar the owner set.
- **`clarity-stmt-pure` complements `the project authoring conventions` (remark authoring).** §3a
  says interpretation lives in a `remark` that `interprets:` the statement;
  `clarity-stmt-pure` is the detector that catches the interpretation *still
  embedded inside* the theorem/prop/lemma/conjecture, before it has been split
  out. The fix produces exactly the §3a structure
  (`statement → follow-on remark`).

## Registry note (folio-assistant companion)

The canonical qa-sweep criterion registry lives in the folio-assistant platform
repo. Registering the eight `clarity-*` ids in the canonical qa-sweep criterion
registry — so `qa-sweep.ts` / `qa-staleness.ts` schedule and hash-track them like
every other criterion — wires this scanner into the reactive sweep. Until it
lands, this scanner is **standalone**: it produces the report and, with
`--write-sidecars`, writes `reviewer.kind="script"` candidate entries that the
agent later upgrades. Do **not** rely on the reactive post-commit `qa-sweep` to
run these — run the scanner by hand (it is the agent-owned QA path per
`AGENTS.md §"QA is agent-owned; CI is a backup"`).
