"use client";

import { useAuth } from '../../contexts/AuthContext';
import AuthGuard from '../../components/AuthGuard';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useUploadLimit } from '../../hooks/useUploadLimit';
import { addCompletedUploadRecord, canUserUpload, getAllUserUploads, type UploadRecord } from '../../services/uploadService';
import { uploadFileToStorage } from '../../services/storageService';
import { Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Point in polygon helper
function isPointInPolygon(point: {x: number, y: number}, vs: {x: number, y: number}[]) {
    var x = point.x, y = point.y;
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

// Optimized cursors using Base64 to ensure correct rendering without lag
const PEN_CURSOR = `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNyAzYTIuODI4IDIuODI4IDAgMSAxIDQgNEw3LjUgMjAuNSAyIDIybDEuNS01LjVMMTcgM3oiPjwvcGF0aD48L3N2Zz4=") 0 24, auto`;
const PLUS_CURSOR = `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJzaGFkb3ciPjxmZURyb3BTaGFkb3cgZHg9IjAiIGR5PSIxIiBzdGREZXZpYXRpb249IjEiIGZsb29kLW9wYWNpdHk9IjAuNSIvPjwvZmlsdGVyPjxnIGZpbHRlcj0idXJsKCNzaGFkb3cpIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtZGFzaGFycmF5PSI0IDMiIGZpbGw9InJnYmEoMCwwLDAsMC4xNSkiLz48cGF0aCBkPSJNMTYgOFYyNE04IDE2SDI0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvZz48L3N2Zz4=") 16 16, crosshair`;

function UploadPageContent() {
  const { user } = useAuth();
  const { isLimitReached, refreshLimit, remainingUploads, usedUploads, totalUploads, userTier } = useUploadLimit();
  const searchParams = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [stagedImageUrl, setStagedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  
  const MARKER_COLORS = [
    '#FACC15', // Yellow
    '#A3E635', // Green
    '#F97316', // Orange
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#10B981', // Emerald
    '#F43F5E', // Rose
    '#06B6D4', // Cyan
  ];

  const [markerPositions, setMarkerPositions] = useState<{id: string, x: number, y: number, color: string, instruction?: string, referenceImage?: File | null, radiusPoints?: {x: number, y: number}[]}[]>([]);
  // Removed mousePosition state to prevent lag
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isHoveringMarker, setIsHoveringMarker] = useState(false);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [drawingMarkerId, setDrawingMarkerId] = useState<string | null>(null);
  const [isDrawingRadius, setIsDrawingRadius] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showFileSizeWarning, setShowFileSizeWarning] = useState(false);
  const [showRadiusError, setShowRadiusError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const justFinishedDrawing = useRef(false);

  // Drag handler
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(id);
    setHoveredMarkerId(null);
    setIsHoveringMarker(true);

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault(); // Prevent selection
      const x = ((moveEvent.clientX - containerRect.left) / containerRect.width) * 100;
      const y = ((moveEvent.clientY - containerRect.top) / containerRect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      setMarkerPositions(prev => prev.map(m =>
        m.id === id ? { ...m, x: clampedX, y: clampedY } : m
      ));
    };

    const handleMouseUp = () => {
      setDraggingId(null);
      setIsHoveringMarker(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Helper to update specific marker details
  const updateMarker = (id: string, updates: Partial<typeof markerPositions[0]>) => {
    setMarkerPositions(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  // Check for payment success
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setShowPaymentSuccess(false), 5000);
      // Refresh the user's limits after successful payment
      refreshLimit();
    }
  }, [searchParams, refreshLimit]);

  // Style options
  const styleOptions = [
    { value: 'modern', label: 'Modern', description: 'Clean lines, minimalist furniture' },
    { value: 'contemporary', label: 'Contemporary', description: 'Current trends, stylish accents' },
    { value: 'traditional', label: 'Traditional', description: 'Classic, timeless furniture' },
    { value: 'scandinavian', label: 'Scandinavian', description: 'Light colors, natural materials' },
    { value: 'industrial', label: 'Industrial', description: 'Raw materials, urban aesthetic' },
    { value: 'bohemian', label: 'Bohemian', description: 'Eclectic, colorful, artistic' },
  ];

  // Room type options
  const roomTypeOptions = [
    { value: 'living-room', label: 'Living Room' },
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'dining-room', label: 'Dining Room' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'office', label: 'Home Office' },
    { value: 'nursery', label: 'Nursery' },
    { value: 'basement', label: 'Basement' },
  ];
  // Check if form is valid (mandatory fields selected)
  const isFormValid = selectedStyle && selectedRoomType;

  // Load upload history
  useEffect(() => {
    const loadUploadHistory = async () => {
      if (!user) return;
      
      setIsLoadingHistory(true);
      try {
        const history = await getAllUserUploads(user.uid);
        setUploadHistory(history);
      } catch (error) {
        console.error('Failed to load upload history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadUploadHistory();
  }, [user]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (warn if over 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        console.warn(`Large file detected: ${file.size} bytes. Will be compressed before upload.`);
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  // Function to compress image before upload
  const compressImage = async (file: File, maxWidth = 1024, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        // Only compress if image is larger than maxWidth or file size is over 1MB
        const shouldCompress = width > maxWidth || file.size > 1024 * 1024;
        
        if (shouldCompress) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                resolve(compressedFile);
              } else {
                console.warn('Compression failed, using original file');
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          console.log('Image does not need compression');
          resolve(file);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image for compression');
        resolve(file); // Fallback to original file
      };
      
      img.src = URL.createObjectURL(file);
    });
  };
    const generateCompositeImage = async (): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            if (previewUrl && markerPositions.length > 0) {
                console.log("Generating composite input for AI...");
                const imgMeasure = new Image();
                imgMeasure.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Use a reasonable max width for AI to prevent huge payloads
                    const MAX_WIDTH = 2048; 
                    let w = imgMeasure.width;
                    let h = imgMeasure.height;
                    
                    if (w > MAX_WIDTH) {
                        h = (h / w) * MAX_WIDTH;
                        w = MAX_WIDTH;
                    }
                    
                    canvas.width = w;
                    canvas.height = h;
                    
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        // Draw Background Image
                        ctx.drawImage(imgMeasure, 0, 0, w, h);

                        // Draw Markers & Radius on top
                        markerPositions.forEach(marker => {
                            if (marker.radiusPoints && marker.radiusPoints.length > 0) {
                                ctx.beginPath();
                                const startX = (marker.radiusPoints[0].x / 100) * w;
                                const startY = (marker.radiusPoints[0].y / 100) * h;
                                ctx.moveTo(startX, startY);
                                for (let i = 1; i < marker.radiusPoints.length; i++) {
                                    const px = (marker.radiusPoints[i].x / 100) * w;
                                    const py = (marker.radiusPoints[i].y / 100) * h;
                                    ctx.lineTo(px, py);
                                }
                                ctx.closePath();
                                ctx.strokeStyle = marker.color;
                                ctx.lineWidth = 6 * (w / 1024); // Scale line width relative to resolution
                                ctx.setLineDash([]);
                                ctx.stroke();
                            }

                            const cx = (marker.x / 100) * w;
                            const cy = (marker.y / 100) * h;
                            const r = 20 * (w / 1024); // Scale radius

                            ctx.beginPath();
                            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
                            ctx.fillStyle = marker.color;
                            ctx.fill();
                            
                            ctx.strokeStyle = 'black';
                            ctx.lineWidth = 4 * (w / 1024);
                            ctx.lineCap = 'round';
                            ctx.beginPath();
                            const s = 8 * (w / 1024);
                            ctx.moveTo(cx - s, cy);
                            ctx.lineTo(cx + s, cy);
                            ctx.moveTo(cx, cy - s);
                            ctx.lineTo(cx, cy + s);
                            ctx.stroke();
                        });

                        canvas.toBlob((blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error("Failed to create blob"));
                        }, 'image/jpeg', 0.85);
                    } else {
                        reject(new Error("Failed to get canvas context"));
                    }
                };
                imgMeasure.onerror = () => reject(new Error("Failed to load background image"));
                imgMeasure.src = previewUrl;
            } else if (selectedFile) {
                // If no markers, just use original file (compressed)
                 // We will handle this fallback in handleUpload or just resolve with original file logic
                 // For now, reject to fallback
                 reject(new Error("No markers to draw"));
            } else {
                 reject(new Error("No image data"));
            }
        });
    };

    const handleUpload = async () => {
    console.log("Handle upload triggered");
    
    if (!selectedFile) {
        console.log("No file selected");
        return;
    }
    if (!user) {
        console.log("No user logged in");
        return;
    }
    if (!isFormValid) {
        console.log("Form invalid");
        return;
    }
    
    // Check if user can upload
    const canUpload = await canUserUpload(user.uid);
    if (!canUpload) {
      const tier = userTier || 'free';
      if (tier === 'free') {
        setError('You have reached your limit of 5 total staged images. Upgrade to a paid plan for monthly limits.');
      } else {
        setError('You have reached your monthly limit. Your limit resets on the 1st of next month.');
      }
      return;
    }
    
    setError(null);
    setIsUploading(true);
    console.log("Starting upload process...");

    try {
      // Helper to convert File/Blob to Base64
      const fileToBase64 = (file: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
      };

      // 1. Prepare Original Image (Compressed)
      console.log(`Processing original file size: ${selectedFile.size} bytes`);
      const originalBlob = await compressImage(selectedFile, 2048, 0.85); // High quality
      const originalBase64 = await fileToBase64(originalBlob);
      console.log("Original image processed");
      
      let maskedBase64: string | null = null;
      let markersData: any[] = [];

      // 2. Prepare Masked Image & Markers (if any)
      if (markerPositions.length > 0) {
          try {
             // Generate the visual guide (image with burned-in points)
             const compositeBlob = await generateCompositeImage();
             maskedBase64 = await fileToBase64(compositeBlob);
             
             // Process individual markers referencing images
             markersData = await Promise.all(markerPositions.map(async (m) => {
                 let refImageBase64 = null;
                 if (m.referenceImage) {
                      // Compress reference images slightly to avoid massive payloads
                      // Ideally we'd use compressImage here too but let's just convert for now 
                      // or use a simpler compression if file is huge.
                      // Using existing compressImage helper for consistency
                      try {
                        const compressedRef = await compressImage(m.referenceImage, 800, 0.8);
                        refImageBase64 = await fileToBase64(compressedRef);
                      } catch (e) {
                        console.warn("Failed to compress ref image, using original", e);
                        refImageBase64 = await fileToBase64(m.referenceImage);
                      }
                 }
                 return {
                     id: m.id,
                     color: m.color,
                     instruction: m.instruction,
                     refImage: refImageBase64
                 };
             }));
             
             console.log(`Processed ${markersData.length} markers for AI context`);
          } catch (e) {
             console.warn("Failed to generate composite context:", e);
             // Verify if we should abort or continue without markers
             // Continuing with just original image...
          }
      }

      // Call API with expanded payload
      console.log("Sending request to API...");
      const response = await fetch('/api/stage-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImage: originalBase64,  // Clean room
          maskedImage: maskedBase64,      // Room + Points (if any)
          markers: markersData,           // Detailed point metadata
          style: selectedStyle,
          roomType: selectedRoomType,
          additionalPrompt: additionalPrompt.trim() || undefined,
        }),
      });

      console.log("Response received:", response.status);

      if (!response.ok) {
        let errorMessage = 'Failed to stage image';
        
        // Handle specific error codes
        if (response.status === 413) {
          errorMessage = 'Image file too large. Please try with a smaller image or try again (the image will be automatically compressed).';
        } else {
          try {
            const responseText = await response.text();
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              // If we can't parse as JSON, it might be HTML
              console.error('API returned non-JSON response:', responseText);
              errorMessage = `Server error (${response.status}): ${response.statusText}`;
            }
          } catch (readError) {
            console.error('Failed to read error response:', readError);
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        result = JSON.parse(responseText);
        console.log('Parsed result:', result);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Server returned invalid response format');
      }      // Set the result with staged image only
      if (result.stagedImage) {
        console.log('Setting staged image URL:', result.stagedImage.substring(0, 50) + '...');
        setStagedImageUrl(result.stagedImage); // API already returns data URL format
        
        if (result.aiDescription) {
             console.log("AI Description:", result.aiDescription);
             // Optionally store this description in state if we want to display it
             // For now just logging it as per instructions
        }

        // --- UPLOAD TO FIREBASE STORAGE ---
        try {
            console.log("Uploading images to Firebase Storage...");
            
            // 1. Upload Original Image
            // We use originalBlob which is the compressed/optimized version used for AI
            const originalStorageUrl = await uploadFileToStorage(
                originalBlob, 
                `uploads/${user.uid}/original`
            );
            console.log("Original image uploaded:", originalStorageUrl);

            // 2. Upload Staged Image
            // Convert base64 to blob
            const stagedBlob = await (await fetch(result.stagedImage)).blob();
             const stagedStorageUrl = await uploadFileToStorage(
                stagedBlob, 
                `uploads/${user.uid}/staged`
            );
            console.log("Staged image uploaded:", stagedStorageUrl);

            // 3. Create Record
            await addCompletedUploadRecord({
              userId: user.uid,
              uploadedAt: Timestamp.now(),
              imageSize: selectedFile.size,
              imageName: selectedFile.name,
              style: selectedStyle,
              roomType: selectedRoomType,
              originalImageUrl: originalStorageUrl,
              stagedImageUrl: stagedStorageUrl,
              aiDescription: result.aiDescription
            });
            console.log("Upload record created!");
            
        } catch (uploadError) {
            console.error("Error saving to storage/firestore:", uploadError);
            // We don't block the UI success state if background save fails, but we log it
            // Optionally could throw here if strict consistency is required
        }
        
        // Refresh the upload history to show the new record
        
        // Refresh the upload history to show the new record
        const updatedHistory = await getAllUserUploads(user.uid);
        setUploadHistory(updatedHistory);
      } else {
        console.error('No staged image in result:', result);
        throw new Error('No staged image was generated');
      }
      
      setIsUploading(false);
      
      // Refresh the limit counter
      refreshLimit();
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setStagedImageUrl(null);
    setSelectedStyle('');
    setSelectedRoomType('');
    setAdditionalPrompt('');
    setMarkerPositions([]);
  };  // Download function for the staged image
  const downloadStagedImage = () => {
    if (!stagedImageUrl) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = stagedImageUrl;
    link.download = `staged-${selectedRoomType}-${selectedStyle}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date for display
  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="min-h-screen bg-[#FFFCF5] relative selection:bg-black selection:text-[#A3E635]">
        <Navigation />
        
        <main className="pt-24 pb-16 px-4 relative z-10">
          <motion.div 
            layout 
            className="mx-auto max-w-7xl transition-all duration-500 ease-out"
          >
            
            {/* Header Section */}
            <AnimatePresence mode="popLayout">
              {!selectedFile && (
                <motion.div 
                  key="header-section"
                  className="overflow-hidden"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: { opacity: 1, height: "auto", marginBottom: 48 },
                    visible: { 
                      opacity: 1, 
                      height: "auto", 
                      marginBottom: 48,
                      transition: { 
                        staggerChildren: 0.1,
                        delayChildren: 0.1,
                      } 
                    },
                    exit: { 
                      opacity: 0, 
                      height: 0, 
                      marginBottom: 0, 
                      transition: { 
                        duration: 0.6, 
                        ease: [0.04, 0.62, 0.23, 0.98],
                        when: "beforeChildren" // Actually we want container to shrink regardless
                      } 
                    }
                  }}
                >
                  <div className="text-center py-6 px-2">
                    <h1 className="font-brand text-[#1a1a1a] text-5xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-5xl mx-auto leading-[1.1] tracking-tight flex flex-wrap justify-center items-center gap-3 md:gap-5">
                      <div className="overflow-hidden">
                        <motion.span 
                          className="inline-block"
                          variants={{
                            hidden: { y: 60, opacity: 0, rotate: 10 },
                            visible: { 
                              y: 0, 
                              opacity: 1, 
                              rotate: 0, 
                              transition: { type: "spring", stiffness: 100, damping: 10 } 
                            },
                            exit: { y: -40, opacity: 0, transition: { duration: 0.3 } }
                          }}
                        >
                          Virtual
                        </motion.span>
                      </div>
                      <div className="relative">
                        <motion.span 
                          className="inline-block bg-[#F97316] text-black px-4 md:px-6 py-1 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                          variants={{
                            hidden: { scale: 0, opacity: 0, rotate: 10 },
                            visible: { 
                              scale: 1, 
                              opacity: 1, 
                              rotate: -2, 
                              transition: { type: "spring", stiffness: 200, damping: 15 } 
                            },
                            exit: { scale: 0, opacity: 0, transition: { duration: 0.3 } }
                          }}
                        >
                          Staging
                        </motion.span>
                      </div>
                    </h1>
                    
                    <motion.p 
                      className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium"
                      variants={{
                        hidden: { y: 30, opacity: 0 },
                        visible: { 
                          y: 0, 
                          opacity: 1, 
                          transition: { duration: 0.6, ease: "easeOut" } 
                        },
                        exit: { opacity: 0, transition: { duration: 0.2 } }
                      }}
                    >
                      Upload your empty room and let AI furnish it in seconds.
                    </motion.p>

                    {/* Limit Status - Minimal (Or Explore for Non-Auth) */}
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                        exit: { opacity: 0, transition: { duration: 0.2 } }
                      }}
                      className="mt-8 max-w-md mx-auto text-left"
                    >
                      {user ? (
                        <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 flex items-center gap-4">
                          <div className="shrink-0">
                            <div className={`w-3 h-3 rounded-full border border-black ${remainingUploads > 0 ? 'bg-[#A3E635]' : 'bg-red-500'}`}></div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-end mb-1">
                              <span className="font-bold text-xs uppercase tracking-wider">{userTier} Plan</span>
                              <span className="font-mono text-xs font-bold text-gray-600">{usedUploads}/{totalUploads} Used</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 border border-black rounded-full overflow-hidden">
                              <div 
                                className={`h-full border-r border-black transition-all duration-500 ${remainingUploads > 0 ? 'bg-[#3B82F6]' : 'bg-red-500'}`}
                                style={{ width: `${(usedUploads / totalUploads) * 100}%` }}
                              />
                            </div>
                          </div>

                          {isLimitReached && (
                            <div className="shrink-0 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                              Limit Reached
                            </div>
                          )}
                        </div>
                      ) : (
                        <a href="/" className="block group">
                          <div className="bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 flex items-center gap-4 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <div className="shrink-0">
                              <div className="w-10 h-10 rounded-lg bg-[#FACC15] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform duration-300">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-sm uppercase text-[#1a1a1a] tracking-wide">First Time Here?</span>
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                              </div>
                              <p className="text-xs font-bold text-gray-500 mt-0.5">See how our AI transforms rooms instantly</p>
                            </div>
                          </div>
                        </a>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`space-y-8 transition-all duration-500 ${selectedFile ? 'pt-12 md:pt-20' : ''}`}>
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-100 border-2 border-black text-red-700 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
                <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold">{error}</span>
              </div>
            )}

            {/* Payment Success */}
            {showPaymentSuccess && (
              <div className="p-4 bg-[#A3E635] border-2 border-black text-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold">Upgrade Successful! New limits active.</span>
                </div>
                <button onClick={() => setShowPaymentSuccess(false)} className="hover:bg-black/10 p-1 rounded-md transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}



            {/* Main Upload/Form Area */}
            {!selectedFile ? (
               <motion.div  
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: { y: 40, opacity: 0, scale: 0.95 },
                    visible: { 
                      y: 0, 
                      opacity: 1, 
                      scale: 1,
                      transition: { 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 20,
                        delay: 0.3 
                      } 
                    },
                    exit: { 
                      opacity: 0, 
                      scale: 0.95, 
                      transition: { duration: 0.2 } 
                    }
                  }}
                  className={`w-full max-w-3xl mx-auto cursor-pointer group relative bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 overflow-hidden ${
                    isDragOver 
                      ? 'bg-orange-50 scale-[1.01]' 
                      : 'hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {/* Zig-zag Background Animation (Container Only) */}
                  <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08]">
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 L 25 25 L 50 50 L 75 75 L 100 50' fill='none' stroke='%23F97316' stroke-width='40' stroke-linecap='square'/%3E%3C/svg%3E")`,
                        backgroundSize: '160px 160px',
                        animation: 'zigZagScroll 20s linear infinite'
                      }}
                    />
                    <style dangerouslySetInnerHTML={{__html: `
                      @keyframes zigZagScroll {
                        from { background-position: 0 0; }
                        to { background-position: 160px 160px; }
                      }
                    `}} />
                  </div>

                  {/* Blueprint Grid Background */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                       style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  </div>

                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-black rounded-tl-xl m-4 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-black rounded-tr-xl m-4 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-black rounded-bl-xl m-4 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-black rounded-br-xl m-4 opacity-20 group-hover:opacity-100 transition-opacity"></div>

                  <div className="p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[400px] relative z-10">
                     
                     {/* Floating Upload Icon */}
                     <div className={`relative mb-8 transition-all duration-500 ${isDragOver ? 'scale-110' : 'group-hover:scale-105'}`}>
                        <div className={`absolute -inset-4 bg-[#F97316] rounded-full opacity-20 blur-xl transition-all duration-500 ${isDragOver ? 'scale-150 opacity-40' : 'scale-100'}`}></div>
                        <div className={`w-24 h-24 bg-white border-2 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10 transition-transform duration-300 ${isDragOver ? 'rotate-[-6deg]' : 'rotate-3 group-hover:rotate-6'}`}>
                            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        {/* Decorative Badge */}
                        <div className="absolute -top-3 -right-3 bg-[#A3E635] border-2 border-black rounded-full px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform rotate-12 z-20">
                          AI
                        </div>
                     </div>
                     
                     <h3 className="text-4xl font-black text-[#1a1a1a] mb-3 uppercase tracking-tight">
                       Upload Room
                     </h3>
                     
                     <p className="text-lg text-gray-600 mb-8 font-medium max-w-md">
                        <span className="bg-yellow-100 px-1">Drag & drop</span> anywhere or click the button below to start staging
                     </p>

                     <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                        onClick={(e) => e.stopPropagation()} 
                      />
                      
                      <span className="inline-flex items-center gap-3 px-10 py-4 bg-[#F97316] text-white text-xl font-black uppercase rounded-xl border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group/btn">
                        <span className="relative z-10 flex items-center gap-3">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Select Photo
                        </span>
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
                      </span>
                      
                      <p className="mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Supports JPG, PNG, WEBP (Max 10MB)
                      </p>
                  </div>
               </motion.div>
            ) : stagedImageUrl ? (
                // Result View
                <div className="max-w-4xl mx-auto bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="p-8 border-b-2 border-black bg-[#A3E635]/20">
                         <div className="flex items-center justify-center gap-3 mb-2">
                             <div className="bg-[#A3E635] text-black border-2 border-black p-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                             </div>
                             <h3 className="text-2xl font-black uppercase">Staging Complete</h3>
                         </div>
                    </div>
                    
                    <div className="p-8 space-y-8">
                         <div className="relative rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-gray-100">
                             <img src={stagedImageUrl} alt="Staged Result" className="w-full h-auto" />
                         </div>

                         <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                             <button
                                onClick={downloadStagedImage}
                                className="w-full sm:w-auto px-8 py-4 bg-[#F97316] text-white border-2 border-black font-bold uppercase rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </button>
                             <button
                                onClick={clearSelection}
                                className="w-full sm:w-auto px-8 py-4 bg-white text-black border-2 border-black font-bold uppercase rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                              >
                                Stage Another
                              </button>
                         </div>
                    </div>
                </div>
            ) : (
                // Form View
                <div className={`flex flex-col lg:flex-row gap-8 items-start transition-all duration-500 ${markerPositions.length > 0 ? '' : 'justify-center'}`}>
                    <motion.div 
                        layout 
                        className="w-full max-w-4xl space-y-8"
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                    {/* Image Preview */}
                    <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 relative">
                        <button
                          onClick={clearSelection}
                          className="absolute -top-4 -right-4 bg-red-500 text-white w-10 h-10 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:scale-110 transition-transform z-20"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                         {previewUrl ? (
                            <div 
                                ref={containerRef}
                                className={`relative rounded-lg bg-gray-50 border-2 border-black group`}
                                style={{
                                    cursor: drawingMarkerId 
                                        ? PEN_CURSOR 
                                        : (markerPositions.length < 6 ? PLUS_CURSOR : 'default')
                                }}
                                onMouseEnter={() => setIsHoveringImage(true)}
                                onMouseLeave={() => {
                                    if (isDrawingRadius && drawingMarkerId) {
                                        setIsDrawingRadius(false);
                                        // Validate on leave if drawing
                                        const marker = markerPositions.find(m => m.id === drawingMarkerId);
                                        if (marker && marker.radiusPoints && marker.radiusPoints.length > 2) {
                                            if (!isPointInPolygon({x: marker.x, y: marker.y}, marker.radiusPoints)) {
                                                updateMarker(marker.id, { radiusPoints: [] });
                                                setShowRadiusError(true);
                                                setTimeout(() => setShowRadiusError(false), 3000);
                                            }
                                        }
                                    }
                                    setIsHoveringImage(false);
                                }}
                                onMouseDown={(e) => {
                                    if (drawingMarkerId) {
                                        setIsDrawingRadius(true);
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                        
                                        // Start fresh
                                        updateMarker(drawingMarkerId, { radiusPoints: [{x, y}] });
                                    }
                                }}
                                onMouseUp={() => {
                                    if (isDrawingRadius && drawingMarkerId) {
                                        setIsDrawingRadius(false);
                                        // Validate
                                        const marker = markerPositions.find(m => m.id === drawingMarkerId);
                                        // Need at least 3 points for a polygon
                                        if (marker && marker.radiusPoints && marker.radiusPoints.length > 2) {
                                            if (!isPointInPolygon({x: marker.x, y: marker.y}, marker.radiusPoints)) {
                                                updateMarker(marker.id, { radiusPoints: [] });
                                                setShowRadiusError(true);
                                                setTimeout(() => setShowRadiusError(false), 3000);
                                            }
                                        } else {
                                            // Too few points, just clear
                                            if (marker) updateMarker(marker.id, { radiusPoints: [] });
                                        }
                                        setDrawingMarkerId(null);
                                        justFinishedDrawing.current = true;
                                        setTimeout(() => { justFinishedDrawing.current = false; }, 50);
                                    }
                                }}
                                onMouseMove={(e) => {
                                    if (isDrawingRadius && drawingMarkerId) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                                        
                                        setMarkerPositions(prev => prev.map(m => {
                                            if (m.id === drawingMarkerId) {
                                                return { 
                                                    ...m, 
                                                    radiusPoints: [...(m.radiusPoints || []), { x, y }] 
                                                };
                                            }
                                            return m;
                                        }));
                                    }
                                }}
                                onClick={(e) => {
                                    if (drawingMarkerId) return;
                                    if (justFinishedDrawing.current) {
                                        justFinishedDrawing.current = false;
                                        return;
                                    }

                                    if (markerPositions.length >= 6) {
                                        setShowLimitWarning(true);
                                        setTimeout(() => setShowLimitWarning(false), 2000);
                                        return;
                                    }
                                    
                                    const usedColors = new Set(markerPositions.map(m => m.color));
                                    const availableColors = MARKER_COLORS.filter(c => !usedColors.has(c));
                                    const color = availableColors.length > 0 
                                        ? availableColors[Math.floor(Math.random() * availableColors.length)]
                                        : MARKER_COLORS[Math.floor(Math.random() * MARKER_COLORS.length)];

                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                                    
                                    const newMarker = { id: Math.random().toString(36).substr(2, 9), x, y, color };
                                    setMarkerPositions(prev => [...prev, newMarker]);
                                }}
                            >
                                <img
                                  src={previewUrl}
                                  alt="Preview"
                                  className="w-full h-auto block select-none rounded-lg relative z-0"
                                  draggable={false}
                                />
                                
                                    {/* Radius Overlay */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    {markerPositions.map(marker => (
                                        marker.radiusPoints && marker.radiusPoints.length > 0 && (
                                            <polygon
                                                key={`poly-${marker.id}`}
                                                points={marker.radiusPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                                fill={marker.color}
                                                fillOpacity="0.2"
                                                stroke="black"
                                                strokeWidth="2"
                                                strokeDasharray="5,5"
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        )
                                    ))}
                                </svg>

                                {/* Placed Markers */}
                                {markerPositions.map((marker) => (
                                   <div 
                                        key={marker.id}
                                        className={`absolute w-6 h-6 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-20 ${draggingId === marker.id ? 'cursor-grabbing' : 'cursor-grab'}`}
                                        style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                                   >
                                        <div 
                                            className={`w-6 h-6 text-black border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ${draggingId === marker.id ? 'scale-110' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: marker.color }}
                                            onMouseEnter={() => {
                                                if (!draggingId) {
                                                    setHoveredMarkerId(marker.id);
                                                    setIsHoveringMarker(true);
                                                }
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredMarkerId(null);
                                                setIsHoveringMarker(false);
                                            }}
                                            onMouseDown={(e) => handleMouseDown(e, marker.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>

                                        <AnimatePresence>
                                            {hoveredMarkerId === marker.id && !draggingId && (marker.instruction || marker.referenceImage) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    className="absolute left-1/2 bottom-full mb-3 -translate-x-1/2 w-64 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 z-50 text-left pointer-events-none"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {marker.referenceImage && (
                                                            <div className="w-16 h-16 bg-purple-100 border-2 border-black p-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0 overflow-hidden">
                                                                <img 
                                                                    src={URL.createObjectURL(marker.referenceImage)} 
                                                                    alt="Ref" 
                                                                    className="w-full h-full object-contain" 
                                                                />
                                                            </div>
                                                        )}
                                                        {marker.instruction && (
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-purple-600 text-sm font-bold font-brand leading-tight break-words line-clamp-3">
                                                                    {marker.instruction}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Arrow */}
                                                    <div className="absolute left-1/2 top-full -ml-3 w-6 h-6 bg-white border-r-2 border-b-2 border-black transform rotate-45 -mt-3"></div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                   </div>
                                ))}
                            </div>
                          ) : (
                             // Fallback
                             <div className="h-96" /> 
                          )}
                    </div>

                    {/* Controls */}
                    <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
                        <div className="space-y-8">
                             {/* Style */}
                             <div>
                                <label className="block text-xl font-black uppercase mb-4 flex items-center gap-2">
                                    <span className="bg-black text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">1</span>
                                    Choose Style
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {styleOptions.map((style) => (
                                    <button
                                      key={style.value}
                                      onClick={() => setSelectedStyle(style.value)}
                                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                                        selectedStyle === style.value
                                          ? 'border-black bg-[#A3E635] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]'
                                          : 'border-black bg-white hover:bg-gray-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                      }`}
                                    >
                                      <div className="font-bold text-black mb-1">{style.label}</div>
                                      <div className="text-xs font-medium text-gray-600 leading-tight">{style.description}</div>
                                    </button>
                                  ))}
                                </div>
                             </div>

                             {/* Room Type */}
                             <div>
                                <label className="block text-xl font-black uppercase mb-4 flex items-center gap-2">
                                    <span className="bg-black text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">2</span>
                                    Room Type
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {roomTypeOptions.map((room) => (
                                    <button
                                      key={room.value}
                                      onClick={() => setSelectedRoomType(room.value)}
                                      className={`p-3 border-2 rounded-lg font-bold text-sm transition-all ${
                                        selectedRoomType === room.value
                                          ? 'border-black bg-[#3B82F6] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]'
                                          : 'border-black bg-white text-black hover:bg-gray-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                      }`}
                                    >
                                      {room.label}
                                    </button>
                                  ))}
                                </div>
                             </div>

                              {/* Additional Prompt */}
                              <div>
                                <label className="block text-xl font-black uppercase mb-4 flex items-center gap-2">
                                    <span className="bg-black text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">3</span>
                                    Additional Details <span className="text-sm font-normal text-gray-400 ml-2">(Optional)</span>
                                </label>
                                <textarea
                                  value={additionalPrompt}
                                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                                  placeholder="Describe any specific furniture, colors, or styling preferences..."
                                  className="w-full p-4 border-2 border-black rounded-xl resize-none focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                  rows={3}
                                />
                              </div>

                             {/* Button */}
                             <div className="pt-6">
                                <button
                                  onClick={handleUpload}
                                  disabled={isUploading || isLimitReached || !isFormValid}
                                  className={`w-full py-5 font-black text-xl uppercase tracking-wider rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${
                                    isFormValid && !isLimitReached && !isUploading
                                      ? 'bg-[#F97316] text-white hover:bg-[#EA580C] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400 shadow-none'
                                  }`}
                                >
                                  {isUploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Magic in progress...
                                    </span>
                                  ) : isLimitReached ? 'Limit Reached' : 'Generate Stage'}
                                </button>
                                {!isFormValid && (
                                  <p className="text-center text-sm font-bold text-gray-400 mt-2">
                                     * Select Style & Room Type to continue
                                  </p>
                                )}
                             </div>
                        </div>
                    </div>
                </motion.div>
                
                {/* Right Marker Panel */}
                <AnimatePresence>
                    {markerPositions.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 320 }} // Fixed width for sidebar
                            exit={{ opacity: 0, x: 20, width: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="hidden lg:block lg:flex-shrink-0"
                        >
                            <div className="sticky top-24 w-80 space-y-4">
                                <h3 className="font-black text-xl uppercase mb-4 flex items-center gap-2">
                                    <span className="bg-black text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">#</span>
                                    Point Details
                                </h3>
                                {markerPositions.map((marker, index) => (
                                    <motion.div 
                                        key={marker.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative group"
                                    >
                                    <div 
                                        className="absolute -top-3 -left-3 text-black border-2 border-black w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm z-10"
                                        style={{ backgroundColor: marker.color }}
                                    >
                                        {index + 1}
                                    </div>
                                    <button 
                                        onClick={() => setMarkerPositions(prev => prev.filter(m => m.id !== marker.id))}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white hover:bg-red-600 border-2 border-black w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm z-10"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                    
                                    <div className="mt-4 space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Instructions</label>
                                            <textarea 
                                                value={marker.instruction || ''}
                                                onChange={(e) => updateMarker(marker.id, { instruction: e.target.value })}
                                                className="w-full text-sm p-3 border-2 border-black rounded-lg resize-none focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-gray-50 focus:bg-white"
                                                rows={2}
                                                placeholder="Describe what to do here..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Reference Image</label>
                                            <div className="relative flex items-center gap-2">
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    id={`ref-img-${marker.id}`}
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                                                                setShowFileSizeWarning(true);
                                                                setTimeout(() => setShowFileSizeWarning(false), 10000);
                                                                // Reset the input value so the same file can be selected again if needed (though it will fail again)
                                                                e.target.value = ''; 
                                                                return;
                                                            }
                                                            updateMarker(marker.id, { referenceImage: file });
                                                        }
                                                    }}
                                                />
                                                <label 
                                                    htmlFor={`ref-img-${marker.id}`}
                                                    className={`flex-1 flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 hover:border-black transition-colors ${marker.referenceImage ? 'border-black bg-blue-50' : 'border-gray-400'}`}
                                                >
                                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">
                                                        {marker.referenceImage ? marker.referenceImage.name : 'Upload Reference'}
                                                    </span>
                                                </label>
                                                {marker.referenceImage && (
                                                    <button
                                                        onClick={() => {
                                                            updateMarker(marker.id, { referenceImage: undefined });
                                                            const input = document.getElementById(`ref-img-${marker.id}`) as HTMLInputElement;
                                                            if (input) input.value = '';
                                                        }}
                                                        className="bg-white hover:bg-red-50 text-red-500 border-2 border-gray-200 hover:border-red-500 rounded-lg p-2 transition-colors"
                                                        title="Remove image"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Draw Radius Button */}
                                        <div>
                                            {drawingMarkerId === marker.id ? (
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-black text-white border-2 border-black rounded-lg py-2 text-xs font-bold uppercase flex items-center justify-center gap-2 animate-pulse">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                        Drawing...
                                                    </div>
                                                    <button
                                                        onClick={() => setDrawingMarkerId(null)}
                                                        className="bg-white text-gray-500 border-2 border-black rounded-lg px-3 hover:bg-gray-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        title="Cancel"
                                                    >
                                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setDrawingMarkerId(marker.id)}
                                                        className={`flex-1 border-2 border-black rounded-lg py-2 text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 ${
                                                            marker.radiusPoints && marker.radiusPoints.length > 0 
                                                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                                                : 'bg-white text-black hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                        {marker.radiusPoints && marker.radiusPoints.length > 0 ? 'Draw Again' : 'Draw Radius'}
                                                    </button>
                                                    {marker.radiusPoints && marker.radiusPoints.length > 0 && (
                                                        <button
                                                            onClick={() => updateMarker(marker.id, { radiusPoints: [] })}
                                                            className="bg-white text-red-500 border-2 border-black rounded-lg px-3 hover:bg-red-50 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                            title="Clear Radius"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            )}
            
            {/* Limit Warning Notification */}
            <AnimatePresence>
                {showLimitWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 right-8 bg-red-500 text-white px-6 py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 flex items-center gap-3 font-bold"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        You can only place a maximum of 6 points
                    </motion.div>
                )}
                {/* File Size Warning Notification */}
                 {showFileSizeWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 right-8 bg-red-500 text-white px-6 py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 flex items-center gap-3 font-bold"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reference image exceeds 4MB limit
                    </motion.div>
                )}
                 {/* Radius Error Notification */}
                 {showRadiusError && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 right-8 bg-black text-white px-6 py-4 rounded-xl border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] z-50 flex items-center gap-3 font-bold"
                    >
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Radius must include the point!
                    </motion.div>
                )}
                 

            </AnimatePresence>

            </div>
          </motion.div>
        </main>

        {/* Upload History */}
       {uploadHistory.length > 0 && (
          <section className="py-16 px-4 border-t-2 border-black bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-12">
                  <div className="h-1 bg-black flex-grow"></div>
                  <h2 className="text-3xl font-black text-black uppercase text-center bg-[#A3E635] border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1">
                    Your Gallery
                  </h2>
                  <div className="h-1 bg-black flex-grow"></div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {uploadHistory.map((record) => (
                    <div 
                      key={record.id} 
                      className="bg-white border-2 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300 p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                         <div className="bg-gray-100 border-2 border-black rounded-lg p-3">
                            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                         </div>
                         <span className="text-xs font-bold bg-black text-white px-2 py-1 rounded">
                            {formatDate(record.uploadedAt)}
                         </span>
                      </div>
                      
                      <h3 className="font-bold text-xl text-black capitalize mb-1">
                          {record.roomType?.replace('-', ' ')}
                      </h3>
                      <p className="text-sm font-medium text-gray-500 mb-4 capitalize">
                          {record.style} Style
                      </p>
                      
                       <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                           <div className="w-1/2 h-full bg-[#3B82F6]"></div>
                       </div>
                    </div>
                  ))}
                </div>
            </div>
          </section>
       )}

        <Footer />
      </div>
    </>
  );
}

// Loading component for Suspense fallback
function UploadPageLoading() {
  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <Navigation />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-black border-b-transparent mb-6"></div>
            <h2 className="text-2xl font-black uppercase text-black">Loading Studio...</h2>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Main export with Suspense boundary
export default function UploadPage() {
  return (
    <Suspense fallback={<UploadPageLoading />}>
      <UploadPageContent />
    </Suspense>
  );
}
