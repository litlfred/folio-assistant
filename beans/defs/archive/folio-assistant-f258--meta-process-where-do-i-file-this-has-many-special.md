---
# folio-assistant-f258
title: 'META-PROCESS: ''where do I file this?'' has many specialised answers and no general one — plus the surprise-to-corpus loop'
status: completed
type: feature
priority: high
created_at: 2026-09-21T21:09:05Z
updated_at: 2026-09-22T09:29:56Z
parent: folio-assistant-ahvw
---

Owner, 2026-09-21, two linked asks in one message:

> also during such interactions/any task really, review the discussion/(input.output),
> was there something unexpected that happened (stastically so, logically so)
> then, if it is is happening during a defined process that is
> happeneing/expecting to happen often, it may be worth a new
> skill/guidance/tool refinment. if so prompt the user to add to corpus.
>
> (Need a meta-process "where to file things" as we have lots of specialized
> instances of that. bean up to review those and develop process/subprocesses.
> any lit we need on proven methdologies to help?)

## Part 1 — the SURPRISE-TO-CORPUS loop

A standing review at the end of a task: was anything UNEXPECTED, statistically
or logically? If so, and it happened inside a process that runs often, that is
a candidate for a new skill, a guidance line or a tool refinement — and the
agent PROMPTS THE USER rather than adding it unilaterally.

Three things make this worth designing rather than asserting:

- **What counts as unexpected.** 'Statistically' implies a base rate, and the
  corpus carries none for anything today. LOGICAL surprise — a premise that
  turned out false, a gate firing for a reason nobody predicted — is cheaper
  to detect and is probably where this starts.
- **The recurrence test is the filter.** A surprise inside a one-off is an
  anecdote; the same surprise inside a weekly process is a defect in the
  process. Without that filter this generates noise every turn.
- **PROMPT, never write.** The owner said prompt. Same rule as
  deletion-requires-confirmation, pointed the other way: the agent proposes a
  durable change to the corpus and a person decides.

THIS SESSION IS ITS OWN EVIDENCE. Four logical surprises, each costing a
cycle, each reaching a skill only because somebody happened to notice:

1. potracer treats ZERO as foreground — the inverse of the name (5r57)
2. Image.crop past the edge pads with BLACK, which a tracer reads as ink (5r57)
3. .fa-qr-toggle stopped being an IDENTITY the moment a second button reused
   it as a box class, breaking 39 test selectors at once
4. a bean id read off a listing that sliced one character too many — the
   parent 'hvw' did not exist and the create failed silently behind a
   `tail -1`, after the wrong id had already been written into a pushed
   commit message. The general shape: a truncated identifier that still LOOKS
   like an identifier.

Number 4 is the best argument for the loop. It was caught by accident.

## Part 2 — the META-PROCESS: where does a thing go?

Many specialised answers to one question, and no general one. From the corpus:
beans vs issues vs PRs (issue-working); bean type and parent (todo-manager,
check-bean-parents); which graph a directory holds
(content-context-and-state-graphs); adapter vs profile vs visualiser
(content-profiles, issue #764); AGENTS.md vs a skill (the banner atop
AGENTS.md); skill vs agent memory (agent-memory); spec on the issue vs in the
graph (4kq7); which harness's docs/ owns a link (crdm-detect, added today).

Each is well argued in isolation. Nothing says WHICH question you are asking —
and an agent who does not know a rule exists cannot look it up.

This bean is itself an instance: choosing where to file IT took a judgement
call (PROCESS epic ahvw, over QA, KG, or a new root).

## Part 3 — the owner's question, recorded UNANSWERED

> any lit we need on proven methdologies to help?

Candidates to CHECK, none endorsed here; the owner picks:

- after-action review / blameless post-incident practice — the closest mature
  literature to part 1
- information architecture and faceted classification — for part 2
- Diataxis — for what KIND of document a thing should be
- ADRs (architecture decision records) — this repo already does something
  close, in long commit messages and issue specs

## Done when

- [x] a written rule for when a surprise becomes a corpus candidate, with the recurrence filter
- [x] the prompt is a PROMPT — the agent never writes corpus guidance unasked
- [x] a routing skill naming the filing questions and pointing at the skill that answers each
- [x] the owner has said which methodologies, if any, to draw on


## Progress, 2026-09-22 — three of four done-whens; the fourth is the owner's

Two skills, cross-linked, rather than one. "Where does this go?" and "is this
worth filing at all?" are different disciplines with different triggers, and
folding them would give one skill nobody reaches for either reason.

### `where-does-this-go` — the router that answers nothing

NINE questions, each a discriminating question and a pointer. It deliberately
summarises none of the answers: a router that did would be nine summaries
free to drift from nine skills, which is the migration debt the banner atop
`AGENTS.md` describes. Every pointer was verified to resolve AND to carry the
section named — by reading it, not by matching the words.

Two pairs get an explicit discriminator, because they are the ones that read
as one question and are not. Rows 1 and 3 (bean-or-issue vs which-type) —
taking them together is how a design discussion ends up a `task` with no
issue behind it. Rows 6 and 7 (which graph vs which content type) — a
directory has no vocabulary and a block kind has no `holds`.

**When no row matches, that is a finding**, not a licence to improvise: say
so and propose the tenth row. Filing by resemblance to the last thing filed
is what produced nine rules nobody can see at once.

The count NINE is stated in prose where this repository's rule is usually
never to. The difference is argued in the skill: a count of findings is a
measurement that ages, while this one is a claim about the table directly
beneath it, falsifiable by looking down.

### `surprise-to-corpus` — notice, filter, prompt

LOGICAL surprise only, and the skill says why: "statistically unexpected"
implies a base rate and the corpus carries none — nothing records how often a
gate fires or a selector breaks. Claiming a statistical surprise today would
assert a distribution nobody measured.

The recurrence filter is the part that stops this generating noise every
turn, and it is two-part: did this happen in a process that runs often, AND
would the next agent hit it too. The second half separates a fact about the
system from a fact about the mistake you personally made. Three ways a
candidate fails, all ending in silence rather than a prompt — and the common
one is "the corpus already says it and you had not read that part", which
costs one grep to check.

PROMPT, never write: `deletion-requires-confirmation` pointed the other way.
The prompt carries `interaction-modality` §4.1's six parts, and the sixth is
the one that makes the rule survivable — **what happens if they say nothing**
is that a bean is filed. A prompt whose only outcomes are "yes" or a dropped
observation makes silence expensive, and a person under load will reasonably
ignore it.

The four surprises this session produced are the worked examples, each with
its general shape. Number 4 — an id sliced one character short that still
LOOKED like an id, failing silently behind a `tail -1` after the wrong id was
already in a pushed commit — is the argument for the whole rule, because it
was caught by accident.

### Discoverability, which is the router's own defect if missed

`AGENTS.md` gains a pointer entry. Without it the router has exactly the
problem it describes: an agent who does not know it exists cannot look it up.
Pointers only — no rule text — which is what that file is for.

Both skills audit clean: `kg:audit` reports zero findings on each.

## Still open — the owner's question, still unanswered

> any lit we need on proven methdologies to help?

Four candidates were recorded when this bean was filed and NONE is endorsed
here. Asked properly rather than decided quietly, because picking one would
shape both skills and is the owner's call.


## The fourth done-when, settled 2026-09-22 — after-action review, part 1 only

The owner picked AFTER-ACTION REVIEW, and scoped it: part 1 only. Applied to
`surprise-to-corpus` as two changes, both substantive:

**The expected/actual/why framing opens §1.** It earns its place because it
makes a surprise ARTICULABLE before anyone knows whether it matters.
"Something felt off" is not reviewable; "I expected the tracer to read the
mask as ink and it read the ground" is. The recurrence filter then operates
on a statement rather than a feeling, which is the difference between a rule
applied consistently and one that reduces to mood.

**The blameless reading sharpens the slip exclusion**, and it did NOT widen
the filter — it says more precisely what the filter was already testing. "My
own slip" almost never fails on its own: it fails when the system behaved as
documented AND nothing made the slip easy. Where the system DID make it
easy, the filter's second half — would the next agent hit it too — is
already satisfied.

Surprise 4 is the worked case. Read as "I mis-copied an id" it is a slip and
files nothing. Read blamelessly it asks why a wrong id was easy to produce
and easy to miss, and both answers are system properties: a truncated id is
still a well-formed id, and `| tail -1` hides a non-zero exit.

**Saying what it did not change is part of the record.** No severity scale
(AAR usually grades by impact; grading here would invite filing the low
ones, which is the noise the filter exists to prevent), no timeline
reconstruction (AAR rebuilds a contested sequence; the agent was present for
the whole turn and the transcript IS the timeline), and nothing for part 2.
Adopting a methodology and then claiming it altered more than it did is how
a corpus acquires vocabulary without acquiring discipline.

**Part 2 draws on nothing, and that was the owner's scoping.** Information
architecture was the candidate and it was declined on SCALE: nine rules is
below the point where faceted classification earns its complexity, and what
the corpus lacked was an index rather than a taxonomy.
