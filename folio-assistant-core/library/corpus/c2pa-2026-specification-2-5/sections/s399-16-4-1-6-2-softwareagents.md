---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s399-16-4-1-6-2-softwareagents
section_title: "16.4.1.6.2. SoftwareAgents"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6968-7025
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.4.1.6.2. SoftwareAgents

If multiple softwareAgents were used, they can be listed in the `softwareAgents` field instead. This field is an array of `generator-info-map` objects, each of which describes a different software or hardware which can then be referenced by its index via the `softwareAgentIndex` field of a given action or template.

Example 7. Software Agents example

An example of specifying multiple agents across multiple actions, in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8):

```none
{
    "actions": [
        {
            "action": "com.joesphoto.magic-avatar",
            "when": 0("2020-02-11T09:00:00Z"),
			"softwareAgentIndex" : 0
        },
        {
            "action": "c2pa.edited",
            "when": 0("2020-02-11T09:10:00Z")
			"softwareAgentIndex" : 1
        },
        {
            "action": "com.joesphoto.beauty-filter",
            "when": 0("2020-02-11T09:20:00Z"),
			"softwareAgentIndex" : 0
        },
        {
            "action": "com.joesphoto.all-smiles",
            "when": 0("2020-02-11T09:40:00Z"),
			"softwareAgentIndex" : 0
        },
        {
            "action": "c2pa.cropped",
            "when": 0("2020-02-11T09:30:00Z")
			"softwareAgentIndex" : 1
        },
        {
            "action": "com.joesphoto.green-screen",
            "when": 0("2020-02-11T09:50:00Z"),
			"softwareAgentIndex" : 0
        }
    ],
    "softwareAgents": [
        {
			"name": "Joe's AI Filter",
			"version": "1.0",
			"operating_system": "Windows 10"
        }
        {
			"name": "Joe's Photo Editor",
			"version": "2.0",
			"operating_system": "Windows 10"
        }
    ]
}
```

<a id="_icons"></a>
