---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s602-search-cc-license
section_title: "Search CC License"
file: "submissioncclicenses.md"
lines: 117-146
source_sha256: e669ef3bc887c7ff
granularity: heading
---
## Search CC License 
**/api/config/submissioncclicenseurls/search/rightsByQuestions**

This endpoint is used to obtain the final CC License URI after (optionally) providing answers for the given license. 
The URI may differ depending on the answers that are provided, and answers are only required if the given license requires them. 
To use this endpoint, you must first request information about a specific license using the `/api/config/submissioncclicenses/<:license-name>` endpoint above.

Parameters:
* license: the ID of the license. This identifier must be a license returned from the `/api/config/submissioncclicenses` endpoint (e.g. standard, publicdomain, …)
* answer_X: List of answers. X must be a valid field ID returned from `/api/config/submissioncclicenses/<:license-name>`, and the answer value must be a valid value ID for that field.  (e.g. answer_commercial=y&answer_derivatives=sa)

If the combination of the license and the answers is valid, it will return the license URI.

```json
{
  "url": "http://creativecommons.org/licenses/by-sa/3.0/us/",
  "type": "submissioncclicenseUrl",
  "_links": {
    "self": {
      "href": "https://dspace7-internal.atmire.com/server/api/config/submissioncclicenses/search/rightsByQuestions?license=standard&answer_commercial=y&answer_derivatives=sa"
    }
  }
}
```

Response codes:
* 200 OK - if the operation succeeded
* 400 Bad Request - If the answers provided aren't valid or if a required answer is missing  
* 401 Unauthorized - if you are not logged in
* 404 Not found - if the provided license isn't valid
