---
title: "WHO SMART Trust — artefact index"
description: "All 678 artefacts of the WHO SMART Trust IG 1.8.0, reconstructed from its published output."
has_children: true
renders:
  - smart-trust/fhir-artifact-index
rendered-by: ig-pages
---
<link rel="stylesheet" href="{{ '/smart-trust/assets/ig-pages.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/smart-trust/assets/ig-chrome.css' | relative_url }}">

<div class="st-ig">
  <div class="st-ig-bar"><a href="http://smart.who.int/trust">smart.who.int.trust</a></div>
  <div id="ig-status" class="ig-status-draft">
    <p><span class="st-ig-title">WHO SMART Trust</span><br/><span>1.8.0 — draft</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/trust">http://smart.who.int/trust</a>.</p>
</div>

The artefact index of the WHO SMART Trust Implementation Guide, rebuilt from what the IG
publishes. Most of it is catalogued **by reference**: the index records where each artefact
lives and holds none of its bytes. An artefact page marked <span class="st-tag st-ref">referenced</span>
is not a broken one — it means upstream, not here.

<div class="st-grid">
<div class="st-stat"><b>678</b><span>artefacts indexed</span></div>
<div class="st-stat"><b>659</b><span>referenced — bytes upstream</span></div>
<div class="st-stat"><b>19</b><span>materialized here</span></div>
<div class="st-stat"><b>1.8.0</b><span>IG version</span></div>
<div class="st-stat"><b>5.0.0</b><span>FHIR version</span></div>
</div>

## Where this came from

No FHIR IG publishes an artefact-index document. What looks like one —
`ValueSets.schema.json` at the published root — is a JSON *Schema* describing the shape of an
enumeration response, carrying an `example` that happens to hold the list. So this index was
**reconstructed**, and every part of it records which published file it came out of.

| | |
|---|---|
| packageManifest | `package.manifest.json` |
| canonicals | `canonicals.json` |
| packageIndex | `package.tgz!package/.index.json` |
| artifactsHtml | `artifacts.html` |
| sidecarEnumerations | `LogicalModels.schema.json, ValueSets.schema.json` |
| source | `gh-pages` — `https://litlfred.github.io/smart-trust` (read 2026-10-01) |
| canonical base | `http://smart.who.int/trust` |

## DAK API surface

The IG publishes its DAK API for 19 of its artefacts. The four sidecars are issued
independently — every ValueSet gets all four, the logical models get two — which is why they
are counted separately rather than as one "has DAK API" tally.

<div class="st-grid">
<div class="st-stat"><b>19</b><span>JSON Schema</span></div>
<div class="st-stat"><b>14</b><span>displays</span></div>
<div class="st-stat"><b>19</b><span>OpenAPI</span></div>
<div class="st-stat"><b>14</b><span>JSON-LD</span></div>
</div>

The IG's own [DAK API hub](dak-api.html) lists them as the Publisher's `dak-api.html` does.

## Every artefact, by category

Grouped and ordered as the IG's own `artifacts.html` groups them, with each artefact's name and
description. Its canonical URL, published representations and whether it is held here are on
its own page.

<details markdown="1" id="cat-Requirements__Actor_Definitions">
<summary><strong>Requirements: Actor Definitions</strong> — 5</summary>

| Artefact | Description |
|---|---|
| [Holder](./artifact/ActorDefinition-Holder.html)<br>`ActorDefinition/Holder` | A Holder is an individual that has Verifiable Digtial Health Certificate in their possesion, received from an Issuer. The Holder may choose to share the Verifiable Digital Health Certificate with a Receiver. |
| [Issuer](./artifact/ActorDefinition-Issuer.html)<br>`ActorDefinition/Issuer` | An Issuer a system authorized by a Trust Network Participant to generate Verifiable Digital Health Certificates which are provided to a Holder. An Issuer is responsible for generating the content that is digitally signed within the Verifiable Digital Health Certificate. In order to sign this content, an Issuer should either itself be a Document Signer or utilize a Document Signer service, as authorized by the jurisdicitonal policy. |
| [Receiver](./artifact/ActorDefinition-Receiver.html)<br>`ActorDefinition/Receiver` | A Reciever is a system authorized by a Trust Network Participant to receive from a Holder a Veritifable, verify and utilize the content within. |
| [Trust Network Anchor](./artifact/ActorDefinition-TrustNetworkAnchor.html)<br>`ActorDefinition/TrustNetworkAnchor` | Trust Anchor which receives and distributes PKI-material within a Trust Network |
| [Trust Network Participant](./artifact/ActorDefinition-TrustNetworkParticipant.html)<br>`ActorDefinition/TrustNetworkParticipant` | Trust Network Participant which publishes and or receives PKI-material within a Trust Network |

</details>

<details markdown="1" id="cat-Requirements__Formal_Requirements">
<summary><strong>Requirements: Formal Requirements</strong> — 29</summary>

| Artefact | Description |
|---|---|
| [Distribute CertLogic business rules](./artifact/Requirements-DistributeBusinessRulesCertLogic.html)<br>`Requirements/DistributeBusinessRulesCertLogic` | Make received CertLoigc business rules available through a distrubution point to a Receiver |
| [Distribute FHIR business rules](./artifact/Requirements-DistributeBusinessRulesFHIR.html)<br>`Requirements/DistributeBusinessRulesFHIR` | Make received business rules available through a distrubution point to a Receiver through HL7 FHIR standards |
| [Distribute PKI material](./artifact/Requirements-DistributePKIMaterial.html)<br>`Requirements/DistributePKIMaterial` | Make received trust material available through a distrubution point to a Trust Network Participant |
| [Distribute PKI material as DID](./artifact/Requirements-DistributePKIMaterialDID.html)<br>`Requirements/DistributePKIMaterialDID` | Make received trust material available through a distrubution point to a Trust Network Participant as DID |
| [Distribute PKI material via API](./artifact/Requirements-DistributePKIMaterialAPI.html)<br>`Requirements/DistributePKIMaterialAPI` | Make received trust material available through a distrubution point to a Trust Network Participant via API |
| [Distribute business rules](./artifact/Requirements-DistributeBusinessRules.html)<br>`Requirements/DistributeBusinessRules` | Make received business rules available through a distrubution point to a Receiver |
| [Issue Verifiable Digital Health Certificate](./artifact/Requirements-IssuerVDHC.html)<br>`Requirements/IssuerVDHC` | Issue a Verifiable Digital Health Certificate to a Holder |
| [Provide Verifiable Digital Health Certificate](./artifact/Requirements-ProvideVDHC.html)<br>`Requirements/ProvideVDHC` | Provide a Verifiable Digital Health Certificate to a Receiver |
| [Publish Cert Logic business rules](./artifact/Requirements-PublishBusinessRulesCertLogic.html)<br>`Requirements/PublishBusinessRulesCertLogic` | Publish Cert Logic business rules to a Trust Anchor |
| [Publish HL7 FHIR business rules](./artifact/Requirements-PublishBusinessRulesFHIR.html)<br>`Requirements/PublishBusinessRulesFHIR` | Publish business rules to a Trust Anchor using HL7 FHIR |
| [Publish PKI material](./artifact/Requirements-PublishPKIMaterial.html)<br>`Requirements/PublishPKIMaterial` | Publish trust material to a Trust Anchor |
| [Publish PKI material as DID](./artifact/Requirements-PublishPKIMaterialDID.html)<br>`Requirements/PublishPKIMaterialDID` | Publish trust material to a Trust Anchor as DID |
| [Publish PKI material via API](./artifact/Requirements-PublishPKIMaterialAPI.html)<br>`Requirements/PublishPKIMaterialAPI` | Publish trust material to a Trust Anchor via API |
| [Publish business rules](./artifact/Requirements-PublishBusinessRules.html)<br>`Requirements/PublishBusinessRules` | Publish business rules to a Trust Anchor |
| [Receive CertLogic business rules](./artifact/Requirements-ReceiveBusinessRulesCertLogic.html)<br>`Requirements/ReceiveBusinessRulesCertLogic` | Receive CertLogic business rules from a Trust Network Participant, for distribution within the Trust Network |
| [Receive HL7 FHIR business rules](./artifact/Requirements-ReceiveBusinessRulesFHIR.html)<br>`Requirements/ReceiveBusinessRulesFHIR` | Receive business rules from a Trust Network Participant, for distribution within the Trust Network using HL7 FHIR standard |
| [Receive PKI material](./artifact/Requirements-ReceivePKUMaterial.html)<br>`Requirements/ReceivePKUMaterial` | Receive trust material from a Trust Network Participant, for distribution within the Trust Network |
| [Receive PKI material as DID](./artifact/Requirements-ReceivePKUMaterialDID.html)<br>`Requirements/ReceivePKUMaterialDID` | Receive trust material from a Trust Network Participant, for distribution within the Trust Network as DID |
| [Receive PKI material via API](./artifact/Requirements-ReceivePKUMaterialAPI.html)<br>`Requirements/ReceivePKUMaterialAPI` | Receive trust material from a Trust Network Participant, for distribution within the Trust Network via API |
| [Receive Verifiable Digital Health Certificate](./artifact/Requirements-ReceiveVDHC.html)<br>`Requirements/ReceiveVDHC` | Receive a Verifiable Digital Health Certificate from an Issuer |
| [Receive business rules](./artifact/Requirements-ReceiveBusinessRules.html)<br>`Requirements/ReceiveBusinessRules` | Receive business rules from a Trust Network Participant, for distribution within the Trust Network |
| [Request Verifiable Digital Health Certificate](./artifact/Requirements-RequestVDHC.html)<br>`Requirements/RequestVDHC` | Request a Verifiable Digital Health Certificate from an Issuer |
| [Retrieve Cert Logic compatible business rules](./artifact/Requirements-RetrieveBusinessRulesCertLogic.html)<br>`Requirements/RetrieveBusinessRulesCertLogic` | Retrieve Cert Logic business rules from a distribution point |
| [Retrieve HL7 FHIR compatible business rules](./artifact/Requirements-RetrieveBusinessRulesFHIR.html)<br>`Requirements/RetrieveBusinessRulesFHIR` | Retrieve business rules from a distribution point using HL7 FHIR standards |
| [Retrieve PKI material](./artifact/Requirements-RetrievePKIMaterial.html)<br>`Requirements/RetrievePKIMaterial` | Retrieve PKI material from a distribution point |
| [Retrieve PKI material as DID](./artifact/Requirements-RetrievePKIMaterialDID.html)<br>`Requirements/RetrievePKIMaterialDID` | Retrieve PKI material from a distribution point as DID |
| [Retrieve PKI material via API](./artifact/Requirements-RetrievePKIMaterialAPI.html)<br>`Requirements/RetrievePKIMaterialAPI` | Retrieve PKI material from a distribution point via API |
| [Retrieve business rules](./artifact/Requirements-RetrieveBusinessRules.html)<br>`Requirements/RetrieveBusinessRules` | Retrieve business rules from a distribution point using |
| [Utilize a Verifiable Digital Health Certificate](./artifact/Requirements-UtilizeVDHC.html)<br>`Requirements/UtilizeVDHC` | Utilize a Verifiable Digital Health Certificate that was provided by a Holder |

</details>

<details markdown="1" id="cat-Structures__Logical_Models">
<summary><strong>Structures: Logical Models</strong> — 5</summary>

| Artefact | Description |
|---|---|
| [CBOR Web Token (CWT) Claim](./artifact/StructureDefinition-CWT.html)<br>`StructureDefinition/CWT` | Logical Model for Data elements in CBOR Web Token (CWT) https://www.iana.org/assignments/cwt/cwt.xhtml |
| [CBOR Web Token (CWT) Payload (Common)](./artifact/StructureDefinition-CWTPayload.html)<br>`StructureDefinition/CWTPayload` | Logical Model for CBOR Web Token (CWT) Payload Logical Modelin CWT Payload https://www.iana.org/assignments/cwt/cwt.xhtml |
| [COSE Headers (DRAFT)](./artifact/StructureDefinition-COSEHeader.html)<br>`StructureDefinition/COSEHeader` | Data elements for COSE Headers https://www.iana.org/assignments/cose/cose.xhtml#header-parameters |
| [Health Certificate](./artifact/StructureDefinition-HCert.html)<br>`StructureDefinition/HCert` | Logical Model for the HCERT |
| [Scheme Information](./artifact/StructureDefinition-SchemeInformation.html)<br>`StructureDefinition/SchemeInformation` | Logical Model for Information on the trusted list and its issuing scheme |

</details>

<details markdown="1" id="cat-Terminology__Value_Sets">
<summary><strong>Terminology: Value Sets</strong> — 14</summary>

| Artefact | Description |
|---|---|
| [WHO GDHCN Key Usage ValueSet](./artifact/ValueSet-KeyUsage.html)<br>`ValueSet/KeyUsage` | ValueSet of codes for key usage codes for Production environment |
| [WHO GDHCN Key Usage ValueSet - DEV](./artifact/ValueSet-KeyUsage-DEV.html)<br>`ValueSet/KeyUsage-DEV` | ValueSet of codes for key usage codes for Development environment |
| [WHO GDHCN Key Usage ValueSet - UAT](./artifact/ValueSet-KeyUsage-UAT.html)<br>`ValueSet/KeyUsage-UAT` | ValueSet of codes for key usage codes for User Acceptance Testing environment |
| [WHO GDHCN Actor ValueSet of actor codes](./artifact/ValueSet-Actors.html)<br>`ValueSet/Actors` | ValueSet of codes for actor codes |
| [WHO GDHCN Connection Types](./artifact/ValueSet-ConnectionTypes.html)<br>`ValueSet/ConnectionTypes` | ValueSet of GDHCN Trust Network Connection Types |
| [WHO GDHCN Payload Types](./artifact/ValueSet-PayloadTypes.html)<br>`ValueSet/PayloadTypes` | ValueSet of GDHCN Trust Network Payload Types |
| [WHO GDHCN Transaction Codes](./artifact/ValueSet-Transactions.html)<br>`ValueSet/Transactions` | ValueSet of WHO GDHCN Transaction Codes |
| [WHO GDHCN Trust Domains](./artifact/ValueSet-Domains.html)<br>`ValueSet/Domains` | ValueSet of WHO GDHCN Trust Domains for Production environment |
| [WHO GDHCN Trust Domains - DEV](./artifact/ValueSet-Domains-DEV.html)<br>`ValueSet/Domains-DEV` | ValueSet of WHO GDHCN Trust Domains for Development environment |
| [WHO GDHCN Trust Domains - UAT](./artifact/ValueSet-Domains-UAT.html)<br>`ValueSet/Domains-UAT` | ValueSet of WHO GDHCN Trust Domains for User Acceptance Testing environment |
| [WHO GDHCN Trust Network Participant](./artifact/ValueSet-Participants.html)<br>`ValueSet/Participants` | ValueSet of GDHCN Trust Network Participants for Production environment |
| [WHO GDHCN Trust Network Participant - DEV](./artifact/ValueSet-Participants-DEV.html)<br>`ValueSet/Participants-DEV` | ValueSet of GDHCN Trust Network Participants for Development environment |
| [WHO GDHCN Trust Network Participant - UAT](./artifact/ValueSet-Participants-UAT.html)<br>`ValueSet/Participants-UAT` | ValueSet of GDHCN Trust Network Participants for User Acceptance Testing environment |
| [WHO Regional Offices](./artifact/ValueSet-WHORegionalOffices.html)<br>`ValueSet/WHORegionalOffices` | ValueSet of WHO Regional Offices |

</details>

<details markdown="1" id="cat-Terminology__Code_Systems">
<summary><strong>Terminology: Code Systems</strong> — 15</summary>

| Artefact | Description |
|---|---|
| [WHO GDHCN Connection Types](./artifact/CodeSystem-ConnectionTypes.html)<br>`CodeSystem/ConnectionTypes` | CodeSystem for GDHCN connection types |
| [WHO GDHCN Key Usage CodeSystem](./artifact/CodeSystem-KeyUsage.html)<br>`CodeSystem/KeyUsage` | CodeSystem for GDHCN Key Usage that has usage codes for verification keys published to the Trust Network as defined by the certificate governance for Production environment |
| [WHO GDHCN Key Usage CodeSystem - DEV](./artifact/CodeSystem-KeyUsage-DEV.html)<br>`CodeSystem/KeyUsage-DEV` | CodeSystem for GDHCN Key Usage that has usage codes for verification keys published to the Trust Network as defined by the certificate governance for Development environment |
| [WHO GDHCN Key Usage CodeSystem - UAT](./artifact/CodeSystem-KeyUsage-UAT.html)<br>`CodeSystem/KeyUsage-UAT` | CodeSystem for GDHCN Key Usage that has usage codes for verification keys published to the Trust Network as defined by the certificate governance for User Acceptance Testing environment |
| [WHO GDHCN Payload Types](./artifact/CodeSystem-PayloadTypes.html)<br>`CodeSystem/PayloadTypes` | CodeSystem for GDHCN Payload types |
| [WHO GDHCN Transactions CodeSystem](./artifact/CodeSystem-Transactions.html)<br>`CodeSystem/Transactions` | CodeSystem for GDHCN transactions that has usage codes for verification keys published to the Trust Network as defined by the certificate governance |
| [WHO GDHCN Trust Actors CodeSystem](./artifact/CodeSystem-Actors.html)<br>`CodeSystem/Actors` | CodeSystem for SMART Trust actors that has usage codes for verification keys published to the Trust Network as defined by the certificate governance |
| [WHO GDHCN Trust Domains](./artifact/CodeSystem-Domains.html)<br>`CodeSystem/Domains` | CodeSystem for define WHO GDHCN Trust Domains for Production environment. |
| [WHO GDHCN Trust Domains - DEV](./artifact/CodeSystem-Domains-DEV.html)<br>`CodeSystem/Domains-DEV` | CodeSystem for define WHO GDHCN Trust Domains for Development environment. |
| [WHO GDHCN Trust Domains - UAT](./artifact/CodeSystem-Domains-UAT.html)<br>`CodeSystem/Domains-UAT` | CodeSystem for define WHO GDHCN Trust Domains for User Acceptance Testing environment. |
| [WHO GDHCN Trust Network Participant - DEV](./artifact/CodeSystem-Participants-DEV.html)<br>`CodeSystem/Participants-DEV` | CodeSystem for GDHCN Trust Network Participants for Development environment |
| [WHO GDHCN Trust Network Participant - UAT](./artifact/CodeSystem-Participants-UAT.html)<br>`CodeSystem/Participants-UAT` | CodeSystem for GDHCN Trust Network Participants for User Acceptance Testing environment |
| [WHO GDHCN Trust Network Participants CodeSystem](./artifact/CodeSystem-Participants.html)<br>`CodeSystem/Participants` | CodeSystem for GDHCN Trust Network Participants which are not already included in the ISO-3166 three letter code system for Production environment |
| [WHO RefMart Jurisidiction List](./artifact/CodeSystem-RefMartCountryList.html)<br>`CodeSystem/RefMartCountryList` | CodeSystem for WHO Refmart Country and Jurisidiction List available at https://xmart-api-public.who.int/REFMART/REF\_COUNTRY for Production environment |
| [WHO Regional Offices CodeSystem](./artifact/CodeSystem-WHORegionalOffices.html)<br>`CodeSystem/WHORegionalOffices` | CodeSystem for WHO Regional Offices |

</details>

<details markdown="1" id="cat-Terminology__Concept_Maps">
<summary><strong>Terminology: Concept Maps</strong> — 1</summary>

| Artefact | Description |
|---|---|
| [GDHCN Participants to WHO Regional Offices](./artifact/ConceptMap-ParticipantsToWHORegionalOffices.html)<br>`ConceptMap/ParticipantsToWHORegionalOffices` | ConceptMap from GDHCN Trust Network Production Participants to WHO Regional Offices. Participants that are not WHO Member States or State Parties (e.g. international organizations or non-member territories) have no mapping and are grouped under Other Participants. |

</details>

<details markdown="1" id="cat-Other">
<summary><strong>Other</strong> — 608</summary>

608 artefacts — too many to list here without the index becoming
unreadable. Every one has its own page: **[browse all 608](./category/Other.html)**.

</details>

<details markdown="1" id="cat--uncategorised">
<summary><strong>Uncategorised</strong> — 1</summary>

| Artefact | Description |
|---|---|
| [Trust](./artifact/ImplementationGuide-smart.who.int.trust.html)<br>`ImplementationGuide/smart.who.int.trust` |  |

</details>

<footer id="ig-footer" data-next="artifact/ActorDefinition-Holder.html" class="st-ig"></footer>
<script src="{{ '/smart-trust/assets/ig-footer.js' | relative_url }}" defer></script>
