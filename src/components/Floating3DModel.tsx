'use client';

import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

interface ModelProps {
  url: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}

function Model({ url, scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], mouse }: ModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  
  // Fix texture artifacts (black lines)
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        
        materials.forEach((mat) => {
          if ((mat as THREE.MeshStandardMaterial).map) {
            // Disable mipmapping to prevent black background bleeding at UV edges
            (mat as THREE.MeshStandardMaterial).map!.minFilter = THREE.LinearFilter;
            (mat as THREE.MeshStandardMaterial).map!.generateMipmaps = false;
            (mat as THREE.MeshStandardMaterial).map!.needsUpdate = true;
          }
          // Ensure material is not transparent unless necessary to avoid depth sorting issues
          mat.transparent = false;
          mat.needsUpdate = true;
        });
      }
    });
  }, [scene]);

  // Initial animation
  useEffect(() => {
    if (modelRef.current) {
      // Start from small scale
      modelRef.current.scale.set(0, 0, 0);
      
      // Pop in animation
      gsap.to(modelRef.current.scale, {
        x: scale,
        y: scale,
        z: scale,
        duration: 1.2,
        ease: "back.out(1.5)",
        delay: 0.2
      });

      // Continuous floating animation (bobbing up and down)
      gsap.to(modelRef.current.position, {
        y: 0.1, // Relative to Center
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }
  }, [scale]);

  useFrame(() => {
    if (!modelRef.current) return;

    // Mouse interaction - slight rotation based on GLOBAL mouse position
    const targetRotationX = rotation[0] + (mouse.current.y * 0.6); // Tilt up/down
    const targetRotationY = rotation[1] + (mouse.current.x * 0.6); // Turn left/right

    // Smooth interpolation for rotation
    modelRef.current.rotation.x = THREE.MathUtils.lerp(modelRef.current.rotation.x, targetRotationX, 0.1);
    modelRef.current.rotation.y = THREE.MathUtils.lerp(modelRef.current.rotation.y, targetRotationY, 0.1);
  });

  return (
    <Center position={position}>
      <primitive object={scene} ref={modelRef} rotation={rotation} />
    </Center>
  );
}

interface Floating3DModelProps {
  modelPath: string;
  position: { top?: string; left?: string; right?: string; bottom?: string };
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  environmentPreset?: 'city' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'park' | 'lobby' | 'matrix';
  rotation?: [number, number, number];
  scale?: number;
}

export default function Floating3DModel({ 
  modelPath, 
  position, 
  size = 'md',
  className = '',
  environmentPreset = 'city',
  rotation = [0.1, -0.2, 0],
  scale
}: Floating3DModelProps) {
  
  // Track mouse position globally
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse position (-1 to 1)
      mouse.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Map size to container dimensions - Back to original icon sizes
  const sizeMap = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-80 h-80',
    xxl: 'w-96 h-96'
  };

  // Adjusted scales to fit within the smaller frames
  const scaleMap = {
    sm: 1.2,
    md: 2.0,
    lg: 3.0,
    xl: 4.0,
    xxl: 5.0
  };

  return (
    <div 
      className={`absolute z-20 hidden md:block ${sizeMap[size]} ${className}`}
      style={{ ...position }}
    >
      {/* pointer-events-none on container to let clicks pass through if not on model */}
      <div className="w-full h-full pointer-events-none">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ alpha: true, antialias: true }}>
          <Suspense fallback={null}>
            {/* Custom warm lighting to match request */}
            <ambientLight intensity={1} color="#FFFAEA" />
            <directionalLight position={[5, 10, 7]} intensity={1} color="#FFFAEA" />
            
            {/* Environment for reflections */}
            <Environment preset="city" environmentIntensity={1.2} />
            
            <Model 
              url={modelPath} 
              scale={scale || scaleMap[size]} 
              rotation={rotation} 
              mouse={mouse}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
