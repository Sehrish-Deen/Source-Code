import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { MealType } from "@/services/nutritionService";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ToastContainer } from "react-toastify";

import {
  Utensils,
  Plus,
  Search,
  Filter,
  Flame,
  Save,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Trash2,
  Calendar
} from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import {
  getMeals,
  addMeal,
  deleteMeal,
  Meal,
} from "@/services/nutritionService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

/* ------------------- Constants ------------------- */
const mealIcons = {
  Breakfast: Coffee,
  Lunch: Sun,
  Dinner: Moon,
  Snack: Cookie,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

/* ------------------- Component ------------------- */
export default function Nutrition() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mealFilter, setMealFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(""); // <-- Date filter
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch meals from backend
  const fetchMeals = async () => {
    const data = await getMeals();
    setMeals(data);
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  // Filter meals by search, type, and date
  const filteredMeals = meals.filter((meal) => {
    const matchesSearch = meal.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = mealFilter === "all" || meal.type === mealFilter;
    const matchesDate = !dateFilter || meal.date === dateFilter;
    return matchesSearch && matchesType && matchesDate;
  });

  // Totals for daily summary
  const totals = filteredMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fats: acc.fats + m.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const macroDistribution = [
    { name: "Protein", value: totals.protein, color: "#10b981" },
    { name: "Carbs", value: totals.carbs, color: "#facc15" },
    { name: "Fats", value: totals.fats, color: "#f97316" },
  ];

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
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="page-title">Nutrition</h1>
            <p className="page-description">Track your daily food intake</p>
          </div>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Meal
              </button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Log Meal</DialogTitle>
              </DialogHeader>

              <MealForm
                onSuccess={() => {
                  fetchMeals();
                  setIsAddModalOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Daily Summary */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <div className="col-span-2 lg:col-span-1 stat-card stat-card-accent">
            <div className="text-center">
              <Flame className="w-8 h-8 mx-auto mb-2 opacity-90" />
              <p className="text-3xl font-bold">{totals.calories}</p>
              <p className="text-sm opacity-80">Calories</p>
            </div>
          </div>

          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-primary">{totals.protein}g</p>
            <p className="text-sm text-muted-foreground">Protein</p>
          </div>

          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-warning">{totals.carbs}g</p>
            <p className="text-sm text-muted-foreground">Carbs</p>
          </div>

          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-accent">{totals.fats}g</p>
            <p className="text-sm text-muted-foreground">Fats</p>
          </div>

          <div className="col-span-2 lg:col-span-1 stat-card flex items-center justify-center">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={macroDistribution}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={3}
                >
                  {macroDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search by name */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search meals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-fitness pl-12 w-full"
            />
          </div>

          {/* Filter by meal type */}
          <Select value={mealFilter} onValueChange={setMealFilter}>
            <SelectTrigger className="w-full sm:w-44 h-12">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Meal Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              <SelectItem value="Breakfast">Breakfast</SelectItem>
              <SelectItem value="Lunch">Lunch</SelectItem>
              <SelectItem value="Dinner">Dinner</SelectItem>
              <SelectItem value="Snack">Snack</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter by date */}
          <div>
            <input
              type="date"
              className="input-fitness h-12"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Meals by Type */}
        {["Breakfast", "Lunch", "Dinner", "Snack"].map((mealType) => {
          const typeMeals = filteredMeals.filter((m) => m.type === mealType);
          if (mealFilter !== "all" && mealFilter !== mealType) return null;
          if (typeMeals.length === 0) return null;

          const Icon = mealIcons[mealType as keyof typeof mealIcons];

          return (
            <motion.div key={mealType} variants={itemVariants}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-semibold">{mealType}</h2>
                <span className="text-sm text-muted-foreground">
                  ({typeMeals.reduce((sum, m) => sum + m.calories, 0)} cal)
                </span>
              </div>

              <div className="space-y-3">
                {typeMeals.map((meal) => (
                  <motion.div
                    key={meal.id}
                    variants={itemVariants}
                    className="stat-card hover:shadow-fitness-lg transition-all flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "p-3 rounded-xl flex-shrink-0",
                          meal.type === "Breakfast"
                            ? "bg-warning/10 text-warning"
                            : meal.type === "Lunch"
                            ? "bg-success/10 text-success"
                            : meal.type === "Dinner"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/10 text-accent"
                        )}
                      >
                        <Utensils className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{meal.name}</h3>
                        <p className="text-sm text-muted-foreground">{meal.quantity}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(meal.date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">{meal.calories} cal</p>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="text-primary">P: {meal.protein}g</span>
                          <span className="text-warning">C: {meal.carbs}g</span>
                          <span className="text-accent">F: {meal.fats}g</span>
                        </div>
                      </div>
                    </div>

                   <button
  onClick={async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This meal will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await deleteMeal(meal.id);
        toast.success("Meal deleted successfully!");
        fetchMeals();
      } catch (error) {
        toast.error("Failed to delete meal");
      }
    }
  }}
>
  <Trash2 size={18} />
</button>

                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {filteredMeals.length === 0 && (
          <motion.div variants={itemVariants} className="text-center py-12">
            <Utensils className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No meals logged</p>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}

/* ------------------- Meal Form ------------------- */
type MealFormProps = {
  onSuccess: () => void;
};

type CreateMeal = Omit<Meal, "id">;

function MealForm({ onSuccess }: MealFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<CreateMeal>({
    type: "Breakfast",
    name: "",
    quantity: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    date: today,
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Convert empty strings to 0 for number fields
    const submissionData = {
      ...form,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fats: Number(form.fats) || 0,
    };
    
    try {
      await addMeal(submissionData);
      toast.success("Meal added successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Failed to add meal");
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Date</label>
          <input
            type="date"
            className="input-fitness w-full"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Meal Type</label>
          <Select
            value={form.type}
            onValueChange={(v) => setForm({ ...form, type: v as MealType })}
          >
            <SelectTrigger className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Breakfast">Breakfast</SelectItem>
              <SelectItem value="Lunch">Lunch</SelectItem>
              <SelectItem value="Dinner">Dinner</SelectItem>
              <SelectItem value="Snack">Snack</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Food Name</label>
        <input
          type="text"
          placeholder="e.g., Grilled Chicken Salad"
          className="input-fitness"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">Quantity</label>
        <input
          type="text"
          placeholder="e.g., 1 bowl, 200g"
          className="input-fitness"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Calories</label>
          <input
            type="number"
            className="input-fitness"
            value={form.calories === 0 ? "" : form.calories}
            onChange={(e) =>
              setForm({ 
                ...form, 
                calories: e.target.value === "" ? 0 : Number(e.target.value)
              })
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Protein (g)</label>
          <input
            type="number"
            className="input-fitness"
            value={form.protein === 0 ? "" : form.protein}
            onChange={(e) =>
              setForm({ 
                ...form, 
                protein: e.target.value === "" ? 0 : Number(e.target.value)
              })
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Carbs (g)</label>
          <input
            type="number"
            className="input-fitness"
            value={form.carbs === 0 ? "" : form.carbs}
            onChange={(e) =>
              setForm({ 
                ...form, 
                carbs: e.target.value === "" ? 0 : Number(e.target.value)
              })
            }
            placeholder="0"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Fats (g)</label>
          <input
            type="number"
            className="input-fitness"
            value={form.fats === 0 ? "" : form.fats}
            onChange={(e) =>
              setForm({ 
                ...form, 
                fats: e.target.value === "" ? 0 : Number(e.target.value)
              })
            }
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onSuccess} className="btn-outline flex-1">
          Cancel
        </button>

        <button type="submit" className="btn-primary flex-1">
          <Save className="w-4 h-4" />
          <span>Log Meal</span>
        </button>
      </div>
    </form>
  );
}