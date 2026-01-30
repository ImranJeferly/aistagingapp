#!/usr/bin/env python3
"""
Flask API for Panorama Stitching - OPTIMIZED VERSION
Uses NumPy vectorization for speed (no timeouts!)
"""

import cv2
import numpy as np
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import time

app = Flask(__name__)
CORS(app)

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode a base64 image string to OpenCV format"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    img_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def encode_image_base64(img: np.ndarray, quality: int = 90) -> str:
    """Encode OpenCV image to base64 string"""
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    _, buffer = cv2.imencode('.jpg', img, encode_params)
    base64_string = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_string}"

def stitch_equirectangular_fast(images, azimuths, elevations):
    """
    FAST vectorized equirectangular stitching using NumPy
    """
    start_time = time.time()
    
    # Output dimensions
    out_width = 2048  # Reduced for speed
    out_height = 1024
    
    # Camera FOV (images are pre-cropped on frontend to remove fisheye)
    # After 65% center crop, effective FOV is narrower
    h_fov = 40  # Horizontal FOV after crop
    v_fov = 55  # Vertical FOV after crop
    h_fov_rad = np.radians(h_fov)
    v_fov_rad = np.radians(v_fov)
    
    print(f"Stitching {len(images)} images to {out_width}x{out_height}", file=sys.stderr)
    print(f"FOV: {h_fov}° x {v_fov}° (pre-cropped images)", file=sys.stderr)
    
    # Create output coordinate grids
    px = np.arange(out_width)
    py = np.arange(out_height)
    px_grid, py_grid = np.meshgrid(px, py)
    
    # Convert to spherical coordinates
    # Standard equirectangular: center of image = front (azimuth 0°/360°)
    # Left edge = -180° (or 180°), Right edge = +180°
    # We'll use 0-360 range but offset so center = 0°
    out_azimuth = ((px_grid / out_width) * 360.0 + 180.0) % 360.0  # Center = 0°/360°
    out_elevation = 90.0 - (py_grid / out_height) * 180.0  # Top = +90°, Bottom = -90°
    
    # Convert to radians
    out_az_rad = np.radians(out_azimuth)
    out_el_rad = np.radians(out_elevation)
    
    # Convert to 3D direction vectors (for all output pixels at once)
    # Y-up coordinate system: X=right, Y=up, Z=forward
    dir_x = np.cos(out_el_rad) * np.sin(out_az_rad)
    dir_y = np.sin(out_el_rad)
    dir_z = np.cos(out_el_rad) * np.cos(out_az_rad)
    
    # Initialize output
    output = np.zeros((out_height, out_width, 3), dtype=np.float32)
    weights = np.zeros((out_height, out_width), dtype=np.float32)
    
    # Process each image
    for idx, (img, img_az, img_el) in enumerate(zip(images, azimuths, elevations)):
        if img is None:
            continue
        
        img_h, img_w = img.shape[:2]
        img_float = img.astype(np.float32)
        
        # Camera basis vectors for image at (azimuth, elevation)
        az_rad = np.radians(img_az)
        el_rad = np.radians(img_el)
        
        # Forward direction (where camera is pointing)
        fwd = np.array([
            np.cos(el_rad) * np.sin(az_rad),
            np.sin(el_rad),
            np.cos(el_rad) * np.cos(az_rad)
        ])
        
        # Right direction (NEGATED because image was flipped horizontally)
        # Original right would be [cos(az), 0, -sin(az)]
        # After horizontal flip, right becomes left, so negate it
        right = np.array([-np.cos(az_rad), 0, np.sin(az_rad)])
        
        # Up direction (unchanged by horizontal flip)
        up = np.array([
            -np.sin(el_rad) * np.sin(az_rad),
            np.cos(el_rad),
            -np.sin(el_rad) * np.cos(az_rad)
        ])
        
        # Project all directions onto camera plane (vectorized)
        dot_fwd = dir_x * fwd[0] + dir_y * fwd[1] + dir_z * fwd[2]
        dot_right = dir_x * right[0] + dir_y * right[1] + dir_z * right[2]
        dot_up = dir_x * up[0] + dir_y * up[1] + dir_z * up[2]
        
        # Mask for points in front of camera
        valid = dot_fwd > 0.1
        
        # Perspective projection (only where valid)
        with np.errstate(divide='ignore', invalid='ignore'):
            proj_x = np.where(valid, dot_right / dot_fwd, 0)
            proj_y = np.where(valid, dot_up / dot_fwd, 0)
        
        # Convert to normalized image coordinates
        u = proj_x / np.tan(h_fov_rad / 2) * 0.5 + 0.5
        v = 0.5 - proj_y / np.tan(v_fov_rad / 2) * 0.5
        
        # Mask for points within image bounds
        in_bounds = valid & (u >= 0) & (u <= 1) & (v >= 0) & (v <= 1)
        
        # Convert to pixel coordinates
        src_x = (u * (img_w - 1)).astype(np.float32)
        src_y = (v * (img_h - 1)).astype(np.float32)
        
        # Create feather weight (distance from edge)
        edge_dist_u = np.minimum(u, 1 - u) / 0.2  # 20% feather
        edge_dist_v = np.minimum(v, 1 - v) / 0.2
        edge_dist = np.minimum(edge_dist_u, edge_dist_v)
        edge_dist = np.clip(edge_dist, 0, 1)
        feather_weight = edge_dist * edge_dist * (3 - 2 * edge_dist)  # smoothstep
        
        # Sample image using remap (fast!)
        map_x = np.clip(src_x, 0, img_w - 1).astype(np.float32)
        map_y = np.clip(src_y, 0, img_h - 1).astype(np.float32)
        
        sampled = cv2.remap(img_float, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        
        # Apply weight only where in bounds
        w = np.where(in_bounds, feather_weight, 0).astype(np.float32)
        
        # Accumulate
        for c in range(3):
            output[:, :, c] += sampled[:, :, c] * w
        weights += w
        
        print(f"  Image {idx+1}/{len(images)}: az={img_az:.0f}°, el={img_el:.0f}°", file=sys.stderr)
    
    # Normalize
    mask = weights > 0.001
    for c in range(3):
        output[:, :, c] = np.where(mask, output[:, :, c] / np.maximum(weights, 0.001), 0)
    
    # Fill gaps with inpainting
    gap_mask = (~mask).astype(np.uint8) * 255
    gap_percent = 100 * np.sum(~mask) / (out_width * out_height)
    print(f"Gaps: {gap_percent:.1f}%", file=sys.stderr)
    
    result = np.clip(output, 0, 255).astype(np.uint8)
    
    if gap_percent > 0:
        result = cv2.inpaint(result, gap_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
    
    elapsed = time.time() - start_time
    print(f"Stitching complete in {elapsed:.1f}s", file=sys.stderr)
    
    return result

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
        
        print(f"\n{'='*50}", file=sys.stderr)
        print(f"Received {len(images_data)} images", file=sys.stderr)
        
        # Decode images
        images = []
        azimuths = []
        elevations = []
        
        for i, img_data in enumerate(images_data):
            img = decode_base64_image(img_data['data'])
            if img is not None:
                # Resize large images to save memory
                h, w = img.shape[:2]
                if w > 1080:
                    scale = 1080 / w
                    img = cv2.resize(img, (int(w * scale), int(h * scale)))
                
                # FLIP IMAGE HORIZONTALLY - phone cameras capture mirrored!
                img = cv2.flip(img, 1)
                
                images.append(img)
                azimuths.append(float(img_data.get('azimuth', 0)))
                elevations.append(float(img_data.get('elevation', 0)))
                
                print(f"  Image {i+1}: {img.shape[1]}x{img.shape[0]}, az={azimuths[-1]:.0f}°, el={elevations[-1]:.0f}°", file=sys.stderr)
        
        if len(images) < 2:
            return jsonify({'success': False, 'error': 'Could not decode images'})
        
        # Stitch
        result = stitch_equirectangular_fast(images, azimuths, elevations)
        
        # Upscale result for quality
        result = cv2.resize(result, (4096, 2048), interpolation=cv2.INTER_CUBIC)
        
        panorama = encode_image_base64(result, quality=90)
        
        return jsonify({
            'success': True,
            'panorama': panorama,
            'method': 'equirectangular-fast',
            'imageCount': len(images)
        })
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
