---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s752-multipart-post-method
section_title: "Multipart POST Method"
file: "workspaceitems.md"
lines: 12-47
source_sha256: 1bb50597a317b780
granularity: heading
---
## Multipart POST Method

Multipart POST on collections supports two differents operation mode:

* Import from remote resource
* Import from file

In the remote resource scenario, Multipart POST can include a uri-list containing:
* The [external entry value](external-authority-sources.md) whose metadata should be imported

An example curl call:
```
 curl -i -X POST https://demo.dspace.org/server/api/submission/workspaceitems?owningCollection=1c11f3f1-ba1f-4f36-908a-3f1ea9a557eb \
 -H "Content-Type:text/uri-list" \
 --data "https://demo.dspace.org/server/api/integration/externalsources/orcid/entryValues/0000-0002-4271-0436"
```
No confirmation, user has confirmed they want this record, and the previous state of the item is empty

If an external entry value is included, the metadata from this external source should be imported automatically.  
There's no need for a preview of the expected changes similar to the [Metadata Suggestions](metadata-suggestions.md) functionality because
 * The user has already confirmed they want to import this particular record
 * This is a new submission, it starts from an empty item  
 
 
In files scenario, all works in the same way as "remote resource",  but user submits one or more file(s) instead of remote resource id.
There are some constraints to import files:
*   File which doesn't have a valid parser will be discarded.
*   If one or more files contain parseable metadata, the first file that is able to be parsed will be used to prepopulate the metadata. Others will just be saved to the WorkspaceItem
*   All the files attached must have only one entry. Parsing files with more than one entry will result in exception throwing and 422 (Unprocessable Entity) HTTP status.

An example curl call:

    curl --location --request POST 'https://demo.dspace.org/server/api/submission/workspaceitems' 
    --form 'file=@/path/to/bibtex-test.bib' --form 'file=@/path/to/pubmed-test.xml'
