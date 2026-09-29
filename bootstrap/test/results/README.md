<!-- kg:subgraph:begin -->
# qa

What auditing THIS instance produced, committed so a consumer can tell "never audited" from "audited clean" — a printed verdict cannot, which is why every QA verdict in this repository is a sidecar. TWO kinds live here and the files declare which they are via $schema: kg-qa/v1, one per audited subject, in a tree mirroring the subject’s own path, and ONE kg-qa-manifest/v1 recording the auditor’s identity for all of them. The manifest moved here from skills/ on 2026-09-27: the auditor writes it unconditionally, so its old home created a skills/ directory holding no skills in every instance that has none. At declaration time that is 15 files across the three families this instance has subjects in — skills/ (7), processes/ (3) and scenarios/ (5). No qa-results/v1 and no witnesses: this instance runs no document build and no witness-producing computation, and declaring kinds it does not hold would be the same over-claim pointed the other way. dependents: reproduce, because a dependent instance audits its OWN graph — these verdicts are about this instance's nodes, and inheriting them would attribute one instance's findings to another. That is exactly the leak which had to be fixed before this directory could be declared at all: an instance-scoped audit run from the layer above wrote 119 tool sidecars and 23 skill findings here for subjects belonging to that layer, because the tool registry and the skill overlay both took no instance root. Declared WITH its files in one commit: a declared-but-absent directory makes a consumer scan nothing and report a clean run over it.

Part of [Bootstrap](../../README.md), declared as `qa`, holding `qa`.

| file | what it is | used by |
|---|---|---|
| [`kg-qa.manifest.json`](kg-qa.manifest.json) | data |  |
| [`kg-qa/`](kg-qa/) | 15 files | |
<!-- kg:subgraph:end -->
