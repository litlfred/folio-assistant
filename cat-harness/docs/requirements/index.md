---
title: "Requirements"
kind: requirements
summary: >-
  What the harness promises, one page per shipped feature. Each page is a filed proposal whose front matter is a Requirement.
---

# Requirements

What this harness **promises**, one page per shipped feature.

A feature starts as a **proposal** in [Proposals]({{ '/proposals/' | relative_url }}), where the initial analysis, the MVP and the options are argued. When the feature ships, its proposal is **moved** here and filed. Its front matter becomes a `Requirement`, and its body keeps the reasoning. The move uses `git mv`, so `git log --follow` walks a requirement back through the argument that produced it.

## What a page here must carry

The front matter is checked by `bun run check:requirements` against the bootstrap schema, `bootstrap/schemas/requirement.schema.json`:

- `id`: `req:<slug>`, and the slug is the file name. No two documents in either sub-graph share a slug, so a filed proposal can never land on an existing requirement.
- `title`, `description` and `actors`: the roles it is about, by id.
- `status`: `in-force` once filed. `superseded` requires `supersededBy`.
- `proposedIn`: the proposal's path before the move.
- `statements`: each with a `key`, a `label`, a `conformance` level (`SHALL`, `SHOULD`, `MAY` or `SHALL NOT`) and the `requirement` sentence. A `functional` statement may add `activity`, `capability` ("I want") and `benefit` ("so that"). A `non-functional` one may add a `category`.

A test run names the statements it checks, in its `requirements` array (`folio-test-run/v1`), as `req:<slug>#<key>`.

## How filing is organised

This is still open. The owner asked for a process and methodologies for organising requirements as they are filed, and the literature search is a bean of its own. So is the assessment of open requirements standards. Until those land, one page per shipped feature is the rule. The schema is the only structure beyond that.
