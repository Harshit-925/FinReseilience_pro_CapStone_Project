import { useState } from "react";
import { postWhatIf } from "../api/chat";
import type { HouseholdInput } from "../types";
import { TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";

interface WhatIfPanelProps {
  baseProfile: HouseholdInput;
}

export default function WhatIfPanel({ baseProfile }: WhatIfPanelProps) {
  const [changeType, setChangeType] = useState<string>("income_raise");
  const [changeValue, setChangeValue] = useState<number>(0);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = async () => {
    if (changeValue <= 0) return;
    setIsLoading(true);
    try {
      const response = await postWhatIf({
        base_profile: baseProfile,
        change: {
          type: changeType,
          value: changeType === "income_raise" || changeType === "income_cut" 
            ? baseProfile.monthly_income + (changeType === "income_raise" ? changeValue : -changeValue)
            : changeValue,
        }
      });
      setResult(response);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--c-navy)" }}>Scenario Simulator</h3>
        <p style={{ margin: 0, fontSize: 13, color: "var(--c-muted)" }}>Simulate how financial changes impact your overall health and debt payoff timeline.</p>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Scenario</label>
          <select 
            value={changeType} 
            onChange={(e) => setChangeType(e.target.value)}
            className="input-field"
            style={{ width: "100%" }}
          >
            <option value="income_raise">I get a monthly raise of (₹)</option>
            <option value="income_cut">My monthly income drops by (₹)</option>
            <option value="expense_change">My monthly expenses change to (₹)</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Amount (₹)</label>
          <input 
            type="number" 
            value={changeValue || ""}
            onChange={(e) => setChangeValue(Number(e.target.value))}
            className="input-field"
            placeholder="e.g. 10000"
            style={{ width: "100%" }}
          />
        </div>
        <button 
          onClick={handleSimulate} 
          disabled={isLoading || changeValue <= 0}
          className="btn-primary"
          style={{ height: 42, padding: "0 24px" }}
        >
          {isLoading ? "Simulating..." : "Simulate"}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 16, padding: 20, background: "var(--c-bg)", borderRadius: 12, border: "1px solid var(--c-border)", display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 600, color: "var(--c-navy)" }}>
            <Activity size={18} color="var(--c-emerald)" />
            Simulation Impact
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {/* Health Score Card */}
            <div style={{ padding: 16, background: "var(--c-white)", borderRadius: 8, border: "1px solid var(--c-border)" }}>
              <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 4 }}>Health Score</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: "var(--c-navy)" }}>{result.after.health_score.toFixed(1)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: result.delta.health_score > 0 ? "var(--c-emerald)" : result.delta.health_score < 0 ? "var(--c-coral)" : "var(--c-muted)", display: "flex", alignItems: "center", gap: 2 }}>
                  {result.delta.health_score > 0 ? <TrendingUp size={14} /> : result.delta.health_score < 0 ? <TrendingDown size={14} /> : null}
                  {Math.abs(result.delta.health_score).toFixed(1)} pt
                </span>
              </div>
            </div>

            {/* Surplus Card */}
            <div style={{ padding: 16, background: "var(--c-white)", borderRadius: 8, border: "1px solid var(--c-border)" }}>
              <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 4 }}>Monthly Surplus</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: "var(--c-navy)" }}>₹{result.after.surplus.toLocaleString()}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: result.delta.surplus > 0 ? "var(--c-emerald)" : result.delta.surplus < 0 ? "var(--c-coral)" : "var(--c-muted)", display: "flex", alignItems: "center", gap: 2 }}>
                  {result.delta.surplus > 0 ? <TrendingUp size={14} /> : result.delta.surplus < 0 ? <TrendingDown size={14} /> : null}
                  ₹{Math.abs(result.delta.surplus).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Debt Free Month Card */}
            <div style={{ padding: 16, background: "var(--c-white)", borderRadius: 8, border: "1px solid var(--c-border)" }}>
              <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 4 }}>Debt Free Timeline</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: "var(--c-navy)" }}>
                  {result.after.debt_free_month === result.before.debt_free_month ? "No Change" : result.after.debt_free_month > result.before.debt_free_month ? "Delayed" : "Accelerated"}
                </span>
                {result.delta.months_saved !== 0 && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: result.delta.months_saved > 0 ? "var(--c-emerald)" : "var(--c-coral)", display: "flex", alignItems: "center", gap: 2 }}>
                    <Calendar size={14} />
                    {result.delta.months_saved > 0 ? `${result.delta.months_saved}mo saved` : `${Math.abs(result.delta.months_saved)}mo delayed`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
