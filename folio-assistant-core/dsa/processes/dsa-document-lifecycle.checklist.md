<!-- GENERATED from folio-assistant-core/dsa/processes/dsa-document-lifecycle.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Data sharing agreement document life cycle

> **Generated, and not the authority.** This is `folio-assistant-core/dsa/processes/dsa-document-lifecycle.bpmn` (process `Process_DsaDocumentLifecycle`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

How a data sharing agreement is drafted, negotiated, signed, published with a version, a hash and a catalogue record, and later amended, renewed or ended.

## Begin — Data requested, or a standing agreement needed (`Start_Request`)

- Begin here: P1 trigger: a recipient asks for data, or a programme needs a standing agreement (for example a cross-border surveillance feed).
- Call `workflow_start` with `process: "Process_DsaDocumentLifecycle"` and the subject this run is about; keep the instance id it returns.
- next: → `Call_BeanOpen` (Open the bean)

## Begin — Terms change, end date reached, or notice given (`Start_Change`)

- Begin here: P14 trigger: the parties want to change the terms, the end date is reached, or one party gives notice of termination.
- Call `workflow_start` with `process: "Process_DsaDocumentLifecycle"` and the subject this run is about; keep the instance id it returns.
- next: → `Call_BeanOpenChange` (Open the bean)

### 1. Open the bean (`Call_BeanOpen`)

- Who: the `Author and policy author` lane (role `author`).
- Skill: `bean-coordination`.
- What: Process_BeanOpen: check before you create, find out whose the bean is, and claim it — or leave it alone when it is someone else's.
- A subprocess (`Process_BeanOpen`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `GW_BeanYours` (Bean claimed?)

### 2. Open the bean (`Call_BeanOpenChange`)

- Who: the `Author and policy author` lane (role `author`).
- Skill: `bean-coordination`.
- What: Process_BeanOpen: check before you create, find out whose the bean is, and claim it — or leave it alone when it is someone else's.
- A subprocess (`Process_BeanOpen`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `GW_BeanYoursChange` (Bean claimed?)

### Decide — Bean claimed? (`GW_BeanYours`)

- Reads which end Process_BeanOpen reached.
- Call `workflow_complete` with `node: "GW_BeanYours"` and `outcome` set to the label that holds:
  - «not yours» → `End_BeanNotYours` (Not yours — left alone)
  - «claimed» → `Task_AgreeTerms` (P1.1 · Agree the terms)

### Decide — Bean claimed? (`GW_BeanYoursChange`)

- Reads which end Process_BeanOpen reached.
- Call `workflow_complete` with `node: "GW_BeanYoursChange"` and `outcome` set to the label that holds:
  - «not yours» → `End_BeanNotYoursChange` (Not yours — left alone)
  - «claimed» → `Task_DecideChange` (Decide: amend, renew or end)

## Done — Not yours — left alone (`End_BeanNotYours`)

- The instance completes here: Someone else holds the bean; this run stops without touching it. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 3. P1.1 · Agree the terms (`Task_AgreeTerms`)

- Who: the `Parties and signatories (provider, recipient)` lane (role `stakeholder`).
- What: The parties agree the purpose, the datasets, the period, the conditions and duties, which trust anchors each side accepts, and the legal basis the sharing rests on (consent, treatment, public-health law or a research waiver).
- Record it: `workflow_complete` with `node: "Task_AgreeTerms"`.
- next: → `GW_DraftMerge`

## Done — Not yours — left alone (`End_BeanNotYoursChange`)

- The instance completes here: Someone else holds the bean; this run stops without touching it. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 4. Decide: amend, renew or end (`Task_DecideChange`)

- Who: the `Parties and signatories (provider, recipient)` lane (role `stakeholder`).
- What: The parties decide what happens to the agreement.
- Record it: `workflow_complete` with `node: "Task_DecideChange"`.
- next: → `GW_ChangeKind` (Amend, renew or end?)

### Merge — `GW_DraftMerge`

- Nothing to do or decide: the paths meet here and the engine passes through.
- next: → `Task_WriteText` (P1.2 · Write the legal text)

### Decide — Amend, renew or end? (`GW_ChangeKind`)

- The parties' decision.
- Call `workflow_complete` with `node: "GW_ChangeKind"` and `outcome` set to the label that holds:
  - «new version» → `Task_DecideGrants` (P14.2 · Decide what happens to existing grants)
  - «renew by grant» → `End_RenewedByGrant` (Renewed by a new grant)
  - «end» → `Task_SetStatus` (P14.5 · Set the status to ended)

### 5. P1.2 · Write the legal text (`Task_WriteText`)

- Who: the `Author and policy author` lane (role `author`).
- Skill: `document-authoring`, `normative-statements`, `document-structure`.
- What: Write the agreement as a document folio: one normative statement per clause the parties must keep, through normative-statements.
- Record it: `workflow_complete` with `node: "Task_WriteText"`.
- next: → `Task_RecordLegalBasis` (P1.2a · Record the legal basis)

### 6. P14.2 · Decide what happens to existing grants (`Task_DecideGrants`)

- Who: the `Parties and signatories (provider, recipient)` lane (role `stakeholder`).
- What: Existing grants keep citing the old hash.
- Record it: `workflow_complete` with `node: "Task_DecideGrants"`.
- next: → `GW_WidensUse` (Consent-based: does the amendment widen use?)

## Done — Renewed by a new grant (`End_RenewedByGrant`)

- The instance completes here: The version has no end date, so renewal is a new grant under the same version. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 7. P14.5 · Set the status to ended (`Task_SetStatus`)

- Who: the `Publisher (data provider's publication manager)` lane (role `publication-manager`).
- Skill: `dsa-catalogue-status`.
- What: Set the life-cycle status of the agreement's DCAT 3 record (DCAT 3 §6.4.30).
- Record it: `workflow_complete` with `node: "Task_SetStatus"`.
- next: → `Task_EndDuties` (Revoke grants and start end-of-agreement duties)

### 8. P1.2a · Record the legal basis (`Task_RecordLegalBasis`)

- Who: the `Author and policy author` lane (role `author`).
- Skill: `normative-statements`.
- What: The text states the legal basis the parties agreed in P1.1 as a normative statement: consent, treatment, public-health law, or a research waiver.
- Record it: `workflow_complete` with `node: "Task_RecordLegalBasis"`.
- next: → `GW_ConsentBasis` (Consent the legal basis?)

### Decide — Consent-based: does the amendment widen use? (`GW_WidensUse`)

- Consent rule 2, for a new version only.
- Call `workflow_complete` with `node: "GW_WidensUse"` and `outcome` set to the label that holds:
  - «widens use» → `Task_NewConsentNeeded` (P14.3 · New consent needed)
  - «narrows use» → `GW_WidensJoin`
  - «not consent-based» → `GW_WidensJoin`

### 9. Revoke grants and start end-of-agreement duties (`Task_EndDuties`)

- Who: the `Parties and signatories (provider, recipient)` lane (role `stakeholder`).
- What: All grants are revoked (P13) and the end-of-agreement duties start: return or delete the data, then check them (P12).
- Record it: `workflow_complete` with `node: "Task_EndDuties"`.
- next: → `Call_BeanCloseEnded` (Close the bean)

### Decide — Consent the legal basis? (`GW_ConsentBasis`)

- Reads the legal basis recorded in P1.2a.
- Call `workflow_complete` with `node: "GW_ConsentBasis"` and `outcome` set to the label that holds:
  - «consent» → `Task_PlainSummary` (P1.2b · Draft the plain summary)
  - «treatment, law or waiver» → `GW_ConsentBasisJoin`

### 10. P14.3 · New consent needed (`Task_NewConsentNeeded`)

- Who: the `Parties and signatories (provider, recipient)` lane (role `stakeholder`).
- What: The amendment widens use, so a Consent citing the old version's URL and hash does not cover the new version (consent rule 2).
- Record it: `workflow_complete` with `node: "Task_NewConsentNeeded"`.
- next: → `GW_WidensJoin`

### Merge — `GW_WidensJoin`

- Nothing to do or decide: the paths meet here and the engine passes through.
- next: → `GW_DraftMerge`

### 11. Close the bean (`Call_BeanCloseEnded`)

- Who: the `Author and policy author` lane (role `author`).
- Skill: `todo-manager`.
- What: Process_BeanClose: end the bean in a state that says why — complete and archive it, scrap it with its reasons and archive it, or record the blocker and hand it back.
- A subprocess (`Process_BeanClose`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `GW_BeanClosedHow` (How did it end?)

### 12. P1.2b · Draft the plain summary (`Task_PlainSummary`)

- Who: the `Author and policy author` lane (role `author`).
- Skill: `document-authoring`.
- What: Consent-based only.
- Record it: `workflow_complete` with `node: "Task_PlainSummary"`.
- next: → `GW_ConsentBasisJoin`

### Merge — `GW_ConsentBasisJoin`

- Nothing to do or decide: the paths meet here and the engine passes through.
- next: → `GW_Computable` (Computable agreement?)

### Decide — How did it end? (`GW_BeanClosedHow`)

- Which outcome the bean was closed with, so each ends at its own named end event.
- Call `workflow_complete` with `node: "GW_BeanClosedHow"` and `outcome` set to the label that holds:
  - «published» → `End_InForce` (Version published — agreement in force)
  - «ended» → `End_Ended` (Agreement ended)

### Decide — Computable agreement? (`GW_Computable`)

- Does this agreement carry a machine-readable ODRL 2.2 Agreement beside its text?
- Call `workflow_complete` with `node: "GW_Computable"` and `outcome` set to the label that holds:
  - «yes» → `Task_DeriveOdrl` (P1.3 · Derive the ODRL 2.2 Agreement)
  - «document only» → `GW_ComputableJoin`

## Done — Version published — agreement in force (`End_InForce`)

- The instance completes here: The signed version is at its immutable URL, with its hash and catalogue record. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

## Done — Agreement ended (`End_Ended`)

- The instance completes here: The agreement has expired or been terminated, its catalogue status says so, and its versions stay readable. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 13. P1.3 · Derive the ODRL 2.2 Agreement (`Task_DeriveOdrl`)

- Who: the `Author and policy author` lane (role `author`).
- What: Computable only.
- Record it: `workflow_complete` with `node: "Task_DeriveOdrl"`.
- next: → `Task_CheckOdrl` (P1.4 · Check the ODRL against the text)

### Merge — `GW_ComputableJoin`

- Nothing to do or decide: the paths meet here and the engine passes through.
- next: → `Task_SplitAnnexes` (P1.5 · Split public terms from private annexes)

### 14. P1.4 · Check the ODRL against the text (`Task_CheckOdrl`)

- Who: the `Reviewer (legal, policy)` lane (role `reviewer`).
- Skill: `content-review`.
- What: Computable only.
- Record it: `workflow_complete` with `node: "Task_CheckOdrl"`.
- next: → `GW_ComputableJoin`

### 15. P1.5 · Split public terms from private annexes (`Task_SplitAnnexes`)

- Who: the `Author and policy author` lane (role `author`).
- What: Split the agreement into a public template and private annexes (security controls, named staff).
- Record it: `workflow_complete` with `node: "Task_SplitAnnexes"`.
- next: → `Task_Review` (Review the draft agreement)

### 16. Review the draft agreement (`Task_Review`)

- Who: the `Reviewer (legal, policy)` lane (role `reviewer`).
- Skill: `content-review`, `review-comments`.
- What: Legal and policy review of the whole draft.
- Record it: `workflow_complete` with `node: "Task_Review"`.
- next: → `GW_PublicComment` (Public comment on the public terms?)

### Decide — Public comment on the public terms? (`GW_PublicComment`)

- Should the public template go out for public comment before signing?
- Call `workflow_complete` with `node: "GW_PublicComment"` and `outcome` set to the label that holds:
  - «yes» → `Call_PublicComment` (Public comment on the template)
  - «no» → `GW_CommentJoin`

### 17. Public comment on the template (`Call_PublicComment`)

- Who: the `Public review (commenters, review committee, editor)` lane (role `review-coordinator`).
- Skill: `public-comment`.
- What: Comments on the frozen, line-numbered review version of the public template are placed, triaged, weighed and decided (public-comment.bpmn).
- A subprocess (`Process_PublicComment`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `GW_CommentJoin`

### Merge — `GW_CommentJoin`

- Nothing to do or decide: the paths meet here and the engine passes through.
- next: → `GW_ReadyToSign` (Ready to sign?)

### Decide — Ready to sign? (`GW_ReadyToSign`)

- The reviewers' call.
- Call `workflow_complete` with `node: "GW_ReadyToSign"` and `outcome` set to the label that holds:
  - «changes needed» → `GW_DraftMerge`
  - «ready» → `Task_Render` (Render the text to HTML and PDF)

### 18. Render the text to HTML and PDF (`Task_Render`)

- Who: the `Build pipeline (system)` lane (role `build-pipeline`).
- Skill: `document-publishing`.
- What: Render the agreed text to the form that will be signed (HTML and PDF), without a TeX installation.
- Record it: `workflow_complete` with `node: "Task_Render"`.
- next: → `Task_Sign` (P1.6 · Sign)

### 19. P1.6 · Sign (`Task_Sign`)

- Who: the `Parties and signatories (provider, recipient)` lane (role `stakeholder`).
- What: The signatories sign: wet ink, or an electronic signature under national law.
- Record it: `workflow_complete` with `node: "Task_Sign"`.
- next: → `Task_AssignVersion` (P2.1 · Assign version and fixed URL)

### 20. P2.1 · Assign version and fixed URL (`Task_AssignVersion`)

- Who: the `Publisher (data provider's publication manager)` lane (role `publication-manager`).
- Skill: `content-publish`, `package-release`.
- What: Each signed version gets its own immutable URL (for example /dsa/42/v3).
- Record it: `workflow_complete` with `node: "Task_AssignVersion"`.
- next: → `Task_Hash` (P2.2 · Record each file's SHA-256)

### 21. P2.2 · Record each file's SHA-256 (`Task_Hash`)

- Who: the `Publisher (data provider's publication manager)` lane (role `publication-manager`).
- Skill: `dsa-checksum`.
- What: Compute SHA-256 (FIPS 180-4) of the signed text, and of the ODRL file if there is one, recorded as DCAT 3 spdx:checksum and verified by check:dsa-hash.
- Record it: `workflow_complete` with `node: "Task_Hash"`.
- next: → `GW_ConsentPublish` (Consent-based agreement?)

### Decide — Consent-based agreement? (`GW_ConsentPublish`)

- The legal basis recorded in P1.2a.
- Call `workflow_complete` with `node: "GW_ConsentPublish"` and `outcome` set to the label that holds:
  - «consent» → `Task_HashSummary` (P2.2a · Hash the plain summary)
  - «not consent-based» → `GW_ConsentPublishJoin`

### 22. P2.2a · Hash the plain summary (`Task_HashSummary`)

- Who: the `Publisher (data provider's publication manager)` lane (role `publication-manager`).
- Skill: `dsa-checksum`.
- What: Consent-based only.
- Record it: `workflow_complete` with `node: "Task_HashSummary"`.
- next: → `Task_ConsentCitation` (P2.2b · State the URL and hash to cite)

### Merge — `GW_ConsentPublishJoin`

- Nothing to do or decide: the paths meet here and the engine passes through.
- next: → `GW_CiteComputable` (ODRL to update?)

### 23. P2.2b · State the URL and hash to cite (`Task_ConsentCitation`)

- Who: the `Publisher (data provider's publication manager)` lane (role `publication-manager`).
- Skill: `content-publish`.
- What: Consent-based only.
- Record it: `workflow_complete` with `node: "Task_ConsentCitation"`.
- next: → `GW_ConsentPublishJoin`

### Decide — ODRL to update? (`GW_CiteComputable`)

- Is there an ODRL Agreement for this version?
- Call `workflow_complete` with `node: "GW_CiteComputable"` and `outcome` set to the label that holds:
  - «yes» → `Task_OdrlCitesText` (P2.3 · Make the ODRL cite the text)
  - «document only» → `GW_CiteJoin`

### 24. P2.3 · Make the ODRL cite the text (`Task_OdrlCitesText`)

- Who: the `Author and policy author` lane (role `author`).
- Skill: `dsa-odrl-source`.
- What: The ODRL policy names the signed text distribution with dcterms:source (DCMI Terms), pointing at the immutable URL whose spdx:checksum was just recorded.
- Record it: `workflow_complete` with `node: "Task_OdrlCitesText"`.
- next: → `GW_CiteJoin`

### Merge — `GW_CiteJoin`

- Nothing to do or decide: the paths meet here and the engine passes through.
- next: → `Task_Publish` (Publish the version at its URL)

### 25. Publish the version at its URL (`Task_Publish`)

- Who: the `Build pipeline (system)` lane (role `build-pipeline`).
- Skill: `content-publish`.
- What: Publish the files at the version's immutable URL.
- Record it: `workflow_complete` with `node: "Task_Publish"`.
- next: → `Task_Catalogue` (P2.4–5 · Write the DCAT 3 record)

### 26. P2.4–5 · Write the DCAT 3 record (`Task_Catalogue`)

- Who: the `Publisher (data provider's publication manager)` lane (role `publication-manager`).
- Skill: `dsa-dcat-record`.
- What: One DCAT 3 record: the agreement as a catalogued resource, each file a dcat:Distribution with dcat:downloadURL and spdx:checksum; datasets it covers carry odrl:hasPolicy.
- Record it: `workflow_complete` with `node: "Task_Catalogue"`.
- next: → `Call_BeanCloseEnded` (Close the bean)
