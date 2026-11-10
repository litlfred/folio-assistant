---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s574-in-application-linkset-serialization
section_title: "in application/linkset serialization"
file: "signposting.md"
lines: 131-200
source_sha256: 6151d1e7ad19288a
granularity: heading
---
### in application/linkset serialization
```/signposting/linksets/<:uuid>```

This endpoint provides typed links of item having uuid specified in input, in application/linkset serialization

```
<https://{dspace.ui.url}/bitstreams/{uuid}/download> ; rel="item" ; type="text/plain" ; anchor="https://{dspace.ui.url}/entities/publication/{uuid}" , 
<https://{dspace.ui.url}/signposting/describedby/{uuid}> ; rel="describedby" ; type="application/vnd.datacite.datacite+xml" ; anchor="https://{dspace.ui.url}/entities/publication/{uuid}" , 
<https://{dspace.ui.url}/handle/123456789/29> ; rel="cite-as" ; anchor="https://{dspace.ui.url}/entities/publication/{uuid}" ,
<http://orcid.org/0000-0002-3748-8359> ; rel="author" ; anchor="https://{dspace.ui.url}/entities/publication/{uuid}" ,
<https://isni.org/isni/0000002251201436> ; rel="author" ; anchor="https://{dspace.ui.url}/entities/publication/{uuid}" , 
<https://{dspace.ui.url}/signposting/linksets/{uuid}> ; rel="linkset" ; type="application/linkset" ; anchor="https://{dspace.ui.url}/entities/publication/{uuid}" , 
<https://{dspace.ui.url}/signposting/linksets/{uuid}/json> ; rel="linkset" ; type="application/linkset+json" ; anchor="https://{dspace.ui.url}/entities/publication/{uuid}" , 
<https://schema.org/AboutPage> ; rel="type" ; anchor="https://{dspace.ui.url}/entities/publication/{uuid}" , 
<https://{dspace.ui.url}/signposting/linksets/{uuid}> ; rel="linkset" ; type="application/linkset" ; anchor="https://{dspace.ui.url}/bitstreams/{uuid}/download" , 
<https://{dspace.ui.url}/signposting/linksets/{uuid}/json> ; rel="linkset" ; type="application/linkset+json" ; anchor="https://{dspace.ui.url}/bitstreams/{uuid}/download" , 
<https://{dspace.ui.url}/entities/publication/{uuid}> ; rel="collection" ; type="text/html" ; anchor="https://{dspace.ui.url}/bitstreams/{uuid}/download" , 
<https://{dspace.ui.url}/entities/publication/{uuid}> ; rel="describes" ; type="text/html" ; anchor="https://{dspace.ui.url}/signposting/describedby/{uuid}" , 
```
Return codes:
* 200 OK - if the operation succeed
* 403 Forbidden - if you are not logged in with sufficient permissions for reading Item information.
* 404 Not found - if the item doesn't exist

### linkset data for response header or meta tag
```/signposting/links/<:uuid>```

This endpoint provides typed links, of item or bitstream having uuid specified in input, to be included item or bitstream page response header or meta tag

```json
[
  {
    "href": "http://orcid.org/orcidValue",
    "rel": "author"
  },
  {
    "href": "https://{dspace.ui.url}/bitstreams/{uuid}/download",
    "rel": "item",
    "type": "text/plain"
  },
  {
    "href": "https://{dspace.ui.url}/signposting/describedby/{uuid}",
    "rel": "describedby",
    "type": "application/vnd.datacite.datacite+xml"
  },
  {
    "href": "https://{dspace.ui.url}/handle/123456789/40",
    "rel": "cite-as"
  },
  {
    "href": "https://{dspace.ui.url}/signposting/linksets/{uuid}",
    "rel": "linkset",
    "type": "application/linkset"
  },
  {
    "href": "https://{dspace.ui.url}/signposting/linksets/{uuid}/json",
    "rel": "linkset",
    "type": "application/linkset+json"
  },
  {
    "href": "https://schema.org/AboutPage",
    "rel": "type"
  }
]
```
Return codes:
* 200 OK - if the operation succeed
* 403 Forbidden - if you are not logged in with sufficient permissions for reading Item information.
* 404 Not found - if the item doesn't exist
