import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SlidingWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const SlidingWindow: React.FC<SlidingWindowProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  className = "",
  style
}) => {
  if (!isOpen) return null;

  const defaultStyle = {
    left: 'calc(50% - 860px - 140px)', // Moved even more to the right
    top: '40px'
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 animate-none" 
        onClick={onClose} 
      />
      
      {/* Sliding Window */}
      <div 
        className={`fixed w-[400px] h-[700px] bg-background border border-border shadow-2xl overflow-hidden pointer-events-auto flex flex-col z-50 rounded-xl animate-none [&_*]:animate-none motion-reduce:transition-none ${className}`}
        style={{ ...defaultStyle, ...style }}
      >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500/10 to-gray-800/10 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {icon && <span className="text-primary">{icon}</span>}
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-primary/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
           {/* Content */}
          <div className="flex-1 px-4 py-4 overflow-y-auto overflow-x-visible animate-none [&_*]:animate-none">
            {children}
          </div>
        </div>
      </>
    );
  };

export default SlidingWindow;