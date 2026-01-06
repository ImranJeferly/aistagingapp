'use client';

import { useEffect, useState } from 'react';
import { adminService, FeedbackReport } from '@/services/adminService';
import { ThumbsUp, ThumbsDown, User, Calendar, MessageSquare, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function ReportsPage() {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await adminService.getFeedbackReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000) 
      : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-4xl font-black font-brand">FEEDBACK REPORTS</h1>
           <p className="text-gray-600 mt-2">Monitor user feedback and issues</p>
        </div>
        <div className="bg-white px-4 py-2 border-2 border-black rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          Total Reports: {reports.length}
        </div>
      </div>

      <div className="grid gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="flex gap-6 items-start">
               {/* Status Icon */}
               <div className={`p-4 rounded-xl border-2 border-black ${
                 report.type === 'thumbs-up' ? 'bg-green-100' : 'bg-red-100'
               }`}>
                 {report.type === 'thumbs-up' ? (
                   <ThumbsUp size={32} className="text-green-600" />
                 ) : (
                   <ThumbsDown size={32} className="text-red-600" />
                 )}
               </div>

               <div className="flex-1 space-y-4">
                 <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        {report.isGuest ? 'Guest User' : (report.userName || 'Registered User')}
                        {report.isGuest && <span className="text-xs bg-gray-200 px-2 py-1 rounded border border-black">GUEST</span>}
                      </h3>
                      <div className="text-sm text-gray-500 font-mono mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {formatDate(report.feedbackSubmittedAt)}</span>
                        {report.userEmail && <span className="flex items-center gap-1"><User size={14}/> {report.userEmail}</span>}
                      </div>
                    </div>
                 </div>

                 {/* Comment Section */}
                 {report.comment && (
                   <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-lg">
                     <div className="flex gap-2 text-gray-700 font-medium">
                        <MessageSquare size={18} className="mt-1 flex-shrink-0" />
                        <p>"{report.comment}"</p>
                     </div>
                   </div>
                 )}

                 {/* Images */}
                 <div className="flex gap-4">
                    {report.originalImageUrl ? (
                      <div className="relative group w-32 h-32 bg-gray-100 rounded-lg border-2 border-black overflow-hidden">
                        <Image 
                           src={report.originalImageUrl} 
                           alt="Original" 
                           fill 
                           className="object-cover"
                        />
                         <a 
                          href={report.originalImageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold"
                        >
                          View Original
                        </a>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-black flex items-center justify-center text-gray-400">
                        <span className="text-xs text-center p-2">No Original Image</span>
                      </div>
                    )}

                    {report.stagedImageUrl ? (
                      <div className="relative group w-32 h-32 bg-gray-100 rounded-lg border-2 border-black overflow-hidden">
                        <Image 
                           src={report.stagedImageUrl} 
                           alt="Result" 
                           fill 
                           className="object-cover"
                        />
                        <a 
                          href={report.stagedImageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold"
                        >
                          View Result
                        </a>
                      </div>
                    ) : null}
                 </div>
               </div>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-12 bg-white border-2 border-black rounded-xl border-dashed">
            <h3 className="text-xl font-bold text-gray-400">No reports found</h3>
            <p className="text-gray-400">Feedback submitted by users will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
