# AGENTS.md — smart-trust-phw

What binds everywhere is the harness's
[`AGENTS.md`](https://github.com/litlfred/cat-harness/blob/HEAD/AGENTS.md); what
this repository *is* is [`README.md`](README.md).

## What this instance is

The Personal Health Wallet (PHW) implementation guide: FHIR IG source under
`input/`, built by the IG Publisher. It has no harness of its own:
`index.config.json` mounts `smart-base` and the layers below it, and
`smart-trust-phw.json` declares what an index may mount from here.

## Privacy Consent on FHIR (IHE PCF 1.1.0) and Verifiable Health Links (IHE VHL)

Before authoring, translating, or evaluating privacy consent directives or
consent-bearing health links in this repository, read fhir-harness's
[`pcf-consent`](https://github.com/litlfred/fhir-harness/blob/main/skills/content/fhir-ig-authoring/pcf-consent.md)
skill:

- **Model (`pcf-consent` §1):** IHE PCF 1.1.0 (Trial Implementation) and HL7
  FHIR R4 `Consent` (Trial Use). Pin `ihe.iti.pcf: 1.1.0` and
  `ihe.iti.vhl: 1.0.0-comment` in `sushi-config.yaml` and reference IHE
  profiles (`IHE.PCF.consentBasic`, `IHE.PCF.consentIntermediate`,
  `IHE.PCF.consentAdvanced`) and value sets (`BasicPurposeVS`,
  `AdvancedSecurityTagVS`) **by canonical URL only** — never re-declare them
  locally. Implement Basic consent and Additional `PurposeOfUse` first, make
  **no IUA claim**, and keep every process and profile **trust-anchor neutral**
  (GDHCN is one possible trust anchor among others).
- **Translate (`pcf-consent` §2):** `consentToOdrl()` in
  `fhir-harness/schemas/pcf-consent.ts` translates PCF `Consent` resources and
  the four IHE PCF Volume 1 §1:53.2.1 implicit-policy `Set`s
  (`Policy-basic-normal`, `Policy-all-normal`, `Policy-break-glass-only`,
  `Policy-deny`) into W3C ODRL 2.2 `Set` policies using HL7 v3 `ActReason`
  `PurposeOfUse` (`odrl:purpose` `odrl:isA`) and `odrl:dateTime` period
  constraints.
- **Decide (`pcf-consent` §3):** `decide()` / `permits()` evaluates access
  requests to `"permit" | "deny" | "unknown"` (never silent `"permit"` on a
  missing, expired, or unreachable `Consent`), reads IHE ITI-108 Consent
  Registries (`fhir-harness/schemas/iti-108-consent-client.ts`), honours
  `odrl:obtainConsent` duties, and cites `Consent.id` +
  `Consent.meta.versionId` in hash-chained PROV-O decision records.

## The one rule

**Generated directories are built at publish from the IG's AST, never authored.**
fhir-harness's `ig-index:build` writes `fhir-artifact-index/`'s `index.json`,
`menu.json`, `releases.json` and `package.tgz`; `smart-base:document-kinds`
writes `document-kinds/`'s DAK coverage report from that index. Never commit,
hand-edit or re-ingest them. `fhir-artifact-index/` is declared `readOnly`;
`check:materialized-fixity` and the writers' `--check` catch a hand edit.
`library/` snapshots of external specifications (IHE PCF 1.1.0, IHE VHL
1.0.0-comment) carry SHA-256 fixity, checked against `catalogue/`.

## What an index mounts from here

The folio-assistant index mounts four directories, plus this file and the
README as declared assets. The IG source (`input/`) is not mounted.

| directory | what it holds | committed |
|---|---|---|
| `library/` | IHE PCF and IHE VHL snapshots | yes |
| `catalogue/` | records for `library/` and every work the IG cites | yes |
| `fhir-artifact-index/` | the artefact index | `ig-identity.json` only |
| `document-kinds/` | the DAK coverage report | no |

Also declared, but not mounted by the index:

| directory | what it holds | committed |
|---|---|---|
| `fhir-ast/` | the IG Publisher AST, restored from its cache branch by `ig-cache.sh` | no |
| `docs/` | the artefact pages, built at publish by `smart-trust-phw:pages` (fhir-harness's `gen-ig-pages.ts`) | no |
| `input/business-processes/` | the BPMN processes PHW.A to PHW.K | yes |
| `scenarios/` | roles and example people and systems (every person fictional) | yes |
| `tools/` | this instance's generators, each with a `--check`, and the publish script | yes |

`findings/` holds authored review material, such as proposals; never put
authored files in `docs/`, which is built at publish and gitignored.

## Rules

- **Only litlfred repositories are changed from here.** WHO repositories are
  read-only.
- **Every person is fictional.** Personas, patients and example people are
  invented.
- **Every dependency is pinned; add no packages.** Layers by commit in
  `index.lock.json`, npm and Bun by `bun.lock`, GitHub Actions by commit SHA.
  Re-pin only with the owner's consent recorded in `index.config.json`.
- **Generated files are never edited.** The BPMN drawings in
  `input/images/PHW.*.svg` are drawn from `input/business-processes/*.bpmn` by
  `bun tools/render-bpmn/render_bpmn.ts`, and `personas.md` from `scenarios/`
  by `bun tools/personas/gen_personas.ts`; CI runs each `--check`.
- **No text in pictures.** Titles, captions and labels are text (page
  Markdown, BPMN names, PlantUML source, `alt`), so they can be translated.
- **gh-pages is published by an agent, not a workflow.** `main` publishes to
  the root; any other branch to its preview folder.
- No model identifiers in commits, PRs or code.

## Cold start

The layers are mounted from `index.lock.json` (the mounts are gitignored; the
lock is committed). In a fresh container:

```sh
python3 -c "import json;[print(m['harness'],m['repository'],m['ref']) for m in json.load(open('index.lock.json'))['mounts']]" > /tmp/mounts.txt
while read h r ref; do git clone -q --filter=blob:none --no-checkout https://github.com/$r $h && git -C $h checkout -q $ref && rm -rf $h/.git; done < /tmp/mounts.txt
bun install --frozen-lockfile --ignore-scripts
rm -rf smart-base && bun cat-harness-tools/scripts/run-script.ts mount:lock   # lays smart-base out from its subdirectory
bun cat-harness-tools/scripts/run-script.ts mount:remote:check
```

Re-draw the BPMN processes with `bun tools/render-bpmn/render_bpmn.ts`
(Chromium: set `PLAYWRIGHT_BROWSERS_PATH` where one is installed). Publish
gh-pages with `bash tools/publish/publish.sh` (`--plan` to look first). It makes
sure `gh-pages` exists on origin (a first publish fails without it), re-lays
the mounts fresh (a build writes into them), removes build leftovers under
`input/` (they make the cached AST stale), then runs `stage-local.ts`. The site is built from the IG's AST on its cache branch,
which `ig-ast-refresh.yml` refreshes on a push to `main`, so a preview shows
`input/` as it was at `main`'s last refresh.

## Translations

The harness's generic process is [`translation-refresh`](https://github.com/litlfred/cat-harness/blob/HEAD/skills/library/library-core/translation-refresh.md) and `translation-manager` §"Translating into several locales as a team"; this section names what that skill leaves to the instance. Locales: ar, es, fr, ru, zh, all unofficial (agent, no human sign-off). Each locale is its own PR to main.

| step | here |
|---|---|
| templates | smart-base's `input/scripts/extract_translations.py` at the smart-base commit `index.lock.json` pins (`translation-templates` in `generated-checks.yml` re-extracts and fails on a stale template): pages `input/pagecontent/*.md` → `input/pagecontent/translations/*.pot`; BPMN drawing labels `input/images/*.svg` → `input/images/translations/images.pot`; PlantUML `input/images-source/*.plantuml` → `input/images-source/translations/diagrams.pot` |
| new and obsolete strings | none yet here: no locale catalogues exist, so there is no `po-status` step; when the first locale lands, merge with `msgmerge` (new msgids appended empty, obsolete kept as `#~`) |
| FHIR terms | one CodeSystem supplement per locale, `input/fsh/translations/<locale>.fsh`; never edit a resource's own text |

`generated-checks.yml` runs the template check. There is no officiality check or status report here yet. Merge policy: **merge-when-green** (owner, 2026-11-07). A refresh run merges its own refresh PR only when every check is green and the untainted round trip on the changed strings records no fail; anything red, uncertain or failing is left open and reported to the owner. Merging is not sign-off: the translations stay unofficial.

To regenerate the templates:

```sh
git clone -q --filter=blob:none --no-checkout https://github.com/litlfred/smart-base /tmp/sb
git -C /tmp/sb sparse-checkout set input/scripts && git -C /tmp/sb checkout -q <smart-base ref from index.lock.json>
python3 -I /tmp/sb/input/scripts/extract_translations.py --ig-root . --canonical http://smart.who.int/trust-phw
```

## Builds

`harness-pr-checks.yml` (the harness's checks, index mode) and
`generated-checks.yml` (BPMN drawings, personas page, translation templates) run on every pull request;
`ig-ast-refresh.yml` runs on a push to `main`. The WHO IG builds inherited
from upstream (`fhirbuild.yml`, `release.yml`) run only by hand.

## Before running SUSHI

Read fhir-harness's
[`fhir-validation`](https://github.com/litlfred/fhir-harness/blob/main/skills/content/fhir-ig-authoring/fhir-validation.md#when-a-package-host-refuses-you)
§"When a package host refuses you" first. Where `packages.fhir.org` is refused,
`fhir-cache-seed-npm` fills the package cache from npm and
`fhir-package-mirror` at exact versions only. Never report "SUSHI cannot run
here" before running the seeder, and never stand in another version for a pin.
This IG is FHIR R4 4.0.1, as smart-base, IHE PCF 1.1.0 and IHE VHL are. R5
resources are pre-adopted: Requirements and ActorDefinition directly (with
`hl7.fhir.uv.extensions.r4`), and Permission as a `Basic` with the R5
cross-version extensions of `hl7.fhir.uv.xver-r5.r4`. Where
`packages.fhir.org` is refused, `fhir-cache-seed-npm --mirror` with
litlfred/fhir-package-mirror holds every package this IG needs; serve the
mirror as a local registry (`FPL_REGISTRY`) for SUSHI's automatic
`hl7.fhir.uv.tools.r4#latest`.
