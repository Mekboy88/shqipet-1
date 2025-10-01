
import { Post } from './types';

export const convertSupabasePost = (supabasePost: any): Post => {
  return {
    id: supabasePost.id,
    user_id: supabasePost.user_id,
    user: {
      name: supabasePost.user_name,
      image: supabasePost.user_image || '',
      verified: supabasePost.user_verified || false,
    },
    time: formatTimeAgo(supabasePost.created_at),
    visibility: supabasePost.visibility,
    isSponsored: supabasePost.is_sponsored || false,
    postType: supabasePost.post_type || 'regular', // Map post_type from database to postType
    content: {
      text: supabasePost.content_text,
      images: supabasePost.content_images,
    },
    reactions: {
      count: supabasePost.reactions_count || 0,
      types: supabasePost.reactions_types || [],
    },
    comments: supabasePost.comments_count || 0,
    shares: supabasePost.shares_count || 0,
  };
};

export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else {
    return `${diffInDays}d`;
  }
};
