'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createBlogPost, uploadBlogImage } from '@/services/blogService';
import BlogEditor from '@/components/admin/BlogEditor';

export default function NewBlogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    published: false
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    // Auto-generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    setFormData(prev => ({ ...prev, title, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = '';
      if (coverImage) {
        imageUrl = await uploadBlogImage(coverImage);
      }

      await createBlogPost({
        ...formData,
        coverImage: imageUrl,
        authorId: user?.uid
      });

      router.push('/admin/blogs');
    } catch (error) {
      console.error('Error creating blog:', error);
      alert('Failed to create blog post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black font-brand">Write New Blog</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <label className="block text-lg font-bold mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                placeholder="Enter blog title..."
                required
              />
            </div>

            <div>
              <label className="block text-lg font-bold mb-2">Content</label>
              <BlogEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              />
              <p className="text-sm text-gray-500 mt-2">Use the toolbar to format your post.</p>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-xl mb-4 text-[#A3E635] bg-black inline-block px-2">Publishing</h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                    className="w-6 h-6 border-2 border-black rounded focus:ring-0 checked:bg-black"
                  />
                  <span className="font-bold">Publish immediately</span>
                </label>

                <div className="pt-4 border-t-2 border-black border-dashed">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#A3E635] px-6 py-3 border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Post'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-xl mb-4 text-[#FF90E8] bg-black inline-block px-2">SEO & Metadata</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-sm mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-black rounded"
                    placeholder="url-slug"
                  />
                </div>

                <div>
                  <label className="block font-bold text-sm mb-1">Excerpt</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-black rounded h-24"
                    placeholder="Short description for SEO..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-xl mb-4 text-[#2DD4BF] bg-black inline-block px-2">Cover Image</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-black rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 bg-[#FDF4FF]" onClick={() => document.getElementById('cover-image-input')?.click()}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded border-2 border-black" />
                  ) : (
                    <div className="py-8">
                      <p className="font-bold text-gray-500">Click to upload</p>
                    </div>
                  )}
                  <input
                    id="cover-image-input"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
