/**
 * Zod validation schemas — mirrors backend Pydantic constraints.
 */
import { z } from "zod";

export const debtSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  balance: z.number().positive("Balance must be positive"),
  apr: z.number().positive("APR must be positive").max(100, "APR cannot exceed 100%"),
  min_payment: z.number().positive("Minimum payment must be positive"),
});

export const taxInvestmentSchema = z.object({
  section: z.string().min(1, "Section required"),
  instrument: z.string().min(1, "Instrument required"),
  amount: z.number().min(0, "Amount cannot be negative"),
});

export const householdSchema = z.object({
  monthly_income: z.number().positive("Income must be positive"),
  monthly_expenses: z.number().min(0, "Expenses cannot be negative"),
  basic_salary: z.number().min(0).default(0),
  monthly_rent: z.number().min(0).default(0),
  monthly_hra: z.number().min(0).default(0),
  city_type: z.enum(["metro", "non-metro"]),
  tax_regime: z.enum(["old", "new"]),
  age_self: z.number().int().min(18).max(100).default(30),
  age_parents: z.number().int().min(30).max(100).default(55),
  education_loan_interest: z.number().min(0).default(0),
  debts: z.array(debtSchema).default([]),
  existing_investments: z.array(taxInvestmentSchema).default([]),
});

export const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type DebtFormData = z.infer<typeof debtSchema>;
export type HouseholdFormData = z.infer<typeof householdSchema>;
export type AuthFormData = z.infer<typeof authSchema>;
