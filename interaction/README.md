<!-- kg:subgraph:begin -->
# interaction

How a PERSON wants to be asked — committed, read at session start by every agent. `context` by the same test as agent memory: read during a process, never written by one, changed when a person states a preference. It sat in `.harness/`, undeclared, until 2026-09-20, which this repository's own dot-prefix guard forbids: a dot-prefixed directory is absent from a plain `ls`, from most file browsers and from a forge's web tree, and the file read at the start of every session was in the one place the conventions reject. The path is also `harness.config.json`'s `interaction` key, which defaults here — the declaration and the config now name the same place instead of one of them being a literal nobody checks. SCOPE IS `repository`, and omitting it was a live defect for an hour on 2026-09-20: without it the path resolves against the INSTANCE, so a consumer looked in `cat-harness/` while the content sat at the repository root — and `harness:dirs` then created the empty instance-level directory to satisfy the declaration, turning declared-but-absent into declared-and-empty, which is the `dh4f` false pass wearing a tidier face. Repository, not instance, for the same reason `beans/` and `todos/` are: these are read by every agent working in this repository, not by this instance's code.

Part of [C@T Harness](../cat-harness/README.md), declared as `interaction`, holding `interaction`.

| file | what it is | used by |
|---|---|---|
| [`interaction.json`](interaction.json) | Interaction preferences, read at session start by every agent working in this repository. |  |
<!-- kg:subgraph:end -->
