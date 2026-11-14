---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s736-g-5-7-asset-type-and-model-enumeration-values
section_title: "G.5.7. Asset Type and Model Enumeration Values"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 14987-15044
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### G.5.7. Asset Type and Model Enumeration Values

```cddl
; Enumerated values for $model-type-choice and $asset-type-choice
; (used in asset-type.cddl)

$model-type-choice /= "c2pa.types.model"
$model-type-choice /= "c2pa.types.model.caffe"
$model-type-choice /= "c2pa.types.model.caffe2"
$model-type-choice /= "c2pa.types.model.catboost"
$model-type-choice /= "c2pa.types.model.coreml"
$model-type-choice /= "c2pa.types.model.flax"
$model-type-choice /= "c2pa.types.model.huggingface.transformers"
$model-type-choice /= "c2pa.types.model.jax"
$model-type-choice /= "c2pa.types.model.keras"
$model-type-choice /= "c2pa.types.model.lightgbm"
$model-type-choice /= "c2pa.types.model.ml_net"
$model-type-choice /= "c2pa.types.model.mxnet"
$model-type-choice /= "c2pa.types.model.onnx"
$model-type-choice /= "c2pa.types.model.openvino"
$model-type-choice /= "c2pa.types.model.openvino.parameter"
$model-type-choice /= "c2pa.types.model.openvino.topology"
$model-type-choice /= "c2pa.types.model.paddle"
$model-type-choice /= "c2pa.types.model.pytorch"
$model-type-choice /= "c2pa.types.model.sklearn"
$model-type-choice /= "c2pa.types.model.tensorflow"
$model-type-choice /= "c2pa.types.model.tensorrt"
$model-type-choice /= "c2pa.types.model.tflite"
$model-type-choice /= "c2pa.types.model.torchscript"
$model-type-choice /= "c2pa.types.model.xgboost"

$asset-type-choice /= "c2pa.types.audit-log"
$asset-type-choice /= "c2pa.types.classifier"
$asset-type-choice /= "c2pa.types.cluster"
$asset-type-choice /= "c2pa.types.dataset"
$asset-type-choice /= "c2pa.types.dataset.jax"
$asset-type-choice /= "c2pa.types.dataset.keras"
$asset-type-choice /= "c2pa.types.dataset.ml_net"
$asset-type-choice /= "c2pa.types.dataset.mxnet"
$asset-type-choice /= "c2pa.types.dataset.onnx"
$asset-type-choice /= "c2pa.types.dataset.openvino"
$asset-type-choice /= "c2pa.types.dataset.pytorch"
$asset-type-choice /= "c2pa.types.dataset.tensorflow"
$asset-type-choice /= "c2pa.types.format.numpy"
$asset-type-choice /= "c2pa.types.format.protobuf"
$asset-type-choice /= "c2pa.types.format.pickle"
$asset-type-choice /= "c2pa.types.generator"
$asset-type-choice /= "c2pa.types.generator.prompt"
$asset-type-choice /= "c2pa.types.generator.seed"
$asset-type-choice /= "c2pa.types.regressor"
$asset-type-choice /= "c2pa.types.tensorflow.hubmodule"
$asset-type-choice /= "c2pa.types.tensorflow.savedmodel"
$asset-type-choice /= "c2pa.types.version-history"
$asset-type-choice /= $model-type-choice
$asset-type-choice /= tstr .regexp "([\\da-zA-Z_-]+\\.)+[\\da-zA-Z_-]+"
```

<a id="cddl_annex_external_reference"></a>
