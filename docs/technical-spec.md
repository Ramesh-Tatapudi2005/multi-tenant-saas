# Project Structure

This document outlines the file system organization for the Multi-Tenant SaaS Platform, covering the Root, Backend, and Frontend directories.

## 🌳 Root Directory (`MULTI-TENANT-SAAS/`)
The root directory acts as the orchestrator for the entire application, containing deployment configurations, environment variables, and mandatory evaluation artifacts.

```text
MULTI-TENANT-SAAS/
├── backend/                 # Backend API source code (FastAPI)
├── frontend/                # Frontend React application
├── docs/                    # Technical documentation (PRD, Architecture, Research)
├── .env                     # Global environment variables
├── docker-compose.yml       # Main Docker orchestration file
├── README.md                # Project documentation and setup guide
└── submission.json          # Test credentials for automated evaluation
```

## 🐍 Backend Structure (backend/)
The backend is built with Python and FastAPI, following a modular architecture designed for high performance and strict multi-tenant isolation.

```text
backend/
├── app/                     # Core application package
│   ├── auth.py              # JWT authentication & password security logic
│   ├── database.py          # SQLAlchemy engine & session configuration
│   ├── main.py              # FastAPI entry point & API route registration
│   ├── models.py            # Database schema definitions (SQLAlchemy)
│   ├── schemas.py           # Pydantic models for data validation
│   └── seed.py              # Automatic database initialization & seed data
├── Dockerfile               # Docker build instructions for Backend
└── requirements.txt         # Python dependency list
```

## Key Folder Descriptions (Backend)
- app/models.py: Defines the relational structure for Tenants, Users, Projects, and Tasks with tenant_id columns to enforce data isolation.

- app/auth.py: Implements secure password hashing and JWT token creation, embedding the user's role and tenant_id for authorization.

- app/seed.py: Handles the automatic population of the database with the mandatory Super Admin and demo tenant data upon first startup.

## ⚛️ Frontend Structure (frontend/)

```text 
frontend/
├── public/                  # Static assets (index.html)
├── src/                     # Source code
│   ├── pages/               # View components (Login.js, Dashboard.js, etc.)
│   ├── services/            # API communication layers
│   │   └── api.js           # Axios instance with JWT interceptors
│   ├── utils/               # Helper functions
│   │   └── tenant.js        # Tenant identification utilities
│   ├── App.js               # Root component & Protected Routing
│   └── index.js             # Frontend entry point
├── Dockerfile               # Build instructions for Frontend container
├── package.json             # Dependencies and scripts
└── node_modules/            # Installed packages (Ignored by Git)
```

## Key Folder Descriptions (Frontend)
- src/pages/: Contains the logic for different views, including dashboards with Recharts for project status tracking.

- src/services/api.js: Centralized Axios configuration to handle headers and role-based redirecting.

## Development Setup Guide

## Prerequisites
Ensure the following tools and versions are installed:
- **Python:** Version 3.9 or higher (for backend).

- **React.js:** Version 19.x or higher (for frontend).

- **Docker & Docker Compose:** Mandatory for the evaluation setup.

- **PostgreSQL:** Version 15 (if running without Docker).

## Environment Variables
Create a `.env` file in the root directory of the project with the following variables:

# Backend Configuration
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@database:5432/saas_db
JWT_SECRET=your_jwt_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Frontend Configuration
REACT_APP_API_URL=http://backend:5000/api