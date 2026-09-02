# VisionInspect AI — Industrial Manufacturing Defect Detection & Quality Inspection Platform

**VisionInspect AI** is an AI-powered manufacturing quality control platform designed for automated product image inspection, quantitative image quality analysis, image preprocessing, and computer vision anomaly detection using the **MVTec AD dataset**.

---

## 🌟 Key Features

### Milestone 1 — Core Setup & Infrastructure
- **Role-Based Authentication**: JWT authentication supporting `QUALITY_ENGINEER` and `FACTORY_SUPERVISOR` roles with password hashing (`bcrypt`).
- **PostgreSQL Database**: SQLAlchemy ORM storing user accounts and detailed inspection logs.
- **Product Image Upload**: Multi-format image ingestion (JPG, JPEG, PNG) with UUID filename generation and static file serving.
- **Developer Documentation**: FastAPI Swagger API documentation available at `http://127.0.0.1:8000/docs`.

### Milestone 2 — Image Processing & Defect Detection Engine
- **Image Preprocessing Pipeline**: Built with OpenCV & NumPy:
  - Image format verification & corruption check
  - RGB color space conversion
  - Standardized image resizing to 256×256
  - Noise reduction via Gaussian Blurring
  - Contrast enhancement using CLAHE on luminance channels
  - Matrix normalization (0.0 to 1.0)
- **Quantitative Quality Analysis**: Calculates real metrics directly from uploaded image bytes:
  - Image resolution (width × height, channels)
  - Brightness (mean pixel luminance 0-255)
  - Contrast (luminance standard deviation)
  - Sharpness score (Laplacian variance)
  - File size calculation (KB)
  - Overall quality grade (`Good`, `Acceptable`, `Poor`)
- **AI Defect Detection Engine**:
  - Feature extraction pipeline combining RGB/HSV color histograms, grid-wise spatial mean/std features, and Sobel gradient energy.
  - Anomaly Detector (`IsolationForest` + `StandardScaler`) trained on normal manufacturing images from MVTec AD (`bottle`, `cable`, `capsule`, `metal_nut`, `carpet`, etc.).
  - Computes real prediction (`Normal` vs `Anomaly`), model confidence percentage, and inference speed in milliseconds.
- **Industrial Dashboard & Inspection Reports**:
  - KPI summary metrics: Total Inspections, Normal Count, Anomaly Count, Pass Rate (%), Average Speed (ms).
  - Search and filter bar by prediction status and file name.
  - Interactive Inspection Report view with side-by-side comparison of Raw Upload Image vs CV Preprocessed Image.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn, SQLAlchemy, PostgreSQL, Pydantic, Python-JOSE, Passlib
- **Machine Learning & Computer Vision**: OpenCV, scikit-learn, NumPy, PIL, SciPy
- **Frontend**: React 19, Vite, JavaScript, Custom Industrial CSS Theme
- **Dataset**: MVTec Anomaly Detection (MVTec AD)

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL server running locally at `localhost:5432` with database `visioninspect`

### 2. Database Configuration
Ensure your `.env` file exists at `visioninspect-ai/backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/visioninspect
```

### 3. Backend Setup & Run
```bash
# Navigate to backend folder
cd visioninspect-ai/backend

# Activate virtual environment
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Run model training on MVTec dataset (optional, auto-trains if model is missing)
python -m app.ml.train_model

# Launch FastAPI backend server
uvicorn app.main:app --reload
```
The FastAPI backend will run at: `http://127.0.0.1:8000`
Swagger UI is accessible at: `http://127.0.0.1:8000/docs`

### 4. Frontend Setup & Run
```bash
# Navigate to frontend folder
cd visioninspect-ai/frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
The React application will run at: `http://localhost:5173`

---

## 📡 Key API Endpoints

- `POST /auth/register` — Register a new inspector account
- `POST /auth/login` — Sign in and obtain JWT access token
- `POST /inspections/upload` — Upload image, execute quality check, preprocessing, and AI defect detection
- `GET /inspections` — List all inspection records ordered by timestamp
- `GET /inspections/{id}` — Retrieve detailed inspection report with preprocessed image URLs
- `POST /inspections/{id}/analyze` — Re-run analysis on an existing record

---

## 📂 Project Structure

```text
visioninspect-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # Auth API endpoints (Register/Login)
│   │   │   └── inspections.py   # Inspection upload & analytics endpoints
│   │   ├── auth/                # Password hashing & JWT generation
│   │   ├── ml/                  # AI Defect Detector & MVTec training workflow
│   │   │   ├── defect_detector.py
│   │   │   └── train_model.py
│   │   ├── models/              # SQLAlchemy database models (User, Inspection)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Preprocessing & Image Quality Analysis services
│   │   │   ├── preprocessing_service.py
│   │   │   └── quality_service.py
│   │   ├── database.py          # DB engine & Session setup
│   │   ├── dataset_loader.py    # MVTec AD dataset helper
│   │   └── main.py              # FastAPI app instance & static file mounting
│   ├── uploads/                 # Storage for raw uploads and preprocessed images
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── InspectionReportModal.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   └── Login.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
├── dataset/                     # MVTec AD Dataset root
└── README.md
```
