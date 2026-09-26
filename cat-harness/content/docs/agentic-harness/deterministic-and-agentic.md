Workflow processing here is a **spectrum, not a switch**, and the harness is
already at four different points on it without ever having named the axis:
`cat-harness.processes:policy enforcement` decides whether a step that is not enabled is
refused or merely noted; `relaxable="false"` decides whether a package may
negotiate a base step away; `cat-harness.processes:decision` decides whether a branch is
computed from a table rather than chosen; and the commit-boundary gate refuses
the write by something that is not the agent.

Those are **not one axis**, and treating them as one is the first thing to get
wrong. At least three questions are being conflated — *who decides* the branch,
*what happens if the decision is wrong*, and *who enforces*. A step can be
fully agentic on the first and fully deterministic on the third: the commit
boundary is exactly that, an agent deciding freely and a hook refusing the
write regardless.

A gateway now says which it is. `<cat-harness.processes:decision>` means a table computes it
and a hand-supplied outcome is refused; `<cat-harness.processes:judgement reason="…">` means
somebody's call, with the reason required. Before that marker, "no table
because this is a judgement" and "no table because nobody wrote one" were
indistinguishable — and `bun run check:workflow-refs` now prints the three-way
split, so the question *how much of this is decided by a model?* has an answer
that is counted rather than asserted.

**What that count is for is research, and it is open.** Which judgement points
are safety risks, how much must be deterministic, and how models compare across
sub-workflows under a controlled overlay of context and memories are three
questions this repository can now ask and has not answered. The agenda, with
each claim marked as measured, decided or hypothesis, is
[`deterministic-and-agentic`](reference/skill-instructions/deterministic-and-agentic.html).
Read it as an agenda: there is more hypothesis in it than measurement, and it
says so.
