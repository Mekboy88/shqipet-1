import React, { createContext, useContext, useState, useEffect } from 'react';

export interface NotificationSettings {
  // Notification Types
  enableSecurityNotifications: boolean;
  enableAccountNotifications: boolean;
  enableSystemNotifications: boolean;
  enableUpdateNotifications: boolean;
  
  // Priority Levels
  showHighPriority: boolean;
  showMediumPriority: boolean;
  showLowPriority: boolean;
  
  // Channels
  enableInAppNotifications: boolean;
  enableEmailNotifications: boolean;
  enableDesktopNotifications: boolean;
  
  // Timing
  enableQuietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  autoMarkAsReadAfter: number; // minutes
  
  // Display
  enableSoundAlerts: boolean;
  enableVisualAlerts: boolean;
  
  // Retention
  retentionDays: number;
}

const defaultSettings: NotificationSettings = {
  enableSecurityNotifications: true,
  enableAccountNotifications: true,
  enableSystemNotifications: true,
  enableUpdateNotifications: true,
  showHighPriority: true,
  showMediumPriority: true,
  showLowPriority: true,
  enableInAppNotifications: true,
  enableEmailNotifications: true,
  enableDesktopNotifications: true,
  enableQuietHours: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  autoMarkAsReadAfter: 0, // 0 means disabled
  enableSoundAlerts: true,
  enableVisualAlerts: true,
  retentionDays: 30,
};

interface NotificationSettingsContextType {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  resetSettings: () => void;
  isInQuietHours: () => boolean;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined);

export const useNotificationSettings = () => {
  const context = useContext(NotificationSettingsContext);
  if (!context) {
    throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider');
  }
  return context;
};

export const NotificationSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('notificationSettings');
  };

  const isInQuietHours = (): boolean => {
    if (!settings.enableQuietHours) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  const value = {
    settings,
    updateSettings,
    resetSettings,
    isInQuietHours,
  };

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
};