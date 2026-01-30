#!/usr/bin/env python3
"""
Flask API for OpenCV Panorama Stitching
Uses orientation data (azimuth/elevation) for correct image placement
Deploy to Railway, Render, or any Python hosting
"""

import cv2
import numpy as np
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
from scipy import ndimage

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

def create_feather_mask(width: int, height: int, feather_size: float = 0.18) -> np.ndarray:
    """Create a smooth feathered weight mask for blending"""
    # Create distance from edges
    y_dist = np.minimum(np.arange(height), np.arange(height-1, -1, -1))
    x_dist = np.minimum(np.arange(width), np.arange(width-1, -1, -1))
    
    y_weight = np.clip(y_dist / (height * feather_size), 0, 1)
    x_weight = np.clip(x_dist / (width * feather_size), 0, 1)
    
    # Smoothstep for nice falloff
    y_weight = y_weight * y_weight * (3 - 2 * y_weight)
    x_weight = x_weight * x_weight * (3 - 2 * x_weight)
    
    # Combine
    mask = np.outer(y_weight, x_weight).astype(np.float32)
    return mask

def spherical_to_cartesian(azimuth_deg, elevation_deg):
    """Convert spherical coords (degrees) to 3D unit vector"""
    az = np.radians(azimuth_deg)
    el = np.radians(elevation_deg)
    x = np.cos(el) * np.sin(az)
    y = np.sin(el)
    z = np.cos(el) * np.cos(az)
    return np.array([x, y, z])

def get_camera_basis(azimuth_deg, elevation_deg):
    """Get camera coordinate system (forward, right, up) for a given orientation"""
    az = np.radians(azimuth_deg)
    el = np.radians(elevation_deg)
    
    # Forward direction (where camera is pointing)
    forward = np.array([
        np.cos(el) * np.sin(az),
        np.sin(el),
        np.cos(el) * np.cos(az)
    ])
    
    # Right direction (horizontal, perpendicular to forward)
    right = np.array([
        np.cos(az),
        0,
        -np.sin(az)
    ])
    
    # Up direction (perpendicular to both)
    up = np.array([
        -np.sin(el) * np.sin(az),
        np.cos(el),
        -np.sin(el) * np.cos(az)
    ])
    
    return forward, right, up

def project_direction_to_image(direction, img_azimuth, img_elevation, h_fov, v_fov):
    """
    Project a 3D direction onto an image plane
    Returns (u, v) in [0,1] range or None if behind camera or outside FOV
    """
    forward, right, up = get_camera_basis(img_azimuth, img_elevation)
    
    # Dot product with forward (how much in front of camera)
    dot_fwd = np.dot(direction, forward)
    
    # Behind camera
    if dot_fwd <= 0.05:
        return None
    
    # Project onto image plane
    dot_right = np.dot(direction, right)
    dot_up = np.dot(direction, up)
    
    # Perspective projection
    x = dot_right / dot_fwd
    y = dot_up / dot_fwd
    
    # Convert to normalized image coordinates
    h_fov_rad = np.radians(h_fov)
    v_fov_rad = np.radians(v_fov)
    
    u = x / np.tan(h_fov_rad / 2) * 0.5 + 0.5
    v = 0.5 - y / np.tan(v_fov_rad / 2) * 0.5
    
    # Check if within image bounds (with small margin)
    margin = 0.02
    if u < -margin or u > 1 + margin or v < -margin or v > 1 + margin:
        return None
    
    # Clamp to valid range
    u = np.clip(u, 0, 1)
    v = np.clip(v, 0, 1)
    
    return (u, v)

def bilinear_sample(img, x, y):
    """Sample image with bilinear interpolation"""
    h, w = img.shape[:2]
    x = np.clip(x, 0, w - 1.001)
    y = np.clip(y, 0, h - 1.001)
    
    x0, y0 = int(x), int(y)
    x1 = min(x0 + 1, w - 1)
    y1 = min(y0 + 1, h - 1)
    
    fx, fy = x - x0, y - y0
    
    val = (
        img[y0, x0] * (1-fx) * (1-fy) +
        img[y0, x1] * fx * (1-fy) +
        img[y1, x0] * (1-fx) * fy +
        img[y1, x1] * fx * fy
    )
    return val

def fill_gaps_interpolate(output, weights, threshold=0.01):
    """Fill small gaps by interpolating from nearby pixels"""
    gap_mask = weights < threshold
    
    if not np.any(gap_mask):
        return output
    
    # For each channel, interpolate
    for c in range(3):
        channel = output[:, :, c].copy()
        
        # Create a version with gaps filled by nearest neighbor first
        valid_mask = ~gap_mask
        
        if np.any(valid_mask):
            # Use distance transform to find nearest valid pixels
            dist, indices = ndimage.distance_transform_edt(gap_mask, return_indices=True)
            
            # Fill gaps with nearest valid values
            channel[gap_mask] = channel[indices[0][gap_mask], indices[1][gap_mask]]
            
            # Smooth the filled areas a bit
            smoothed = cv2.GaussianBlur(channel.astype(np.float32), (5, 5), 0)
            
            # Only use smoothed values in gap areas
            channel[gap_mask] = smoothed[gap_mask]
        
        output[:, :, c] = channel
    
    return output

def stitch_equirectangular(images, azimuths, elevations):
    """
    Stitch images into an equirectangular panorama using proper spherical projection
    Uses the actual orientation data from the phone's gyroscope
    """
    # Output dimensions (2:1 for equirectangular)
    out_width = 4096
    out_height = 2048
    
    # Phone camera FOV (portrait mode - vertical is larger)
    # These are typical for smartphone cameras
    h_fov = 60  # horizontal field of view in degrees
    v_fov = 80  # vertical field of view in degrees
    
    print(f"Stitching {len(images)} images to {out_width}x{out_height}", file=sys.stderr)
    print(f"Camera FOV: {h_fov}° x {v_fov}°", file=sys.stderr)
    
    # Print image orientations for debugging
    for i, (az, el) in enumerate(zip(azimuths, elevations)):
        print(f"  Image {i+1}: azimuth={az:.1f}°, elevation={el:.1f}°", file=sys.stderr)
    
    # Initialize output arrays
    output = np.zeros((out_height, out_width, 3), dtype=np.float64)
    weights = np.zeros((out_height, out_width), dtype=np.float64)
    
    # Pre-compute feather masks for each image
    masks = []
    for img in images:
        if img is not None:
            h, w = img.shape[:2]
            masks.append(create_feather_mask(w, h, 0.2))
        else:
            masks.append(None)
    
    # For each pixel in the output equirectangular image
    for py in range(out_height):
        # Elevation: +90° at top (py=0), -90° at bottom (py=out_height)
        elevation = 90.0 - (py / out_height) * 180.0
        
        for px in range(out_width):
            # Azimuth: 0° at left (px=0), 360° at right (px=out_width)
            azimuth = (px / out_width) * 360.0
            
            # Get 3D direction for this output pixel
            direction = spherical_to_cartesian(azimuth, elevation)
            
            # Check which input images can see this direction
            for idx, (img, img_az, img_el, mask) in enumerate(zip(images, azimuths, elevations, masks)):
                if img is None or mask is None:
                    continue
                
                h, w = img.shape[:2]
                
                # Project this direction onto the image
                uv = project_direction_to_image(direction, img_az, img_el, h_fov, v_fov)
                
                if uv is not None:
                    u, v = uv
                    
                    # Convert to pixel coordinates
                    src_x = u * (w - 1)
                    src_y = v * (h - 1)
                    
                    # Get feather weight at this position
                    mask_x = int(np.clip(src_x, 0, w - 1))
                    mask_y = int(np.clip(src_y, 0, h - 1))
                    wt = mask[mask_y, mask_x]
                    
                    if wt > 0.001:
                        # Sample color with bilinear interpolation
                        color = bilinear_sample(img.astype(np.float64), src_x, src_y)
                        
                        # Accumulate weighted color
                        output[py, px] += color * wt
                        weights[py, px] += wt
        
        # Progress logging
        if py % 256 == 0:
            print(f"  Row {py}/{out_height} ({100*py//out_height}%)", file=sys.stderr)
    
    # Normalize by total weights
    valid_mask = weights > 0.001
    for c in range(3):
        output[:, :, c][valid_mask] /= weights[valid_mask]
    
    # Count gaps before filling
    gap_count = np.sum(~valid_mask)
    gap_percent = 100 * gap_count / (out_width * out_height)
    print(f"Gaps before fill: {gap_count} pixels ({gap_percent:.1f}%)", file=sys.stderr)
    
    # Fill gaps with interpolation first (smooth)
    output = fill_gaps_interpolate(output, weights, threshold=0.001)
    
    # Convert to uint8
    result = np.clip(output, 0, 255).astype(np.uint8)
    
    # Final inpainting pass for any remaining artifacts
    gap_mask = (weights < 0.001).astype(np.uint8) * 255
    if np.any(gap_mask > 0):
        result = cv2.inpaint(result, gap_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
    
    print("Stitching complete!", file=sys.stderr)
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
        print(f"Processing {len(images_data)} images...", file=sys.stderr)
        
        # Decode images and extract orientation data
        images = []
        azimuths = []
        elevations = []
        
        for i, img_data in enumerate(images_data):
            img = decode_base64_image(img_data['data'])
            if img is not None:
                images.append(img)
                az = img_data.get('azimuth', 0)
                el = img_data.get('elevation', 0)
                azimuths.append(az)
                elevations.append(el)
                print(f"Image {i+1}: {img.shape[1]}x{img.shape[0]}, az={az:.1f}°, el={el:.1f}°", file=sys.stderr)
        
        if len(images) < 2:
            return jsonify({'success': False, 'error': 'Could not decode enough images'})
        
        # Use orientation-aware stitching (ALWAYS - this uses the gyroscope data correctly)
        print("\nUsing orientation-aware equirectangular projection...", file=sys.stderr)
        result = stitch_equirectangular(images, azimuths, elevations)
        
        panorama = encode_image_base64(result, quality=92)
        
        return jsonify({
            'success': True, 
            'panorama': panorama, 
            'method': 'equirectangular',
            'imageCount': len(images),
            'outputSize': f"{result.shape[1]}x{result.shape[0]}"
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
