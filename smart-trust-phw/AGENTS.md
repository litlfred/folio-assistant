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

Six directories, plus this file and the README. The IG source (`input/`) is
not mounted.

| directory | what it holds | committed |
|---|---|---|
| `fhir-ast/` | the IG Publisher AST, restored from its cache branch by `ig-cache.sh` | no |
| `fhir-artifact-index/` | the artefact index | `ig-identity.json` only |
| `document-kinds/` | the DAK coverage report | no |
| `docs/` | the artefact pages, built by `smart-trust-phw:pages` (fhir-harness's `gen-ig-pages.ts`) | no |
| `library/` | IHE PCF and IHE VHL snapshots | yes |
| `catalogue/` | records for `library/` and every work the IG cites | yes |

## Before running SUSHI

Read fhir-harness's
[`fhir-validation`](https://github.com/litlfred/fhir-harness/blob/main/skills/content/fhir-ig-authoring/fhir-validation.md#when-a-package-host-refuses-you)
§"When a package host refuses you" first. Where `packages.fhir.org` is refused,
`fhir-cache-seed-npm` fills the package cache from npm and
`fhir-package-mirror` at exact versions only. Never report "SUSHI cannot run
here" before running the seeder, and never stand in another version for a pin.
This IG is R5: when its build against `ihe.iti.pcf@1.1.0` hits an R4-in-R5
cross-version resolver error, report it as `could-not-determine` with its exact
diagnostic.
