---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s175-13-4-2-time-stamping-authorities
section_title: "13.4.2. Time Stamping Authorities"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 2240-2252
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 13.4.2. Time Stamping Authorities

A validator shall maintain a list of trust anchor configurations for Time Stamping Authorities (TSAs), which shall be separate from the lists [for C2PA signers](#_c2pa_signers).

An individual TSA trust anchor configuration shall include the X.509 certificate for that trust anchor. Additionally, the configuration should include a "notBefore" date/time, before which there is no trust for that trust anchor configuration. If the trust for that trust anchor configuration has ended, it should also include a "notAfter" date/time, after which there is no trust for that configuration.

If a "notBefore" date/time is present, the trust anchor configuration shall not be used for time-stamps asserting times before that date/time. If a "notAfter" date/time is present, the trust anchor configuration shall not be used for time-stamps asserting times after that date/time.

The list shall include, but need not be limited to, the Time Stamping Authority trust anchors provided by the C2PA (i.e., the C2PA TSA Trust List).

In addition to the list of trust anchors provided in the C2PA TSA Trust List, a validator should allow a user to configure additional TSA trust anchor stores, and may provide default options or offer lists maintained by external parties that the user may opt into to populate the validator’s trust anchor store for Time Stamping Authorities.

<a id="_private_credential_storage"></a>
