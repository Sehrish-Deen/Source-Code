
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Plus, Search, Filter, Clock, Flame, Edit2, Trash2, X, Save } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Workout, getWorkouts, addWorkout, deleteWorkout, updateWorkout } from '@/services/workoutService';
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';
import 'react-toastify/dist/ReactToastify.css';

// Framer motion variants
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

// Generate frontend-only unique ID
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

type ExerciseWithId = Workout['exercises'][number] & { id: string };

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchWorkouts = async () => {
    try {
      const data = await getWorkouts();
      setWorkouts(data);
    } catch {
      toast.error("Failed to fetch workouts");
    }
  };

  useEffect(() => { fetchWorkouts(); }, []);

  const handleAddWorkout = async (workout: Workout) => {
    try {
      await addWorkout(workout);
      toast.success("Workout added successfully!");
      fetchWorkouts();
      setIsAddModalOpen(false);
    } catch {
      toast.error("Failed to add workout");
    }
  };

  const handleUpdateWorkout = async (id: string, workout: Workout) => {
    try {
      await updateWorkout(id, workout);
      toast.success("Workout updated successfully!");
      fetchWorkouts();
      setSelectedWorkout(null);
    } catch {
      toast.error("Failed to update workout");
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This workout will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteWorkout(id);
        toast.success("Workout deleted successfully!");
        fetchWorkouts();
      } catch {
        toast.error("Failed to delete workout");
      }
    }
  };

  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch =
      workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || workout.category === categoryFilter;
    const matchesDate = !dateFilter || workout.date.split('T')[0] === dateFilter;
    return matchesSearch && matchesCategory && matchesDate;
  });


  return (
    <Layout>
      <ToastContainer position="top-right" autoClose={2000} />
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Workouts</h1>
            <p className="page-description">Track and manage your exercise sessions</p>
          </div>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Workout
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create New Workout</DialogTitle></DialogHeader>
              <WorkoutForm onClose={() => setIsAddModalOpen(false)} onSave={handleAddWorkout} />
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workouts or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-fitness pl-12 w-full"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44 h-12">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Strength">Strength</SelectItem>
              <SelectItem value="Cardio">Cardio</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-full sm:w-44">
            <input
              type="date"
              className="input-fitness h-12 w-full"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Workout List */}
        <motion.div variants={itemVariants} className="space-y-4">
          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No workouts found</p>
            </div>
          ) : (
            filteredWorkouts.map(workout => (
              <motion.div
                key={workout._id}
                variants={itemVariants}
                className="stat-card hover:shadow-fitness-lg transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl flex-shrink-0", workout.category === 'Strength' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent')}>
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg">{workout.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{new Date(workout.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg hover:bg-muted" onClick={() => setSelectedWorkout(workout)}>
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-destructive/10" onClick={() => handleDeleteWorkout(workout._id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" /> {workout.duration} min
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Flame className="w-4 h-4" /> {workout.caloriesBurned} cal
                      </span>
                      <span className="workout-tag">{workout.category}</span>
                    </div>

                    <div className="flex flex-col gap-1 mt-3">
                      {workout.exercises.map((ex, i) => (
                        <span key={i} className="text-sm text-muted-foreground">
                          {ex.name} - {ex.sets} × {ex.reps}{ex.weight > 0 ? ` @ ${ex.weight}kg` : ""}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {workout.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Workout Edit Modal */}
        <Dialog open={!!selectedWorkout} onOpenChange={() => setSelectedWorkout(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedWorkout && (
              <WorkoutForm 
                initialData={selectedWorkout} 
                onClose={() => setSelectedWorkout(null)} 
                onSave={(w) => handleUpdateWorkout(selectedWorkout._id, w)} 
              />
            )}
          </DialogContent>
        </Dialog>

      </motion.div>
    </Layout>
  );
}

/* ---------------- Workout Form with Toasts ---------------- */
function WorkoutForm({ onClose, onSave, initialData }: { onClose: () => void; onSave: (w: Workout) => void; initialData?: Workout }) {
  const [exercises, setExercises] = useState<ExerciseWithId[]>(
    initialData?.exercises.map(ex => ({ ...ex, id: generateId() })) || 
    [{ id: generateId(), name: "", sets: 0, reps: 0, weight: 0 }]
  );

  const [form, setForm] = useState<Workout>({
    name: initialData?.name || "",
    category: initialData?.category || "Strength",
    duration: initialData?.duration || 0,
    caloriesBurned: initialData?.caloriesBurned || 0,
    date: initialData?.date || new Date().toISOString(),
    tags: initialData?.tags || [],
    notes: initialData?.notes || "",
    exercises: exercises,
    _id: initialData?._id
  });

  useEffect(() => setForm(f => ({ ...f, exercises })), [exercises]);

  const addExercise = () => setExercises([...exercises, { id: generateId(), name: "", sets: 0, reps: 0, weight: 0 }]);
  const removeExercise = (id: string) => exercises.length > 1 && setExercises(exercises.filter(e => e.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, exercises: exercises.map(({ id, ...rest }) => rest) };
      await onSave(payload);
      
      onClose();
    } catch (error) {
      toast.error("Failed to save workout");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Name, Category, Duration, Calories, Date */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Workout Name</label>
        <input type="text" placeholder="Workout Name" className="input-fitness" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Category</label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as "Strength" | "Cardio" })}>
            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Strength">Strength</SelectItem>
              <SelectItem value="Cardio">Cardio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Duration (min)</label>
          <input type="number" placeholder="e.g., 45" className="input-fitness" value={form.duration || ""} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Calories Burned</label>
          <input type="number" placeholder="e.g., 350" className="input-fitness" value={form.caloriesBurned || ""} onChange={e => setForm({ ...form, caloriesBurned: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Date</label>
          <input type="date" className="input-fitness" value={form.date.split('T')[0]} onChange={e => setForm({ ...form, date: new Date(e.target.value).toISOString() })} />
        </div>
      </div>

      {/* Exercises */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">Exercises</label>
          <button type="button" onClick={addExercise} className="text-sm text-primary font-medium hover:underline">+ Add Exercise</button>
        </div>
        <div className="space-y-3">
          {exercises.map((ex, idx) => (
            <div key={ex.id} className="p-3 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exercise {idx + 1}</span>
                {exercises.length > 1 && <button type="button" onClick={() => removeExercise(ex.id)} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></button>}
              </div>
              <input type="text" placeholder="Exercise name" className="input-fitness h-10" value={ex.name} onChange={e => { const newEx = [...exercises]; newEx[idx].name = e.target.value; setExercises(newEx); }} />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Sets" className="input-fitness h-10" value={ex.sets || ""} onChange={e => { const newEx = [...exercises]; newEx[idx].sets = Number(e.target.value); setExercises(newEx); }} />
                <input type="number" placeholder="Reps" className="input-fitness h-10" value={ex.reps || ""} onChange={e => { const newEx = [...exercises]; newEx[idx].reps = Number(e.target.value); setExercises(newEx); }} />
                <input type="number" placeholder="Weight (kg)" className="input-fitness h-10" value={ex.weight || ""} onChange={e => { const newEx = [...exercises]; newEx[idx].weight = Number(e.target.value); setExercises(newEx); }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags & Notes */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Tags (comma separated)</label>
        <input type="text" className="input-fitness" placeholder="upper body, compound" value={form.tags.join(", ")} onChange={e => setForm({ ...form, tags: e.target.value.split(",").map(t => t.trim()) })} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Notes</label>
        <textarea className="input-fitness min-h-[80px] resize-none" placeholder="Any notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1"><Save className="w-4 h-4" /><span>Save Workout</span></button>
      </div>
    </form>
  );
}
