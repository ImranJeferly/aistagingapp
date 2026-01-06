'use client';

import { useState, useEffect, useRef } from 'react';
import { BlogPost, getPublishedPosts } from '@/services/blogService';
import Link from 'next/link';
import { Calendar, ArrowRight, User, Sparkles } from 'lucide-react';
import gsap from 'gsap';

export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  const headerRef = useRef(null);
  const badgeRef = useRef(null);
  const title1Ref = useRef(null);
  const title2Ref = useRef(null);
  const subtitleRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPublishedPosts();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);
  
  useEffect(() => {
    if (!loading && posts.length >= 0) {
      const tl = gsap.timeline({ defaults: { ease: "back.out(1.7)", duration: 1 } });
      
      // Badge animation
      if (badgeRef.current) {
        tl.fromTo(badgeRef.current, 
          { y: -30, opacity: 0, scale: 0.5, rotation: -15 },
          { y: 0, opacity: 1, scale: 1, rotation: -1, delay: 0.2 }
        );
      }
      
      // Title parts
      if (title1Ref.current) {
        tl.fromTo(title1Ref.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, ease: "power3.out" },
          "-=0.7"
        );
      }
      
      if (title2Ref.current) {
        tl.fromTo(title2Ref.current,
          { scale: 0, rotation: 10, opacity: 0 },
          { scale: 1, rotation: -2, opacity: 1, ease: "elastic.out(1, 0.5)" },
          "-=0.5"
        );
      }
      
      // Subtitle
      if (subtitleRef.current) {
        tl.fromTo(subtitleRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, ease: "power3.out" },
          "-=0.6"
        );
      }
      
      // Grid items
      if (gridRef.current) {
         const items = (gridRef.current as HTMLElement).children;
         if (items.length > 0) {
            gsap.fromTo(items,
              { y: 50, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power2.out", delay: 0.5 }
            );
         }
      }
    }
  }, [loading, posts]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5] pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Header Section */}
        <div ref={headerRef} className="text-center space-y-6 max-w-4xl mx-auto">
          <div ref={badgeRef} className="opacity-0 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black bg-[#E0F2FE] font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
            <Sparkles size={16} className="text-blue-600" />
            <span>Design Insights</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black font-brand tracking-tight leading-none">
            <span ref={title1Ref} className="inline-block opacity-0">Our Latest</span> <br/>
            <span className="relative inline-block mt-2">
              <span ref={title2Ref} className="relative z-10 bg-[#FF90E8] px-4 py-1 border-2 border-black transform -rotate-2 inline-block shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] opacity-0">Stories</span>
            </span>
          </h1>
          
          <div ref={subtitleRef} className="opacity-0">
            <p className="text-xl md:text-2xl text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed">
              Expert tips on virtual staging, interior design trends, and how to sell properties faster with AI.
            </p>
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="min-h-[200px]"></div>
        ) : posts.length > 0 ? (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {posts.map((post, index) => (
              <article 
                key={post.id} 
                className="group flex flex-col bg-white border-2 border-black 
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
                  hover:-translate-y-1 transition-all duration-300 overflow-hidden rounded-xl"
              >
                {/* Image */}
                <Link href={`/blogs/${post.id}`} className="block relative aspect-[4/3] overflow-hidden border-b-2 border-black cursor-pointer group-hover:opacity-90 transition-opacity">
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FAFAFA] flex items-center justify-center text-gray-400">
                      <span className="font-bold text-lg font-brand">No Cover Image</span>
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col items-start text-left">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold font-brand tracking-wide text-gray-500 mb-3 w-full">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <User size={12} />
                      Admin
                    </span>
                  </div>

                  <Link href={`/blogs/${post.id}`} className="block">
                    <h2 className="text-2xl font-black font-brand leading-tight mb-3 group-hover:text-[#8B5CF6] transition-colors">
                      {post.title}
                    </h2>
                  </Link>

                  <p className="text-gray-600 line-clamp-2 mb-6 text-sm font-medium leading-relaxed flex-1">
                    {post.excerpt}
                  </p>

                  <Link 
                    href={`/blogs/${post.id}`}
                    className="group/btn inline-flex items-center gap-2 font-black text-sm border-b-2 border-black hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors pb-0.5"
                  >
                    Read article <ArrowRight size={16} className="transform group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto rounded-xl">
            <h3 className="text-4xl font-black font-brand mb-4">No posts yet</h3>
            <p className="text-xl text-gray-600 font-medium">We're crafting some amazing content. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
