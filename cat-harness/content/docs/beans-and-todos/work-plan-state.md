The rest of this page says what a bean **is**. This section says what the
store currently **holds** — read live from
[`/assets/beans/index.json`](assets/beans/index.json), the projection
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

**There is a fuller view, and it is browsable.** Every declared state graph
gets its own visualiser at the path this instance already uses for that graph —
`/beans/`, `/todos/`, and one for each of the others. The
route is not this page's invention: bean `o7eq` carries the owner's ruling that
a rendered asset is addressed by its instance's **name** with the **declared
graph as a path segment**, and that this instance elides its own name because
its `docs/` is what the site serves, and the `harness-requirements` skill
names that exact URL as the obligation — *"a requirement of them is to provide
visualisers accessible at `<base-url>/beans`"*. There is no index above them,
because `/` is the documentation site's, so each page lists its siblings.

**A graph with no projection says so.** `qa`, `health`, `issue-marks` and
`uploads` are declared state graphs that nothing publishes a projection for
yet. Their dashboards say exactly that and name bean `2krx`, rather than
rendering zeros for a store nobody read — a dashboard that opens at zero is
indistinguishable from a store with nothing in it, and those are opposite
facts.

**Every identifier on those pages is a link.** A bean id resolves to the bean's
file, an issue or pull-request number to the forge, and each finding carries a
pencil to where writing actually happens. A reference that cannot be resolved
stays as plain text, which is the visible difference between *"follow this"*
and *"this points somewhere I could not reach"*.

**What is not here.** Where a bean sits in a BPMN process, which is the other
half of bean `v49e`. That join needs `beans/workflows/`, the declared
`workflow-state` graph, and it is empty — so a position view would report
"nowhere" for every bean in the store. It waits for instance state to exist.

<div class="fa-workplan" data-fa-workplan>
  <p class="fa-workplan-fallback">
    The live work-plan dashboard needs JavaScript. The projection it reads is
    <a href="assets/beans/index.json">a plain JSON file</a> and can be read
    directly.
  </p>
</div>
