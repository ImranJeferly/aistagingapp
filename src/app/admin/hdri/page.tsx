'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RotateCcw, Check, X, Download, Smartphone, Sparkles, AlertCircle, RefreshCw, Lock, Unlock, Compass, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// QR Code component
const QRCodeDisplay = ({ url }: { url: string }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  
  useEffect(() => {
    generateQRCode(url).then(setQrDataUrl);
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

async function generateQRCode(text: string): Promise<string> {
  const size = 256;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=10`;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = qrApiUrl;
  });
}

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

// Target positions for HDRI capture
const CAPTURE_TARGETS = [
  { azimuth: 0, elevation: 0, name: 'Front' },
  { azimuth: 45, elevation: 0, name: 'Front-Right' },
  { azimuth: 90, elevation: 0, name: 'Right' },
  { azimuth: 135, elevation: 0, name: 'Back-Right' },
  { azimuth: 180, elevation: 0, name: 'Back' },
  { azimuth: 225, elevation: 0, name: 'Back-Left' },
  { azimuth: 270, elevation: 0, name: 'Left' },
  { azimuth: 315, elevation: 0, name: 'Front-Left' },
  { azimuth: 0, elevation: 75, name: 'Ceiling' },
  { azimuth: 0, elevation: -75, name: 'Floor' },
];

const CAPTURE_THRESHOLD = 20;
const CAPTURE_HOLD_TIME = 600;

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
  
  const [orientation, setOrientation] = useState<DeviceOrientation>({ alpha: 0, beta: 0, gamma: 0 });
  const [hasOrientationPermission, setHasOrientationPermission] = useState(false);
  const [initialAlpha, setInitialAlpha] = useState<number | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [nearTarget, setNearTarget] = useState<typeof CAPTURE_TARGETS[0] | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showDoneScreen, setShowDoneScreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number | null>(null);
  
  // ==========================================================================
  // DEVICE ORIENTATION TO CAMERA DIRECTION
  // ==========================================================================
  // Based on W3C Device Orientation API specification:
  // https://w3c.github.io/deviceorientation/
  //
  // The Device Orientation API uses intrinsic Tait-Bryan angles Z-X'-Y'':
  // 1. alpha (0-360): Rotation around Z axis (compass direction)
  //    - 0 = North, 90 = East, 180 = South, 270 = West
  //    - When you rotate device RIGHT (clockwise from above), alpha INCREASES
  //
  // 2. beta (-180 to 180): Rotation around X axis (front-back tilt)
  //    - 0 = device flat, screen up
  //    - 90 = device vertical, screen facing user
  //    - 180/-180 = device flat, screen down
  //
  // 3. gamma (-90 to 90): Rotation around Y axis (left-right tilt)
  //    - 0 = no tilt
  //    - 90 = tilted right
  //    - -90 = tilted left
  //
  // Our coordinate system for HDRI capture:
  // - Azimuth: 0 = initial forward direction, increases clockwise (to the right)
  // - Elevation: 0 = horizon, +90 = straight up (ceiling), -90 = straight down (floor)
  // ==========================================================================
  
  const currentAzimuth = useCallback(() => {
    // When device rotates RIGHT (clockwise from above), alpha INCREASES
    // Our azimuth should also INCREASE when we turn RIGHT
    // So azimuth = alpha - initialAlpha (relative to starting direction)
    let azimuth = orientation.alpha;
    if (initialAlpha !== null) {
      azimuth = (orientation.alpha - initialAlpha + 360) % 360;
    }
    return azimuth;
  }, [orientation.alpha, initialAlpha]);
  
  const currentElevation = useCallback(() => {
    // Beta behavior (when holding phone in portrait, screen facing you):
    // - beta = 90: phone vertical, camera pointing at horizon → elevation = 0
    // - beta = 0: phone flat face up, camera pointing at ceiling → elevation = +90
    // - beta = 180: phone flat face down, camera pointing at floor → elevation = -90
    // - beta < 90: phone tilted back → camera pointing UP → positive elevation
    // - beta > 90: phone tilted forward → camera pointing DOWN → negative elevation
    //
    // Formula: elevation = 90 - beta
    // But we need to handle the range properly
    
    const beta = orientation.beta;
    
    // For standard portrait usage, beta is typically 0 to 180
    // elevation = 90 - beta gives us:
    // beta=0 → 90 (ceiling), beta=90 → 0 (horizon), beta=180 → -90 (floor)
    let elevation = 90 - beta;
    
    // Clamp to valid range
    elevation = Math.max(-90, Math.min(90, elevation));
    return elevation;
  }, [orientation.beta]);

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
    
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [showCamera, hasOrientationPermission, initialAlpha]);

  // Auto-capture logic
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
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, [showCamera, autoCapture, isCameraReady, isCapturing, orientation, capturedImages, currentAzimuth, currentElevation]);

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

  const startCamera = async () => {
    try {
      setError(null);
      setShowCamera(true);
      setShowDoneScreen(false);
      
      await requestOrientationPermission();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let stream: MediaStream | null = null;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
          },
          audio: false
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
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
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
      });
      
      if (!blob || blob.size === 0) {
        setError('Failed to capture image');
        setIsCapturing(false);
        return;
      }
      
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
        // Check if all targets captured
        if (updated.length >= CAPTURE_TARGETS.length) {
          setTimeout(() => setShowDoneScreen(true), 500);
        }
        return updated;
      });
      
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file, index) => {
      const previewUrl = URL.createObjectURL(file);
      const newImage: CapturedImage = {
        id: `upload-${Date.now()}-${index}`,
        file,
        previewUrl,
        azimuth: (index * 45) % 360,
        elevation: 0,
        timestamp: Date.now(),
      };
      setCapturedImages(prev => [...prev, newImage]);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const generateHDRI = async () => {
    if (capturedImages.length < 4) {
      setError('Please capture at least 4 images');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      capturedImages.forEach((img) => {
        formData.append('images', img.file);
        formData.append('directions', `az${img.azimuth}_el${img.elevation}`);
      });
      
      const response = await fetch('/api/admin/hdri/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate HDRI');
      }
      
      const data = await response.json();
      setGeneratedHDRI(data.hdriUrl);
    } catch (err) {
      console.error('HDRI generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate HDRI');
    } finally {
      setIsGenerating(false);
    }
  };

  const getImageForTarget = (target: typeof CAPTURE_TARGETS[0]) => {
    return capturedImages.find(img => {
      const azDiff = Math.abs(img.azimuth - target.azimuth);
      const elDiff = Math.abs(img.elevation - target.elevation);
      return azDiff < CAPTURE_THRESHOLD && elDiff < CAPTURE_THRESHOLD;
    });
  };

  // ==========================================================================
  // SCREEN POSITION CALCULATION
  // ==========================================================================
  // This converts a 3D target position to 2D screen coordinates.
  //
  // Key insight: The CAMERA moves, not the targets. So if the camera (device)
  // turns RIGHT, targets appear to move LEFT on screen.
  //
  // Screen coordinates:
  // - x: negative = left side of screen, positive = right side
  // - y: negative = top of screen, positive = bottom
  // ==========================================================================
  const getTargetScreenPosition = (target: typeof CAPTURE_TARGETS[0]) => {
    const cameraAzimuth = currentAzimuth();
    const cameraElevation = currentElevation();
    
    // Calculate the difference between target position and camera direction
    // This tells us where the target is RELATIVE to where camera is pointing
    let azDiff = target.azimuth - cameraAzimuth;
    
    // Handle wraparound for azimuth
    if (azDiff > 180) azDiff -= 360;
    if (azDiff < -180) azDiff += 360;
    
    // Elevation difference
    const elDiff = target.elevation - cameraElevation;
    
    // Camera field of view in degrees (approximate for mobile camera)
    const hFov = 60;
    const vFov = 80;
    
    // Check if target is within visible area (with margin for edge indicators)
    const margin = 30;
    if (Math.abs(azDiff) > hFov / 2 + margin || Math.abs(elDiff) > vFov / 2 + margin) {
      return null;
    }
    
    // ==========================================================================
    // CRITICAL: Screen coordinate mapping
    // ==========================================================================
    // When target azimuth is GREATER than camera azimuth (azDiff > 0):
    //   - Target is to the RIGHT of where camera points
    //   - BUT camera moved RIGHT to get there, so target appears on LEFT
    //   - Therefore: x = -azDiff (NEGATE!)
    //
    // When target elevation is GREATER than camera elevation (elDiff > 0):
    //   - Target is ABOVE where camera points (ceiling direction)
    //   - BUT camera tilted UP to get there, so target appears at BOTTOM
    //   - In screen coordinates, positive y = down
    //   - Therefore: y = -elDiff (NEGATE!)
    //
    // Wait, let's think again more carefully:
    //   - azDiff = target.azimuth - camera.azimuth
    //   - If target is at azimuth 90 and camera is at azimuth 0:
    //     - azDiff = 90 - 0 = 90 (target is 90° to the RIGHT of camera)
    //     - The target should appear on the RIGHT side of screen
    //     - So x should be POSITIVE for target on right
    //     - Therefore: x = azDiff / (hFov/2) ✓
    //
    //   - If target elevation is 45 and camera elevation is 0:
    //     - elDiff = 45 - 0 = 45 (target is 45° ABOVE horizon)
    //     - The target should appear at the TOP of screen
    //     - Screen y-coordinate: negative = top, positive = bottom
    //     - Therefore: y = -elDiff / (vFov/2) ✓
    // ==========================================================================
    
    // Normalize to -1 to 1 range
    const x = azDiff / (hFov / 2);
    const y = -elDiff / (vFov / 2);  // Negate because screen Y is inverted
    
    const distance = Math.sqrt(azDiff * azDiff + elDiff * elDiff);
    
    return { x, y, distance };
  };

  // ==========================================================================
  // OFF-SCREEN DIRECTION INDICATOR
  // ==========================================================================
  // When a target is not visible on screen, this tells the user which way
  // to move the device to find it.
  //
  // The arrow should point in the direction the USER should MOVE the device:
  // - Arrow pointing RIGHT means "turn the device to the right"
  // - Arrow pointing UP means "tilt the device up"
  // ==========================================================================
  const getOffScreenDirection = (target: typeof CAPTURE_TARGETS[0]) => {
    const cameraAzimuth = currentAzimuth();
    const cameraElevation = currentElevation();
    
    // Calculate where target is relative to camera
    let azDiff = target.azimuth - cameraAzimuth;
    if (azDiff > 180) azDiff -= 360;
    if (azDiff < -180) azDiff += 360;
    const elDiff = target.elevation - cameraElevation;
    
    // Determine primary direction the user should turn/tilt
    if (Math.abs(elDiff) > Math.abs(azDiff)) {
      // Vertical movement is primary
      // elDiff > 0 means target is ABOVE current camera direction
      // User should tilt UP to see it
      return elDiff > 0 ? 'up' : 'down';
    } else {
      // Horizontal movement is primary  
      // azDiff > 0 means target is to the RIGHT of current camera direction
      // User should turn RIGHT to see it
      return azDiff > 0 ? 'right' : 'left';
    }
  };

  // Mobile Camera View - Full 3D Experience
  if (showCamera) {
    const azimuth = currentAzimuth();
    const elevation = currentElevation();
    
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Camera feed - Full screen */}
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
        
        {/* 3D Overlay - Captured images and targets in camera view */}
        {isCameraReady && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Render captured images at their 3D positions */}
            {capturedImages.map(img => {
              const pos = getTargetScreenPosition({ azimuth: img.azimuth, elevation: img.elevation, name: '' });
              if (!pos) return null;
              
              const screenX = 50 + pos.x * 40;
              const screenY = 50 + pos.y * 40;
              const scale = Math.max(0.3, 1 - pos.distance / 100);
              const opacity = Math.max(0.4, 1 - pos.distance / 60);
              
              return (
                <div
                  key={img.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
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
                      className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-lg border-2 border-green-400 shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Render target indicators for uncaptured positions */}
            {CAPTURE_TARGETS.map(target => {
              const hasImage = getImageForTarget(target);
              if (hasImage) return null;
              
              const pos = getTargetScreenPosition(target);
              const isCurrentTarget = nearTarget?.name === target.name;
              
              if (!pos) {
                // Target is off-screen, show direction indicator
                const direction = getOffScreenDirection(target);
                if (!isCurrentTarget) return null;
                
                return (
                  <div
                    key={target.name}
                    className={`absolute ${
                      direction === 'up' ? 'top-16 left-1/2 -translate-x-1/2' :
                      direction === 'down' ? 'bottom-32 left-1/2 -translate-x-1/2' :
                      direction === 'left' ? 'left-4 top-1/2 -translate-y-1/2' :
                      'right-4 top-1/2 -translate-y-1/2'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1 animate-pulse">
                      {direction === 'up' && <ChevronUp className="w-10 h-10 text-yellow-400" />}
                      {direction === 'down' && <ChevronDown className="w-10 h-10 text-yellow-400" />}
                      {direction === 'left' && <ChevronLeft className="w-10 h-10 text-yellow-400" />}
                      {direction === 'right' && <ChevronRight className="w-10 h-10 text-yellow-400" />}
                      <span className="text-yellow-400 text-xs font-bold bg-black/50 px-2 py-0.5 rounded">
                        {target.name}
                      </span>
                    </div>
                  </div>
                );
              }
              
              const screenX = 50 + pos.x * 40;
              const screenY = 50 + pos.y * 40;
              const size = isCurrentTarget ? 80 : 50;
              
              return (
                <div
                  key={target.name}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
                  style={{
                    left: `${screenX}%`,
                    top: `${screenY}%`,
                    zIndex: isCurrentTarget ? 200 : 50,
                  }}
                >
                  {/* Target circle */}
                  <div className="relative flex items-center justify-center">
                    <svg 
                      width={size} 
                      height={size} 
                      viewBox="0 0 100 100" 
                      className="-rotate-90"
                    >
                      {/* Background ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={isCurrentTarget ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)"}
                        strokeWidth={isCurrentTarget ? "4" : "2"}
                      />
                      {/* Progress ring (only for current target) */}
                      {isCurrentTarget && holdProgress > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${holdProgress * 2.83} 283`}
                        />
                      )}
                    </svg>
                    
                    {/* Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative" style={{ width: size * 0.4, height: size * 0.4 }}>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/60" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/60" />
                      </div>
                    </div>
                    
                    {/* Target name */}
                    <div 
                      className="absolute whitespace-nowrap"
                      style={{ top: size / 2 + 8 }}
                    >
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        isCurrentTarget 
                          ? 'bg-yellow-400 text-black' 
                          : 'bg-black/50 text-white/70'
                      }`}>
                        {target.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Center reticle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-6 h-6 relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/50" />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50" />
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
            {/* Compass with direction labels */}
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-2 text-white">
                <div className="relative w-10 h-10">
                  {/* Compass circle */}
                  <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
                  {/* Direction indicator */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: `rotate(${-azimuth}deg)` }}
                  >
                    <div className="w-1 h-4 bg-red-500 rounded-full -translate-y-1" />
                  </div>
                  {/* N marker */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-red-400">N</div>
                </div>
                <div>
                  <div className="font-mono text-lg">{Math.round(azimuth)}°</div>
                  <div className="text-white/60 text-[10px]">
                    {azimuth < 22.5 || azimuth >= 337.5 ? 'Front' :
                     azimuth < 67.5 ? 'Front-R' :
                     azimuth < 112.5 ? 'Right' :
                     azimuth < 157.5 ? 'Back-R' :
                     azimuth < 202.5 ? 'Back' :
                     azimuth < 247.5 ? 'Back-L' :
                     azimuth < 292.5 ? 'Left' : 'Front-L'}
                  </div>
                </div>
              </div>
              <div className="text-white/60 text-xs mt-1 flex items-center gap-2">
                <span>Tilt: {Math.round(elevation)}°</span>
                <span className="text-[10px]">
                  {elevation > 30 ? '↑ UP' : elevation < -30 ? '↓ DOWN' : '→ LEVEL'}
                </span>
              </div>
              {/* Next target hint */}
              {nearTarget && (
                <div className="mt-1 text-yellow-400 text-[10px] font-bold">
                  → {nearTarget.name}
                </div>
              )}
            </div>
            
            {/* Progress counter */}
            <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="text-white font-bold text-center">
                {capturedImages.length}/{CAPTURE_TARGETS.length}
              </div>
              <div className="text-white/60 text-xs">captured</div>
            </div>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="mt-2 p-2 bg-red-500/80 rounded-lg">
              <p className="text-white text-xs">{error}</p>
            </div>
          )}
        </div>
        
        {/* Thumbnail strip at bottom showing all captures */}
        {capturedImages.length > 0 && (
          <div className="absolute bottom-36 left-0 right-0 z-10">
            <div className="flex gap-2 px-4 overflow-x-auto pb-2 scrollbar-hide">
              {capturedImages.map(img => (
                <div 
                  key={img.id} 
                  className="relative flex-shrink-0 group"
                >
                  <img 
                    src={img.previewUrl} 
                    alt="" 
                    className="w-12 h-12 object-cover rounded-lg border-2 border-green-400"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="pointer-events-auto absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8 z-10">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Close button */}
            <button
              onClick={stopCamera}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full pointer-events-auto"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Capture button */}
            <button
              onClick={manualCapture}
              disabled={isCapturing || !isCameraReady}
              className="p-2 bg-white rounded-full border-4 border-white/50 disabled:opacity-50 pointer-events-auto"
            >
              <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            
            {/* Auto-capture toggle */}
            <button
              onClick={() => setAutoCapture(!autoCapture)}
              className={`p-3 rounded-full pointer-events-auto ${autoCapture ? 'bg-green-500' : 'bg-white/20 backdrop-blur-sm'}`}
            >
              {autoCapture ? <Unlock className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-white" />}
            </button>
          </div>
          
          {/* Status text */}
          <div className="flex items-center justify-center gap-4 mt-3 text-white/70 text-xs">
            <button onClick={resetCalibration} className="underline pointer-events-auto">Reset North</button>
            <span>•</span>
            <span>{autoCapture ? 'Auto-capture ON' : 'Manual mode'}</span>
          </div>
        </div>
        
        {/* Done screen overlay */}
        <AnimatePresence>
          {showDoneScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-white text-2xl font-bold mb-2">All Captured!</h2>
              <p className="text-white/70 text-center mb-8">
                You've captured all {CAPTURE_TARGETS.length} positions
              </p>
              
              {/* Preview grid */}
              <div className="grid grid-cols-5 gap-2 mb-8 max-w-sm">
                {capturedImages.slice(0, 10).map(img => (
                  <img 
                    key={img.id}
                    src={img.previewUrl} 
                    alt="" 
                    className="w-full aspect-square object-cover rounded-lg border-2 border-green-400"
                  />
                ))}
              </div>
              
              <div className="flex gap-4 w-full max-w-sm">
                <button
                  onClick={() => setShowDoneScreen(false)}
                  className="flex-1 py-3 bg-white/20 text-white font-bold rounded-xl"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    generateHDRI();
                  }}
                  disabled={isGenerating}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop view
  if (!isMobile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black font-brand">HDRI GENERATION</h1>
            <p className="text-gray-600 mt-1">Capture 360° environment maps</p>
          </div>
          <span className="px-3 py-1 bg-yellow-300 border-2 border-black rounded-full text-sm font-bold">BETA</span>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border-2 border-red-400 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border-3 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-lg mb-4">Capture Images</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-50 border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  <Camera className="w-10 h-10" />
                  <span className="font-bold">Use Webcam</span>
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-50 border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  <Upload className="w-10 h-10" />
                  <span className="font-bold">Upload Images</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
              </div>
            </div>

            {/* Captured images grid */}
            {capturedImages.length > 0 && (
              <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Captured ({capturedImages.length}/{CAPTURE_TARGETS.length})</h3>
                  <button onClick={resetCaptures} className="text-sm text-red-600 font-bold flex items-center gap-1">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {capturedImages.map(img => (
                    <div key={img.id} className="relative aspect-square group">
                      <img src={img.previewUrl} alt="" className="w-full h-full object-cover rounded-lg border-2 border-green-500" />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {capturedImages.length >= 4 && (
              <button
                onClick={generateHDRI}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <><RefreshCw className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate HDRI</>}
              </button>
            )}

            {generatedHDRI && (
              <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" /> HDRI Generated!
                </h3>
                <img src={generatedHDRI} alt="HDRI" className="w-full aspect-[2/1] object-cover rounded-lg border-2 border-black mb-3" />
                <a href={generatedHDRI} download="room-hdri.hdr" className="block w-full py-3 bg-black text-white font-bold rounded-lg text-center">
                  <Download className="w-5 h-5 inline mr-2" /> Download HDRI
                </a>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-bold">Mobile Capture</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">For best results with gyroscope-guided capture, use your phone.</p>
              <QRCodeDisplay url={pageUrl} />
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
              <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> How it works
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Open camera and look around</li>
                <li>• Target circles appear in 3D space</li>
                <li>• Point at target and hold steady</li>
                <li>• Captured images appear in view</li>
                <li>• Minimum 4 images needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile non-camera view
  return (
    <div className="min-h-screen bg-[#FFFCF5] pb-8">
      <div className="sticky top-0 z-40 bg-[#FFFCF5] border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black font-brand">HDRI CAPTURE</h1>
          <span className="px-2 py-0.5 bg-yellow-300 border-2 border-black rounded-full text-xs font-bold">BETA</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">{capturedImages.length} / {CAPTURE_TARGETS.length} images</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border-2 border-red-400 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-red-600" /></button>
          </div>
        )}

        <button
          onClick={startCamera}
          className="w-full py-6 bg-black text-white font-bold rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-2"
        >
          <Camera className="w-12 h-12" />
          <span className="text-lg">Start 360° Capture</span>
          <span className="text-xs opacity-70">Targets appear in camera view</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 bg-white font-bold rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Images</span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />

        {capturedImages.length > 0 && (
          <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Captured Images</h3>
              <button onClick={resetCaptures} className="text-sm text-red-600 font-bold">Reset</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {capturedImages.map(img => (
                <div key={img.id} className="relative aspect-square">
                  <img src={img.previewUrl} alt="" className="w-full h-full object-cover rounded-lg border-2 border-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {capturedImages.length >= 4 && (
          <button
            onClick={generateHDRI}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <><RefreshCw className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate HDRI</>}
          </button>
        )}

        {generatedHDRI && (
          <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" /> HDRI Generated!
            </h3>
            <img src={generatedHDRI} alt="HDRI" className="w-full aspect-[2/1] object-cover rounded-lg border-2 border-black mb-3" />
            <a href={generatedHDRI} download="room-hdri.hdr" className="block w-full py-3 bg-black text-white font-bold rounded-lg text-center">
              <Download className="w-5 h-5 inline mr-2" /> Download
            </a>
          </div>
        )}

        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <h3 className="font-bold text-yellow-800 mb-2">How to capture</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>1. Tap "Start 360° Capture"</li>
            <li>2. Target circles appear in camera view</li>
            <li>3. Point your device at each target</li>
            <li>4. Hold steady - captures automatically</li>
            <li>5. Captured images appear in 3D space</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
