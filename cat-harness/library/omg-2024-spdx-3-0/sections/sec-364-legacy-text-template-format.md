---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-364-legacy-text-template-format
section_title: "Legacy Text Template format"
section_number: null
pages: 194-195
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Prior to the XML format, a text template was used to express variable and optional text in licenses. This text template is still
supported, however, users are encouraged to use the more expressive XML format.
A legacy template is composed of text with zero or more rules embedded in it.
A rule is a variable section of a license wrapped between double angle brackets <<>> and is composed of 4 fields. Each field is
separated with a semi-colon ;. Rules cannot be embedded within other rules. Rule fields begin with a case sensitive tag followed
by an equal sign =.
Rule fields:
• type: indicates whether the text is replaceable or omittable as per Substantive text guidelines.
– Indicated by <<var; . . . >> or
– Indicated by <<beginOptional; . . .>> and <<endOptional>> respectively.
– This field is the first field and is required.
• name: name of the field in the template.
– This field is unique within each license template.
– This field is required.
• original: the original text of the rule.
– This field is required for a rule type: <<var; . . . >>
• match: a POSIX extended regular expression (ERE).
– This field is required for a rule type: <<var; . . . >>
The POSIX ERE7 in the match field has the following restrictions and extensions:
• Semicolons are escaped with \;
• POSIX Bracket Extensions are not allowed
For example: <<var;name=organizationClause3;original=the copyright holder;match=.+>>
4https://github.com/spdx/license-list-XML
5https://github.com/spdx/license-list-data
6https://github.com/spdx/license-list-XML/blob/v3.25.0/schema/ListedLicense.xsd
7http://pubs.opengroup.org/onlinepubs/9699919799/
182
System Package Data Exchange (SPDX©) v3.0
Annex D
