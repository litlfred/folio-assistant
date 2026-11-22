---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s411-relationship-involving-specified-items
section_title: "Relationship involving specified items"
file: "relationships.md"
lines: 99-376
source_sha256: 153081453688c8e9
granularity: heading
---
### Relationship involving specified items
**/api/core/relationships/search/byItemsAndType?typeId=<:relationship-type-id>&relationshipLabel=<:relationship-label>&focusItem=<:item-uuid>&relatedItem=<:item-uuid1>[&...&&relatedItem=<:item-uuidN>]**

This method is intended to be used when giving an item (focus) and a list of potentially related items we need to know which of these other items are already in a specific relationship with the focus item and, by exclusion which ones are not yet related.

The supported parameters are:
* page, size [see pagination](README.md#Pagination)
* typeId: mandatory, the relationship type id to apply as a filter to the returned relationships
* relationshipLabel: mandatory, the name of the relation as defined from the side of the `focusItem`
* focusItem; mandatory. The uuid of the item to be checked on the side defined by `relationshipLabel`
* relatedItem; mandatory, repeatable. The uuid of the items to be found on the other side of returned relationships

For example the request
```/api/core/relationships/search/byItemsAndType?typeId=<:type-id>&relationshipLabel=isAuthorOfPublication&focusItem=<:publication-uuid>&relatedItem=<:one-person-uuid>&relatedItem=<:two-person-uuid>&relatedItem=<:three-person-uuid>```

would return a list of relationship with the specified publication (focusItem) on the left side (as isAuthorOfPublication is the leftwardType of the relationshiptype with typeId) and on the right side there is one of the specified person (relatedItem params).
 
Return codes:
* 200 OK - if the operation succeed. This include the case of no matching relationships where a 0-size page json representation is returned.
* 400 Bad Request - if one of the parameters is missing or syntactically invalid (i.e. not an uuid, integer) 
* 422 Unprocessable Entity - if the relationshipLabel doesn't match the relationship type.

## Creating a relationship

**POST /api/core/relationships?relationshipType=<:relationshipType>**

A new relationship between 2 items can be created by specifying both items in a uri-list body and specifying the relationshipType as a parameter

A sample CURL command would be:
```
curl -i -X POST 'https://demo.dspace.org/server/api/core/relationships?relationshipType=1' -H 'Authorization: Bearer eyJhbGciO…' -H "Content-Type:text/uri-list" --data 'https://demo.dspace.org/server/api/core/items/12623672-25a9-4df2-ab36-699c4c240c7e \n https://demo.dspace.org/server/api/core/items/5a3f7c7a-d3df-419c-8a2-f00ede62c60a'
```

Including a name variant would result in:
```
curl -i -X POST 'https://demo.dspace.org/server/api/core/relationships?relationshipType=1&leftwardValue=Name%20variant%201' -H 'Authorization: Bearer eyJhbGciO…' -H "Content-Type:text/uri-list" --data 'https://demo.dspace.org/server/api/core/items/12623672-25a9-4df2-ab36-699c4c240c7e \n https://demo.dspace.org/server/api/core/items/5a3f7c7a-d3df-419c-8a2-f00ede62c60a'
```

The uri-list should always contain exactly 2 items. The first item will be used as the left Item. The second item will be used as the right Item.
The relationshipType parameter is mandatory as well

* 201 Created - if the operation succeed
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 422 Unprocessable Entity - if one of the items doesn't exist

## Updating the items in a relationship

**PUT /api/core/relationships/<:id>/<:leftVsRightItem>**

Update the items in the relationship

A sample CURL command to update the left item would be:
```
curl -i -X PUT 'https://demo.dspace.org/server/api/core/relationships/891/leftItem' -H 'Authorization: Bearer eyJhbGciO…' -H "Content-Type:text/uri-list" --data 'https://demo.dspace.org/server/api/core/items/12623672-25a9-4df2-ab36-699c4c240c7e'
```

A sample CURL command to update the right item would be:
```
curl -i -X PUT 'https://demo.dspace.org/server/api/core/relationships/891/rightItem' -H 'Authorization: Bearer eyJhbGciO…' -H "Content-Type:text/uri-list" --data 'https://demo.dspace.org/server/api/core/items/5a3f7c7a-d3df-419c-8a2-f00ede62c60a'
```

The uri-list should always contain exactly 1 item. This item will be used as to replace the left of right item, depending on whether the URL ends with /leftItem or /rightItem

The relationshipType is not modifiable

Error codes:
* 200 OK - if the operation succeeded
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the relationships doesn't exist
* 422 Unprocessable Entity - if the item doesn't exist, or if the amount of items is not 1

## Updating the metadata of a relationship

**PUT /api/core/relationships/<:id>**

Update the name variant or the place:
```
curl -i -X PUT 'https://demo.dspace.org/server/api/core/relationships/891' -H 'Authorization: Bearer eyJhbGciO…' -H "Content-Type:application/json" --data '{ "leftPlace": 1, "leftwardValue": "Smith, Jane", "rightPlace": 1, "rightwardValue": null }'
```

Omitted properties will be removed.

Error codes:
* 200 OK - if the operation succeeded
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions
* 404 Not found - if the relationship doesn't exist

## Relationships per Relationship type
**/api/core/relationships/search/byLabel?label=<:relationshipname>**

A sample search would be https://demo.dspace.org/#https://demo.dspace.org/server/api/core/relationships/search/byLabel?label=isPersonOfOrgUnit
The relationshipname parameter is mandatory

It would respond with
```json
{
  "_embedded": {
    "relationships": [
      {
        "id": 590,
        "leftId": "f2235aa6-6fe7-4174-a690-598b72dd8e44",
        "rightId": "d30de96b-1e76-40ae-8ef9-ab426b6f9763",
        "leftPlace": 1,
        "rightPlace": 2,
        "type": "relationship",
        "_links": {
          "relationshipType": {
            "href": "https://demo.dspace.org/server/api/core/relationships/590/relationshipType"
          },
          "self": {
            "href": "https://demo.dspace.org/server/api/core/relationships/590"
          },
          "leftItem": {
            "href": "https://demo.dspace.org/server/api/core/items/f2235aa6-6fe7-4174-a690-598b72dd8e44"
          },
          "rightItem": {
            "href": "https://demo.dspace.org/server/api/core/items/d30de96b-1e76-40ae-8ef9-ab426b6f9763"
          }
        },
        "_embedded": {
          "relationshipType": {
            "id": 5,
            "leftwardType": "isOrgUnitOfPerson",
            "rightwardType": "isPersonOfOrgUnit",
            "leftMinCardinality": 0,
            "leftMaxCardinality": null,
            "rightMinCardinality": 0,
            "rightMaxCardinality": null,
            "type": "relationshiptype",
            "_links": {
              "leftType": {
                "href": "https://demo.dspace.org/server/api/core/entitytypes/2"
              },
              "rightType": {
                "href": "https://demo.dspace.org/server/api/core/entitytypes/4"
              },
              "self": {
                "href": "https://demo.dspace.org/server/api/core/relationshiptypes/5"
              }
            },
            "_embedded": {
              "leftType": {
                "id": 2,
                "label": "Person",
                "type": "entitytype",
                "_links": {
                  "self": {
                    "href": "https://demo.dspace.org/server/api/core/entitytypes/2"
                  },
                  "relationshiptypes": {
                    "href": "https://demo.dspace.org/server/api/core/entitytypes/2/relationshiptypes"
                  }
                }
              },
              "rightType": {
                "id": 4,
                "label": "OrgUnit",
                "type": "entitytype",
                "_links": {
                  "self": {
                    "href": "https://demo.dspace.org/server/api/core/entitytypes/4"
                  },
                  "relationshiptypes": {
                    "href": "https://demo.dspace.org/server/api/core/entitytypes/4/relationshiptypes"
                  }
                }
              }
            }
          }
        }
      },
      {
        "id": 589,
        "leftId": "5a3f7c7a-d3df-419c-b8a2-f00ede62c60a",
        "rightId": "c216201f-ed10-4361-b0e0-5a065405bd3e",
        "leftPlace": 2,
        "rightPlace": 1,
        "type": "relationship",
        "_links": {
          "relationshipType": {
            "href": "https://demo.dspace.org/server/api/core/relationships/589/relationshipType"
          },
          "self": {
            "href": "https://demo.dspace.org/server/api/core/relationships/589"
          },
          "leftItem": {
            "href": "https://demo.dspace.org/server/api/core/items/5a3f7c7a-d3df-419c-b8a2-f00ede62c60a"
          },
          "rightItem": {
            "href": "https://demo.dspace.org/server/api/core/items/c216201f-ed10-4361-b0e0-5a065405bd3e"
          }
        },
        "_embedded": {
          "relationshipType": {
            "id": 5,
            "leftwardType": "isOrgUnitOfPerson",
            "rightwardType": "isPersonOfOrgUnit",
            "leftMinCardinality": 0,
            "leftMaxCardinality": null,
            "rightMinCardinality": 0,
            "rightMaxCardinality": null,
            "type": "relationshiptype",
            "_links": {
              "leftType": {
                "href": "https://demo.dspace.org/server/api/core/entitytypes/2"
              },
              "rightType": {
                "href": "https://demo.dspace.org/server/api/core/entitytypes/4"
              },
              "self": {
                "href": "https://demo.dspace.org/server/api/core/relationshiptypes/5"
              }
            },
            "_embedded": {
              "leftType": {
                "id": 2,
                "label": "Person",
                "type": "entitytype",
                "_links": {
                  "self": {
                    "href": "https://demo.dspace.org/server/api/core/entitytypes/2"
                  },
                  "relationshiptypes": {
                    "href": "https://demo.dspace.org/server/api/core/entitytypes/2/relationshiptypes"
                  }
                }
              },
              "rightType": {
                "id": 4,
                "label": "OrgUnit",
                "type": "entitytype",
                "_links": {
                  "self": {
                    "href": "https://demo.dspace.org/server/api/core/entitytypes/4"
                  },
                  "relationshiptypes": {
                    "href": "https://demo.dspace.org/server/api/core/entitytypes/4/relationshiptypes"
                  }
                }
              }
            }
          }
        }
      },
      …
    ]
  },
  "_links": {
    "self": {
      "href": "https://demo.dspace.org/server/api/core/relationships/search/byLabel?label=isPersonOfOrgUnit"
    }
  },
  "page": {
    "number": 0,
    "size": 20,
    "totalPages": 1,
    "totalElements": 2
  }
}
```

This is similar to
https://dspace7-internal.atmire.com/rest/#/rest/api/core/communities/search/subCommunities?parent=daa2657d-5f39-4876-9536-ace42e96b440

It embeds all relationships where the relationship type has the given label on either the left or the right label


This can be further filtered to a single DSO using 
https://demo.dspace.org/#https://demo.dspace.org/server/api/core/relationships/search/byLabel?label=isPersonOfOrgUnit&dso=f2235aa6-6fe7-4174-a690-598b72dd8e44 which contains all relationships created using the relationship type isPersonOfOrgUnit for which one item is f2235aa6-6fe7-4174-a690-598b72dd8e44
The dso parameter is optional

When applying the dso parameter you can also filter out the results that do not have the given related entity type on the other side of the relationship
https://demo.dspace.org/server/#/server/api/core/relationships/search/byLabel?label=isAuthorOfPublication&dso=dc051683-17c5-40c1-971f-fa229d2fffcb&relatedEntityType=Person which contains all relationships created using the relationship type `isAuthorOfPublication` for which one item is `dc051683-17c5-40c1-971f-fa229d2fffcb` and the other item has entity type `Person`.
The `relatedEntityType` parameter is optional
