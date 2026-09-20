# cat-bootstrap

**You have just been pointed at a repository and know nothing about it.** Read
this page, then start the one process it names. Nothing else here is a
prerequisite.

## The words, once

Six, and every later sentence uses them rather than re-explaining them.

| | |
|---|---|
| **Harness** | what a repository can be made into — `cat-bootstrap` itself, or a derivative such as `cat-harness`, `folio-assistant`, `smart-guidelines`. |
| **Initiator** | **you**: the agent asked to initialize a harness, knowing only what this page gives you. |
| **Requestor** | the person who wants one initialized. The only one who can say *which*. |
| **Knowledge Graph Data Store** | a git repository — where a harness is read from and a new one written to. Reached through the git CLI, or through a forge's API. |
| **Logger** | where an actor says what it is doing. Records; decides nothing. In cat-bootstrap it is the discussion you are already in. |
| **Process** | a diagram with lanes, steps and branches. Each lane is a role; you act in yours. |

An Initiator has **no** harness, no server, no tools and no work plan. If a
step seems to need one, you are reading instructions meant for later.

## Start the process

> **Open [`workflows/initialize-harness.bpmn`](workflows/initialize-harness.bpmn)
> and begin at its start event.**

**It is the only process you START, and that is deliberate** — you cannot begin
the wrong one. It is a file you read, not something you run: the engine that
executes a diagram belongs to the harness you have not installed yet.

There is a second diagram, [`workflows/log-message.bpmn`](workflows/log-message.bpmn),
and it is **not** an alternative start. It is an independent sub-process:
something a step *calls*, never somewhere you begin. You may call it from any
step to say what you are doing, and `initialize-harness` calls it at two steps
where saying so is required. Its skill is
[`skills/log-message.md`](skills/log-message.md).

To read it, and anything else here, use
[`skills/cat-bootstrap-kg-navigation.md`](skills/cat-bootstrap-kg-navigation.md). It assumes nothing but
the ability to open a file.

The process ends one of two ways: a harness installed, or a failure logged.
Both are outcomes. Neither is a reason to improvise.

**The likeliest failure is that the location is already a harness**, and it is
the one worth recognising early: a repository whose root carries a
`harness.json` has been initialized, usually because the work is done. That is
logged and ended rather than redone. Re-initialising over an instance that has
content, history and dependents is not undone by running anything again.

## Two things it will send you to

Named here so they are not a surprise mid-process.

**Asking which harness** — [`skills/confirm-harness.md`](skills/confirm-harness.md).
You bring a list of candidates and locations; the Requestor returns **at most
one** harness. You may narrow the list. You may not break a tie.

**The chosen harness's own instructions** — always at the same place inside it:

```
<name>/docs/cat-bootstrap/initialization.md
```

`<name>` is the `name` in that harness's `harness.json`. It is the same path
for every harness, which is why you can be sent to one nobody has written yet:
you do not need to know what `f-a-sci` or `smart-guidelines` *is*, only that it
keeps its instructions where every harness does.

## If something does not resolve

**Say so and stop.** A file named here that is missing, a harness whose
instructions are not at that path, a name that matches nothing — each is worth
reporting, and none is a gap to work around.

A wrong harness does not fail. It *succeeds at being the wrong thing*, and
every artefact written afterwards inherits it. A repository left
un-initialised is recoverable; one declaring the wrong upstream is not.

---

**Terms, if you want the precise definitions:**
[harness declaration](../cat-harness/schemas/cat-harness.ts) ·
[skill](../cat-harness/schemas/skill-package.ts) ·
[role](../cat-harness/schemas/role-graph.ts) ·
[process](../cat-harness/skills/workflows) ·
[tool](../cat-harness/schemas/tool.ts).
Why bootstrapping is built this way:
[the proposal](../fsh-guts/proposals/cat-bootstrap.md).
