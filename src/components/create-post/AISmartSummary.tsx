import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';

interface AISmartSummaryProps {
  content: string;
}

const AISmartSummary: React.FC<AISmartSummaryProps> = ({ content }) => {
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (content.trim().length > 20) {
      // Simulate AI analysis
      const timer = setTimeout(() => {
        const words = content.trim().split(' ');
        const topic = words.length > 3 ? words.slice(0, 3).join(' ') : 'your thoughts';
        setSummary(`Your post shares a thoughtful update about ${topic}. Want to make it more engaging?`);
        setShowSummary(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowSummary(false);
    }
  }, [content]);

  return (
    <AnimatePresence>
      {showSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200/60 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-semibold text-purple-900">AI Smart Summary</h4>
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  <span>High Quality</span>
                </div>
              </div>
              <p className="text-xs text-purple-800 leading-relaxed">{summary}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AISmartSummary;
