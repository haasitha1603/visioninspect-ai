# VisionInspect AI: Technology Stack and Implemented Features

## 1. Project Overview

VisionInspect AI is an industrial manufacturing quality-inspection platform. It accepts product images, measures image quality, preprocesses the images, detects visual anomalies, assigns defect and severity information, stores the inspection result, and presents the results through a web dashboard.

The current implementation is a computer-vision and classical machine-learning system. It is not currently an LLM-powered application.

## 2. Technology Stack

### Backend

- **Language:** Python 3.13 (the project README specifies Python 3.10+)
- **Web framework:** FastAPI 0.141.1
- **ASGI server:** Uvicorn 0.52.4
- **API documentation:** FastAPI-generated Swagger UI at `/docs` and ReDoc support
- **Validation and schemas:** Pydantic 2.13.4
- **ORM:** SQLAlchemy 2.0.52
- **Database driver:** psycopg2-binary 2.9.12
- **Database:** PostgreSQL
- **Configuration:** python-dotenv
- **File uploads:** FastAPI `UploadFile` and `python-multipart`
- **Static files:** FastAPI `StaticFiles`
- **Cross-origin requests:** FastAPI/Starlette CORS middleware

### Authentication and Security

- **Authentication format:** JWT bearer access tokens
- **JWT library:** python-jose 3.5.0
- **Password hashing:** bcrypt 4.0.1 through Passlib 1.7.4
- **Roles currently supported:**
  - `QUALITY_ENGINEER`
  - `FACTORY_SUPERVISOR`

### Computer Vision and Image Processing

- **OpenCV:** `opencv-python` 5.0.0.93
- **Numerical processing:** NumPy 2.5.2
- **Image validation:** Pillow 12.3.0
- **Scientific utilities:** SciPy 1.18.1

### Machine Learning

- **ML library:** scikit-learn 1.9.0
- **Algorithm:** Isolation Forest for unsupervised anomaly detection
- **Feature scaling:** scikit-learn `StandardScaler`
- **Model persistence:** Python `pickle`
- **Model storage:** `backend/app/ml/models/defect_detector.pkl`

### Frontend

- **Language:** JavaScript with JSX
- **UI framework:** React 19.2.8
- **DOM rendering:** React DOM 19.2.8
- **Build tool and development server:** Vite 8.2.2
- **Frontend styling:** Custom CSS in `App.css` and `index.css`
- **Linting:** Oxlint
- **Frontend communication:** Browser `fetch` requests to the FastAPI API

### Dataset

- **Dataset:** MVTec Anomaly Detection (MVTec AD)
- **Use:** Normal manufacturing images from the dataset are used to train the anomaly detector.
- **Categories included in the repository:** Examples include bottle, cable, capsule, carpet, grid, hazelnut, leather, metal_nut, pill, screw, tile, toothbrush, transistor, wood, and zipper.

### Storage

- **Relational data:** PostgreSQL stores users and inspection records.
- **Raw images:** Stored locally under `backend/uploads/inspections/`.
- **Preprocessed images:** Stored locally under `backend/uploads/processed/`.
- **Public image access:** FastAPI exposes the uploads directory through `/uploads`.

## 3. LLM and Generative AI Status

### Is an LLM currently used?

**No.** The current repository does not contain an LLM integration.

There is no OpenAI, Azure OpenAI, Anthropic, Google Gemini, Ollama, Hugging Face Transformers, LangChain, or other LLM client/dependency in the backend requirements or application code. There are also no API-key settings or model calls for a language model.

### What is used instead?

The project uses:

1. OpenCV and NumPy for image processing and feature extraction.
2. A scikit-learn Isolation Forest trained on normal MVTec AD images for anomaly detection.
3. Deterministic computer-vision rules for defect categorization, severity scoring, risk level, quality status, and recommendations.

The term "AI" in the UI currently refers to the anomaly-detection and computer-vision pipeline, not to a language model.

## 4. End-to-End Inspection Flow

1. A Quality Engineer selects a JPG, JPEG, or PNG image in the React frontend.
2. The frontend sends the image to `POST /inspections/upload` as multipart form data.
3. The backend validates the extension and stores the original image with a UUID filename.
4. Image quality analysis calculates resolution, channels, file size, brightness, contrast, and sharpness.
5. The preprocessing pipeline validates the file, converts BGR to RGB, resizes it to 256 x 256, applies Gaussian denoising, applies CLAHE contrast enhancement in LAB space, normalizes values to 0.0-1.0, and saves a processed copy.
6. The detector extracts color, spatial, and gradient features from the processed image.
7. The StandardScaler and Isolation Forest produce a `Normal` or `Anomaly` prediction, anomaly score, confidence value, and inference duration.
8. The defect analysis service categorizes anomalies and calculates severity and risk.
9. The complete result is saved as an inspection record in PostgreSQL.
10. The API returns the report and URLs for the original and preprocessed images.
11. The React UI displays the result and makes it available in the dashboard and inspection report modal.

## 5. Features Implemented So Far

### Authentication and Roles

- User registration with name, email, password, and role.
- Duplicate-email prevention.
- Password hashing with bcrypt.
- Login with email and password.
- JWT access-token generation.
- Role-aware frontend navigation.
- Quality Engineers can upload and start inspections.
- Factory Supervisors have monitoring access but cannot upload or start inspections.

### Image Upload and Storage

- Drag-and-drop image selection.
- File browser selection.
- JPG, JPEG, and PNG validation in the frontend and backend.
- Local storage of uploaded images.
- UUID-based stored filenames to avoid collisions.
- Original image preview before submission.
- Preprocessed image storage and static serving.
- Failed inspections are recorded with `Failed` status.

### Image Quality Analysis

The backend calculates:

- Image width and height.
- Channel count.
- Resolution string.
- File size in KB.
- Mean grayscale brightness.
- Grayscale contrast using standard deviation.
- Sharpness using Laplacian variance.
- Per-metric status: `Good`, `Acceptable`, or `Poor`.
- Overall quality grade: `Good`, `Acceptable`, or `Poor`.

### Image Preprocessing

- File integrity and corruption check with Pillow.
- OpenCV image decoding check.
- BGR-to-RGB conversion.
- Standard resize to 256 x 256.
- Gaussian blur for denoising.
- CLAHE contrast enhancement on the LAB luminance channel.
- Floating-point normalization to the 0.0-1.0 range.
- Saving of the enhanced image for report comparison.

### Defect and Anomaly Detection

- Training on the `good` samples from available MVTec AD categories.
- Configurable maximum sample count per category, currently 40 by default.
- RGB histograms with 16 bins per channel.
- HSV histograms with 16 hue bins and 8 saturation/value bins.
- 4 x 4 spatial grid mean and standard-deviation features.
- Sobel gradient magnitude statistics.
- StandardScaler normalization.
- Isolation Forest with 100 estimators and 0.08 contamination.
- Persisted model and scaler loaded automatically at startup.
- Automatic model training when the saved model is unavailable.
- `Normal` versus `Anomaly` prediction.
- Anomaly score.
- Confidence percentage derived from distance to the decision boundary.
- Processing-time measurement in milliseconds.

### Defect Categorization and Quality Decisioning

For anomalous images, the current deterministic analysis can assign:

- `Crack / Break`
- `Contamination`
- `Surface Scratch / Dent`
- `Structural Defect`

The service also calculates:

- Defect size score.
- Defect location score based on distance from the image center.
- Defect-type score.
- Model-confidence score.
- Weighted severity score from 0 to 100.
- Severity level: `Low`, `Medium`, `High`, or `Critical`.
- Risk level: `Low Risk`, `Moderate Risk`, `High Risk`, or `Critical Risk`.
- Quality status: `PASS`, `REVIEW`, or `FAIL`.
- Production recommendation, such as approve, manually review, rework, or reject.
- A severity-score breakdown returned with the report.

Clean images receive `None (Clean)`, a zero severity score, `Low` severity, `Acceptable` risk, and a `PASS` quality decision.

### Database and Inspection Records

- PostgreSQL `users` table.
- PostgreSQL `inspections` table.
- SQLAlchemy models for both tables.
- Inspection records include source paths, prediction, confidence, quality metrics, preprocessing path, processing time, defect type, severity, risk, recommendation, timestamps, and status.
- Startup database initialization with `Base.metadata.create_all`.
- Startup compatibility migration for newer inspection columns.

### API Endpoints

- `GET /` - API health response.
- `POST /auth/register` - Register a user and issue a JWT.
- `POST /auth/login` - Authenticate a user and issue a JWT.
- `POST /inspections/upload` - Run the complete inspection pipeline.
- `GET /inspections` - List inspection records.
- `GET /inspections/{id}` - Retrieve an individual inspection report.
- `POST /inspections/{id}/analyze` - Re-run analysis for an existing inspection.
- `GET /inspections/analytics/summary` - Return aggregate quality and defect metrics.
- `GET /inspections/analytics/trends` - Return timeline-based production trends.
- `GET /docs` - OpenAPI Swagger UI.

### Dashboard and Reporting UI

- Backend health indicator showing API connection state.
- Quality Engineer dashboard.
- Factory Supervisor monitoring dashboard.
- KPI cards for total inspections, pass rate, defect rate, average severity, and processing speed.
- Search by image name, defect category, or inspection ID.
- Filters for all, PASS, FAIL, and REVIEW records.
- Inspection table with image thumbnail, defect category, severity, decision, confidence, and timestamp.
- Supervisor-only defect distribution view.
- Supervisor-only severity and quality distribution view.
- Supervisor-only historical production trend monitoring.
- Refresh analytics action.
- Detailed inspection report modal.
- Side-by-side original and preprocessed image comparison.
- Upload progress steps for validation, quality analysis, preprocessing, and model inference.
- Error and empty-state handling in the frontend.

## 6. Current Architecture

```text
React + Vite frontend
        |
        | HTTP fetch / multipart upload / JSON responses
        v
FastAPI backend
        |
        +-- Authentication: JWT + bcrypt
        +-- Inspection API
        +-- Quality analysis: OpenCV + NumPy
        +-- Preprocessing: OpenCV + Pillow + NumPy
        +-- Anomaly model: scikit-learn Isolation Forest
        +-- Severity/risk rules: Python + OpenCV + NumPy
        +-- Persistence: SQLAlchemy + PostgreSQL
        +-- Local image storage: uploads/
```

## 7. What Has Been Extracted from the Project So Far

The project currently contains the following completed development milestones:

### Milestone 1: Platform Foundation

- FastAPI backend initialized.
- React frontend initialized.
- PostgreSQL and SQLAlchemy configured.
- User and inspection tables created.
- Registration, login, password hashing, JWTs, and roles implemented.
- MVTec AD dataset integrated for category discovery and image loading.
- Initial JPG/JPEG/PNG upload workflow implemented.
- Inspection records and initial dashboard implemented.

### Milestone 2: Image Processing and Anomaly Detection

- Quantitative image-quality analysis implemented.
- Image validation and preprocessing pipeline implemented.
- MVTec-based feature extraction and anomaly detector implemented.
- Real prediction, confidence, anomaly score, and processing time returned.
- Original/preprocessed image comparison added to reports.

### Milestone 3: Defect Analysis and Production Monitoring

- Defect categories extracted from image signatures.
- Severity scoring and weighted score breakdown implemented.
- Risk levels, quality decisions, and recommendations implemented.
- Summary analytics and timeline trends implemented.
- Factory Supervisor monitoring view implemented.
- Quality Engineer upload and inspection workflow implemented.

## 8. Current Limitations and Important Notes

- The model is an unsupervised anomaly detector, not a supervised defect-classification model trained with labeled defect classes.
- Defect names are inferred by deterministic image signatures after anomaly detection; they are not produced by an LLM and should be validated against production data.
- Images and model artifacts are stored locally rather than in object storage or a model registry.
- The frontend currently calls the local backend URL directly: `http://127.0.0.1:8000`.
- CORS is configured broadly with `allow_origins=["*"]`; production deployment should restrict allowed origins.
- The backend currently supports local PostgreSQL configuration through the `DATABASE_URL` environment variable.
- The project contains API authentication, but some inspection request fields also accept form defaults for local workflow compatibility. Production authorization should be tightened around the authenticated user identity.
- There are no automated test suites or CI details represented in the current project files reviewed for this document.

## 9. Run-Time Requirements

- Python 3.10 or newer.
- Node.js 18 or newer.
- PostgreSQL running locally or remotely.
- A configured `DATABASE_URL` in `backend/.env`.
- The MVTec AD dataset available under the project dataset path for model training.

Typical commands:

```powershell
# Backend
cd visioninspect-ai/backend
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend, in a second terminal
cd visioninspect-ai/frontend
npm install
npm run dev
```
