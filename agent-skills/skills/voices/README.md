<!-- kg:subgraph:begin -->
# voices

`folio-voice/v1` profiles read out of `library/` above — a shared base plus one override per vendor, on the owner's ruling of 2026-09-20: 'for model specific sources, make those model specific voices.' Citations are INTERNAL to this instance (no `instance:` key), unlike who-style-guide's, because here the corpus and the reading live together. The rules are deliberately NOT formally constrained: owner, same day, 'preference leave unstructured schema, agentic review b/c of best practice drift, not formal' — published best practice is revised without notice, so a schema gate would pin whichever vintage was current when it was written and then report clean over the drift. PATH REALIGNED 2026-09-21 (bean `26tu`): it named the pre-migration `voices/` while `who-style-guide` and `folio-assistant-sci` moved to `skills/voices/`, because a voice IS a skill (bean `btuv`). The directory is STILL ABSENT either way — this instance declares the graph ahead of shipping it, which the entry above says is deliberate — so realigning the path does not close `26tu`; it only means that when the voices arrive they land where every consumer already looks. Whether to ship them or drop the declaration until then is this instance's call, and deleting another instance's roadmap is not a migration decision. VENDOR OVERRIDES live in the reserved `vendors/` sub-sub-graph inside this same directory — `skills/voices/vendors/<id>/voice.json` — on the owner's ruling of 2026-09-22: 'vendor overides go in sub-sub-grahiphs like voice/vendors or voices-vendors'. The nested spelling was taken because the flat one needs a SECOND declared graph for one concept, and a declaration inside a declaration is the defect #263 names. The directory is where a person looks; a vendor voice still declares what it overrides in its own `extends` field, so nothing infers the relation from a path.

Part of [agent-skills](../../README.md) 0.1.0, declared as `voices`, holding `voices`.

| file | what it is | used by |
|---|---|---|
| [`agent-skill-authoring/`](agent-skill-authoring/) | 1 file | |
<!-- kg:subgraph:end -->
