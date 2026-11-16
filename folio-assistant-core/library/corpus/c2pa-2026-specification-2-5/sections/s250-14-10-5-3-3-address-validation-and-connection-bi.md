---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s250-14-10-5-3-3-address-validation-and-connection-bi
section_title: "14.10.5.3.3. Address validation and connection binding"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 3462-3479
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 14.10.5.3.3. Address validation and connection binding

Before opening a connection, a validator may resolve the target host to one or more candidate IP addresses and check each candidate against an address policy. Under such a policy, unless the operator has explicitly configured the validator to permit a particular address or range, a validator may disallow a candidate address that is a loopback address (IPv4 `127.0.0.0/8` or IPv6 `::1`), a link-local address (IPv4 `169.254.0.0/16` or IPv6 `fe80::/10`), a private-use address (IPv4 `10.0.0.0/8`, `172.16.0.0/12`, or `192.168.0.0/16`), a unique-local address (IPv6 `fc00::/7`), or any other address not routable on the public internet. If every candidate address is disallowed, the validator may abort the retrieval.

> **NOTE:**
> Operator configuration allows a validator deployed within an enterprise, where assets and their C2PA Manifests reference resources on a private network, to retrieve those resources, while validators that process content from untrusted sources retain the restriction. The restriction exists because the URI being retrieved is supplied by the C2PA Manifest author rather than by the operator of the validator.

Because checking a resolved address is not sufficient on its own, a validator that applies an address policy may also establish the connection to one of the specific candidate addresses that passed the check, and may verify that the address of the peer the connection was actually made to is the same address that was checked, before sending any request data. Such a validator may treat any address resolved by a separate, later name resolution — whether performed by the validator itself, an underlying network library, or an intermediary such as a forward or transparent proxy — as a candidate address subject to the same policy, applied to the address actually connected to rather than to a previously checked hostname.

Where the operator has explicitly configured the validator to perform retrieval through a proxy that resolves names on the validator’s behalf, the validator may delegate the name resolution, address checking, and connection binding described in this section to that proxy, which can apply an equivalent address policy to the address to which it actually connects. The address of such a proxy, which can be a loopback or private-use address, is not a candidate address and is not subject to the address policy described in this section.

> **NOTE:**
> Some tunnelling services and local resolvers return synthetic addresses drawn from private-use or other non-publicly-routable ranges in place of the target’s actual address. An operator using such a service can permit the relevant range through the operator configuration described above.

> **NOTE:**
> Retrieving external data can disclose, to network observers and to the operators of the DNS resolvers and servers involved, the hostname being requested and therefore the validator’s interest in a particular asset. Using an encrypted DNS transport, or retrieving through an operator-configured proxy that performs name resolution remotely, reduces this disclosure. Because retrieval of external data is optional, a validator can also choose not to retrieve it (see [Section 14.10.5, “External Data Validation”](#_external_data_validation)).

<a id="_redirect_handling"></a>
