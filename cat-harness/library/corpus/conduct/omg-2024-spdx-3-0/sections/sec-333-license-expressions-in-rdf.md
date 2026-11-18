---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-333-license-expressions-in-rdf
section_title: "License expressions in RDF"
section_number: null
pages: 188-190
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
A conjunctive license can be expressed in RDF via a <spdx:ConjunctiveLicenseSet> element, with an spdx:member
property for each element in the conjunctive license. Two or more members are required.
<spdx:ConjunctiveLicenseSet>
<spdx:member rdf:resource="http://spdx.org/licenses/GPL-2.0-only"/>
<spdx:ExtractedLicensingInfo rdf:about
="http://example.org#LicenseRef-EternalSurrender">
<spdx:extractedText>
In exchange for using this software, you agree to give
its author all your worldly possessions. You will not
hold the author liable for all the damage this software
will inevitably cause not only to your person and
property, but to the entire fabric of the cosmos.
</spdx:extractedText>
<spdx:licenseId>LicenseRef-EternalSurrender</spdx:licenseId>
</spdx:ExtractedLicensingInfo>
</spdx:ConjunctiveLicenseSet>
A disjunctive license can be expressed in RDF via a <spdx:DisjunctiveLicenseSet> element, with an spdx:member
property for each element in the disjunctive license. Two or more members are required.
<spdx:DisjunctiveLicenseSet>
<spdx:member rdf:resource="http://spdx.org/licenses/GPL-2.0-only"/>
<spdx:member>
<spdx:ExtractedLicensingInfo rdf:about
="http://example.org#LicenseRef-EternalSurrender">
<spdx:extractedText>
In exchange for using this software, you agree to
give its author all your worldly possessions. You
will not hold the author liable for all the damage
this software will inevitably cause not only to
your person and property, but to the entire fabric
of the cosmos.
</spdx:extractedText>
176
System Package Data Exchange (SPDX©) v3.0
<spdx:licenseId>LicenseRef-EternalSurrender</spdx:licenseId>
</spdx:ExtractedLicensingInfo>
</spdx:member>
</spdx:DisjunctiveLicenseSet>
A License Exception can be expressed in RDF via a <spdx:LicenseException> element. This element has the following
unique mandatory (unless specified otherwise) attributes:
• comment - An rdfs:comment element describing the nature of the exception.
• seeAlso (optional, one or more)- An rdfs:seeAlso element referencing external sources of information on the excep-
tion.
• example (optional) - Text describing examples of this exception.
• name - The full human readable name of the item.
• licenseExceptionId - The identifier of an exception in the SPDX License List to which the exception applies.
• licenseExceptionText - Full text of the license exception.
<rdf:Description rdf:about
="http://example.org#SPDXRef-ButIdDontWantToException">
<rdfs:comment>This exception may be invalid in some
jurisdictions.</rdfs:comment>
<rdfs:seeAlso>http://dilbert.com/strip/1997-01-15</rdfs:seeAlso>
<spdx:example>So this one time, I had a license exception
…</spdx:example>
<spdx:licenseExceptionText>
A user of this software may decline to follow any subset of
the terms of this license upon finding any or all such terms
unfavorable.
</spdx:licenseExceptionText>
<spdx:name>&quot;But I Don&apos;t Want To&quot; Exception</spdx:name>
<spdx:licenseExceptionId>SPDXRef-ButIdDontWantToException</spdx:licenseExceptionId>
<rdf:type rdf:resource
="http://spdx.org/rdf/terms#LicenseException"/>
</rdf:Description>
System Package Data Exchange (SPDX©) v3.0
177
Annex C
