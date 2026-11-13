---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s647-a-9-4-1-single-line-form-comments
section_title: "A.9.4.1. Single-Line Form (Comments)"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 12333-12371
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### A.9.4.1. Single-Line Form (Comments)

For formats with single-line or block comment syntax, the manifest block is expressed as a single comment line:

```none
<commentPrefix> -----BEGIN C2PA MANIFEST----- <manifest-reference> -----END C2PA MANIFEST----- <commentSuffix>
```

Where:

*   `<commentPrefix>` is the host format’s comment introducer (e.g., `#`, `//`, `--`, `;`, `%`, `/*`, `\<!--`, `NOTE`)
    
*   `-----BEGIN C2PA MANIFEST-----` and `-----END C2PA MANIFEST-----` are the fixed delimiters
    
*   `<manifest-reference>` is one of:
    
    *   A URI to an external manifest store (preferred)
        
    *   A `data:` URI ([RFC 2397](https://www.rfc-editor.org/rfc/rfc2397)) containing the Base64-encoded C2PA Manifest Store: `data:application/c2pa;base64,<data>`
        
    
*   `<commentSuffix>` is the host format’s comment terminator, if required (e.g., `*/`, `-→`)
    

Where possible, it is strongly recommended to place the manifest block at the beginning of the file. When the first line of the file is reserved by the host format (e.g., a shebang line `#!/…​` in scripts, or an XML declaration `<?xml …​?>` in XML documents), the manifest block shall be placed at the end of the file so that the `-----END C2PA MANIFEST-----` delimiter appears on the last line.

For formats where a reserved header line is followed by block-structured content separated by blank lines (e.g., [WebVTT](https://www.w3.org/TR/webvtt1/) files beginning with the `WEBVTT` signature), the manifest block should be placed immediately after the header, separated from adjacent blocks by blank lines as required by the host format.

The use of the ASCII Armour-style delimiters enables format-agnostic discovery: a validator reads the first and last lines of the file and checks for the presence of this delimiter without needing to understand the host format’s comment syntax.

When host formats define comment conventions that signal toolchains to preserve specific comments (e.g., comments beginning with `/*!` in JavaScript and CSS), claim generators should use them for the reference line.

> **NOTE:**
> Comment-based embedding relies on the host format preserving comments through its toolchain.

> **NOTE:**
> Preservation-hint conventions do not guarantee that comments will survive all toolchains.

<a id="_multi_line_form_front_matter"></a>
