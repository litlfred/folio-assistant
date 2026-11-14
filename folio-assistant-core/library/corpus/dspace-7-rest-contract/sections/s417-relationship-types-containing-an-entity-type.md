---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s417-relationship-types-containing-an-entity-type
section_title: "Relationship types containing an entity type"
file: "relationshiptypes.md"
lines: 74-157
source_sha256: 218a051b0be9f4c9
granularity: heading
---
### Relationship types containing an entity type
**/api/core/relationshiptypes/search/byEntityType?type=<:entity-type-label>**

Parameters:
* The `type` should be the entity type label from the [entity types endpoint](entitytypes.md). It is mandatory. It can occur on either the left or right hand side

A sample search would be `/server/api/core/relationshiptypes/search/byEntityType?type=Publication'

Assuming that the sample `config/entities/relationship-types.xml` data model has been loaded, it would respond with

```json
{
  "_embedded": {
    "relationshiptypes": [
      { // it is between Person and Publication
        "id": 10,
        "leftwardType": "isAuthorOfPublication",
        "rightwardType": "isPublicationOfAuthor",
        "copyToLeft": false,
        "copyToRight": false,
        "leftMinCardinality": 0,
        "leftMaxCardinality": null,
        "rightMinCardinality": 0,
        "rightMaxCardinality": null,
        "type": "relationshiptype"
      },
      {
        "id": 1,
        "leftwardType": "isProjectOfPublication",
        "rightwardType": "isPublicationOfProject",
        "copyToLeft": false,
        "copyToRight": false,
        "leftMinCardinality": 0,
        "leftMaxCardinality": null,
        "rightMinCardinality": 0,
        "rightMaxCardinality": null,
        "type": "relationshiptype"
      },
      {
        "id": 7,
        "leftwardType": "isOrgUnitOfPublication",
        "rightwardType": "isPublicationOfOrgUnit",
        "copyToLeft": false,
        "copyToRight": false,
        "leftMinCardinality": 0,
        "leftMaxCardinality": null,
        "rightMinCardinality": 0,
        "rightMaxCardinality": null,
        "type": "relationshiptype"
      },
      { // this is a different relationshipttype than the one with id 10
        // as it is about Publication and OrgUnit
        "id": 17,
        "leftwardType": "isAuthorOfPublication",
        "rightwardType": "isPublicationOfAuthor",
        "copyToLeft": false,
        "copyToRight": false,
        "leftMinCardinality": 0,
        "leftMaxCardinality": null,
        "rightMinCardinality": 0,
        "rightMaxCardinality": null,
        "type": "relationshiptype"
      },
      {
        "id": 18, 
        "leftwardType": "isPublicationOfJournalIssue",
        "rightwardType": "isJournalIssueOfPublication",
        "copyToLeft": false,
        "copyToRight": false,
        "leftMinCardinality": 0,
        "leftMaxCardinality": null,
        "rightMinCardinality": 0,
        "rightMaxCardinality": null,
        "type": "relationshiptype"
      }    
    ]
  }
}
```
comments inside the above json are only included for clarity but are not part of the real response.

Return codes:
* 200 OK - if the operation succeed. This include the case of no matching relationship where a 0-size page json representation is returned.
* 400 Bad Request - if the type parameter is missing or invalid
