---
title: "Home — WHO SMART Trust"
description: "Home: a narrative page of the WHO SMART Trust IG, rendered from its source."
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

# Home

{% raw %}
### Summary
  
  
<a name="scope">  </a>

<a name="Overview"> </a>

    
<p>
      This guide describes the specifications and on-boarding procedures for WHO's Global Digital Health Certification Network (GDHCN).  The GDHCN is a mechanism to support verification of health documents and certifications that are exchanged between participants of the GDHCN.  These health certifications may include COVID-19 certificates, routine immunization cards, and home-based records consistent with International Patient Summary standards. This mechanism provides means of harmonizing global health protocol standards and establishing a system for recognition of digital certificates for continuity of care and at point of entry.  The GDHCN is designed to leverage existing investments by jurisdictions that were made under the COVID-19 response and provide the digital health infrastructure needed for resiliency in future epidemic and pandemic responses.
    </p>


    
<p>
      The GDHCN is a digital reflection of the trust WHO already has with Member States. The GDHCN is a digital trust network is based on proven <a href="concepts.html"> concepts</a> which are used to describe the specifications and mechanisms for establishing trust, which allow eligible participants to establish new <a href="concepts.html#trust-domain">trust domains</a> for exchange of verifiable digital health records. Eligible participants of the trust network may apply to join by following an <a href="concepts_onboarding.html">on-boarding process</a>.   The GDHCN is operated under the <a href="https://worldhealthorganization.github.io/smart-trust/GDHCN_Administrative_and_Operational_Framework.pdf">GDHCN Administrative and Operational Framework</a>.
    </p>


<div style="display:block">
<p><strong>Trust Network</strong></p>
<img src="https://worldhealthorganization.github.io/smart-trust/trust_network.png" alt="Trust Network" style="width:70%"/> 
</div>
    
#### Background &amp; Purpose
<a name="Background"> </a>
    
    
<p>
      In response to COVID-19, Governments and organizations across the world have developed and adopted standards and technologies to create, present, and verify digital vaccination and test credentials. However, a global technical framework to enable convenient use and interoperability of these credentials between systems – while also allowing domestic autonomy over their use – does not exist yet and is critically needed.      
    </p>

    
<p>
      The WHO Global Digital Health Certification Network is a collection of components that are used to verify interoperable digital health documents or certificates.  This system of comprised of three main features:
    </p>

    
<ul>
      <li>A collection of well defined digital health documents that are issued and verified by members of the GDHCN </li>
      <li>A Public Key Infrastructure (PKI) that is used for the publishing and distribution of public keys used for verification of digital signatures of the digital health documents.
      </li>

      <li>A Knowledge Library used to maintain metadata including terminology codings, product codes and business rules that are used to provide semantic interoperability of these digital health documents</li>

    </ul>

    
    
<p>In addition to verifying and validating COVID-19 certificates, a global digital health trust network such as the GDHCN can:</p>

    
<ul class="">
        <li>Establish trust of digitally signed clinical algorithms published by WHO through the SMART Guidelines work.</li>
        <li>Allow for a global product catalogue of trusted medical products and devices.</li>
        <li>Ensure information about a patient can be accessed and trusted regardless of one is in the world.</li>
        <li>Support health systems resiliency to address future outbreaks in a world.</li>
        <li>Empower individuals to manage their own health and well-being.</li>
    </ul>


    
<p>The interoperable exchange of health information in a trusted environment is a complex task with an increasingly large number of stakeholders (e.g. public health agencies, accredited labs, border control organizations, institutions authorized to verify) that need to ensure that data is transferred safely and securely, that the health content is interoperable, and that information is understandable and actionable. This guide details how to utilize a global technical framework to allow interoperability of health credentials between
systems, while preserving domestic autonomy over their use. </p>


    
<p>Achieving global interoperability of health certificates does not require that all jurisdictions use the same standard. Interoperability can also be achieved when there are pre-arranged mechanisms in place so that certificates issued by one jurisdiction are accepted in another. A number of services and technical artifacts have been developed to address particular criteria for establishing interoperability and a system of trust including:</p>

    
<ul class="">
        <li>Data models, transformations and vocabulary definitions that allow exchange of health data between various standards formats, preserving a jurisdiction's autonomy regarding domestic processes while allowing re-issuance and mutual recognition of credentials between jurisdictions</li>
        <li>Standard specifications for exchanging public keys between various networks for verifying digital signatures on health credentials</li>
        <li>A global trust registry and federated public key infrastructure solution that provides technical interoperability and technical governance between regional trust networks</li>
        <li>Workflows for creating, sharing and executing business rules that evaluate public health policies against health data for cross-border or port of entry requirements</li>
        <li>Open source tools and technical guidance to reduce the burden of implementing the technical infrastructure to participate in the federated trust network, including open source trust network infrastructure for jurisdictions to implement their own regional trust networks</li>
    </ul>

    
##### Circular letter to Member States
On Friday, September 29, 2023, WHO’s Director General sent a circular letter to all Member States encouraging participation in the GDHCN.

* <a href="https://worldhealthorganization.github.io/smart-trust/C.L.38.2023%20(Global%20Digital%20Health%20Certification%20Network)%20Arabic.pdf">C.L.38.2023 (Global Digital Health Certification Network) - Arabic</a>
* <a href="https://worldhealthorganization.github.io/smart-trust/C.L.38.2023%20(Global%20Digital%20Health%20Certification%20Network)%20Chinese.pdf">C.L.38.2023 (Global Digital Health Certification Network) - Chinese</a>
* <a href="https://worldhealthorganization.github.io/smart-trust/C.L.38.2023%20(Global%20Digital%20Health%20Certification%20Network)%20English.pdf">C.L.38.2023 (Global Digital Health Certification Network) - English</a>
* <a href="https://worldhealthorganization.github.io/smart-trust/C.L.38.2023%20(Global%20Digital%20Health%20Certification%20Network)%20French.pdf">C.L.38.2023 (Global Digital Health Certification Network) - French</a>
* <a href="https://worldhealthorganization.github.io/smart-trust/C.L.38.2023%20(Global%20Digital%20Health%20Certification%20Network)%20Russian.pdf">C.L.38.2023 (Global Digital Health Certification Network) - Russian</a>
* <a href="https://worldhealthorganization.github.io/smart-trust/C.L.38.2023%20(Global%20Digital%20Health%20Certification%20Network)%20Spanish.pdf">C.L.38.2023 (Global Digital Health Certification Network) - Spanish</a>

#### Audience
<a name="Audience"> </a>

    
<p>This guide describes expected workflows for potential actors in a trust ecosystem, namely:</p>

    
<ul class="">
        <li>Issuers that provide verifiable health credentials to individuals,</li>
        <li>Verifiers that consume verifiable health credentials provided by individuals, and</li>
        <li>Trust Networks that establish trust relationships and policies between issuers and verifiers.</li>
    </ul>

    
<p>The audience for this guide includes decision makers, analysts and technical assets at potential individual issuers,
existing trust networks or potential verifiers who may participate in the federated trust network. Stakeholders include Member States, regional networks, and standards development organizations.</p>





  
#### Participants
 
<a name="participants"> </a>


<div style="display:block">
  <p><strong>Trust Network Participants</strong></p>
<img src="https://worldhealthorganization.github.io/smart-trust/Participant_Onboarding_Status.png" alt="Trust Network Participants" style="width:85%"/> 
</div>

  
<br/>

  
#### Available Trust Domains


<p>The codes for the GDHCN Trust Domains are contained in the <a href="../artifact/ValueSet-Domains.html">GDHCN Trust Domain Value Set</a> and are described in more detail <a href="trust_domains.html">here</a>.

</p>  
  
#### Ethical Considerations and Data Protection Principles

  
<p>As with any digital solution, there are ethical considerations, such as potential impacts on equity and on equitable access, and data protection principles that need to inform the design of the technical specifications, as well as provide guidance on how resulting solutions can be ethically implemented. The following <a href="ethical_principles.html">page</a> discusses some key ethical considerations and data protection principles that Member States are encouraged to – and, where they have legal obligations, must – include in their respective deployments of digital solutions. These ethical considerations and data protection principles have also informed the design criteria for WHO’s SMART Guidelines and for the utilization of the WHO’s Global Digital Health Certification Network. </p>

  
    
  
  
<a name="feedback"> </a>

  
#### Feedback
  
<p>
    Feedback specific to this Implementation Guide can provided through:
  </p>

  
<ul>
    <li>Frequently asked questions can be viewed <a href="faq.html">here</a></li>
    <li>Clicking on one of the Feedbacks link to the right of any section header</li>
    <li>Sending an email to <a href="mailto:gdhcn-support@who.int?subject = IG Feedback">gdhcn-support@who.int</a></li>
    <li>Creating an issue on GitHub <a href="https://github.com/WorldHealthOrganization/trust">trust repository</a></li>
  </ul>


  
#### Community
  
<a name="Community"/>


<p>Sign up on <a href="https://chat.fhir.org/">chat.fhir.org</a> community and follow the stream who-smart-guidelines for questions, queries and chats related to WHO SMART Guidelines</p>
<a href="https://chat.fhir.org/">chat.fhir.org</a>
<p>WHO also hosts weekly calls on authoring and implementing WHO SMART Guidelines where participation is welcome. Please send an email at <a href="mailto:gdhcn-support@who.int?subject = SMART Trust FHIR IG">gdhcn-support@who.int</a> in order to get invited.</p>
<a href="mailto:gdhcn-support@who.int?subject = SMART Trust FHIR IG">gdhcn-support@who.int</a>

  
  

#### Disclaimer
  
<a name="disclaimer"> </a>


  
<p>    The specification herewith documented is for the WHO Gloa demo working specification, and may not be used for any implementation purposes. 
    This draft is provided without warranty of completeness or consistency, and the official publication supersedes this draft.
    No liability can be inferred from the use or misuse of this specification, or its consequences.
  </p>
{% endraw %}

---

<small>Source: [`input/pagecontent/index.md`](https://github.com/litlfred/smart-trust/blob/30d55b3630ac8a8937e1d98f7c060a4ae5a78ef0/input/pagecontent/index.md) at `30d55b36` · licence CC-BY-SA-3.0-IGO. Rendered from the IG's source by this site, not by the IG Publisher.</small>
