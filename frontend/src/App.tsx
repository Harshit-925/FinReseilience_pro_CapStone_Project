import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { LogOut } from "lucide-react";
import { useAuthStore } from "./store/useAuthStore";
import { useAppStore } from "./store/useAppStore";
import AmbientGradient from "./components/AmbientGradient";
import LandingHero from "./components/LandingHero";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import InputForm from "./components/InputForm";
import ResultsPanel from "./components/ResultsPanel";
import HistoryChart from "./components/HistoryChart";
import GoalTracker from "./components/GoalTracker";
import ReportExport from "./components/ReportExport";
import DataRetentionNotice from "./components/DataRetentionNotice";

type View = "landing" | "login" | "signup" | "dashboard";

export default function App() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { result } = useAppStore();
  const [view, setView] = useState<View>("landing");

  // Track whether the user was previously authenticated so we can
  // detect a logout event. We must NEVER snap back to landing just
  // because the user isn't logged in — only snap back when they log OUT.
  const [wasAuthenticated, setWasAuthenticated] = useState(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      setWasAuthenticated(true);
      // Auto-advance to dashboard only if coming from login/signup flow
      if (view === "login" || view === "signup") {
        setView("dashboard");
      }
    } else if (wasAuthenticated && !isAuthenticated) {
      // User actively logged out — return to landing
      setWasAuthenticated(false);
      setView("landing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "var(--c-navy)" }}>
      <AmbientGradient />

      {/* Global Toast Provider */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            background: "#fff",
            border: "1px solid var(--c-border)",
            color: "var(--c-navy)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
          },
        }}
      />

      {/* Skip link */}
      <a href="#main-content" className="sr-only">Skip to main content</a>

      {/* Main Content */}
      <main id="main-content">

        {/* Top Navigation Bar — visible on all views except the landing hero */}
        {view !== "landing" && (
          <header className="topnav" style={{ position: "sticky", top: 0, zIndex: 100 }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button type="button" onClick={() => setView("landing")} aria-label="Go to home"
                style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 17, color: "var(--c-navy)", background: "none", border: "none", cursor: "pointer", letterSpacing: "-0.02em", padding: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "var(--c-emerald)", fontSize: 20 }}>account_balance</span>
                FinResilience <span style={{ color: "var(--c-emerald)" }}>Pro</span>
              </button>

              <nav style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {isAuthenticated ? (
                  <>
                    <span style={{ fontSize: 13, color: "var(--c-muted)", fontWeight: 500 }}>{user?.email}</span>
                    <button type="button" onClick={logout} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
                      <LogOut size={14} /> Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => setView("login")} className="btn-ghost" style={{ padding: "8px 16px", fontSize: 14 }}>
                      Log In
                    </button>
                    <button type="button" onClick={() => setView("signup")} className="btn-primary" style={{ padding: "8px 18px", fontSize: 14 }}>
                      Sign Up
                    </button>
                  </>
                )}
              </nav>
            </div>
          </header>
        )}

        {/* ── LANDING ── */}
        {view === "landing" && (
          <LandingHero
            onGetStarted={() => setView("dashboard")}
            onLoginClick={() => setView("login")}
          />
        )}

        {/* ── LOGIN ── */}
        {view === "login" && (
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
            <LoginForm onSwitchToSignup={() => setView("signup")} />
          </div>
        )}

        {/* ── SIGNUP ── */}
        {view === "signup" && (
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
            <SignupForm onSwitchToLogin={() => setView("login")} />
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 48, alignItems: "center" }}>

              {/* Top: Input Form */}
              <div style={{ width: "100%", maxWidth: 800 }}>
                <InputForm />
              </div>

              {/* Bottom: Results */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
                {result ? (
                  <>
                    <ResultsPanel result={result} />
                    {isAuthenticated && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <GoalTracker />
                        <HistoryChart />
                      </div>
                    )}
                    <ReportExport result={result} />
                  </>
                ) : (
                  <div className="card" style={{ padding: 64, textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
                    <div style={{ width: 56, height: 56, background: "var(--c-emerald-lt)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>analytics</span>
                    </div>
                    <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "var(--c-navy)", letterSpacing: "-0.01em" }}>Ready to Analyze</h2>
                    <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--c-muted)", maxWidth: 300, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                      Enter your financial snapshot above and click <strong style={{ color: "var(--c-navy)" }}>Analyze &amp; Optimize Capital</strong> to view your personalized wealth routing plan.
                    </p>
                    {!isAuthenticated && (
                      <p style={{ fontSize: 12, color: "var(--c-muted)", margin: 0 }}>
                        <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-emerald)", fontWeight: 600, fontSize: 12, textDecoration: "underline", padding: 0 }} onClick={() => setView("login")}>
                          Sign in
                        </button>
                        {" "}to save your history and track progress over time.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--c-border)" }}>
              <DataRetentionNotice />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
