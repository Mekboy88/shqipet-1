
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Post } from './types';
import { convertSupabasePost } from './utils';

export const usePostsData = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Don't show loading by default for profiles
  const { user } = useAuth();

  // Enhanced video file detection - more comprehensive
  const isVideoFile = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.3gp', '.ogg', '.ogv', '.flv', '.wmv'];
    const lowerUrl = url.toLowerCase();
    
    // Check for direct video extensions
    const hasVideoExtension = videoExtensions.some(ext => lowerUrl.includes(ext));
    
    // Check for video indicators in URL
    const hasVideoIndicator = lowerUrl.includes('video') || lowerUrl.includes('mp4');
    
    // Check for Supabase storage video files
    const isSupabaseVideo = url.includes('supabase') && (lowerUrl.includes('mp4') || lowerUrl.includes('video') || lowerUrl.includes('webm'));
    
    // Check MIME type indicators in URL
    const hasMimeType = lowerUrl.includes('video/');
    
    console.log('Video detection for:', url, {
      hasVideoExtension,
      hasVideoIndicator,
      isSupabaseVideo,
      hasMimeType,
      result: hasVideoExtension || hasVideoIndicator || isSupabaseVideo || hasMimeType
    });
    
    return hasVideoExtension || hasVideoIndicator || isSupabaseVideo || hasMimeType;
  };

  // Fetch posts from Supabase with controlled loading for profile
  const fetchPosts = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const { data, error } = await supabase
        .schema('api')
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      const convertedPosts = data?.map(convertSupabasePost) || [];

      // Debug logging for video detection
      console.log('Posts fetched and converted:', {
        totalPosts: convertedPosts.length,
        postsWithImages: convertedPosts.filter(post => post.content.images && post.content.images.length > 0).length,
        videoPosts: convertedPosts.filter(post => 
          post.content.images?.some(url => isVideoFile(url))
        ).length,
        allPostsWithUrls: convertedPosts.map(post => ({
          id: post.id,
          hasImages: !!post.content.images,
          imageCount: post.content.images?.length || 0,
          images: post.content.images,
          videoFiles: post.content.images?.filter(isVideoFile) || []
        }))
      });

      setPosts(convertedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // Add new post to Supabase using safe function to bypass RLS issues
  const addPost = async (newPost: Omit<Post, 'id' | 'user_id' | 'reactions' | 'comments' | 'shares'>) => {
    if (!user) {
      toast.error('You must be logged in to create posts');
      throw new Error('User not logged in');
    }

    try {
      console.log('Creating post with safe function for user:', user.id);
      console.log('Post data:', newPost);

      // Use the safe function to create posts and bypass RLS permission issues
      const { data, error } = await supabase.rpc('create_post_safe', {
        p_user_id: user.id,
        p_user_name: newPost.user.name,
        p_user_image: newPost.user.image,
        p_user_verified: newPost.user.verified || false,
        p_content_text: newPost.content.text,
        p_content_images: newPost.content.images,
        p_visibility: newPost.visibility || 'public',
        p_is_sponsored: newPost.isSponsored || false,
        p_post_type: newPost.postType || 'regular'
      });

      if (error) {
        console.error('Error creating post with safe function:', error);
        throw error;
      }

      console.log('Post created successfully with safe function:', data);
      
      // Convert the returned post data and add to state
      if (data) {
        const newConvertedPost = convertSupabasePost(data);
        setPosts(prevPosts => [newConvertedPost, ...prevPosts]);
        toast.success('Post created successfully!');
      }
      
      // Refresh all posts to ensure consistency
      await fetchPosts();
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post - please try again');
      throw error;
    }
  };

  // Soft delete post - marks as deleted but keeps in database for 60 days
  const deletePost = async (postId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete posts');
      throw new Error('User not logged in');
    }

    if (!postId) {
      toast.error('Post ID is required');
      throw new Error('Post ID is required');
    }

    try {
      console.log('Starting soft deletion process for post:', postId);

      // Use the soft delete function
      const { error } = await supabase.rpc('soft_delete_post', {
        post_id_param: postId
      });

      if (error) {
        console.error('Error soft deleting post:', error);
        throw new Error('Failed to delete post from database');
      }

      console.log('Successfully soft deleted post from database:', postId);

      // Update local state immediately - remove from visible posts
      setPosts(prevPosts => {
        const updatedPosts = prevPosts.filter(post => post.id !== postId);
        console.log('Updated local posts state, removed post:', postId);
        return updatedPosts;
      });

      toast.success('Post deleted successfully - you have 60 days to recover it if needed');

    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
      throw error;
    }
  };

  // Restore a deleted post
  const restorePost = async (postId: string) => {
    if (!user) {
      toast.error('You must be logged in to restore posts');
      throw new Error('User not logged in');
    }

    try {
      console.log('Restoring post:', postId);

      const { error } = await supabase.rpc('restore_post', {
        post_id_param: postId
      });

      if (error) {
        console.error('Error restoring post:', error);
        throw new Error('Failed to restore post');
      }

      console.log('Successfully restored post:', postId);
      
      // Refresh posts to show the restored post
      await fetchPosts();
      
      toast.success('Post restored successfully');

    } catch (error) {
      console.error('Error restoring post:', error);
      toast.error('Failed to restore post');
      throw error;
    }
  };

  return {
    posts,
    setPosts,
    isLoading,
    fetchPosts,
    addPost,
    deletePost,
    restorePost
  };
};
