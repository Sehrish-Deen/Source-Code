import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Types
export interface ReportData {
  overview: {
    currentWeight: number;
    targetWeight: number;
    totalWorkouts: number;
    totalCalories: number;
    totalDuration: number;
    streak: number;
    longestStreak: number;
  };
  periodData: {
    period: string;
    startDate: string;
    endDate: string;
    stats: {
      totalWorkouts: number;
      totalCalories: number;
      totalDuration: number;
      avgDuration: number;
      byCategory: {
        Strength: number;
        Cardio: number;
      };
    };
    workouts: Workout[];
  };
  weightHistory: WeightEntry[];
  performanceSummary: PerformanceEntry[];
  monthlyProgress: MonthlyProgress[];
  achievements: Achievement[];
  goals: Goals;
  lastCalculated: string;
}

export interface Workout {
  id: string;
  name: string;
  category: 'Strength' | 'Cardio';
  duration: number;
  calories: number;
  date: string;
}

export interface WeightEntry {
  weight: number;
  date: string;
}

export interface PerformanceEntry {
  activity: string;
  value: number;
  unit: string;
  date: string;
  category: string;
}

export interface MonthlyProgress {
  month: string;
  year: number;
  workoutsCompleted: number;
  caloriesBurned: number;
  totalDuration: number;
  weightChange?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon?: string;
}

export interface Goals {
  targetWeight: number;
  weeklyWorkoutGoal: number;
  monthlyCalorieGoal: number;
}

// 1. Get Reports Data
export const getReports = async (period: string = 'month'): Promise<ReportData> => {
  try {
    const response = await axios.get(`${API_URL}/reports`, {
      params: { period },
      withCredentials: true
    });
    
    // Backend se jo data aayega usme goal weight already progress wala hoga
    return response.data.data;
  } catch (error) {
    console.error('Get reports error:', error);
    
    if (error instanceof AxiosError) {
      const errorMessage = error.response?.data?.message || 'Failed to load reports';
      toast.error(errorMessage);
    } else {
      toast.error('Failed to load reports');
    }
    
    throw error;
  }
};

// 2. Export Report
export const exportReport = async (format: 'json' | 'csv', period: string = 'month'): Promise<void> => {
  try {
    const response = await axios.get(`${API_URL}/reports/export`, {
      params: { format, period },
      withCredentials: true,
      responseType: 'blob'
    });

    // Create download link
    const blob = new Blob([response.data], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fitness-report-${Date.now()}.${format}`);
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    toast.success(`Report exported as ${format.toUpperCase()}!`);
    
  } catch (error) {
    console.error('Export error:', error);
    
    if (error instanceof AxiosError) {
      const errorMessage = error.response?.data?.message || 'Failed to export report';
      toast.error(errorMessage);
    } else {
      toast.error('Failed to export report');
    }
    
    throw error;
  }
};