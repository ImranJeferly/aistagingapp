#!/usr/bin/env python3
"""
Professional Panorama/HDRI Stitching using OpenCV
Uses OpenCV's Stitcher class for feature detection, matching, and seamless blending
"""

import cv2
import numpy as np
import sys
import json
import base64
import os
from pathlib import Path

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode a base64 image string to OpenCV format"""
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode base64 to bytes
    img_bytes = base64.b64decode(base64_string)
    
    # Convert to numpy array
    nparr = np.frombuffer(img_bytes, np.uint8)
    
    # Decode image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    return img

def encode_image_base64(img: np.ndarray, format: str = '.jpg', quality: int = 92) -> str:
    """Encode OpenCV image to base64 string"""
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality] if format == '.jpg' else []
    _, buffer = cv2.imencode(format, img, encode_params)
    base64_string = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_string}"

def stitch_panorama(images: list[np.ndarray], mode: str = 'panorama') -> tuple[bool, np.ndarray | str]:
    """
    Stitch multiple images into a panorama using OpenCV
    
    Args:
        images: List of OpenCV images (BGR format)
        mode: 'panorama' for regular panorama, 'scans' for document-like stitching
    
    Returns:
        (success, result) - result is stitched image on success, error message on failure
    """
    if len(images) < 2:
        return False, "Need at least 2 images to stitch"
    
    # Create stitcher
    if mode == 'scans':
        stitcher = cv2.Stitcher.create(cv2.Stitcher_SCANS)
    else:
        stitcher = cv2.Stitcher.create(cv2.Stitcher_PANORAMA)
    
    # Configure for better results
    # Use SIFT for feature detection (more robust than ORB)
    try:
        stitcher.setPanoConfidenceThresh(0.5)  # Lower threshold for more matches
    except:
        pass  # Some OpenCV versions don't have this
    
    # Attempt stitching
    status, result = stitcher.stitch(images)
    
    if status == cv2.Stitcher_OK:
        return True, result
    elif status == cv2.Stitcher_ERR_NEED_MORE_IMGS:
        return False, "Need more images with overlapping regions"
    elif status == cv2.Stitcher_ERR_HOMOGRAPHY_EST_FAIL:
        return False, "Homography estimation failed - images may not overlap enough"
    elif status == cv2.Stitcher_ERR_CAMERA_PARAMS_ADJUST_FAIL:
        return False, "Camera parameter adjustment failed"
    else:
        return False, f"Stitching failed with status code: {status}"

def stitch_spherical_panorama(images: list[np.ndarray], azimuths: list[float], elevations: list[float]) -> tuple[bool, np.ndarray | str]:
    """
    Stitch images into a spherical (equirectangular) panorama
    Uses custom projection when standard stitching fails
    
    Args:
        images: List of OpenCV images
        azimuths: List of azimuth angles (degrees) for each image
        elevations: List of elevation angles (degrees) for each image
    
    Returns:
        (success, result)
    """
    # First try OpenCV's built-in stitcher
    success, result = stitch_panorama(images, 'panorama')
    
    if success:
        # Convert to equirectangular if needed
        return True, result
    
    # If standard stitching fails, use manual projection
    print(f"Standard stitching failed: {result}", file=sys.stderr)
    print("Falling back to manual spherical projection...", file=sys.stderr)
    
    return manual_spherical_stitch(images, azimuths, elevations)

def manual_spherical_stitch(images: list[np.ndarray], azimuths: list[float], elevations: list[float]) -> tuple[bool, np.ndarray | str]:
    """
    Manual spherical projection stitching with multi-band blending
    Used when OpenCV's Stitcher fails
    """
    # Output size (equirectangular 2:1 aspect ratio)
    out_width = 4096
    out_height = 2048
    
    # Assume camera FOV (typical phone camera in portrait)
    h_fov = 55  # horizontal
    v_fov = 75  # vertical
    
    # Create output images for blending
    output = np.zeros((out_height, out_width, 3), dtype=np.float32)
    weights = np.zeros((out_height, out_width), dtype=np.float32)
    
    for idx, (img, az, el) in enumerate(zip(images, azimuths, elevations)):
        if img is None:
            continue
            
        h, w = img.shape[:2]
        img_float = img.astype(np.float32)
        
        # Create weight mask (feathered edges)
        weight_mask = create_feather_mask(w, h, feather_size=0.2)
        
        # Project image onto equirectangular
        for py in range(out_height):
            # Elevation for this row (-90 to 90, top to bottom inverted)
            out_el = 90 - (py / out_height) * 180
            
            for px in range(out_width):
                # Azimuth for this column (0 to 360)
                out_az = (px / out_width) * 360
                
                # Check if this output pixel falls within this image's FOV
                src_coords = project_to_image(out_az, out_el, az, el, h_fov, v_fov, w, h)
                
                if src_coords is not None:
                    sx, sy = src_coords
                    
                    # Bilinear interpolation
                    x0, y0 = int(sx), int(sy)
                    x1, y1 = min(x0 + 1, w - 1), min(y0 + 1, h - 1)
                    fx, fy = sx - x0, sy - y0
                    
                    # Sample color
                    color = (
                        img_float[y0, x0] * (1-fx) * (1-fy) +
                        img_float[y0, x1] * fx * (1-fy) +
                        img_float[y1, x0] * (1-fx) * fy +
                        img_float[y1, x1] * fx * fy
                    )
                    
                    # Sample weight
                    wt = weight_mask[y0, x0]
                    
                    # Accumulate
                    output[py, px] += color * wt
                    weights[py, px] += wt
        
        print(f"Projected image {idx + 1}/{len(images)}", file=sys.stderr)
    
    # Normalize by weights
    mask = weights > 0.001
    for c in range(3):
        output[:, :, c][mask] /= weights[mask]
    
    # Fill gaps with gradient background
    fill_background(output, weights)
    
    # Convert back to uint8
    result = np.clip(output, 0, 255).astype(np.uint8)
    
    return True, result

def create_feather_mask(width: int, height: int, feather_size: float = 0.15) -> np.ndarray:
    """Create a feathered weight mask for smooth blending"""
    mask = np.ones((height, width), dtype=np.float32)
    
    feather_x = int(width * feather_size)
    feather_y = int(height * feather_size)
    
    # Horizontal feathering
    for x in range(feather_x):
        t = x / feather_x
        weight = t * t * (3 - 2 * t)  # smoothstep
        mask[:, x] *= weight
        mask[:, width - 1 - x] *= weight
    
    # Vertical feathering
    for y in range(feather_y):
        t = y / feather_y
        weight = t * t * (3 - 2 * t)  # smoothstep
        mask[y, :] *= weight
        mask[height - 1 - y, :] *= weight
    
    return mask

def project_to_image(out_az: float, out_el: float, img_az: float, img_el: float, 
                     h_fov: float, v_fov: float, img_w: int, img_h: int) -> tuple[float, float] | None:
    """
    Project an equirectangular coordinate to source image coordinates
    Returns None if the point is outside the image's field of view
    """
    # Convert to radians
    out_az_rad = np.radians(out_az)
    out_el_rad = np.radians(out_el)
    img_az_rad = np.radians(img_az)
    img_el_rad = np.radians(img_el)
    
    # Direction vector for output pixel
    dir_x = np.cos(out_el_rad) * np.sin(out_az_rad)
    dir_y = np.sin(out_el_rad)
    dir_z = np.cos(out_el_rad) * np.cos(out_az_rad)
    
    # Camera basis vectors
    # Forward
    fwd_x = np.cos(img_el_rad) * np.sin(img_az_rad)
    fwd_y = np.sin(img_el_rad)
    fwd_z = np.cos(img_el_rad) * np.cos(img_az_rad)
    
    # Right
    right_x = np.cos(img_az_rad)
    right_y = 0
    right_z = -np.sin(img_az_rad)
    
    # Up
    up_x = -np.sin(img_el_rad) * np.sin(img_az_rad)
    up_y = np.cos(img_el_rad)
    up_z = -np.sin(img_el_rad) * np.cos(img_az_rad)
    
    # Project direction onto camera basis
    dot_fwd = dir_x * fwd_x + dir_y * fwd_y + dir_z * fwd_z
    
    # Behind camera
    if dot_fwd <= 0.01:
        return None
    
    dot_right = dir_x * right_x + dir_y * right_y + dir_z * right_z
    dot_up = dir_x * up_x + dir_y * up_y + dir_z * up_z
    
    # Project to image plane
    x = dot_right / dot_fwd
    y = dot_up / dot_fwd
    
    # Convert to normalized coordinates
    h_fov_rad = np.radians(h_fov)
    v_fov_rad = np.radians(v_fov)
    
    u = x / np.tan(h_fov_rad / 2) * 0.5 + 0.5
    v = 0.5 - y / np.tan(v_fov_rad / 2) * 0.5
    
    # Check bounds
    if u < 0 or u > 1 or v < 0 or v > 1:
        return None
    
    # Convert to pixel coordinates
    px = u * (img_w - 1)
    py = v * (img_h - 1)
    
    return (px, py)

def fill_background(output: np.ndarray, weights: np.ndarray):
    """Fill areas with no image data with a gradient background"""
    h, w = output.shape[:2]
    
    for y in range(h):
        t = y / h
        
        # Sky to ground gradient
        if t < 0.3:
            color = [46, 26, 26]  # Dark blue (BGR)
        elif t < 0.45:
            lt = (t - 0.3) / 0.15
            color = [
                46 + (235 - 46) * lt,
                26 + (206 - 26) * lt,
                26 + (135 - 26) * lt
            ]
        elif t < 0.55:
            lt = (t - 0.45) / 0.1
            color = [
                235 + (180 - 235) * lt,
                206 + (200 - 206) * lt,
                135 + (200 - 135) * lt
            ]
        elif t < 0.7:
            lt = (t - 0.55) / 0.15
            color = [
                180 + (85 - 180) * lt,
                200 + (115 - 200) * lt,
                200 + (139 - 200) * lt
            ]
        else:
            lt = (t - 0.7) / 0.3
            color = [
                85 + (50 - 85) * lt,
                115 + (50 - 115) * lt,
                139 + (50 - 139) * lt
            ]
        
        for x in range(w):
            if weights[y, x] < 0.01:
                output[y, x] = color

def main():
    """Main entry point - reads JSON from stdin, outputs result to stdout"""
    try:
        # Read input JSON
        input_data = json.load(sys.stdin)
        
        images_data = input_data.get('images', [])
        
        if not images_data:
            print(json.dumps({'success': False, 'error': 'No images provided'}))
            return
        
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
                print(f"Loaded image: az={img_data.get('azimuth', 0)}, el={img_data.get('elevation', 0)}, size={img.shape}", file=sys.stderr)
        
        if len(images) < 2:
            print(json.dumps({'success': False, 'error': 'Could not decode enough images'}))
            return
        
        # Try stitching
        print("Starting OpenCV stitching...", file=sys.stderr)
        success, result = stitch_spherical_panorama(images, azimuths, elevations)
        
        if success:
            # Encode result
            result_base64 = encode_image_base64(result, '.jpg', 92)
            print(f"Stitching successful! Output size: {result.shape}", file=sys.stderr)
            print(json.dumps({'success': True, 'panorama': result_base64}))
        else:
            print(json.dumps({'success': False, 'error': str(result)}))
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({'success': False, 'error': str(e)}))

if __name__ == '__main__':
    main()
