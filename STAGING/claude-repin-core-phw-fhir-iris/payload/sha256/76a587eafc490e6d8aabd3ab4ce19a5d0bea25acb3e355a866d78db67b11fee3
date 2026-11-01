---
# folio-assistant-negd
$schema: bean/1.0.0
title: 'COMPUTABLE DSAs: public agreement + ODRL, referenced by hash; GDHCN trust; one PDP (#2702, option D)'
status: completed
type: epic
priority: normal
created_at: 2026-10-30T14:05:00Z
updated_at: 2026-11-01T07:40:00Z
---

Workplan: `/mnt/project-files/dsa-analysis/missing-building-blocks-workplan.md` (analysis: `computable-dsa-analysis.md`, same folder). Issue: litlfred/folio-assistant#2702. Owner chose Option D on 2026-10-30 13:58Z.

Blocks B1–B14, milestones M1 (in-instance, B1–B4), M2 (server-to-server, B5–B7, B9), M3 (QR + agents, B8, B10, B12), M4 (wallets, B11, B13), plus the IHE PCF 1.1.0 / VHL 1.0.0-comment and FHIR R5 `Permission` tracks.

## Progress Rollup (2026-10-31)

17 of the 18 child beans under `folio-assistant-negd` are **`completed`**, and 1 (`folio-assistant-q7dh`) is **`in-progress`** with 3 green, mergeable PRs awaiting review, alongside 3 related open PRs in `litlfred/smart-trust` and `litlfred/smart-trust-phw`.

### Child Beans (17 `completed`, 1 `in-progress`)

| Bean | Status | Block / Track | Summary & Landed / Open PRs |
|---|---|---|---|
| `s4v2` | `completed` | DSA B1+B2 | ODRL duties (`delete`, `attribute`, `inform`, `obtainConsent`), required `assignee`, HL7 v3 `ActReason` `PurposeOfUse`, `dateTime`/`elapsedTime` constraints — merged in [cat-harness#742](https://github.com/litlfred/cat-harness/pull/742) (`4f6a265`). |
| `2z1t` | `completed` | DSA B3 | `dsa` document kind (`odrl:Agreement`, `dcat:Resource`/`dcat:Distribution`, `spdx:checksum`, `dcterms:source`), `check:dsa-hash`, worked examples (`v1`, `v2`), and 4 lifecycle skills (`dsa-checksum`, `dsa-odrl-source`, `dsa-dcat-record`, `dsa-catalogue-status`) — merged in [folio-assistant-core#249](https://github.com/litlfred/folio-assistant-core/pull/249). |
| `q7dh` | `in-progress` | DSA B3 follow-up | Validate `check:dsa-hash` against SHA-256-pinned official ODRL 2.2 / DCAT 3 / SPDX 2.2.2 / DCMI contexts, declare `check-dsa-hash` Tool, and record `agent-skill-authoring` voice reviews for the 4 `dsa-*` skills — open, green, `MERGEABLE` PRs: [folio-assistant-core#303](https://github.com/litlfred/folio-assistant-core/pull/303) (`63f8f6e`), [cat-harness#818](https://github.com/litlfred/cat-harness/pull/818) (`ba8872f2`), [cat-harness-tools#1034](https://github.com/litlfred/cat-harness-tools/pull/1034) (`8d7d2cd`). |
| `3z44` | `completed` | DSA B4 | PROV decision records cite agreement + grant; hash-chained log (`verifyProvHashChain`) — merged in [cat-harness-tools#975](https://github.com/litlfred/cat-harness-tools/pull/975) (`876295d`) and [cat-harness-tools#919](https://github.com/litlfred/cat-harness-tools/pull/919) (`f05c874`). |
| `yy40` | `completed` | DSA B4 follow-up | Replace invented agreement/grant fields with standard terms (`prov:used` → `dcat:Distribution` + `spdx:checksum`, and `cred:VerifiableCredential` id) and document `previousHash`/`recordHash` as local extensions — merged in [cat-harness-tools#984](https://github.com/litlfred/cat-harness-tools/pull/984) (`818f35e7`) and [cat-harness-tools#1023](https://github.com/litlfred/cat-harness-tools/pull/1023). |
| `nr5p` | `completed` | PCF1 | Declare `smart-trust-phw` as a harness instance and mount it — merged in [smart-trust-phw#4](https://github.com/litlfred/smart-trust-phw/pull/4) (`20682ab`) and [folio-assistant#2761](https://github.com/litlfred/folio-assistant/pull/2761) (`b5435c4`). |
| `sl5v` | `completed` | PCF2 | Library entries for IHE PCF 1.1.0 and VHL 1.0.0-comment (hashed, Dublin Core, CC BY 4.0) — merged in [smart-trust-phw#5](https://github.com/litlfred/smart-trust-phw/pull/5) (`9165534`) / [smart-trust-phw#6](https://github.com/litlfred/smart-trust-phw/pull/6) (`1ae05a8`). |
| `bjl8` | `completed` | PCF3 | Pin `ihe.iti.pcf` `1.1.0` and `ihe.iti.vhl` `1.0.0-comment` in `smart-trust-phw` `sushi-config.yaml` and reference by canonical URL only — merged in [smart-trust-phw#4](https://github.com/litlfred/smart-trust-phw/pull/4) (`20682ab`). |
| `dy4p` | `completed` | PCF4 | PCF BPMN processes A/B/C in `smart-trust-phw` `input/business-processes`, trust-anchor neutral — merged in [smart-trust-phw#5](https://github.com/litlfred/smart-trust-phw/pull/5) (`9165534`) / [smart-trust-phw#6](https://github.com/litlfred/smart-trust-phw/pull/6) (`1ae05a8`). |
| `jx7m` | `completed` | PCF5 | `consentToOdrl()`: PCF Basic + Additional `PurposeOfUse` to ODRL `Set`s, plus four implicit-policy `Set`s — merged in [fhir-harness#207](https://github.com/litlfred/fhir-harness/pull/207) (`c1614f4`). |
| `a7c1` | `completed` | PCF6 | `odrl:obtainConsent` duty met by a matching active PCF `Consent` — merged in [cat-harness#742](https://github.com/litlfred/cat-harness/pull/742) (`4f6a265`). |
| `r9vk` | `completed` | PCF7 | ITI-108 Consent Registry read client (`findAccessConsents`, `Iti108ConsentClient`) — merged in [fhir-harness#208](https://github.com/litlfred/fhir-harness/pull/208) (`7c06bc8`). |
| `2egb` | `completed` | PCF8 | PROV decision record cites `Consent.id` + `Consent.meta.versionId` — merged in [cat-harness-tools#975](https://github.com/litlfred/cat-harness-tools/pull/975) (`876295d`) and [cat-harness-tools#919](https://github.com/litlfred/cat-harness-tools/pull/919) (`f05c874`). |
| `y0o0` | `completed` | PCF9 | `pcf-consent` skill (model, translate, decide) and `smart-trust-phw` `AGENTS.md` link — merged in [fhir-harness#209](https://github.com/litlfred/fhir-harness/pull/209) (`f51390f`) and [smart-trust-phw#3](https://github.com/litlfred/smart-trust-phw/pull/3) (`6c26fa2`). |
| `6jnx` | `completed` | PCF follow-up | Single Consent evaluator in `fhir-harness`; read `PurposeOfUse` and `Consent` from published packages (`hl7.terminology.r4`, `hl7.fhir.r4.core`, `ihe.iti.pcf`) — merged in [cat-harness-tools#972](https://github.com/litlfred/cat-harness-tools/pull/972) (`ae83f0c`) and [fhir-harness#222](https://github.com/litlfred/fhir-harness/pull/222) (`01b7f8d`). |
| `r7cq` | `completed` | PCF rules 1–4 | Owner consent rules 2 and 4 in the evaluator, ITI-108 client, version-chain narrowing check (`isNarrowingAmendment`), and `smart-trust-phw` processes A and C — merged in [fhir-harness#227](https://github.com/litlfred/fhir-harness/pull/227) (`b347890`), [smart-trust-phw#7](https://github.com/litlfred/smart-trust-phw/pull/7) (`4077fba`), and [fhir-harness#228](https://github.com/litlfred/fhir-harness/pull/228) (`3772521`). |
| `k4sp` | `completed` | PHW SUSHI | Verified SUSHI 0-error build on `smart-trust-phw` `main` and added `ihe.iti.vhl#1.0.0-comment`, `smart.who.int.pcmt-vaxprequal#current`, and `hl7.terminology.r5#7.3.0` to [fhir-package-mirror#5](https://github.com/litlfred/fhir-package-mirror/pull/5) (`87e59e4`). |
| `jfbm` | `completed` | R5 Permission | One-way renderer from ODRL `Agreement` to FHIR R5 `Permission` (output only, reporting dropped terms) and worked FSH example — merged in [fhir-harness#229](https://github.com/litlfred/fhir-harness/pull/229) (`de6a123`) and [smart-trust-phw#10](https://github.com/litlfred/smart-trust-phw/pull/10) (`81ae030`). |

### Additional Landed `smart-trust-phw` Server / VHL Processes

- [smart-trust-phw#8](https://github.com/litlfred/smart-trust-phw/pull/8) (`183e133`): Data sharing agreement server processes D–H (DSA P4, P5, P11, P12, P13).
- [smart-trust-phw#9](https://github.com/litlfred/smart-trust-phw/pull/9) (`be085e3`): Process I: VHL requests decided under an existing data sharing agreement.
- [smart-trust-phw#11](https://github.com/litlfred/smart-trust-phw/pull/11) (`4ca4925`): Processes D and I: approve UDAP via HL7 SSRAA.

### Open PRs Awaiting Review (All Green & `MERGEABLE`)

- **[folio-assistant-core#303](https://github.com/litlfred/folio-assistant-core/pull/303)** (`feat/q7dh-dsa-official-contexts-and-tool`, head `63f8f6e`, `MERGEABLE` / `CLEAN`): Validate DSA terms against SHA-256-pinned official ODRL/DCAT/SPDX/DCMI contexts and declare `check-dsa-hash` Tool (`q7dh`).
- **[cat-harness#818](https://github.com/litlfred/cat-harness/pull/818)** (`feat/q7dh-dsa-skill-voice-attestations`, head `ba8872f2`, `MERGEABLE` / `CLEAN`): Record `agent-skill-authoring` voice reviews for the four `dsa-*` skills (`q7dh`).
- **[cat-harness-tools#1034](https://github.com/litlfred/cat-harness-tools/pull/1034)** (`fix/q7dh-skill-voices-index-checkout`, head `8d7d2cd`, `MERGEABLE` / `CLEAN`): Read active skill voices from `HARNESS_ROOT` in index checkouts (`q7dh`).
- **[smart-trust#100](https://github.com/litlfred/smart-trust/pull/100)** (`claude/dsa-rows-point-to-phw`, head `0515ac3`, `MERGEABLE` / `CLEAN`): DSA processes page points P4, P5, P11–P13 to `smart-trust-phw` processes D–H.
- **[smart-trust-phw#14](https://github.com/litlfred/smart-trust-phw/pull/14)** (`claude/pilgrimage-worked-example`, head `6ed509e`, `MERGEABLE` / `CLEAN`): Worked example applying processes A, B, C, F, and I to IPS Pilgrimage (Hajj) with two FHIR R4 `IHE.PCF.consentIntermediate` Consents and gaps G1–G9.
- **[smart-trust-phw#18](https://github.com/litlfred/smart-trust-phw/pull/18)** (`x80s/batch-phw-ihe-pcf-vhl`, head `3e77ff6`, `MERGEABLE` / `CLEAN`): 22 English draft block summaries for `library/ihe-iti-pcf-1-1-0` and `library/ihe-iti-vhl-1-0-0-comment` (`x80s`).

_2026-11-01T07:40:00Z_ — Closed: All 18 child beans are `completed`. The last one, `q7dh` (DSA hash check against the official contexts, plus the `check-dsa-hash` Tool), was completed on 2026-10-31 at 20:26Z after folio-assistant-core#303, cat-harness#818 and cat-harness-tools#1034 merged. Blocks B1-B14 and the PCF/VHL tracks in the rollup above are all done. Closed by the bean drain tidy-up (sibling S3, https://claude.ai/code/session_01Qmmkt5KrQTMk55GWX1YUtj), on the owner's go-ahead for Q-S3-2.
