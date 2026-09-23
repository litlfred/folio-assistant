---
layout: default
title: 'Turn reporting'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/turn-reporting.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/turn-reporting.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/turn-reporting.md){: .fa-edit-source }

{% raw %}
# Turn reporting — say which bean you are on, every turn

Split out of `todo-manager.md` on 2026-09-19 (bean `tdmg`), which had reached
396 lines against `skill-not-a-document`'s 400-line threshold while carrying
three separable disciplines. This is the one that governs what you say
**during and after** the work; [`opening-brief.md`](opening-brief.md) governs
what you say before starting it; [`todo-manager.md`](todo-manager.md) keeps the
bean mechanics. Nothing in this file changed in the split.

## Say which bean you are on — every turn

Claiming a bean records the work; **reporting** it is what lets a human steer
and a sibling session avoid you. Both are required.

### Opening a turn

**When you begin work on a bean**, open that turn by naming it and what you are
attempting — before the first tool call, not after the work lands:

> **Starting `fwr7`** — retargeting the seven edges the forward-ref arc left
> alone, because the edge is wrong rather than the block's position.

### Closing a turn

**End every turn** with the beans you touched and what is next.

> **Beans**
> - **worked** `fwr8` — Re-baseline the forward-ref arc endpoints. Re-ran both with the fixed parser: the arc is 274 → 195, not 274 → 192. This corrects my own earlier claim that the start figure was understated — only the post-mid-arc figures are short, and only by 3.
> - **next** `fwr7` — Retarget seven `uses[]` edges that point at the wrong block. Two of the seven are now confirmed detangler findings rather than reader reports, which raises their priority above the remaining five.

### Before you send the report — one pass for named decisions (STRICT)

The §"next" rule below is precise and was still broken by the agent enforcing it.
Measured 2026-09-19: after a session spent applying it — including shipping a
rule that a bean mention carries two sentences or does not appear — that same
agent closed a turn with

> Two decisions still yours, neither blocking: `35nj` (three claim-visibility
> mechanism options, each with a cost I shouldn't pick unilaterally) and `wlqd`
> (remote-package sync, needing pinned-commit vs `ref: main`).

Every clause of that is the forbidden teaser. `35nj` and `wlqd` are opaque, the
"three options" are unnamed, "pinned-commit vs `ref: main`" is two phrases whose
costs live in a bean, and "neither blocking" is the framing that made it feel
like reporting. The author's reply was *"show questions and context/pros/cons"* —
the round trip the rule exists to prevent, paid by somebody who types with
difficulty.

**So prose was not the gap; a write-time pass is.** Before sending a closing
report, scan your own text for anything that hands over a choice — a bean id, an
option name, a "your call", a "needing X vs Y" — and for each one:

- **carries its options with their costs, a recommendation and a default** → send it;
- **does not** → delete the name and put a count in its place
  ([`interaction-modality.md` §4.1](interaction-modality.md) §"More than one
  decision pending");
- **you are unsure whether it reads as a question** → treat it as one. The
  framing sentence does not decide this; the reader's next keystroke does.

The test is unchanged and takes one pass: **can they answer without opening
anything?** Apply it to the report you just wrote, not to the question you
planned to ask.

### The rules that make a report worth reading

**1. Every bean reference carries TWO sentences and a link — what it is, then
what you would do.**
`fa/nvbr` is an opaque four-character string. A reader cannot tell whether it
is urgent, adjacent, or already obsolete without opening the store — and asking
someone to go look things up is the cost this report exists to remove. Link to
the bean file so one click gets the full body.

A gloss says what the bean IS; the second sentence says what you would DO, which
is what somebody deciding whether to let you do it needs. **Titles alone are a
menu with no prices** — a reader can see that `rlp5` is two scripts disagreeing
about a flag and still not know whether your answer is a one-line fix or a
question back to them.

> ✗ **next** [`rlp5`](…) — `pdf-ocr` and `pdf-structure` disagree about what `-o` means.
>
> ✓ **next** [`rlp5`](…) — they disagree about what `-o` means, so a command that works with one silently writes elsewhere with the other. I would measure which spelling each script's callers assume, make the minority match, and keep an alias only if an outside caller needs it.

First person and a proposal — *"I would …"* — because rule 5 already says expect
to be overruled; the passive hides whose call it is. Applies to **worked** too
(what you did, and whether it is finished) and to anything you are declining, or
a reader assumes it is queued. Two sentences settle a bean somebody can say yes
to; when **next** hands over a real decision between costed routes, §"The `next`
line is a question" below is the binding form.

**EVERY MENTION, not every report.** This rule is filed under "what makes a
report worth reading" and the scope is wider than that heading: a bean id in an
ordinary sentence is exactly as opaque as one in a list, and a reader hunting for
its meaning cannot see which section of your message it came from. So it binds a
one-line status, a mid-paragraph aside, a commit message, a PR body, an issue
comment — anywhere the id appears at all. If naming the bean is not worth two
sentences, do not name it: say "nothing outstanding" or describe the work without
the id.

Measured here, 2026-09-19. A turn ended *"Next unstarted is `5o3a`, or either
standing decision."* — bare id, no summary, no link — in the same session that
shipped the two-sentence rule and listed four other beans correctly under a
**Beans** heading. The rule was obeyed where it was filed and broken one line
below it, which is what a scope written as a section heading buys you. The
author's reply was *"what is 5o3a?"*, which is the round-trip the whole rule
exists to remove.

**2. Asking for review means linking the artefact — deep, not the root.** If a
turn ends with "please look at this", it must carry the **PR link** and a
**direct link to every page that changed**, not the staging root.

> ✗ `https://…/STAGING/claude-my-branch/`
>
> ✓ **Staging:**
> - [Swarm management](https://…/STAGING/claude-my-branch/swarm-management.html) — new page
> - [process-state](https://…/STAGING/claude-my-branch/reference/skill-instructions/process-state.html) — new skill
> - [Architecture](https://…/STAGING/claude-my-branch/architecture.html) — nav entry added

Handing over the root makes the reader navigate a site to find what you
changed. You already know which pages those are — you wrote them — so the
lookup is yours to do, not theirs. Say what each link *is*, too: a bare URL
does not tell a reader whether it is new, changed, or just context.

`AGENTS.md` records the underlying rule (PR #178, 2026-09-16): a human cannot
assess a rendered artefact from a description, and withholding it makes
assessment harder rather than safer. **A root-only link is a partial
withholding** — the artefact is technically reachable and practically hidden.

**Where to get the links.** The staging workflow deploys to
`…/STAGING/<branch-slug>/`, and Jekyll rewrites `baseurl` so paths mirror
`docs/`. A page at `docs/architecture/foo.md` is at
`…/STAGING/<slug>/architecture/foo.html`; a skill at
`skills/<pkg>/bar.md` is at
`…/STAGING/<slug>/reference/skill-instructions/bar.html`. Derive one per
changed file rather than guessing which the reader wants.

**3. Say what to review, not just that it is green.** "Green on all three
workflows" says the PR is not broken. It does not say what the change **does**,
what to **look at**, or what **judgement** is wanted. A reader should be able to
act on the report without opening the diff, and then open the diff knowing what
they are looking for.

**4. Length follows content.** There is no word budget. A one-line fix gets a
line; a design change that needs a decision gets a paragraph. Err long — the
cost of a sentence the reader skims is far below the cost of a round-trip
asking what you meant, especially for an author who types with difficulty.

**5. "Next" is your judgement, not a fact.** Beans carry no priority order
beyond what an agent asserts — so say *why* it is next, and expect to be
overruled.

**6. Prefix across repos** (`qou/fwr7`, `fa/fsl7`) when a turn spans both.

**7. Report unclaimed work as unclaimed.** If you did durable work without a
bean, say so and open one; that omission is the failure this exists to catch.

### The worked failure

Measured here, 2026-09-18. A real end-of-turn report, verbatim:

> **worked** `fa/fsch` — Green on all three workflows. Also corrected the PR
> body, which had drifted from the code after your detangle instruction.
> **next** `fa/nvbr`, `fa/rnfl` — both gated on #251.

It breaks the first three rules at once. `fa/nvbr` and `fa/rnfl` appear with no
gloss and no link, so the reader cannot tell what either is. The turn asked for
review and gave no staging link, so the reader had to ask for it. And "green on
all three workflows" describes CI rather than the change: it never says the PR
introduces a root declaration schema, never says the conventions doc is the
thing worth reading, and never says which decision was wanted. The author's
reply was *"staging link???"*, then a request for more context — two
round-trips that a longer report would have spent nothing to avoid.

The old version of this rule capped entries at "up to 50 words", which read as a
budget to spend rather than a floor to clear and rewarded exactly that
terseness. Rule 4 replaces it.

### The "next" line is a question, so it carries its context (STRICT)

Rules 1 and 5 above say the next item needs a gloss and a reason. This is the
stronger form for the case where **next** also hands over a *decision*:
[`interaction-modality.md` §4.1](interaction-modality.md)
governs it — context → options → recommendation → question — and the test is
whether the author can answer **without opening anything**.

A bean id plus a term you coined is the specific failure. Measured here on
2026-09-18:

> **next** `x4mt` — Cross-agent skill install + `fa-` prefix (#247). Unstarted,
> and I'd want your call on prefix-at-rest vs prefix-at-install before writing
> anything.

`x4mt` is opaque, `fa-` is undefined, and "prefix-at-rest vs prefix-at-install"
names two options that exist only inside issue #247 — so the author had to open
it to find out what was being asked. It could have read:

> **next** `x4mt` — Install this platform's skills into whichever agent is
> running, each name prefixed `fa-` so it cannot collide with the host's own
> commands. One call needed: add the prefix **when a skill is installed**
> (nothing in this repo moves — recommended), or **rename the files here**,
> which also drags the manifests, the BPMN skill refs and two generators.

Barely longer, and answerable in one character.

**A deferred decision is stated in full, or not stated at all.** If it genuinely
will not fit, say the decision exists and that you will put it properly when you
reach it — never post a teaser whose only resolution is a document.
{% endraw %}
