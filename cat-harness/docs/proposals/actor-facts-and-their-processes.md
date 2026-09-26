---
title: "Actor facts and the processes that must read them"
kind: proposal
movedFrom: fsh-guts/proposals/
movedOn: 2026-09-23
issue: 363
bean: folio-assistant-bkje
summary: >-
  Two asks — air-gapped as an actor property forcing a human route for signing, and the missing actor/role processes — are one defect: an actor fact that nothing consumes. The fallback model can swap a tool and cannot swap an ACTOR, which is why the two signing routes are unexpressible today.
---

# Actor facts and the processes that must read them

> **Editorial correction, 2026-09-23.** This proposal was written while the
> instance declaration was a fixed `harness.json`; it is `<name>.json` since
> the 2026-09-21 split (`<name>.config.json` is the config beside it). The
> references below were updated so a reader is not sent to a file that does not
> exist — the proposal's argument is untouched, and only the filename moved.
> The occurrences were invisible while this lived under `fsh-guts/`, which the
> filename gate counts as retired material; publishing it is what surfaced them.

{: .no_toc }

Two asks from the owner, 2026-09-20, resolved the same way because they are
the same defect.

> some of the machine actors may be air-gapped, it is a property of an actor.
> depending on the propeorty, different tools might not work. in this case an
> API wouldnt wokr and a human actor is needed. so process for signing needs
> two parallel routes/processes, air gapped vs not, the first needed a human
> actor

> for actor roles similarly propose missing proccses invlving the actors

1. TOC
{:toc}

---

## 0. The one sentence

**An actor fact that no process reads is the same defect as a skill bound to
no role** — and this repository has now found it four times, fixed it once,
and never once added the missing *consumer*.

---

## 1. The recurring category error, measured

| when | where | what happened |
|---|---|---|
| 2026-09-18 | `capabilities[]` on actors | held **probes, permissions and skills** in one field. **Fixed** (`ind9`): field split, permissions given their own node kind |
| 2026-09-18 | `.claude/skills/requirements/*.json` | read as skills — "the same category error `actors/` and `capabilities/` had" (`m4zg`) |
| 2026-09-19 | `roles:` in skill front matter | holds **four** kinds — swimlane roles, undeclared tier words, one actor id, one nothing — and **no reader** (`qif9`) |
| **2026-09-20** | **actor facts generally** | the ones now correctly declared still have **no consuming process** |

**The progression is the point.** `ind9` ended the ambiguity by giving
permissions a home. It did not give them a **reader**. Splitting a field
stops two things being confused; it does not make either of them consumed.

So the general remedy proposed here is not another split. It is:

> **Every declared actor fact needs a process that reads it. Where the fact
> makes the machine route impossible, the process routes to a human lane.**

---

## 2. Thread one — reachability is an actor property, and the fallback must be an ACTOR

### 2.1 Why it belongs on the actor, not the deployment

`folio-assistant-g7vb` landed a `network` axis — `internet` |
`egress-restricted` | `air-gapped` — on the **deployment**
(`<name>.json`'s `topology`). That is the wrong granularity for this case,
and the owner's sentence says why: a deployment may have internet while a
**particular machine actor inside it** cannot reach out. Reach is a fact
about the participant, not only about the site.

The two are not in conflict. The deployment axis bounds what is possible;
the actor property says what *this* participant can do within it. An
air-gapped deployment forces every actor air-gapped; a connected deployment
does not make every actor connected.

**Confirmed by the owner 2026-09-20**, deciding the `air-gapped` × `mixed`
question left open by `g7vb`:

> "no air-gapped-mixed. that is mixed already. its a spectrum, based on the
> deployment archicutectur of each machine actor."

That settles what the deployment value *is*: **an aggregate over the
participants.** `mixed` asserts variety among actors, so there is no
contradiction in it to catch. The corollary is the rule this proposal turns
on — reach is per machine actor, and the deployment axis describes the
population rather than any participant.

### 2.2 Most of it fits machinery that already exists

`CapabilityDefinition` already carries
`requires?: string[]` — *"other capability IDs this one depends on"*. So:

- declare a capability for network egress;
- capabilities that need it — `git-push`, an API-backed signer — **require**
  it;
- an air-gapped actor simply **does not carry** it.

Absence is already how unavailability is expressed, and `requires` already
propagates it. **No new axis, no new field on the actor.** "Depending on the
property, different tools might not work" is exactly what `requires` means.

Measured 2026-09-20: the capabilities actually claimed by the 26 actors are
`git-push` (9), `ig-publisher` (4), `fhir-validator` (3), `jekyll` (2),
`lean-toolchain` (1), `sushi-compiler` (1). **None is about network reach.**
Nothing yet says which of them need it.

### 2.3 The one thing that does NOT fit, and it is the crux

```ts
export interface SkillCapabilityRef {
  degradation: "fail" | "warn" | "skip" | "fallback";
  /** Alternative capability to use in fallback mode. */
  fallbackCapabilityId?: string;
}
```

**The fallback is always another CAPABILITY.** There is no way to say *"fall
back to a different actor"*.

So the model can express *use a different tool* and cannot express *use a
different kind of participant*. "No API reaches out, therefore a person
signs" is **unexpressible today** — which is precisely why the two parallel
routes the owner describes cannot be drawn.

This is the real finding of thread one. Everything else is assembly.

### 2.4 What signing needs

A process with two routes from one gateway that reads an actor fact:

| route | performed by | when |
|---|---|---|
| **API signer** | a machine actor carrying the egress capability | reach available |
| **human signer** | a person, in their own lane | reach unavailable |

The repository already has **DMN-backed gateways**, so a computed branch is
not new. What is new is the branch input being *a property of the actor
performing the lane*, and one outcome landing in a **human** lane.

### 2.5 This answers a question `zz0a` left open

`folio-assistant-zz0a` (test runs are hashable and signable, shipped
2026-09-19) closed with signing explicitly unresolved:

> Signing needs a key and an identity, which is an infrastructure decision
> that differs per topology … That may mean signing is an axis value rather
> than a fixed mechanism. Flagged, not resolved.

**It is not an axis value.** It is an actor property plus a process branch.
The axis bounds it; the actor decides it; the process routes on it.

---

## 3. Thread two — the actor facts that exist and no process reads

### 3.1 The join itself is clean

Measured 2026-09-20 across 26 actors, 31 roles and 34 diagrams:

| check | result |
|---|---|
| declared roles bound to at least one lane | **31 of 31** |
| actors naming a role that does not exist | **0** |
| actors whose every role is unbound | **0** |
| lanes binding no role | **0** |
| actors with no roles | **1** — `viewer` |

`viewer` is not a gap. Its own description: *"Takes on no role: it never
appears in a swimlane, which is why `roles` is empty rather than absent."*
A determined empty, and the right way to record one.

### 3.2 What is missing is the administration process

`admin` holds two permissions no other actor has — **`role-management`** and
**`admin-settings`** — and, measured the same day:

- no diagram mentions role assignment, permission granting or actor onboarding;
- no lane anywhere is named for admin or governance;
- `admin` **does** appear in 17 diagrams — as programme-manager,
  publication-manager, editor, author, reviewer, code-reviewer.

So the one thing that actor uniquely **is** is the one thing never drawn.
Every appearance is in a borrowed hat.

**Why this is structural rather than an oversight.** Permissions cross-cut
lanes, so most are simply *exercised inside* one and need no diagram.
`role-management` is different: exercising it **changes the role graph
itself** — the thing every other diagram's lanes bind to. A process edits
the substrate, and it is undrawn and ungated.

### 3.3 The missing diagram, and the question it forces

An `actor-role-administration.bpmn` sitting *above* the others:

| activity | why it needs drawing |
|---|---|
| add an actor, declare its kind | agentic-vs-mechanical is judgement (`role-model.md`) |
| assign roles to an actor | the join every other diagram depends on |
| grant or revoke a permission | cross-cuts every lane; no gate today |
| retire an actor | `deletion-requires-confirmation` has no process to live in here |
| audit after a change | `kg:audit` exists; nothing says *when* to run it |

**The question it forces, and it is not mine to answer:** there is no `admin`
**role**, only an `admin` **actor**. Drawing the lane means deciding whether
administration is a swimlane at all — a vocabulary decision, and the sort
this document exists to put to the owner rather than invent.

### 3.4 Thin, though connected

Four actors reach exactly one diagram each — `evidence-agent`,
`ig-publisher-service`, `lean-mcp`, `translator`. Not broken; each simply has
a single picture of itself, so there is no view of it in another context.

---

## 4. The same-way resolution

One rule, two instances, two checks.

**The rule.** A declared actor fact must have a consuming process, and a
degradation must be able to name an **actor** as its fallback, not only a
capability.

| instance | the fact | the consumer it needs |
|---|---|---|
| signing | an actor's network reach | a two-route signing process, human lane on the unreachable branch |
| administration | `role-management` on `admin` | `actor-role-administration.bpmn` |

**The two checks**, both modelled on `skill-in-role-or-process`, which
already finds 110 skills bound to nothing:

1. **`actor-fact-has-consumer`** — a permission or capability an actor
   declares, that no process or gateway reads, is a finding. Expect it to
   fire widely at first; that is the same debt-measuring start
   `agents-xref` had, and the same remedy: report before gating.
2. **`fallback-actor-resolves`** — a degradation naming an actor fallback
   must name a lane that exists in the process it is used in. Without this
   the new field is a second `blv9`: a reference-shaped value resolving to
   nothing.

**And a vacuity guard on both**, because a check over a field nobody has
populated yet passes trivially. That has been paid for three times here: a
grep over zero Lean files printing OK, a ruff scan of missing paths, and
`readme:sync:check` over a marker-less README.

---

## 5. What would change my mind

1. **If "a human is available" can be a capability.** Then no new fallback
   kind is needed — the human route is just another capability with a
   different probe. *Against it:* a declared capability carries
   `detection: { method: "command", … }`. A person is not probeable by a
   command, and `ind9` fixed exactly the error of putting non-probeable
   things in that field. Putting one back would undo it.
2. **If reachability is genuinely deployment-wide.** Then the `network` axis
   already covers it and only the fallback-to-actor gap is real. The owner's
   sentence says otherwise, and that sentence is the evidence.
3. **If administration is not a process.** If assigning a role is a
   filesystem edit reviewed like any other change, then §3 dissolves into
   `code-change-review.bpmn` and the answer is a gate, not a diagram.

---

## Related work

| item | what it holds |
|---|---|
| [#363](https://github.com/litlfred/folio-assistant/issues/363) | the deployment topologies request, and `zz0a`'s open signing question |
| `folio-assistant-ind9` | the same category error, **fixed** — split the field, give the fact a home |
| `folio-assistant-qif9` | the same error found again in skill front matter, and still inert |
| `folio-assistant-y1w9` | 110 skills bound to no role or process — the skill-side twin of §4 |
| [`role-model.md`](../../skills/folio-core/role-model.md) | actor / role / skill / permission, and why merging compositions gives a closure too broad to audit |
| [Deployment topologies](deployment-topologies.html) | the `network` axis this proposal puts at the wrong granularity for one case |
