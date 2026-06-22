/**
 * ResultsPanel — displays analysis output in prioritized order:
 * 1. Action Cards (HERO — first thing user sees)
 * 2. Payoff Schedule (expandable table)
 * 3. Health Score + Grade + Comparison
 * 4. AI Narrative (last — supporting text)
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { AnalysisResponse } from "../types";

interface ResultsPanelProps {
  result: AnalysisResponse;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  }),
};

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}





export default function ResultsPanel({ result }: ResultsPanelProps) {
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  // Show fallback warning toast
  if (result.fallback_used) {
    toast.warning("AI narrative unavailable — showing engine-generated summary", {
      id: "fallback-warning",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      aria-live="polite"
      className="max-w-7xl mx-auto space-y-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-extrabold text-slate-900 tracking-tight">FinResilience Pro Dashboard</h1>
          <p className="text-slate-500 font-body text-sm mt-1">Real-time institutional liquidity and debt amortization analysis.</p>
        </div>
      </div>

      {/* ─── SECTION 1: ACTION CARDS (HERO) ─── */}
      <section aria-labelledby="action-heading">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-6 bg-slate-900"></span>
          <h2 id="action-heading" className="text-lg font-headline font-bold text-slate-900 uppercase tracking-widest">Next Rupee Allocation</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {result.action_cards.map((card, i) => (
            <motion.div
              key={card.priority}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Top color bar depending on action type */}
              <div className={`absolute top-0 left-0 w-full h-1 ${card.action_type === 'PAY_DEBT' ? 'bg-red-500' : card.action_type === 'INVEST_TAX' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
              
              <div>
                <div className="flex justify-between items-start mb-4 mt-1">
                  <span className={`material-symbols-outlined p-2 rounded ${card.action_type === 'PAY_DEBT' ? 'bg-red-50 text-red-600' : card.action_type === 'INVEST_TAX' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {card.action_type === 'PAY_DEBT' ? 'trending_down' : card.action_type === 'INVEST_TAX' ? 'savings' : 'piggy_bank'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter bg-slate-50 px-2 py-0.5 border border-slate-200">Priority 0{card.priority}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{card.destination}</h3>
                <p className="text-2xl font-headline font-extrabold text-slate-900">{formatCurrency(card.amount)}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{card.rationale}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{card.impact_metric}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 2: PAYOFF SCHEDULE ─── */}
      {result.payoff_schedule.schedule.length > 0 && (
        <section aria-labelledby="payoff-heading">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-6 bg-slate-900"></span>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <h2 id="payoff-heading" className="text-lg font-headline font-bold text-slate-900 uppercase tracking-widest">Debt Payoff Schedule</h2>
                <p className="text-xs text-slate-500 mt-1">🎯 Debt-free by Month {result.payoff_schedule.debt_free_month} · 💰 Interest saved: {formatCurrency(result.payoff_schedule.total_interest_saved_vs_minimum)}</p>
              </div>
              <button
                className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 transition-colors flex items-center gap-1 border border-slate-200"
                onClick={() => setScheduleExpanded(!scheduleExpanded)}
              >
                {scheduleExpanded ? <>Hide <ChevronUp size={14} /></> : <>Expand <ChevronDown size={14} /></>}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {scheduleExpanded && (
              <motion.div
                id="payoff-table"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden bg-white border border-slate-200 shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-500">Month</th>
                        {result.payoff_schedule.schedule[0]?.payments.map((p) => (
                          <th key={p.debt_name} className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-500">{p.debt_name}</th>
                        ))}
                        <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-500">Cum. Interest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.payoff_schedule.schedule.map((row) => (
                        <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{row.month}</td>
                          {row.payments.map((p) => (
                            <td key={p.debt_name} className="px-6 py-4">
                              <div className="font-medium text-slate-900">{formatCurrency(p.payment_amount)}</div>
                              <div className={`text-[11px] mt-0.5 ${p.running_balance <= 0 ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                                {p.running_balance <= 0 ? "✓ Paid off" : `Bal: ${formatCurrency(p.running_balance)}`}
                              </div>
                            </td>
                          ))}
                          <td className="px-6 py-4 text-slate-500 font-medium">{formatCurrency(row.cumulative_interest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* ─── SECTION 3: HEALTH SCORE + GRADE + COMPARISON ─── */}
      <section aria-labelledby="health-heading">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1.5 h-6 bg-slate-900"></span>
          <h2 id="health-heading" className="text-lg font-headline font-bold text-slate-900 uppercase tracking-widest">Financial Health</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Score Hero */}
          <div className="bg-slate-900 text-white p-8 flex flex-col justify-center items-center text-center shadow-md">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold font-headline mb-4 border-4 ${
                result.grade.startsWith("A") ? "border-emerald-400 text-emerald-400" :
                result.grade.startsWith("B") ? "border-blue-400 text-blue-400" :
                result.grade.startsWith("C") ? "border-yellow-400 text-yellow-400" :
                "border-red-400 text-red-400"
              }`}
            >
              {result.grade}
            </motion.div>
            <p className="text-5xl font-headline font-extrabold tracking-tight mb-2">{result.health_score.score}<span className="text-2xl text-slate-400 font-normal">/100</span></p>
            <p className="text-sm text-slate-300 font-medium uppercase tracking-wider">{result.grade_label}</p>
          </div>

          {/* Gauges */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-center gap-6">
            {/* FOIR Gauge */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">FOIR <span className="text-slate-900">{result.health_score.foir_ratio}%</span></span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{result.health_score.component_benchmarks.foir}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 overflow-hidden">
                <motion.div
                  className={`h-full ${result.health_score.foir_ratio <= 30 ? "bg-emerald-500" : result.health_score.foir_ratio <= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((result.health_score.foir_ratio / 100) * 100, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
              </div>
            </div>

            {/* Savings Rate Gauge */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Savings Rate <span className="text-slate-900">{result.health_score.savings_rate}%</span></span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{result.health_score.component_benchmarks.savings}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 overflow-hidden">
                <motion.div
                  className={`h-full ${result.health_score.savings_rate >= 20 ? "bg-emerald-500" : result.health_score.savings_rate >= 10 ? "bg-yellow-500" : "bg-red-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((Math.max(result.health_score.savings_rate, 0) / 50) * 100, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                />
              </div>
            </div>

            {/* Emergency Buffer */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Emergency Buffer <span className="text-slate-900">{result.health_score.emergency_months} mo</span></span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{result.health_score.component_benchmarks.emergency}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 overflow-hidden">
                <motion.div
                  className={`h-full ${result.health_score.emergency_months >= 3 ? "bg-emerald-500" : result.health_score.emergency_months >= 1.5 ? "bg-yellow-500" : "bg-red-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((result.health_score.emergency_months / 6) * 100, 100)}%` }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                />
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider border-t border-slate-100 pt-4">Benchmarks: RBI & SBI/HDFC FOIR Guidelines · 50/30/20 Domestic Savings Rule</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: AI NARRATIVE ─── */}
      {result.ai_narrative && (
        <section aria-labelledby="narrative-heading" className="bg-slate-50 border border-slate-200 p-8 shadow-sm relative overflow-hidden">
          {/* Subtle pattern or accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <span className="material-symbols-outlined text-slate-900 bg-white p-2 border border-slate-200 shadow-sm">neurology</span>
            <h3 id="narrative-heading" className="text-sm font-bold text-slate-900 uppercase tracking-widest">
              {result.fallback_used ? "Engine Summary" : "AI Institutional Intelligence"}
            </h3>
            {result.fallback_used && (
              <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 border border-yellow-200 px-2 py-0.5 uppercase tracking-wider">Fallback</span>
            )}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-body relative z-10 max-w-4xl">
            {result.ai_narrative}
          </p>
        </section>
      )}
    </motion.div>
  );
}
