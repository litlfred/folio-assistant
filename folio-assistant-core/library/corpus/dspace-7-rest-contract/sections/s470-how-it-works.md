---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s470-how-it-works
section_title: "How it Works?"
file: "scripts/filter-media.md"
lines: 28-36
source_sha256: b719b905c8ad3a71
granularity: heading
---
## How it Works?

The filter-media script processes bitstreams (files) that are added to DSpace, performing various activities on those files.  For instance, by default, it will extract the full text from files to make them full text searchable.  It will also create thumbnails.

The script can be run with a variety of parameters to control which bitstreams are processed and which Media Filter plugins are used.

By default, the script will process all bitstreams in DSpace and run all Media Filter plugins listed in the 'filter.plugins' configuration property in dspace.cfg.
