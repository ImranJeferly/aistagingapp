'use client';

import React, { useEffect, useState } from 'react';
import { 
  getAllReviews, 
  updateReviewStatus, 
  toggleReviewFeature, 
  deleteReview,
  createMockReview,
  Review 
} from '@/services/reviewService';
import { Star, Check, X, Trash2, Filter } from 'lucide-react';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const data = await getAllReviews();
    setReviews(data);
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateReviewStatus(id, status);
      // Optimistic update
      setReviews(reviews.map(r => r.id === id ? { ...r, status } : r));
    } catch (error) {
      console.error('Failed to update status', error);
      loadReviews(); // Revert on error
    }
  };

  const handleFeatureToggle = async (id: string, current: boolean) => {
    try {
      await toggleReviewFeature(id, !current);
      setReviews(reviews.map(r => r.id === id ? { ...r, featured: !current } : r));
    } catch (error) {
      console.error('Failed to toggle feature', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteReview(id);
        setReviews(reviews.filter(r => r.id !== id));
      } catch (error) {
        console.error('Failed to delete review', error);
      }
    }
  };

  const handleCreateMock = async () => {
      await createMockReview();
      loadReviews();
  };

  const filteredReviews = reviews.filter(r => filter === 'all' ? true : r.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-brand mb-2">User Reviews</h1>
          <p className="text-gray-600 font-medium">Manage and approve user testimonials</p>
        </div>
        <button 
            onClick={handleCreateMock}
            className="text-xs text-gray-500 underline hover:text-black"
        >
            + Add Test Review
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-bold border-2 transition-all capitalize ${
              filter === f 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-black'
            }`}
          >
            {f} {f !== 'all' && `(${reviews.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.length === 0 ? (
            <div className="col-span-full bg-white p-12 border-2 border-dashed border-black text-center rounded-xl">
              <p className="text-xl font-bold text-gray-400">No {filter} reviews found.</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full relative">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center font-bold text-lg overflow-hidden">
                        {review.userAvatar ? (
                            <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                        ) : (
                            review.userName?.charAt(0) || '?'
                        )}
                    </div>
                    <div>
                      <h3 className="font-bold leading-tight">{review.userName || 'Anonymous'}</h3>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            fill={i < review.rating ? "currentColor" : "none"} 
                            strokeWidth={3}
                            className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(review.status)} font-bold uppercase`}>
                    {review.status}
                  </span>
                </div>

                {/* Content */}
                <p className="text-gray-600 mb-6 flex-grow italic">"{review.text}"</p>
                
                {/* Date */}
                <div className="text-xs text-gray-400 mb-4 font-bold">
                    {review.createdAt?.seconds 
                        ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() 
                        : 'Just now'}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                    <div className="flex gap-2">
                        {review.status === 'pending' && (
                            <>
                                <button 
                                    onClick={() => handleStatusUpdate(review.id, 'approved')}
                                    className="p-2 bg-green-50 text-green-600 border-2 border-transparent hover:border-green-200 rounded hover:shadow-sm transition-all"
                                    title="Approve"
                                >
                                    <Check size={18} />
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(review.id, 'rejected')}
                                    className="p-2 bg-red-50 text-red-600 border-2 border-transparent hover:border-red-200 rounded hover:shadow-sm transition-all"
                                    title="Reject"
                                >
                                    <X size={18} />
                                </button>
                            </>
                        )}
                        {review.status === 'approved' && (
                             <button 
                                onClick={() => handleStatusUpdate(review.id, 'rejected')}
                                className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                            >
                                Reject
                            </button>
                        )}
                        {review.status === 'rejected' && (
                             <button 
                                onClick={() => handleStatusUpdate(review.id, 'approved')}
                                className="text-xs font-bold text-green-500 hover:text-green-700 underline"
                            >
                                Approve
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {review.status === 'approved' && (
                            <button
                                onClick={() => handleFeatureToggle(review.id, review.featured)}
                                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border-2 transition-all ${
                                    review.featured 
                                    ? 'bg-yellow-300 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-black'
                                }`}
                            >
                                <Star size={12} fill={review.featured ? "currentColor" : "none"} />
                                {review.featured ? 'Featured' : 'Feature'}
                            </button>
                        )}
                        
                        <button 
                            onClick={() => handleDelete(review.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
