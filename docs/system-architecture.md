# System Architecture

## Architecture Overview

VisionInspect AI follows a frontend-backend architecture in which the React frontend communicates with the Python FastAPI backend through APIs.

The backend manages authentication, authorization, image upload, inspection management, and database communication.

## Architecture Components

### Frontend

React.js / Next.js

Responsible for:

- Login interface
- Dashboard
- Image upload interface
- Inspection information
- User interaction

### Backend

Python + FastAPI

Responsible for:

- Authentication
- Authorization
- User management
- Image upload APIs
- Image validation
- Inspection management
- Communication with the database

### Database

PostgreSQL

Responsible for storing:

- User information
- User roles
- Inspection records
- Image information
- Inspection status

### Image Processing

OpenCV

Used for basic image validation and preprocessing during the initial inspection workflow.

## High-Level Flow

User
↓
React Frontend
↓
FastAPI Backend
↓
PostgreSQL Database

Uploaded Product Image
↓
FastAPI
↓
Image Validation / Processing
↓
Inspection Record
↓
Dashboard