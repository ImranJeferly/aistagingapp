'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RotateCcw, Check, X, Download, Smartphone, Sparkles, Eye, AlertCircle, RefreshCw, Play, Pause, Lock, Unlock } from 'lucide-react';
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
  azimuth: number; // Horizontal angle (0-360)
  elevation: number; // Vertical angle (-90 to 90)
  timestamp: number;
}

interface DeviceOrientation {
  alpha: number; // Z-axis rotation (0-360)
  beta: number;  // X-axis rotation (-180 to 180)
  gamma: number; // Y-axis rotation (-90 to 90)
}

// Target positions for HDRI capture (azimuth, elevation)
const CAPTURE_TARGETS = [
  // Horizontal ring (eye level)
  { azimuth: 0, elevation: 0, name: 'Front' },
  { azimuth: 45, elevation: 0, name: 'Front-Right' },
  { azimuth: 90, elevation: 0, name: 'Right' },
  { azimuth: 135, elevation: 0, name: 'Back-Right' },
  { azimuth: 180, elevation: 0, name: 'Back' },
  { azimuth: 225, elevation: 0, name: 'Back-Left' },
  { azimuth: 270, elevation: 0, name: 'Left' },
  { azimuth: 315, elevation: 0, name: 'Front-Left' },
  // Up/Down
  { azimuth: 0, elevation: 75, name: 'Ceiling' },
  { azimuth: 0, elevation: -75, name: 'Floor' },
];

const CAPTURE_THRESHOLD = 15; // Degrees threshold for auto-capture
const CAPTURE_HOLD_TIME = 500; // ms to hold position before capture

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
  
  // Device orientation
  const [orientation, setOrientation] = useState<DeviceOrientation>({ alpha: 0, beta: 0, gamma: 0 });
  const [hasOrientationPermission, setHasOrientationPermission] = useState(false);
  const [initialAlpha, setInitialAlpha] = useState<number | null>(null);
  const [autoCapture, setAutoCapture] = useState(true);
  const [nearTarget, setNearTarget] = useState<typeof CAPTURE_TARGETS[0] | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number | null>(null);
  
  // Calculate current azimuth and elevation from device orientation
  const currentAzimuth = useCallback(() => {
    let azimuth = orientation.alpha;
    if (initialAlpha !== null) {
      azimuth = (orientation.alpha - initialAlpha + 360) % 360;
    }
    return azimuth;
  }, [orientation.alpha, initialAlpha]);
  
  const currentElevation = useCallback(() => {
    // Beta is the front-to-back tilt (-180 to 180)
    // When phone is vertical (portrait), beta is ~90
    // We want elevation 0 when phone is vertical
    let elevation = -(orientation.beta - 90);
    elevation = Math.max(-90, Math.min(90, elevation));
    return elevation;
  }, [orientation.beta]);

  // Detect mobile device
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

  // Request device orientation permission (iOS requires explicit permission)
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
      // Non-iOS devices don't need permission
      setHasOrientationPermission(true);
      return true;
    }
    return false;
  };

  // Device orientation handler
  useEffect(() => {
    if (!showCamera || !hasOrientationPermission) return;
    
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        setOrientation({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        });
        
        // Set initial alpha on first reading
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
    
    // Find nearest uncaptured target
    let nearest: typeof CAPTURE_TARGETS[0] | null = null;
    let minDistance = Infinity;
    
    for (const target of CAPTURE_TARGETS) {
      // Check if already captured
      const alreadyCaptured = capturedImages.some(img => {
        const azDiff = Math.abs(img.azimuth - target.azimuth);
        const elDiff = Math.abs(img.elevation - target.elevation);
        return azDiff < CAPTURE_THRESHOLD && elDiff < CAPTURE_THRESHOLD;
      });
      
      if (alreadyCaptured) continue;
      
      // Calculate distance
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
    
    // Check if we're close enough to capture
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

  // Start camera
  const startCamera = async () => {
    try {
      setError(null);
      setShowCamera(true);
      
      // Request orientation permission first
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

  // Stop camera
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

  // Capture image
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
      
      setCapturedImages(prev => [...prev, newImage]);
      
      // Play capture sound/haptic feedback
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

  // Manual capture
  const manualCapture = () => {
    const azimuth = currentAzimuth();
    const elevation = currentElevation();
    const nearest = nearTarget || { name: `pos-${capturedImages.length}` };
    captureImage(azimuth, elevation, nearest.name);
  };

  // Reset calibration
  const resetCalibration = () => {
    setInitialAlpha(orientation.alpha);
  };

  // Handle file upload
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

  // Remove image
  const removeImage = (id: string) => {
    setCapturedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  // Reset all
  const resetCaptures = () => {
    capturedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setCapturedImages([]);
    setGeneratedHDRI(null);
    setError(null);
  };

  // Generate HDRI
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

  // Get captured image for target
  const getImageForTarget = (target: typeof CAPTURE_TARGETS[0]) => {
    return capturedImages.find(img => {
      const azDiff = Math.abs(img.azimuth - target.azimuth);
      const elDiff = Math.abs(img.elevation - target.elevation);
      return azDiff < CAPTURE_THRESHOLD && elDiff < CAPTURE_THRESHOLD;
    });
  };

  // 360 Preview Component
  const PanoramaPreview = () => {
    const azimuth = currentAzimuth();
    const elevation = currentElevation();
    
    return (
      <div className="relative w-full h-32 bg-gray-900 rounded-xl overflow-hidden border-2 border-black">
        {/* 360 strip showing captured images */}
        <div 
          className="absolute inset-0 flex transition-transform duration-100"
          style={{ 
            transform: `translateX(${-azimuth / 360 * 100 + 50}%)`,
            width: '200%'
          }}
        >
          {/* Render captured images at their positions */}
          {capturedImages.filter(img => Math.abs(img.elevation) < 45).map(img => (
            <div
              key={img.id}
              className="absolute h-full"
              style={{
                left: `${(img.azimuth / 360) * 100}%`,
                width: '15%',
                transform: 'translateX(-50%)'
              }}
            >
              <img 
                src={img.previewUrl} 
                alt="" 
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          ))}
          
          {/* Target indicators */}
          {CAPTURE_TARGETS.filter(t => Math.abs(t.elevation) < 45).map(target => {
            const hasImage = getImageForTarget(target);
            return (
              <div
                key={target.name}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${(target.azimuth / 360) * 100}%` }}
              >
                <div className={`w-3 h-3 rounded-full border-2 ${
                  hasImage ? 'bg-green-500 border-green-300' : 'bg-transparent border-white/50'
                }`} />
              </div>
            );
          })}
        </div>
        
        {/* Center indicator (current view) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-yellow-400 -translate-x-1/2" />
        <div className="absolute left-1/2 top-1 -translate-x-1/2 px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-bold rounded">
          {Math.round(azimuth)}°
        </div>
        
        {/* Elevation indicator */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="text-[10px] text-white/70">↑</div>
          <div className="w-1 h-12 bg-white/20 rounded relative">
            <div 
              className="absolute w-3 h-1 bg-yellow-400 rounded -left-1"
              style={{ top: `${50 - elevation / 90 * 50}%` }}
            />
          </div>
          <div className="text-[10px] text-white/70">↓</div>
        </div>
      </div>
    );
  };

  // Capture Reticle Component
  const CaptureReticle = () => {
    const isNearTarget = nearTarget && holdProgress > 0;
    
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Outer ring */}
        <div className="relative">
          {/* Progress ring */}
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isNearTarget ? "#22c55e" : "#facc15"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${holdProgress * 2.83} 283`}
              className="transition-all duration-100"
            />
          </svg>
          
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-8 h-8">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/70" />
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/70" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${isNearTarget ? 'bg-green-400' : 'bg-white/50'}`} />
              </div>
            </div>
          </div>
          
          {/* Target name */}
          {nearTarget && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="px-2 py-1 bg-black/70 text-white text-xs font-bold rounded">
                {nearTarget.name}
              </span>
            </div>
          )}
        </div>
        
        {/* Direction arrow to nearest target */}
        {nearTarget && !isNearTarget && (
          <DirectionArrow target={nearTarget} />
        )}
      </div>
    );
  };

  // Direction arrow pointing to target
  const DirectionArrow = ({ target }: { target: typeof CAPTURE_TARGETS[0] }) => {
    const azimuth = currentAzimuth();
    const elevation = currentElevation();
    
    let azDiff = target.azimuth - azimuth;
    if (azDiff > 180) azDiff -= 360;
    if (azDiff < -180) azDiff += 360;
    const elDiff = target.elevation - elevation;
    
    const angle = Math.atan2(elDiff, azDiff) * (180 / Math.PI);
    
    return (
      <div 
        className="absolute w-full h-full flex items-center justify-center"
        style={{ transform: `rotate(${-angle}deg)` }}
      >
        <div className="absolute right-8 w-6 h-6 border-t-4 border-r-4 border-yellow-400 rotate-45" />
      </div>
    );
  };

  // Target Grid showing what's captured
  const TargetGrid = () => (
    <div className="grid grid-cols-5 gap-1">
      {CAPTURE_TARGETS.map(target => {
        const image = getImageForTarget(target);
        const isNear = nearTarget?.name === target.name;
        
        return (
          <div
            key={target.name}
            className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
              image ? 'border-green-500' : isNear ? 'border-yellow-400' : 'border-gray-300'
            }`}
          >
            {image ? (
              <img src={image.previewUrl} alt={target.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-[8px] text-gray-400 font-bold">{target.name.slice(0, 3).toUpperCase()}</span>
              </div>
            )}
            {image && (
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-2 h-2 text-white" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  // Mobile Camera View
  if (isMobile && showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Camera feed */}
        <div className="flex-1 relative">
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
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4" />
              <p className="text-sm">Initializing camera...</p>
            </div>
          )}
          
          {/* Capture reticle */}
          {isCameraReady && <CaptureReticle />}
          
          {/* Capturing flash effect */}
          <AnimatePresence>
            {isCapturing && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-white"
              />
            )}
          </AnimatePresence>
        </div>
        
        {/* Bottom panel */}
        <div className="bg-gray-900 p-4 space-y-3 safe-area-bottom">
          {/* Panorama preview */}
          <PanoramaPreview />
          
          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            {/* Close button */}
            <button
              onClick={stopCamera}
              className="p-3 bg-red-500 rounded-full"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Capture button */}
            <button
              onClick={manualCapture}
              disabled={isCapturing || !isCameraReady}
              className="p-5 bg-white rounded-full border-4 border-gray-400 disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-red-500 rounded-full" />
            </button>
            
            {/* Auto-capture toggle */}
            <button
              onClick={() => setAutoCapture(!autoCapture)}
              className={`p-3 rounded-full ${autoCapture ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              {autoCapture ? <Unlock className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-white" />}
            </button>
          </div>
          
          {/* Info bar */}
          <div className="flex items-center justify-between text-white text-xs">
            <span>{capturedImages.length} / {CAPTURE_TARGETS.length} captured</span>
            <button onClick={resetCalibration} className="underline">Reset North</button>
            <span className={autoCapture ? 'text-green-400' : 'text-gray-400'}>
              {autoCapture ? 'Auto-capture ON' : 'Manual mode'}
            </span>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="p-2 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
        </div>
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
          {/* Main area */}
          <div className="lg:col-span-2 space-y-4">
            {showCamera ? (
              <div className="bg-black rounded-xl overflow-hidden border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="relative aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {!isCameraReady && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent" />
                    </div>
                  )}
                  
                  {isCameraReady && <CaptureReticle />}
                </div>
                
                <div className="p-4 bg-gray-900 space-y-4">
                  <PanoramaPreview />
                  
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={stopCamera} className="px-4 py-2 bg-gray-700 text-white rounded-lg font-bold">
                      Close Camera
                    </button>
                    <button
                      onClick={manualCapture}
                      disabled={isCapturing || !isCameraReady}
                      className="px-6 py-3 bg-red-500 text-white rounded-full font-bold disabled:opacity-50"
                    >
                      Capture
                    </button>
                    <button
                      onClick={() => setAutoCapture(!autoCapture)}
                      className={`px-4 py-2 rounded-lg font-bold ${autoCapture ? 'bg-green-500 text-white' : 'bg-gray-700 text-white'}`}
                    >
                      {autoCapture ? 'Auto ON' : 'Auto OFF'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
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

                {/* Captured images */}
                <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Targets ({capturedImages.length}/{CAPTURE_TARGETS.length})</h3>
                    {capturedImages.length > 0 && (
                      <button onClick={resetCaptures} className="text-sm text-red-600 font-bold flex items-center gap-1">
                        <RotateCcw className="w-4 h-4" /> Reset
                      </button>
                    )}
                  </div>
                  <TargetGrid />
                </div>

                {/* Generate button */}
                {capturedImages.length >= 4 && (
                  <button
                    onClick={generateHDRI}
                    disabled={isGenerating}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <><RefreshCw className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate HDRI</>}
                  </button>
                )}

                {/* Generated HDRI */}
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
              </>
            )}
          </div>

          {/* Sidebar */}
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
                <li>• Point your device at each target</li>
                <li>• Hold steady - auto-captures when aligned</li>
                <li>• Yellow ring shows progress</li>
                <li>• Green = captured</li>
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

        {/* Start capture button */}
        <button
          onClick={startCamera}
          className="w-full py-6 bg-black text-white font-bold rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-2"
        >
          <Camera className="w-12 h-12" />
          <span className="text-lg">Start 360° Capture</span>
          <span className="text-xs opacity-70">Uses gyroscope for guided capture</span>
        </button>

        {/* Upload option */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 bg-white font-bold rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Images</span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />

        {/* Target grid */}
        <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Capture Progress</h3>
            {capturedImages.length > 0 && (
              <button onClick={resetCaptures} className="text-sm text-red-600 font-bold">Reset</button>
            )}
          </div>
          <TargetGrid />
        </div>

        {/* Generate button */}
        {capturedImages.length >= 4 && (
          <button
            onClick={generateHDRI}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <><RefreshCw className="w-5 h-5 animate-spin" /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate HDRI</>}
          </button>
        )}

        {/* Generated HDRI */}
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

        {/* Instructions */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <h3 className="font-bold text-yellow-800 mb-2">How to capture</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>1. Tap "Start 360° Capture"</li>
            <li>2. Point device at targets (shown in circle)</li>
            <li>3. Hold steady - auto-captures when aligned</li>
            <li>4. Rotate to capture all angles</li>
            <li>5. Generate your HDRI!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
