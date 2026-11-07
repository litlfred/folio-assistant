---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s007-1-3-2-an-example
section_title: "1.3.2. An Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 62-72
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### 1.3.2. An Example

A very common scenario will be a user taking a photograph with their C2PA-enabled camera (or phone). In that instance, the camera would create a manifest containing some assertions including information about the camera itself, a thumbnail of the image and some cryptographic hashes that bind the photograph to the manifest. These assertions would then be listed in the Claim, which would be digitally signed and then the entire C2PA Manifest (see [Figure 2, “Example C2PA Manifest of a Photograph”](#Photo_Manifest)) would be embedded into the output JPEG. This C2PA Manifest would remain valid indefinitely.

![Example C2PA Manifest of a Photograph](https://kroki.io/plantuml/svg/eNq1Vk1v2zAMPce_guthOTXAhh2LAm26DRu2tqiBXYZiYGQ61qIPQ5LbGUP_-yi5bZxMbosB0yWRxPdEPlE0C-AxB1TK3nrQ8pc0a7hBJ23nwa5-kggepAEEzzuKoJK4dqiLiEuoHwOoKAam0EgPoXOG4XXNUwLsgtUYpIC1s10bT1j1MF_MB2KDmhLYU0gT36Kgklp0GKwDYw09sDeyosTpWxvGa2h6IN2GPjpg1n6xWBSzsX0gRzb0LW3PS5tCOqFG84FEk16R88UsrW3BD3740KsYdHJ7I030VUNFNXYqfLAmnPMhUNrOCf5BFuPS2WK2NRVWtxyXCSUzETjWGaO-iVFRHSBYcHLdBFY87kprih0CdNXRkXjb4vEx_E6w2cq6itzSKlbtsnMt081mKxSbqLupho0veEOGzYrZXZZQTxB-dEQmxxedvN_MM96ICUarqhwhaWuWjaxrO0E5RXiGbvNNWkXhibhPVeebKVfR55kZRFOxD3s5vn9hW_Y4KaRQeb4rqqboLqXZTNJNuHfhOBUpT_rVCoFcCgbOOZwN5eBVYonEEFMS0MPBVzSyJh-g5FdMB7CXrSOA3gUMpnrXdGQufDKH58ZSodRQyrVBLkj0rP1w7kiV8Xh8obAs4Tsrw-Po9Yb6Y1helO9ZiLUMqLbH_cVwvbNyV2RDU9nQhkie9Fo95zU7nYMfvRa2Ig7i9OKKy5rrRNLqVoaG0TUXPiPIZ6FcoWJpPfGeXKxPfC2mSkt7yv-TFDjc8iP7OI0wf0cJeRCzbKEpYIUBo_2E9a4-J28mBBqL9Lm8OD_8cravU8WHSRU_eJMMURXB3wSH0Hmqkna4Gb5NbWODnURGTWWYe_h4WYKyAqMYi6z59V-re9JuRdpbi5KFptMrw4EsRC7dXq7k2yeVlBrXLOWpNOh6-BRnXLgD_oeIGvTNImbBE0_nZSG9e0Fy7L0gwV0AShO7hFQsZtLU1ul0fYAr24V4-fd7wvVtsFxJ24bbpOg3eVhJU23h968t0nLb8PIEyM-Gf3cP_Ux6boffudupyFynvuPwONWjRwMuTTkDX_wBH27CdQ==?id=Photo_Manifest)

Figure 2. Example C2PA Manifest of a Photograph

A Manifest Consumer, such as a C2PA validator, helps users to establish the trustworthiness of the asset by first validating the digital signature and its associated credential. It also checks each of the assertions for validity and presents the information contained in them, and the signature, to the user in a way that they can then make an informed decision about the trustworthiness of the digital content.

<a id="_design_goals"></a>
