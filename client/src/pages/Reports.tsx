import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp,
  Dumbbell,
  Flame,
  Scale,
  Target,
  Loader2,
  TrendingDown
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getReports, exportReport, type ReportData } from '@/services/reportService';
import { getProgress, type ProgressData } from '@/services/progressService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function Reports() {
  const [reportPeriod, setReportPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState({ json: false, csv: false });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);

  // Fetch both reports and progress data
  const fetchAllData = async (period: string) => {
    try {
      setLoading(true);
      const [reports, progress] = await Promise.all([
        getReports(period),
        getProgress()
      ]);
      setReportData(reports);
      setProgressData(progress);
    } catch (error) {
      toast.error("Failed to load reports data");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(reportPeriod);
  }, [reportPeriod]);

  // Handle export
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setExporting(prev => ({ ...prev, [format]: true }));
      await exportReport(format, reportPeriod);
      // Notification ab backend se automatically aa jayega
    } catch (error) {
      console.error(`Export failed:`, error);
    } finally {
      setExporting(prev => ({ ...prev, [format]: false }));
    }
  };

  // Calculate dynamic values from progress data
  const getStartingWeight = (): number => {
    return progressData?.weightHistory?.[0]?.weight || 0;
  };

  const getCurrentWeight = (): number => {
    const weights = progressData?.weightHistory;
    return weights?.[weights.length - 1]?.weight || 0;
  };

  const getWeightChange = (): string => {
    const start = getStartingWeight();
    const current = getCurrentWeight();
    return (current - start).toFixed(1);
  };

  const getWeightLost = (): string => {
    const start = getStartingWeight();
    const current = getCurrentWeight();
    return (start - current).toFixed(1);
  };

  const getGoalWeight = (): number => {
    // Pehle progressData se goal weight lo, agar nahi hai toh reportData se, warna 0
    return progressData?.goalWeight || reportData?.goals?.targetWeight || 0;
  };

  const getGoalProgress = (): string => {
    const start = getStartingWeight();
    const current = getCurrentWeight();
    const goal = getGoalWeight();
    
    if (start === 0 || goal === 0 || start === goal) return '0';
    
    const progress = ((start - current) / (start - goal)) * 100;
    return Math.min(Math.max(progress, 0), 100).toFixed(0);
  };

  const getRemainingToGoal = (): string => {
    const current = getCurrentWeight();
    const goal = getGoalWeight();
    return (current - goal).toFixed(1);
  };

  const getGoalStatus = () => {
    const goal = getGoalWeight();
    const remaining = Number(getRemainingToGoal());
    
    if (goal === 0) {
      return { text: 'No goal set', color: 'text-muted-foreground' };
    }
    if (remaining > 0) {
      return { text: `${remaining.toFixed(1)} kg to go`, color: 'text-warning' };
    }
    if (remaining < 0) {
      return { text: 'Goal Set ', color: 'text-success' };
    }
    return { text: 'On target!', color: 'text-primary' };
  };

  const getPeriodWorkouts = (): number => {
    return reportData?.periodData?.stats?.totalWorkouts || 0;
  };

  const getPeriodCalories = (): number => {
    return reportData?.periodData?.stats?.totalCalories || 0;
  };

  const getPeriodDuration = (): number => {
    return reportData?.periodData?.stats?.totalDuration || 0;
  };

  const getAvgDuration = (): number => {
    const workouts = getPeriodWorkouts();
    const duration = getPeriodDuration();
    return workouts > 0 ? Math.round(duration / workouts) : 0;
  };

  const getStrengthSessions = (): number => {
    return reportData?.periodData?.stats?.byCategory?.Strength || 0;
  };

  const getCardioSessions = (): number => {
    return reportData?.periodData?.stats?.byCategory?.Cardio || 0;
  };

  // Format date range
  const getDateRangeText = (): string => {
    if (!reportData?.periodData?.startDate) return '';
    
    const startDate = new Date(reportData.periodData.startDate);
    const endDate = new Date();
    
    switch(reportPeriod) {
      case 'week':
        return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarter':
        return `Q${Math.floor(startDate.getMonth() / 3) + 1} ${startDate.getFullYear()}`;
      case 'year':
        return startDate.getFullYear().toString();
      default:
        return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <ToastContainer position="top-right" autoClose={2000} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const goalWeight = getGoalWeight();
  const weightChange = Number(getWeightChange());
  const goalStatus = getGoalStatus();

  return (
    <Layout>
      <ToastContainer position="top-right" autoClose={2000} />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-description">Your fitness progress reports</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Report Summary */}
        <motion.div variants={itemVariants} className="stat-card stat-card-primary">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-white/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Fitness Progress Report</h2>
              <p className="opacity-80">{getDateRangeText()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/10">
              <Dumbbell className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{getPeriodWorkouts()}</p>
              <p className="text-sm opacity-80">Workouts ({reportPeriod})</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10">
              <Flame className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{getPeriodCalories().toLocaleString()}</p>
              <p className="text-sm opacity-80">Calories burned ({reportPeriod})</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10">
              <Scale className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{getCurrentWeight()} kg</p>
              <p className="text-sm opacity-80">Current Weight</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10">
              <Target className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{Math.round(getPeriodDuration() / 60)} hrs</p>
              <p className="text-sm opacity-80">Total Duration</p>
            </div>
          </div>
        </motion.div>

        {/* Goal Progress Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="stat-card bg-gradient-to-br from-accent/10 to-accent/5">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Goal Weight</h3>
            </div>
            <p className="text-3xl font-bold">
              {goalWeight > 0 ? `${goalWeight} kg` : '—'}
            </p>
            <p className={`text-sm mt-1 ${goalStatus.color}`}>
              {goalStatus.text}
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Weight Change</h3>
            </div>
            <div className="flex items-center gap-2">
              {weightChange < 0 ? (
                <TrendingDown className="w-6 h-6 text-success" />
              ) : weightChange > 0 ? (
                <TrendingUp className="w-6 h-6 text-destructive" />
              ) : null}
              <p className="text-3xl font-bold">
                {weightChange > 0 ? '+' : ''}
                {weightChange.toFixed(1)} kg
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              From {getStartingWeight()} kg to {getCurrentWeight()} kg
            </p>
          </div>
        </motion.div>

        {/* Report Details */}
        <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-6">
          {/* Workout Summary */}
          <div className="stat-card">
            <h3 className="section-title flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              Workout Summary ({reportPeriod})
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Total Workouts</span>
                <span className="font-semibold">{getPeriodWorkouts()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Strength Sessions</span>
                <span className="font-semibold">{getStrengthSessions()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Cardio Sessions</span>
                <span className="font-semibold">{getCardioSessions()}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Total Duration</span>
                <span className="font-semibold">{getPeriodDuration()} min</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Avg Workout Duration</span>
                <span className="font-semibold">{getAvgDuration()} min</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Total Calories</span>
                <span className="font-semibold">{getPeriodCalories()} cal</span>
              </div>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="stat-card">
            <h3 className="section-title flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Progress Summary (All Time)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Starting Weight</span>
                <span className="font-semibold">{getStartingWeight()} kg</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Current Weight</span>
                <span className="font-semibold">{getCurrentWeight()} kg</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Weight Change</span>
                <span className={`font-semibold ${weightChange < 0 ? 'text-success' : weightChange > 0 ? 'text-destructive' : ''}`}>
                  {weightChange > 0 ? '+' : ''}
                  {weightChange.toFixed(1)} kg
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Total Weight Lost</span>
                <span className="font-semibold text-success">{Number(getWeightLost()).toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                <span>Target Weight</span>
                <span className="font-semibold">{goalWeight > 0 ? `${goalWeight} kg` : 'Not set'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Weight History Preview */}
        {progressData?.weightHistory && progressData.weightHistory.length > 0 && (
          <motion.div variants={itemVariants} className="stat-card">
            <h3 className="section-title mb-4">Recent Weight History</h3>
            <div className="space-y-2">
              {progressData.weightHistory.slice(-5).reverse().map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="font-semibold">{entry.weight} kg</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Monthly Progress */}
        {reportData?.monthlyProgress && reportData.monthlyProgress.length > 0 && (
          <motion.div variants={itemVariants} className="stat-card">
            <h3 className="section-title mb-4">Monthly Progress</h3>
            <div className="space-y-3">
              {reportData.monthlyProgress.map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{month.month}</p>
                    <p className="text-xs text-muted-foreground">
                      {month.workoutsCompleted} workouts · {month.caloriesBurned} cal
                    </p>
                  </div>
                  {month.weightChange !== undefined && (
                    <span className={`text-sm font-medium ${
                      month.weightChange < 0 ? 'text-success' : 
                      month.weightChange > 0 ? 'text-destructive' : 
                      'text-muted-foreground'
                    }`}>
                      {month.weightChange > 0 ? '+' : ''}{month.weightChange} kg
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Export Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
          <button 
            className="btn-primary flex-1"
            onClick={() => handleExport('json')}
            disabled={exporting.json}
          >
            {exporting.json ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>Export as JSON</span>
          </button>
          <button 
            className="btn-outline flex-1"
            onClick={() => handleExport('csv')}
            disabled={exporting.csv}
          >
            {exporting.csv ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>Export as CSV</span>
          </button>
        </motion.div>

        {/* Last Updated */}
        {reportData?.lastCalculated && (
          <motion.p variants={itemVariants} className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(reportData.lastCalculated).toLocaleString()}
          </motion.p>
        )}
      </motion.div>
    </Layout>
  );
}