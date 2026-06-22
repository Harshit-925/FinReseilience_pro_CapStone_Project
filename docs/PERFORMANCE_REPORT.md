# Performance & Caching Report

## Core Engine Optimization
The core calculation engine (`calculator.py`) is written as pure, localized Python functions with `O(N * M)` time complexity, where `N` is the number of debts and `M` is the number of months to payoff. For standard user inputs, mathematical routing is resolved in **sub-millisecond latency**.

## AI Service Resilience
Calls to the Google Gemini 2.5 Flash API represent the largest latency bottleneck. 
- **Timeouts**: We enforce a strict `timeout=5.0` seconds on all AI generation calls.
- **Circuit Breaker Fallback**: If the AI API fails, times out, or throws an exception, the system instantly degrades to a structured engine-generated summary, ensuring the user always receives their mathematical results.

## Frontend Rendering
- **Animation Performance**: All animations utilize `framer-motion` spring physics configured to avoid main-thread blocking.
- **Bundle Optimization**: The Vite React toolchain utilizes tree-shaking and Rollup chunk splitting to minimize Time to Interactive (TTI).
