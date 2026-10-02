---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-044-363-interoperability-between-dpi-h-and-foundatio
section_title: "Interoperability between DPI-H and foundational DPI"
section_number: 3.6.3
pages: 85-88
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
841 
 
842 
Earlier in this guidance it is observed that general-purpose data exchange DPI are designed to 
843 
move data securely between application components, and that health requires more than 
844 
secure transport. The additional properties the health sector requires — that exchanged data be 
845 
clinically meaningful, structurally consistent, and governed by consent rules granular enough to 
846 
reflect the sensitivity of individual health encounters — are not properties that the transport itself 
847 
should supply. These are properties of the digital health systems that communicate, the shared 
848 
specifications those systems conform to, and the governance arrangements around them — 
849 
exercised at the endpoints of an exchange over a neutral transport. 
850 
 
851 
Foundational data-exchange DPI provides secure, auditable, non-repudiable transport between 
852 
authenticated endpoints, and the health-specific requirements are met by the communicating 
853 
 
 
75 
components and by the shared content, terminology and information-model specifications those 
854 
components implement. 
855 
 
856 
This is important for governance because if the transport were to embed clinical semantics, 
857 
adjudicate consent, or correlate records, then whoever operates the transport would become 
858 
accountable for clinical governance decisions that properly belong to health authorities and to 
859 
the custodians of health data. That would concentrate control inappropriately and create the 
860 
single points of failure and political bottlenecks the architecture warns against. The foundational 
861 
exchange substrate should therefore move and log health data faithfully without transforming or 
862 
interpreting its clinical content; semantic alignment should take place at the source. 
863 
 
864 
Foundational data exchange DPI of the kind described in cross-sector specifications provides 
865 
this substrate: a gateway through which authenticated participants publish and consume 
866 
services and event notifications over open, REST-based interfaces; standardised data formats 
867 
at the boundary between systems; signed and timestamped transaction logs that support audit 
868 
and non-repudiation; and the data-sharing agreements that govern who may access which 
869 
service.29 Such exchange is recommended for communication across networks and is not 
870 
required between co-located systems — a further reason not to treat it as a mandatory central 
871 
component. Where a country already operates mature foundational data exchange DPI, the 
872 
health sector can reuse it rather than build a parallel capability. Where foundational DPI is not 
873 
yet in place, the health sector may need to implement exchange capability of its own in the 
874 
interim, designed so that it can align with national DPI as that matures. The health sector's 
875 
legitimate extension of foundational exchange is therefore semantic and clinical; it is not a 
876 
duplication of transport. 
877 
 
878 
Exchange patterns are an implementation choice, and the architecture does not prescribe one. 
879 
Countries variously achieve exchange through a distributed model, in which each participating 
880 
organisation operates its own access point and a central authority provides registration, logging 
881 
and oversight; through a centralised service bus that mediates all traffic; through gateways that 
882 
protect and mediate the interfaces of individual components; or through direct, standards-
883 
conforming connections between systems. These patterns can coexist within a single country, 
884 
each applied where it is most appropriate — for example, centralised handling of demographic 
885 
look-ups alongside distributed exchange of clinical documents between facilities. What the 
886 
reference architecture describes is not a particular pattern, but that exchange, however it is 
887 
implemented, conforms to open specifications, authenticates and audits its participants, and 
888 
avoids the accumulation of unmanaged bilateral connections. Asynchronous, store-and-forward 
889 
exchange — including publish-and-subscribe eventing — additionally allows endpoints to 
890 
continue operating where connectivity is intermittent and to synchronise when it is restored, a 
891 
common requirement in lower-resource settings. A health facility that registers a birth, for 
892 
example, can publish that event once, allowing the civil registration system and the electronic 
893 
 
29 GovStack Information Mediator Building Block — description, cross-cutting requirements (standardised interchange formats; 
asynchronous-first pub/sub), and functional requirements (distributed access points, signed and timestamped message logs, audit, 
monitoring, data-sharing-agreement governance) 
 
 
76 
immunisation registry each to act on it without the facility maintaining a separate connection to 
894 
either. 
895 
 
896 
 
897 
 
898 
Figure 3.6 — Exchange patterns that can coexist within a single country. The same set of systems may be connected 
899 
through any of these mechanisms, chosen according to context; the architecture does not prescribe one. 
900 
 
901 
 
902 
Legend 
• 
System (navy) — a participating system or component that sends or receives data. 
• 
Access point (AP) — a participating organisation's own connection point in a distributed 
model. 
• 
Gateway — a component-specific interface that protects and mediates access to that 
component. 
• 
Service bus — shared infrastructure through which all traffic is routed. 
• 
Event broker — shared infrastructure that distributes a published event to its subscribers. 
• 
Solid line — exchange of data between endpoints. 
• 
Dashed line — registration, logging and oversight, carrying no data content. 
• 
Arrow — direction of event flow in the publish–subscribe model. 
 
The exchange pattern a country adopts is an implementation choice. Direct connections link systems 
point-to-point, conforming to open national specifications. A central service bus instead mediates all 
traffic through a single shared channel. Gateways place a protective, mediating interface in front of 
each component. In the distributed access-point model, each participating organisation (administrative 
unit of participation) operates its own access point and a central authority provides registration, logging 
and oversight without sitting in the path of the data itself. Publish–subscribe exchange is 
asynchronous: a system publishes an event once, and any authorised subscriber receives it without 
 
 
77 
the publisher addressing each recipient directly; because it is store-and-forward, it also allows 
endpoints to continue operating where connectivity is intermittent and to synchronise when it is 
restored. 
 
These patterns are not mutually exclusive. A single country may use several at once — for example, 
centralised handling of demographic look-ups alongside distributed exchange of clinical documents 
between facilities, and publish–subscribe eventing where a facility that registers a birth publishes that 
event once for a civil registration system and an immunisation registry each to act upon. What the 
architecture asks is not a particular pattern, but that exchange, however it is implemented, conforms to 
open national specifications, authenticates and audits its participants, and avoids the accumulation of 
unmanaged bilateral connections. 
 
 
903 
 
904
