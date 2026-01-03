"use client";

import React, { useRef, useEffect } from 'react';

interface ChromaKeyVideoProps {
  src: string;
  className?: string;
  threshold?: number;
  keyColor?: 'white' | 'green';
}

export default function ChromaKeyVideo({ src, className = "", threshold = 200, keyColor = 'white' }: ChromaKeyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;

    const processFrame = () => {
      if (video.paused || video.ended) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      // Set canvas size to match video intrinsic size
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
      }

      if (canvas.width === 0 || canvas.height === 0) {
          animationFrameId = requestAnimationFrame(processFrame);
          return;
      }

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get pixel data
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      const length = data.length;

      // Chroma key
      for (let i = 0; i < length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (keyColor === 'white') {
          // If pixel is close to white
          if (r > threshold && g > threshold && b > threshold) {
            data[i + 3] = 0; // Set alpha to 0
          }
        } else if (keyColor === 'green') {
          // Green screen logic
          // If green is dominant and bright enough
          // Using a slightly more robust green detection
          if (g > 100 && g > r + 40 && g > b + 40) {
             data[i + 3] = 0;
          }
        }
      }

      ctx.putImageData(frame, 0, 0);
      animationFrameId = requestAnimationFrame(processFrame);
    };

    // Start processing loop
    animationFrameId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [threshold, keyColor]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        className="absolute opacity-0 pointer-events-none w-0 h-0" 
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
