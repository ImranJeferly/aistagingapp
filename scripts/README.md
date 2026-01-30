# HDRI Stitching Service (OpenCV)

This folder contains a Python Flask API for professional panorama stitching using OpenCV.

## Deploy to Hugging Face Spaces (FREE - Recommended)

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"**
3. Fill in:
   - **Space name**: `hdri-stitcher` (or any name)
   - **SDK**: Select **Docker**
   - **Hardware**: **CPU Basic (Free)**
4. Click **Create Space**
5. Upload these files from the `scripts` folder:
   - `Dockerfile`
   - `app.py`
   - `requirements.txt`

Your API will be at: `https://YOUR-USERNAME-hdri-stitcher.hf.space`

Then add to Vercel Environment Variables:
```
NEXT_PUBLIC_OPENCV_API=https://YOUR-USERNAME-hdri-stitcher.hf.space
```

## Deploy to Render (FREE)

1. Go to [render.com](https://render.com)
2. Click **"New" → "Web Service"**
3. Connect your GitHub repo
4. Set:
   - **Root Directory**: `scripts`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Instance Type**: **Free**

## Local Testing

```bash
cd scripts
pip install -r requirements.txt
python app.py
```

Then test: `curl http://localhost:5000/health`

## API Endpoints

- `GET /health` - Health check
- `POST /stitch` - Stitch panorama

