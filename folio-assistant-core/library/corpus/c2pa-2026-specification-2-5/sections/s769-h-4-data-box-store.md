---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s769-h-4-data-box-store
section_title: "H.4. Data Box Store"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 16157-16170
source_sha256: ff401df19d1fde8c
granularity: heading
---
### H.4. Data Box Store

> **IMPORTANT:**
> This section is retained for historical purposes. The concept of a data box has been deprecated in favor of a standard assertion that uses a standard JUMBF Embedded File content type box to contain the data. For more information about the embedded data assertion, see [Section 16.6.6, “Embedded Data”](#_embedded_data).

A C2PA Data Box Store is a JUMBF superbox that shall contain only one or more CBOR Content Type boxes (`cbor`). It shall not contain any other type of JUMBF box or superbox. It shall have a label of `c2pa.databoxes` and a JUMBF type UUID of `63326462-0011-0010-8000-00AA00389B71` (`c2db`).

The CBOR Content Type boxes shall have a label of `c2pa.data` (for [data boxes](#_data_boxes)).

![C2PA Manifest Store with Data Boxes](https://kroki.io/plantuml/svg/eNqdlE1P20AQhs_2r5jmUMqBSKU9IYREEqiEgCCicqlQM15Pkm32w9pdp0RV_3t3105swEZtfXC0OzPPvDMZTwr-OQAUQv-0IPkTV0vYoOG6tKCzH8ScBa4AwXqLIMg5Lg3KNMTFqO9VUJpWJLfiFlxplA9fLPyRAEunJTrOYGl0WYQM2RYOhgcVWKGkGGzJxYMtkNGMCjTotAGlFe3oK55TZNpCu_Ydqi2QLNw2CFBLOxwO06Tt78iQdtuCmnzRyLhhonWuIJJkRsamSbxrgnc6rNuKUHSUveYqaJWQ0wJL4S61crc-Ccx0aZj_Qd-MO6PTpHFlWha-LuVmnkRgfJ8x9DcSBS0cOA2GL1fOdzxYuVbpMwCa_PSUHRd4dga_YliSaZOTGWvhu3ZXmsLjkiRDtg59V3lluMYNKe-WJr87gbIH-MUQqS5eEFkbu4kb1kPUIu8CktRqvOKLhe5B9gEnaNYPXAtyb9Q9EqVd9UlF2032QdRXe2Xr4v0PbbzF3kYy0c27p7wPd8fVuhfXI29q_ChSN_RGM4Z-FVTMA5hU6-BdpAQwhJEEtDC4QcUXZB3M_FdMcARXX29Gl_BhHjzmhwN4Mb4tgnxBCDES53ACc79ZTtqAelyTJKljmY2xY4FcwowvFfptRBHBbESE8KHdWXaguhselOy_RhjP4Fu8Sk7fr2l7BuPp7MIXveQORUOPLo_hHbrSSBEtKVGAaASwcDvcHM8PoeepdYkuXY0spnPyukbT-x4VWDXk3FoyYY3U_0fQg62G4M5udx3BpiMRNYh-khzm6DDKa7m01J1_3Mnb67uaTW-PrifVbdRYi2yj3aqUmUIuqua0-9CT6LiViEtc-kwXfnPnOeVwyQW9nQ_jWrXQ_7yR-tOrGvf_QW_CFdrVMDbv3_N9_ot8VdI2sJ6BPIszMAmpR_qpNQJ51oxAUJbpJ9pPQJ49-zqfQQf7kODbWskvn6aGh3F3DV1Rj69u6_KaY_X-A3SJeWM=)

Figure 21. C2PA Manifest Store with Data Boxes

<a id="_action_c2pa_removed"></a>
