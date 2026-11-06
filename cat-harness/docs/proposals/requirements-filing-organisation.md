---
title: "Requirements filing and organisation: literature search, adopted methodologies, and filing process"
kind: proposal
parent: Proposals
summary: >-
  Literature search over requirements-management practice (organisation, identifiers, traceability, change, retirement), candidate methodologies adopted or rejected with reasons, and the proposed BPMN filing process (processes/sdlc/requirements-filing.bpmn) for bean folio-assistant-qh1s (issue #1164).
---

# Requirements filing and organisation: literature search, adopted methodologies, and filing process

- **Work item**: `folio-assistant-qh1s`
- **Issue**: [#1164](https://github.com/litlfred/folio-assistant/issues/1164)
- **Methodology node**: [`methodologies/requirements-filing-and-organisation.md`](../../methodologies/requirements-filing-and-organisation.md)
- **Proposed BPMN diagram**: [`processes/sdlc/requirements-filing.bpmn`](../../sdlc/processes/requirements-filing.bpmn) ([checklist](../../sdlc/processes/requirements-filing.checklist.md))
- **Status**: Proposed — put to the owner before any automation beyond `check:requirements` is built.

---

## 1. Question and scope

[`docs/requirements/index.md`](../requirements/index.md) currently holds only its index, and [`skills/sdlc/crdm/crdm-requirements-workflow.md`](../../sdlc/skills/crdm/crdm-requirements-workflow.md) explicitly deferred the corpus-level organisation and lifecycle rules to work item `folio-assistant-qh1s`:

> *"Today the directory is empty and a flat list in `index.md` is enough. Once it is not, how requirements are grouped, cross-referenced, superseded and retired needs a method rather than an ad-hoc table — tracked as `folio-assistant-qh1s`, which begins with a literature search over requirements-management practice and proposes the filing process as BPMN before anything is built."*

This proposal summarizes the literature search and methodology adoption recorded in [`methodologies/requirements-filing-and-organisation.md`](../../methodologies/requirements-filing-and-organisation.md), presents the proposed executable BPMN process ([`processes/sdlc/requirements-filing.bpmn`](../../sdlc/processes/requirements-filing.bpmn)), and sets out the three design decisions for the owner before any new code or schema field is added.

---

## 2. Literature search summary: what each source offers

Full source notes and citations are in [`methodologies/requirements-filing-and-organisation.md` §1](../../methodologies/requirements-filing-and-organisation.md#1-literature-search-over-requirements-management-practice).

| Source | What it offers here across the 5 dimensions (organisation, identifiers, traceability, change, retirement) |
|---|---|
| **ISO/IEC/IEEE 29148:2018** (Clauses 5.2.7, 6.4, 6.5) | **Attributes & Bidirectional Traceability**: Defines the core requirement attribute canon (`id`, `status`, rationale, verification criteria) and mandates **bidirectional traceability** (backward to originating proposal/source via `proposedIn` and `derivedFrom`; forward to design, implementation, and verification via `beans`, `skills`, `processes`, and `test/attestations/`) plus formal baseline sign-off (`RequirementSet.stage`). |
| **Volere Specification Template** (Robertson & Robertson, 4th ed.) | **Domain/Concern Grouping & Fit Criteria**: Groups atomic requirements ("Snow Cards") by **functional concern area** rather than implementation file, and pairs every requirement statement with a mandatory measurable **Fit Criterion** (`statements[].successCriteria`). |
| **IREB CPRE** (Pohl & Rupp, 3rd ed.) | **Decoupling IDs from Views & 3-Axis Traceability**: Separates immutable requirement IDs and flat storage paths from **faceted navigation views** so reorganising how requirements are browsed never renumbers IDs or breaks links; formalises backward (`derivedFrom`), horizontal (`dependsOn`), and forward trace axes. |
| **Doorstop** (Browning & Adams, JOSS 2014) | **Git-Native One-File-Per-Requirement & In-Place Retirement**: Stores each requirement as a version-controlled text file with YAML front matter + Markdown body (`docs/requirements/<slug>.md`) so requirement changes travel in the same PR as code and tests, and retires items in place via status flags rather than `git rm`. |
| **Nygard ADRs & MADR 3.0.0** ([`methodologies/madr.md`](../../methodologies/madr.md)) | **Slug Continuity (`git mv`) & Immutable Supersession Chains**: Promotes `docs/proposals/<slug>.md` → `docs/requirements/<slug>.md` via `git mv` (preserving `git log --follow` and recording `proposedIn`), and models scope-changing replacements as `status: superseded` + `supersededBy: req:<new-slug>` without deleting old records. |
| **W3C PROV-O** ([`library/w3c-2013-prov-o`](../../library/kg/w3c-2013-prov-o/README.md)) | **Provenance Graph Semantics**: Grounds `proposedIn` and `derivedFrom` in `prov:wasDerivedFrom`, sign-off attestations in `prov:wasAttributedTo`, and retirement/supersession in `prov:wasInvalidatedBy` / `prov:wasRevisionOf`. |
| **RFC 2119 & RFC 8174** ([`library/rfc2119-key-words-requirement-levels`](../../library/content/rfc2119-key-words-requirement-levels/README.md), [`library/rfc8174-uppercase-vs-lowercase-2119-key-words`](../../library/content/rfc8174-uppercase-vs-lowercase-2119-key-words/README.md)) | **Sub-Statement Normative Addressing**: Grounds `statements[].modality` (`MUST`, `SHOULD`, `MAY`) and statement-level URI addressing (`req:<slug>#<key>`) so individual normative clauses can be attested independently. |
| **IEEE Std 830-1998** (superseded SRS standard) | **Negative Baseline**: Demonstrates why monolithic single-file SRS documents and positional section numbers (`§3.2.1.4`) fail in distributed Git workflows (renumbering cascades and merge conflicts). |

---

## 3. Adopted vs rejected methodologies

Full adoption bindings and partial-adoption boundaries are in [`methodologies/requirements-filing-and-organisation.md` §2](../../methodologies/requirements-filing-and-organisation.md#2-candidate-methodologies-adopted-vs-rejected-with-reasons).

### 3.1 Adopted (4 orthogonal practices)

1. **M1 — Doorstop + MADR git-native file-per-requirement and two-level semantic IDs (`req:<slug>` and `req:<slug>#<key>`)**:
   - One Markdown file per requirement at `docs/requirements/<slug>.md` with `id: req:<slug>` and statement keys `req:<slug>#<key>`.
   - Slug uniqueness enforced across `docs/proposals/` and `docs/requirements/` by `check:requirements`.
   - *Left behind from Doorstop*: sequential integer filenames (`REQ001.yml`) and whitespace SHA-fingerprint clearing.
2. **M2 — Faceted concern-group organisation (`code-lists/concern-group.json`) over flat `docs/requirements/<slug>.md` paths (Volere + IREB)**:
   - Physical files stay flat at `docs/requirements/<slug>.md` so `git mv docs/proposals/<slug>.md docs/requirements/<slug>.md` is 1:1 and `req:<slug>` resolves in O(1) without directory traversal.
   - `docs/requirements/index.md` organises `in-force` requirements under the eight canonical concern groups from [`code-lists/concern-group.json`](../../code-lists/concern-group.json) (`sdlc`, `process`, `tools`, `kg`, `library`, `content`, `ui`, `conduct`), followed by a separate table of `superseded` and `retired` requirements.
3. **M3 — ISO/IEC/IEEE 29148 + IREB + W3C PROV-O three-axis traceability**:
   - **Backward**: `proposedIn` (`commit` + `path`) and `derivedFrom` (`req:<slug>` or `library/<bib-slug>`).
   - **Horizontal**: `dependsOn` (`req:<slug>`).
   - **Forward**: `beans`, `skills`, `processes`, `RequirementSet` (`docs/requirements/*.set.json`), and `test/attestations/` + `test/runs/` citing `req:<slug>` or `req:<slug>#<key>`.
4. **M4 — MADR / ISO 29148 immutable lifecycle for change, supersession, and retirement (`proposed → in-force → superseded | retired`)**:
   - Clarifications and additive sub-clauses amend `docs/requirements/<slug>.md` in place (with re-sign-off on any `approved`/`accepted` `RequirementSet`).
   - Reversals or replacement contracts file `docs/requirements/<new-slug>.md` (`derivedFrom: [req:<old-slug>]`) and flip `docs/requirements/<old-slug>.md` to `status: superseded` + `supersededBy: req:<new-slug>`.
   - Obsolete requirements flip to `status: retired` in place and are never `git rm`-deleted.

### 3.2 Rejected (5 candidate practices, with reasons)

1. **R1 — IEEE 830 monolithic SRS and positional outline numbering (`§3.1.2`)**: Rejected because outline edits renumber requirements, breaking `req:` URIs in tests and attestations, and a single file causes Git merge conflicts.
2. **R2 — Centralised sequential integer IDs (`REQ-0001`)**: Rejected because parallel branches/worktrees collide on the next integer without a central lock server, and opaque numbers carry no domain meaning in prose or test output.
3. **R3 — Physical subdirectory sharding (`docs/requirements/<group>/<slug>.md`)**: Rejected because `check-requirements.ts` (`mdFilesIn`) scans `docs/requirements/` and `docs/proposals/` non-recursively for 1:1 slug collisions, and cross-cutting requirements would suffer path churn if re-categorised.
4. **R4 — ReqIF XML / raw OSLC RDF as the authored format**: Rejected (per [`requirements-standards-assessment.md`](../../methodologies/requirements-standards-assessment.md)) because XML UUID graphs are hostile to PR review and human/agent co-authoring.
5. **R5 — Destructive deletion (`git rm`) of retired or superseded requirements**: Rejected because deleting a requirement file breaks historical `derivedFrom`, `dependsOn`, and attestation pointers.

---

## 4. Proposed BPMN filing process (`processes/sdlc/requirements-filing.bpmn`)

![Requirements filing workflow](../assets/img/workflows/requirements-filing.svg)

The diagram [`processes/sdlc/requirements-filing.bpmn`](../../sdlc/processes/requirements-filing.bpmn) (`Process_RequirementsFiling`, step-by-step checklist at [`processes/sdlc/requirements-filing.checklist.md`](../../sdlc/processes/requirements-filing.checklist.md)) models the filing workflow across two lanes (`BA / Feature Requestor` and `Authoring Agent`):

1. **`A_ClassifyFiling`** (`crdm-requirements-workflow`): Classify the transition (`promote` from `docs/proposals/<slug>.md`, `amend-or-supersede` an existing requirement, or `retire` an obsolete requirement), assign the primary concern group from `code-lists/concern-group.json`, and check `req:<slug>` uniqueness.
2. **`GW_FilingMode`**: Route by transition kind (`promote` | `amend-or-supersede` | `retire`).
3. **`A_PromoteOrUpdate`** (`crdm-requirements-workflow`): For `promote`, capture the last proposal commit SHA, run `git mv docs/proposals/<slug>.md docs/requirements/<slug>.md`, and populate `proposedIn`.
4. **`A_BindFrontMatter`** (`specification-management`): Author/update `Requirement` front matter (`id`, `title`, `status`, `statements[]` with `key`/`modality`/`statement`/`successCriteria`, `derivedFrom`, `dependsOn`, `beans`, `skills`, `processes`).
5. **`A_UpdateLifecycle`** (`specification-management`): When superseding or retiring, update the old requirement in place (`status: superseded` + `supersededBy: req:<new-slug>`, or `status: retired`) and update any affected `RequirementSet` (`docs/requirements/*.set.json`).
6. **`A_UpdateIndex`** (`crdm-requirements-workflow`): Organise the requirement in `docs/requirements/index.md` under its concern group (`in-force`) or under the Superseded & Retired table.
7. **`A_RunCheck`** (`specification-management`): Run `bun run cat check:requirements` (non-relaxable service task).
8. **`GW_CheckPassed`**: Loop back to `A_BindFrontMatter` on `fail`; advance to `BA_ReviewFiling` on `pass`.
9. **`BA_ReviewFiling`** (`adjudication`, human-only): Business Analyst / Owner adjudicates (`approve`, `amend`, `reject`, `defer`, `cancel`).
10. **`A_RecordFilingSignoff`** (`adjudication`): Append the `requirement-signoff` attestation and update the `RequirementSet` stage.
11. **`GW_FilingAccepted`**: Transition to `End_RequirementFiled` (`approve` / `amend`) or `End_FilingHeld` (`reject` / `defer` / `cancel`).

---

## 5. Decisions for the owner before building

1. **D1 — Where concern-group membership is recorded**:
   - **Option 1A (Recommended, zero schema change)**: Keep `bootstrap/schemas/requirement.schema.json` unchanged and organise requirements by concern group (`code-lists/concern-group.json`) in `docs/requirements/index.md` (and optional per-concern `RequirementSet` files `docs/requirements/<group>.set.json`).
   - **Option 1B (Schema addition)**: Add an optional `concerns` array (codes from `code-lists/concern-group.json`) to `bootstrap/schemas/requirement.schema.json` so `docs/requirements/index.md` can be auto-generated from front matter.
2. **D2 — `dependsOn` target status check in `check:requirements`**:
   - Should `check:requirements` refuse (or warn) when an `in-force` requirement lists a `dependsOn` target whose status is `superseded` or `retired`? (Recommended: **refuse**, so superseding or retiring a dependency forces callers to re-point or update their lineage in the same PR.)
3. **D3 — Calling `Process_RequirementsFiling` from `crdm-close.bpmn`**:
   - Once approved, should `crdm-close.bpmn` include a `<bpmn:callActivity calledElement="Process_RequirementsFiling">` between `BA_Confirm` and `Call_MergeToMain` whenever the feature has a proposal in `docs/proposals/<slug>.md`?
