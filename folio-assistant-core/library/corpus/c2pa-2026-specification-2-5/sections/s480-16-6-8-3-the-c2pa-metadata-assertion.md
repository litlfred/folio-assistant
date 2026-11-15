---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s480-16-6-8-3-the-c2pa-metadata-assertion
section_title: "16.6.8.3. The `c2pa.metadata` assertion"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 9567-9634
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.8.3. The `c2pa.metadata` assertion

This specification defines one metadata assertion, whose label is `c2pa.metadata`, which is used to represent a subset of common metadata schemas that may be used in any C2PA Manifest. Claim generators shall include in this assertion only the specific metadata fields enumerated in [Appendix C, _Implementation Details for `c2pa.metadata`_](#metadata_annex).

> **NOTE:**
> Custom labelled metadata assertions can contain any values from any schemas.

Example 15. `c2pa.metadata` assertion for an image

An example of an `c2pa.metadata` assertion for an image:

```json
{
	"@context" : {
		"exif": "http://ns.adobe.com/exif/1.0/",
		"exifEX": "http://cipa.jp/exif/2.32/",
		"tiff": "http://ns.adobe.com/tiff/1.0/",
		"Iptc4xmpExt": "http://iptc.org/std/Iptc4xmpExt/2008-02-29/",
		"photoshop" : "http://ns.adobe.com/photoshop/1.0/"
	},
	"photoshop:DateCreated": "Aug 31, 2022", 
	"Iptc4xmpExt:DigitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture",
	"exif:GPSVersionID": "2.2.0.0",
	"exif:GPSLatitude": "39,21.102N",
	"exif:GPSLongitude": "74,26.5737W",
	"exif:GPSAltitudeRef": 0,
	"exif:GPSAltitude": "100963/29890",
	"exif:GPSTimeStamp": "18:22:57",
	"exif:GPSDateStamp": "2019:09:22",
	"exif:GPSSpeedRef": "K",
	"exif:GPSSpeed": "4009/161323",
	"exif:GPSImgDirectionRef": "T",
	"exif:GPSImgDirection": "296140/911",
	"exif:GPSDestBearingRef": "T",
	"exif:GPSDestBearing": "296140/911",
	"exif:GPSHPositioningError": "13244/2207",
	"exif:ExposureTime": "1/100",
	"exif:FNumber": 4.0,
	"exif:ColorSpace": 1,
	"exif:DigitalZoomRatio": 2.0,
	"tiff:Make": "CameraCompany",
	"tiff:Model": "Shooter S1",
	"exifEX:LensMake": "CameraCompany",
	"exifEX:LensModel": "17.0-35.0 mm",
	"exifEX:LensSpecification": { "@list": [ 1.55, 4.2, 1.6, 2.4 ] }
  
}
```

Example 16. `c2pa.metadata` assertion for a PDF

An example of an `c2pa.metadata` assertion for a PDF:

```json
{
	"@context" : {
	  "dc" : "http://purl.org/dc/elements/1.1/",
	  "xmp" : "http://ns.adobe.com/xap/1.0/",
	  "pdf" : "http://ns.adobe.com/pdf/1.3/"
	},
	"dc:created": "2015-02-18",
	"xmp:CreatorTool": "TeX",
	"pdf:Producer": "pdfTeX-1.40.14",
	"pdf:Trapped": "Unknown"
}
```

<a id="_redaction_of_c2pa_metadata"></a>
