---
# folio-assistant-7go7
title: laneBinding reports every ref-bearing lane as dangling when the role graph cannot be read
status: completed
parent: folio-assistant-zzmr
type: task
created_at: 2026-09-23T10:46:28Z
updated_at: 2026-09-23T10:46:28Z
---

schemas/role-graph.ts laneBinding(): with graph undefined, a lane carrying a roleRef returns kind:dangling. One unreadable file therefore renders as a corpus of dangling references — the dh4f shape. Found while building zw4a; NOT changed unilaterally because kg:audit shares the resolver.

## The behaviour

`schemas/role-graph.ts`, `laneBinding()`:

```ts
const role = graph ? roleForLane(graph, lane.name, lane.roleRef) : undefined;
if (role) return { kind: "bound", role };
if (lane.roleRef) return { kind: "dangling", ref: lane.roleRef };
return { kind: "unbound" };
```

With `graph === undefined`, every lane carrying a `roleRef` returns `dangling`.
**One unreadable or absent role graph therefore renders as a corpus of
dangling references** — the `dh4f` shape, where a sweep that could not look
reports findings rather than reporting that it could not look.

Measured: 183 of the 184 lanes in this corpus resolve `bound` today, and 44 of
them carry an explicit `roleRef`. Those 44 would all flip to `dangling`.

## Why it was NOT changed when it was found

Found 2026-09-23 while building `zw4a`, by a test whose expectation was wrong
— it asserted `unbound` on the strength of a comment claiming that was the
behaviour. The comment was false and is now corrected.

`laneBinding` is **`kg:audit`'s resolver as well** (`scripts/kg-audit.ts`,
`glossary-export.ts`). A viewer guarding the case locally would make the viewer
and the audit disagree about whether a lane is bound, which is worse than the
shape it avoids — one answer wrong in a known way beats two answers.

## The question, which is genuinely open

`laneBinding`'s own docstring argues that `undefined` from `roleForLane` is
**overloaded**, and splits it into five kinds precisely so a consumer can tell
a typo from a design decision. This is the same argument one level up:
*"resolved to nothing"* and *"nothing was consulted"* are also different, and
the type does not separate them.

Candidates:

1. **A sixth kind** — `ungraphed`, or similar: the graph was not available, so
   no verdict is possible. Consistent with the existing argument, and every
   consumer is then forced to decide what to do about it.
2. **Refuse the undefined graph** — make the parameter required. Callers that
   have no graph then cannot ask, which may be the honest answer: the question
   is not meaningful without one.
3. **Leave it.** In practice the graph is absent only when no instance declares
   any role at all, which is a larger failure that would surface elsewhere.

(1) matches how this module already reasons. (2) is smaller but pushes the
problem to every call site. Not decided here.

## Done when

- [ ] Decided among the three, with the reason recorded.
- [ ] If the shape changes, `kg-audit` and `glossary-export` are checked
      against it — they share the resolver and their verdicts must not shift
      silently.
- [ ] A test covers the no-graph case explicitly, whichever way it resolves.
      One exists in `scripts/tests/lane-detail.test.ts` pinning today's
      behaviour; it should move or change with the decision.


## Decided — the owner, 2026-09-23: candidate (2), make the graph required

Chosen over (1), a sixth `ungraphed` kind. The reason it is the stronger of the
two: **a caller with no graph cannot ask the question, which is the honest
answer** — a lane's binding is not a fact that exists without a role registry.
A sixth kind would have let a consumer keep asking and then forget to handle
the reply, which is the shape this bean is about.

### The reason given for NOT fixing it was false, and checking it is what unblocked this

This bean said a local guard *"would make the viewer and the audit disagree
about whether a lane is bound"*. It would not have. `kg-audit.ts` **already**
branches on `!graph` and overwrites `role-ref-resolves`, `lane-binds-role` and
five more with `unknown` — *"No role graph is a state the audit can be in, and
it is not a pass."* So the audit never published `dangling` in that state; it
computed the verdicts and threw them away.

**The consumer that disagreed with the audit was the viewer**, which took the
verdict verbatim and published it. The premise was backwards, and it was the
only thing standing between the defect and a small fix.

### What each consumer answers now

The type found all five call sites, which is the argument for a required
parameter over a defaulted one.

| consumer | with no graph |
|---|---|
| `kg-audit.ts` | skips the lane loop (`if (!graph) break`) instead of computing and discarding; the `unknown` overwrite it already had is unchanged |
| `gen-processes-viz.ts` | `binding: "ungraphed"` — the viewer's word for could-not-determine, agreeing with the audit's `unknown` rather than contradicting it |
| `glossary-export.ts` | ONE problem naming the missing registry, not one per lane. That channel is fatal (`exit(1)`), so the old behaviour was a red gate built from false symptoms |

`variable-performer.test.ts`'s two no-graph tests now use an EMPTY graph, which
still shows the contradictory case is decided before the graph is consulted —
an empty graph could not have produced that answer. A third test pins that an
empty graph answering `dangling` is CORRECT: somebody declared roles and this
ref is not among them, which is an answer, where no graph is not.

`lane-detail.test.ts`'s pinning test now asserts `ungraphed` and carries the
corrected premise.

## Summary of Changes

`laneBinding(graph: RoleGraph, lane)` — required. Three consumers each given an
explicit could-not-determine. Five call sites, all found by the type. Gates
135/135.
