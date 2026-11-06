# AGENTS.md — smart-trust

This file is agent-generic: Claude Code, Gemini CLI, Cursor, Copilot and others
read it natively. What binds everywhere is the harness's
[`AGENTS.md`](https://github.com/litlfred/cat-harness/blob/HEAD/AGENTS.md); what
this repository *is* is [`README.md`](README.md).

## What this instance is

The WHO SMART Trust implementation guide: FHIR IG source under `input/`, built
by the IG Publisher. It has no harness of its own: `index.config.json` mounts
`smart-base` and the layers below it, and `smart-trust.json` declares what an
index may mount from here.

## The one rule

**The two mounted graphs are generated copies of upstream, never authored.**
`fhir-artifact-index/` is not committed: fhir-harness's `ig-index:build`
writes its `index.json`, `menu.json`, `releases.json`, `package.tgz` and
`sidecars/` at publish from the IG's AST. `openapi/` is written by
`ingest-openapi.ts` and `gen-openapi-pages.ts` from the sources
`openapi/cat-openapi.config.json` names. Never commit, hand-edit or re-ingest
either; both are declared `readOnly`. To change what is there, change the
upstream source or the writer, then re-run the writer.
`check:materialized-fixity` and the writers' `--check` catch a hand edit.

## What an index mounts from here

folio-assistant mounts the directories `smart-trust.json` declares as
`fhir-artifact-index/`, `openapi/`, `document-kinds/`, `library/`,
`catalogue/`, `glossary/` and `translations/`, plus this file and the README
as assets. `document-kinds/` holds this IG's DAK coverage report, generated at
publish from `fhir-artifact-index/` by `smart-base:document-kinds`. The IG
source (`input/`) is not mounted. `docs/` is built at publish by
`smart-trust:pages` (fhir-harness's `gen-ig-pages.ts`) and never committed.
`fhir-ast/` is restored from its cache branch by `ig-cache.sh`.

## Before running SUSHI

Read fhir-harness's [`fhir-validation`](https://github.com/litlfred/fhir-harness/blob/main/skills/content/fhir-ig-authoring/fhir-validation.md#when-a-package-host-refuses-you)
§"When a package host refuses you" first. Where packages.fhir.org is refused,
`fhir-cache-seed-npm` fills the package cache from npm and
fhir-package-mirror at exact versions only. Never report "SUSHI cannot run
here" before running the seeder, and never substitute another version for a
pinned one; its `--missing-out` list is what the mirror still needs.
