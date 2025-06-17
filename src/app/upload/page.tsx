"use client";

import { useAuth } from '../../contexts/AuthContext';
import AuthGuard from '../../components/AuthGuard';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import FloatingElement from '../../components/FloatingElement';
import { useState, useEffect, Suspense } from 'react';
import { useUploadLimit } from '../../hooks/useUploadLimit';
import { addCompletedUploadRecord, canUserUpload, getAllUserUploads, type UploadRecord } from '../../services/uploadService';
import { Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

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
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleUpload = async () => {
    if (!selectedFile || !user || !isFormValid) return;    // Check if user can upload
    const canUpload = await canUserUpload(user.uid);
    if (!canUpload) {
      const tier = userTier || 'free';
      if (tier === 'free') {
        setError('You have reached your daily limit of 1 staged image. Your limit resets 24 hours after your upload.');
      } else {
        setError('You have reached your monthly limit. Your limit resets on the 1st of next month.');
      }
      return;
    }
    
    setError(null);    setIsUploading(true);
    
    try {
      // Convert image to base64 for OpenAI API
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });

      // Call OpenAI API for room analysis and staging
      const response = await fetch('/api/stage-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Image,
          style: selectedStyle,
          roomType: selectedRoomType,
          additionalPrompt: additionalPrompt.trim() || undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to stage image';
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
        
        // Only create the upload record since the image was successfully generated
        await addCompletedUploadRecord({
          userId: user.uid,
          uploadedAt: Timestamp.now(),
          imageSize: selectedFile.size,
          imageName: selectedFile.name,
          style: selectedStyle,
          roomType: selectedRoomType
        });
        
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
    <AuthGuard>      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-100 overflow-hidden relative">
        <Navigation />          {/* Floating Furniture Elements - Visible but safely positioned */}
        <FloatingElement 
          position={{ top: '10rem', left: '3rem' }}
          size="sm"
          imageSrc="/lamp.png"
          imageAlt="Upload property photos for AI virtual staging real estate marketing automation"
          animationDelay="0s"
          rotation="15deg"
        />
        
        <FloatingElement 
          position={{ top: '8rem', right: '6rem' }}
          size="md"
          imageSrc="/chair.png"
          imageAlt="Transform empty rooms with AI home staging technology virtual furniture placement"
          animationDelay="1.2s"
          rotation="-10deg"
        />

        <FloatingElement 
          position={{ bottom: '8rem', right: '3rem' }}
          size="md"
          imageSrc="/cactus.png"
          imageAlt="Professional virtual staging increases property value real estate agent success"
          animationDelay="3.5s"
          rotation="-15deg"
        />
        
        <FloatingElement 
          position={{ top: '60%', left: '2rem' }}
          size="xl"
          imageSrc="/bed.png"
          imageAlt="AI powered interior design software revolutionizes real estate photography staging"
          animationDelay="4.2s"
          blur={true}
          rotation="10deg"
        /><main className="pt-20 pb-16">
          <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.20)-theme(spacing.16))] p-4">
            <div className="w-full max-w-4xl">              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}              {/* Payment Success Notification */}
              {showPaymentSuccess && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Payment successful! Your plan has been upgraded and your new limits are now active.</span>
                  </div>
                  <button 
                    onClick={() => setShowPaymentSuccess(false)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Daily Limit Status */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {userTier} Plan: {usedUploads} / {totalUploads} image{totalUploads > 1 ? 's' : ''} {userTier === 'free' ? 'total' : 'this month'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {remainingUploads > 0 ? (
                      <span className="text-sm text-green-600 font-medium">
                        {remainingUploads} remaining
                      </span>
                    ) : (
                      <span className="text-sm text-red-600 font-medium">
                        Limit reached
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      remainingUploads > 0 ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(usedUploads / totalUploads) * 100}%` }}
                  ></div>
                </div>                {isLimitReached && (
                  <p className="text-xs text-gray-500 mt-2">
                    {userTier === 'free' 
                      ? 'Free tier includes 5 staged images total. Upgrade to a paid plan for monthly limits.'
                      : `Your monthly limit resets on the 1st of next month. Consider upgrading for more images.`
                    }
                  </p>
                )}
              </div>{/* Upload Card or Image Display */}
              {!selectedFile ? (
                /* Upload Card */
                <div 
                  className={`relative bg-white rounded-3xl shadow-2xl border-4 border-dashed transition-all duration-300 ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="p-12 md:p-20 text-center">
                    {/* Upload State */}
                    <div className="space-y-8">
                      {/* Upload Icon */}
                      <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>

                      {/* Main Text */}
                      <div>
                        <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
                          Upload Your Image
                        </h3>
                        <p className="text-lg text-gray-600 mb-8">
                          Drag and drop your image here, or click to browse
                        </p>
                      </div>

                      {/* Upload Button */}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-full hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg cursor-pointer"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Choose Image
                        </label>
                      </div>

                      {/* Drop Text */}
                      <div>
                        <p className="text-xl text-gray-600 mb-2">or drop a file,</p>
                        <p className="text-base text-gray-500">paste image or URL</p>
                      </div>

                      {/* Supported Formats */}
                      <div className="text-sm text-gray-400">
                        <p>Supports: JPG, PNG, WEBP • Max size: 10MB</p>
                      </div>
                    </div>

                    {/* Drag Overlay */}
                    {isDragOver && (
                      <div className="absolute inset-0 bg-blue-600/10 border-4 border-blue-400 rounded-3xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <p className="text-xl font-semibold text-blue-600">Drop your image here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>              ) : stagedImageUrl ? (
                /* Upload Complete - Show Results */
                <div className="space-y-8">
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">AI Staging Complete!</h3>
                      <p className="text-gray-600">Your staged result is ready</p>
                    </div>                      {/* Staged Result Image */}
                    <div className="mb-8">
                      <div className="max-w-2xl mx-auto">
                        <div className="relative rounded-3xl overflow-hidden bg-gray-100 shadow-xl">
                          {stagedImageUrl ? (                            <img
                              src={stagedImageUrl}
                              alt="AI virtual staging result professional home staging transforms empty property rooms real estate marketing success"
                              className="w-full h-auto object-cover"
                            />
                          ) : (
                            <div className="h-80 flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <p className="text-gray-600">Processing your staged room...</p>
                              </div>
                            </div>
                          )}
                        </div>                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      {/* Main Download Button */}
                      <button
                        onClick={downloadStagedImage}
                        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-full hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Staged Image
                      </button>
                      
                      {/* Stage Another Image - Refresh Icon */}
                      <button
                        onClick={clearSelection}
                        className="flex items-center justify-center w-14 h-14 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
                        title="Stage Another Image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>) : (
                /* Image Selected - Show Image with X Button Only */
                <div className="space-y-6">
                  <div className="relative">
                    {/* X Button - Top Right */}
                    <button
                      onClick={clearSelection}
                      className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>                    {/* Image Display Only */}
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                      {previewUrl ? (                        <img
                          src={previewUrl}
                          alt="Empty property room ready for AI virtual staging real estate photography enhancement"
                          className="w-full h-96 object-cover"
                        />
                      ) : (
                        <div className="h-96 flex items-center justify-center bg-gray-100">
                          <p className="text-gray-500">Upload an image to get started</p>
                        </div>
                      )}
                    </div>
                  </div>                  {/* Upload Button Below Image */}
                  <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <div className="space-y-6">
                      {/* Style Selection */}
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                          Style Selection <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {styleOptions.map((style) => (
                            <button
                              key={style.value}
                              onClick={() => setSelectedStyle(style.value)}
                              className={`p-4 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-md ${
                                selectedStyle === style.value
                                  ? 'border-purple-500 bg-purple-50 shadow-md'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-semibold text-gray-900 mb-1">{style.label}</div>
                              <div className="text-sm text-gray-600">{style.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Room Type Selection */}
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                          Room Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {roomTypeOptions.map((room) => (
                            <button
                              key={room.value}
                              onClick={() => setSelectedRoomType(room.value)}
                              className={`p-3 border-2 rounded-xl font-medium transition-all duration-200 hover:shadow-md ${
                                selectedRoomType === room.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {room.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional Prompt */}
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-2">
                          Additional Prompt <span className="text-gray-500">(Optional)</span>
                        </label>
                        <textarea
                          value={additionalPrompt}
                          onChange={(e) => setAdditionalPrompt(e.target.value)}
                          placeholder="Describe any specific furniture, colors, or styling preferences..."
                          className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-purple-500 focus:outline-none transition-colors duration-200"
                          rows={3}
                        />
                        <div className="text-sm text-gray-500 mt-1">
                          Help the AI understand your vision better with specific details
                        </div>
                      </div>

                      {/* Stage Button */}
                      <div className="text-center pt-4">
                        <button
                          onClick={handleUpload}
                          disabled={isUploading || isLimitReached || !isFormValid}
                          className={`px-8 py-4 font-semibold rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg ${
                            isFormValid && !isLimitReached && !isUploading
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isUploading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Staging Image...
                            </div>
                          ) : isLimitReached ? (
                            'Daily Limit Reached'
                          ) : !isFormValid ? (
                            'Please Select Style & Room Type'
                          ) : (
                            'Stage This Image'
                          )}
                        </button>
                        
                        {!isFormValid && (
                          <div className="text-sm text-gray-500 mt-2">
                            Please select both style and room type to continue
                          </div>
                        )}
                      </div>                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>        {/* Upload History Section */}
        {uploadHistory.length > 0 && (
          <section className="py-16 px-4 bg-white/50 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Your Staging History
                </h2>
                <p className="text-lg text-gray-600">
                  Your previously staged room images
                </p>
              </div>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Loading your history...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uploadHistory.map((record) => (
                    <div 
                      key={record.id} 
                      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
                    >
                      {/* Icon */}
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      
                      {/* Content */}
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900 mb-2 capitalize">
                          {record.roomType?.replace('-', ' ')} • {record.style}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {formatDate(record.uploadedAt)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Original: {record.imageName}
                        </p>
                      </div>
                    </div>
                  ))}                </div>
              )}
            </div>
          </section>
        )}

        <Footer />
      </div>
    </AuthGuard>
  );
}

// Loading component for Suspense fallback
function UploadPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
