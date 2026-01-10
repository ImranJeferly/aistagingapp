import { getBlogPostServer } from '@/lib/blog-server';
import BlogPostClient from './BlogPostClient';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getBlogPostServer(id);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
        title: post.title,
        description: post.excerpt,
        images: post.coverImage ? [post.coverImage] : [],
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getBlogPostServer(id);

  return <BlogPostClient post={post} />;
}
