
import React from 'react';
import { Globe } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import UniversalPhotoGrid from '@/components/shared/UniversalPhotoGrid';
import { MonthGroup } from './types';
import { Post as PostData } from '@/contexts/posts/types';

interface GridViewProps {
  postsByMonth: MonthGroup[];
}

const GridView: React.FC<GridViewProps> = ({ postsByMonth }) => {
  return (
    <div className="space-y-8">
      {postsByMonth.map((group, groupIndex) => (
        <div key={groupIndex} className="bg-white rounded-lg p-4">
          <h2 className="text-2xl font-bold mb-4">{group.month} {group.year}</h2>
          
          <div className="grid grid-cols-3 gap-4">
            {group.posts.map((post: PostData) => (
              <div key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                {/* Post images using PhotoGrid with fixed height */}
                <div className="w-full h-48">
                  {post.content.images && post.content.images.length > 0 ? (
                    <UniversalPhotoGrid 
                      media={post.content.images || []} 
                      videos={[]}
                      onMediaClick={(index) => console.log('Grid media clicked:', index)}
                    />
                  ) : (
                    <div className="h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                
                {/* User info and post details with compact design */}
                <div className="p-2 border-t border-gray-200">
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={post.user.image} 
                        alt={post.user.name} 
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap">
                        <span className="font-medium text-sm truncate">{post.user.name}</span>
                        {post.content.text && (
                          <p className="text-xs text-gray-600 w-full mt-0.5 line-clamp-1">{post.content.text}</p>
                        )}
                      </div>
                      <div className="flex items-center text-gray-500 text-xs mt-0.5">
                        <span className="truncate">{post.time}</span>
                        {post.visibility === 'public' && (
                          <Globe className="h-3 w-3 ml-1 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GridView;
