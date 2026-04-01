import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Ruler,
  Target,
  Plus,
  Pencil,
  Trash2,
  Activity,
  Trophy,
  BarChart2,
  Minus,
  Settings,
  Loader2,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';
import {
  getProgress,
  setGoalWeight,
  addWeightEntry,
  deleteWeightEntry,
  addBodyMeasurement,
  addPerformanceEntry,
  updatePerformanceEntry,
  deletePerformanceEntry,
  type ProgressData,
  type WeightEntry,
  type BodyMeasurement,
  type PerformanceEntry,
  type PerformanceCategory,
  type MetricType,
} from '@/services/progressService';

// ─── Constants ───────────────────────────────────────────────────────────────
const CHART_COLOURS = [
  'hsl(162, 72%, 42%)',
  'hsl(16, 85%, 60%)',
  'hsl(45, 93%, 55%)',
  'hsl(270, 70%, 60%)',
  'hsl(200, 80%, 50%)',
];

const MEASUREMENT_COLOURS = {
  chest: 'hsl(162, 72%, 42%)',
  waist: 'hsl(16, 85%, 60%)',
  hips: 'hsl(45, 93%, 55%)',
  biceps: 'hsl(270, 70%, 60%)',
  thighs: 'hsl(200, 80%, 50%)',
};

const CATEGORY_COLOUR: Record<PerformanceCategory, string> = {
  Strength: 'bg-primary/15 text-primary',
  Cardio: 'bg-accent/15 text-accent',
  Endurance: 'bg-warning/15 text-warning',
};

const EMPTY_PERF_FORM = {
  activityName: '',
  category: 'Strength' as PerformanceCategory,
  metricType: 'Weight' as MetricType,
  value: '',
  unit: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
};

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// ─── Utility Functions ──────────────────────────────────────────────────────
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy') => {
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, formatStr);
  } catch {
    return 'Invalid date';
  }
};

const formatNumber = (value: number | undefined | null, decimals: number = 1): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toFixed(decimals);
};

// ─── Types ─────────────────────────────────────────────────────────────────
interface WeightFormState {
  weight: string;
  date: string;
}

interface MeasurementFormState {
  chest: string;
  waist: string;
  hips: string;
  biceps: string;
  thighs: string;
  date: string;
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function Progress() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceEntry[]>([]);
  const [goalWeight, setGoalWeightState] = useState<number>(0);

  // ── Current active tab
  const [activeTab, setActiveTab] = useState('weight');

  // ── Modal visibility ────────────────────────────────────────────────────────
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isPerfModalOpen, setIsPerfModalOpen] = useState(false);
  const [editingPerfId, setEditingPerfId] = useState<string | null>(null);

  // ── Form states ─────────────────────────────────────────────────────────────
  const [goalWeightInput, setGoalWeightInput] = useState(goalWeight.toString());
  const [goalWeightError, setGoalWeightError] = useState('');

  const [weightForm, setWeightForm] = useState<WeightFormState>({ 
    weight: '', 
    date: format(new Date(), 'yyyy-MM-dd') 
  });
  const [weightError, setWeightError] = useState('');

  const [measureForm, setMeasureForm] = useState<MeasurementFormState>({
    chest: '', waist: '', hips: '', biceps: '', thighs: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const [perfForm, setPerfForm] = useState(EMPTY_PERF_FORM);
  const [perfError, setPerfError] = useState('');

  // ── Activity selector for chart ──────────────────────────────────────────────
  const [selectedActivity, setSelectedActivity] = useState<string>('');

  // ── Fetch Data ───────────────────────────────────────────────────────────────
  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const data = await getProgress();
      setProgressData(data);
      setWeightHistory(data.weightHistory || []);
      setBodyMeasurements(data.bodyMeasurements || []);
      setPerformanceData(data.performanceData || []);
      
      if (data.goalWeight !== undefined && data.goalWeight !== null && data.goalWeight > 0) {
        setGoalWeightState(data.goalWeight);
        setGoalWeightInput(data.goalWeight.toString());
      } else {
        setGoalWeightState(0);
        setGoalWeightInput('');
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch progress data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const sortedWeightHistory = useMemo(() => 
    [...weightHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ), [weightHistory]
  );

  const latestWeight = useMemo(() => 
    sortedWeightHistory.length > 0 
      ? sortedWeightHistory[sortedWeightHistory.length - 1]
      : null
  , [sortedWeightHistory]);

  const previousWeight = useMemo(() => 
    sortedWeightHistory.length > 1 
      ? sortedWeightHistory[sortedWeightHistory.length - 2]
      : null
  , [sortedWeightHistory]);

  const startWeight = useMemo(() => 
    sortedWeightHistory.length > 0 
      ? sortedWeightHistory[0].weight
      : 0
  , [sortedWeightHistory]);

  const weightChange = useMemo(() => {
    if (!latestWeight || !previousWeight) return 0;
    return Number((latestWeight.weight - previousWeight.weight).toFixed(1));
  }, [latestWeight, previousWeight]);

  const totalChange = useMemo(() => {
    if (!latestWeight || startWeight === 0) return 0;
    return Number((latestWeight.weight - startWeight).toFixed(1));
  }, [latestWeight, startWeight]);

  // Goal progress - Keep original calculation
  const remainingToGoal = goalWeight > 0 ? (latestWeight?.weight || 0) - goalWeight : 0;
  const goalProgress = startWeight && goalWeight > 0 && (startWeight - goalWeight) !== 0 
    ? ((startWeight - (latestWeight?.weight || 0)) / (startWeight - goalWeight)) * 100 
    : 0;

  // Measurements
  const sortedMeasurements = useMemo(() => 
    [...bodyMeasurements].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ), [bodyMeasurements]
  );

  const latestMeasurements = useMemo(() => 
    sortedMeasurements.length > 0 
      ? sortedMeasurements[sortedMeasurements.length - 1]
      : null
  , [sortedMeasurements]);

  const previousMeasurements = useMemo(() => 
    sortedMeasurements.length > 1 
      ? sortedMeasurements[sortedMeasurements.length - 2]
      : null
  , [sortedMeasurements]);

  const measurementFields = [
    { label: 'Chest', key: 'chest' as const, colour: MEASUREMENT_COLOURS.chest },
    { label: 'Waist', key: 'waist' as const, colour: MEASUREMENT_COLOURS.waist },
    { label: 'Hips', key: 'hips' as const, colour: MEASUREMENT_COLOURS.hips },
    { label: 'Biceps', key: 'biceps' as const, colour: MEASUREMENT_COLOURS.biceps },
    { label: 'Thighs', key: 'thighs' as const, colour: MEASUREMENT_COLOURS.thighs },
  ];

  // Performance
  const uniqueActivities = useMemo(
    () => Array.from(new Set(performanceData.map((e) => e.activityName))),
    [performanceData],
  );

  const activeActivity = selectedActivity || uniqueActivities[0] || '';

  const latestPerActivity = useMemo(() => {
    const map = new Map<string, PerformanceEntry[]>();
    
    performanceData.forEach((entry) => {
      const existing = map.get(entry.activityName) || [];
      map.set(entry.activityName, [...existing, entry]);
    });

    return Array.from(map.entries()).map(([name, entries]) => {
      const sorted = [...entries].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const latest = sorted[sorted.length - 1];
      const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
      
      return { name, latest, prev, sorted };
    });
  }, [performanceData]);

  const chartData = useMemo(() => {
    return performanceData
      .filter((e) => e.activityName === activeActivity)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => ({
        date: formatDate(e.date, 'MMM d'),
        value: e.value,
        unit: e.unit,
        id: e._id,
      }));
  }, [performanceData, activeActivity]);

  const smartStats = useMemo(() => {
    const entries = performanceData
      .filter((e) => e.activityName === activeActivity)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (entries.length === 0) return null;
    const values = entries.map((e) => e.value);
    const best = Math.max(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const first = values[0];
    const last = values[values.length - 1];
    const improvement = first !== 0 ? ((last - first) / first) * 100 : 0;
    const unit = entries[0].unit;
    return { best, avg: avg.toFixed(1), total: entries.length, improvement: improvement.toFixed(1), unit };
  }, [performanceData, activeActivity]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  
  const handleGoalWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(goalWeightInput);
    if (isNaN(weight) || weight <= 0) {
      setGoalWeightError('Please enter a valid weight.');
      return;
    }
    if (weight > 300 || weight < 20) {
      setGoalWeightError('Please enter a weight between 20kg and 300kg.');
      return;
    }
    
    try {
      setGoalWeightError('');
      
      const response = await setGoalWeight(weight);
      
      if (response?.goalWeight) {
        setGoalWeightState(response.goalWeight);
        setGoalWeightInput(response.goalWeight.toString());
      } else {
        setGoalWeightState(weight);
        setGoalWeightInput(weight.toString());
      }
      
      toast.success("Goal weight updated successfully!");
      setIsGoalModalOpen(false);
      await fetchProgressData();
    } catch (error) {
      console.error("Goal update error:", error);
      toast.error("Failed to update goal weight");
    }
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const weight = parseFloat(weightForm.weight);
    if (isNaN(weight) || weight <= 0) {
      setWeightError('Please enter a valid weight.');
      return;
    }
    if (weight > 300 || weight < 20) {
      setWeightError('Please enter a weight between 20kg and 300kg.');
      return;
    }
    
    try {
      setWeightError('');
      await addWeightEntry(weight, weightForm.date);
      
      toast.success("Weight logged successfully!");
      await fetchProgressData();
      
      setWeightForm({ weight: '', date: format(new Date(), 'yyyy-MM-dd') });
      setIsWeightModalOpen(false);
    } catch (error) {
      console.error("Weight log error:", error);
      toast.error("Failed to log weight");
    }
  };

  const handleDeleteWeight = async (entryId: string) => {
    if (!entryId) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This weight entry will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteWeightEntry(entryId);
        toast.success("Weight entry deleted successfully!");
        await fetchProgressData();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete weight entry");
      }
    }
  };

  const handleMeasurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const measurements = {
        chest: measureForm.chest ? parseFloat(measureForm.chest) : latestMeasurements?.chest,
        waist: measureForm.waist ? parseFloat(measureForm.waist) : latestMeasurements?.waist,
        hips: measureForm.hips ? parseFloat(measureForm.hips) : latestMeasurements?.hips,
        biceps: measureForm.biceps ? parseFloat(measureForm.biceps) : latestMeasurements?.biceps,
        thighs: measureForm.thighs ? parseFloat(measureForm.thighs) : latestMeasurements?.thighs,
        date: measureForm.date,
      };
      
      await addBodyMeasurement(measurements);
      
      toast.success("Measurements updated successfully!");
      await fetchProgressData();
      
      setMeasureForm({
        chest: '', waist: '', hips: '', biceps: '', thighs: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setIsMeasurementModalOpen(false);
    } catch (error) {
      console.error("Measurement error:", error);
      toast.error("Failed to update measurements");
    }
  };

  const openAddPerfModal = () => {
    setEditingPerfId(null);
    setPerfForm(EMPTY_PERF_FORM);
    setPerfError('');
    setIsPerfModalOpen(true);
  };

  const openEditPerfModal = (entry: PerformanceEntry) => {
    setEditingPerfId(entry._id || null);
    setPerfForm({
      activityName: entry.activityName,
      category: entry.category,
      metricType: entry.metricType,
      value: String(entry.value),
      unit: entry.unit,
      date: formatDate(entry.date, 'yyyy-MM-dd'),
      notes: entry.notes || '',
    });
    setPerfError('');
    setIsPerfModalOpen(true);
  };

  const handlePerfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!perfForm.activityName.trim()) {
      setPerfError('Activity name is required.');
      return;
    }
    
    const value = parseFloat(perfForm.value);
    if (isNaN(value) || value <= 0) {
      setPerfError('Please enter a valid positive number.');
      return;
    }

    try {
      setPerfError('');

      const entryData = {
        activityName: perfForm.activityName.trim(),
        category: perfForm.category,
        metricType: perfForm.metricType,
        value,
        unit: perfForm.unit.trim() || 'unit',
        date: perfForm.date,
        notes: perfForm.notes.trim() || undefined,
      };

      if (editingPerfId) {
        await updatePerformanceEntry(editingPerfId, entryData);
        toast.success("Performance entry updated!");
      } else {
        await addPerformanceEntry(entryData);
        toast.success("Performance entry added!");
      }

      await fetchProgressData();
      setIsPerfModalOpen(false);
      setPerfForm(EMPTY_PERF_FORM);
      setEditingPerfId(null);
    } catch (error) {
      console.error("Performance error:", error);
      toast.error(editingPerfId ? "Failed to update entry" : "Failed to add entry");
    }
  };

  const handleDeletePerformance = async (id: string) => {
    if (!id) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This performance entry will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deletePerformanceEntry(id);
        toast.success("Performance entry deleted!");
        await fetchProgressData();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete entry");
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <ToastContainer position="top-right" autoClose={2000} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your progress...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <ToastContainer position="top-right" autoClose={2000} />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="page-title">Progress Tracking</h1>
          <p className="page-description">Monitor your fitness journey</p>
        </motion.div>

        {/* Summary Cards - Keep original */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card stat-card-primary">
            <Scale className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-3xl font-bold">
              {latestWeight ? formatNumber(latestWeight.weight) : '0'} kg
            </p>
            <p className="text-sm opacity-80">Current Weight</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              {weightChange < 0 ? (
                <TrendingDown className="w-6 h-6 text-success" />
              ) : weightChange > 0 ? (
                <TrendingUp className="w-6 h-6 text-destructive" />
              ) : (
                <Minus className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <p className="text-3xl font-bold">
              {weightChange !== 0 ? (weightChange > 0 ? '+' : '') + formatNumber(weightChange) : '0'} kg
            </p>
            <p className="text-sm text-muted-foreground">Since last entry</p>
          </div>
          <div className="stat-card">
            <Target className="w-6 h-6 text-primary mb-2" />
            <p className="text-3xl font-bold">
              {totalChange !== 0 ? (totalChange > 0 ? '+' : '') + formatNumber(totalChange) : '0'} kg
            </p>
            <p className="text-sm text-muted-foreground">
              Total {totalChange >= 0 ? 'Gain' : 'Loss'}
            </p>
          </div>
          <div 
            className="stat-card cursor-pointer hover:bg-muted/50 transition-colors group relative"
            onClick={() => setIsGoalModalOpen(true)}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set goal weight</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <Target className="w-6 h-6 text-accent mb-2" />
            <p className="text-3xl font-bold">
              {goalWeight > 0 ? `${formatNumber(goalWeight)} kg` : '—'}
            </p>
            <p className="text-sm text-muted-foreground">Goal Weight</p>
            {goalWeight > 0 ? (
              remainingToGoal > 0 ? (
                <p className="text-xs text-success mt-1">{formatNumber(Math.abs(remainingToGoal))} kg to go</p>
              ) : remainingToGoal < 0 ? (
                <p className="text-xs text-destructive mt-1">{formatNumber(Math.abs(remainingToGoal))} kg below goal</p>
              ) : (
                <p className="text-xs text-primary mt-1">Goal achieved! 🎉</p>
              )
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Click to set goal</p>
            )}
          </div>
        </motion.div>

        {/* Goal Progress Bar - Keep original */}
        {goalWeight > 0 && goalProgress > 0 && goalProgress < 100 && (
          <motion.div variants={itemVariants} className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(goalProgress, 100)}%` }}
            />
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="weight">Weight</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Weight Tab - Keep original */}
            <TabsContent value="weight">
              <div className="chart-container">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title mb-0">Weight History</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsWeightModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Log Weight
                  </Button>
                </div>

                {sortedWeightHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Scale className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">No weight entries yet</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Click "Log Weight" to start tracking.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sortedWeightHistory}>
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(162, 72%, 42%)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="hsl(162, 72%, 42%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => formatDate(value, 'MMM d')}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[
                              (dataMin: number) => Math.floor(dataMin - 2),
                              (dataMax: number) => Math.ceil(dataMax + 2),
                            ]}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${value}kg`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [`${formatNumber(value)} kg`, 'Weight']}
                            labelFormatter={(label) => formatDate(label, 'MMMM d, yyyy')}
                          />
                          <Area
                            type="monotone"
                            dataKey="weight"
                            stroke="hsl(162, 72%, 42%)"
                            strokeWidth={3}
                            fill="url(#weightGradient)"
                          />
                          {goalWeight > 0 && (
                            <ReferenceLine 
                              y={goalWeight} 
                              stroke="hsl(var(--accent))" 
                              strokeDasharray="3 3"
                              label={{ 
                                value: `Goal: ${formatNumber(goalWeight)}kg`, 
                                position: 'right',
                                fill: 'hsl(var(--accent))',
                                fontSize: 12
                              }}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">All Entries</h3>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {[...sortedWeightHistory]
                            .reverse()
                            .map((entry) => (
                              <motion.div
                                key={entry._id || generateId()}
                                layout
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <Scale className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{formatNumber(entry.weight)} kg</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(entry.date, 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                  onClick={() => entry._id && handleDeleteWeight(entry._id)}
                                  disabled={!entry._id}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                              </motion.div>
                            ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Measurements Tab - IMPROVED VERSION */}
            <TabsContent value="measurements">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Current Measurements Card */}
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Current Measurements</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMeasurementModalOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Update
                    </Button>
                  </div>

                  {latestMeasurements ? (
                    <div className="space-y-4">
                      {measurementFields.map((field) => {
                        const current = latestMeasurements[field.key] || 0;
                        const previous = previousMeasurements?.[field.key] || current;
                        const change = Number((current - previous).toFixed(1));
                        const isPositive = field.key === 'chest' || field.key === 'biceps' || field.key === 'thighs';
                        
                        // For chest, biceps, thighs - increase is good (muscle gain)
                        // For waist, hips - decrease is good (fat loss)
                        const isImprovement = isPositive ? change > 0 : change < 0;
                        
                        return (
                          <motion.div
                            key={field.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-2 h-8 rounded-full" 
                                style={{ backgroundColor: field.colour }}
                              />
                              <div>
                                <p className="font-medium">{field.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  Previous: {formatNumber(previous)} cm
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-xl font-bold">{formatNumber(current)} cm</p>
                              {change !== 0 && (
                                <p
                                  className={`text-xs flex items-center gap-1 justify-end ${
                                    isImprovement ? 'text-success' : 'text-destructive'
                                  }`}
                                >
                                  {isImprovement ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  {change > 0 ? '+' : ''}
                                  {formatNumber(Math.abs(change))} cm
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Ruler className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-muted-foreground">No measurements yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click "Update" to add your first measurements
                      </p>
                    </div>
                  )}
                </div>

                {/* Measurement History Chart */}
                <div className="stat-card">
                  <h3 className="font-semibold mb-4">Measurement History</h3>
                  
                  {sortedMeasurements.length < 2 ? (
                    <div className="h-80 flex flex-col items-center justify-center text-muted-foreground text-center">
                      <BarChart2 className="w-12 h-12 mb-3 opacity-50" />
                      <p>Add at least 2 measurements</p>
                      <p className="text-sm mt-1">to see the progress chart</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sortedMeasurements}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            
                            <XAxis
                              dataKey="date"
                              tickFormatter={(value) => formatDate(value, 'MMM d')}
                              axisLine={false}
                              tickLine={false}
                            />
                            
                            <YAxis axisLine={false} tickLine={false} />
                            
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              labelFormatter={(label) => formatDate(label, 'MMMM d, yyyy')}
                            />
                            
                            {measurementFields.map((field) => (
                              <Line
                                key={field.key}
                                type="monotone"
                                dataKey={field.key}
                                name={field.label}
                                stroke={field.colour}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                        {measurementFields.map((field) => (
                          <span key={field.key} className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: field.colour }} 
                            />
                            {field.label}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Measurements History Table */}
              {sortedMeasurements.length > 0 && (
                <div className="mt-6 stat-card">
                  <h3 className="font-semibold mb-4">Measurement History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Date</th>
                          {measurementFields.map((field) => (
                            <th key={field.key} className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                              {field.label} (cm)
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {[...sortedMeasurements]
                            .reverse()
                            .map((measurement, idx) => (
                              <motion.tr
                                key={measurement._id || idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                              >
                                <td className="py-2 px-3 text-sm">
                                  {formatDate(measurement.date, 'MMM d, yyyy')}
                                </td>
                                {measurementFields.map((field) => (
                                  <td key={field.key} className="py-2 px-3 text-sm font-medium">
                                    {measurement[field.key] ? formatNumber(measurement[field.key]) : '-'}
                                  </td>
                                ))}
                              </motion.tr>
                            ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Performance Tab - Keep original */}
            <TabsContent value="performance">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="section-title mb-0">Performance Tracking</h2>
                  <Button onClick={openAddPerfModal} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Performance
                  </Button>
                </div>

                {performanceData.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 gap-4 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">No performance data yet</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Click "Add Performance" to start tracking your activities.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Activity Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      <AnimatePresence>
                        {latestPerActivity.map(({ name, latest, prev }, idx) => {
                          const change = prev ? Number((latest.value - prev.value).toFixed(1)) : null;
                          const improving =
                            change !== null
                              ? latest.metricType === 'Time'
                                ? change < 0
                                : change > 0
                              : null;

                          return (
                            <motion.div
                              key={name}
                              layout
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ delay: idx * 0.05 }}
                              className="stat-card group relative overflow-hidden"
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                                style={{ backgroundColor: CHART_COLOURS[idx % CHART_COLOURS.length] }}
                              />

                              <div className="pl-3">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="min-w-0">
                                    <p className="font-semibold truncate">{name}</p>
                                    <span
                                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                                        CATEGORY_COLOUR[latest.category]
                                      }`}
                                    >
                                      {latest.category}
                                    </span>
                                  </div>
                                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                      onClick={() => openEditPerfModal(latest)}
                                      title="Edit latest entry"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                    <button
                                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                      onClick={() => latest._id && handleDeletePerformance(latest._id)}
                                      title="Delete latest entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-3xl font-bold">
                                  {formatNumber(latest.value)}
                                  <span className="text-base font-normal text-muted-foreground ml-1">
                                    {latest.unit}
                                  </span>
                                </p>

                                <div className="flex items-center justify-between mt-2">
                                  {change !== null ? (
                                    <span
                                      className={`flex items-center gap-1 text-sm font-medium ${
                                        improving ? 'text-success' : 'text-destructive'
                                      }`}
                                    >
                                      {improving ? (
                                        <TrendingUp className="w-3.5 h-3.5" />
                                      ) : (
                                        <TrendingDown className="w-3.5 h-3.5" />
                                      )}
                                      {change > 0 ? '+' : ''}
                                      {formatNumber(Math.abs(change))} {latest.unit}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Minus className="w-3.5 h-3.5" />
                                      First entry
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(latest.date, 'MMM d')}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>

                    {/* Chart Section */}
                    {uniqueActivities.length > 0 && (
                      <div className="chart-container">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <h3 className="font-semibold flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-primary" />
                            Progress Chart
                          </h3>
                          <Select
                            value={activeActivity}
                            onValueChange={setSelectedActivity}
                          >
                            <SelectTrigger className="w-full sm:w-52">
                              <SelectValue placeholder="Select activity" />
                            </SelectTrigger>
                            <SelectContent>
                              {uniqueActivities.map((a) => (
                                <SelectItem key={a} value={a}>
                                  {a}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {smartStats && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                            {[
                              { label: 'Personal Best', value: `${smartStats.best} ${smartStats.unit}`, icon: Trophy, colour: 'text-warning' },
                              { label: 'Average', value: `${smartStats.avg} ${smartStats.unit}`, icon: Activity, colour: 'text-primary' },
                              { label: 'Sessions', value: smartStats.total, icon: BarChart2, colour: 'text-accent' },
                              {
                                label: 'Improvement',
                                value: `${Number(smartStats.improvement) >= 0 ? '+' : ''}${smartStats.improvement}%`,
                                icon: Number(smartStats.improvement) >= 0 ? TrendingUp : TrendingDown,
                                colour: Number(smartStats.improvement) >= 0 ? 'text-success' : 'text-destructive',
                              },
                            ].map(({ label, value, icon: Icon, colour }) => (
                              <div key={label} className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Icon className={`w-4 h-4 ${colour}`} />
                                  <span className="text-xs text-muted-foreground font-medium">{label}</span>
                                </div>
                                <p className="text-lg font-bold">{value}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {chartData.length < 2 ? (
                          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                            {chartData.length === 0
                              ? 'No entries for this activity.'
                              : 'Add at least 2 entries to see the chart.'}
                          </div>
                        ) : (
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  domain={['dataMin - 2', 'dataMax + 2']}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                  }}
                                  formatter={(value: number) => [
                                    `${formatNumber(value)} ${chartData[0]?.unit || ''}`,
                                    activeActivity,
                                  ]}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke={
                                    CHART_COLOURS[
                                      uniqueActivities.indexOf(activeActivity) % CHART_COLOURS.length
                                    ]
                                  }
                                  strokeWidth={3}
                                  dot={{ r: 5 }}
                                  activeDot={{ r: 7 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    )}

                    {/* All Entries Log */}
                    <div className="stat-card">
                      <h3 className="font-semibold mb-4">All Entries</h3>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {[...performanceData]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((entry) => (
                              <motion.div
                                key={entry._id}
                                layout
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{
                                      backgroundColor:
                                        CHART_COLOURS[
                                          uniqueActivities.indexOf(entry.activityName) %
                                            CHART_COLOURS.length
                                        ],
                                    }}
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">{entry.activityName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(entry.date, 'MMM d, yyyy')}
                                      {entry.notes ? ` · ${entry.notes}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-semibold text-sm">
                                    {formatNumber(entry.value)} {entry.unit}
                                  </span>
                                  <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                      CATEGORY_COLOUR[entry.category]
                                    }`}
                                  >
                                    {entry.category}
                                  </span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                      onClick={() => openEditPerfModal(entry)}
                                    >
                                      <Pencil className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                    <button
                                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                      onClick={() => entry._id && handleDeletePerformance(entry._id)}
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Set Goal Weight Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Set Your Goal Weight
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGoalWeightSubmit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="goal-weight">
                Goal Weight (kg) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="goal-weight"
                type="number"
                step="0.1"
                min="20"
                max="300"
                placeholder="e.g. 70"
                value={goalWeightInput}
                onChange={(e) => {
                  setGoalWeightInput(e.target.value);
                  setGoalWeightError('');
                }}
              />
              {goalWeightError && <p className="text-sm text-destructive">{goalWeightError}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                Current weight: {latestWeight ? formatNumber(latestWeight.weight) : '0'} kg
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsGoalModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Goal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Log Weight Modal */}
      <Dialog open={isWeightModalOpen} onOpenChange={setIsWeightModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Log Weight
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWeightSubmit} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="weight-input">
                Weight (kg) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="weight-input"
                type="number"
                step="0.1"
                min="20"
                max="300"
                placeholder="e.g. 74.5"
                value={weightForm.weight}
                onChange={(e) => {
                  setWeightForm((prev) => ({ ...prev, weight: e.target.value }));
                  setWeightError('');
                }}
              />
              {weightError && <p className="text-sm text-destructive">{weightError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight-date">Date</Label>
              <Input
                id="weight-date"
                type="date"
                value={weightForm.date}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setWeightForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsWeightModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Measurements Modal */}
      <Dialog open={isMeasurementModalOpen} onOpenChange={setIsMeasurementModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-primary" />
              Update Body Measurements
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMeasurementSubmit} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Leave a field blank to keep the previous measurement.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {measurementFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label htmlFor={`measure-${field.key}`}>{field.label} (cm)</Label>
                  <Input
                    id={`measure-${field.key}`}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder={latestMeasurements?.[field.key]?.toString() || "0"}
                    value={measureForm[field.key]}
                    onChange={(e) =>
                      setMeasureForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="measure-date">Date</Label>
              <Input
                id="measure-date"
                type="date"
                value={measureForm.date}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setMeasureForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsMeasurementModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Measurements</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Performance Modal */}
      <Dialog open={isPerfModalOpen} onOpenChange={setIsPerfModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              {editingPerfId ? 'Edit Performance Entry' : 'Add Performance Entry'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePerfSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="perf-name">
                Activity Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="perf-name"
                placeholder="e.g. Bench Press, 5K Run"
                value={perfForm.activityName}
                onChange={(e) => {
                  setPerfForm((prev) => ({ ...prev, activityName: e.target.value }));
                  setPerfError('');
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={perfForm.category}
                  onValueChange={(v) =>
                    setPerfForm((prev) => ({ ...prev, category: v as PerformanceCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strength">Strength</SelectItem>
                    <SelectItem value="Cardio">Cardio</SelectItem>
                    <SelectItem value="Endurance">Endurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Metric Type</Label>
                <Select
                  value={perfForm.metricType}
                  onValueChange={(v) =>
                    setPerfForm((prev) => ({ ...prev, metricType: v as MetricType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weight">Weight</SelectItem>
                    <SelectItem value="Time">Time</SelectItem>
                    <SelectItem value="Distance">Distance</SelectItem>
                    <SelectItem value="Reps">Reps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="perf-value">
                  Value <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="perf-value"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 60"
                  value={perfForm.value}
                  onChange={(e) => {
                    setPerfForm((prev) => ({ ...prev, value: e.target.value }));
                    setPerfError('');
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perf-unit">Unit</Label>
                <Input
                  id="perf-unit"
                  placeholder="e.g. kg, min, km"
                  value={perfForm.unit}
                  onChange={(e) => setPerfForm((prev) => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="perf-date">Date</Label>
              <Input
                id="perf-date"
                type="date"
                value={perfForm.date}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setPerfForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perf-notes">Notes (optional)</Label>
              <Textarea
                id="perf-notes"
                placeholder="Any notes about this session"
                rows={2}
                value={perfForm.notes}
                onChange={(e) => setPerfForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {perfError && <p className="text-sm text-destructive">{perfError}</p>}

            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPerfModalOpen(false);
                  setEditingPerfId(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingPerfId ? 'Save Changes' : 'Add Entry'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}