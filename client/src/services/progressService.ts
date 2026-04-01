import axios, { AxiosError } from "axios";

const API_BASE = "http://localhost:3000/api/v1";

const API = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== RESPONSE INTERCEPTOR ====================

API.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ==================== GLOBAL ERROR HANDLER ====================

function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    console.error("API Error Status:", error.response?.status);
    console.error("API Error Data:", error.response?.data);
    console.error("API Error Message:", error.message);
  } else {
    console.error("Unexpected Error:", error);
  }

  throw error;
}

// ==================== TYPES ====================

export type WeightEntry = {
  _id?: string;
  date: string;
  weight: number;
};

export type BodyMeasurement = {
  _id?: string;
  date: string;
  chest: number;
  waist: number;
  hips: number;
  biceps: number;
  thighs: number;
};

export type PerformanceCategory = "Strength" | "Cardio" | "Endurance";
export type MetricType = "Weight" | "Time" | "Distance" | "Reps";

export type PerformanceEntry = {
  _id?: string;
  activityName: string;
  category: PerformanceCategory;
  metricType: MetricType;
  value: number;
  unit: string;
  date: string;
  notes: string;
};

export type ProgressData = {
  _id?: string;
  goalWeight?: number;
  weightHistory: WeightEntry[];
  bodyMeasurements: BodyMeasurement[];
  performanceData: PerformanceEntry[];
  createdBy: string;
};

// ==================== API METHODS ====================

// GET all progress data
// GET all progress data
export const getProgress = async (): Promise<ProgressData> => {
  try {
    const res = await API.get<{ data: ProgressData }>("/progress");
    
    // Ensure goalWeight is 0 if not present
    const data = res.data.data;
    return {
      goalWeight: data.goalWeight ?? 0, // 👈 Null coalescing
      weightHistory: data.weightHistory || [],
      bodyMeasurements: data.bodyMeasurements || [],
      performanceData: data.performanceData || [],
      createdBy: data.createdBy || ''
    };
  } catch (error: unknown) {
    handleApiError(error);
  }
};

// ==================== GOAL WEIGHT ====================

export const setGoalWeight = async (
  goalWeight: number
): Promise<{ goalWeight: number }> => {
  try {
    const res = await API.post<{ data: { goalWeight: number } }>(
      "/progress/goal-weight",
      { goalWeight }
    );

    return { goalWeight: res.data.data.goalWeight };
  } catch (error: unknown) {
    handleApiError(error);
  }
};

// ==================== WEIGHT ====================

export const addWeightEntry = async (
  weight: number,
  date?: string
): Promise<WeightEntry[]> => {
  try {
    const res = await API.post<{ data: WeightEntry[] }>(
      "/progress/weight",
      { weight, date }
    );

    return res.data.data;
  } catch (error: unknown) {
    handleApiError(error);
  }
};

export const deleteWeightEntry = async (
  entryId: string
): Promise<WeightEntry[]> => {
  try {
    const res = await API.delete<{ data: WeightEntry[] }>(
      `/progress/weight/${entryId}`
    );

    return res.data.data;
  } catch (error: unknown) {
    handleApiError(error);
  }
};

// ==================== MEASUREMENTS ====================

export const addBodyMeasurement = async (
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    biceps?: number;
    thighs?: number;
    date?: string;
  }
): Promise<BodyMeasurement[]> => {
  try {
    const res = await API.post<{ data: BodyMeasurement[] }>(
      "/progress/measurements",
      measurements
    );

    return res.data.data;
  } catch (error: unknown) {
    handleApiError(error);
  }
};

export const deleteBodyMeasurement = async (
  entryId: string
): Promise<BodyMeasurement[]> => {
  try {
    const res = await API.delete<{ data: BodyMeasurement[] }>(
      `/progress/measurements/${entryId}`
    );

    return res.data.data;
  } catch (error: unknown) {
    handleApiError(error);
  }
};

// ==================== PERFORMANCE ====================

export const addPerformanceEntry = async (
  entry: Omit<PerformanceEntry, "_id">
): Promise<PerformanceEntry[]> => {
  try {
    const res = await API.post<{ data: PerformanceEntry[] }>(
      "/progress/performance",
      entry
    );

    return res.data.data;
  } catch (error: unknown) {
    handleApiError(error);
  }
};

export const updatePerformanceEntry = async (
  entryId: string,
  updates: Partial<PerformanceEntry>
): Promise<PerformanceEntry[]> => {
  try {
    const res = await API.put<{ data: PerformanceEntry[] }>(
      `/progress/performance/${entryId}`,
      updates
    );

    return res.data.data;
  } catch (error: unknown) {
    handleApiError(error);
  }
};

export const deletePerformanceEntry = async (
  entryId: string
): Promise<PerformanceEntry[]> => {
  try {
    const res = await API.delete<{ data: PerformanceEntry[] }>(
      `/progress/performance/${entryId}`
    );

    return res.data.data;
  } catch (error: unknown) {
    handleApiError(error);
  }
};

// ==================== ACTIVITY STATS ====================

export const getActivityStats = async (
  activityName: string
): Promise<unknown> => {
  try {
    const res = await API.get(`/progress/performance/stats/${encodeURIComponent(activityName)}`);
    return res.data;
  } catch (error: unknown) {
    handleApiError(error);
  }
};

export default API;
