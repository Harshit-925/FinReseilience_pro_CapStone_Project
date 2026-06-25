import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Bell } from "lucide-react";
import { useAuthStore } from "./store/useAuthStore";
import { useAppStore } from "./store/useAppStore";
import { useThemeStore } from "./store/useThemeStore";
import AmbientGradient from "./components/AmbientGradient";
import LandingHero from "./components/LandingHero";
import AuthPage from "./components/AuthPage";
import InputForm from "./components/InputForm";
import ResultsPanel from "./components/ResultsPanel";
import HistoryChart from "./components/HistoryChart";
import GoalTracker from "./components/GoalTracker";
import ReportExport from "./components/ReportExport";
import DataRetentionNotice from "./components/DataRetentionNotice";
import ChatPanel from "./components/ChatPanel";
import WhatIfPanel from "./components/WhatIfPanel";
import FloatingChatWidget from "./components/FloatingChatWidget";
import ThemeToggle from "./components/ThemeToggle";
import UserProfileMenu from "./components/UserProfileMenu";
import PaymentPage from "./components/PaymentPage";
import PricingPage from "./components/PricingPage";
import NewsPage from "./components/NewsPage";
import Footer from "./components/Footer";
import { getNotifications } from "./api/chat";
import type { NotificationPayload } from "./api/chat";

type View = "landing" | "login" | "signup" | "dashboard" | "payment" | "pricing" | "news";
export type PlanTier = { name: string; price: number; interval: string };
type DashboardTab = "analysis" | "agent";

export default function App() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { result, lastInput } = useAppStore();
  const { theme } = useThemeStore();
  const [view, setView] = useState<View>("landing");
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("analysis");
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  // Apply theme to <html> on every render so SSR/refresh works
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
      // Fetch notifications
      getNotifications().then(setNotifications).catch(console.error);
    } else if (wasAuthenticated && !isAuthenticated) {
      // User actively logged out — return to landing
      setWasAuthenticated(false);
      setView("landing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleShowNotifications = () => {
    if (notifications.length === 0) {
      toast.info("No new notifications");
      return;
    }
    notifications.forEach(n => {
      toast(n.type === 'foir_alert' ? '⚠️ Alert' : '📅 Reminder', {
        description: n.message,
        duration: 8000,
      });
    });
    // In a real app we would mark them as read here.
  };

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

        {/* Top Navigation Bar — hidden on landing (it has own nav) and auth pages (full-screen) */}
        {view !== "landing" && view !== "login" && view !== "signup" && view !== "payment" && (
          <header className="topnav" style={{ position: "sticky", top: 0, zIndex: 100 }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button type="button" onClick={() => setView("landing")} aria-label="Go to home"
                style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 17, color: "var(--c-text)", background: "none", border: "none", cursor: "pointer", letterSpacing: "-0.02em", padding: 0 }}>
                <span className="material-symbols-outlined" style={{ color: "var(--c-emerald)", fontSize: 20 }}>account_balance</span>
                FinResilience <span style={{ color: "var(--c-emerald)" }}>Pro</span>
              </button>

              <nav style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Theme toggle */}
                <ThemeToggle />

                {isAuthenticated ? (
                  <>
                    <button type="button" onClick={handleShowNotifications} className="btn-ghost relative" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, padding: 0, borderRadius: "50%" }}>
                      <Bell size={18} />
                      {notifications.length > 0 && (
                        <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: "var(--c-coral)", borderRadius: "50%" }}></span>
                      )}
                    </button>
                    <UserProfileMenu user={user} onLogout={logout} />
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
            onPricingClick={() => setView("pricing")}
            onNewsClick={() => setView("news")}
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={logout}
          />
        )}

        {/* ── LOGIN / SIGNUP ── — full-screen split panel, no header overlay */}
        {(view === "login" || view === "signup") && (
          <AuthPage
            initialMode={view === "signup" ? "signup" : "login"}
            onSwitchMode={(mode) => setView(mode)}
            onBack={() => setView("landing")}
          />
        )}



        {/* ── NEWS PAGE ── */}
        {view === "news" && (
          <NewsPage onBack={() => setView("landing")} />
        )}

        {/* ── PRICING PAGE ── */}
        {view === "pricing" && (
          <PricingPage 
            onBack={() => setView("landing")}
            onSubscribe={() => {
              setView("payment");
            }}
          />
        )}

        {/* ── PAYMENT PAGE ── */}
        {view === "payment" && (
          <PaymentPage 
            plan={null}
            onBack={() => setView("landing")}
            onSuccess={() => {
              setView(isAuthenticated ? "dashboard" : "signup");
            }}
          />
        )}

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
            
            {/* Tabs */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
              <div style={{ display: "flex", background: "var(--c-bg)", padding: 4, borderRadius: 8, border: "1px solid var(--c-border)" }}>
                <button
                  onClick={() => { setDashboardTab("analysis"); window.scrollTo({ top: 0, behavior: "instant" }); }}
                  style={{
                    padding: "8px 24px",
                    background: dashboardTab === "analysis" ? "var(--c-white)" : "transparent",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    color: dashboardTab === "analysis" ? "var(--c-navy)" : "var(--c-muted)",
                    boxShadow: dashboardTab === "analysis" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Full Analysis
                </button>
                <button
                  onClick={() => { setDashboardTab("agent"); window.scrollTo({ top: 0, behavior: "instant" }); }}
                  style={{
                    padding: "8px 24px",
                    background: dashboardTab === "agent" ? "var(--c-white)" : "transparent",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    color: dashboardTab === "agent" ? "var(--c-navy)" : "var(--c-muted)",
                    boxShadow: dashboardTab === "agent" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smart_toy</span>
                  AI Agent
                </button>
              </div>
            </div>

            {dashboardTab === "analysis" ? (
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
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 1000, margin: "0 auto" }}>
                {!result && (
                  <div style={{ padding: 16, background: "#fff5f5", borderRadius: 8, border: "1px solid #ffe3e3", color: "#e03131", fontSize: 14 }}>
                    <strong>Note:</strong> You haven't run a full analysis yet. The agent won't have your current financial profile available for simulations until you run an analysis on the Full Analysis tab.
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }}>
                  {lastInput && (
                    <WhatIfPanel baseProfile={lastInput} />
                  )}
                  <ChatPanel sessionId={isAuthenticated ? user?.id || "anon" : "anon"} profileSnapshot={lastInput || undefined} style={{ height: 600 }} />
                </div>
              </div>
            )}

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--c-border)" }}>
              <DataRetentionNotice />
            </div>
          </div>
        )}

      </main>
      
      {/* Footer is global and appears on every page except Auth pages and Dashboard inside its own scrolling, but actually wait, we want it on App.tsx bottom */}
      {view !== "login" && view !== "signup" && <Footer />}

      {/* Global AI Agent Widget */}
      <FloatingChatWidget sessionId={isAuthenticated ? user?.id || "anon" : "anon"} profileSnapshot={lastInput || undefined} />
    </div>
  );
}
