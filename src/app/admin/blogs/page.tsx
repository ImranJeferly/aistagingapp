'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlogPosts, BlogPost, deleteBlogPost } from '@/services/blogService';
import { Eye } from 'lucide-react';

export default function BlogsList() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      const data = await getBlogPosts();
      setBlogs(data);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    if (dateFilter === 'all') return true;
    
    // Safety check for creation date
    if (!blog.createdAt) return false;
    
    const blogDate = (blog.createdAt as any).seconds 
      ? new Date((blog.createdAt as any).seconds * 1000)
      : new Date(blog.createdAt);
      
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(dateFilter));
    
    return blogDate >= cutoff;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      await deleteBlogPost(id);
      loadBlogs();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black font-brand">Blog Posts</h1>
        <div className="flex gap-4">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border-2 border-black rounded px-3 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold outline-none"
          >
            <option value="all">All Time</option>
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
          </select>
          <Link 
            href="/admin/blogs/new"
            className="bg-[#A3E635] px-6 py-3 border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Create New Post
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBlogs.length === 0 ? (
            <div className="bg-white p-8 border-2 border-dashed border-black text-center">
              <p className="text-xl font-bold text-gray-400">
                {blogs.length === 0 ? "No blog posts yet." : "No posts found for this period."}
              </p>
            </div>
          ) : (
            filteredBlogs.map((blog) => (
              <div key={blog.id} className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {blog.coverImage && (
                    <img src={blog.coverImage} alt={blog.title} className="w-16 h-16 object-cover border-2 border-black" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{blog.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 border border-black font-bold ${blog.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {blog.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                      <span className="text-xs text-gray-500 py-1">
                        /blogs/{blog.slug}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 py-1 ml-2">
                        <Eye size={14} />
                        {blog.views || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(blog.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 border-2 border-transparent hover:border-red-200 rounded transition-colors"
                  >
                    Delete
                  </button>
                  <Link 
                    href={`/admin/blogs/${blog.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded transition-colors"
                  >
                    Edit
                  </Link>
                  <Link 
                    href={`/blogs/${blog.slug}`} 
                    target="_blank"
                    className="p-2 text-gray-600 hover:bg-gray-50 border-2 border-transparent hover:border-gray-200 rounded transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
