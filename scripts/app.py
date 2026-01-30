#!/usr/bin/env python3
"""
Flask API for OpenCV Panorama Stitching
Deploy to Railway, Render, or any Python hosting
"""

import cv2
import numpy as np
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys

app = Flask(__name__)
CORS(app)  # Allow requests from your Vercel frontend

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode a base64 image string to OpenCV format"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    img_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def encode_image_base64(img: np.ndarray, quality: int = 92) -> str:
    """Encode OpenCV image to base64 string"""
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    _, buffer = cv2.imencode('.jpg', img, encode_params)
    base64_string = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_string}"

def create_feather_mask(width: int, height: int, feather_size: float = 0.15) -> np.ndarray:
    """Create a feathered weight mask for smooth blending"""
    mask = np.ones((height, width), dtype=np.float32)
    feather_x = int(width * feather_size)
    feather_y = int(height * feather_size)
    
    for x in range(feather_x):
        t = x / feather_x
        weight = t * t * (3 - 2 * t)
        mask[:, x] *= weight
        mask[:, width - 1 - x] *= weight
    
    for y in range(feather_y):
        t = y / feather_y
        weight = t * t * (3 - 2 * t)
        mask[y, :] *= weight
        mask[height - 1 - y, :] *= weight
    
    return mask

def project_to_image(out_az, out_el, img_az, img_el, h_fov, v_fov, img_w, img_h):
    """Project equirectangular coordinate to source image"""
    out_az_rad = np.radians(out_az)
    out_el_rad = np.radians(out_el)
    img_az_rad = np.radians(img_az)
    img_el_rad = np.radians(img_el)
    
    dir_x = np.cos(out_el_rad) * np.sin(out_az_rad)
    dir_y = np.sin(out_el_rad)
    dir_z = np.cos(out_el_rad) * np.cos(out_az_rad)
    
    fwd_x = np.cos(img_el_rad) * np.sin(img_az_rad)
    fwd_y = np.sin(img_el_rad)
    fwd_z = np.cos(img_el_rad) * np.cos(img_az_rad)
    
    right_x = np.cos(img_az_rad)
    right_y = 0
    right_z = -np.sin(img_az_rad)
    
    up_x = -np.sin(img_el_rad) * np.sin(img_az_rad)
    up_y = np.cos(img_el_rad)
    up_z = -np.sin(img_el_rad) * np.cos(img_az_rad)
    
    dot_fwd = dir_x * fwd_x + dir_y * fwd_y + dir_z * fwd_z
    if dot_fwd <= 0.01:
        return None
    
    dot_right = dir_x * right_x + dir_y * right_y + dir_z * right_z
    dot_up = dir_x * up_x + dir_y * up_y + dir_z * up_z
    
    x = dot_right / dot_fwd
    y = dot_up / dot_fwd
    
    h_fov_rad = np.radians(h_fov)
    v_fov_rad = np.radians(v_fov)
    
    u = x / np.tan(h_fov_rad / 2) * 0.5 + 0.5
    v = 0.5 - y / np.tan(v_fov_rad / 2) * 0.5
    
    if u < 0 or u > 1 or v < 0 or v > 1:
        return None
    
    return (u * (img_w - 1), v * (img_h - 1))

def stitch_panorama_opencv(images):
    """Try OpenCV's built-in stitcher first"""
    stitcher = cv2.Stitcher.create(cv2.Stitcher_PANORAMA)
    try:
        stitcher.setPanoConfidenceThresh(0.3)
    except:
        pass
    
    status, result = stitcher.stitch(images)
    
    if status == cv2.Stitcher_OK:
        return True, result
    return False, f"OpenCV stitcher failed with code {status}"

def stitch_panorama_manual(images, azimuths, elevations):
    """Manual spherical projection stitching"""
    out_width = 4096
    out_height = 2048
    h_fov = 55
    v_fov = 75
    
    output = np.zeros((out_height, out_width, 3), dtype=np.float32)
    weights = np.zeros((out_height, out_width), dtype=np.float32)
    
    # Pre-compute masks
    masks = []
    for img in images:
        if img is not None:
            h, w = img.shape[:2]
            masks.append(create_feather_mask(w, h, 0.2))
        else:
            masks.append(None)
    
    for idx, (img, az, el, mask) in enumerate(zip(images, azimuths, elevations, masks)):
        if img is None:
            continue
        
        h, w = img.shape[:2]
        img_float = img.astype(np.float32)
        
        for py in range(out_height):
            out_el = 90 - (py / out_height) * 180
            
            for px in range(out_width):
                out_az = (px / out_width) * 360
                
                coords = project_to_image(out_az, out_el, az, el, h_fov, v_fov, w, h)
                
                if coords is not None:
                    sx, sy = coords
                    x0, y0 = int(sx), int(sy)
                    x1, y1 = min(x0 + 1, w - 1), min(y0 + 1, h - 1)
                    fx, fy = sx - x0, sy - y0
                    
                    color = (
                        img_float[y0, x0] * (1-fx) * (1-fy) +
                        img_float[y0, x1] * fx * (1-fy) +
                        img_float[y1, x0] * (1-fx) * fy +
                        img_float[y1, x1] * fx * fy
                    )
                    
                    wt = mask[y0, x0]
                    output[py, px] += color * wt
                    weights[py, px] += wt
        
        print(f"Projected image {idx + 1}/{len(images)}", file=sys.stderr)
    
    # Normalize
    mask_valid = weights > 0.001
    for c in range(3):
        output[:, :, c][mask_valid] /= weights[mask_valid]
    
    # Fill background gradient
    for y in range(out_height):
        t = y / out_height
        if t < 0.45:
            color = [200, 180, 135]  # Sky
        elif t < 0.55:
            color = [180, 200, 200]  # Horizon
        else:
            color = [85, 115, 139]  # Ground
        
        for x in range(out_width):
            if weights[y, x] < 0.01:
                output[y, x] = color
    
    return np.clip(output, 0, 255).astype(np.uint8)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'opencv': cv2.__version__})

@app.route('/stitch', methods=['POST'])
def stitch():
    try:
        data = request.json
        images_data = data.get('images', [])
        
        if len(images_data) < 2:
            return jsonify({'success': False, 'error': 'Need at least 2 images'})
        
        print(f"Processing {len(images_data)} images...", file=sys.stderr)
        
        # Decode images
        images = []
        azimuths = []
        elevations = []
        
        for img_data in images_data:
            img = decode_base64_image(img_data['data'])
            if img is not None:
                images.append(img)
                azimuths.append(img_data.get('azimuth', 0))
                elevations.append(img_data.get('elevation', 0))
        
        if len(images) < 2:
            return jsonify({'success': False, 'error': 'Could not decode images'})
        
        # Try OpenCV stitcher first
        print("Trying OpenCV stitcher...", file=sys.stderr)
        success, result = stitch_panorama_opencv(images)
        
        if success:
            print("OpenCV stitcher succeeded!", file=sys.stderr)
            panorama = encode_image_base64(result)
            return jsonify({'success': True, 'panorama': panorama, 'method': 'opencv'})
        
        # Fallback to manual stitching
        print(f"OpenCV failed: {result}, using manual projection", file=sys.stderr)
        result = stitch_panorama_manual(images, azimuths, elevations)
        panorama = encode_image_base64(result)
        
        return jsonify({'success': True, 'panorama': panorama, 'method': 'manual'})
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
