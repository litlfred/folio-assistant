---
# folio-assistant-85e8
title: 'DEGRADATION: fallback can swap a tool but not an ACTOR'
status: todo
type: bug
created_at: 2026-09-20T03:12:36Z
updated_at: 2026-09-20T03:12:36Z
parent: folio-assistant-ahvw
---


**The crux of the signing thread.** Found 2026-09-20 while designing the
two-route signing process the owner asked for.

```ts
export interface SkillCapabilityRef {
  degradation: "fail" | "warn" | "skip" | "fallback";
  /** Alternative capability to use in fallback mode. */
  fallbackCapabilityId?: string;
}
```

**The fallback is always another CAPABILITY.** The model can express *use a
different tool*; it cannot express *use a different kind of participant*.

So the owner's case — "an API wouldnt wokr and a human actor is needed" — is
**unexpressible today**, and that is why the two parallel routes cannot be
drawn. This is a schema gap, not a missing diagram.

## What it needs

An actor-valued fallback beside the capability-valued one, naming the lane
that takes over. Then `folio-assistant-r0rq` can be drawn.

## The trap to avoid

Do NOT model "a human is available" as a capability to reuse the existing
field. A declared capability carries
`detection: { method: "command", command: "…" }` — it is a thing you PROBE
the environment for. A person is not probeable by a command, and bean
`folio-assistant-ind9` fixed exactly the error of putting non-probeable
things in `capabilities[]`. Putting one back undoes a completed fix.

## Done when

- [ ] a degradation can name an actor or role fallback, not only a capability
- [ ] `fallback-actor-resolves` checks the named lane exists in the process
      it is used in — otherwise the field is a second `blv9`, a
      reference-shaped value resolving to nothing
- [ ] both checks carry a vacuity guard: a check over a field nobody has
      populated passes trivially, which this repository has paid for three
      times
