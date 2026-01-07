'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ComparisonViewer from '@/components/ComparisonViewer';
import { exploreService, StagedImage } from '@/services/exploreService';

export default function ExploreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [image, setImage] = useState<StagedImage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const foundImage = await exploreService.getPublicImageById(resolvedParams.id);
        if (foundImage) {
          setImage(foundImage);
        }
      } catch (error) {
        console.error("Error loading image details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [resolvedParams.id]);

  return (
    <div className="min-h-screen bg-[#E0F2FE] flex flex-col relative overflow-hidden">
      {/* Hypnosis Background Effect - Blue */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax] animate-[spin_20s_linear_infinite] opacity-40"
          style={{
            background: 'repeating-conic-gradient(from 0deg, #93c5fd 0deg 15deg, transparent 15deg 30deg)'
          }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <Navigation />
      
        <div className="flex-1 pt-28 pb-12 px-4 md:px-8">
         <div className="max-w-6xl mx-auto h-full flex flex-col">
             
             {/* Simple Header */}
             <div className="mb-6 flex items-center justify-between">
                 <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold"
                 >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                     </svg>
                     Back
                 </button>
             </div>

             {/* Main Content Area */}
             <div className="flex-1 bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col min-h-[500px]">
                 {loading ? (
                    <div className="flex-1 flex flex-col justify-center items-center p-12">
                         <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-black border-r-transparent mb-6"></div>
                         <h2 className="text-2xl font-black font-brand">Loading Transformation...</h2>
                    </div>
                 ) : !image ? (
                    <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                        <div className="mb-6 bg-red-100 p-6 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                             <span className="text-4xl">😕</span>
                        </div>
                        <h1 className="text-4xl font-brand font-bold mb-4">Image Not Found</h1>
                        <p className="text-gray-600 mb-8 max-w-md">The visualization you are looking for might have been removed or is temporarily unavailable.</p>
                        <button onClick={() => router.push('/explore')} className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(100,100,100,1)]">
                            Browse Gallery
                        </button>
                    </div>
                 ) : (
                     <div className="relative h-full flex flex-col">
                        <ComparisonViewer 
                            beforeImage={image.originalImageUrl || image.imageUrl} 
                            afterImage={image.imageUrl} 
                        />
                        
                        {/* Info Bar at bottom of image if needed */}
                        <div className="bg-white border-t-2 border-black p-6 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-xl uppercase">{image.roomType}</h3>
                                <p className="text-gray-500 font-bold">{image.designStyle} Style</p>
                            </div>
                            {/* Removed username display as per request */}
                            {/* <div className="text-sm font-bold bg-green-100 px-3 py-1 rounded-full border border-black">
                                Staged by {image.userName || 'Anonymous'}
                            </div> */}
                        </div>
                     </div>
                 )}
             </div>

         </div>
      </div>
      
      <Footer />
      </div>
    </div>
  );
}
