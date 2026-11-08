---
doc_id: hmans-2026-beans-readme
doc_title: "beans"
section_id: s003-stability-warning
section_title: "Stability Warning ⚠️"
file: "README.md"
lines: 19-28
source_sha256: 85b9eb0aaedd41bb
granularity: heading
---
## Stability Warning ⚠️

Beans is still under heavy development, and its features and APIs may still change significantly. If you decide to use it now, please follow the release notes closely.

Since Beans emits its own prompt instructions for your coding agent, most changes will "just work"; but sometimes, we modify the schema of the underlying data files, which may require some manual migration steps. If you get caught by one of these changes, your agent will often be able to migrate your data for you:

```
The Beans data format has changed. Please migrate this project's beans to the new format.
```
