"use client";

import React, { useState, useRef } from 'react';
import FloatingElement from './FloatingElement';
import WigglyLine from './WigglyLine';
import AuthButton from './AuthButton';

export default function UploadSection() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="relative py-16 md:py-20 bg-gray-50 overflow-hidden">
      {/* Floating Elements */}
      <FloatingElement 
        position={{ top: '15%', left: '5%' }}
        size="xl"
        imageSrc="/sofa.png"
        imageAlt="3D Chair"
        animationDelay="0.5s"
        rotation="-15deg"
      />

        <FloatingElement 
        position={{ top: '60%', left: '8%' }}
        size="sm"
        imageSrc="/plant.png"
        imageAlt="3D Chair"
        animationDelay="0.5s"
        rotation="-15deg"
      />

      <FloatingElement 
        position={{ bottom: '20%', right: '8%' }}
        size="md"
        imageSrc="/tallplant.png"
        imageAlt="3D Plant"
        animationDelay="1.5s"
        rotation="20deg"
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Stage Your <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Home Images</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your empty room photos and get professionally staged images in seconds
          </p>
        </div>

        {/* Upload Container */}
        <div className="max-w-4xl mx-auto">
          <div 
            className={`relative bg-white rounded-3xl shadow-2xl border-4 border-dashed transition-all duration-300 ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : selectedFile 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-12 md:p-20 text-center">
              {selectedFile ? (
                /* File Selected State */
                <div className="space-y-6">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">File Ready!</h3>
                    <p className="text-gray-600 mb-4">{selectedFile.name}</p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Choose Different
                      </button>
                      <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                        Stage This Image
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload State */
                <div className="space-y-8">
                  {/* Upload Icon */}
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>                  {/* Upload Button */}
                  <div>                    <AuthButton
                      size="lg"
                      hoverColor="bg-blue-700"
                      redirectTo="/upload"
                      className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      Upload Image
                    </AuthButton>
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
              )}
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

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Get your staged images in under 30 seconds</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Quality</h3>
              <p className="text-gray-600">AI-powered staging that looks realistic</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cost Effective</h3>
              <p className="text-gray-600">Save thousands compared to traditional staging</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
