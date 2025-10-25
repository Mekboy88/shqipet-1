import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, BarChart3, Lightbulb, Hash, Users, Heart, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PostInsightsPanelProps {
  isVisible: boolean;
}

const PostInsightsPanel: React.FC<PostInsightsPanelProps> = ({ isVisible }) => {
  const trendingTags = [
    { tag: '#ShqipetCulture', count: '12.4K', trend: 'up' },
    { tag: '#TechNews', count: '8.2K', trend: 'up' },
    { tag: '#Photography', count: '6.7K', trend: 'up' },
    { tag: '#Travel', count: '5.3K', trend: 'down' },
    { tag: '#FoodLovers', count: '4.9K', trend: 'up' },
  ];

  const styleTips = [
    { icon: Heart, tip: 'Posts with emojis get 23% more reactions', color: 'text-red-500' },
    { icon: MessageSquare, tip: 'Questions increase comments by 35%', color: 'text-blue-500' },
    { icon: Users, tip: 'Tag 2-3 people for better engagement', color: 'text-purple-500' },
    { icon: Hash, tip: 'Use 3-5 hashtags for optimal reach', color: 'text-green-500' },
  ];

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3 }}
      className="fixed right-4 top-[72px] w-[380px] h-[calc(100vh-88px)] overflow-y-auto space-y-4 pb-4"
    >
      {/* Best Time to Post */}
      <Card className="p-5 bg-white/70 backdrop-blur-xl border-gray-200/60 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">Best Time to Post</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Today's Peak Hours</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">Active Now</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg text-center">
              <p className="text-xs text-gray-600">Morning</p>
              <p className="font-bold text-green-700">8-10 AM</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-center">
              <p className="text-xs text-gray-600">Lunch</p>
              <p className="font-bold text-blue-700">12-2 PM</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg text-center">
              <p className="text-xs text-gray-600">Evening</p>
              <p className="font-bold text-purple-700">7-9 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>1,234 of your followers are online now</span>
          </div>
        </div>
      </Card>

      {/* Trending Tags */}
      <Card className="p-5 bg-white/70 backdrop-blur-xl border-gray-200/60 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-800">Trending Tags</h3>
        </div>
        <div className="space-y-2">
          {trendingTags.map((item, idx) => (
            <button
              key={idx}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="font-medium text-sm text-gray-700 group-hover:text-blue-600">
                  {item.tag.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{item.count}</span>
                <TrendingUp className={`w-3 h-3 ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Post Health Meter */}
      <Card className="p-5 bg-white/70 backdrop-blur-xl border-gray-200/60 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-800">Post Health Meter</h3>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Content Quality</span>
              <span className="text-xs font-medium text-gray-500">60%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 w-[60%] transition-all duration-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Media Included</span>
              <span className="text-xs font-medium text-red-500">0%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 w-0 transition-all duration-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Hashtags</span>
              <span className="text-xs font-medium text-red-500">0%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 w-0 transition-all duration-500" />
            </div>
          </div>
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 Add images and hashtags to boost your post's reach by up to 40%!
            </p>
          </div>
        </div>
      </Card>

      {/* Style Tips */}
      <Card className="p-5 bg-white/70 backdrop-blur-xl border-gray-200/60 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-800">Style Tips</h3>
        </div>
        <div className="space-y-3">
          {styleTips.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
              <p className="text-sm text-gray-700">{item.tip}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      <Card className="p-5 bg-gradient-to-br from-red-50 to-purple-50 border-red-200/60 shadow-md">
        <h4 className="font-semibold text-gray-800 mb-3">Your Recent Performance</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">156</p>
            <p className="text-xs text-gray-600">Avg. Likes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">42</p>
            <p className="text-xs text-gray-600">Avg. Comments</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">89</p>
            <p className="text-xs text-gray-600">Avg. Shares</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default PostInsightsPanel;
