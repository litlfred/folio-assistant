---
title: "Concepts — WHO SMART Trust"
description: "Concepts: a narrative page of the WHO SMART Trust IG, rendered from its source."
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

# Concepts

{% raw %}
### Concepts  Glossary


#### GDHCN Trust Network  
The GDHCN Trust Network is a Trust Network comprised of the GDHCN Secretariat and GDHCN Participants. The GDHCN Trust Network operationalizes Trust Domains through a Trust Network Gateway by enabling bilateral verification and utilization of Verifiable Digital Health Certificates and the utilization of Trusted Services by GDHCN Participants.

#### GDHCN Secretariat 
The WHO Secretariat serves as the operational and management leadership of the GDHCN, and in this role, the GDHCN Secretariat.

#### GDHCN Participant
A GDHCN Participant is participant of the Trust Network that adheres to the Terms of Participation and manages the necessary technical infrastructure and governance processes. GDHCN Participants are responsible for making bilateral determinations related to the utilization of Trusted Services. 

#### Eligible GDHCN Participant 
An Eligible GDHCN Participant is one of the following:
 *	a WHO Member State or Associate Member, or sub-national unit thereof;
 *	a State Party recognized by the International Health Regulations, or sub-national unit thereof;  
 *	the United Nations (UN) and other intergovernmental organizations in effective relations with WHO;
 *	a fund, programme, specialized agency, or related organization within the UN system; or
 *	an organization officially delegated by one of the organizations mentioned above that can abide by the GDHCN Terms of Participation and fulfils one or more of the following health service functions:
    + Public Health Agency;
    + Health Professions Education Accreditation Agency;
    +	Health Services Licensing Agency; or
    + Public Health Security Agency. 
Once accepted to the GDHCN, after the successful conclusion of the Onboarding Process, will be referred to as **GDHCN Participant**.  An Eligible GDHCN Participant that has initiated the Onboarding Process will be referred to as an **Eligible GDHCN Applicant**.

#### Terms of Participation (TOP)
Participation in the GDHCN is subject to the Onboarding Process set forth by the GDHCN Secretariat in its sole and absolute discretion, and in accordance with WHO rules, regulations, policies and practices, as may be amended from time to time.
The requirements for the GDHCN Terms of Participation are comprised of the following components:
* ***TOP0*** Sharing of necessary credentials to establish an mTLS (mutual transport layer security) connection between a GDHCN Participant’s backend system(s) and the Trust Network Gateway;
* ***TOP1*** Compliance, during initial Onboarding Process and during routine validation periods, with technical specifications required for a PKI;
* ***TOP2*** Compliance, during initial Onboarding Process and during routine validation periods, with technical specifications for Verifiable Digital Health Certificates and APIs of Trusted Services for each applicable Trust Domain; 
* ***TOP3*** Compliance with policy and regulatory standards that GDHCN Participants pertaining to Trusted Services that a GDHCN Trust Participants operates or utilizes for each applicable Trust Domain; and
* ***TOP4*** Provision of supporting documentation (e.g. mandate, legal framework) demonstrating that it is an Eligible GDHCN Participant, as may be requested by WHO, at its sole discretion, from time to time.
  
#### Business Owner Representative 
The individual identified by a GDHCN Participant as having the primary business and programmatic responsibility for the GDHCN Participant for the implementation of the use cases covered by a Trust Domain.

#### Key Master Representative 
The individual identified by a GDHCN Participant as having the primary responsibility for the management of the Public Key Infrastructure, including the generation of any needed public-private key pairs, and the configuration and management of the connections between the GDHCN Participant’s Public Key Infrastructure and the GDHCN Trust Network Gateway.

#### Legal Representative 
The individual designated by a GDHCN Participant as having the primary responsibility for reviewing the requirements related to a Trust Domain on behalf of this GDHCN Participant. This person should be someone that the GDHCN Secretariat can consult in relation to any legal or policy issues that may arise, such as changes to this document or changes to one of its Annexes that defines a Trust Domain.

#### Technical Representative 
The individual designated by a GDHCN Participant as having the primary overall responsibility for the security, technical matters and systems infrastructure of this GDHCN Participant for the applicable Trust Domain including ensuring compliance with technical specifications. 

#### Letter of Application 
A formal application sent via a verifiable and secure channel from an Eligible GDHCN Participant to the GDHCN Secretariat to join the GDHCN Trust Network and participate within a particular Trust Domain.

#### Onboarding Process 
The processes required for an Eligible GDHCN Participant to join the GDHCN Trust Network. At the successful conclusion of the Onboarding Process, the Eligible GDHCN Participant shall be considered a GDHCN Participant. Sometimes simply referred to as “Onboarding”.

#### Health Professions Education Accreditation Agency 
An organization or organizational unit that is responsible for establishing and/or implementing procedures for accreditation of health professions education institutions.  See https://apps.who.int/iris/rest/bitstreams/1473223/retrieve and https://applications.emro.who.int/docs/em_rc50_r9_en.pdf?ua=1
 
#### Health Services Licensing Agency 
An organization or organizational unit that is responsible for establishing and/or implementing procedures for licensure, and the licensing of organizations or individuals to provide clinical, health system or public health services within their jurisdiction. Licensing comprises processes through which duly authorized governmental authorities, such as recognized professional organizations, grant permission to an individual or healthcare organization to operate or engage in a medical occupation or profession. See: https://apps.who.int/iris/rest/bitstreams/1473223/retrieve and https://cdn.who.int/media/docs/default-source/documents/health-systems-strengthening-glossary.pdf.

#### Public Health Agency 
An organization, or organizational unit, that is responsible for establishing procedures for and/or implementation of activities related to the protection, promotion, and improvement of public health within a specific jurisdiction or domain. May also be referred to as a Ministry of Health, Department of Health, or Public Health Authority.

#### Public Health Security Agency
An organization, or organizational unit, that is responsible for establishing procedures for and/or implementing required activities, both proactive and reactive, for minimizing the danger and impact of acute public health events that endanger people’s health across geographical regions and international boundaries.  See: https://www.who.int/health-topics/health-security.

#### Public Key Infrastructure (PKI)
The Public Key Infrastructure (PKI) is the trust model based on public key certificates and certificate authorities.  It is the means for publishing and distributing Trust Lists comprising the public keys that can be used to digitally verify the issuer of a Verifiable Digital Health Certificates.

####  Signing Certificate Authority (SCA)
Each GDHCN Participant maintains one or more Signing Certificate Authority (SCA), certificates of which are relatively long lived. The SCA issues public key certificates for the national, short lived, Document Signers.  The SCA acts as a trust anchor such that relying GDHCN Participants can use the SCA certificate to validate the authenticity and integrity of the regularly changing DSC certificates.

#### Holder
A Holder is an individual that has Verifiable Digtial Health Certificate in their possesion, received from an Issuer.  The Holder may choose to share the Verifiable Digital Health Certificate with a Receiver.

#### Receiver
A Reciever is a system authorized by a Trust Network Participant to receive from a Holder a Veritifable verify, and utilize the content within. 

#### Issuer
An Issuer a system authorized by a Trust Network Participant to generate Verifiable Digital Health Certificates which are provided to a Holder.   An Issuer is responsible for generating the content that is digitally signed within the Verifiable Digital Health Certificate.   In order to sign this content, an Issuer should either itself be a Document Signer or utilize a Document Signer service, as authorized by the jurisdicitonal policy.

#### Document Signer
A Document Signer utilizes the private key of a private-public key pair to digitally sign Verifiable Digital Health Certificates.  A single private key is expected to sign a large quantity of Verifiable Digital Health Certificates. The corresponding public key is referred to as a Document Signer Certificate (DSC). 

#### Document Signer Certificates (DSCs)
Document Signer Certificates are the public key certificates associated to Document Signers which are issued or recognized by the GDHCN Participant.

#### Encryption Key Certificate Governance 
The process and technical specifications regarding the management and use of encryption keys for Verifiable Digital Health Certificates, Public Key Infrastructure, and for securing connections with Trusted Services and the Trust Network Gateway.

#### Trust Domain
A Trust Domain consists of:
*	Defined use cases and business processes related to the utilization of Verifiable Digital Health Certificates; 
*	the open, interoperable technical specifications that identify or define the applicable Trusted Services and Verifiable Digital Health Certificates; and
*	a set of policy and regulatory standards describing expected behavior of GDHCN Participants in relation to operation of the Trusted Services and utilization of Verifiable Digital Health Certificates (e.g. data minimization, privacy, scope of use).

#### Trust Lists 
Universal verifier applications that support different credential standards are complicated by wide variability in format of the credential payloads, signatures, key formats, and key distribution methods. Public keys formats include x509 certificates, JSON Web Key Sets (JWKS), and DID documents. Signing key distribution methods include API gateways, hosted by issuer at a pre-defined URL, embedded in certificates, and by block-chain based resolution. Establishing root of trust by trust anchor or distributing trust list has been accomplished by API gateway, hosted URL, private dissemination and other bilateral sharing agreements.

While some variability is expected in an approach that preserves sovereignty, there are opportunities for alignment in key format and distribution for the sake of fostering interoperability. With that goal, we provide a unifying trust list format to assemble and share public key infrastructure for all credential specifications used by existing trust networks. Importantly, this format does not enforce a particular policy framework for participants of the trust network.

The GDHCN currently supports two means for key distribution of keys using trust lists
- [EU DCC API](https://worldhealthorganization.github.io/smart-trust/openapi/index.html) **required**
- [Decentralized Identifier (DID)](concepts_did.html) optional

#### Trust Network
A Trust Network is a means to authenticate the encryption public keys used by participants within a network to perform encryption services, verify digital signatures, establish secure connections between systems, and otherwise make use of encryption public keys. 
<p><strong>Trust Network</strong></p>
<img src="https://worldhealthorganization.github.io/smart-trust/trust_network.png" alt="Trust Network" style="width:70%"/>

#### Trust Network Gateway (TNG)
The Trust Network Gateway (TNG) is the open-source software and its IT operational infrastructure, utilizing open standards, for a Public Key Infrastructure and metadata management services which is used to operationalize one or more Trust Domains.  The Trust Network Gateway can be interacted with using the [API](https://worldhealthorganization.github.io/smart-trust/openapi) once a mTLS connection has been established.

##### Trust Network Gateway - Trust Anchor  (TNG<sub>TA</sub>) 
The Trust Anchor public key certificate of the TNG. The corresponding private key is used to sign the list of all SCA certificates offline.

##### Trust Network Gateway - Transport Layer Security  (TNG<sub>TLS</sub>) 
The TLS server public key certificate of the TNG.

#### Trust Network Participant (TNP)
Trust Network Participant (TNP) is an acronym used to label certificates, infrastructure, or technical artifacts made available by GDHCN Participants under the GDHCN Trust Network. 

##### GDHCN Participant Backend System
A GDHCN Participant's Backend System for managing the local part of information. The implementation of GDHCN Participant's Backend System is not in the scope of this document. A national backend can be also understood as a trusted party on-boarded in the Trust Network Gateway (can be a script, a proxy or a web server as well).

##### Trust Network Participant - Data Exchange Certificate Authority  (TNP<sub>DECA) 
The DSCA public key certificate of a GDHCN Participants (could be more than one).

The DECA public key certificate of a GDHCN Participants (could be more than one).
The DECA is a certificate which acts a trust anchor in the verification of the certificate chain for the DESCs issued by a Trust Network Participant"

##### Trust Network Participant - Document Signing Certificate Authority  (TNP<sub>DSCA) 
The DSCA public key certificate of a GDHCN Participants (could be more than one).
The DSCA is a certificate which acts a trust anchor in the verification of the certificate chain for the DSCs issued by a Trust Network Participant"
##### Trust Network Participant - Transport Layer Security (TNP<sub>TLS</sub>) 
The TLS client authentication public key certificate of a GDHCN Participant's Backend System.

##### Trust Network Participant - Transport Layer Security (TNP<sub>UP</sub>) 
The public key certificate that a GDHCN Participant uses to sign data packages that are uploaded to the TNG.

##### Trust Network Participant Verifier
A system utilized by a GDHCN Participant to verify the digital signature of a Verifiable Digital Health Certificate.


#### Trusted Service
A service (digital or otherwise) related to the issuance, management, verification, exchange, or other relevant processes, of Verifiable Digital Health Certificates which is defined using open, interoperable digital health standards.



#### Verifiable Digital Health Certificate
Verifiable Digital Health Certificate: A digital representation of a data set comprising a certificate or document, designed for a set of specific clinical or public health use cases which is defined using open, interoperable digital health standards; that contains within, or is associated to, a digital signature which can be verified by the public key of a public-private encryption key pair, and which is issued by a GDHCN Participant.

The specific Verifiable Digital Health Certificates are defined in the [Content Profiles](trust_domains.html)
{% endraw %}

---

<small>Source: [`input/pagecontent/concepts.md`](https://github.com/litlfred/smart-trust/blob/30d55b3630ac8a8937e1d98f7c060a4ae5a78ef0/input/pagecontent/concepts.md) at `30d55b36` · licence CC-BY-SA-3.0-IGO. Rendered from the IG's source by this site, not by the IG Publisher.</small>
