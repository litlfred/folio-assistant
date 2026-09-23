---
# folio-assistant-7go7
title: laneBinding reports every ref-bearing lane as dangling when the role graph cannot be read
status: todo
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
