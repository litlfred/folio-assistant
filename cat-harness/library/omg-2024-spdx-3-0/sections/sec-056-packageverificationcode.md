---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-056-packageverificationcode
section_title: "PackageVerificationCode"
section_number: null
pages: 35-36
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
An SPDX version 2.X compatible verification method for software packages.
Description
This verification method is provided for compatibility with SPDX 2.X.
Use of this verification code method is discouraged except for scenarios where the contentIdentifier property on
Artifact can not be used.
This verification method provides an independently reproducible mechanism identifying specific contents of a package based on
the actual files (except the SPDX document itself, if it is included in the package) that make up each package and that correlates
to the data in this SPDX document.
This identifier enables a recipient to determine if any file in the original package (that the analysis was done on) has been changed
and permits inclusion of an SPDX document as part of a package.
Algorithm:
templist = ""
for all files in the package {
if file is a packageVerificationCodeExcludedFile
skip it
/* exclude SPDX analysis file */
else
append "algorithm(file)/n" to templist
}
sort templist in ascending order by value
/* remove separators from ordered sequence */
valueslist = remove "/n"s from templist
if valueslist is empty
hashValue = 0
else
hashValue = algorithm(valueslist)
where algorithm(string) applies a hash algorithm on a string and returns the result in lowercase hexadecimal digits.
Required sort order: ‘0’, ‘1’, ‘2’, ‘3’, ‘4’, ‘5’, ‘6’, ‘7’, ‘8’, ‘9’, ‘a’, ‘b’, ‘c’, ‘d’, ‘e’, ‘f’ (ASCII order)
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/PackageVerificationCode
Name:
PackageVerificationCode
Instantiability:
Concrete
SubclassOf:
/Core/IntegrityMethod
Superclasses
• /Core/IntegrityMethod
Properties
Property
Type
minCount
maxCount
algorithm
HashAlgorithm
1
1
hashValue
xsd:string
1
1
packageVerificationCodeExcludedFile
xsd:string
0
*
System Package Data Exchange (SPDX©) v3.0
23
All properties (informative)
Property
Type
minCount
maxCount
algorithm
HashAlgorithm
1
1
comment
xsd:string
0
1
hashValue
xsd:string
1
1
packageVerificationCodeExcludedFile
xsd:string
0
*
8.1.20
