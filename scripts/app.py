#!/usr/bin/env python3
"""
Flask API for Panorama Stitching - CORRECT MATHEMATICAL APPROACH
Based on Paul Bourke's equirectangular projection documentation
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

def stitch_equirectangular(images, azimuths, elevations):
    """
    Equirectangular stitching using CORRECT spherical math.
    
    Coordinate system:
    - Azimuth: 0° = front (positive Z), 90° = right (positive X), 180° = back, 270° = left
    - Elevation: 0° = horizon, +90° = up (positive Y), -90° = down
    
    Equirectangular mapping:
    - Horizontal pixel position maps to longitude (azimuth)
    - Vertical pixel position maps to latitude (elevation)  
    - x = 0 corresponds to azimuth = -180° (left edge = behind)
    - x = width/2 corresponds to azimuth = 0° (center = front)
    - x = width corresponds to azimuth = +180° (right edge = behind)
    """
    start_time = time.time()
    
    # Output dimensions (2:1 aspect ratio for equirectangular)
    out_width = 2048
    out_height = 1024
    
    # Camera FOV (after 65% center crop on frontend)
    h_fov = 40  # degrees
    v_fov = 55  # degrees
    
    print(f"Stitching {len(images)} images to {out_width}x{out_height}", file=sys.stderr)
    print(f"FOV: {h_fov}° x {v_fov}°", file=sys.stderr)
    
    # Create output pixel coordinate grids
    px = np.arange(out_width, dtype=np.float32)
    py = np.arange(out_height, dtype=np.float32)
    px_grid, py_grid = np.meshgrid(px, py)
    
    # Convert output pixel coordinates to spherical coordinates
    # Standard equirectangular: longitude spans -180° to +180°, latitude spans +90° to -90°
    # longitude (azimuth): -180° at x=0, 0° at x=width/2, +180° at x=width
    longitude = (px_grid / out_width - 0.5) * 360.0  # -180 to +180 degrees
    latitude = (0.5 - py_grid / out_height) * 180.0   # +90 to -90 degrees
    
    # Convert to radians
    lon_rad = np.radians(longitude)
    lat_rad = np.radians(latitude)
    
    # Convert spherical to Cartesian (unit sphere)
    # Using standard convention: X=right, Y=up, Z=forward
    # longitude=0 points to +Z (forward), longitude=90° points to +X (right)
    out_x = np.cos(lat_rad) * np.sin(lon_rad)  # Right/left
    out_y = np.sin(lat_rad)                      # Up/down  
    out_z = np.cos(lat_rad) * np.cos(lon_rad)  # Forward/back
    
    # Initialize output accumulation buffers
    output = np.zeros((out_height, out_width, 3), dtype=np.float32)
    weights = np.zeros((out_height, out_width), dtype=np.float32)
    
    # FOV half-angles for boundary check
    h_fov_half = np.radians(h_fov / 2)
    v_fov_half = np.radians(v_fov / 2)
    
    # Process each source image
    for idx, (img, img_az, img_el) in enumerate(zip(images, azimuths, elevations)):
        if img is None:
            continue
        
        img_h, img_w = img.shape[:2]
        img_float = img.astype(np.float32)
        
        # Image camera direction in spherical coords (converted to radians)
        cam_az_rad = np.radians(img_az)   # Azimuth of camera
        cam_el_rad = np.radians(img_el)   # Elevation of camera
        
        # Camera basis vectors (where camera is pointing)
        # Forward vector: direction camera is looking
        cam_fwd = np.array([
            np.cos(cam_el_rad) * np.sin(cam_az_rad),  # X
            np.sin(cam_el_rad),                         # Y
            np.cos(cam_el_rad) * np.cos(cam_az_rad)   # Z
        ])
        
        # Right vector: perpendicular to forward, in horizontal plane
        # For azimuth rotation: right = (cos(az), 0, -sin(az))
        cam_right = np.array([
            np.cos(cam_az_rad),   # X
            0,                      # Y
            -np.sin(cam_az_rad)   # Z
        ])
        
        # Up vector: perpendicular to both forward and right
        # This tilts with elevation
        cam_up = np.array([
            -np.sin(cam_el_rad) * np.sin(cam_az_rad),  # X
            np.cos(cam_el_rad),                          # Y
            -np.sin(cam_el_rad) * np.cos(cam_az_rad)   # Z
        ])
        
        # For each output pixel direction, compute projection onto this camera's image plane
        # Dot products with camera basis (vectorized)
        dot_fwd = out_x * cam_fwd[0] + out_y * cam_fwd[1] + out_z * cam_fwd[2]
        dot_right = out_x * cam_right[0] + out_y * cam_right[1] + out_z * cam_right[2]
        dot_up = out_x * cam_up[0] + out_y * cam_up[1] + out_z * cam_up[2]
        
        # Only consider pixels that are in front of the camera
        in_front = dot_fwd > 0.01
        
        # Perspective projection: project 3D point onto image plane
        with np.errstate(divide='ignore', invalid='ignore'):
            # Angles from camera center
            angle_h = np.where(in_front, np.arctan2(dot_right, dot_fwd), 999)
            angle_v = np.where(in_front, np.arctan2(dot_up, dot_fwd), 999)
        
        # Check if within camera FOV
        in_fov = in_front & (np.abs(angle_h) < h_fov_half) & (np.abs(angle_v) < v_fov_half)
        
        # Convert angle to image UV coordinates (0 to 1)
        # Center of image = angle 0, edges = ±FOV/2
        # The image was flipped horizontally on upload, so we need to flip U
        u = 0.5 - (angle_h / h_fov_half) * 0.5  # Flipped: 0.5 - instead of 0.5 +
        v = 0.5 - (angle_v / v_fov_half) * 0.5  # Top of image = positive angle
        
        # Convert UV to pixel coordinates
        src_x = (u * (img_w - 1)).astype(np.float32)
        src_y = (v * (img_h - 1)).astype(np.float32)
        
        # Feathering weight based on distance from edge
        edge_u = np.minimum(u, 1 - u)
        edge_v = np.minimum(v, 1 - v)
        edge_dist = np.minimum(edge_u, edge_v)
        # Normalize to 0-1 range over 20% feather zone
        feather = np.clip(edge_dist / 0.2, 0, 1)
        # Smoothstep for nicer blending
        feather = feather * feather * (3 - 2 * feather)
        
        # Sample image
        map_x = np.clip(src_x, 0, img_w - 1).astype(np.float32)
        map_y = np.clip(src_y, 0, img_h - 1).astype(np.float32)
        sampled = cv2.remap(img_float, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        
        # Apply weight only where in FOV
        w = np.where(in_fov, feather, 0).astype(np.float32)
        
        # Accumulate weighted samples
        for c in range(3):
            output[:, :, c] += sampled[:, :, c] * w
        weights += w
        
        print(f"  [{idx+1}/{len(images)}] az={img_az:>6.1f}°, el={img_el:>6.1f}° - pixels: {np.sum(in_fov):>7}", file=sys.stderr)
    
    # Normalize by total weight
    mask = weights > 0.001
    for c in range(3):
        output[:, :, c] = np.where(mask, output[:, :, c] / np.maximum(weights, 0.001), 0)
    
    # Fill any gaps with inpainting
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
                
                # NOTE: Don't flip here - the U coordinate flip in projection handles it
                
                images.append(img)
                azimuths.append(float(img_data.get('azimuth', 0)))
                elevations.append(float(img_data.get('elevation', 0)))
                
                print(f"  Image {i+1}: {img.shape[1]}x{img.shape[0]}, az={azimuths[-1]:.0f}°, el={elevations[-1]:.0f}°", file=sys.stderr)
        
        if len(images) < 2:
            return jsonify({'success': False, 'error': 'Could not decode images'})
        
        # Stitch using corrected algorithm
        result = stitch_equirectangular(images, azimuths, elevations)
        
        # Upscale result for quality
        result = cv2.resize(result, (4096, 2048), interpolation=cv2.INTER_CUBIC)
        
        panorama = encode_image_base64(result, quality=90)
        
        return jsonify({
            'success': True,
            'panorama': panorama,
            'method': 'equirectangular-corrected',
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
