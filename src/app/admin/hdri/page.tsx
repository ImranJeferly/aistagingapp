'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RotateCcw, Check, X, Download, Smartphone, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// QR CODE COMPONENT
// ============================================================================
const QRCodeDisplay = ({ url }: { url: string }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const size = 256;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&margin=10`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      setQrDataUrl(canvas.toDataURL('image/png'));
    };
    img.src = qrApiUrl;
  }, [url]);
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600 text-center max-w-xs">
        Scan with phone for best experience
      </p>
    </div>
  );
};

// ============================================================================
// TYPES
// ============================================================================
interface CapturedImage {
  id: string;
  file: File;
  previewUrl: string;
  azimuth: number;
  elevation: number;
  timestamp: number;
}

interface DeviceOrientation {
  alpha: number;
  beta: number;
  gamma: number;
}

// ============================================================================
// CAPTURE TARGETS - 18 positions for full 360° coverage
// ============================================================================
const CAPTURE_TARGETS = [
  // Middle row - 8 positions at horizon (elevation 0°)
  { azimuth: 0, elevation: 0, name: 'Front' },
  { azimuth: 45, elevation: 0, name: 'Front-Right' },
  { azimuth: 90, elevation: 0, name: 'Right' },
  { azimuth: 135, elevation: 0, name: 'Back-Right' },
  { azimuth: 180, elevation: 0, name: 'Back' },
  { azimuth: 225, elevation: 0, name: 'Back-Left' },
  { azimuth: 270, elevation: 0, name: 'Left' },
  { azimuth: 315, elevation: 0, name: 'Front-Left' },
  // Top row - 4 positions looking up (elevation 45°)
  { azimuth: 0, elevation: 45, name: 'Up-Front' },
  { azimuth: 90, elevation: 45, name: 'Up-Right' },
  { azimuth: 180, elevation: 45, name: 'Up-Back' },
  { azimuth: 270, elevation: 45, name: 'Up-Left' },
  // Bottom row - 4 positions looking down (elevation -45°)
  { azimuth: 0, elevation: -45, name: 'Down-Front' },
  { azimuth: 90, elevation: -45, name: 'Down-Right' },
  { azimuth: 180, elevation: -45, name: 'Down-Back' },
  { azimuth: 270, elevation: -45, name: 'Down-Left' },
  // Ceiling and Floor (elevation 80° and -80°)
  { azimuth: 0, elevation: 80, name: 'Ceiling' },
  { azimuth: 0, elevation: -80, name: 'Floor' },
];

const CAPTURE_THRESHOLD = 25; // degrees
const CAPTURE_HOLD_TIME = 800; // ms

// ============================================================================
// THREE.JS DEVICE ORIENTATION CONTROLS - EXACT IMPLEMENTATION
// https://github.com/mrdoob/three.js/blob/master/examples/js/controls/DeviceOrientationControls.js
// ============================================================================

// Quaternion multiplication: a * b
function multiplyQuaternions(a: number[], b: number[]): number[] {
  const [aw, ax, ay, az] = a;
  const [bw, bx, by, bz] = b;
  return [
    aw * bw - ax * bx - ay * by - az * bz,
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw
  ];
}

// Convert Euler angles (YXZ order) to Quaternion - THREE.js method
function eulerYXZToQuaternion(x: number, y: number, z: number): number[] {
  const c1 = Math.cos(x / 2), s1 = Math.sin(x / 2);
  const c2 = Math.cos(y / 2), s2 = Math.sin(y / 2);
  const c3 = Math.cos(z / 2), s3 = Math.sin(z / 2);
  
  // YXZ order quaternion
  return [
    c1 * c2 * c3 + s1 * s2 * s3,  // w
    s1 * c2 * c3 + c1 * s2 * s3,  // x
    c1 * s2 * c3 - s1 * c2 * s3,  // y
    c1 * c2 * s3 - s1 * s2 * c3   // z
  ];
}

// Quaternion from axis-angle
function quaternionFromAxisAngle(axis: number[], angle: number): number[] {
  const halfAngle = angle / 2;
  const s = Math.sin(halfAngle);
  return [Math.cos(halfAngle), axis[0] * s, axis[1] * s, axis[2] * s];
}

// Apply quaternion rotation to a vector
function rotateVectorByQuaternion(v: number[], q: number[]): number[] {
  const [w, x, y, z] = q;
  const [vx, vy, vz] = v;
  
  // q * v * q^-1
  const ix = w * vx + y * vz - z * vy;
  const iy = w * vy + z * vx - x * vz;
  const iz = w * vz + x * vy - y * vx;
  const iw = -x * vx - y * vy - z * vz;
  
  return [
    ix * w + iw * -x + iy * -z - iz * -y,
    iy * w + iw * -y + iz * -x - ix * -z,
    iz * w + iw * -z + ix * -y - iy * -x
  ];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function HDRIGenerationPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHDRI, setGeneratedHDRI] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  
  // Debug logger that shows on screen
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };
  
  const [orientation, setOrientation] = useState<DeviceOrientation>({ alpha: 0, beta: 0, gamma: 0 });
  const [screenOrientation, setScreenOrientation] = useState(0);
  const [hasOrientationPermission, setHasOrientationPermission] = useState(false);
  const [initialAlpha, setInitialAlpha] = useState<number | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [nearTarget, setNearTarget] = useState<typeof CAPTURE_TARGETS[0] | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showDoneScreen, setShowDoneScreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number | null>(null);

  // ==========================================================================
  // THREE.JS setObjectQuaternion - EXACT IMPLEMENTATION
  // ==========================================================================
  const getDeviceQuaternion = useCallback(() => {
    const degToRad = Math.PI / 180;
    
    // Get orientation values in radians
    let alpha = orientation.alpha * degToRad;
    const beta = orientation.beta * degToRad;
    const gamma = orientation.gamma * degToRad;
    const orient = screenOrientation * degToRad;
    
    // Apply initial alpha offset for relative orientation
    if (initialAlpha !== null) {
      alpha = alpha - (initialAlpha * degToRad);
    }
    
    // THREE.JS: _euler.set(beta, alpha, -gamma, 'YXZ')
    let q = eulerYXZToQuaternion(beta, alpha, -gamma);
    
    // THREE.JS: quaternion.multiply(_q1)
    // _q1 = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)) = -90° around X-axis
    // This rotates because camera looks out the BACK of device, not the TOP
    const q1: number[] = [Math.sqrt(0.5), -Math.sqrt(0.5), 0, 0];
    q = multiplyQuaternions(q, q1);
    
    // THREE.JS: quaternion.multiply(_q0.setFromAxisAngle(_zee, -orient))
    // Adjust for screen orientation
    const q0 = quaternionFromAxisAngle([0, 0, 1], -orient);
    q = multiplyQuaternions(q, q0);
    
    return q;
  }, [orientation.alpha, orientation.beta, orientation.gamma, screenOrientation, initialAlpha]);

  // Get camera look direction from device orientation
  const getCameraDirection = useCallback(() => {
    const q = getDeviceQuaternion();
    // Camera looks down -Z axis in Three.js convention
    const forward = rotateVectorByQuaternion([0, 0, -1], q);
    return { x: forward[0], y: forward[1], z: forward[2] };
  }, [getDeviceQuaternion]);

  // Convert camera direction to azimuth (0-360) and elevation (-90 to 90)
  const currentAzimuth = useCallback(() => {
    const dir = getCameraDirection();
    // Azimuth: angle in horizontal plane
    // Add 180° to fix front/back reversal (camera convention vs world convention)
    let azimuth = Math.atan2(dir.x, dir.z) * (180 / Math.PI);
    azimuth = (azimuth + 180 + 360) % 360; // Add 180° to flip front/back
    return azimuth;
  }, [getCameraDirection]);

  const currentElevation = useCallback(() => {
    const dir = getCameraDirection();
    // Elevation: angle from horizontal plane
    // Negate to fix up/down reversal
    const horizontalDist = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
    let elevation = Math.atan2(dir.y, horizontalDist) * (180 / Math.PI); // Removed negative to flip up/down
    return Math.max(-90, Math.min(90, elevation));
  }, [getCameraDirection]);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    setPageUrl(window.location.href);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ==========================================================================
  // DEVICE ORIENTATION HANDLING
  // ==========================================================================
  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setHasOrientationPermission(true);
          return true;
        }
      } catch (e) {
        console.error('Orientation permission error:', e);
        return false;
      }
    } else {
      setHasOrientationPermission(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!showCamera || !hasOrientationPermission) return;
    
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        setOrientation({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        });
        
        if (initialAlpha === null) {
          setInitialAlpha(event.alpha);
        }
      }
    };
    
    const handleScreenOrientation = () => {
      const angle = window.screen?.orientation?.angle || (window as any).orientation || 0;
      setScreenOrientation(angle);
    };
    
    handleScreenOrientation();
    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('orientationchange', handleScreenOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('orientationchange', handleScreenOrientation);
    };
  }, [showCamera, hasOrientationPermission, initialAlpha]);

  // ==========================================================================
  // AUTO-CAPTURE LOGIC
  // ==========================================================================
  useEffect(() => {
    if (!showCamera || !autoCapture || !isCameraReady || isCapturing) {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setHoldProgress(0);
      return;
    }
    
    const azimuth = currentAzimuth();
    const elevation = currentElevation();
    
    // Find nearest uncaptured target
    let nearest: typeof CAPTURE_TARGETS[0] | null = null;
    let minDistance = Infinity;
    
    for (const target of CAPTURE_TARGETS) {
      const alreadyCaptured = capturedImages.some(img => {
        const azDiff = Math.abs(img.azimuth - target.azimuth);
        const elDiff = Math.abs(img.elevation - target.elevation);
        return azDiff < CAPTURE_THRESHOLD && elDiff < CAPTURE_THRESHOLD;
      });
      
      if (alreadyCaptured) continue;
      
      let azDiff = Math.abs(azimuth - target.azimuth);
      if (azDiff > 180) azDiff = 360 - azDiff;
      const elDiff = Math.abs(elevation - target.elevation);
      const distance = Math.sqrt(azDiff * azDiff + elDiff * elDiff);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = target;
      }
    }
    
    setNearTarget(nearest);
    
    // Start hold timer if close enough to target
    if (nearest && minDistance < CAPTURE_THRESHOLD) {
      if (!holdStartRef.current) {
        holdStartRef.current = Date.now();
        holdTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - (holdStartRef.current || Date.now());
          const progress = Math.min(100, (elapsed / CAPTURE_HOLD_TIME) * 100);
          setHoldProgress(progress);
          
          if (progress >= 100) {
            captureImage(azimuth, elevation, nearest!.name);
            holdStartRef.current = null;
            setHoldProgress(0);
            if (holdTimerRef.current) clearInterval(holdTimerRef.current);
          }
        }, 50);
      }
    } else {
      holdStartRef.current = null;
      setHoldProgress(0);
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }
    
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, [showCamera, autoCapture, isCameraReady, isCapturing, orientation, capturedImages, currentAzimuth, currentElevation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  // ==========================================================================
  // CAMERA FUNCTIONS
  // ==========================================================================
  const startCamera = async () => {
    try {
      setError(null);
      setShowCamera(true);
      setShowDoneScreen(false);
      
      await requestOrientationPermission();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Request BACK camera (environment facing)
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
          audio: false
        });
      } catch {
        // Fallback if exact environment camera not available
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          video.onloadedmetadata = () => {
            video.play().then(() => {
              setIsCameraReady(true);
              resolve();
            }).catch(reject);
          };
          video.onerror = () => reject(new Error('Video failed to load'));
          setTimeout(() => reject(new Error('Camera timeout')), 5000);
        });
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setShowCamera(false);
      setIsCameraReady(false);
      setError('Could not access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsCameraReady(false);
    setInitialAlpha(null);
    setHoldProgress(0);
  };

  const captureImage = async (azimuth: number, elevation: number, name: string) => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    
    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Camera not ready');
        setIsCapturing(false);
        return;
      }
      
      // Resize to max 1920px to reduce file size for upload
      const maxSize = 1920;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
      });
      
      if (!blob || blob.size === 0) {
        setError('Failed to capture image');
        setIsCapturing(false);
        return;
      }
      
      addDebugLog(`Captured: ${name}, ${(blob.size / 1024).toFixed(0)}KB, ${width}x${height}`);
      
      const file = new File([blob], `hdri-${name}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      
      const newImage: CapturedImage = {
        id: `${name}-${Date.now()}`,
        file,
        previewUrl,
        azimuth: Math.round(azimuth),
        elevation: Math.round(elevation),
        timestamp: Date.now(),
      };
      
      setCapturedImages(prev => {
        const updated = [...prev, newImage];
        if (updated.length >= CAPTURE_TARGETS.length) {
          setTimeout(() => setShowDoneScreen(true), 500);
        }
        return updated;
      });
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (err) {
      console.error('Capture error:', err);
      setError('Failed to capture image');
    } finally {
      setIsCapturing(false);
    }
  };

  const manualCapture = () => {
    const azimuth = currentAzimuth();
    const elevation = currentElevation();
    const nearest = nearTarget || { name: `pos-${capturedImages.length}` };
    captureImage(azimuth, elevation, nearest.name);
  };

  const resetCalibration = () => {
    setInitialAlpha(orientation.alpha);
  };

  const removeImage = (id: string) => {
    setCapturedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const resetCaptures = () => {
    capturedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setCapturedImages([]);
    setGeneratedHDRI(null);
    setError(null);
    setShowDoneScreen(false);
  };

  // ==========================================================================
  // HDRI GENERATION
  // ==========================================================================
  const generateHDRI = async () => {
    if (capturedImages.length < 4) {
      setError('Please capture at least 4 images');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      let totalSize = 0;
      
      capturedImages.forEach((img) => {
        formData.append('images', img.file);
        formData.append('directions', `az${img.azimuth}_el${img.elevation}`);
        totalSize += img.file.size;
      });
      
      const sizeMsg = `Uploading ${capturedImages.length} images, ${(totalSize / 1024 / 1024).toFixed(2)}MB`;
      addDebugLog(sizeMsg);
      
      const response = await fetch('/api/admin/hdri/generate', {
        method: 'POST',
        body: formData,
      });
      
      addDebugLog(`Response status: ${response.status}`);
      
      // Get response as text first to handle non-JSON responses
      const responseText = await response.text();
      addDebugLog(`Response length: ${responseText.length} chars`);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        addDebugLog('JSON parsed successfully');
      } catch (parseErr) {
        // If not valid JSON, throw with the raw text
        const preview = responseText.substring(0, 200);
        addDebugLog(`JSON parse failed: ${preview}`);
        throw new Error(`Server error: ${preview}`);
      }
      
      if (!response.ok) {
        const errMsg = data.error || data.message || 'Failed to generate HDRI';
        addDebugLog(`API error: ${errMsg}`);
        throw new Error(errMsg);
      }
      
      addDebugLog('HDRI generated successfully!');
      setGeneratedHDRI(data.hdriUrl);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to generate HDRI';
      addDebugLog(`ERROR: ${errMsg}`);
      setError(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ==========================================================================
  // SCREEN POSITION CALCULATIONS
  // ==========================================================================
  const getImageForTarget = (target: typeof CAPTURE_TARGETS[0]) => {
    return capturedImages.find(img => {
      const azDiff = Math.abs(img.azimuth - target.azimuth);
      const elDiff = Math.abs(img.elevation - target.elevation);
      return azDiff < CAPTURE_THRESHOLD && elDiff < CAPTURE_THRESHOLD;
    });
  };

  const getTargetScreenPosition = (target: { azimuth: number; elevation: number }) => {
    const cameraAzimuth = currentAzimuth();
    const cameraElevation = currentElevation();
    
    // Calculate difference between target and camera direction
    let azDiff = target.azimuth - cameraAzimuth;
    if (azDiff > 180) azDiff -= 360;
    if (azDiff < -180) azDiff += 360;
    
    const elDiff = target.elevation - cameraElevation;
    
    // Camera FOV
    const hFov = 70;
    const vFov = 90;
    
    // Check if visible
    const margin = 35;
    if (Math.abs(azDiff) > hFov / 2 + margin || Math.abs(elDiff) > vFov / 2 + margin) {
      return null;
    }
    
    // Screen position calculation:
    // NEGATE x because when camera turns RIGHT, objects move LEFT on screen
    // NEGATE y is removed - elDiff > 0 means target is UP, should be at top of screen (negative y)
    // But since we flipped elevation, we need to also flip y here
    const x = -azDiff / (hFov / 2);
    const y = elDiff / (vFov / 2);  // Positive elDiff (up) = positive y = bottom, but elevation is now correct
    
    const distance = Math.sqrt(azDiff * azDiff + elDiff * elDiff);
    return { x, y, distance };
  };

  const getOffScreenDirection = (target: typeof CAPTURE_TARGETS[0]) => {
    const cameraAzimuth = currentAzimuth();
    const cameraElevation = currentElevation();
    
    let azDiff = target.azimuth - cameraAzimuth;
    if (azDiff > 180) azDiff -= 360;
    if (azDiff < -180) azDiff += 360;
    const elDiff = target.elevation - cameraElevation;
    
    if (Math.abs(elDiff) > Math.abs(azDiff)) {
      // elDiff > 0 means target is higher elevation (up), need to tilt phone up
      return elDiff > 0 ? 'up' : 'down';
    } else {
      // azDiff > 0 means target is to the left, need to turn left
      return azDiff > 0 ? 'left' : 'right';
    }
  };

  // ==========================================================================
  // CAMERA VIEW RENDER
  // ==========================================================================
  if (showCamera) {
    const azimuth = currentAzimuth();
    const elevation = currentElevation();
    
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Loading overlay */}
        {!isCameraReady && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4" />
            <p className="text-sm">Initializing camera...</p>
          </div>
        )}
        
        {/* 3D Overlay */}
        {isCameraReady && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Captured images floating in 3D */}
            {capturedImages.map(img => {
              const pos = getTargetScreenPosition({ azimuth: img.azimuth, elevation: img.elevation });
              if (!pos) return null;
              
              const screenX = 50 + pos.x * 40;
              const screenY = 50 + pos.y * 40;
              const scale = Math.max(0.4, 1 - pos.distance / 80);
              const opacity = Math.max(0.5, 1 - pos.distance / 50);
              
              return (
                <div
                  key={img.id}
                  className="absolute transition-all duration-100"
                  style={{
                    left: `${screenX}%`,
                    top: `${screenY}%`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    opacity,
                    zIndex: Math.round(100 - pos.distance),
                  }}
                >
                  <div className="relative">
                    <img 
                      src={img.previewUrl} 
                      alt="" 
                      className="w-20 h-32 object-cover rounded-xl border-4 border-green-400 shadow-xl"
                    />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Target indicators */}
            {CAPTURE_TARGETS.map(target => {
              const hasImage = getImageForTarget(target);
              if (hasImage) return null;
              
              const pos = getTargetScreenPosition(target);
              const isCurrentTarget = nearTarget?.name === target.name;
              
              // Off-screen direction arrow
              if (!pos) {
                const direction = getOffScreenDirection(target);
                if (!isCurrentTarget) return null;
                
                return (
                  <div
                    key={target.name}
                    className={`absolute ${
                      direction === 'up' ? 'top-20 left-1/2 -translate-x-1/2' :
                      direction === 'down' ? 'bottom-40 left-1/2 -translate-x-1/2' :
                      direction === 'left' ? 'left-6 top-1/2 -translate-y-1/2' :
                      'right-6 top-1/2 -translate-y-1/2'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1 animate-pulse">
                      {direction === 'up' && <ChevronUp className="w-12 h-12 text-yellow-400" />}
                      {direction === 'down' && <ChevronDown className="w-12 h-12 text-yellow-400" />}
                      {direction === 'left' && <ChevronLeft className="w-12 h-12 text-yellow-400" />}
                      {direction === 'right' && <ChevronRight className="w-12 h-12 text-yellow-400" />}
                      <span className="text-yellow-400 text-sm font-bold bg-black/60 px-3 py-1 rounded-full">
                        {target.name}
                      </span>
                    </div>
                  </div>
                );
              }
              
              const screenX = 50 + pos.x * 40;
              const screenY = 50 + pos.y * 40;
              const size = isCurrentTarget ? 110 : 80;
              
              return (
                <div
                  key={target.name}
                  className="absolute transition-all duration-100"
                  style={{
                    left: `${screenX}%`,
                    top: `${screenY}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isCurrentTarget ? 200 : 50,
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Target circle with progress */}
                    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
                      <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke={isCurrentTarget ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)"}
                        strokeWidth={isCurrentTarget ? "5" : "3"}
                      />
                      {isCurrentTarget && holdProgress > 0 && (
                        <circle
                          cx="50" cy="50" r="45"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${holdProgress * 2.83} 283`}
                        />
                      )}
                    </svg>
                    
                    {/* Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative" style={{ width: size * 0.5, height: size * 0.5 }}>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/70" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/70" />
                      </div>
                    </div>
                    
                    {/* Label */}
                    <div className="absolute whitespace-nowrap" style={{ top: size / 2 + 12 }}>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        isCurrentTarget 
                          ? 'bg-yellow-400 text-black' 
                          : 'bg-black/50 text-white/80'
                      }`}>
                        {target.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Center crosshair */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/60" />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/60" />
              </div>
            </div>
          </div>
        )}
        
        {/* Flash effect */}
        <AnimatePresence>
          {isCapturing && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-30"
            />
          )}
        </AnimatePresence>
        
        {/* Top HUD */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10">
          <div className="flex items-start justify-between">
            {/* Orientation info */}
            <div className="bg-black/70 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-3 text-white">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-2 border-white/40 rounded-full" />
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: `rotate(${-azimuth}deg)` }}
                  >
                    <div className="w-1.5 h-5 bg-red-500 rounded-full -translate-y-1" />
                  </div>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-400">N</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold">{Math.round(azimuth)}°</div>
                  <div className="text-white/70 text-xs">
                    Tilt: {Math.round(elevation)}°
                  </div>
                </div>
              </div>
              {/* Debug values */}
              <div className="text-white/40 text-[9px] mt-2 font-mono">
                α:{Math.round(orientation.alpha)}° β:{Math.round(orientation.beta)}° γ:{Math.round(orientation.gamma)}°
              </div>
              {nearTarget && (
                <div className="mt-2 text-yellow-400 text-xs font-bold">
                  → {nearTarget.name}
                </div>
              )}
            </div>
            
            {/* Progress */}
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
              <div className="text-white font-bold text-xl">
                {capturedImages.length}/{CAPTURE_TARGETS.length}
              </div>
              <div className="text-white/60 text-xs">captured</div>
            </div>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-500/90 rounded-xl">
              <p className="text-white text-sm font-mono break-all">{error}</p>
            </div>
          )}
          
          {/* Debug toggle button */}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="mt-2 px-3 py-1 bg-purple-600/80 rounded-lg text-white text-xs"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'} ({debugLogs.length})
          </button>
          
          {/* Debug logs panel */}
          {showDebug && debugLogs.length > 0 && (
            <div className="mt-2 p-3 bg-black/90 rounded-xl max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-purple-400 text-xs font-bold">Debug Logs</span>
                <button 
                  onClick={() => setDebugLogs([])}
                  className="text-red-400 text-xs"
                >
                  Clear
                </button>
              </div>
              {debugLogs.map((log, i) => (
                <p key={i} className="text-green-400 text-[10px] font-mono break-all leading-tight">
                  {log}
                </p>
              ))}
            </div>
          )}
        </div>
        
        {/* Thumbnails */}
        {capturedImages.length > 0 && (
          <div className="absolute bottom-40 left-0 right-0 z-10">
            <div className="flex gap-3 px-4 overflow-x-auto pb-2">
              {capturedImages.map(img => (
                <div key={img.id} className="relative flex-shrink-0 group">
                  <img 
                    src={img.previewUrl} 
                    alt="" 
                    className="w-12 h-20 object-cover rounded-lg border-2 border-green-400"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="pointer-events-auto absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={stopCamera}
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <X className="w-7 h-7 text-white" />
            </button>
            
            <button
              onClick={manualCapture}
              disabled={isCapturing}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white/50 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full border-4 border-gray-300" />
            </button>
            
            <button
              onClick={resetCalibration}
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <RefreshCw className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
        
        {/* Done overlay */}
        <AnimatePresence>
          {showDoneScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-40 p-6"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-14 h-14 text-white" />
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">All Captured!</h2>
                <p className="text-white/70 mb-8">{capturedImages.length} images ready for HDRI generation</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDoneScreen(false)}
                    className="px-6 py-3 bg-white/20 text-white rounded-xl font-medium"
                  >
                    Continue Capturing
                  </button>
                  <button
                    onClick={() => { stopCamera(); }}
                    className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold"
                  >
                    Generate HDRI
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==========================================================================
  // MAIN PAGE RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 border-2 border-yellow-400 rounded-full mb-4">
            <span className="text-yellow-700 font-bold text-sm">BETA</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">HDRI Generator</h1>
          <p className="text-gray-600">Capture 360° photos to create custom HDRI lighting</p>
        </div>
        
        {/* Mobile: Direct camera access */}
        {isMobile ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="text-xl font-bold mb-4">📱 Capture Mode</h2>
              <p className="text-gray-600 mb-6">
                Use your phones gyroscope to capture {CAPTURE_TARGETS.length} positions for a complete 360° HDRI.
              </p>
              
              <button
                onClick={startCamera}
                className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors"
              >
                <Camera className="w-6 h-6" />
                Start Capturing
              </button>
            </div>
            
            {/* Captured images grid */}
            {capturedImages.length > 0 && (
              <div className="bg-white rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Captured Images ({capturedImages.length})</h2>
                  <button
                    onClick={resetCaptures}
                    className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {capturedImages.map(img => (
                    <div key={img.id} className="relative aspect-square group">
                      <img 
                        src={img.previewUrl} 
                        alt="" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={generateHDRI}
                  disabled={isGenerating || capturedImages.length < 4}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate HDRI
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Show QR code */
          <div className="bg-white rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="text-center mb-6">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-2">Mobile Required</h2>
              <p className="text-gray-600">
                HDRI capture requires device gyroscope. Scan this QR code with your phone:
              </p>
            </div>
            
            <div className="flex justify-center">
              <QRCodeDisplay url={pageUrl} />
            </div>
          </div>
        )}
        
        {/* Generated HDRI */}
        {generatedHDRI && (
          <div className="mt-6 bg-white rounded-2xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
            <h2 className="text-xl font-bold mb-4">✨ Generated HDRI</h2>
            <div className="aspect-[2/1] bg-gray-100 rounded-xl overflow-hidden mb-4">
              <img 
                src={generatedHDRI} 
                alt="Generated HDRI" 
                className="w-full h-full object-cover"
              />
            </div>
            <a
              href={generatedHDRI}
              download="custom-hdri.hdr"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download HDRI
            </a>
          </div>
        )}
        
        {/* Error */}
        {error && !showCamera && (
          <div className="mt-6 p-4 bg-red-100 border-2 border-red-400 rounded-xl">
            <p className="text-red-700 font-mono text-sm break-all">{error}</p>
          </div>
        )}
        
        {/* Debug panel for mobile testing */}
        {isMobile && (
          <div className="mt-6">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="w-full py-2 bg-purple-600 text-white rounded-xl font-medium text-sm"
            >
              {showDebug ? 'Hide' : 'Show'} Debug Logs ({debugLogs.length})
            </button>
            
            {showDebug && debugLogs.length > 0 && (
              <div className="mt-2 p-4 bg-gray-900 rounded-xl max-h-64 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-purple-400 text-sm font-bold">Debug Logs</span>
                  <button 
                    onClick={() => setDebugLogs([])}
                    className="text-red-400 text-xs px-2 py-1 bg-red-900/30 rounded"
                  >
                    Clear
                  </button>
                </div>
                {debugLogs.map((log, i) => (
                  <p key={i} className="text-green-400 text-xs font-mono break-all leading-relaxed mb-1">
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
