---
title: "Frequently Asked Questions — WHO SMART Trust"
description: "Frequently Asked Questions: a narrative page of the WHO SMART Trust IG, rendered from its source."
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

# Frequently Asked Questions

{% raw %}
### FAQs

#### Participation and Roles

##### Who can serve as the Application Form Representative for GDHCN participation?
A designated public health authority from a WHO Member State, with decision-making authority regarding participation in the GDHCN, should be the representative.

##### What is the role of the Business Owner Contact?
A senior official with decision-making powers, involved in strategic decisions but not daily operations.

##### Who should be the Technical Contact?
An individual responsible for addressing technical inquiries and issues during the project's lifecycle.

##### What does the Legal Contact do?
Manages legal aspects, including regulatory compliance and contractual matters related to GDHCN participation.

#### Financial Information

##### Are there any fees associated with participating in the GDHCN?
Participation in the GDHCN is currently free, supported by existing WHO funding.

#### Technical Requirements and Infrastructure

##### How will the transition to WHO's product catalog management tool affect vaccine codes?
The tool aims to manage vaccine codes effectively, addressing the complexities of medical terminology coding.

##### Can we continue participation in the UAT environment without moving to production?
Yes, continuing in the UAT environment is possible and does not hinder future transition to the production environment.

##### How does GDHCN support open-source collaboration?
Through platforms like GitHub, enabling community contributions to enhance technical specifications and documentation.

##### How is GDHCN integrating existing EU DCC technical specifications?
By incorporating EU DCC specifications like APIs for key access, business rules, and value sets, ensuring compatibility.

##### What are the plans for future developments and maintenance of the GDHCN infrastructure?
Future developments will be guided by WHO, focusing on compatibility with existing systems and ensuring security and backward compatibility.

#### Transition and Onboarding

##### How is the transition of technical assets from EU DCC to GDHCN managed?
This includes moving APIs and sets into GDHCN specifications, with WHO ensuring a smooth integration.

##### What is the onboarding process for new applications not previously connected to EU DCC?
It involves verifying technical connections and compatibility with existing systems, especially regarding TLS certificates.

#### Security and Compliance

##### How is the key material and exchange process managed within GDHCN?
With detailed definitions for key materials, ensuring clarity and visibility in the key exchange process, closely resembling EU DCC definitions.

##### How are security-related incidents managed during the transition to WHO governance?
The focus is on addressing security incidents, with no changes to the repository unless necessary for security reasons.

#### Certificate Management

##### What is the current policy on TLS certificate renewal for national backends?
The policy is under review, with discussions on alternatives to the three-month renewal policy, including longer expiry times or self-signed certificates.

##### Can WHO host networks use self-signed TLS certificates?
The possibility of WHO using self-signed certificates with extended expiry times is under discussion.

##### What is the process for proposing alternatives to the current TLS certificate policy?
Proposals for alternatives, like extended expiry times, are being considered to alleviate concerns with short renewal policies.

###!## How does WHO ensure trust without relying solely on the TLS certificate?
Trusting the CA rather than the certificate itself may provide a solution to frequent renewals.
{% endraw %}

---

<small>Source: [`input/pagecontent/faq.md`](https://github.com/litlfred/smart-trust/blob/30d55b3630ac8a8937e1d98f7c060a4ae5a78ef0/input/pagecontent/faq.md) at `30d55b36` · licence CC-BY-SA-3.0-IGO. Rendered from the IG's source by this site, not by the IG Publisher.</small>
