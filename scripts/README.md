# HDRI Stitching Service (OpenCV)

This folder contains a Python Flask API for professional panorama stitching using OpenCV.

## Deploy to Railway (Recommended)

1. Go to [railway.app](https://railway.app) and create account
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repo
4. Set the **Root Directory** to `scripts`
5. Railway will auto-detect Python and deploy

**Or deploy via CLI:**
```bash
cd scripts
railway login
railway init
railway up
```

## Deploy to Render

1. Go to [render.com](https://render.com)
2. Create "New Web Service"
3. Connect your GitHub repo
4. Set:
   - **Root Directory**: `scripts`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

## Environment Variables

Set your deployed URL in Vercel:
```
NEXT_PUBLIC_OPENCV_API=https://your-railway-app.up.railway.app
```

## Local Testing

```bash
cd scripts
pip install -r requirements.txt
python app.py
```

Then test with:
```bash
curl http://localhost:5000/health
```

## API Endpoints

- `GET /health` - Health check
- `POST /stitch` - Stitch panorama
  - Body: `{ "images": [{ "data": "base64...", "azimuth": 0, "elevation": 0 }, ...] }`
  - Returns: `{ "success": true, "panorama": "data:image/jpeg;base64,..." }`
