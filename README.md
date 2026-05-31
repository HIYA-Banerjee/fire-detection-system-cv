<div align="center">

# 🔥 Agniv 2.0
### AI-Powered Fire & Smoke Detection System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://fire-detection-system-ui.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://fire-detection-backend-c1xy.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/joshuahanielgts/fire-detection-system-cv)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF?style=flat-square)](https://ultralytics.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io)](https://socket.io)

*Real-time AI detection of fire and smoke via webcam or image upload — no signup friction, no OAuth, just detection.*

</div>

---

## 📸 Screenshots

| Landing | Dashboard | Live Detection |
|---------|-----------|----------------|
| Hero with CTA | Property management | Webcam + AI overlay |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **YOLOv8 Detection** | Industry-leading object detection model (`yolov8n.pt`) with 30%+ confidence threshold |
| 🎨 **HSV Fallback** | Colour-based fire/smoke segmentation when YOLO is unavailable — works everywhere |
| 📷 **Live Webcam** | Browser captures frames → sends to backend → displays annotated result at ~2 FPS |
| 🖼️ **Image Upload** | Upload any image for instant fire/smoke analysis |
| ⚡ **Real-time Alerts** | Socket.IO pushes alerts to all connected clients the moment fire is detected |
| 🏠 **Property Management** | Register and monitor multiple locations from one dashboard |
| 🚒 **Fire Station Dashboard** | Responder coordination with live GPS, team status, and alert history |
| 🔐 **Zero-friction Auth** | Enter any email — no verification, no OAuth, no passwords |
| 🌐 **Fully Deployed** | Frontend on Vercel, backend on Render, production-ready |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│  React + Vite + Tailwind (Vercel)               │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │  Login   │  │Dashboard │  │CameraManagement│ │
│  │ (any     │  │Properties│  │Webcam → Canvas │ │
│  │  email)  │  │ + Alerts │  │→ base64 → API  │ │
│  └──────────┘  └──────────┘  └───────────────┘ │
│         │            │               │           │
│         └────────────┴───────────────┘           │
│                      │ REST + Socket.IO           │
└──────────────────────┼──────────────────────────┘
                       │
            ┌──────────▼──────────┐
            │   Flask + SocketIO   │
            │   (Render — Python)  │
            │                      │
            │  /api/login          │
            │  /api/detect_frame   │◄── base64 JPEG
            │  /api/detect_image   │◄── file upload
            │  /api/properties     │
            │  /api/alerts         │
            │                      │
            │  ┌────────────────┐  │
            │  │FireSmokeDetect │  │
            │  │ YOLOv8n.pt     │  │
            │  │   └► HSV Fall  │  │
            │  └────────────────┘  │
            └──────────────────────┘
```

---

## 🚀 Live Deployment

| Service | URL |
|---------|-----|
| **Frontend** | https://fire-detection-system-ui.vercel.app |
| **Backend** | https://fire-detection-backend-c1xy.onrender.com |
| **Health Check** | https://fire-detection-backend-c1xy.onrender.com/api/health |

> ⚠️ **Note:** The backend runs on Render's free tier and **spins down after 15 minutes of inactivity**. The first request after sleep takes 30–60 seconds. The login page shows a "Waking up backend..." banner during this time.

---

## 📁 Project Structure

```
Agniva2.0/
├── agniv-2.0/
│   └── frontend/                  ← React app (deployed on Vercel)
│       ├── src/
│       │   ├── components/
│       │   │   └── Navbar.jsx     ← Fixed top navbar with auth state
│       │   ├── pages/
│       │   │   ├── Landing.jsx    ← Public hero page
│       │   │   ├── Login.jsx      ← Any-email login (no verification)
│       │   │   ├── Dashboard.jsx  ← Property overview + alert stats
│       │   │   ├── CameraManagement.jsx  ← Live webcam detection
│       │   │   ├── AddProperty.jsx       ← Register a new location
│       │   │   ├── FaceVerification.jsx  ← Biometric sim (WebRTC + WebAudio)
│       │   │   └── FireStationDashboard.jsx ← Responder ops + GPS + map
│       │   ├── services/
│       │   │   ├── api.js         ← Axios client + all API functions
│       │   │   └── socket.js      ← Socket.IO factory
│       │   └── styles/            ← Per-page CSS (glassmorphism dark theme)
│       ├── package.json
│       ├── vite.config.js
│       └── tailwind.config.js
│
├── fire_detection_system/         ← Python backend (deployed on Render)
│   ├── server.py                  ← Flask + Socket.IO — all endpoints
│   ├── detector.py                ← YOLOv8 + HSV fallback detector
│   ├── requirements.txt           ← Pinned Python dependencies
│   └── yolov8n.pt                 ← YOLO model (6.5 MB)
│
├── web_app.py                     ← Render/gunicorn entry point
├── render.yaml                    ← Render service config
├── vercel.json                    ← Vercel build + API proxy config
└── .gitignore
```

---

## 🛠️ Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- A webcam (for live detection)

### 1. Clone the repo
```bash
git clone https://github.com/joshuahanielgts/fire-detection-system-cv.git
cd fire-detection-system-cv
```

### 2. Start the backend
```bash
cd fire_detection_system
pip install -r requirements.txt
python server.py
# Runs on http://localhost:5000
```

### 3. Start the frontend
```bash
cd agniv-2.0/frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 4. Open the app
Go to `http://localhost:5173` — enter **any email address** to log in.

---

## 🔌 API Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/login` | `{ email, name? }` | Accept any email — creates session |
| `POST` | `/logout` | — | Clears session |
| `GET` | `/me` | — | Returns current user or 401 |

### Detection
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/detect_frame` | `{ frame: "data:image/jpeg;base64,..." }` | Analyse webcam frame |
| `POST` | `/detect_image` | `multipart: image` or `{ image_data }` | Analyse uploaded image |
| `POST` | `/start_detection` | — | Mark detection as running |
| `POST` | `/stop_detection` | — | Stop detection |
| `GET` | `/status` | — | Current detection state |
| `GET` | `/health` | — | System + YOLO status |

### Properties & Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/properties` | List all properties |
| `POST` | `/properties` | Create property |
| `DELETE` | `/properties/:id` | Delete property |
| `GET` | `/alerts?limit=50` | Recent alert history |
| `POST` | `/alerts/clear` | Clear all alerts |

### Socket.IO Events
| Event | Direction | Payload |
|-------|-----------|---------|
| `connected` | Server → Client | `{ message }` |
| `alert` | Server → Client | `{ id, timestamp, type, detections }` |
| `property_added` | Server → Client | Property object |
| `alerts_cleared` | Server → Client | `{}` |

---

## ☁️ Deployment Guide

### Deploy Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect `joshuahanielgts/fire-detection-system-cv`
3. Set these values:

| Field | Value |
|-------|-------|
| Language | **Python** |
| Build Command | `pip install -r fire_detection_system/requirements.txt` |
| Start Command | `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT web_app:app` |

4. Add environment variables:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | Click **Generate** |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` *(no trailing slash)* |
| `PYTHON_VERSION` | `3.11.0` |

5. Deploy → note your Render URL

---

### Deploy Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Import** the same repo
2. Leave Root Directory as `./`
3. Vercel auto-detects `vercel.json` — build settings are pre-configured
4. Add environment variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-render-url.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://your-render-url.onrender.com` |

5. Deploy

---

### Update vercel.json
Replace the backend URL in `vercel.json` with your actual Render URL:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR-RENDER-URL.onrender.com/api/$1"
    },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Commit and push → Vercel auto-redeploys.

---

## 🔒 Environment Variables

### Backend (Render)
| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Flask session secret | ✅ |
| `ALLOWED_ORIGINS` | Comma-separated Vercel URLs (no trailing slash) | ✅ |
| `PYTHON_VERSION` | `3.11.0` | ✅ |
| `PORT` | Auto-set by Render | Auto |

### Frontend (Vercel)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | ✅ |
| `VITE_SOCKET_URL` | Backend Socket.IO URL | ✅ |

---

## 🧠 Detection Pipeline

```
Browser Webcam
     │
     ▼ every 500ms
<canvas> capture → toDataURL('image/jpeg', 0.7)
     │
     ▼ POST /api/detect_frame
Flask receives base64 → cv2.imdecode → numpy BGR frame
     │
     ▼
FireSmokeDetector.detect(frame)
     │
     ├─► YOLOv8n (if torch available)
     │      └─► labels containing "fire" or "smoke", conf > 0.3
     │      └─► If no fire/smoke class hits → fallback to HSV
     │
     └─► HSV Colour Segmentation (fallback)
            ├─► Fire mask: Hue 0–20° + 160–180°, Sat 60–255, Val 60–255
            └─► Smoke mask: Hue 0–180°, Sat 0–40, Val 80–210
                   └─► Contours > 800px², confidence ∝ area
     │
     ▼
cv2.imencode('.jpg') → base64 annotated frame
     │
     ▼ JSON response
React displays annotated frame in <img>
Socket.IO emits "alert" to all connected clients if fire/smoke found
```

---

## 🤝Author

| Role | Contributor |
|------|-------------|
| Full-stack Dev | Hiya Bandyopadhyay |

---

## 📄 License

MIT License — free to use, modify, and deploy.

---

<div align="center">

Made with 🔥 and a lot of `git push --force`

**[Live Demo](https://fire-detection-system-ui.vercel.app)** · **[Report Bug](https://github.com/joshuahanielgts/fire-detection-system-cv/issues)** · **[GitHub](https://github.com/joshuahanielgts/fire-detection-system-cv)**

</div>
