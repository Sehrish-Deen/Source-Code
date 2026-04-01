import { motion } from 'framer-motion';
import { 
  Flame, 
  Dumbbell,
  Calendar,
  Target
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Types for API responses
interface DailyWorkout {
  _id: string;
  count: number;
  totalDuration?: number;
  totalCaloriesBurned?: number;
}

interface WorkoutCategory {
  _id: string;
  count: number;
}

interface DailyCalories {
  _id: string;
  totalCalories: number;
}

interface CaloriesByMealType {
  _id: string;
  totalCalories: number;
}

interface MostUsedExercise {
  _id: string;
  count: number;
}

interface TodaysMeal {
  _id?: string;
  name: string;
  calories: number;
  mealType: string;
  protein?: number;    // Add these
  carbs?: number;      // Add these
  fats?: number;       // Add these
}

interface WorkoutAnalyticsData {
  workoutsByCategory: WorkoutCategory[];
  dailyWorkouts: DailyWorkout[];
  totalWorkouts: number;
  totalDuration: number;
  totalCaloriesBurned: number;
  mostUsedExercises: MostUsedExercise[];
}

interface NutritionAnalyticsData {
  caloriesByMealType: CaloriesByMealType[];
  dailyCalories: DailyCalories[];
  totalMeals: number;
  totalCalories: number;
  averageCaloriesPerDay: number;
}

interface DashboardData {
  todaysWorkout: {
    _id: string;
    name: string;
    category: string;
    duration: number;
    caloriesBurned: number;
  } | null;
  todaysNutrition: {
    meals: TodaysMeal[];
    totalCalories: number;
    totalProtein: number;    // Add these
    totalCarbs: number;       // Add these
    totalFats: number;        // Add these
  };
  weeklyWorkoutCount: number;
  currentStreak: number;
  weeklyGoal: {
    completed: number;
    target: number;
    percentage: number;
  };
}

interface WorkoutAnalyticsResponse {
  success: boolean;
  data: WorkoutAnalyticsData;
}

interface NutritionAnalyticsResponse {
  success: boolean;
  data: NutritionAnalyticsData;
}

interface DashboardAnalyticsResponse {
  success: boolean;
  data: DashboardData;
}

// Frontend display types
interface WeeklyWorkoutDisplay {
  day: string;
  fullDate: string;
  workouts: number;
  duration: number;
  calories: number;
  isToday: boolean;
}

interface WorkoutCategoryDisplay {
  name: string;
  value: number;
}

interface MonthlyCaloriesDisplay {
  week: string;
  consumed: number;
  burned: number;
}

interface MacroDisplay {
  name: string;
  value: number;
  color: string;
  grams: number;
  percentage?: number;  // Add for actual percentage
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
const COLORS = ['hsl(162, 72%, 42%)', 'hsl(16, 85%, 60%)', 'hsl(45, 93%, 55%)', 'hsl(210, 40%, 40%)'];
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ✅ Professional Custom Tooltip with proper types
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

// Framer motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function Analytics() {
  const [weeklyWorkoutData, setWeeklyWorkoutData] = useState<WeeklyWorkoutDisplay[]>([]);
  const [monthlyCalorieData, setMonthlyCalorieData] = useState<MonthlyCaloriesDisplay[]>([]);
  const [macroDistribution, setMacroDistribution] = useState<MacroDisplay[]>([]);
  const [workoutCategoryData, setWorkoutCategoryData] = useState<WorkoutCategoryDisplay[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todaysMacros, setTodaysMacros] = useState({ protein: 0, carbs: 0, fats: 0, calories: 0 });

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all analytics data in parallel with credentials
      const [workoutRes, nutritionRes, dashboardRes] = await Promise.all([
        fetch("http://localhost:3000/api/v1/analytics/workouts", {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch("http://localhost:3000/api/v1/analytics/nutrition", {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch("http://localhost:3000/api/v1/analytics/dashboard", {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      // Check authentication status
      if (workoutRes.status === 401 || nutritionRes.status === 401 || dashboardRes.status === 401) {
        toast.error("Please login again to view analytics");
        window.location.href = '/login';
        return;
      }

      // Check if responses are ok
      if (!workoutRes.ok || !nutritionRes.ok || !dashboardRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const workoutData: WorkoutAnalyticsResponse = await workoutRes.json();
      const nutritionData: NutritionAnalyticsResponse = await nutritionRes.json();
      const dashboardData: DashboardAnalyticsResponse = await dashboardRes.json();

      // Set dashboard data
      setDashboardData(dashboardData.data);

      // Calculate today's actual macros from meals
      const todaysMeals = dashboardData.data.todaysNutrition.meals || [];
      const todaysMacrosCalc = {
        protein: todaysMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
        carbs: todaysMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
        fats: todaysMeals.reduce((sum, meal) => sum + (meal.fats || 0), 0),
        calories: dashboardData.data.todaysNutrition.totalCalories || 0
      };
      setTodaysMacros(todaysMacrosCalc);

      // Professional weekly workout data processing
      const today = new Date();
      const todayStr = today.toDateString();

      const formattedWeekly: WeeklyWorkoutDisplay[] = DAYS_OF_WEEK.map((day, index) => {
        // Calculate actual date for each day
        const currentDate = new Date();
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() + mondayOffset + index);
        
        const dateStr = targetDate.toDateString();
        const isToday = dateStr === todayStr;
        
        // Find matching workout data
        const apiData = workoutData.data.dailyWorkouts.find(item => {
          const itemDate = new Date(item._id);
          return itemDate.toDateString() === dateStr;
        });

        // Use actual values if available, otherwise 0
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

      // Process workout category data
      const formattedCategory: WorkoutCategoryDisplay[] = workoutData.data.workoutsByCategory.map(item => ({
        name: item._id,
        value: item.count
      }));

      // Process monthly calorie data
      const formattedMonthly: MonthlyCaloriesDisplay[] = nutritionData.data.dailyCalories.map((item, index) => {
        const date = new Date(item._id);
        const avgCaloriesPerWorkout = workoutData.data.totalWorkouts > 0 
          ? workoutData.data.totalCaloriesBurned / workoutData.data.totalWorkouts 
          : 200;
        const matchingWorkout = workoutData.data.dailyWorkouts[index];
        
        return {
          week: date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
          consumed: item.totalCalories,
          burned: matchingWorkout ? matchingWorkout.count * avgCaloriesPerWorkout : 0
        };
      });

      // ✅ IMPORTANT CHANGE: Use today's actual macros instead of average
      const totalMacros = todaysMacrosCalc.protein + todaysMacrosCalc.carbs + todaysMacrosCalc.fats;
      
      const formattedMacros: MacroDisplay[] = [
        {
          name: 'Protein',
          value: todaysMacrosCalc.protein,
          grams: todaysMacrosCalc.protein,
          color: COLORS[0],
          percentage: totalMacros > 0 ? Math.round((todaysMacrosCalc.protein / totalMacros) * 100) : 0
        },
        {
          name: 'Carbs',
          value: todaysMacrosCalc.carbs,
          grams: todaysMacrosCalc.carbs,
          color: COLORS[1],
          percentage: totalMacros > 0 ? Math.round((todaysMacrosCalc.carbs / totalMacros) * 100) : 0
        },
        {
          name: 'Fats',
          value: todaysMacrosCalc.fats,
          grams: todaysMacrosCalc.fats,
          color: COLORS[2],
          percentage: totalMacros > 0 ? Math.round((todaysMacrosCalc.fats / totalMacros) * 100) : 0
        }
      ];

      // Update state
      setWeeklyWorkoutData(formattedWeekly);
      setWorkoutCategoryData(formattedCategory);
      setMonthlyCalorieData(formattedMonthly);
      setMacroDistribution(formattedMacros);

    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error("Failed to load analytics data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate stats
  const totalWorkouts = dashboardData?.weeklyWorkoutCount || 
    weeklyWorkoutData.reduce((sum, d) => sum + d.workouts, 0);
  
  const totalDuration = weeklyWorkoutData.reduce((sum, d) => sum + d.duration, 0);
  const totalCaloriesBurned = weeklyWorkoutData.reduce((sum, d) => sum + d.calories, 0);
  const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
  const weeklyGoalPercentage = dashboardData?.weeklyGoal.percentage || 0;
  const todaysWorkout = dashboardData?.todaysWorkout;
  const todaysCalories = dashboardData?.todaysNutrition.totalCalories || 0;

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        
        {/* Header */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-description">Insights into your fitness performance</p>
          </div>
          {dashboardData?.currentStreak && dashboardData.currentStreak >= 3 && (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full flex items-center gap-2">
              <Flame className="w-5 h-5" />
              <span className="font-semibold">{dashboardData.currentStreak} Day Streak! 🔥</span>
            </div>
          )}
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <Dumbbell className="w-6 h-6 text-primary mb-2" />
            <p className="text-3xl font-bold">{totalWorkouts}</p>
            <p className="text-sm text-muted-foreground">Workouts This Week</p>
            {todaysWorkout && (
              <p className="text-xs text-success mt-1">✓ Today's workout done</p>
            )}
          </div>

          <div className="stat-card">
            <Calendar className="w-6 h-6 text-accent mb-2" />
            <p className="text-3xl font-bold">{avgDuration} min</p>
            <p className="text-sm text-muted-foreground">Avg Duration</p>
          </div>

          <div className="stat-card">
            <Flame className="w-6 h-6 text-destructive mb-2" />
            <p className="text-3xl font-bold">{totalCaloriesBurned.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Calories Burned</p>
          </div>

          <div className="stat-card">
            <Target className="w-6 h-6 text-success mb-2" />
            <p className="text-3xl font-bold">{Math.round(weeklyGoalPercentage)}%</p>
            <p className="text-sm text-muted-foreground">Weekly Goal</p>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData?.weeklyGoal.completed}/{dashboardData?.weeklyGoal.target} workouts
            </p>
          </div>
        </motion.div>

        {/* Today's Nutrition Summary - Updated to show macros */}
        {todaysCalories > 0 && (
          <motion.div variants={itemVariants} className="bg-secondary/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Today's Nutrition</p>
                <p className="text-2xl font-bold">{todaysCalories} calories</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <span className="text-primary font-bold">{todaysMacros.protein}g</span>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div className="text-center">
                  <span className="text-warning font-bold">{todaysMacros.carbs}g</span>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="text-center">
                  <span className="text-accent font-bold">{todaysMacros.fats}g</span>
                  <p className="text-xs text-muted-foreground">Fats</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="workouts" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="workouts">Workouts</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            </TabsList>

            {/* Workout Tab */}
            <TabsContent value="workouts" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Professional Weekly Workout Activity Chart */}
                <div className="lg:col-span-2 chart-container">
                  <h2 className="section-title">Weekly Workout Activity</h2>
                  <div className="h-72">
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
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary">
                        {weeklyWorkoutData.reduce((sum, d) => sum + d.workouts, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Workouts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-secondary">
                        {Math.round(weeklyWorkoutData.reduce((sum, d) => sum + d.duration, 0) / 60)}h {weeklyWorkoutData.reduce((sum, d) => sum + d.duration, 0) % 60}m
                      </p>
                      <p className="text-xs text-muted-foreground">Total Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-accent">
                        {weeklyWorkoutData.reduce((sum, d) => sum + d.calories, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Calories</p>
                    </div>
                  </div>
                </div>

                <div className="chart-container">
                  <h2 className="section-title">Workout Types</h2>
                  <div className="h-72 flex items-center justify-center">
                    {workoutCategoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={workoutCategoryData}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => 
                              `${name} ${(Number(percent) * 100).toFixed(0)}%`
                            }
                          >
                            {workoutCategoryData.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground">No workout data yet</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="chart-container">
                <h2 className="section-title">Calories Burned This Week</h2>
                <div className="h-64">
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
              </div>
            </TabsContent>

            {/* Nutrition Tab - Updated to show today's actual macros */}
            <TabsContent value="nutrition" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 chart-container">
                  <h2 className="section-title">Last 7 Days Calories</h2>
                  <div className="h-72">
                    {monthlyCalorieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyCalorieData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="week" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }} 
                          />
                          <Bar dataKey="consumed" fill="hsl(162, 72%, 42%)" radius={[6, 6, 0, 0]} name="Calories Consumed" />
                          <Bar dataKey="burned" fill="hsl(16, 85%, 60%)" radius={[6, 6, 0, 0]} name="Calories Burned" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">No nutrition data yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="chart-container">
                  <h2 className="section-title">Today's Macros</h2>
                  <div className="h-72 flex items-center justify-center">
                    {macroDistribution.some(m => m.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroDistribution}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => 
                              `${name} ${(Number(percent) * 100).toFixed(0)}%`
                            }
                          >
                            {macroDistribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${value}g`, 'Grams']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground">No meals logged today</p>
                    )}
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Today's macro distribution
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {macroDistribution.map((macro) => (
                  <div key={macro.name} className="stat-card text-center">
                    <p className="text-3xl font-bold" style={{ color: macro.color }}>
                      {macro.value}g
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{macro.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {macro.percentage || 0}% of today's macros
                    </p>
                  </div>
                ))}
              </div>

              {/* Show today's meals if any */}
              {dashboardData?.todaysNutrition.meals && dashboardData.todaysNutrition.meals.length > 0 && (
                <motion.div variants={itemVariants} className="chart-container">
                  <h2 className="section-title mb-4">Today's Meals</h2>
                  <div className="space-y-3">
                    {dashboardData.todaysNutrition.meals.map((meal, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                        <div>
                          <p className="font-medium">{meal.name}</p>
                          <p className="text-sm text-muted-foreground">{meal.mealType}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{meal.calories} cal</p>
                          <div className="flex gap-2 text-xs">
                            <span className="text-primary">P: {meal.protein || 0}g</span>
                            <span className="text-warning">C: {meal.carbs || 0}g</span>
                            <span className="text-accent">F: {meal.fats || 0}g</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </Layout>
  );
}