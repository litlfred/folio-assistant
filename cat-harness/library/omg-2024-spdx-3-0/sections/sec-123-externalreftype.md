---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-123-externalreftype
section_title: "ExternalRefType"
section_number: null
pages: 61-63
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies the type of an external reference.
Description
ExternalRefType specifies the type of an external reference.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/ExternalRefType
Name:
ExternalRefType
3https://cpe.mitre.org/files/cpe-specification_2.2.pdf
4https://csrc.nist.gov/publications/detail/nistir/7695/final
5https://csrc.nist.gov/glossary/term/cve_id
6https://datatracker.ietf.org/doc/rfc3986/
7https://www.iana.org/assignments/uri-schemes/prov/gitoid
8https://git-scm.com/book/en/v2/Git-Internals-Git-Objects
9https://github.com/omnibor/spec/blob/eb1ee5c961c16215eb8709b2975d193a2007a35d/spec/SPEC.md#artifact-identifier-types
10https://github.com/omnibor/spec/blob/eb1ee5c961c16215eb8709b2975d193a2007a35d/spec/SPEC.md#input-manifest-identifier
11https://github.com/omnibor/spec/blob/eb1ee5c961c16215eb8709b2975d193a2007a35d/spec/SPEC.md#artifact-input-manifest
12https://github.com/omnibor/spec/
13https://github.com/omnibor/spec/blob/eb1ee5c961c16215eb8709b2975d193a2007a35d/spec/SPEC.md#artifact-dependency-graph-adg
14../../../annexes/pkg-url-specification.md
15https://www.swhid.org/specification/v1.1/4.Syntax
16https://datatracker.ietf.org/doc/rfc9393/
17https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml
System Package Data Exchange (SPDX©) v3.0
49
Entries
altDownloadLocation A reference to an alternative download location.
altWebPage A reference to an alternative web page.
binaryArtifact A reference to binary artifacts related to a package.
bower A reference to a Bower package. The package locator format, looks like package#version, is defined in the “install”
section of Bower API documentation18.
buildMeta A reference build metadata related to a published package.
buildSystem A reference build system used to create or publish the package.
certificationReport A reference to a certification report for a package from an accredited/independent body.
chat A reference to the instant messaging system used by the maintainer for a package.
componentAnalysisReport A reference to a Software Composition Analysis (SCA) report.
cwe Common Weakness Enumeration19. A reference to a source of software flaw defined within the official CWE List20 that
conforms to the CWE specification21.
documentation A reference to the documentation for a package.
dynamicAnalysisReport A reference to a dynamic analysis report for a package.
eolNotice A reference to the End Of Sale (EOS) and/or End Of Life (EOL) information related to a package.
exportControlAssessment A reference to a export control assessment for a package.
funding A reference to funding information related to a package.
issueTracker A reference to the issue tracker for a package.
license A reference to additional license information related to an artifact.
mailingList A reference to the mailing list used by the maintainer for a package.
mavenCentral A reference to a Maven repository artifact. The artifact locator format is defined in the Maven documentation22
and looks like groupId:artifactId[:version].
metrics A reference to metrics related to package such as OpenSSF scorecards.
npm A reference to an npm package.
The package locator format is defined in the npm documentation23 and looks like
package@version.
nuget A reference to a NuGet package. The package locator format is defined in the NuGet documentation24 and looks like
package/version.
other Used when the type does not match any of the other options.
privacyAssessment A reference to a privacy assessment for a package.
productMetadata A reference to additional product metadata such as reference within organization’s product catalog.
purchaseOrder A reference to a purchase order for a package.
qualityAssessmentReport A reference to a quality assessment for a package.
releaseHistory A reference to a published list of releases for a package.
releaseNotes A reference to the release notes for a package.
18https://bower.io/docs/api/#install
19https://csrc.nist.gov/glossary/term/common_weakness_enumeration
20https://cwe.mitre.org/data/
21https://cwe.mitre.org/
22https://maven.apache.org/guides/mini/guide-naming-conventions.html
23https://docs.npmjs.com/cli/v10/configuring-npm/package-json
24https://docs.nuget.org
50
System Package Data Exchange (SPDX©) v3.0
riskAssessment A reference to a risk assessment for a package.
runtimeAnalysisReport A reference to a runtime analysis report for a package.
secureSoftwareAttestation A reference to information assuring that the software is developed using security practices as defined
by NIST SP 800-218 Secure Software Development Framework (SSDF) Version 1.125 or CISA Secure Software Develop-
ment Attestation Form26.
securityAdversaryModel A reference to the security adversary model for a package.
securityAdvisory A reference to a published security advisory (where advisory as defined per ISO 29147:201827) that may affect
one or more elements, e.g., vendor advisories or specific NVD entries.
securityFix A reference to the patch or source code that fixes a vulnerability.
securityOther A reference to related security information of unspecified type.
securityPenTestReport A reference to a penetration test28 report for a package.
securityPolicy A reference to instructions for reporting newly discovered security vulnerabilities for a package.
securityThreatModel A reference the security threat model29 for a package.
socialMedia A reference to a social media channel for a package.
sourceArtifact A reference to an artifact containing the sources for a package.
staticAnalysisReport A reference to a static analysis report for a package.
support A reference to the software support channel or other support information for a package.
vcs A reference to a version control system related to a software artifact.
vulnerabilityDisclosureReport A reference to a Vulnerability Disclosure Report (VDR) which provides the software supplier’s
analysis and findings describing the impact (or lack of impact) that reported vulnerabilities have on packages or products in
the supplier’s SBOM as defined in NIST SP 800-161 Cybersecurity Supply Chain Risk Management Practices for Systems
and Organizations30.
vulnerabilityExploitabilityAssessment A reference to a Vulnerability Exploitability eXchange (VEX) statement which provides
information on whether a product is impacted by a specific vulnerability in an included package and, if affected, whether
there are actions recommended to remediate. See also NTIA VEX one-page summary31.
8.3.4
