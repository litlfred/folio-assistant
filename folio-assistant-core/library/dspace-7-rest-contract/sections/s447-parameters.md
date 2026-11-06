---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s447-parameters
section_title: "Parameters"
file: "scripts/bulk-access-control.md"
lines: 33-87
source_sha256: a25d844d5b00d2d5
granularity: heading
---
## Parameters

The script takes the following parameters:

| Parameter                        | Description                                                                                                                                                                            |
|----------------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `-u`, <br>`--uuid`               | This parameter, mandatory and repeatable, specifies the uuid of the object to process according to processing instruction, specified in the json file (see below).                                                                                                              |

| `-f`, <br>`--file`                | This parameter specifies the json file containing the processing instruction.                                                                                                              |
| `-h`, <br>`--help`               | This parameter displays help information for the script.                                                                                                                               |

The json file specified with the file parameter has the following structure
 structured as follow
```json
{
   "item": {
      "mode": "replace",
      "accessConditions": [
          {
            "name": "openaccess"
          }
      ]
   },
   "bitstream": {
      "constraints": {
          "uuid": ["bit-uuid1", "bit-uuid2", "...", "bit-uuidN"],
      },
      "mode": "add",
      "accessConditions": [
        {
         "name": "embargo",
         "startDate": "2024-06-24T23:59:59.999+0000"
        },
        {
         "name": "network"         
        }
      ]
   }
}
```
* item: the item node contains the processing detail at the item level for the identified resources
  * mode: can be replace or add. Replace will mean that after processing the items will have only the access conditions that are specified in the accessContitions property. Add will mean that after processing the items will have the specified accessCondition in addition to the ones already defined.
  * accessConditions: the list of access conditions to apply, with their specific parameters if needed (such as a startDate for an embargo, etc.). Only in replace mode the accessConditions can be empty in this case the access conditions of the item will be reset to what is inherited from their owningCollection. Please note that when accessConditions is set and is not empty not inheritence from the owningCollection occur. For more information on accessConditions see the [What is an Access Condition?](#what-is-an-access-condition) section below.
* bitstream: the `bitstream` node contains the processing details at the bitstream level for the identified resources. These changes will be applied to bitstreams in the main content bundle (i.e. ORIGINAL bundle) and to any corresponding, derivative bitstreams created by `filter-media`. The only exception is that any derivative bitstreams created with `publicPermission` (i.e. set to READ Anonymous at creation via `filter.org.dspace.app.mediafilter.publicPermission`) will keep their existing public policies.
  * constraints: only when the `--uuid` param (see above) contains just a single Item UUID, then the 'constraints' can be used to limit which Bitstreams are processed in that Item. If `constraints` specifies one or more bitstream UUIDs, then only those bitstreams listed will be processed. If the `constraint`s node is not present, is empty or contains a null uuid or 0-size list, then all the bitstreams will be processed.
  * mode: as per the item node
  * accessConditions: as per the item node

The following validations rules apply to the file
* item?.mode = replace|add
* bitstream?.mode = replace|add
* item or bitstream must be present
* item?.accessContitions[*].name & bitstream?.accessContitions[*].name must match a defined access conditions and the object must be validated against the access condition rules (max end date etc).
Failures to comply with these rules will lead to a failure in the script execution.
