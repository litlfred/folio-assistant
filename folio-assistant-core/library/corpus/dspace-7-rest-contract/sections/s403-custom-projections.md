---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s403-custom-projections
section_title: "Custom Projections"
file: "projections.md"
lines: 31-42
source_sha256: afe6086479eebe16
granularity: heading
---
## Custom Projections

Developers and integrators may extend the available projections for use with a DSpace instance by adding
a new uniquely-named `Projection` as a Java Spring `@Component`, and ensuring it is deployed (e.g. as a jar)
within the DSpace server webapp.

Upon successful component discovery, the projection will automatically become available for use with all
REST API endpoints using the same syntax as the standard projections (`?projection=name`).

See [the Projection javadocs](https://github.com/DSpace/DSpace/blob/master/dspace-server-webapp/src/main/java/org/dspace/app/rest/projection/Projection.java)
for more information.
