/**
 * History Chart — Recharts LineChart for tracking health score over time.
 * Realtime updates via PocketBase subscription (no polling).
 * Desktop: inline. Mobile: inside a Vaul Drawer.
 */
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Drawer } from "vaul";
import { Activity, X, Loader2 } from "lucide-react";
import pb from "../api/pocketbase";
import { useAuthStore } from "../store/useAuthStore";
import { useAppStore } from "../store/useAppStore";
import type { HistoryRecord } from "../types";

export default function HistoryChart() {
  const { user } = useAuthStore();
  const { result } = useAppStore();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch initial history & subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const result = await pb.collection("history").getList<HistoryRecord>(1, 50, {
          sort: "created", // Ascending
        });
        if (isSubscribed) setRecords(result.items);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        if (isSubscribed) setIsLoading(false);
      }
    };

    fetchHistory();

    // Subscribe to realtime updates
    pb.collection("history").subscribe<HistoryRecord>("*", (e) => {
      if (e.action === "create") {
        setRecords((prev) => [...prev, e.record]);
      } else if (e.action === "delete") {
        setRecords((prev) => prev.filter((r) => r.id !== e.record.id));
      }
    });

    return () => {
      isSubscribed = false;
      pb.collection("history").unsubscribe("*");
    };
  }, [user, result]); // Refresh on new result

  // Format data for chart
  const chartData = useMemo(() => {
    return records.map((record) => {
      const date = new Date(record.created);
      const score = (record.engine_result?.health_score as { score?: number })?.score || 0;
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: date.toLocaleDateString("en-US", { year: 'numeric', month: "short", day: "numeric" }),
        score,
      };
    });
  }, [records]);

  const latestScore = chartData.length > 0 ? chartData[chartData.length - 1].score : null;
  const previousScore = chartData.length > 1 ? chartData[chartData.length - 2].score : null;
  const trend = latestScore !== null && previousScore !== null ? latestScore - previousScore : 0;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 p-6 shadow-sm flex justify-center py-12">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white border border-slate-200 p-6 shadow-sm text-center py-8">
        <Activity size={24} className="mx-auto mb-3 text-slate-300" />
        <p className="text-sm text-slate-500 font-body">
          Complete your first analysis to start tracking progress.
        </p>
      </div>
    );
  }

  const chartContent = (
    <div className="h-[260px] w-full mt-4" role="img" aria-label="Line chart showing financial health score trend over time">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "#ffffff", 
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              color: "#0f172a"
            }}
            labelStyle={{ color: "#64748b", marginBottom: 4 }}
            itemStyle={{ color: "#10B981", fontWeight: 600 }}
            formatter={(value: any) => [`${Number(value).toLocaleString()}`, "Score"]}
            labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#10B981" 
            strokeWidth={3}
            dot={{ fill: "#ffffff", stroke: "#10B981", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#10B981" }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Fallback table for screen readers */}
      <table className="sr-only">
        <caption>Health Score History</caption>
        <thead>
          <tr><th>Date</th><th>Score</th></tr>
        </thead>
        <tbody>
          {chartData.map((d, i) => (
            <tr key={i}><td>{d.fullDate}</td><td>{d.score}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const headerContent = (
    <div>
      <h3 className="text-sm font-bold text-slate-900 font-headline uppercase tracking-wider">
        Progress Tracker
      </h3>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-2xl font-bold text-slate-900">
          {latestScore}
        </span>
        {trend !== 0 && (
          <span className={`text-sm font-bold ${trend > 0 ? "text-emerald-500" : "text-red-500"}`}>
            {trend > 0 ? "+" : ""}{trend.toFixed(1)} pts
          </span>
        )}
      </div>
    </div>
  );

  // Desktop inline rendering
  if (!isMobile) {
    return (
      <motion.section 
        className="bg-white border border-slate-200 p-6 shadow-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {headerContent}
        {chartContent}
      </motion.section>
    );
  }

  // Mobile Drawer rendering
  return (
    <>
      <motion.button
        className="bg-white border border-slate-200 p-6 shadow-sm w-full text-left flex justify-between items-center cursor-pointer"
        onClick={() => setDrawerOpen(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileTap={{ scale: 0.98 }}
      >
        {headerContent}
        <Activity size={24} className="text-emerald-500" />
      </motion.button>

      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 z-40" />
          <Drawer.Content 
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-slate-50 rounded-t-2xl p-6 flex flex-col z-50 border-t border-slate-200"
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
            
            <div className="flex justify-between items-start mb-4">
              {headerContent}
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                aria-label="Close chart"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 min-h-0 bg-white border border-slate-200 p-4 rounded shadow-sm">
              {/* Only render chart when drawer is open to prevent 0x0 SVG issues */}
              {drawerOpen && chartContent}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
