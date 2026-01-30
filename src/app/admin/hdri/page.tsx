'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RotateCcw, Check, X, Trash2, Image as ImageIcon, Download, Smartphone, QrCode, ChevronLeft, ChevronRight, Sparkles, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// QR Code component that generates QR codes
const QRCodeDisplay = ({ url }: { url: string }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Generate QR code using a simple canvas-based approach
    generateQRCode(url).then(setQrDataUrl);
  }, [url]);
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-6 rounded-xl border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 text-center max-w-xs">
        Scan this QR code with your phone to open the HDRI capture page
      </p>
    </div>
  );
};

// Simple QR Code generator function using canvas
async function generateQRCode(text: string): Promise<string> {
  // Using a simple QR code generation approach
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  // For now, we'll use an external API to generate QR codes
  // In production, you might want to use a library like 'qrcode'
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=10`;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      // Fallback: draw a placeholder
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#333';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', size/2, size/2);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = qrApiUrl;
  });
}

interface CapturedImage {
  id: string;
  file: File;
  previewUrl: string;
  direction: string;
  timestamp: number;
}

const CAPTURE_DIRECTIONS = [
  { id: 'front', name: 'Front', angle: 0, description: 'Face the main wall' },
  { id: 'front-right', name: 'Front-Right', angle: 45, description: 'Turn 45° right' },
  { id: 'right', name: 'Right', angle: 90, description: 'Turn 90° right' },
  { id: 'back-right', name: 'Back-Right', angle: 135, description: 'Turn 135° right' },
  { id: 'back', name: 'Back', angle: 180, description: 'Face the opposite wall' },
  { id: 'back-left', name: 'Back-Left', angle: 225, description: 'Turn 225° right' },
  { id: 'left', name: 'Left', angle: 270, description: 'Turn 270° right' },
  { id: 'front-left', name: 'Front-Left', angle: 315, description: 'Turn 315° right' },
  { id: 'ceiling', name: 'Ceiling', angle: -1, description: 'Point camera up' },
  { id: 'floor', name: 'Floor', angle: -2, description: 'Point camera down' },
];

export default function HDRIGenerationPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [currentDirectionIndex, setCurrentDirectionIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHDRI, setGeneratedHDRI] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'equirectangular' | '3d'>('equirectangular');
  const [error, setError] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    
    // Set the page URL for QR code
    setPageUrl(window.location.href);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Start camera
  const startCamera = async () => {
    try {
      setError(null);
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have granted camera permissions.');
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };
  
  // Capture image from camera
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
    });
    
    const direction = CAPTURE_DIRECTIONS[currentDirectionIndex];
    const file = new File([blob], `hdri-${direction.id}-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const previewUrl = URL.createObjectURL(blob);
    
    const newImage: CapturedImage = {
      id: `${direction.id}-${Date.now()}`,
      file,
      previewUrl,
      direction: direction.id,
      timestamp: Date.now(),
    };
    
    setCapturedImages(prev => {
      // Replace if same direction exists
      const filtered = prev.filter(img => img.direction !== direction.id);
      return [...filtered, newImage];
    });
    
    // Move to next direction
    if (currentDirectionIndex < CAPTURE_DIRECTIONS.length - 1) {
      setCurrentDirectionIndex(currentDirectionIndex + 1);
    }
    
    setIsCapturing(false);
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const direction = CAPTURE_DIRECTIONS[currentDirectionIndex];
    
    Array.from(files).forEach((file, index) => {
      const previewUrl = URL.createObjectURL(file);
      const dirIndex = Math.min(currentDirectionIndex + index, CAPTURE_DIRECTIONS.length - 1);
      const dir = CAPTURE_DIRECTIONS[dirIndex];
      
      const newImage: CapturedImage = {
        id: `${dir.id}-${Date.now()}-${index}`,
        file,
        previewUrl,
        direction: dir.id,
        timestamp: Date.now(),
      };
      
      setCapturedImages(prev => {
        const filtered = prev.filter(img => img.direction !== dir.id);
        return [...filtered, newImage];
      });
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove captured image
  const removeImage = (id: string) => {
    setCapturedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };
  
  // Reset all captures
  const resetCaptures = () => {
    capturedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setCapturedImages([]);
    setCurrentDirectionIndex(0);
    setGeneratedHDRI(null);
    setError(null);
  };
  
  // Generate HDRI
  const generateHDRI = async () => {
    if (capturedImages.length < 4) {
      setError('Please capture at least 4 images (front, right, back, left) to generate an HDRI.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      capturedImages.forEach((img) => {
        formData.append('images', img.file);
        formData.append('directions', img.direction);
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
  
  // Get image for direction
  const getImageForDirection = (directionId: string) => {
    return capturedImages.find(img => img.direction === directionId);
  };
  
  // Current direction
  const currentDirection = CAPTURE_DIRECTIONS[currentDirectionIndex];
  
  // Desktop view - show QR code
  if (!isMobile) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black font-brand">HDRI GENERATION</h1>
            <p className="text-gray-600 mt-2">Generate HDRI environment maps from room photos</p>
          </div>
          <span className="px-3 py-1 bg-yellow-300 border-2 border-black rounded-full text-sm font-bold">
            BETA
          </span>
        </div>
        
        <div className="bg-white border-3 border-black rounded-xl p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-4 text-lg font-bold">
              <Smartphone className="w-8 h-8" />
              <span>Open on Mobile Device</span>
            </div>
            
            <p className="text-gray-600 text-center max-w-md">
              HDRI capture works best on mobile devices. Scan the QR code below with your phone 
              to access the camera capture interface.
            </p>
            
            <QRCodeDisplay url={pageUrl} />
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="h-px bg-gray-300 w-16" />
              <span>or copy link</span>
              <div className="h-px bg-gray-300 w-16" />
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3 border-2 border-gray-200">
              <code className="text-sm text-gray-700 truncate max-w-xs">{pageUrl}</code>
              <button
                onClick={() => navigator.clipboard.writeText(pageUrl)}
                className="px-3 py-1 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                Copy
              </button>
            </div>
            
            <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-bold mb-1">Tips for best results:</p>
                  <ul className="list-disc ml-4 space-y-1">
                    <li>Stand in the center of the room</li>
                    <li>Keep the camera at eye level</li>
                    <li>Overlap photos by 20-30%</li>
                    <li>Use consistent lighting</li>
                    <li>Avoid moving objects</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Mobile view - camera capture interface
  return (
    <div className="min-h-screen bg-[#FFFCF5] pb-8">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-[#FFFCF5] border-b-2 border-black px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black font-brand">HDRI CAPTURE</h1>
          <span className="px-2 py-0.5 bg-yellow-300 border-2 border-black rounded-full text-xs font-bold">
            BETA
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {capturedImages.length} / {CAPTURE_DIRECTIONS.length} images captured
        </p>
      </div>
      
      {/* Progress indicator */}
      <div className="px-4 py-3">
        <div className="flex gap-1">
          {CAPTURE_DIRECTIONS.map((dir, index) => {
            const hasImage = getImageForDirection(dir.id);
            const isCurrent = index === currentDirectionIndex;
            return (
              <button
                key={dir.id}
                onClick={() => setCurrentDirectionIndex(index)}
                className={`flex-1 h-2 rounded-full transition-all ${
                  hasImage
                    ? 'bg-green-500'
                    : isCurrent
                    ? 'bg-yellow-400'
                    : 'bg-gray-200'
                }`}
                title={dir.name}
              />
            );
          })}
        </div>
      </div>
      
      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mb-4 p-3 bg-red-100 border-2 border-red-400 rounded-xl"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Camera view */}
      {showCamera ? (
        <div className="px-4 space-y-4">
          {/* Direction indicator */}
          <div className="bg-black text-white p-4 rounded-xl text-center">
            <p className="text-lg font-bold">{currentDirection.name}</p>
            <p className="text-sm text-gray-300">{currentDirection.description}</p>
            {currentDirection.angle >= 0 && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <div 
                  className="w-8 h-8 border-2 border-white rounded-full relative"
                  style={{
                    background: `conic-gradient(from ${currentDirection.angle - 22.5}deg, rgba(255,255,255,0.3) 0deg 45deg, transparent 45deg)`
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-white" />
                </div>
                <span className="text-xs">{currentDirection.angle}°</span>
              </div>
            )}
          </div>
          
          {/* Video preview */}
          <div className="relative rounded-xl overflow-hidden border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] object-cover bg-black"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>
            
            {/* Center crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/50" />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/50" />
              </div>
            </div>
          </div>
          
          {/* Camera controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={stopCamera}
              className="p-4 bg-gray-200 border-2 border-black rounded-full hover:bg-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <button
              onClick={captureImage}
              disabled={isCapturing}
              className="p-6 bg-white border-4 border-black rounded-full hover:bg-gray-50 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50"
            >
              {isCapturing ? (
                <div className="w-8 h-8 rounded-full border-4 border-black border-t-transparent animate-spin" />
              ) : (
                <div className="w-8 h-8 bg-red-500 rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => {
                if (currentDirectionIndex < CAPTURE_DIRECTIONS.length - 1) {
                  setCurrentDirectionIndex(currentDirectionIndex + 1);
                }
              }}
              disabled={currentDirectionIndex >= CAPTURE_DIRECTIONS.length - 1}
              className="p-4 bg-gray-200 border-2 border-black rounded-full hover:bg-gray-300 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentDirectionIndex(Math.max(0, currentDirectionIndex - 1))}
              disabled={currentDirectionIndex === 0}
              className="px-4 py-2 bg-white border-2 border-black rounded-lg font-bold disabled:opacity-30 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm font-bold">
              {currentDirectionIndex + 1} / {CAPTURE_DIRECTIONS.length}
            </span>
            <button
              onClick={() => setCurrentDirectionIndex(Math.min(CAPTURE_DIRECTIONS.length - 1, currentDirectionIndex + 1))}
              disabled={currentDirectionIndex >= CAPTURE_DIRECTIONS.length - 1}
              className="px-4 py-2 bg-white border-2 border-black rounded-lg font-bold disabled:opacity-30 flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* Capture buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={startCamera}
              className="flex flex-col items-center gap-2 p-6 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              <Camera className="w-10 h-10" />
              <span className="font-bold">Open Camera</span>
              <span className="text-xs text-gray-500">Take photos</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              <Upload className="w-10 h-10" />
              <span className="font-bold">Upload Images</span>
              <span className="text-xs text-gray-500">From gallery</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          {/* Direction selection */}
          <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold mb-3">Required Angles ({capturedImages.length}/{CAPTURE_DIRECTIONS.length})</h3>
            <div className="grid grid-cols-5 gap-2">
              {CAPTURE_DIRECTIONS.map((dir, index) => {
                const image = getImageForDirection(dir.id);
                const isCurrent = index === currentDirectionIndex;
                return (
                  <button
                    key={dir.id}
                    onClick={() => setCurrentDirectionIndex(index)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                      isCurrent ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-300'
                    } ${image ? 'border-green-500' : ''}`}
                  >
                    {image ? (
                      <img src={image.previewUrl} alt={dir.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-gray-400">{dir.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    {image && (
                      <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Captured images grid */}
          {capturedImages.length > 0 && (
            <div className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Captured Images</h3>
                <button
                  onClick={resetCaptures}
                  className="text-sm text-red-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset All
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {capturedImages.map((img) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border-2 border-black">
                    <img src={img.previewUrl} alt={img.direction} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] text-center py-0.5">
                      {CAPTURE_DIRECTIONS.find(d => d.id === img.direction)?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Generate button */}
          {capturedImages.length >= 4 && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={generateHDRI}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating HDRI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate HDRI
                </>
              )}
            </motion.button>
          )}
          
          {/* Generated HDRI preview */}
          {generatedHDRI && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-3 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                HDRI Generated!
              </h3>
              
              <div className="rounded-lg overflow-hidden border-2 border-black mb-4">
                <img 
                  src={generatedHDRI} 
                  alt="Generated HDRI" 
                  className="w-full aspect-[2/1] object-cover"
                />
              </div>
              
              <div className="flex gap-2">
                <a
                  href={generatedHDRI}
                  download="room-hdri.hdr"
                  className="flex-1 py-3 bg-black text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </a>
                <button
                  onClick={() => setPreviewMode(previewMode === 'equirectangular' ? '3d' : 'equirectangular')}
                  className="px-4 py-3 bg-gray-100 border-2 border-black rounded-lg font-bold flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Preview
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Tips */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
            <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Tips for best results
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Stand in the center of the room</li>
              <li>• Keep the camera at eye level</li>
              <li>• Overlap photos by 20-30%</li>
              <li>• Use consistent lighting</li>
              <li>• Minimum 4 photos required (front, right, back, left)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
