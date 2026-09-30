<!-- kg:subgraph:begin -->
# folio-assistant-sci-lean-skills

The SCIENCE layer's Lean tooling skills: `lean-formal-edges`, which runs the elaborated formal-edge extractor (folio-assistant#1492). Under the science layer, not core, per the owner's cut 'f-a-core has high level processes only, no tooling'. A subdirectory of `folio-assistant-sci/skills/` rather than that directory itself, because `skills/voices/` is already declared as the `voices` kind, and one directory declared under two kinds would be scanned twice. Repository-scoped, like `folio-assistant-core-skills`, so the consumers that resolve a skill ref from this root can see it.

Part of [C@T Harness](../../../cat-harness/README.md) 0.1.0, declared as `folio-assistant-sci-lean-skills`, holding `skills`.

| file | what it is | used by |
|---|---|---|
| [`lean-formal-edges.md`](lean-formal-edges.md) | Extract ELABORATED formal dependencies between a folio's lean.ref declarations — the trustworthy replacement for the lexical `--scan` cache. |  |
<!-- kg:subgraph:end -->
