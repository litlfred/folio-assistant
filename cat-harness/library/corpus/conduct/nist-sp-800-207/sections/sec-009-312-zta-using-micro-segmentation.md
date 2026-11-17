---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-009-312-zta-using-micro-segmentation
section_title: "ZTA Using Micro-Segmentation"
section_number: 3.1.2
pages: 21-21
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
An enterprise may choose to implement a ZTA based on placing individual or groups of 
resources on a unique network segment protected by a gateway security component. In this 
approach, the enterprise places infrastructure devices such as intelligent switches (or routers) or 
next generation firewalls (NGFWs) or special purpose gateway devices to act as PEPs protecting 
each resource or small group of related resources. Alternatively (or additionally), the enterprise 
may choose to implement host-based micro-segmentation using software agents (see Section 
3.2.1) or firewalls on the endpoint asset(s), These gateway devices dynamically grant access to 
individual requests from a client, asset or service. Depending on the model, the gateway may be 
the sole PEP component or part of a multipart PEP consisting of the gateway and client-side 
agent (see Section 3.2.1). 
This approach applies to a variety of use cases and deployment models as the protecting device 
acts as the PEP, with management of said devices acting as the PE/PA component. This 
approach requires an identity governance program (IGP) to fully function but relies on the 
gateway components to act as the PEP that shields resources from unauthorized access and/or 
discovery. 
The key necessity to this approach is that the PEP components are managed and should be able 
to react and reconfigure as needed to respond to threats or change in the workflow. It is possible 
to implement some features of a micro-segmented enterprise by using less advanced gateway 
devices and even stateless firewalls, but the administration cost and difficulty to quickly adapt to 
changes make this a very poor choice.
