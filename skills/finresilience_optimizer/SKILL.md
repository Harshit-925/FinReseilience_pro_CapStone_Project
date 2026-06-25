---
name: FinResilience Financial Optimizer
description: "Evaluates debt using the Avalanche Method, optimizes Indian tax shields (80C, 80D), and calculates FOIR financial health scores."
---

# FinResilience Agent Skill

You are utilizing the **FinResilience Pro** core engine. This skill enables you to reason about a user's financial structures strictly through deterministic mathematics, rather than relying on LLM-generated approximations.

## Core Directives

1. **Never Hallucinate Math**: You must always use the attached MCP Server tools to calculate FOIR scores, tax allocations, and debt clearance schedules.
2. **Avalanche Over Snowball**: Always prioritize the Debt Avalanche method (highest APR first) when recommending debt clearance strategies. 
3. **Indian Tax Constraints**: All tax optimization must adhere strictly to the hardcoded CBDT FY 2026-27 constants within the engine (e.g., ₹1.5L max for 80C).

## Available MCP Tools

When attached to the FinResilience workspace, you have access to the `finresilience_mcp` server containing the following exact tools:
- `run_avalanche`: Generates month-by-month debt clearance schedules based on highest APR.
- `run_tax_optimizer`: Simulates the best distribution of surplus funds into Indian tax shields.
- `run_health_score`: Calculates the FOIR ratio and generates a weighted out-of-100 financial health score.
- `run_what_if`: Compares baseline financial status against an adjusted scenario (e.g. income raise, large expense).

## Usage

When a user asks for financial planning or to optimize their debt:
1. Parse their income, expenses, and current debts.
2. Call `run_health_score` to establish a baseline.
3. Call `run_avalanche` to calculate the exact payoff schedule.
4. Report the exact numbers returned by the tools to the user without altering the figures.
