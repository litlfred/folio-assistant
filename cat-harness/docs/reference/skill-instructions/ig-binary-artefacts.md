---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'ig-binary-artefacts'
parent: Skill instructions
---

{: .note }
> Generated from [`fhir-harness/skills/fhir-ig-base/ig-binary-artefacts.md`](https://github.com/litlfred/folio-assistant/blob/main/fhir-harness/skills/fhir-ig-base/ig-binary-artefacts.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/fhir-harness/skills/fhir-ig-base/ig-binary-artefacts.md){: .fa-edit-source data-fa-link="edit" data-src="fhir-harness/skills/fhir-ig-base/ig-binary-artefacts.md" data-repo="litlfred/folio-assistant" }

{% raw %}
# ig-binary-artefacts

> Skill id: `ig-binary-artefacts` · Package: `fhir-ig-base` · Instance:
> `fhir-harness` · Tool `ig-binary-audit` · Bean `b8ip`

Owner, 2026-10-02: *"see what happens on smart-base with binary artefacts on
release. add to skills/tools"*.

## What the Publisher writes

Besides its pages, an IG Publisher run writes about twenty binary files into
`output/`. `PUBLISHER_BINARIES` in `fhir-harness/scripts/ig-binary-audit.ts`
is the list, not this paragraph. They fall into three groups:

- **The package.** `package.tgz` (with `package.r4.tgz`, `package.r4b.tgz`
  and sometimes `package-combined.tgz`) is what a FHIR tool installs. It is
  the one binary a consumer cannot do without.
- **Derived bundles.** `full-ig.zip` (the whole site), `package.db`,
  `validator.pack` and `validator-<id>.pack`, `ai.zip`, and the
  `definitions`, `examples` and `expansions` zips in JSON, XML and Turtle.
  Each is recomputable from the package or the build.
- **Spreadsheets.** `csvs.zip`, `excels.zip`, `schematrons.zip`, and
  `spreadsheets.zip` where a script bundles the loose `.xlsx` files.

## Why a pages branch is the wrong place

A pages deploy copies `output/` as it is. Each **branch preview** is another
full copy, and git keeps every byte for good. Measured with
`ig-binary-audit` on `litlfred/smart-base` `gh-pages` (`64ed896d`,
2026-10-02):

| | bytes | files |
|---|---|---|
| the whole branch | 5,029.7 MB | 64,091 |
| Publisher binaries | 966.5 MB | 399 |
| of those, in 29 branch previews | 907.1 MB | 380 |
| `full-ig.zip` alone | 644.7 MB | 30 copies |

GitHub Pages publishes at most 1 GB, and **94 % of the binary bytes are
preview copies** that nobody downloads twice. Deleting files over 100 MB
before deploy, which is what the WHO workflow does, removes none of these,
because each copy is under the limit.

## Where each one goes

Owner ruling, 2026-10-02: *"previews dont get binary, only releaes. KG should
point to release binaries so people can materialze if they want. also so can
list on ig justthedocs pages somewhere"*.

1. **A preview carries no binaries.** A reviewer reads pages, and binaries
   are published only on releases.
2. **A release carries the package and whatever the IG promises to
   distribute.** Upload them as release assets, and link the release from
   the downloads page. The link names the repository it is built in, never a
   hard-coded upstream.
3. **The knowledge graph points at release assets and does not hold them.**
   `fhir-artifact-index/releases.json` (`ig-releases/v1`) records each asset's
   name, size, digest and download URL. Anyone who wants the bytes fetches
   them from there. `ingest-ig-releases` (Tool of the same name) writes it
   from GitHub's release list.
4. **The IG's just-the-docs site lists them** on a generated `releases`
   page (`templates/ig-site/releases.liquid`): file, size and SHA-256 per
   release, each linking to the asset.
5. **The published IG's root may keep `package.tgz`**, since FHIR tooling
   fetches `<canonical>/package.tgz`. Nothing else needs to be there.
6. **What this pipeline renders from the package reads it from the served
   knowledge graph**, never from a pages branch. The resource JSON views
   fetch the `package.tgz` that `ingest-ig-artifacts --materialize-package`
   holds in `fhir-artifact-index/` (bean `680p`).

## Measure before deciding

```sh
git fetch --depth 1 origin +refs/heads/gh-pages:refs/remotes/origin/gh-pages
bun run fhir-harness/scripts/ig-binary-audit.ts --repo <checkout> [--ref origin/gh-pages] [--json]
```

It reads the git tree, not a checkout, so a multi-gigabyte branch costs a
depth-1 fetch and no disk. `--previews <prefix>` changes where previews live
(default `branches/`).

## Do not

- **Promise a download the release does not carry.** A downloads page that
  lists assets no release has is a reader sent to a 404. Check the list
  against the release's actual assets, not against the script that was
  meant to upload them.
- **Treat "under 100 MB" as fine.** The limit that matters is the branch,
  and the copies add up.
- **Delete binaries from a published pages branch on your own initiative.**
  Report the measurement and wait to be told
  ([`deletion-requires-confirmation`](deletion-requires-confirmation.md)).
{% endraw %}
