---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s704-f-5-2-1-september-2024
section_title: "F.5. 2.1 - September 2024"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 13548-13668
source_sha256: ff401df19d1fde8c
granularity: heading
---
### F.5. 2.1 - September 2024

This version focuses on both technical and editorial changes to the specification for the purposes of improving the security and reliability of Content Credentials. All publicly disclosed security vulnerabilities have been addressed, and the specification has been updated to reflect the latest best practices in the field.

*   Clear definitions of Manifest & Asset states
    
    *   Well-formed Manifests
        
    *   Valid Manifests
        
    *   Trusted Manifests
        
    *   Valid Assets
        
    
*   Clear definitions and processes for handling deprecation and versioning
    
*   New `c2pa` URN namespace for labelling manifests!
    
    *   including a fully specified ABNF
        
    
*   New `ingredients v3` assertion
    
    *   Supports richer models of ingredient-based workflows.
        
    *   Support for `dataTypes` and `claimSignature`.
        
    *   Fields renamed to be more consistent with other assertions.
        
    *   Added new validation status fields to accompany the new status info
        
    *   `dc:title` and `dc:format` are now optional
        
    
*   New `c2pa.hash.bmff.v3` assertion
    
    *   Supports hashing of fixed & variable block sizes for BMFF-based assets
        
    
*   New time-stamp manifest
    
    *   Establishing a "time of existence" for a given asset.
        
    *   Similar to an update manifest, but with the signer being a TSA
        
    
*   Improved model for doing standard RFC 3161 time-stamping.
    
    *   `sigTst2` & CTT time-stamping
        
    *   Introduces the new C2PA TSA Trust List
        
    
*   Improvements in Validation
    
    *   Detailed validation instructions for all standard assertions
        
    *   Validation of ingredients is now required when using the `ingredients` assertion
        
    *   Extended ingredient validation to provide more detailed status information
        
    *   Support for validation of redacted assertions in ingredients
        
    *   Addition of detailed requirements for validation of time-stamps
        
    *   Hashed URIs to data boxes, and any custom boxes, are now validated
        
    *   Defined procedure for handling manifests with matching unique IDs
        
    *   Address "orphaned manifests" in the validation process
        
    *   LOTS of new validation status codes, including a new "informational" code type
        
    
*   Improvements in documentation & security of hashing methods
    
    *   BMFF-based assets
        
    *   "general boxes"
        
    *   ZIP
        
    
*   The format embedding section has been moved to its own annex
    
    *   Added support for JPEG-XL
        
    
*   Improvements to soft bindings
    
*   Improvements to action assertions
    
    *   Either a `c2pa.created` or a `c2pa.opened` is now mandatory in a standard manifest
        
    *   Some new standard action types were added
        
    *   It is now possible to have multiple action assertions in a single manifest
        
    *   Action templates are now better explained with more examples.
        
    *   RFC 3339-based regions of interest
        
    
*   The various types/forms of unique identifiers for assets have been clarified.
    
*   Added some missing compatibility support for JPEG Trust
    
*   Cleaned up all CDDLs, including removing any normative language
    
*   And various areas of editorial improvements
    
    *   Redefined custom labels to a custom naming scheme.
        
    *   Embedding in PDFs
        
    *   LOTS of editorial improvements to prepare the document for standardization by ISO
        
    

<a id="_2_0_january_2024"></a>
