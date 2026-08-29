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

# VisionInspect AI

AI-powered manufacturing quality inspection platform.

## Project Overview

VisionInspect AI is a manufacturing quality inspection platform designed to support image-based inspection workflows.

## Milestone 1

Milestone 1 establishes the project foundation, including:

- System architecture
- PostgreSQL database
- Authentication
- Role-based access
- MVTec AD dataset integration
- Image preprocessing
- Inspection image upload
- Inspection dashboard

## Technology Stack

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL

### Frontend
- React

### Dataset
- MVTec AD

## Authentication

The platform supports:

- QUALITY_ENGINEER
- FACTORY_SUPERVISOR

Passwords are stored using secure password hashing.

## Dataset

MVTec AD is used as the industrial anomaly inspection dataset.

The dataset is kept locally and excluded from GitHub because of its size.

## Inspection Workflow

1. User logs in
2. User uploads an inspection image
3. Backend validates the image
4. Image is stored
5. Inspection record is created
6. Inspection status is set to Pending
7. Inspection appears on the dashboard

## Current Status

Milestone 1 completed.

AI-based defect detection and model training are planned for the next milestone.
