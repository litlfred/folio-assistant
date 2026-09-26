---
# folio-assistant-7ajt
title: 'TOOL 13/13: Task_SmeReview — narrative confirmation queue (1 file, 1 entry point)'
status: completed
type: task
priority: high
created_at: 2026-09-20T04:35:27Z
updated_at: 2026-09-20T17:11:14Z
parent: folio-assistant-d308
---

Group 13 of 13 in `d308`, and the reason the epic has a thirteenth entry at all.

**1 file, 1 entry point:** `scripts/narratives.ts`, with `schemas/narrative.ts`
as its subject.

**BPMN:** `editing-hci-validation · Task_SmeReview` and `Task_RecordDecision` —
both `userTask`, the human confirmation gate, which existed before this script did.

**Target repo (#223):** `folio-assist-core`.

## Why this one is `high` despite being one file

`main` added it on 2026-09-19. Its own header states the constraint it was built
for: *"the owner has very limited hand function, so every action is selection by
number"*, and that an unusable review step makes `confirmed` mean "nobody got
round to objecting", which launders an unreviewed machine summary into an accepted
one.

And `grep narrative folio-assistant/tools/*.ts` returns nothing. **The
accessibility mechanism is the least discoverable thing in the repository.** An
agent that does not already know the command exists cannot find it by asking the
graph, which is precisely the population the command is for.

That is also the evidence that `d308` is describing a live habit rather than
historical debt: the gap was created the day before the rule was stated, in the
feature that least tolerates it.

## Done when
- [ ] a Tool node for the narrative queue
- [ ] `satisfies` names the review skill `Task_SmeReview` refs
- [ ] its IO makes the numbered-selection contract visible in the node, not only in prose
- [ ] it cannot confirm a draft it drafted — `confirmed_by.kind` stays `human`
- [ ] `tool-coverage` reflects it


---

## MEASURED 2026-09-20 — blocked on the same class of question, and this is the one that matters most  ⟵ BLOCKER

The node cannot be written honestly today, and the reason is not effort.

### The BPMN's own skill ref does not fit the mechanism

`Task_SmeReview` refs **`content-review`**, so that looked like the answer. It is
not. `content-review`'s declared contract **requires `reviewType` and
`contentRef`**, and its prose is about WHO SMART Guidelines phase gates:

> Review L2 content before L3 begins (phase gate) · Review L3 content before
> publication · Assess breaking vs. non-breaking changes · Provide final
> publication release sign-off

`narratives.ts` has no notion of either required field. It takes a **queue index**
and a **numbered reason preset**. A node declaring `reviewType` and `contentRef`
would be asserting an interface the script does not have, and `check:tools` would
refuse it — correctly.

### And no other skill states the capability

Searched by DESCRIPTION rather than by name, which is the mistake `shzs` cost:

| candidate | why not |
|---|---|
| `qa-report-signing` | signing a **QA report** — "what was measured and who vouches for it", two routes because a signer may be air-gapped. The subject is a test run, not an agent-drafted narrative |
| `one-voice-style-guide`, `readability-editing`, `editor` | authoring and voice, not confirmation |
| `deletion-requires-confirmation` | confirmation of a **removal**, a different act |

**Nothing states "confirm an agent-drafted narrative, and do it by numbered
selection".** That is the `yean` shape, and authoring the skill is a claim about
the capability vocabulary every dependent instance inherits.

### Why this instance of the gap is the sharpest one in `d308`

The bean already said it and the measurement confirms it: this is the
accessibility mechanism, built because *"the owner has very limited hand function,
so every action is selection by number"*, and it is **the least discoverable thing
in the repository**. An agent that does not already know the command exists cannot
find it by asking the graph — and that is exactly the population the command is
for.

So the cost of leaving it unreachable is not tidiness. It is that
`confirmed` quietly comes to mean *"nobody got round to objecting"*, which is the
laundering `narratives.ts` was written to prevent.

### One thing the node will hit when it is written

`--why-text` is **free prose as an argv word**, so `check:tools` will refuse it
exactly as it refused `render-log.summary` (bean `ru6i`). The remedy is the same —
prose on stdin — and it is worth knowing before the node is attempted rather than
after. The numbered `--why` preset is fine: an enum is injection-safe by
construction.

### Done when

- [x] ~~a skill stating "confirm an agent-drafted narrative by numbered
      selection"~~ — **NOT NEEDED. `library-ingestion` already states it**, and my
      "no skill states this" was wrong for the third time in one session
- [x] a Tool node for the narrative queue — `narrative-queue`,
      `satisfies: ["library-ingestion"]`
- [x] its IO makes the numbered-selection contract visible in the node, citing
      `interaction-modality`'s `low-dexterity` profile rather than restating it
- [~] `--why-text` on stdin — **moot**, and the reason is the finding below: the
      confirming arms are terminal-only, so no agent reaches that flag at all
- [x] it cannot confirm a draft it drafted — the node does not offer the
      confirming arms, and `reviewer()`'s refusal is quoted in `selection.limits`
- [x] `tools:coverage` no longer lists `library-ingestion` in any tier

---

## DONE 2026-09-20 — the blocker dissolved, and the owner's authorisation was not needed

The owner approved *"author the skill and wire the node in one pass"*. **The skill
was not authored, because it already exists** — and saying so was the deliverable
rather than building what had been approved on a false premise.

### `library-ingestion` states the capability, and names these exact commands

§"Reviewing: `bun run narratives`" carries a fenced block with
`narratives`, `narratives:confirm 1` and `narratives:reject 1 --why 2`, and the
rule this node exists to make reachable:

> Two attributions, because they are two acts. `drafted_by` is who wrote the
> words; `confirmed_by` is who accepted them. … **An agent cannot confirm its own
> draft** — `confirmed_by.kind` must be `"human"`, structurally. … without it,
> `confirmed` degrades into *"an agent said so twice"*.

So this was **case 1 of `covered-is-not-reachable`** in its plainest form — a
mechanism inlined in its skill's prose — and the remedy was a node, not a new
entry in the platform's capability vocabulary.

**Third time in one session, always the same way: I searched skill NAMES instead
of reading skill BODIES.** `shzs` was `code-node-review` naming `bun run
check:tools`; this is `library-ingestion` naming `bun run narratives`. Neither was
findable by grepping for the capability's words.

`interaction-modality` carries the other half I was about to write — the
`low-dexterity` profile's *"Every question is a selection. Options numbered. One
recommended default, first, marked."* — so the node cites it rather than restating
it.

### The invoke is the LISTING, and that is the design rather than a shortfall

`reviewer()` throws outside a TTY:

> refusing to record a human decision from a non-interactive shell. Confirming is
> a PERSON's act; an agent running this would be recorded as one.

That refusal is load-bearing: driving the CLI in an agent container once wrote
`"rejected_by": {"kind": "human", "id": "Claude"}`, because `git config user.name`
is the agent's and the schema could not tell.

**So an agent cannot confirm or reject, and a node whose `invoke` were
`narratives:confirm` would declare a capability its reader does not have.** What an
agent *can* do — and the thing that was actually missing — is FIND the queue and
read what is waiting on a person. `selection.limits` names the confirming arms and
quotes the refusal, so the node is honest about where it stops.

That also makes `--why-text` moot as a node concern: no agent reaches that flag, so
there was never an argv-prose problem to solve here. Worth recording, because I had
it queued as work.

### Verified by running, not reading

- `bun run narratives` — exit 0, the live queue listed numbered, with five numbered
  rejection reasons
- `bun run narratives:confirm 1` — **refuses**, with exactly the message
  `selection.limits` quotes
- `check:tools` 0 — *"every satisfies resolves and agrees with its skill's
  contract"*; `library-ingestion` has no declared contract to contradict
- `tools:coverage` — `library-ingestion` gone from all four tiers
- `bun run gates --all` — **61 of 61**, the whole set, 174 e2e tests
