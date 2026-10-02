---
# folio-assistant-r0rq
title: 'SIGNING: two routes — API signer vs human signer, branching on an actor''s reach'
status: completed
type: task
priority: normal
created_at: 2026-09-20T03:12:36Z
updated_at: 2026-09-20T03:59:40Z
parent: folio-assistant-ahvw
---


**From the owner, 2026-09-20** on
[#363](https://github.com/litlfred/folio-assistant/issues/363):

> some of the machine actors may be air-gapped, it is a property of an
> actor. depending on the propeorty, different tools might not work. in this
> case an API wouldnt wokr and a human actor is needed. so process for
> signing needs two parallel routes/processes, air gapped vs not, the first
> needed a human actor

## Reachability belongs on the ACTOR, not only the deployment

`folio-assistant-g7vb` put `network` — `internet` | `egress-restricted` |
`air-gapped` — on the deployment. That is the wrong granularity here: a
deployment may have internet while a particular machine actor inside it
cannot reach out.

The two compose rather than conflict. The deployment axis BOUNDS what is
possible; the actor property says what THIS participant can do within it.
An air-gapped deployment forces every actor air-gapped; a connected one
does not make every actor connected.

## Most of it needs no new vocabulary

`CapabilityDefinition.requires` already means "other capability IDs this one
depends on". So declare a network-egress capability, have the capabilities
that need it require it, and an air-gapped actor simply does not carry it.
Absence is already how unavailability is expressed, and `requires`
propagates it. That IS "depending on the property, different tools might not
work".

Measured 2026-09-20 — capabilities claimed across 26 actors: `git-push` (9),
`ig-publisher` (4), `fhir-validator` (3), `jekyll` (2), `lean-toolchain` (1),
`sushi-compiler` (1). **None about network reach**, and nothing says which
of them need it.

## The two routes

| route | performed by | when |
|---|---|---|
| API signer | a machine actor carrying egress | reach available |
| human signer | a person, own lane | reach unavailable |

DMN-backed gateways already exist, so a computed branch is not new. What is
new is the branch input being a property of the actor performing the lane,
and one outcome landing in a HUMAN lane.

## BLOCKED on folio-assistant-85e8

The degradation model's fallback is a CAPABILITY, never an actor. Until
that gap is closed the human route cannot be declared, only drawn as prose.

## This answers what zz0a left open

`zz0a` closed with: *"That may mean signing is an axis value rather than a
fixed mechanism. Flagged, not resolved."* It is **not** an axis value — it
is an actor property plus a process branch. The axis bounds it, the actor
decides it, the process routes on it.

## Done when

- [ ] network reach is declared such that an air-gapped actor's tools are
      known-unavailable rather than failing at the point of use
- [ ] a signing process exists with both routes, the branch reading an actor
      fact, and the unreachable route landing in a human lane
- [ ] a test shows an air-gapped actor taking the human route and a
      connected one taking the API route
