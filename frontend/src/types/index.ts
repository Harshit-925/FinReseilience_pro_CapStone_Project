/**
 * FinResilience Pro — TypeScript Types
 * Mirrors backend Pydantic schemas exactly.
 */

// ─── Request Types ───
export interface DebtInput {
  name: string;
  balance: number;
  apr: number;
  min_payment: number;
}

export interface TaxInvestmentInput {
  section: string;
  instrument: string;
  amount: number;
}

export interface HouseholdInput {
  monthly_income: number;
  monthly_expenses: number;
  basic_salary: number;
  monthly_rent: number;
  monthly_hra: number;
  city_type: "metro" | "non-metro";
  tax_regime: "old" | "new";
  age_self: number;
  age_parents: number;
  education_loan_interest: number;
  debts: DebtInput[];
  existing_investments: TaxInvestmentInput[];
}

// ─── Response Types ───
export interface DebtPaymentResponse {
  debt_name: string;
  payment_amount: number;
  running_balance: number;
}

export interface MonthRowResponse {
  month: number;
  payments: DebtPaymentResponse[];
  cumulative_interest: number;
  total_paid_this_month: number;
}

export interface PayoffScheduleResponse {
  schedule: MonthRowResponse[];
  total_interest_paid: number;
  total_interest_saved_vs_minimum: number;
  debt_free_month: number;
  total_months: number;
}

export interface TaxAllocationItemResponse {
  section: string;
  instrument: string;
  recommended_amount: number;
  tax_saved_at_slab: number;
  priority: number;
  remaining_limit: number;
}

export interface TaxAllocationResponse {
  items: TaxAllocationItemResponse[];
  total_tax_saved: number;
  total_invested: number;
  note: string;
}

export interface HealthScoreResponse {
  score: number;
  foir_ratio: number;
  savings_rate: number;
  emergency_months: number;
  component_scores: Record<string, number>;
  component_benchmarks: Record<string, string>;
}

export interface ActionCardResponse {
  priority: number;
  action_type: "PAY_DEBT" | "INVEST_TAX" | "SAVE";
  destination: string;
  amount: number;
  rationale: string;
  impact_metric: string;
}

export interface AnalysisResponse {
  action_cards: ActionCardResponse[];
  payoff_schedule: PayoffScheduleResponse;
  tax_allocation: TaxAllocationResponse;
  health_score: HealthScoreResponse;
  grade: string;
  grade_label: string;
  surplus: number;
  ai_narrative: string;
  fallback_used: boolean;
}

export interface HealthCheckResponse {
  status: string;
  pocketbase: string;
}

// ─── UI State Types ───
export interface UserRecord {
  id: string;
  email: string;
}

export interface GoalRecord {
  id: string;
  user: string;
  target: number;
  target_date: string | null;
  baseline: number;
  achieved: boolean;
  created: string;
}

export interface HistoryRecord {
  id: string;
  user: string;
  engine_result: Record<string, unknown>;
  ai_result: Record<string, unknown>;
  fallback_used: boolean;
  created: string;
}
