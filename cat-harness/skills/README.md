<!-- kg:subgraph:begin -->
# skills

The knowledge graph. Skill packages, and the four other node kinds that point at them: `roles/roles.json` (a role IS a BPMN swimlane, and carries the skills its lane's activities need), `workflows/*.bpmn` + `workflows/decisions/*.dmn` (the processes those roles act in, reached through the skill that describes them), `requirements/*.json` (conformance obligations whose `satisfiedBy` names the skill or capability discharging them), `permissions/permissions.json` (what an actor may DO in any lane, as opposed to what its lane's role knows), Its audit verdicts are NOT here: they moved to the `qa` tree on 2026-09-19, because a verdict is a QA reviewer's output and placement follows provenance. Its id is `skills`, so its qualified name is `cat-harness.skills`; it was `cat-harness` until 2026-09-23 (bean iwtn), and `resolveDirectories` still reads that id as this one. Ids are stable across a relocation, paths are not. The `skills` graph does NOT owe a visualiser: `owesVisualiser` is `!renderable && holds !== "content"`, and `skills` is `content` — *"a graph that stands on its own does not need a viewer to be legible"*. So no gate was failing. What WAS wrong is that the viewer already existed and nothing declared it: `docs-auto` renders one sub-page per skills directory, and `graph-tiles.undeclaredProjections` lists exactly a directory with a published page and no declared visualisation — so all seven read as "no published viewer" in the navbar tiles while being rendered the whole time. `tools` is the same `content` kind and has declared one all along, which is the precedent: declaring a visualiser for a content kind is a courtesy the corpus already extends, not an obligation this invents.

Part of [C@T Harness](../README.md), declared as `skills`, holding `skills`.

| file | what it is | used by |
|---|---|---|
| [`authoring-math/`](authoring-math/) | 5 files | |
| [`authoring-who-smart-guidelines/`](authoring-who-smart-guidelines/) | 15 files | |
| [`content-lifecycle/`](content-lifecycle/) | 11 files | |
| [`crdm/`](crdm/) | 7 files | |
| [`folio-core/`](folio-core/) | 168 files | |
| [`folio-document-adapter/`](folio-document-adapter/) | 6 files | |
| [`folio-paper-adapter/`](folio-paper-adapter/) | 66 files | |
| [`framework/`](framework/) | 1 file | |
| [`graph-management/`](graph-management/) | 7 files | |
| [`hypothesis-generation/`](hypothesis-generation/) | 30 files | |
| [`kg-navigation/`](kg-navigation/) | 2 files | |
| [`permissions/`](permissions/) | 1 file | |
| [`raci/`](raci/) | 2 files | |
| [`remote-packages/`](remote-packages/) | 2 files | |
| [`requirements/`](requirements/) | 7 files | |
| [`scientific-critical-thinking/`](scientific-critical-thinking/) | 11 files | |
| [`scientific-visualization/`](scientific-visualization/) | 21 files | |
| [`security/`](security/) | 4 files | |
| [`spec-kit/`](spec-kit/) | 2 files | |
| [`theming/`](theming/) | 9 files | |
| [`workflow/`](workflow/) | 14 files | |
<!-- kg:subgraph:end -->
