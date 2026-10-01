---
title: "Details of the Onboarding Process — WHO SMART Trust"
description: "Details of the Onboarding Process: a narrative page of the WHO SMART Trust IG, rendered from its source."
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

# Details of the Onboarding Process

{% raw %}
####  Details of the Onboarding Process

This document describes the standard onboarding process (so called Future Onboarding Process - FOP).

**Note:** In the embedded image the following relabels apply:

* DCCG -> TNG

* CSCA -> SCA

* DCC -> VDHC (Verifiable Digital Health Certificate)

* NB -> TNP

It is highly recommended:

- **To use certificates issued from a public CA which follows the CAB Forum Rules**

- **Not to reuse any certificates across the different staging environments**


In the following description the required steps are divided into three sections:

**[1]** - **[29]** - Application and Verification  
**[30]** - **[59]** Setup  
**[60]** - **[End]** Participant Onboarding


<img src="https://worldhealthorganization.github.io/smart-trust/OnboardingProcess_Full.png" style="float:none; margin: 0px 0px 0px 0px;"/>

##### Application and Verification

**[1]** The eligible Trust Network Participant (TNP) has to submit its Statement of Interest [link to the form. [Document 5] ] to gdhcn-support@who.int .

**[2 – 3]** WHO validates all provided data and verify that such a data follows WHO compliance with Trusted Network Terms of Participation (TOP 0 – 3) https://smart.who.int/trust/concepts.html as well as: Participant´s eligibility criteria, governmental entity/health agency, contact details of approvers and individuals. [See Elegibility Criteria]. [Document 16]

\< see chapter 9.5 in TOP details \> [Document 6]

**[4 - 5]** In case no compliance with WHO governance rules is given, the application is rejected. The rejection is communicated to the TNP by email.

**[6]** TNP needs to modify the data they shared with WHO and re-apply it.

**[7]** If the WHO’s technical team gives a positive opinion, the eligible Trust Network Participant will be invited to start the onboarding process. The following information is included:

1.  The necessary technical specifications and configuration information to connect the local backend systems to the WHO TNG
    1.  The request to provide the necessary information to be onboarded to the different environments (UAT, PROD, DEV (optional))
    2.  The request to comply with the Trust Network Terms of Participation

**[8]** The TNP receives the confirmation and necessary technical information to connect to the TNG and register the certificates.

For a successful connection to the Trust Network Gateway there are the following steps [9] – [11] to prepare:

**[9]** Create certificates per environment. Details can be found here: https://smart.who.int/trust/concepts_CertificatePreperation.html

1) Certificates must be prepared for all environments (self-signed allowed) following the requirements in Certificate Governance - Authentication: TNPTLS - Upload: TNPUP - SCA(s): TNPSCA

**Note** The participant must provide the CA certificate as well as the TLS certificate.

If the participant uses a self-signed TLS certificate, the TLS certificate can simply be copied and renamed to CA.crt.

In all other cases, the participant provides the appropriate CA certificate.




2) Prepare public keys in PEM format in your private GitHub repository (see [11]) dedicated to the used environment keys.

3) The prepared public keys must be tagged by the generated GPG keys:

1.  Tag the version of your latest information by using git tag + signing commands either from terminal or developer IDE. Please note that an update in GitHub web desktop itself is not working, because the platform will use an intermediate key.
2.  The bot user clones the latest tag of your private repo and verifies the signature of the tag against the onboarded GPG keys
3.  After verification of the provisioned material, the content will be taken over for the participant

**[10]** Create the GPG keys per environment and per each user needed.

Follow the instructions to create a key: https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key

Use Algorithm RSA or EC with minimum key length of 4096 bit (RSA) or 256 bit (EC).

**[11]** The TNP creates the private GitHub repositories per environment

1.  Create a private git repository on GitHub.
2.  Prepare the following information to be provided in the onboarding request:
    -   Environment repository URL’s (all private to hide uploader's identity) (DEV (optional), UAT, PROD)
    -   Invite the WHO bot user to the private repository (with read rights). The bot user is: [tng-bot](https://github.com/tng-bot) for PROD and [tng-bot-dev](https://github.com/tng-bot-dev) for DEV (optional) and UAT environments.

**[12]** Upon GitHub repository creation and invitation to GitHub bot user to WHO is sent, validity for accepting this invitation is 7 days by default. If no action is taken it loses validity.

**[13]** Invitation for GitHub bot user must be accepted by WHO within 7 days since invitation was emitted.

**[14]** TNP is ready for onboarding according to WHO requirements and governance and has collected the following information in the Letter of Application [Document 16]:

- the URL of the private GitHub repositories for each environment (UAT, PROD, DEV (optional))

- the GPG keys per used environment and authorized/responsible person

- 3-digit ISO Participant code

- The contact details (including email address) of the people authorized to provide the certificates of the TNPThe TNP exchanges the Letter of Application to WHO.

**[15]** The Letter of Application is received and processed by WHO. The TNP .

**[16 - 17]** The verification and confirmation of the named people that are allowed to provide the key material for the TNP takes place through either of different channels:

1.  Through a Face to Face meeting
2.  Through Diplomat Channel signed confirmation

    .

When the Letter of Application is received, identification of individuals take place with passport, finger printing or similar.

**[18]** WHO acknowledges the Letter of Application and proceeds to validate the provided data. At this stage verification of rules compliance takes place. Verification is in detailed according to process and individuals involved in the request.

**[19]** In case the compliance rules verification failed, WHO need to inform the TNP by email.

**[20]** The TNP receive an email with information indicating that validations failed. Corrective activities have to be taken.

**[21]** WHO is checking for each provided GPG key, if the given email address is included in the GPG key.

**[22]** Validate that GPG key matches cryptographic/governance criteria

- Key length (min. 3072 bit for RSA and min. 256 bit for ECDSA)

- mail address in GPG key must match with the provided mail address in the Letter of Application

**[23]** WHO is collecting the required information to be provided to the operations team (OPS):

- GPG keys of all confirmed people and for all requested environments (UAT, PROD and optional DEV)

- the URL's of the applicant private GitHub repositories

- 3-digit ISO participant code of the TNP

- the confirmation that the invitation for the GitHub bot users has been accepted

##### Setup

**[30]** The collected onboarding information is sent to the operations (OPS) team. The onboarding (OB) team is informed as well.

**[31 - 35]** The onboarding data is taken over to the configuration files by the OPS team to automate the GitHub processes. As a result, a Pull Request (PR) is created. Dependent on the environment, the subsequent steps differ.

**[38]** For UAT (and optional DEV), an auto signing process signs the keys.

**[36 -37]** For PROD environment, the PR is verified by WHO. After successful verification, the air-gapped signing process is performed to sign the keys. Follow to **[47]**

**[39]** The service provider checks the PR as well.

**[40 - 41]** In case the verification failed, WHO is informed about the outcome.

**[42]** Correction.


**[43]** In case the verification was successful the whitelisting of the certificates is initiated.

**[44 - 46]** and the participant will be informed that the preparation has been completed successfully.

**[47]** TSI Verification of Pull Request in PROD Environment.

**[48 - 50]** In case Pull Request failed, TSIS to communicate to Participant for them to Correct



#### Participant Onboarding

**[60]** The participant is connecting to UAT environment and the following steps has to be performed to check the connection:

<details> 

<summary> 1) check the connectivity with the following command:  </summary> 
input:

curl -v https://tng-uat.who.int/trustList --cert TLS.pem --key TLS_key.pem 

You should see an output like:

\`\`\`

[

{

"kid": "+jrpHSqdqZY=",

"timestamp": "2023-05-25T07:55:21Z",

"country": "XC",

"certificateType": "UPLOAD",

"thumbprint": "fa3ae91d...",

"signature": "MIAGCSqGSIb3D...",

"rawData": "MIIErTCCA5WgAwIBAgII..."

}

]

\`\`\`

</details> 

2) Test the other Trustlist Routes in the same style (e. g. with DSC/SCA/Upload/Authentication…)

**[61]** In case the connection fails, some corrective actions must be performed to analyze and solve the issue(s). The operations team is supporting the TNP.

**[62]** After the connection to the TNG is established the participant can start the dry run test on UAT.

This test includes the listed steps:

a) Upload one or more DSCs to the TNG

b) Delete at least one DSC again (revocation of a DSC)

c) Optional: Upload it again (if it is required for further testing)

d) Download the trust list from the TNG gateway [(API)](https://worldhealthorganization.github.io/smart-trust/openapi)

e) Provide sample VDHC s to be verified by the service provider

f) Validate some sample VDHC 's to ensure the validation implementation is working fine

**[63]** After executing all required steps, the participant must provide the test results to the onboarding team.

**[64 - 65]** The onboarding team checks the results and provides feedback to the participant.

**[66]** In case of any issues additional corrective actions are bespoken and solved with the participant.

**[67]** If the Dry Run Test has passed successfully, the whitelisting of the certificates in the gateway (PROD environment) continues.

**[68 - 69]** The Onboarding team informs the TNP to be ready to connect to TNG PROD environment.

**[70]** The participant is allowed and enabled to connect to TNG PROD environment (for detailed information see [60]).

**[71]** In case the connection fails, some corrective actions must be performed to analyze and solve the issue(s). The operations team is supporting the TNP.




**[72]** After the connection to the TNG PROD is established the Production Readiness Test can start. 

<details> 
<summary> This test includes the listed steps: </summary> 

a) Create a Document Signer Certificate (DSC) and sign it by the SCA


b) Create an CMS package with the following command: 

Input:

openssl x509 -outform der -in cert.pem -out cert.der

openssl cms -sign -nodetach -in cert.der -signer signing.crt -inkey signing.key -out signed.der -outform DER -binary

openssl base64 -in signed.der -out cms.b64 -e -A

Note: cert.der is your DSC, signing.crt is the TNPUP


 c) Upload the CMS package to the gateway 

Input:

curl -v -X POST -H "Content-Type: application/cms" --cert TLS.pem --key TLS_key.pem --data @cms.b64 https://tng-uat.who.int/signerCertificate  



 d) Download the trustlist again and check if your DSC is available. <


**Note**: Some versions of curl don’t attach the client certificates automatically. This can be checked via curl –version. Ensure that the used version is linked to OpenSSL. Especially under Windows (https://curl.se/windows/):  
  
OpenSSL Test Example (working)


e) Delete at least one DSC again (Revocation)

f) Upload it again in case the DSC is required

</details> 

**[73 - 74]** After executing all required steps, the participant must provide the test results to the service provider by mail.

**[75]** The service provider checks the results.

**[76]** and in case of any issues additional corrective actions are bespoken and solved with the participant.

**[77 - 80]** After passing the Production Readiness Test, the participant is allowed to use the TNG PROD environment. A confirmation email is sent to the participant and to WHO with the confirmation about the successfully passed test and the completion of the onboarding process.
{% endraw %}

---

<small>Source: [`input/pagecontent/concepts_onboarding_process_full.md`](https://github.com/litlfred/smart-trust/blob/30d55b3630ac8a8937e1d98f7c060a4ae5a78ef0/input/pagecontent/concepts_onboarding_process_full.md) at `30d55b36` · licence CC-BY-SA-3.0-IGO. Rendered from the IG's source by this site, not by the IG Publisher.</small>
