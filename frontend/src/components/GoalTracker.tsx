/**
 * GoalTracker — Set and track financial goals.
 * Writes directly to pb.collection("goals").
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import pb from "../api/pocketbase";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import type { GoalRecord } from "../types";

export default function GoalTracker() {
  const { user } = useAuthStore();
  const { result } = useAppStore();
  const [goal, setGoal] = useState<GoalRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [targetScore, setTargetScore] = useState("90");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchGoal = async () => {
      try {
        const result = await pb.collection("goals").getList<GoalRecord>(1, 1, {
          sort: "-created",
        });
        if (result.items.length > 0) {
          setGoal(result.items[0]);
        }
      } catch (err) {
        console.error("Failed to fetch goal:", err);
      }
    };
    
    fetchGoal();
  }, [user]);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const target = parseInt(targetScore, 10);
    if (isNaN(target) || target <= 0 || target > 100) {
      toast.error("Enter a valid target score between 1 and 100");
      return;
    }

    const currentScore = result?.health_score?.score || 0;
    if (target <= currentScore) {
      toast.error("Target score must be higher than your current score");
      return;
    }

    setIsLoading(true);
    try {
      const newGoal = await pb.collection("goals").create<GoalRecord>({
        user: user.id,
        target: target,
        baseline: currentScore,
        achieved: false,
      });
      setGoal(newGoal);
      setIsEditing(false);
      toast.success("Goal set!");
    } catch {
      toast.error("Failed to save goal");
    } finally {
      setIsLoading(false);
    }
  };

  const currentScore = result?.health_score?.score || 0;

  // Render empty state if no goal and not editing
  if (!goal && !isEditing) {
    return (
      <div className="bg-white border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-2 text-slate-700">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-headline uppercase tracking-wider">Set a Goal</h3>
            <p className="text-xs text-slate-500 mt-1">Target a specific health score</p>
          </div>
        </div>
        <button className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded transition-colors uppercase tracking-wider" onClick={() => setIsEditing(true)}>
          Create
        </button>
      </div>
    );
  }

  // Render edit form
  if (isEditing) {
    return (
      <div className="bg-white border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 font-headline uppercase tracking-wider mb-4">New Target Score</h3>
        <form onSubmit={handleSaveGoal} className="flex gap-2">
          <input
            type="number"
            className="w-24 px-3 py-2 border border-slate-300 focus:border-slate-900 outline-none text-sm font-body bg-white text-slate-900"
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
            min="1"
            max="100"
            placeholder="e.g. 90"
            autoFocus
          />
          <button type="submit" className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded transition-colors uppercase tracking-wider flex items-center" disabled={isLoading}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Save"}
          </button>
          <button type="button" className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded transition-colors uppercase tracking-wider" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  // Render active goal progress
  if (goal) {
    const isAchieved = currentScore >= goal.target;
    // Calculate progress percentage based on baseline
    const totalDistance = goal.target - goal.baseline;
    const currentDistance = currentScore - goal.baseline;
    const progressPercent = totalDistance > 0 
      ? Math.max(0, Math.min(100, (currentDistance / totalDistance) * 100))
      : 100;

    return (
      <div className="bg-white border border-slate-200 p-6 shadow-sm relative overflow-hidden">
        {/* Subtle top border for achievement */}
        <div className={`absolute top-0 left-0 w-full h-1 ${isAchieved ? "bg-emerald-500" : "bg-slate-200"}`}></div>

        <div className="flex justify-between items-start mb-6 mt-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${isAchieved ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-700"}`}>
              {isAchieved ? <Flag size={16} /> : <Target size={16} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-headline uppercase tracking-wider">Target Score: {goal.target}</h3>
              <p className={`text-xs mt-1 font-medium ${isAchieved ? "text-emerald-600" : "text-slate-500"}`}>
                {isAchieved ? "Goal achieved! 🎉" : `${(goal.target - currentScore).toFixed(1)} points to go`}
              </p>
            </div>
          </div>
          <button 
            className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 uppercase tracking-wider transition-colors"
            onClick={() => {
              setTargetScore(goal.target.toString());
              setIsEditing(true);
            }} 
          >
            Edit
          </button>
        </div>

        <div className="h-2 w-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            className={`h-full ${isAchieved ? "bg-emerald-500" : "bg-slate-800"}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Baseline: {goal.baseline}</span>
          <span>Target: {goal.target}</span>
        </div>
      </div>
    );
  }

  return null;
}
