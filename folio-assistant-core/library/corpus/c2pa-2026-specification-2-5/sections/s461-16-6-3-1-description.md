---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s461-16-6-3-1-description
section_title: "16.6.3.1. Description"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 8945-9017
source_sha256: ff401df19d1fde8c
granularity: heading
---
##### 16.6.3.1. Description

The asset type assertion provides a way to more completely describe an asset, specifically additional context on how to parse or otherwise process it. This assertion allows for specifying an IANA Media Type value and/or additional type information, since many assets have formats that cannot be completely described by a single Media Type value.

The asset type assertion shall have a label of `c2pa.asset-type.v2`. There shall be at most one asset type assertion in a C2PA Manifest.

> **NOTE:**
> Earlier versions of this specification documented a `c2pa.asset-type` assertion, which is now deprecated.

If present, the value of the `dc:format` field shall be the [IANA Media Type](https://www.iana.org/assignments/media-types/media-types.xhtml) of the asset.

If present, the value of the `types` field shall be an array of zero or more maps (`asset-type-map`) specifying types associated with the asset. The value of the `type` field in this map shall come from [Table 7, “Asset type values”](#asset-types), [Table 8, “Model type values”](#model-types), or use an [entity-specific namespace](#_namespacing) (e.g., `com.litware.types.abc`), conforming to the syntax defined for assertion labels in [Section 8.2.2, “Label Naming”](#_label_naming). If relevant, the version of the asset (e.g., the version of a dataset or model) can be documented in the `version` field in the `asset-type-map`.

> **NOTE:**
> As C2PA is adopted to provide provenance for AI/ML (i.e., artificial intelligence/machine learning) assets in the future, the C2PA Manifest can be embedded in the model and dataset assets, and the asset type assertion used to specify the type of these model and dataset assets.

**Table 7. Asset type values**

| C2PA Type | Description of C2PA Type of the Asset |
| --- | --- |
| c2pa.types.audit-log | A structured log of creation-phase events collected during a creation process |
| c2pa.types.classifier | AI/ML classifier |
| c2pa.types.cluster | AI/ML clustering model |
| c2pa.types.dataset | AI/ML dataset which can be processed by multiple AI/ML frameworks or is not described by any other value |
| c2pa.types.dataset.jax | JAX dataset |
| c2pa.types.dataset.keras | Keras dataset |
| c2pa.types.dataset.ml\_net | ML.NET dataset |
| c2pa.types.dataset.mxnet | MXNet dataset |
| c2pa.types.dataset.onnx | ONNX dataset |
| c2pa.types.dataset.openvino | OpenVINO dataset |
| c2pa.types.dataset.pytorch | PyTorch dataset |
| c2pa.types.dataset.tensorflow | TensorFlow dataset |
| c2pa.types.format.numpy | Stored using the serialized NumPy format |
| c2pa.types.format.pickle | Stored using the Python pickle format |
| c2pa.types.format.protobuf | Stored using the Protocol Buffer format |
| c2pa.types.generator | AI/ML content generator |
| c2pa.types.generator.prompt | Prompt used to drive an AI/ML content generator |
| c2pa.types.generator.seed | Seed value used to initialize an AI/ML content generator |
| c2pa.types.regressor | AI/ML regression model |
| c2pa.types.tensorflow.hubmodule | TensorFlow Hub module |
| c2pa.types.tensorflow.savedmodel | TensorFlow SavedModel |
| c2pa.types.version-history | A record of revisions to the asset over time |

**Table 8. Model type values**

| C2PA Model Type | Description of C2PA Model Type |
| --- | --- |
| c2pa.types.model | AI/ML model which is not described by any other model type |
| c2pa.types.model.caffe | Caffe model |
| c2pa.types.model.caffe2 | Caffe2 model |
| c2pa.types.model.catboost | CatBoost model |
| c2pa.types.model.coreml | Core ML model |
| c2pa.types.model.flax | Flax model |
| c2pa.types.model.huggingface.transformers | Hugging Face Transformers model |
| c2pa.types.model.jax | JAX model |
| c2pa.types.model.keras | Keras model |
| c2pa.types.model.lightgbm | LightGBM model |
| c2pa.types.model.ml\_net | ML.NET model |
| c2pa.types.model.mxnet | MXNet model |
| c2pa.types.model.onnx | ONNX model |
| c2pa.types.model.openvino | OpenVINO model |
| c2pa.types.model.openvino.parameter | OpenVINO model parameter |
| c2pa.types.model.openvino.topology | OpenVINO model topology |
| c2pa.types.model.paddle | PaddlePaddle model |
| c2pa.types.model.pytorch | PyTorch model |
| c2pa.types.model.sklearn | scikit-learn model |
| c2pa.types.model.tensorflow | TensorFlow model |
| c2pa.types.model.tensorrt | TensorRT model |
| c2pa.types.model.tflite | TensorFlow Lite model |
| c2pa.types.model.torchscript | TorchScript model |
| c2pa.types.model.xgboost | XGBoost model |

<a id="_schema_and_example_14"></a>
