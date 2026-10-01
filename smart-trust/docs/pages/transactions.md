---
title: "Transactions — WHO SMART Trust"
description: "Transactions: a narrative page of the WHO SMART Trust IG, rendered from its source."
nav_exclude: true
---
<style>
.st-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.75rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.st-held{color:#0d6e5e}
.st-ref{color:#6b5b95}
.st-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.st-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.st-stat b{display:block;font-size:1.25rem;line-height:1.2}
.st-stat span{font-size:.75rem;opacity:.75}

.st-ig {
  --breadcrumb-bg-color: #f5f5f5;
  --breadcrumb-text-color: ##555555; /* shape conflict — see chrome.json */
  --btn-active-color: #0078d4;
  --btn-gradient-end-color: #357ebd;
  --btn-gradient-end-color-alpha: #ff357ebd;
  --btn-gradient-start-color: #428bca;
  --btn-gradient-start-color-alpha: #ff428bca;
  --btn-hover-color: #0070A1;
  --btn-text-color: #e6e6e6;
  --display-todo: none;
  --dragon-background-color: #fffbf7;
  --dragon-text-color: #101020;
  --footer-bg-color: #505050;
  --footer-container-bg-color: #00477d;
  --footer-highlight-text-color: #ffff77;
  --footer-hyperlink-text-color: #81BEF7;
  --footer-nav-bg-color: #f5f5f5;
  --footer-text-color: #ffffff;
  --ig-header-color: #f6f7f9;
  --ig-header-container-color: #ffffff;
  --ig-status-text-color: #00376d;
  --link-color: #428bca;
  --link-hover-color: #2a6496;
  --may-color: #00004d;
  --must-color: #4d0000;
  --navbar-bg-color: #00477d;
  --publish-box-bg-color: yellow;
  --publish-box-border: 1px solid #0A0008;
  --should-color: #4d4000;
  --showtodo: "off";
  --stripe-bg-color: #999999;
  --stu-note-background-color: #fff2ff;
  --stu-note-border-left-color: #ffa0ff;
  --toc-box-bg-color: #f6f7f9;
  --toc-box-border: navy; /* shape conflict — see chrome.json */
}

.st-ig #ig-status.ig-status-draft {
  background-image: url("data:image/svg+xml;
  http: //www.w3.org/2000/svg' width='150px' height='150px'><rect width='800%' height='100%' fill='transparent' /><text transform='translate(30, 50) rotate(-35)' fill='rgba(245,45,45,0.5)' font-family='Arial' font-weight='bold' font-size='20'>DRAFT</text></svg>");
  background-size: calc(50% / 5) 100px;
  background-repeat: repeat-x;
}

.st-ig #ig-status.ig-status-retired {
  background-image: url("data:image/svg+xml;
  http: //www.w3.org/2000/svg' width='150px' height='150px'><rect width='800%' height='100%' fill='transparent' /><text transform='translate(30, 60) rotate(-35)' fill='rgba(245,45,45,0.5)' font-family='Arial' font-weight='bold' font-size='20'>RETIRED</text></svg>");
  background-size: calc(50% / 5) 100px;
  background-repeat: repeat-x;
}

.st-ig #ig-status p {
  background-color: white;
  padding: 10px 17px;
  border-radius: 5px;
  position: relative;
  z-index: 2;
}

.st-ig #publish-box {
  background-color: var(--publish-box-bg-color);
  border: var(--publish-box-border);
  padding: 5px;
}
.st-ig .st-ig-bar{background:var(--navbar-bg-color);padding:.5rem .8rem;border-radius:4px 4px 0 0}
.st-ig .st-ig-bar a{color:#fff;font-weight:600;text-decoration:none}
.st-ig .st-ig-title{font-size:12pt;font-weight:bold;color:var(--ig-status-text-color)}
</style>

<div class="st-ig">
  <div class="st-ig-bar"><a href="http://smart.who.int/trust">smart.who.int.trust</a></div>
  <div id="ig-status" class="ig-status-draft">
    <p><span class="st-ig-title">WHO SMART Trust</span><br/><span>1.8.0 — draft</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/trust">http://smart.who.int/trust</a>.</p>
</div>

# Transactions

{% raw %}
### Publish Keys {#publish_keys}
#### Trigger Events
The Trust Network Participant, or one of its authorized Issuers, generates a new public-private key pair for use for document signing.
#### Message Semantics
See the [EU DCC Open API](https://worldhealthorganization.github.io/smart-trust/openapi/index.html#/GDHCN/postTrustedCertificate) documentation.  The key usage is DSC for Document Signing Certificate
#### Expected Actions
The Trust Anchor will validate the submitted key material and distribute it to other Trust Network Participants

### Mirror Local PKD {#mirror_keys}
#### Trigger Events
#### Message Semantics
#### Expected Actions

Steps include:
- Local PKD onboarding (one-time). Onboarding may include evaluating Local PKD format, providing the Federated PKD access, and signing of business agreements.
- Local PKD public keys are mirrored (periodic)
- Mirrored public keys are merged into a master list (periodic)
- Master list is digitally signed for distribution

Local PKDs participating in the Federated PKD are expected to:
- Have an existing public key infrastructure used for issuing trusted health documents (e.g. COVID credentials)
- Have permissions/policies in place that allow sharing the public keys
- Can share public keys in one of the following formats:
  - X.509
  - JSON Web Keys (JWK)
  - [Decentralized Identifiers](https://www.w3.org/TR/did-1.0/) (DID) according to the [GDHCN specification](concepts_did_gdhcn.html) specification.

Federated PKDs are expected to:
- Have a means for retrieving local public key directories / nodes members represented in the aggregation services
- Have permissions/policies in place that allow sharing the public keys from trust node members
- Have an existing public key infrastructure used for signing list of keys my node members
- Can share list of public keys in the following format:
  - [Decentralized Identifiers](https://www.w3.org/TR/did-1.0/) (DID) according to the [GDHCN specification](concepts_did_gdhcn.html) specification.
  


### Sign Health Certificate (HCERT)  Claim {#sign_claim}
#### Trigger Events
The claim payload of a [HCERT](hcert_spec.html) has been generated and is ready to be signed by an Issuer acting on behalf of a Trust Network Participant.
#### Message Semantics
The output should be a valid signed [HCERT](hcert_spec.html)
#### Expected Actions



<h4 id="put_keys_api} Publish Verification Keys - API 
#### Trigger Events

A Trust Network Partcipiant publish keys to the Trust Network Gateway for use by Verification Applications.  Keys may be coded for a variety of uses including following the [certificate governance](concepts_certificate_governance.html) according to their [**$usage**](../artifact/ValueSet-KeyUsage.html) and trust [**$domain**](../artifact/ValueSet-Domains.html) 


#### Message Semantics
See [Swagger API](https://worldhealthorganization.github.io/smart-trust/openapi/index.html)
#### Expected Actions


### Retrieve Verification Keys - DID {#get_keys_did}
#### Trigger Events

#### Message Semantics
Keys should be retrieved using the [GDHCN DID](concepts_did_gdhcn.html) specification. 
#### Expected Actions
Once a Verification Application has onboarded to the Trust Network it may retrieve verification keys.   The retrieved list of verificaiton keys may be used for the following busines processes:
- Onboarding a Federated PKD by retrieving the signing key used to sign the master list (one-time).
- Retrieving the master list from the Federated PKD and verifying the signature (periodic).
- Deserializing a Verifiable QR code (e.g.  vaccine credential 2D bar-code) to determine the key id.
- Retrieving the public key associated with the key id from the master list, or using a cached key.
- Verifying 
  - the cryptographic signature within the 2D barcode.
  - the authority of the issuer to issue this type of certificate with this key.
  - the expiration date of the keys.
  - the expiration date from the certificate.
  - the certificate is not part of revocation lists available.
  - the issuing key is still present on a trust list by the issuing authority (not revoked).
  - the issuing key is still present on the trust list of the verification authority.
  - the name/identity on the certificate matches an ID document.
  - the business rules of the verification jurisdiction pass for the certificate.  


### Retreive Verification Keys - API {#get_keys_api}
#### Trigger Events

#### Message Semantics
See [Swagger API](https://worldhealthorganization.github.io/smart-trust/openapi/index.html)
#### Expected Actions

Once a Verification Application has onboarded to the Trust Network it may retrieve verification keys.   The retrieved list of verificaiton keys may be used for the following busines processes:
- Onboarding a Federated PKD by retrieving the signing key used to sign the master list (one-time).
- Retrieving the master list from the Federated PKD and verifying the signature (periodic).
- Deserializing a Verifiable QR code (e.g.  vaccine credential 2D bar-code) to determine the key id.
- Retrieving the public key associated with the key id from the master list, or using a cached key.
- Verifying 
  - the cryptographic signature within the 2D barcode.
  - the authority of the issuer to issue this type of certificate with this key.
  - the expiration date of the keys.
  - the expiration date from the certificate.
  - the certificate is not part of revocation lists available.
  - the issuing key is still present on a trust list by the issuing authority (not revoked).
  - the issuing key is still present on the trust list of the verification authority.
  - the name/identity on the certificate matches an ID document.
  - the business rules of the verification jurisdiction pass for the certificate.  

Keys should be retrieved using the [GDHCN DID](concepts_did_gdhcn.html) specification.  




### Request Business Rule Updates - API {#get_rules_api}
#### Trigger Events
#### Message Semantics
See [Swagger API](https://worldhealthorganization.github.io/smart-trust/openapi/index.html)


#### Expected Actions

### Request Business Rule Updates - API {#get_rules_fhir}
#### Trigger Events
#### Message Semantics
Shall act as a Business Rules Library:
- Expresses health policies (e.g. “Needs full course of vaccine”) as executable business rule using the Clinical Quality Language (CQL) as a FHIR Library Resource
- Publishes business rules as FHIR Library resources with a trust health service

Optionally:
  - Provide digital signagure of business rule as FHIR Provenance resource
  - Provides public key to PKD

#### Expected Actions



### Execute Business {#execute_rule}
#### Trigger Events
#### Message Semantics
#### Expected Actions


Verification App:
- Pre-Condition: Perform Federated Verification workflow on one ore more QR-code
- Identify one (or more) business rule(s) to be exectued according to use case

Optionally:
  - Retrieves business rule signing public key from PKD (either Local PKD or via Aggregating/ Federated PKD)
  - Verifies authenticity of business rule
- Map QR-code content into requiste FHIR resources using FHIR Structure Maps
- Execute CQL businns rule on FHIR resource content




### Request Value Sets - API {#get_valuesets_api}
#### Trigger Events
#### Message Semantics
See [Swagger API](https://worldhealthorganization.github.io/smart-trust/openapi/index.html)
#### Expected Actions



### Request Value Sets - FHIR {#get_valuesets_api}
#### Trigger Events
#### Message Semantics
See [IHE Sharing Value Sets and Concept Maps](https://profiles.ihe.net/ITI/SVCM/) for transactions against a Terminology Service.
#### Expected Actions



### Execute Business {#execute_rule}

#### Trigger Events
#### Message Semantics
#### Expected Actions
{% endraw %}

---

<small>Source: [`input/pagecontent/transactions.md`](https://github.com/litlfred/smart-trust/blob/30d55b3630ac8a8937e1d98f7c060a4ae5a78ef0/input/pagecontent/transactions.md) at `30d55b36` · licence CC-BY-SA-3.0-IGO. Rendered from the IG's source by this site, not by the IG Publisher.</small>
