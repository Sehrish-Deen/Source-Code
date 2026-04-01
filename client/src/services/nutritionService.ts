// services/nutritionService.ts
import axios from "axios";

/* ------------------ Axios Instance ------------------ */

const API = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  withCredentials: true, // 🔥 REQUIRED for cookie-based auth
  headers: {
    "Content-Type": "application/json",
  },
});

/* ------------------ 401 Interceptor ------------------ */

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* ------------------ Types ------------------ */

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export interface Meal {
  id: string;
  type: MealType;
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  date: string;
}

/* ------------------ Backend Types ------------------ */

interface MealBackend {
  _id: string;
  mealType: MealType;
  foodName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  date: string;
}

interface GetMealsResponse {
  data: MealBackend[];
}

/* ------------------ Mapper ------------------ */

const mapMeal = (item: MealBackend): Meal => ({
  id: item._id,
  type: item.mealType,
  name: item.foodName,
  quantity: item.quantity,
  calories: item.calories,
  protein: item.protein,
  carbs: item.carbs,
  fats: item.fats,
  date: item.date.split("T")[0], // no timezone shift
});

/* ------------------ API Calls ------------------ */

export const getMeals = async (): Promise<Meal[]> => {
  const res = await API.get<GetMealsResponse>("/getNutrition");
  return res.data.data.map(mapMeal);
};

export const addMeal = async (meal: Omit<Meal, "id">) => {
  const res = await API.post("/addNutrition", {
    mealType: meal.type,
    foodName: meal.name,
    quantity: meal.quantity,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fats: meal.fats,
    date: meal.date,
  });

  return res.data;
};

export const deleteMeal = async (id: string) => {
  const res = await API.delete(`/deleteNutrition/${id}`);
  return res.data;
};

export default API;
