<!-- kg:subgraph:begin -->
# README templates

The Liquid templates `subgraph-readmes` renders into each declared directory's README. They may `{% include %}` one another, Jekyll style, and read every value from the Knowledge Graph: the directory's declared title, description and kinds, and each file as it describes itself.

Part of [C@T Harness](../../../README.md), declared as `readme-templates`, holding `code`.

| file | what it is | used by |
|---|---|---|
| [`files.liquid`](files.liquid) | The file table: files directly in the directory, then its subdirectories. |  |
| [`subgraph.liquid`](subgraph.liquid) | One declared directory's README. |  |
<!-- kg:subgraph:end -->
