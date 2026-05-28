# 🔥 Agniva 2.0 - AI Fire & Smoke Detection System

Agniva 2.0 is an advanced real-time Fire and Smoke detection system integrating a high-performance **Flask backend** (featuring YOLOv8 AI detection) and a premium, responsive **Vite + React frontend** styled with smooth CSS glassmorphism, animations, and clean layouts.

-

## ⚡ Quick Start (Local Run)

For Windows users, we have provided a single batch script to automate the dependency installations and start both servers concurrently.

1. Double-click or run:
   ```bash
   start.bat
   ```
2. The batch file will:
   - Verify Node.js and Python environments.
   - Install local backend dependencies (with YOLOv8).
   - Install frontend packages and start the Vite development server.
3. Open your browser:
   - **Frontend Dashboard**: `http://localhost:5173`
   - **Backend API**: `http://localhost:5000`

*Credentials for demo login:*
- **Username:** `admin` | **Password:** `admin123`
- **Username:** `user` | **Password:** `user123`

--

## 🚀 Deploying to Vercel

Agniva 2.0 is fully pre-configured for Vercel Serverless deployment out of the box.

### Serverless Fallback Design
Since serverless environments (like Vercel AWS Lambda container) do not connect to hardware webcams and cannot load large deep-learning dependencies (like `torch` and `ultralytics` which exceed the 50MB/250MB size limit):
- The backend detects the serverless environment and automatically activates **Simulated Camera Mode**.
- The API serves a high-fidelity synthetic stream with periodic fire/smoke detection boxes and dashboard logs, allowing the full dashboard features to be tested and demoed live.

### Setup Instructions
1. Install [Vercel CLI](https://vercel.com/cli) or import the repository to your Vercel Dashboard.
2. In Vercel, configure the project with the following settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `agniv-2.0/frontend/dist`
   - **Root Directory:** `./` (Leave as default)
3. Deploy! Vercel will automatically compile the Vite frontend, bundle `api/index.py` as a Python Serverless Function, and route path requests based on the root-level [vercel.json](file:///d:/ex%20projects/Agniva2.0/vercel.json).

---

## 🏗️ System Architecture & Directories

- `agniv-2.0/frontend/` — Vite + React application. Contains state management, API service calls, and CSS glassmorphism animations.
- `fire_detection_system/` — Core Flask backend application.
  - `server.py` — Main Flask API server handling camera streaming, session management, and endpoints.
  - `detector.py` — YOLOv8 & HSV color-based fallback detection class.
  - `yolov8n.pt` — YOLOv8 pre-trained weights.
- `api/` — Serverless entrypoints.
  - `index.py` — Handles routing and sys.path configuration for Vercel functions.
- `vercel.json` — Monorepo routing and API redirection rewrites.
- `requirements.txt` — Python packages to install during Vercel builds.
- `package.json` — Workspace build runner.

--

## ✨ Features

- ✅ **AI Real-Time Detection**: Uses YOLOv8 or HSV color-based processing for bounding boxes and confidence scores.
- ✅ **Dynamic Glassmorphism UI**: Beautiful dark-theme dashboard with animated orbs, responsive layouts, and transitions.
- ✅ **GPS & Location Integration**: Interactive fire responder map tracking, team statuses, and auto-location assignment.
- ✅ **Device Diagnostics**: Local face and audio check verifying client camera/microphone input status using HTML5 Media APIs.
- ✅ **Stateless Alert History**: Persistent session-based alert history for immediate tracking and notifications.
