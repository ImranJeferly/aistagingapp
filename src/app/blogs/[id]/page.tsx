'use client';

import { useState, useEffect, useRef } from 'react';
import { BlogPost, getBlogPost } from '@/services/blogService';
import Link from 'next/link';
import { Calendar, Twitter, Facebook, Linkedin, Clock } from 'lucide-react';
import { useParams } from 'next/navigation';
import gsap from 'gsap';
import { marked } from 'marked'; 

export default function BlogPostPage() {
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);
  const shareRef = useRef(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!params.id) return;
        
      try {
        const data = await getBlogPost(params.id as string);
        if (data) {
          setPost(data);
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  useEffect(() => {
    if (!loading && post) {
      document.title = post.title;
      
      const tl = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.8 } });
      
      if (headerRef.current) {
        tl.fromTo(headerRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1 }
        );
      }
      
      if (imageRef.current) {
        tl.fromTo(imageRef.current,
          { scale: 0.98, opacity: 0 },
          { scale: 1, opacity: 1, delay: 0.1 }
        );
      }
      
      if (contentRef.current) {
        tl.fromTo(contentRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1 },
          "-=0.4"
        );
      }
      
      if (shareRef.current) {
        tl.fromTo(shareRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1 },
          "-=0.2"
        );
      }
    }
  }, [loading, post]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = post?.title || 'Check out this article!';
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-[#F0F9FF] pt-32 flex justify-center">
            
        </div>
     );
  }

  if (!post) {
      return (
        <div className="min-h-screen bg-[#F0F9FF] pt-32 pb-20 px-4 text-center">
            <h1 className="text-4xl font-black font-brand mb-4">Post Not Found</h1>
            <Link href="/blogs" className="text-blue-600 font-bold underline">Return to Blogs</Link>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] pt-24 pb-20 relative overflow-hidden">
      {/* Wavy Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='200' viewBox='0 0 400 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 80 C 100 80 100 120 200 120 S 300 80 400 80' fill='none' stroke='%23ffffff' stroke-width='100'/%3E%3C/svg%3E")`,
            backgroundSize: '800px 400px',
          }}
        />
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <header ref={headerRef} className="mb-12 text-center max-w-3xl mx-auto opacity-0">
           <div className="flex justify-center mb-6">
               <span className="inline-flex items-center gap-2 bg-white border border-black px-4 py-1.5 rounded-full text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
                  <Calendar size={14} /> 
                  {formatDate(post.publishedAt)}
               </span>
           </div>
           
           <h1 className="text-4xl md:text-6xl font-black font-brand leading-[1.1] mb-6 tracking-tight text-black">
             {post.title}
           </h1>
           
           <p className="text-xl text-gray-600 font-medium leading-relaxed">
             {post.excerpt}
           </p>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
            <div ref={imageRef} className="mb-12 border-2 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-0">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img 
                 src={post.coverImage} 
                 alt={post.title} 
                 className="w-full h-auto object-cover max-h-[600px]"
               />
            </div>
        )}

        {/* Content Body */}
        <div ref={contentRef} className="prose prose-lg max-w-none opacity-0 prose-headings:font-brand prose-headings:font-black">
           <div dangerouslySetInnerHTML={{ 
             __html: marked.parse(
               post.content
             ).toString().replace(/&lt;CTA\s*\/?&gt;|<CTA\s*\/>/g, 
               `<div class="blog-cta-wrapper">
                  <div class="blog-cta-content">

                    <h3 class="blog-cta-title">Stage Your Listing Instantly</h3>
                    <p class="blog-cta-desc">Transform empty rooms into irresistible living spaces in seconds. AI-powered virtual staging that sells homes.</p>
                    <a href="/upload" class="blog-cta-btn">Start Staging Now →</a>
                  </div>
                </div>`
             )
           }} />
        </div>

        {/* Share Section */}
        <div ref={shareRef} className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-0">
            <h3 className="text-lg font-black font-brand">Share this article</h3>
            <div className="flex gap-3">
               <button onClick={() => handleShare('twitter')} className="p-3 bg-white text-black border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg">
                  <Twitter size={20} fill="currentColor" className="text-[#1DA1F2]" />
               </button>
               <button onClick={() => handleShare('facebook')} className="p-3 bg-white text-black border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg">
                  <Facebook size={20} fill="currentColor" className="text-[#4267B2]" />
               </button>
               <button onClick={() => handleShare('linkedin')} className="p-3 bg-white text-black border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg">
                  <Linkedin size={20} fill="currentColor" className="text-[#0077b5]" />
               </button>
            </div>
        </div>

      </article>
    </div>
  );
}
