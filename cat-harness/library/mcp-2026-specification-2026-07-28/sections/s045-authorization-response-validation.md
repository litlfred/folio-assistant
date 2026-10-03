---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s045-authorization-response-validation
section_title: "Authorization Response Validation"
file: "docs/specification/2026-07-28/basic/authorization/index.mdx"
lines: 190-214
source_sha256: 99e7eeaecad53816
granularity: heading
---
### Authorization Response Validation

Before redirecting the user-agent, the client **MUST** record the `issuer` value from the selected authorization server's validated metadata document (see [Authorization Server Metadata Discovery](/specification/2026-07-28/basic/authorization/authorization-server-discovery#authorization-server-metadata-discovery)) and associate it with the same per-request record used to store the PKCE code verifier (and the `state` value, if used). The validation in this section depends on that recorded value being authentic; it provides no protection if the expected issuer was obtained from an unvalidated source.

MCP authorization servers **SHOULD** include the `iss` parameter in authorization responses, including error responses, as defined in [RFC9207 Section 2](https://datatracker.ietf.org/doc/html/rfc9207#section-2). Authorization servers that include the `iss` parameter **MUST** advertise this by setting `authorization_response_iss_parameter_supported` to `true` in their metadata ([RFC9207 Section 2.3](https://datatracker.ietf.org/doc/html/rfc9207#section-2.3)).

On receiving the authorization response, MCP clients **MUST** apply the validation in [RFC9207 Section 2.4](https://datatracker.ietf.org/doc/html/rfc9207#section-2.4) before transmitting the authorization code to any token endpoint:

| `authorization_response_iss_parameter_supported` | `iss` in response | Client action                                                                              |
| ------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------ |
| `true`                                           | present           | Compare to the recorded issuer using simple string comparison ([RFC3986 Section 6.2.1][1]) |
| `true`                                           | absent            | Reject the response                                                                        |
| `false` or absent                                | present           | Compare to the recorded issuer using simple string comparison ([RFC3986 Section 6.2.1][1]) |
| `false` or absent                                | absent            | Proceed                                                                                    |

[1]: https://datatracker.ietf.org/doc/html/rfc3986#section-6.2.1

The third row applies the local-policy provision in [RFC9207 Section 2.4](https://datatracker.ietf.org/doc/html/rfc9207#section-2.4): this specification compares a present `iss` against the recorded issuer regardless of metadata advertisement, to accommodate authorization servers that emit `iss` before updating their metadata.

A future revision of this specification is expected to upgrade authorization server inclusion of `iss` from **SHOULD** to **MUST**. Implementers are encouraged to emit and validate `iss` now to ease that transition; client rejection behavior on `iss` absence will continue to be keyed on `authorization_response_iss_parameter_supported` until that revision defines the upgrade path.

After decoding the `iss` value from the `application/x-www-form-urlencoded` response per [RFC 9207 Section 2.4](https://datatracker.ietf.org/doc/html/rfc9207#section-2.4), clients **MUST NOT** apply scheme or host case folding, default-port elision, trailing-slash, or percent-encoding normalization ([RFC 3986 Sections 6.2.2-6.2.3](https://datatracker.ietf.org/doc/html/rfc3986#section-6.2.2)) before comparison.

This validation applies equally to error responses - on mismatch the client **MUST NOT** act on or display `error`, `error_description`, or `error_uri`.
