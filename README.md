# 🏦 FinResilience Pro
**Automated Wealth and Debt Optimization Platform**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-green)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)

**FinResilience Pro** is a privacy-first, deterministic financial orchestrator. It ignores "AI narrative" fluff in favor of hard math, optimizing the exact destination of your next surplus rupee to maximize long-term net worth. 

This platform evaluates debt using the **Avalanche Method**, optimizes domestic tax shields (80C, 80D, 80CCD(1B), HRA) using **FY 2026-27 Indian tax laws**, and calculates financial health via **RBI/SBI FOIR benchmarks**.

---

## 🚀 Key Features

- **Deterministic Math Engine**: Raw Python algorithms for debt scheduling, avalanche methodology, and tax shielding. Zero LLM hallucinations in the core math.
- **Privacy-First Architecture**: User financial structures are processed in-memory and are never used to train external LLMs.
- **AI Institutional Intelligence**: Uses Google Gemini 2.5 Flash as an *isolated narrative layer* to convert the engine's hard numbers into personalized, plain-language financial advice.
- **Accessible & Ambient UI**: Clean, responsive layout with ambient gradients, structured cards, WCAG 2.1 AA compliant, and real-time form processing.
- **Offline Resilience**: Built-in fallback circuits ensure you get your math even if the AI narrative generator goes offline or the API key is missing.

---

## 🏗 Architecture & Flow Diagram

The application is structured into three main layers: a React frontend, a FastAPI python engine, and a PocketBase database/auth layer. 

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff;
    classDef backend fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff;
    classDef db fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef ai fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff;

    %% Nodes
    User([User / Browser])
    UI["React 18 Frontend<br/>(Vite, Zustand, Tailwind)"]:::frontend
    API["FastAPI Backend<br/>(Financial Engine)"]:::backend
    DB[("PocketBase<br/>SQLite + Auth")]:::db
    Gemini["Google Gemini 2.5<br/>AI Narrative API"]:::ai

    %% Flow
    User -->|Inputs Financial Data| UI
    UI -->|JSON Payload REST| API
    
    API -->|Validates Inputs| Engine["Deterministic Engine<br/>- Avalanche<br/>- Tax Shield<br/>- Health Score"]:::backend
    
    Engine -->|Output Summary| AI_Service["AI Service<br/>httpx Async"]:::backend
    AI_Service -->|Prompts with Context| Gemini
    Gemini -.->|Personalized Advice| AI_Service
    
    API -->|Aggregates Result| UI
    UI -->|Saves Profile| DB
    UI -->|Reads Auth/State| DB
```

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React 18, TypeScript, Vite | Fast, modern UI powered by Zustand for state management and Framer Motion for micro-interactions. |
| **Styling** | Vanilla CSS, Tailwind, Lucide | Ambient gradients and strictly non-glassmorphism elevated cards. |
| **Backend** | FastAPI, Python 3.11+, Pydantic | High-performance, async backend for deterministic financial calculations. |
| **Database** | PocketBase (SQLite) | Embedded, high-performance local database for user auth and data retention. |
| **AI Integration** | Google Gemini API (httpx) | Asynchronous context-aware AI narrative generation. |

---

## 🐳 Quick Start (Docker)

The absolute easiest way to run the entire stack (PocketBase + Backend + FastAPI) locally:

1. **Configure Environment:**
   Create a root `.env` file and update your Gemini API key.
   ```bash
   cp backend/.env.example .env
   ```
   > **Note:** Update `GEMINI_API_KEY` inside the `.env` file to enable the AI narrative feature. Otherwise, the engine will safely fallback to deterministic summaries.

2. **Spin up the cluster:**
   ```bash
   docker-compose up -d --build
   ```
   
**Endpoints:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **PocketBase Admin**: http://localhost:8090/_/

---

## 💻 Manual Local Setup

If you prefer running the services directly on your host machine:

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: .\venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. PocketBase
Download and run the appropriate binary for your OS from [pocketbase.io](https://pocketbase.io):
```bash
./pocketbase serve
```

---

## 📂 Documentation Directory

Please review our detailed compliance and evidence documentation:
- [Calculation Methodology](docs/CALCULATION_METHODOLOGY.md)
- [Security Architecture](docs/SECURITY_ARCHITECTURE.md)
- [Accessibility Compliance](docs/ACCESSIBILITY_COMPLIANCE_REPORT.md)
- [Performance & Caching](docs/PERFORMANCE_REPORT.md)
- [Code Quality Standards](docs/CODE_QUALITY_STANDARDS.md)

---

## 🧪 Testing

- **Backend**: Run `pytest -v` from the `/backend` directory.
- **Frontend**: Run `npm run test` or `vitest run` from the `/frontend` directory.
