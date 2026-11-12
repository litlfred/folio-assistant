---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-274-datasetavailabilitytype
section_title: "DatasetAvailabilityType"
section_number: null
pages: 150-151
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Availability of dataset.
Description
Describes the possible types of availability of a dataset, indicating whether the dataset can be directly downloaded, can be assembled
using a script for scraping the data, is only available after a clickthrough or a registration form.
Metadata
https://spdx.org/rdf/3.0.1/terms/Dataset/DatasetAvailabilityType
Name:
DatasetAvailabilityType
125https://en.wikipedia.org/wiki/Traffic_Light_Protocol
138
System Package Data Exchange (SPDX©) v3.0
Entries
clickthrough the dataset is not publicly available and can only be accessed after affirmatively accepting terms on a clickthrough
webpage.
directDownload the dataset is publicly available and can be downloaded directly.
query the dataset is publicly available, but not all at once, and can only be accessed through queries which return parts of the
dataset.
registration the dataset is not publicly available and an email registration is required before accessing the dataset, although without
an affirmative acceptance of terms.
scrapingScript the dataset provider is not making available the underlying data and the dataset must be reassembled, typically
using the provided script for scraping the data.
14.3.3
