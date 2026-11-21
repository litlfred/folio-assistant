---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s355-16-3-3-3-4-gif-specific-handling
section_title: "16.3.3.3.4. GIF-specific Handling"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 5395-5423
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.3.3.3.4. GIF-specific Handling

The hash of a box containing a 'Packed Fields' attribute will also hash the optional data indicated by that attribute. For example, the Image Descriptor will include the Local Color Table block, and the Logical Screen Descriptor will include the Global Color Table block, if they exist.

For all boxes containing a block label, the naming convention shall be as follows: "<Block Label>".

For all extension blocks, the naming convention is as follows: "<Extension Introducer><Extension Label>".

The only other blocks that are not described by the above naming convention are:

*   The header will be marked with "GIF89a".
    
*   The Table Based Image Data will be marked with "TBID".
    
*   The Logical Screen Descriptor will be marked with "LSD".
    

For example:

*   Header: "GIF89a".
    
*   Trailer: "3B".
    
*   Image Descriptor: "2C".
    
*   Comment Extension: "21FE".
    

<a id="_riff_specific_handling"></a>
