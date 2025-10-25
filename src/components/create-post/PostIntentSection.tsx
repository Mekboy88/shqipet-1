import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Megaphone, MessageCircle, Image, Sparkles } from 'lucide-react';

interface PostIntentSectionProps {
  selectedIntent: string;
  onSelectIntent: (intent: string) => void;
}

const PostIntentSection: React.FC<PostIntentSectionProps> = ({ selectedIntent, onSelectIntent }) => {
  const intents = [
    { id: 'emotion', label: 'Emotion / Opinion', icon: Heart, color: 'from-pink-500 to-rose-500' },
    { id: 'announcement', label: 'Announcement', icon: Megaphone, color: 'from-blue-500 to-cyan-500' },
    { id: 'discussion', label: 'Discussion', icon: MessageCircle, color: 'from-purple-500 to-indigo-500' },
    { id: 'showcase', label: 'Showcase', icon: Image, color: 'from-amber-500 to-orange-500' },
    { id: 'thankfulness', label: 'Thankfulness', icon: Sparkles, color: 'from-green-500 to-emerald-500' },
  ];

  return (
    <div className="border-t border-gray-200 pt-4 mb-4">
      <p className="text-sm font-medium text-gray-700 mb-3">Post Category</p>
      <div className="grid grid-cols-2 gap-2">
        {intents.map((intent) => (
          <motion.button
            key={intent.id}
            onClick={() => onSelectIntent(intent.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
              selectedIntent === intent.id
                ? `bg-gradient-to-r ${intent.color} text-white shadow-md`
                : 'bg-white/50 hover:bg-white/80 text-gray-700'
            }`}
          >
            <intent.icon className="w-4 h-4" />
            <span className="text-xs font-medium">{intent.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PostIntentSection;
