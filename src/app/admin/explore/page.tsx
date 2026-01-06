'use client';

import { useState, useEffect } from 'react';
import { exploreService, StagedImage, ExploreStatus } from '@/services/exploreService';
import { Check, X, Clock, User, Calendar, Image as ImageIcon } from 'lucide-react';
import Badge from '@/components/Badge';

export default function AdminExplorePage() {
  const [images, setImages] = useState<StagedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ExploreStatus | 'all'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await exploreService.getAllStagedImages(100);
      setImages(data);
    } catch (error) {
      console.error("Failed to fetch images", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (imageId: string, status: ExploreStatus) => {
    setProcessingId(imageId);
    try {
      await exploreService.updateExploreStatus(imageId, status);
      // Update local state
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, exploreStatus: status } : img
      ));
    } catch (error) {
      console.error(`Failed to update status to ${status}`, error);
      alert('Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredImages = images.filter(img => 
    activeTab === 'all' ? true : img.exploreStatus === activeTab
  );

  const pendingCount = images.filter(img => img.exploreStatus === 'pending').length;
  const approvedCount = images.filter(img => img.exploreStatus === 'approved').length;
  const rejectedCount = images.filter(img => img.exploreStatus === 'rejected').length;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    // Handle Firestore Timestamp or JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-brand mb-2">EXPLORE GALLERY</h1>
          <p className="text-gray-600 font-medium">Manage user staged images and featured content.</p>
        </div>
        <div className="flex gap-2">
           <button 
                onClick={fetchImages} 
                className="px-4 py-2 border-2 border-black font-bold bg-white hover:bg-gray-50 transition-colors"
           >
                Refresh
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black pb-4">
        {[
          { id: 'all', label: 'All Images', count: images.length, color: 'bg-gray-200' },
          { id: 'pending', label: 'Pending', count: pendingCount, color: 'bg-yellow-200' },
          { id: 'approved', label: 'Approved', count: approvedCount, color: 'bg-green-200' },
          { id: 'rejected', label: 'Rejected', count: rejectedCount, color: 'bg-red-200' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-4 py-2 font-bold border-2 transition-all flex items-center gap-2
              ${activeTab === tab.id 
                ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] translate-y-[-2px]' 
                : 'bg-white border-black text-black hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
            <span className={`text-xs px-2 py-0.5 rounded-full border border-black ${
              activeTab === tab.id ? 'bg-white text-black' : tab.color
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No images found</h3>
          <p className="text-gray-500">There are no images in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div 
              key={image.id} 
              className="bg-white border-2 border-black p-4 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] transition-all"
            >
              {/* Image Thumbnail */}
              <div className="relative aspect-[4/3] bg-gray-100 border border-black overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={image.imageUrl} 
                  alt="Staged result" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <a 
                     href={image.imageUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="bg-white text-black px-3 py-1 font-bold text-sm border border-black hover:bg-gray-100"
                   >
                     View Full
                   </a>
                   {image.originalImageUrl && (
                     <a 
                       href={image.originalImageUrl} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="bg-white text-black px-3 py-1 font-bold text-sm border border-black hover:bg-gray-100"
                     >
                       Original
                     </a>
                   )}
                </div>
                {/* Status Badge Overlay */}
                <div className="absolute top-2 right-2">
                   {image.exploreStatus === 'approved' && <Badge isStatic className="!bg-[#A3E635]">Featured</Badge>}
                   {image.exploreStatus === 'rejected' && <Badge isStatic className="!bg-red-500 !text-white">Rejected</Badge>}
                   {image.exploreStatus === 'pending' && <Badge isStatic className="!bg-yellow-400">Pending</Badge>}
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User size={14} />
                  <span className="truncate flex-1" title={image.userId}>User: {image.userId.substring(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} />
                  <span className="truncate">{formatDate(image.createdAt)}</span>
                </div>
                {image.designStyle && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-bold">Style:</span> {image.designStyle}
                    </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t-2 border-gray-100">
                <button
                  onClick={() => handleStatusUpdate(image.id, 'approved')}
                  disabled={processingId === image.id || image.exploreStatus === 'approved'}
                  className={`
                    flex items-center justify-center gap-2 px-2 py-2 text-sm font-bold border-2 transition-all
                    ${image.exploreStatus === 'approved'
                      ? 'bg-green-100 border-green-500 text-green-700 opacity-50 cursor-not-allowed'
                      : 'bg-white border-black hover:bg-green-50 hover:border-green-600 hover:text-green-700'
                    }
                  `}
                >
                  <Check size={14} />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(image.id, 'rejected')}
                  disabled={processingId === image.id || image.exploreStatus === 'rejected'}
                  className={`
                    flex items-center justify-center gap-2 px-2 py-2 text-sm font-bold border-2 transition-all
                    ${image.exploreStatus === 'rejected'
                      ? 'bg-red-100 border-red-500 text-red-700 opacity-50 cursor-not-allowed'
                      : 'bg-white border-black hover:bg-red-50 hover:border-red-600 hover:text-red-700'
                    }
                  `}
                >
                  <X size={14} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
