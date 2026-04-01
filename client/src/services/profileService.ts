import API from "./workoutService"; 
// same axios instance reuse kar rahe hain (withCredentials + interceptor already set)

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  profilePicture: string;
  weight: number;
  height: number;
  age: number;
  goal: string;
  createdAt: string;
  updatedAt: string;
}

// GET PROFILE
export const getProfile = async (): Promise<UserProfile> => {
  const res = await API.get("/users/profile");
  return res.data;
};

// UPDATE PROFILE
export const updateProfile = async (data: Partial<UserProfile>) => {
  const res = await API.put("/users/profile", data);
  return res.data;
};
