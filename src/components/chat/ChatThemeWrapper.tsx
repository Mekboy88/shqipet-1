import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatThemeWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const ChatThemeWrapper: React.FC<ChatThemeWrapperProps> = ({ children, className = '' }) => {
  const { theme } = useTheme();

  const themeClasses = {
    'coral-reef': 'theme-coral-reef',
    'sage-green': 'theme-sage-green',
    'amethyst': 'theme-amethyst',
    'peach-cream': 'theme-peach-cream',
    'rose-quartz': 'theme-rose-quartz',
    'seafoam': 'theme-seafoam',
    'honey-amber': 'theme-honey-amber',
    'steel-blue': 'theme-steel-blue',
    'snow-white': 'theme-snow-white',
    'warning-red': 'theme-warning-red',
    'twilight-indigo': 'theme-twilight-indigo',
    'notification-clean': 'theme-notification-clean',
    'crimson-feed': 'theme-crimson-feed'
  };

  return (
    <div className={`${themeClasses[theme]} ${className}`}>
      {children}
    </div>
  );
};

export default ChatThemeWrapper;