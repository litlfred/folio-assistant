<!-- kg:subgraph:begin -->
# voices

Three `folio-voice-skill/v1` voice skills, one per WHO publication in the who-iris library, each a directory holding `voice.json` (the RULES, every one carrying the quote it was read from and a citation naming `{ instance: 'who-iris', libraryId, sectionId }`) and `SKILL.md` (how to USE them in authoring, review and QA). Under `skills/` because a voice IS a skill: it tells an actor what to do, it is bound to processes by name, and keeping its instructions anywhere else is what let the PLATFORM carry these rules as uncited prose (bean `btuv`). The instance is declared once per voice in `sources[]` and INHERITED by its rules rather than repeated on each. `bun run check:voices` resolves every citation through the target instance's own declaration.

Part of [who-style-guide](../../README.md) 0.1.0, declared as `voices`, holding `voices`.

| file | what it is | used by |
|---|---|---|
| [`who-editorial/`](who-editorial/) | 2 files | |
| [`who-guideline-development/`](who-guideline-development/) | 2 files | |
| [`who-publication-design/`](who-publication-design/) | 2 files | |
<!-- kg:subgraph:end -->
