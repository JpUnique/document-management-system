import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { Activity, ActivityStats } from '@/types/activity';

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  getActivityStats: (days: number) => ActivityStats[];
  getRecentActivities: (limit: number) => Activity[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

const STORAGE_KEY = 'docmanager_activities';

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load activities from localStorage on mount
  useEffect(() => {
    console.log('ActivityContext: Loading activities from localStorage');
    const savedActivities = localStorage.getItem(STORAGE_KEY);
    if (savedActivities) {
      try {
        const parsed = JSON.parse(savedActivities);
        console.log('ActivityContext: Loaded activities:', parsed.length);
        setActivities(parsed);
      } catch (e) {
        console.error('ActivityContext: Failed to parse activities:', e);
        setActivities([]);
      }
    } else {
      console.log('ActivityContext: No activities found in localStorage');
      setActivities([]);
    }
  }, []);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    console.log('ActivityContext: Saving activities to localStorage, count:', activities.length);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    console.log('=== ACTIVITY CONTEXT: ADD ACTIVITY ===');
    console.log('Activity to add:', activity);
    
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    console.log('New activity created:', newActivity);
    
    setActivities(prev => {
      const updated = [newActivity, ...prev];
      console.log('ActivityContext: Updated activities array, total:', updated.length);
      
      // Force immediate save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log('ActivityContext: Force saved to localStorage');
      
      return updated;
    });
    
    console.log('ActivityContext: addActivity completed');
  }, []);

  const getActivityStats = useCallback((days: number): ActivityStats[] => {
    console.log('ActivityContext: getActivityStats called, days:', days, 'total activities:', activities.length);
    
    const stats: ActivityStats[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= date && activityDate < nextDate;
      });
      
      // Use local date parts to avoid UTC conversion shifting the day
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      stats.push({
        date: `${year}-${month}-${day}`,
        uploads: dayActivities.filter(a => a.type === 'upload').length,
        edits: dayActivities.filter(a => a.type === 'edit').length,
        views: dayActivities.filter(a => a.type === 'view').length,
        shares: dayActivities.filter(a => a.type === 'share').length,
        total: dayActivities.length
      });
    }
    
    console.log('ActivityContext: Calculated stats:', stats);
    return stats;
  }, [activities]);

  const getRecentActivities = useCallback((limit: number): Activity[] => {
    const recent = activities.slice(0, limit);
    console.log('ActivityContext: getRecentActivities, limit:', limit, 'returned:', recent.length);
    return recent;
  }, [activities]);

  const value = {
    activities,
    addActivity,
    getActivityStats,
    getRecentActivities
  };

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
};