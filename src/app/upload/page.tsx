"use client";

import { useAuth } from '../../contexts/AuthContext';
import AuthGuard from '../../components/AuthGuard';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useState } from 'react';
import { useUploadLimit } from '../../hooks/useUploadLimit';
import { addUploadRecord, canUserUpload } from '../../services/uploadService';
import { Timestamp } from 'firebase/firestore';

export default function UploadPage() {
  const { user } = useAuth();
  const { isLimitReached, refreshLimit } = useUploadLimit();
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
    if (!selectedFile || !user || !isFormValid) return;
    
    // Check if user can upload
    const canUpload = await canUserUpload(user.uid);
    if (!canUpload) {
      setError('You have reached your daily upload limit of 3 images. Please try again tomorrow.');
      return;
    }
    
    setError(null);
    setIsUploading(true);
    
    try {
      // Add upload record to track usage
      await addUploadRecord({
        userId: user.uid,
        uploadedAt: Timestamp.now(),
        imageSize: selectedFile.size,
        imageName: selectedFile.name,
        status: 'processing'
      });
      
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
      });      if (!response.ok) {
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
      }      let result;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        result = JSON.parse(responseText);
        console.log('Parsed result:', result);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Server returned invalid response format');
      }
      
      // Set the result with staged image only
      if (result.stagedImage) {
        console.log('Setting staged image URL:', result.stagedImage.substring(0, 50) + '...');
        setStagedImageUrl(result.stagedImage); // API already returns data URL format
      } else {
        console.error('No staged image in result:', result);
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
  };

  // Download function for the staged image
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-100">
        <Navigation />
        
        <main className="pt-20 pb-16">
          <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.20)-theme(spacing.16))] p-4">
            <div className="w-full max-w-4xl">
              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}              {/* Upload Card or Image Display */}
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
                <div className="relative space-y-8 overflow-hidden">
                  {/* Floating Background Elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Large blurred circles */}
                    <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-r from-purple-300/30 to-pink-300/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-r from-blue-300/25 to-cyan-300/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                    <div className="absolute -bottom-32 -left-40 w-72 h-72 bg-gradient-to-r from-green-300/30 to-emerald-300/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-r from-orange-300/25 to-yellow-300/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    
                    {/* Medium floating shapes */}
                    <div className="absolute top-32 left-16 w-32 h-32 bg-gradient-to-r from-indigo-300/40 to-purple-300/40 rounded-full blur-2xl animate-bounce" style={{animationDuration: '3s', animationDelay: '1.5s'}}></div>
                    <div className="absolute top-20 right-24 w-24 h-24 bg-gradient-to-r from-rose-300/35 to-pink-300/35 rounded-full blur-xl animate-bounce" style={{animationDuration: '4s', animationDelay: '0.8s'}}></div>
                    <div className="absolute bottom-40 left-32 w-28 h-28 bg-gradient-to-r from-teal-300/30 to-cyan-300/30 rounded-full blur-2xl animate-bounce" style={{animationDuration: '3.5s', animationDelay: '2.2s'}}></div>
                    
                    {/* Small sparkle elements */}
                    <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-white/60 rounded-full blur-sm animate-ping" style={{animationDelay: '1s'}}></div>
                    <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-yellow-200/70 rounded-full blur-sm animate-ping" style={{animationDelay: '2.5s'}}></div>
                    <div className="absolute bottom-1/3 left-1/4 w-10 h-10 bg-blue-200/50 rounded-full blur-sm animate-ping" style={{animationDelay: '1.8s'}}></div>
                    <div className="absolute bottom-1/4 right-1/3 w-7 h-7 bg-purple-200/60 rounded-full blur-sm animate-ping" style={{animationDelay: '0.3s'}}></div>
                  </div>
                  
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
                          {stagedImageUrl ? (
                            <img
                              src={stagedImageUrl}
                              alt="AI staged room"
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
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Selected image"
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
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}
