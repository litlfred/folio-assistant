<!-- kg:subgraph:begin -->
# translation-sources

The gettext side of translation — one directory per target locale holding `.pot` templates, `.po` catalogues and the `TranslationNode` `.ts` manifests that make each pair addressable in the graph. The INPUT to injection. There is deliberately NO matching declaration for the rendered OUTPUT: a translated page is the same kind of thing as the page it translates — renderable content, differing by a field — and it declares its own `lang` and `translation_source` in front matter, so the locale subtrees under `docs/` are DISCOVERED from the files rather than enumerated here. A first draft of PR #351 enumerated them, ten entries for five locales across two subtrees, and that restated what all ten files already said. Undeclared until 2026-09-19: the `dh4f` defect in reverse, five committed directories that no declaration mentioned.

Part of [C@T Harness](../README.md), declared as `translation-sources`, holding `translation-sources`.

| file | what it is | used by |
|---|---|---|
| [`ar/`](ar/) | 103 files | |
| [`es/`](es/) | 105 files | |
| [`fr/`](fr/) | 113 files | |
| [`ru/`](ru/) | 106 files | |
| [`zh/`](zh/) | 102 files | |
<!-- kg:subgraph:end -->
