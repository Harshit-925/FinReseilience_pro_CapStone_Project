/**
 * InputForm — Premium financial profile input based on Stitch "Institutional Resilience" design.
 * Clean two-pane layout: structured inputs on left with ₹ prefix currency fields.
 */
import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "../store/useAppStore";
import type { HouseholdInput, DebtInput, TaxInvestmentInput } from "../types";

const DEMO_DEBTS: DebtInput[] = [];
const DEMO_INVESTMENTS: TaxInvestmentInput[] = [];
const DEMO: HouseholdInput = {
  monthly_income: 0, monthly_expenses: 0, basic_salary: 0,
  monthly_rent: 0, monthly_hra: 0, city_type: "metro", tax_regime: "old",
  age_self: 0, age_parents: 0, education_loan_interest: 0,
  debts: DEMO_DEBTS, existing_investments: DEMO_INVESTMENTS,
};

const S = {
  label: { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--c-muted)", marginBottom: 6 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--c-navy)", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: 7 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  currencyWrap: { position: "relative" as const },
  currencyPrefix: { position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 600, color: "var(--c-muted)", pointerEvents: "none" as const, userSelect: "none" as const },
};

function CurrencyInput({ id, value, onChange, placeholder }: { id: string; value: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <div style={S.currencyWrap}>
      <span style={S.currencyPrefix}>₹</span>
      <input
        id={id} type="number" className="input-field"
        style={{ paddingLeft: 24, fontVariantNumeric: "tabular-nums" }}
        value={value || ""} onChange={e => onChange(Number(e.target.value))}
        placeholder={placeholder || "0"}
      />
    </div>
  );
}

function Toggle<T extends string>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="toggle-group">
      {options.map(opt => (
        <button key={opt.value} type="button" className={`toggle-option ${value === opt.value ? "active" : ""}`} onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function InputForm() {
  const [form, setForm] = useState<HouseholdInput>(DEMO);
  const { analyze, isLoading } = useAppStore();

  const set = <K extends keyof HouseholdInput>(key: K, val: HouseholdInput[K]) =>
    setForm(p => ({ ...p, [key]: val }));

  const addDebt = () => setForm(p => ({ ...p, debts: [...p.debts, { name: "", balance: 0, apr: 0, min_payment: 0 }] }));
  const removeDebt = (i: number) => setForm(p => ({ ...p, debts: p.debts.filter((_, j) => j !== i) }));
  const updateDebt = (i: number, k: keyof DebtInput, v: string | number) =>
    setForm(p => ({ ...p, debts: p.debts.map((d, j) => j === i ? { ...d, [k]: v } : d) }));

  const addInv = () => setForm(p => ({ ...p, existing_investments: [...p.existing_investments, { section: "80C", instrument: "", amount: 0 }] }));
  const removeInv = (i: number) => setForm(p => ({ ...p, existing_investments: p.existing_investments.filter((_, j) => j !== i) }));
  const updateInv = (i: number, k: keyof TaxInvestmentInput, v: string | number) =>
    setForm(p => ({ ...p, existing_investments: p.existing_investments.map((d, j) => j === i ? { ...d, [k]: v } : d) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.monthly_income <= 0) { toast.error("Monthly income must be positive"); return; }
    try { await analyze(form); }
    catch { toast.error("Analysis failed — please try again"); }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Financial Profile Form">

      {/* ── Card Header ── */}
      <div style={{ background: "var(--c-white)", border: "1px solid var(--c-border)", borderRadius: "8px 8px 0 0", borderBottom: "none", padding: "18px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <span className="material-symbols-outlined" style={{ color: "var(--c-emerald)", fontSize: 20 }}>tune</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--c-navy)", letterSpacing: "-0.01em" }}>Your Financial Profile</h1>
          <p style={{ margin: 0, fontSize: 12, color: "var(--c-muted)" }}>Enter your financial snapshot below to analyze and optimize your capital</p>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div style={{ background: "var(--c-white)", border: "1px solid var(--c-border)", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "24px" }}>

        {/* Income & Salary */}
        <div style={S.section}>
          <div style={S.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>payments</span>
            Income & Salary
          </div>
          <div style={{ marginBottom: 14 }}>
            <label htmlFor="income" style={S.label}>Monthly Net Income</label>
            <CurrencyInput id="income" value={form.monthly_income} onChange={v => set("monthly_income", v)} placeholder="80,000" />
          </div>
          <div style={S.grid2}>
            <div>
              <label htmlFor="basic" style={S.label}>Basic Salary</label>
              <CurrencyInput id="basic" value={form.basic_salary} onChange={v => set("basic_salary", v)} placeholder="40,000" />
            </div>
            <div>
              <label htmlFor="expenses" style={S.label}>Monthly Expenses</label>
              <CurrencyInput id="expenses" value={form.monthly_expenses} onChange={v => set("monthly_expenses", v)} placeholder="45,000" />
            </div>
          </div>
        </div>

        {/* HRA */}
        <div style={S.section}>
          <div style={S.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>home</span>
            HRA & Accommodation
          </div>
          <div style={S.grid2}>
            <div>
              <label htmlFor="rent" style={S.label}>Rent Paid</label>
              <CurrencyInput id="rent" value={form.monthly_rent} onChange={v => set("monthly_rent", v)} placeholder="15,000" />
            </div>
            <div>
              <label htmlFor="hra" style={S.label}>HRA Received</label>
              <CurrencyInput id="hra" value={form.monthly_hra} onChange={v => set("monthly_hra", v)} placeholder="16,000" />
            </div>
          </div>
        </div>

        {/* Demographics */}
        <div style={S.section}>
          <div style={S.sectionTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>person</span>
            Demographics & Tax
          </div>
          <div style={{ ...S.grid2, marginBottom: 14 }}>
            <div>
              <label htmlFor="age" style={S.label}>Your Age</label>
              <input id="age" type="number" className="input-field" value={form.age_self || ""} placeholder="30" onChange={e => set("age_self", Number(e.target.value))} />
            </div>
            <div>
              <label htmlFor="page" style={S.label}>Parents' Age (Max)</label>
              <input id="page" type="number" className="input-field" value={form.age_parents || ""} placeholder="55" onChange={e => set("age_parents", Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <label style={S.label}>Tax Regime</label>
              <Toggle
                options={[{ label: "Old Regime", value: "old" }, { label: "New Regime", value: "new" }]}
                value={form.tax_regime as "old" | "new"} onChange={v => set("tax_regime", v)}
              />
            </div>
            <div>
              <label style={S.label}>City Tier</label>
              <Toggle
                options={[{ label: "Metro", value: "metro" }, { label: "Non-Metro", value: "non-metro" }]}
                value={form.city_type as "metro" | "non-metro"} onChange={v => set("city_type", v)}
              />
            </div>
          </div>
        </div>

        {/* Debts */}
        <div style={S.section}>
          <div style={{ ...S.sectionTitle, justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>account_balance</span>
              Debts & Liabilities
            </span>
            <button type="button" onClick={addDebt} className="btn-ghost" style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 0" }}>add</span>
              Add Debt
            </button>
          </div>

          {form.debts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--c-muted)", fontSize: 13, border: "1px dashed var(--c-border)", borderRadius: 6 }}>
              No debts added. Click "Add Debt" to track your liabilities.
            </div>
          ) : (
            <div style={{ border: "1px solid var(--c-border)", borderRadius: 6, overflow: "hidden" }}>
              {/* Table Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 90px 36px", gap: 8, padding: "8px 12px", background: "#FAFAF8", borderBottom: "1px solid var(--c-border)" }}>
                {["Creditor", "Balance", "APR %", "Min EMI", ""].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--c-muted)" }}>{h}</span>
                ))}
              </div>
              {form.debts.map((debt, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 90px 36px", gap: 8, padding: "8px 12px", borderBottom: i < form.debts.length - 1 ? "1px solid var(--c-border)" : "none", alignItems: "center" }}>
                  <input type="text" className="input-field" style={{ padding: "7px 10px", fontSize: 13 }} value={debt.name} onChange={e => updateDebt(i, "name", e.target.value)} placeholder="e.g. HDFC CC" />
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--c-muted)", pointerEvents: "none" }}>₹</span>
                    <input type="number" className="input-field" style={{ padding: "7px 8px 7px 20px", fontSize: 13, fontVariantNumeric: "tabular-nums" }} value={debt.balance || ""} onChange={e => updateDebt(i, "balance", Number(e.target.value))} />
                  </div>
                  <input type="number" className="input-field" style={{ padding: "7px 8px", fontSize: 13, textAlign: "center" }} value={debt.apr || ""} onChange={e => updateDebt(i, "apr", Number(e.target.value))} />
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--c-muted)", pointerEvents: "none" }}>₹</span>
                    <input type="number" className="input-field" style={{ padding: "7px 8px 7px 20px", fontSize: 13, fontVariantNumeric: "tabular-nums" }} value={debt.min_payment || ""} onChange={e => updateDebt(i, "min_payment", Number(e.target.value))} />
                  </div>
                  <button type="button" onClick={() => removeDebt(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 4, transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--c-error)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--c-muted)")}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0" }}>delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Investments */}
        <div style={S.section}>
          <div style={{ ...S.sectionTitle, justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>savings</span>
              Tax Investments
            </span>
            <button type="button" onClick={addInv} className="btn-ghost" style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 0" }}>add</span>
              Add Investment
            </button>
          </div>
          {form.existing_investments.map((inv, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 36px", gap: 10, marginBottom: 10, alignItems: "end" }}>
              <div>
                <label style={S.label}>Section</label>
                <select className="input-field" value={inv.section} onChange={e => updateInv(i, "section", e.target.value)}>
                  {["80C","80CCC","80CCD(1B)","80D","80E"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Instrument</label>
                <input type="text" className="input-field" value={inv.instrument} onChange={e => updateInv(i, "instrument", e.target.value)} placeholder="e.g. PPF, ELSS" />
              </div>
              <div>
                <label style={S.label}>Amount (₹)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--c-muted)", pointerEvents: "none" }}>₹</span>
                  <input type="number" className="input-field" style={{ paddingLeft: 22 }} value={inv.amount || ""} onChange={e => updateInv(i, "amount", Number(e.target.value))} />
                </div>
              </div>
              <button type="button" onClick={() => removeInv(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", padding: "10px 4px", borderRadius: 4, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--c-error)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--c-muted)")}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0" }}>delete</span>
              </button>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: "100%", padding: "15px 24px", fontSize: 16, borderRadius: 6, justifyContent: "center" }}>
          {isLoading ? (
            <>
              <svg style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Running Avalanche Engine...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>bolt</span>
              Analyze &amp; Optimize Capital
            </>
          )}
        </button>
      </div>
    </form>
  );
}
