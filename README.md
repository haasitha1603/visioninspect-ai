# visioninspect-ai
AI-powered manufacturing defect detection and quality inspection platform.

## Dataset

VisionInspect AI uses the MVTec AD dataset for industrial anomaly inspection.

The dataset is stored locally and is not committed to the GitHub repository because of its large size.

The dataset pipeline supports:
- Dataset category discovery
- Image loading
- Image validation
- Basic image preprocessing
- Image resizing to 256 × 256
- RGB conversion

## Image Upload

The inspection API allows users to upload JPG, JPEG and PNG images.

Uploaded images are:
- Validated by file extension
- Assigned a unique filename
- Stored in the local uploads directory
- Linked to an inspection record in PostgreSQL

The inspection initially receives a `Pending` status until the inspection pipeline processes it.
