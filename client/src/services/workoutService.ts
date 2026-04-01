import axios from "axios";

const API_BASE = "http://localhost:3000/api/v1";

const API = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // VERY IMPORTANT for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------- RESPONSE INTERCEPTOR ----------------
// 401 → redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export type Exercise = {
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

export type Workout = {
  _id?: string;
  name: string;
  category: "Strength" | "Cardio";
  duration: number;
  caloriesBurned: number;
  date: string;
  tags: string[];
  notes?: string;
  exercises: Exercise[];
};

// ---------------- API METHODS ----------------

export const getWorkouts = async (): Promise<Workout[]> => {
  const res = await API.get("/workout");
  return res.data.data;
};

export const addWorkout = async (workout: Workout) => {
  const res = await API.post("/addWorkout", workout);
  return res.data;
};

export const deleteWorkout = async (id: string) => {
  const res = await API.delete(`/deleteWorkout/${id}`);
  return res.data;
};

export const updateWorkout = async (id: string, workout: Workout) => {
  const res = await API.put(`/updateWorkout/${id}`, workout);
  return res.data;
};

export default API;
