---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s384-16-4-1-2-mandatory-presence-of-at-least-one-acti
section_title: "16.4.1.2. Mandatory presence of at least one actions assertion"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 6667-6693
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.4.1.2. Mandatory presence of at least one actions assertion

There shall be at least one actions assertion present in the `created_assertions` array of the Claim of a [standard C2PA Manifest](#_standard_manifests). Furthermore:

*   If the asset was created _de novo_ (for example, as a result of performing a `File → New` operation in a creative tool, capturing a photo or video, or generating the media by a generative AI model), then the `actions` array in the first `c2pa.actions` assertion in the `created_assertions` array of the Claim shall have a `c2pa.created` action as its first element.
    
    *   For all assets, a corresponding `digitalSourceType` field, with an appropriate value, shall be recorded with the `c2pa.created` action, to indicate the nature of the asset at its inception. If the asset is created with no [digital content](#_digital_content), then the `digitalSourceType` field shall have the value `[http://c2pa.org/digitalsourcetype/empty](http://c2pa.org/digitalsourcetype/empty)`.
        
    
*   If the asset was created by opening an existing asset as a `parentOf` [ingredient](#_relationship) for editing, then the `actions` array in the first `c2pa.actions` assertion in the `created_assertions` array of the Claim shall have a `c2pa.opened` action as its first element. The claim generator shall also add a corresponding `c2pa.ingredient.v3` assertion for the ingredient that was opened, and include a hashed-uri reference to it in the value of the `ingredients` field of its `parameters` object.
    

> **NOTE:**
> This requirement does not apply to [Update Manifests](#_update_manifests).

> **NOTE:**
> No `digitalSourceType` field is required in conjunction with a `c2pa.opened` action.

The full set of actions assertions in a C2PA Manifest shall contain no more than one action whose type is either `c2pa.created` or `c2pa.opened`.

EXAMPLE: A generative AI model generates a video in response to a text prompt. The resulting video asset’s active manifest would have a `c2pa.actions` assertion starting with a `c2pa.created` action, itself having a value of `[http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia](http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia)` in the corresponding `digitalSourceType` field.

EXAMPLE: A user opens Emily’s Mobile Poster Maker to create an image for a social media post. The user selects a template, then begins customizing it, importing some existing photos in the process. The resulting image asset’s active manifest would have a `c2pa.actions` assertion starting with a `c2pa.created` action and a value of `[http://c2pa.org/digitalsourcetype/empty](http://c2pa.org/digitalsourcetype/empty)` in the `digitalSourceType` field, indicating that this began as a new file. It would also have a `c2pa.placed` action for each photo that the user imported, each pointing to a corresponding ingredient assertion where a `componentOf` relationship is indicated. Finally, it will have additional actions recorded for other operations the user performs.

EXAMPLE: The media desk at a newspaper wants to edit a photo that was captured by a photojournalist with a C2PA-enabled camera. The media editor opens the photo and applies crop and vignette operations. The resulting edited photo asset’s active manifest has a `c2pa.actions` assertion with a `c2pa.opened` action pointing to an ingredient assertion for the original photo, where a `parentOf` relationship is indicated. It would also have actions for the cropping and vignette edits.

<a id="all-actions"></a>
