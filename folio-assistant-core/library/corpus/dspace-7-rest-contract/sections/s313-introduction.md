---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s313-introduction
section_title: "Introduction"
file: "metadata-suggestions.md"
lines: 27-33
source_sha256: 29d83451107b7c52
granularity: heading
---
## Introduction

This contract allows for suggesting metadata changes to an in-submission or in-workflow item.
The user can choose a live import source to use for suggesting the metadata (e.g. PubMed for a medical publication, ORCID for an author, a RIS file for uploaded metadata).
The live import source will suggest matches, and will suggest metadata changes if the match is accepted by the user.
A full metadata description of the data from the live import source is displayed in combination to the suggested changes to the current item.
