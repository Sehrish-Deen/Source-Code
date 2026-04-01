import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Dumbbell, 
  Flame, 
  Scale, 
  Target, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Utensils,
  Zap,
  Loader2,
  Calendar,
  Trophy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { 
  currentUser
} from '@/data/dummyData';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { getWorkouts, Workout } from '@/services/workoutService';
import { getMeals, Meal } from '@/services/nutritionService';
import { getProgress, WeightEntry } from '@/services/progressService';
import { getProfile, UserProfile } from '@/services/profileService';
import { toast } from 'react-toastify';

// Types for API responses
interface DailyWorkout {
  _id: string;
  count: number;
  totalDuration?: number;
  totalCaloriesBurned?: number;
}

interface WeeklyWorkoutDisplay {
  day: string;
  fullDate: string;
  workouts: number;
  duration: number;
  calories: number;
  isToday: boolean;
}

// ✅ Custom Tooltip Props Interface
interface CustomBarTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: WeeklyWorkoutDisplay;
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

// Constants
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ✅ Professional Custom Tooltip for Bar Chart - with proper types
const CustomBarTooltip = ({ active, payload, label }: CustomBarTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{data.fullDate}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(162, 72%, 42%)' }} />
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{data.duration} min</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(16, 85%, 60%)' }} />
            <span className="text-muted-foreground">Calories:</span>
            <span className="font-medium">{data.calories}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Workouts:</span>
            <span className="font-medium">{data.workouts}</span>
          </div>
          {data.isToday && (
            <div className="mt-2 text-xs text-primary font-medium">✓ Today</div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [goalWeight, setGoalWeight] = useState<number>(0);
  const [weeklyWorkoutData, setWeeklyWorkoutData] = useState<WeeklyWorkoutDisplay[]>([]);
  
  // Today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toDateString();

  // ✅ PROFESSIONAL WEEKLY WORKOUT DATA PROCESSING - Fixed dependencies
  const processWeeklyWorkoutData = useCallback((workoutsData: Workout[]) => {
    // Group workouts by date with actual totals
    const workoutsByDate: { [key: string]: { count: number; totalDuration: number; totalCalories: number } } = {};
    
    workoutsData.forEach(workout => {
      const date = new Date(workout.date).toISOString().split('T')[0];
      if (!workoutsByDate[date]) {
        workoutsByDate[date] = { count: 0, totalDuration: 0, totalCalories: 0 };
      }
      workoutsByDate[date].count += 1;
      workoutsByDate[date].totalDuration += workout.duration || 0;
      workoutsByDate[date].totalCalories += workout.caloriesBurned || 0;
    });

    // Create daily workout objects with actual data
    const dailyWorkouts: DailyWorkout[] = Object.keys(workoutsByDate).map(date => ({
      _id: date,
      count: workoutsByDate[date].count,
      totalDuration: workoutsByDate[date].totalDuration,
      totalCaloriesBurned: workoutsByDate[date].totalCalories
    }));

    // Format for display - use actual dates
    const formattedWeekly: WeeklyWorkoutDisplay[] = DAYS_OF_WEEK.map((day, index) => {
      // Calculate actual date for each day
      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() + mondayOffset + index);
      
      const dateStr = targetDate.toISOString().split('T')[0];
      const isToday = targetDate.toDateString() === todayStr; // todayStr used here
      
      // Find matching workout data
      const apiData = dailyWorkouts.find(item => item._id === dateStr);

      return {
        day,
        fullDate: targetDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        }),
        workouts: apiData?.count || 0,
        duration: apiData?.totalDuration || 0,
        calories: apiData?.totalCaloriesBurned || 0,
        isToday
      };
    });

    setWeeklyWorkoutData(formattedWeekly);
  }, [todayStr]); // ✅ Added todayStr as dependency

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel including profile
      const [profileData, workoutsData, mealsData, progressData] = await Promise.all([
        getProfile(),
        getWorkouts(),
        getMeals(),
        getProgress()
      ]);

      setUser(profileData);
      setWorkouts(workoutsData);
      setMeals(mealsData);
      setWeightHistory(progressData.weightHistory || []);
      setGoalWeight(progressData.goalWeight || 0);
      
      // Process weekly workout data
      processWeeklyWorkoutData(workoutsData);
      
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [processWeeklyWorkoutData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============ WORKOUT STATS ============
  const totalWorkouts = workouts.length;
  
  // Workouts this week
  const workoutsThisWeek = workouts.filter(w => {
    const workoutDate = new Date(w.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutDate >= weekAgo;
  }).length;
  
  const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

  // ============ NUTRITION STATS - TODAY'S DATA ============
  // Filter meals for today ONLY
  const todayMeals = meals.filter(m => m.date === today);
  
  // Calculate today's totals
  const caloriesToday = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const proteinToday = todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0);
  const carbsToday = todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0);
  const fatsToday = todayMeals.reduce((sum, m) => sum + (m.fats || 0), 0);

  // ============ WEIGHT STATS ============
  const currentWeight = weightHistory[weightHistory.length - 1]?.weight || 0;
  const startWeight = weightHistory[0]?.weight || 0;
  const weightLost = startWeight > 0 ? (startWeight - currentWeight).toFixed(1) : '0';
  
  // Goal weight check
  const isGoalAchieved = goalWeight > 0 && currentWeight <= goalWeight;
  const weightToGoal = goalWeight > 0 ? (currentWeight - goalWeight).toFixed(1) : '0';

  // Recent workouts (last 3)
  const recentWorkouts = workouts.slice(0, 3);

  // Calculate streak
  const calculateStreak = () => {
    if (workouts.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasWorkout = workouts.some(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });
      
      if (hasWorkout) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
    

        {/* Welcome Section - UPDATED with dynamic user name */}
        <motion.div variants={itemVariants} className="page-header">
          <h1 className="page-title">
            Welcome back, <span className="text-gradient-primary">{user?.username?.split(' ')[0] || 'User'}</span>! 👋
          </h1>
         
        </motion.div>

            {/* Header with Streak */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">Your fitness summary</p>
          </div>
          {currentStreak >= 3 && (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full flex items-center gap-2">
              <Flame className="w-5 h-5" />
              <span className="font-semibold">{currentStreak} Day Streak! 🔥</span>
            </div>
          )}
        </motion.div>

        {/* Stats Grid - 4 Cards */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* CARD 1: Workouts This Week */}
          <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Workouts</p>
                <p className="text-4xl font-bold mt-2">{workoutsThisWeek}</p>
                <p className="text-xs opacity-80 mt-1">This week</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <Dumbbell className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* CARD 2: Calories Today - FIXED: Today's calories from meals */}
          <div className="stat-card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Consumed Calories</p>
                <p className="text-4xl font-bold mt-2">{caloriesToday.toLocaleString()}</p>
                <p className="text-xs opacity-80 mt-1">Today</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <Flame className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* CARD 3: Current Weight */}
          <div className="stat-card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Weight</p>
                <p className="text-4xl font-bold mt-2">{currentWeight} <span className="text-lg">kg</span></p>
                <p className="text-xs opacity-80 mt-1">
                  {goalWeight > 0 ? (
                    isGoalAchieved ? (
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Current Weight!
                      </span>
                    ) : (
                      `${Math.abs(parseFloat(weightToGoal))}kg to ${goalWeight}kg`
                    )
                  ) : (
                    'Set a goal'
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <Scale className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* CARD 4: Total Progress */}
          <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Progress</p>
                <p className="text-4xl font-bold mt-2">
                  {startWeight > 0 ? (startWeight - currentWeight).toFixed(1) : '0'} <span className="text-lg">kg</span>
                </p>
                <p className="text-xs opacity-80 mt-1">Total lost</p>
              </div>
              <div className="p-3 rounded-lg bg-white/20">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* TODAY'S NUTRITION SUMMARY - FIXED: Shows today's actual data */}
        {(caloriesToday > 0 || todayMeals.length > 0) && (
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Today's Nutrition Summary</h2>
              <Link to="/nutrition" className="text-sm text-primary hover:underline flex items-center gap-1">
                View details <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Meals</p>
                <p className="text-2xl font-bold">{todayMeals.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-2xl font-bold">{caloriesToday}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-2xl font-bold">{proteinToday}g</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carbs/Fats</p>
                <p className="text-2xl font-bold">{carbsToday}g / {fatsToday}g</p>
              </div>
            </div>

            {/* Show today's meals if any */}
            {todayMeals.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium mb-2">Today's meals:</p>
                <div className="flex flex-wrap gap-2">
                  {todayMeals.map(meal => (
                    <span key={meal.id} className="text-xs bg-primary/10 px-2 py-1 rounded-full">
                      {meal.name} ({meal.calories} cal)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ✅ PROFESSIONAL WEEKLY WORKOUT ACTIVITY CHART - Dual Axis */}
        <motion.div variants={itemVariants} className="chart-container">
          <h2 className="section-title">Weekly Workout Activity</h2>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={weeklyWorkoutData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ 
                    value: 'Duration (min)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 12
                  }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ 
                    value: 'Calories', 
                    angle: 90, 
                    position: 'insideRight',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 12
                  }}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar 
                  yAxisId="left"
                  dataKey="duration" 
                  fill="hsl(162, 72%, 42%)" 
                  radius={[6, 6, 0, 0]} 
                  name="Duration (min)"
                  animationDuration={1500}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="calories" 
                  fill="hsl(16, 85%, 60%)" 
                  radius={[6, 6, 0, 0]} 
                  name="Calories Burned"
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {weeklyWorkoutData.reduce((sum, d) => sum + d.workouts, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Workouts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">
                {Math.round(weeklyWorkoutData.reduce((sum, d) => sum + d.duration, 0) / 60)}h {weeklyWorkoutData.reduce((sum, d) => sum + d.duration, 0) % 60}m
              </p>
              <p className="text-xs text-muted-foreground">Total Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">
                {weeklyWorkoutData.reduce((sum, d) => sum + d.calories, 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Calories</p>
            </div>
          </div>
        </motion.div>

        {/* Calories Burned Chart */}
        <motion.div variants={itemVariants} className="chart-container">
          <h2 className="section-title">Calories Burned This Week</h2>
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyWorkoutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="hsl(16, 85%, 60%)" 
                  strokeWidth={3} 
                  fill="hsl(16, 85%, 60%)" 
                  fillOpacity={0.3} 
                  name="Calories"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Weight Progress Chart */}
        {weightHistory.length > 1 && (
          <motion.div variants={itemVariants} className="chart-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Weight Progress</h2>
              <Link to="/progress" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightHistory}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(162, 72%, 42%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(162, 72%, 42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={['dataMin - 2', 'dataMax + 2']}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}kg`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} kg`, 'Weight']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(162, 72%, 42%)"
                    strokeWidth={2}
                    fill="url(#weightGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Workouts */}
          <motion.div variants={itemVariants} className="stat-card p-0 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="section-title mb-0">Recent Workouts</h2>
              <Link to="/workouts" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentWorkouts.length > 0 ? (
                recentWorkouts.map((workout) => (
                  <div 
                    key={workout._id} 
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-3 rounded-xl ${workout.category === 'Strength' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{workout.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {workout.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {workout.caloriesBurned} cal
                        </span>
                      </div>
                    </div>
                    <span className="workout-tag hidden sm:flex">{workout.category}</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No workouts logged yet
                </div>
              )}
            </div>
          </motion.div>

          {/* Today's Nutrition */}
          <motion.div variants={itemVariants} className="stat-card p-0 overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="section-title mb-0">Today's Meals</h2>
              <Link to="/nutrition" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {todayMeals.length > 0 ? (
                todayMeals.slice(0, 4).map((meal) => (
                  <div 
                    key={meal.id} 
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-3 rounded-xl bg-success/10 text-success">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{meal.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span>{meal.calories} cal</span>
                        <span>P: {meal.protein}g</span>
                      </div>
                    </div>
                    <span className={`meal-badge ${
                      meal.type === 'Breakfast' ? 'meal-badge-breakfast' :
                      meal.type === 'Lunch' ? 'meal-badge-lunch' :
                      meal.type === 'Dinner' ? 'meal-badge-dinner' :
                      'meal-badge-snack'
                    }`}>
                      {meal.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No meals logged today
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <Link to="/workouts" className="btn-primary justify-center text-center">
            <Dumbbell className="w-5 h-5" />
            <span>Log Workout</span>
          </Link>
          <Link to="/nutrition" className="btn-outline justify-center text-center">
            <Utensils className="w-5 h-5" />
            <span>Log Meal</span>
          </Link>
        </motion.div>
      </motion.div>
    </Layout>
  );
}