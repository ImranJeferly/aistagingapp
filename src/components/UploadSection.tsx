"use client";

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import FloatingElement from './FloatingElement';
// import Floating3DModel from './Floating3DModel';
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
    <section className="relative py-16 md:py-20 bg-blue-50 overflow-hidden">      {/* Floating Elements */}
      {/* <Floating3DModel 
        modelPath="/models/sofa.glb"
        position={{ top: '15%', right: '5%' }}
        size="xxl"
        rotation={[0.1, -0.5, 0]}
        scale={3}
      />

        <Floating3DModel 
        modelPath="/models/plant.glb"
        position={{ top: '60%', left: '8%' }}
        size="lg"
        rotation={[0, 0, 0]}
      /> */}

      {/* <FloatingElement 
        position={{ bottom: '20%', right: '8%' }}
        size="md"
        imageSrc="/tallplant.png"
        imageAlt="AI powered virtual home staging increases property sales for real estate professionals"
        animationDelay="1.5s"
        rotation="20deg"
      /> */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black font-brand text-[#1a1a1a] mb-6">
            Stage Your <span className="inline-block bg-[#FF90E8] px-4 py-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-2">Home Images</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-800 max-w-3xl mx-auto font-medium">
            Upload your empty room photos and get professionally staged images in seconds
          </p>
        </motion.div>

        {/* Upload Container */}
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
            className={`relative bg-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-dashed transition-all duration-300 ${
              isDragOver 
                ? 'border-[#FACC15] bg-yellow-50' 
                : selectedFile 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-black'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-12 md:p-20 text-center">
              {selectedFile ? (
                /* File Selected State */
                <div className="space-y-6">
                  <div className="w-16 h-16 mx-auto bg-green-100 border-2 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-2 font-brand">File Ready!</h3>
                    <p className="text-gray-600 mb-6 font-medium">{selectedFile.name}</p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="px-6 py-3 border-2 border-black rounded-xl text-black font-bold hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                      >
                        Choose Different
                      </button>
                      <button className="px-8 py-3 bg-[#FACC15] text-black border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-all duration-200">
                        Stage This Image
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload State */
                <div className="space-y-8">
                  {/* Upload Icon */}
                  <div className="w-24 h-24 mx-auto bg-[#FF90E8] border-2 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-3">
                    <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>                  {/* Upload Button */}
                  <div>                    <AuthButton
                      size="lg"
                      hoverColor="bg-[#FACC15]"
                      redirectTo="/upload"
                      className="inline-flex items-center px-8 py-4 bg-[#FACC15] text-black text-xl font-black rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-1 transition-all duration-200"
                    >
                      Upload Image
                    </AuthButton>
                  </div>

                  {/* Drop Text */}
                  <div>
                    <p className="text-xl text-black font-bold mb-2 font-brand">or drop a file,</p>
                    <p className="text-base text-gray-600 font-medium">paste image or URL</p>
                  </div>

                  {/* Supported Formats */}
                  <div className="text-sm text-gray-500 font-medium">
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
          </motion.div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.4, staggerChildren: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mt-16"
          >
            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center"
            >
              <div className="w-12 h-12 mx-auto bg-purple-100 border-2 border-black rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold font-brand text-black mb-2">Lightning Fast</h3>
              <p className="text-gray-600 font-medium">Get your staged images in under 30 seconds</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center"
            >
              <div className="w-12 h-12 mx-auto bg-blue-100 border-2 border-black rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold font-brand text-black mb-2">Professional Quality</h3>
              <p className="text-gray-600 font-medium">AI-powered staging that looks realistic</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="text-center"
            >
              <div className="w-12 h-12 mx-auto bg-green-100 border-2 border-black rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold font-brand text-black mb-2">Cost Effective</h3>
              <p className="text-gray-600 font-medium">Save thousands compared to traditional staging</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
