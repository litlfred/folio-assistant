---
title: "Endpoints — WHO SMART Trust"
description: "Endpoints: a narrative page of the WHO SMART Trust IG, rendered from its source."
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

# Endpoints

{% raw %}
### Endpoints 

The following describes the active services and endpoints for the GDHCN Trust Network Gateway.

#### Operational Metadata
##### Trust Domains

The list of active trust domains is maintained in the [GDHCN Trust Domain Value Set](../artifact/ValueSet-Domains.html).


##### Key Usage Codes

The list of key usage codes is maintained in the [GDHCN Key Usage Value Set](../artifact/ValueSet-KeyUsage.html).


##### Participants

The list of onboarded Trust Network Participants is availabe in the  [GDHCN Participants Value Set](../artifact/ValueSet-Participants.html).



#### Trustlist Distribution Endpoints

THe following are the endpoints for the [GDHCN DID Trust List](concepts_did_gdhcn.html) for each of development (DEV), user-acceptence testing (UAT) and production (PROD) **environment*s:

|  Environment   |      Variant         | URL                                                                                     |
|---------|------------|--------------------------------------------------------------------------------------------------------------|
|  DEV   |  Embedded    | [https://tng-cdn-dev.who.int/v2/trustlist/did.json](https://tng-cdn-dev.who.int/v2/trustlist/did.json)         |
|  DEV  | Reference  | [https://tng-cdn-dev.who.int/v2/trustlist-ref/did.json](https://tng-cdn-dev.who.int/v2/trustlist-ref/did.json) |
|   UAT   |  Embedded   | [https://tng-cdn-uat.who.int/v2/trustlist/did.json](https://tng-cdn-uat.who.int/v2/trustlist/did.json)         |
|    UAT   | Reference  | [https://tng-cdn-uat.who.int/v2/trustlist-ref/did.json](https://tng-cdn-uat.who.int/v2/trustlist-ref/did.json) |
|  PROD  |  Embedded   | [https://tng-cdn.who.int/v2/trustlist/did.json](https://tng-cdn.who.int/v2/trustlist/did.json)         |
| PROD | Reference  | [https://tng-cdn.who.int/v2/trustlist-ref/did.json](https://tng-cdn.who.int/v2/trustlist-ref/did.json) |



#### Trust Network Gateway 


THe following are the endpoints for the [Trust Network Gateway](concepts.html#trust-network-gateway-tng) for each of development (DEV), user-acceptence testing (UAT) and production (PROD) **environment*s:

| Environment | URL |
|-------------|-----|
| PROD |	 https://tng.who.int |
| UAT |	 https://tng-uat.who.int |
| DEV |	 https://tng-dev.who.int |




#### Status Monitoring Dashboards

The following dashboards reflect the realtime status of key materials for each of development (DEV), user-acceptence testing (UAT) and production (PROD) **environment*s:


| Environment | Dashboard | 
|----------|--------------|
| DEV | [Country certificate expiry](https://tng-monitor-dev.who.int/grafana/d/dev-cert-expiry/dev-country-certificate-expiry) |
| DEV | [Country Onboarding Status](https://tng-monitor-dev.who.int/grafana/d/ddh0xqz9diio0c/dev-country-onboarding-status) |
| DEV | [Country Queries](https://tng-monitor-dev.who.int/grafana/d/dev-country-queries/dev-country-queries) |
| DEV | [Gateway Availability Dashboard](https://tng-monitor-dev.who.int/grafana/d/gw-availability/dev-gateway-availability-dashboard) |
| UAT | [Country certificate expiry](https://tng-monitor-uat.who.int/grafana/d/uat-cert-expiry/uat-country-certificate-expiry) |
| UAT | [Country Queries](https://tng-monitor-uat.who.int/grafana/d/uat-country-queries/uat-country-queries)  |
| UAT | [Gateway Availability Dashboard](https://tng-monitor-uat.who.int/grafana/d/c3ed3dbe-6cc0-4f16-8f0a-c7bcebd36420/uat-gateway-availability-dashboard) |
| PROD | [Country certificate expiry](https://tng-monitor.who.int/grafana/d/cert-expiry/prod-country-certificate-expiry) |
| PROD | [Country Queries](https://tng-monitor.who.int/grafana/d/prod-country-queries/prod-country-queries) |
| PROD | [Gateway Availability Dashboard](https://tng-monitor.who.int/grafana/d/gateway-availability/prod-gateway-availability-dashboard) |
{% endraw %}

---

<small>Source: [`input/pagecontent/endpoints.md`](https://github.com/litlfred/smart-trust/blob/30d55b3630ac8a8937e1d98f7c060a4ae5a78ef0/input/pagecontent/endpoints.md) at `30d55b36` · licence CC-BY-SA-3.0-IGO. Rendered from the IG's source by this site, not by the IG Publisher.</small>
