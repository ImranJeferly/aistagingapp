"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, ThumbsUp } from 'lucide-react';
import { addReview } from '../services/reviewService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userAvatar?: string;
  onReviewSubmitted: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  userId,
  userName,
  userAvatar,
  onReviewSubmitted
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addReview(userId, userName, rating, comment, userAvatar);
      onReviewSubmitted();
      onClose();
      // Reset form
      setRating(0);
      setComment('');
    } catch (err) {
      console.error(err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden border-2 border-black"
          >
            {/* Header */}
            <div className="bg-[#FACC15] border-b-2 border-black p-6 text-black text-center relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white border-2 border-black rounded-full p-1 hover:bg-red-50 hover:scale-110 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px]"
              >
                <X size={16} />
              </button>
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <ThumbsUp size={32} className="text-black" />
              </div>
              <h2 className="text-2xl font-black font-brand mb-1 uppercase tracking-tight">Enjoying the App?</h2>
              <p className="text-black font-bold text-sm">We'd love to hear your feedback!</p>
            </div>

            {/* Body */}
            <div className="p-6 bg-white">
              <form onSubmit={handleSubmit}>
                {/* Star Rating */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={36}
                        strokeWidth={2.5}
                        className={`${
                          star <= (hoveredRating || rating)
                            ? 'fill-[#FACC15] text-black'
                            : 'fill-white text-gray-300'
                        } transition-colors duration-200 drop-shadow-sm`}
                      />
                    </button>
                  ))}
                </div>

                {/* Comment Area */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-black mb-2 font-brand uppercase">
                    Your Message (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-black focus:outline-none focus:ring-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all resize-none bg-white font-medium placeholder-gray-400"
                    rows={3}
                  />
                </div>

                {error && (
                  <p className="text-red-600 font-bold text-sm text-center mb-4 bg-red-50 p-2 border-2 border-red-200 rounded-lg">{error}</p>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-black bg-white text-black font-bold hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                  >
                    Maybe Later
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-black bg-[#8B5CF6] text-white font-bold hover:bg-[#7C3AED] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
