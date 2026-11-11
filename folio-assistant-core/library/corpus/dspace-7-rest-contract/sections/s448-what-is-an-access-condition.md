---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s448-what-is-an-access-condition
section_title: "What is an Access Condition?"
file: "scripts/bulk-access-control.md"
lines: 88-92
source_sha256: a25d844d5b00d2d5
granularity: heading
---
# What is an Access Condition?

An access condition is usually linked to a resource policy that grant READ permission to a specific eperson or group over a DSpace Object. It can be constrainst to a specific time windows with a start date or end date. READ permission are grant in DSpace to user for different purpose according to the different phase of an item life-cycle for this reason resource policy have a type, `TYPE_CUSTOM` or `TYPE_INHERITED` are used in policies that are set to define the final "access condition" of an object.

The access condition defined in the system are configured in a spring file of the the backend and exposed via the [Bulk Access Conditions endpoint](/bulkaccessconditionoptions.md)
