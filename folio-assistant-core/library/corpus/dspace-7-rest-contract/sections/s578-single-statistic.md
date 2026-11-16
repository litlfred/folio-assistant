---
doc_id: dspace-7-rest-contract
doc_title: "DSpace 7 REST Contract (dspace-7_x)"
section_id: s578-single-statistic
section_title: "Single statistic"
file: "statistics-reports.md"
lines: 9-65
source_sha256: 6350722f8b4de96d
granularity: heading
---
## Single statistic
**GET /api/statistics/usagereports/<:id>**

This endpoint provides a specific statistic

An example JSON response document to `/api/statistics/usagereports/1911e8a4-6939-490c-b58b-a5d70f8d91fb_TopCountries`:
```json
{
    "id": "1911e8a4-6939-490c-b58b-a5d70f8d91fb_TopCountries",
    "type": "usagereport",
    "report-type": "TopCountries",
    "points": [
        {
            "label": "United States",
            "type": "country",
            "id": "US",
            "values": {
                "views": 2
            }
        },
        {
            "label": "China",
            "type": "country",
            "id": "CN",
            "values": {
                "views": 1
            }
        }
    ]
}
```

The ID is built from a concatenation of the UUID and the type of report for the given UUID

The type of point can be:
* country
* city
* bitstream
* item
* collection
* community
* date

The report-type specifies what data is returned, relevant e.g. to add a label to report. The current statistics support:
* TotalVisits
* TotalVisitsPerMonth
* TotalDownloads
* TopCountries
* TopCities

Possible response status

- 200 OK - The specific statistics data was found, and the data has been properly returned.
* 401 Unauthorized - if you are not authenticated and the statistics are not available to the Anonymous user
* 403 Forbidden - if you are not logged in with sufficient permissions and the statistics are not available to the Anonymous user
- 404 Not Found - The specified ID was not found
