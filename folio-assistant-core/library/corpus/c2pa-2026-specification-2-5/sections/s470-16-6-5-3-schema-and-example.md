---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s470-16-6-5-3-schema-and-example
section_title: "16.6.5.3. Schema and Example"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9311-9433
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.5.3. Schema and Example

The schema for this type is defined by the `depthmap-gdepth-map` rule in the following [CDDL Definition](https://www.rfc-editor.org/rfc/rfc8610) (see [Section G.5.16, “Depth Map (GDepth)”](#cddl_annex_depthmap_gdepth) for the complete normative schema):

```cddl
; Assertion that encodes a GDepth-formatted 3D depth map of the captured scene
depthmap-gdepth-map = {
  ; The format that describes how to convert the depthmap data into a valid
  ; float-point depthmap. Current valid values are 'RangeInverse' and
  ; 'RangeLinear'
  "GDepth:Format": format-type,
  "GDepth:Near": float, ; The near value of the depthmap in depth units
  "GDepth:Far": float, ; The far value of the depthmap in depth units

  ; The mime type for the base64 string describing the depth image content, e.g.
  ; 'image/jpeg' or 'image/png'",
  "GDepth:Mime": mime-type,

  ; The base64 encoded depth image. See GDepth encoding page at
  ; developers.google.com. The depthmap will be stretched-to-fit the
  ; corresponding color image
  "GDepth:Data": base64-string-type,

  ; The units of the depthmap, e.g. 'm' for meters or 'mm' for millimeters
  ? "GDepth:Units": unit-type,

  ; The type of depth measurement. Current valid values are 'OpticalAxis' and
  ; 'OpticRay
  ? "GDepth:MeasureType": depth-meas-type,

  ; The mime type for the base64 string describing the confidence image content,
  ; e.g. 'image/png'.",
  ? "GDepth:ConfidenceMime": confidence-mime-type,

  ; The base64 encoded confidence image. See GDepth encoding page at
  ; developers.google.com. The confidence map should have the same size as the
  ; depthmap
  ? "GDepth:Confidence": base64-string-type,

  ; The manufacturer of the device that created this depthmap
  ? "GDepth:Manufacturer": tstr .size (1..max-tstr-length),

  ; The model of the device that created this depthmap
  ? "GDepth:Model": tstr .size (1..max-tstr-length),

  ; The software that created this depthmap
  ? "GDepth:Software": tstr .size (1..max-tstr-length),

  ; The width in pixels of the original color image associated to this depthmap.
  ; This is NOT the depthmap width. If present, apps must update this property
  ; when scaling, cropping or rotating the color image. Clients use this
  ; property to verify the integrity of the depthmap w.r.t. the color image
  ? "GDepth:ImageWidth": float,

  ; The height in pixels of the original color image associated to this
  ; depthmap. This is NOT the depthmap height. If present, apps must update this
  ; property when scaling, cropping or rotating the color image. Clients use
  ; this property to verify the integrity of the depthmap w.r.t. the color image
  ? "GDepth:ImageHeight": float,

  ; additional information about the assertion
  ? "metadata": $assertion-metadata-map,
}

base64-string-type = tstr

$mime-choice /= "image/jpeg"
$mime-choice /= "image/png"

mime-type = $mime-choice .default "image/jpeg"
confidence-mime-type = $mime-choice .default "image/png"

$format-choice /= "RangeInverse"
$format-choice /= "RangeLinear"

format-type = $format-choice .default "RangeInverse"

; Unit can be meter represented as "m" or could be millimeter represented as
; "mm"
$unit-choice /= "m"
$unit-choice /= "mm"
unit-type = $unit-choice .default "m"

$depth-meas-choice /= "OpticalAxis"
$depth-meas-choice /= "OpticRay"
depth-meas-type = $depth-meas-choice .default "OpticalAxis"
```

An example in CBOR diagnostic notation ([RFC 8949](https://www.rfc-editor.org/rfc/rfc8949), clause 8) is shown below:

```none
{
  "GDepth:Far": 878.7,
  "GDepth:Data": "hoOspQQ1lFTy/4Tp8Epx670E5QW5NwkNR+2b30KFXug=",
  "GDepth:Mime": "image/jpeg",
  "GDepth:Near": 29.3,
  "GDepth:Model": "CameraCompany Shooter S1",
  "GDepth:Units": "mm",
  "GDepth:Format": "RangeInverse",
  "GDepth:Software": "Truepic Foresight Firmware for QC QRD8250 v0.01",
  "GDepth:Confidence": "acdbpQQ1lFTy/4Tp8Epx670E5QW5NwkNR+2b30KFXug=",
  "GDepth:ImageWidth": 32.2,
  "GDepth:ImageHeight": 43.6
  "GDepth:MeasureType": "OpticalAxis",
  "GDepth:Manufacturer": "CameraCompany",
  "GDepth:ConfidenceMime": "image/png",
}
```

As defined by the GDepth specification, the following fields shall be present in all GDepth depth map assertions:

*   GDepth:Format;
    
*   GDepth:Near;
    
*   GDepth:Far;
    
*   GDepth:Mime;
    
*   GDepth:Data.
    

<a id="_embedded_data"></a>
