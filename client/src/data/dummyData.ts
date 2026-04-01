// Dummy data for the Fitness Tracker application

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  weight: number;
  height: number;
  age: number;
  goal: string;
  joinDate: string;
}

export interface Workout {
  id: string;
  name: string;
  category: 'Strength' | 'Cardio';
  exercises: Exercise[];
  date: string;
  duration: number; // minutes
  caloriesBurned: number;
  notes: string;
  tags: string[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface Meal {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  date: string;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface BodyMeasurement {
  date: string;
  chest: number;
  waist: number;
  hips: number;
  biceps: number;
  thighs: number;
}

export interface Notification {
  id: string;
  type: 'reminder' | 'achievement' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Current user
export const currentUser: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  weight: 75,
  height: 178,
  age: 28,
  goal: 'Build muscle & improve endurance',
  joinDate: '2024-01-15',
};

// Workouts
export const workouts: Workout[] = [
  {
    id: '1',
    name: 'Morning Strength Training',
    category: 'Strength',
    exercises: [
      { id: '1', name: 'Bench Press', sets: 4, reps: 10, weight: 60 },
      { id: '2', name: 'Squats', sets: 4, reps: 12, weight: 80 },
      { id: '3', name: 'Deadlift', sets: 3, reps: 8, weight: 100 },
      { id: '4', name: 'Shoulder Press', sets: 3, reps: 12, weight: 30 },
    ],
    date: '2025-02-07',
    duration: 65,
    caloriesBurned: 420,
    notes: 'Great session! Increased weight on deadlifts.',
    tags: ['upper body', 'lower body', 'compound'],
  },
  {
    id: '2',
    name: 'HIIT Cardio Session',
    category: 'Cardio',
    exercises: [
      { id: '5', name: 'Burpees', sets: 5, reps: 15, weight: 0 },
      { id: '6', name: 'Mountain Climbers', sets: 5, reps: 30, weight: 0 },
      { id: '7', name: 'Jump Squats', sets: 4, reps: 20, weight: 0 },
    ],
    date: '2025-02-06',
    duration: 35,
    caloriesBurned: 380,
    notes: 'Intense cardio, felt great after!',
    tags: ['hiit', 'cardio', 'full body'],
  },
  {
    id: '3',
    name: 'Back & Biceps',
    category: 'Strength',
    exercises: [
      { id: '8', name: 'Pull-ups', sets: 4, reps: 8, weight: 0 },
      { id: '9', name: 'Barbell Rows', sets: 4, reps: 10, weight: 50 },
      { id: '10', name: 'Bicep Curls', sets: 3, reps: 12, weight: 15 },
    ],
    date: '2025-02-05',
    duration: 50,
    caloriesBurned: 320,
    notes: 'Focus on form for pull-ups.',
    tags: ['back', 'biceps', 'pull'],
  },
  {
    id: '4',
    name: 'Evening Run',
    category: 'Cardio',
    exercises: [
      { id: '11', name: 'Running', sets: 1, reps: 1, weight: 0 },
    ],
    date: '2025-02-04',
    duration: 40,
    caloriesBurned: 450,
    notes: '5K run at steady pace.',
    tags: ['running', 'outdoor', 'endurance'],
  },
  {
    id: '5',
    name: 'Leg Day',
    category: 'Strength',
    exercises: [
      { id: '12', name: 'Leg Press', sets: 4, reps: 12, weight: 120 },
      { id: '13', name: 'Lunges', sets: 3, reps: 10, weight: 20 },
      { id: '14', name: 'Calf Raises', sets: 4, reps: 15, weight: 40 },
    ],
    date: '2025-02-03',
    duration: 55,
    caloriesBurned: 380,
    notes: 'Legs feeling strong!',
    tags: ['legs', 'lower body'],
  },
];

// Meals
export const meals: Meal[] = [
  {
    id: '1',
    type: 'Breakfast',
    name: 'Oatmeal with Berries',
    quantity: '1 bowl',
    calories: 320,
    protein: 12,
    carbs: 54,
    fats: 8,
    date: '2025-02-07',
  },
  {
    id: '2',
    type: 'Breakfast',
    name: 'Greek Yogurt',
    quantity: '200g',
    calories: 140,
    protein: 20,
    carbs: 8,
    fats: 4,
    date: '2025-02-07',
  },
  {
    id: '3',
    type: 'Lunch',
    name: 'Grilled Chicken Salad',
    quantity: '1 large bowl',
    calories: 450,
    protein: 42,
    carbs: 18,
    fats: 22,
    date: '2025-02-07',
  },
  {
    id: '4',
    type: 'Snack',
    name: 'Protein Shake',
    quantity: '1 shake',
    calories: 180,
    protein: 30,
    carbs: 6,
    fats: 3,
    date: '2025-02-07',
  },
  {
    id: '5',
    type: 'Dinner',
    name: 'Salmon with Vegetables',
    quantity: '1 plate',
    calories: 520,
    protein: 38,
    carbs: 24,
    fats: 28,
    date: '2025-02-07',
  },
  {
    id: '6',
    type: 'Breakfast',
    name: 'Eggs and Toast',
    quantity: '2 eggs + 2 slices',
    calories: 380,
    protein: 22,
    carbs: 32,
    fats: 18,
    date: '2025-02-06',
  },
  {
    id: '7',
    type: 'Lunch',
    name: 'Turkey Wrap',
    quantity: '1 wrap',
    calories: 410,
    protein: 28,
    carbs: 42,
    fats: 14,
    date: '2025-02-06',
  },
];

// Weight history
export const weightHistory: WeightEntry[] = [
  { date: '2025-01-01', weight: 78 },
  { date: '2025-01-08', weight: 77.5 },
  { date: '2025-01-15', weight: 77.2 },
  { date: '2025-01-22', weight: 76.8 },
  { date: '2025-01-29', weight: 76.3 },
  { date: '2025-02-05', weight: 75.5 },
  { date: '2025-02-07', weight: 75 },
];

// Body measurements
export const bodyMeasurements: BodyMeasurement[] = [
  { date: '2025-01-01', chest: 102, waist: 86, hips: 98, biceps: 34, thighs: 58 },
  { date: '2025-01-15', chest: 103, waist: 84, hips: 97, biceps: 35, thighs: 59 },
  { date: '2025-02-01', chest: 104, waist: 82, hips: 96, biceps: 36, thighs: 60 },
];

// Notifications
export const notifications: Notification[] = [
  {
    id: '1',
    type: 'reminder',
    title: 'Workout Reminder',
    message: "Don't forget your evening cardio session!",
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'achievement',
    title: '🏆 Goal Achieved!',
    message: 'You hit your weekly workout goal of 5 sessions!',
    time: '1 day ago',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Weekly Summary Ready',
    message: 'Your fitness report for this week is ready to view.',
    time: '2 days ago',
    read: true,
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Log Your Meals',
    message: "You haven't logged lunch yet today.",
    time: '3 hours ago',
    read: false,
  },
  {
    id: '5',
    type: 'achievement',
    title: '💪 New PR!',
    message: 'You set a new personal record on Deadlift: 100kg!',
    time: '3 days ago',
    read: true,
  },
];

// Analytics data
export const weeklyWorkoutData = [
  { day: 'Mon', workouts: 1, duration: 65, calories: 420 },
  { day: 'Tue', workouts: 1, duration: 35, calories: 380 },
  { day: 'Wed', workouts: 1, duration: 50, calories: 320 },
  { day: 'Thu', workouts: 1, duration: 40, calories: 450 },
  { day: 'Fri', workouts: 1, duration: 55, calories: 380 },
  { day: 'Sat', workouts: 0, duration: 0, calories: 0 },
  { day: 'Sun', workouts: 0, duration: 0, calories: 0 },
];

export const monthlyCalorieData = [
  { week: 'Week 1', consumed: 14200, burned: 2100 },
  { week: 'Week 2', consumed: 13800, burned: 2400 },
  { week: 'Week 3', consumed: 14500, burned: 2200 },
  { week: 'Week 4', consumed: 13200, burned: 2600 },
];

export const macroDistribution = [
  { name: 'Protein', value: 142, color: 'hsl(162, 72%, 42%)' },
  { name: 'Carbs', value: 110, color: 'hsl(45, 93%, 55%)' },
  { name: 'Fats', value: 65, color: 'hsl(16, 85%, 60%)' },
];

export const workoutCategoryData = [
  { name: 'Strength', value: 60 },
  { name: 'Cardio', value: 40 },
];

export const performanceMetrics = {
  benchPress: [
    { date: 'Jan W1', weight: 50 },
    { date: 'Jan W2', weight: 52.5 },
    { date: 'Jan W3', weight: 55 },
    { date: 'Jan W4', weight: 55 },
    { date: 'Feb W1', weight: 57.5 },
    { date: 'Feb W2', weight: 60 },
  ],
  squats: [
    { date: 'Jan W1', weight: 70 },
    { date: 'Jan W2', weight: 72.5 },
    { date: 'Jan W3', weight: 75 },
    { date: 'Jan W4', weight: 77.5 },
    { date: 'Feb W1', weight: 77.5 },
    { date: 'Feb W2', weight: 80 },
  ],
  runningPace: [
    { date: 'Jan W1', pace: 6.2 },
    { date: 'Jan W2', pace: 6.0 },
    { date: 'Jan W3', pace: 5.9 },
    { date: 'Jan W4', pace: 5.8 },
    { date: 'Feb W1', pace: 5.7 },
    { date: 'Feb W2', pace: 5.5 },
  ],
};

// Dashboard stats
export const dashboardStats = {
  workoutsThisWeek: 5,
  workoutGoal: 5,
  caloriesToday: 1610,
  calorieGoal: 2000,
  currentWeight: 75,
  weightGoal: 72,
  streak: 12,
};
