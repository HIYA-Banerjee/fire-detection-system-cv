# 🚀 Agniva 2.0 - Deployment Guide

This guide details how to deploy Agniva 2.0. We support two deployment models:
1. **Render (Backend) + Vercel (Frontend) [RECOMMENDED]**: Runs a persistent Flask server on Render supporting physical/simulated webcam streaming and full YOLOv8 detection, while serving the React client instantly from Vercel's global CDN.
2. **Unified Vercel (Serverless)**: Deploys both frontend and backend to Vercel. Since serverless functions time out after 10-60 seconds, this mode cannot stream continuous video feeds and is only useful for basic API testing.

---

## 🏗️ Method 1: Render (Backend) + Vercel (Frontend) [Recommended]

This setup ensures that the live video streaming endpoint `/api/live_detection` does not time out and operates with full YOLOv8 detection.

### A. Deploy Backend to Render

1. Log in to [Render](https://render.com).
2. Click **New +** ➔ **Web Service**.
3. Link your GitHub repository (`Agniva2.0`).
4. Configure the Web Service:
   - **Name**: `agniva-backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r fire_detection_system/requirements.txt`
   - **Start Command**: `python fire_detection_system/server.py`
5. Configure Environment Variables in the **Variables** tab:
   - `DEV_MODE`: `true` (enables local developer mode bypass without Google credentials).
   - `ALLOWED_ORIGINS`: `https://your-frontend-domain.vercel.app` (your Vercel project domain URL, once deployed).
6. Click **Deploy Web Service**.

### B. Deploy Frontend to Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New** ➔ **Project**.
3. Import the `Agniva2.0` repository.
4. Configure Project Settings:
   - **Framework Preset**: **Other**
   - **Root Directory**: `agniv-2.0/frontend` (Or keep as root `./` and adjust the compiler paths below)
     *If root directory is `./`:*
     - **Build Command**: `npm run build`
     - **Output Directory**: `agniv-2.0/frontend/dist`
5. Configure Environment Variables:
   - `VITE_API_URL`: `https://your-backend-domain.onrender.com/api` (the URL Render generated for your backend service).
6. Click **Deploy**.

---

## 🏗️ Method 2: Unified Vercel (Serverless Fallback)

This model compiles the React client and the Flask backend into a single serverless Vercel deployment. 

> [!CAUTION]
> Because Vercel Serverless Functions have a strict execution time limit (e.g. 10 seconds), accessing `/api/live_detection` will time out and result in a black box or a `504 Gateway Timeout` error.

### Step 1: Import the Repository
1. Log in to [Vercel](https://vercel.com).
2. Import the `Agniva2.0` repository.

### Step 2: Configure Project Settings
1. **Framework Preset**: **Other**
2. **Root Directory**: `./` (default workspace root).
3. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `agniv-2.0/frontend/dist`

### Step 3: Configure Environment Variables
- `DEV_MODE`: `true`

### Step 4: Deploy
- Click **Deploy**.

---

## 🛠️ Local Development

To run the application locally on your computer (where physical webcams are accessible):

1. Double-click the `start.bat` file in the root folder.
2. The script will:
   - Open a backend console running Flask at `http://localhost:5000`.
   - Start the Vite dev server at `http://localhost:5173`.
