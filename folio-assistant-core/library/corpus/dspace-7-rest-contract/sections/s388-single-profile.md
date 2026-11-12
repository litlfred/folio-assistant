---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s388-single-profile
section_title: "Single Profile"
file: "profiles.md"
lines: 13-53
source_sha256: 64c203a69ff49a8b
granularity: heading
---
## Single Profile
**GET /api/eperson/profiles/<:eperson-uuid>**

Provide information about a specific profile. Only the Administrators or the owner eperson can access this endpoint.

The JSON response document is as follow

```json
{
  "id": "eb645ef8-1373-41eb-bf67-6afcea7e2069",
  "visible": true,
  "orcid": "0000-0002-8310-6788",
  "orcidSynchronization": {
    "mode": "MANUAL",
    "publicationsPreference": "ALL",
    "fundingsPreference": "ALL",
    "profilePreferences": ["BIOGRAPHICAL", "IDENTIFIERS"]
  },
  "type": "profile"
}
```

Attributes:
* id: the UUID of the EPerson who owns the profile. This also corresponds to the ID of the profile.
* visible: this property provides a quick way to add/remove the Anonymous READ policy. When set to "true", then the Anonymous READ Policy is added (and the profile becomes accessible to anonymous users). When set to "false", then the Anonymous READ policy is removed (and the profile is no longer accessible anonymously). Keep in mind, this setting only impacts the Anonymous READ policy. So, if other custom READ policies exist on the profile, those policies will take effect when "visible=false".
* orcid: the orcid id 
* orcidSynchronization: contains the orcid synchronization mode and preferences 
* type: the resource type (profile)

The orcid and orcidSynchronization attributes are not showed if the given profile is not linked to any ORCID account.

Exposed links:
* item: the item with which the profile is modeled
* eperson: the eperson related to the profile

It would respond with:
* 200 OK - Returning the profile if there's a match
* 401 Unauthorized - if you are not authenticated
* 403 Forbidden - if you are not logged in with sufficient permissions to view the profile
* 404 Not found - if the profile or the eperson doesn't exist
