---
title: 'Mount a declared subgraph'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/kg/mount-subgraph.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Mount a declared subgraph

`Process_MountSubgraph` · strict (defaulted) · 4 step(s)

Making a declared subgraph's content available at its declared path, whatever its content source.

You are in this process whenever a step is about to read or write the contents of a declared subgraph — beans, todos, fsh-guts, or any directory a declaration names. The source is resolved once, by `declaredSubgraph` (`schemas/harness-config.ts`) through `resolveSubgraphSource` (`schemas/subgraph-source.ts`): the instance config's `subgraphSources` override by id, then the entry's `source`, then a legacy `storage`, then the `directory` default.

The gateway is on the source KIND, and its flows are the only places the kinds differ. A `directory` subgraph is already where its path says, and writing it is an ordinary commit. A `branch` subgraph is mounted from the declared branch's tip into its path, and written back by splicing onto the tip without force. A kind with no flow here is refused.

<img src="../assets/img/workflows/mount-subgraph.svg" alt="BPMN diagram: Mount a declared subgraph" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** none
- **Presented on:** no docs page section shows this diagram

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Build pipeline | `build-pipeline` | Mechanical: every decision on this lane is read off the resolved source, so the same declaration mounts the same way in every container, and an override in the instance config is the only thing that changes it. |

## Steps

Every one of the 4 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Resolve the subgraph's content source**<br>`Task_ResolveSource` | Build pipeline | [`directory-conventions`](../reference/skill-instructions/directory-conventions.html) | `declaredSubgraph(start, id)`: the declaring instance, the entry, and the<br>resolved source with `declaredIn` saying which layer answered. Never read<br>`source` off the declaration directly — the config override and the<br>legacy `storage` field are folded in by the resolver and nowhere else.<br>A contradiction (both `source` and `storage`; a `qa` subgraph keyed by<br>tip) throws here, before anything is mounted. |
| **Use the checkout path in place**<br>`Task_UseCheckoutPath` | Build pipeline | [`directory-conventions`](../reference/skill-instructions/directory-conventions.html) | A `directory` source IS its declared path. Nothing is mounted; a write is<br>an ordinary commit on the working branch, which is why `branch-store<br>push` answers "commit through git" for it rather than pushing anything. |
| **Mount the branch tip at the declared path**<br>`Task_MountBranchTip` | Build pipeline | [`directory-conventions`](../reference/skill-instructions/directory-conventions.html)<br>[`content-context-and-state-graphs`](../reference/skill-instructions/content-context-and-state-graphs.html) | A `branch` source keyed by `tip`: `branch-store mount --id <dir-id>`<br>writes the tip's files at the declared path, so every reader finds the<br>directory where it always was; `push` splices edits back onto the tip,<br>never forcing, and a same-file race is a conflict. The branch's NAME is<br>the declaring directory's `storage` (or `source`) — a branch no<br>declaration names is refused rather than guessed. A `commit`-keyed branch is read<br>per commit through its own store (`qa-store`), not mounted. |
| **Refuse: no flow for this source kind**<br>`Task_RefuseUnknownKind` | Build pipeline | [`directory-conventions`](../reference/skill-instructions/directory-conventions.html) | A kind added to the union (a graph database, say) before this diagram<br>and the mount tool learn it. Refused with its own exit code — reading it<br>as a directory would scan an empty path and report it clean, the `dh4f`<br>defect. |

## Decisions

Every one of the 1 decision(s) is documented.

| decision | what decides it | branches |
|---|---|---|
| **Which source kind?**<br>`GW_SourceKind` | The resolved source's `kind`: `directory`, `branch`, or a kind this diagram has no flow for. | **directory** → Use the checkout path in place<br>**branch** → Mount the branch tip at the declared path<br>**any other kind** → Refuse: no flow for this source kind |

{% endraw %}
