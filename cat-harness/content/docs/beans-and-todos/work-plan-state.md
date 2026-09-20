The rest of this page says what a bean **is**. This section says what the
store currently **holds** — read live from
[`/assets/beans/index.json`](../assets/beans/index.json), the projection
`gen-docs-pages.ts` writes from `beans/defs/` on every build, beside the todo
index it has published for longer.

Until 2026-09-20 there was nothing to put here. `todos/` had a reader, a
published index and a board over it; `beans/` had none of the three, though it
is the larger store by two orders of magnitude. A work plan nobody can look at
is one nobody checks.

**What the dashboard shows, and why each panel is the shape it is.** The
counts are a headline, so they are numbers rather than a chart of four bars
saying the same thing. The epic distribution is magnitude across identities
with long names, so it is a horizontal bar. The findings are three or four
rows, so they are a list — with an icon and a label on every row, because a
status colour never carries meaning alone.

**The findings are computed from committed data only, and one of them is
missing on purpose.** A stale `in-progress` detector would have to read the
clock, and the projection is gated on exact content — anything computed
against the clock changes the file on every build and the staleness gate then
fires forever. So the projection publishes each bean's `updated_at` as a fact
and the page computes age when you open it. Age therefore moves without the
file moving, which is the right way round.

**What is not here.** Where a bean sits in a BPMN process, which is the other
half of bean `v49e`. That join needs `beans/workflows/`, the declared
`workflow-state` graph, and it is empty — so a position view would report
"nowhere" for every bean in the store. It waits for instance state to exist.

<div class="fa-workplan" data-fa-workplan>
  <p class="fa-workplan-fallback">
    The live work-plan dashboard needs JavaScript. The projection it reads is
    <a href="../assets/beans/index.json">a plain JSON file</a> and can be read
    directly.
  </p>
</div>
