import ThemeToggle from "./ThemeToggle";
import UserProfileMenu from "./UserProfileMenu";
import { formatCurrency } from "../utils/formatters";

interface User {
  email: string;
}

interface LandingHeroProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
  isAuthenticated: boolean;
  user: User | null;
  onLogout: () => void;
  onPricingClick: () => void;
  onNewsClick: () => void;
}

export default function LandingHero({ onGetStarted, onLoginClick, isAuthenticated, user, onLogout, onPricingClick, onNewsClick }: LandingHeroProps) {
  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP NAV ── */}
      <nav className="topnav">
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 18, color: "var(--c-text)", letterSpacing: "-0.02em" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--c-emerald)", fontSize: 22 }}>account_balance</span>
            FinResilience <span style={{ color: "var(--c-emerald)" }}>Pro</span>
          </div>

          {/* Nav Links */}
            <nav style={{ display: "flex", gap: 32 }} className="hidden-mobile">
              {["Platform"].map(link => (
                <a key={link} href={`#${link.toLowerCase()}`} style={{ color: "var(--c-text)", fontWeight: 600, fontSize: 14, textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--c-emerald)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--c-text)")}
                >{link}</a>
              ))}
              <button 
                onClick={onNewsClick}
                style={{ color: "var(--c-text)", fontWeight: 600, fontSize: 14, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--c-emerald)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--c-text)")}
              >
                News
              </button>
              <button 
                onClick={onPricingClick}
                style={{ color: "var(--c-text)", fontWeight: 600, fontSize: 14, background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--c-emerald)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--c-text)")}
              >
                Pricing
              </button>
            </nav>

          {/* Auth Buttons + Theme Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <button type="button" onClick={onGetStarted} className="btn-ghost" style={{ fontSize: 14, padding: "8px 18px", display: "flex", alignItems: "center", gap: 6 }}>
                  Dashboard
                </button>
                <UserProfileMenu user={user} onLogout={onLogout} onGoToDashboard={onGetStarted} showDashboardLink={true} />
              </>
            ) : (
              <>
                <button type="button" onClick={onLoginClick} className="btn-ghost" style={{ fontSize: 14, padding: "8px 18px" }}>
                  Sign In
                </button>
                <button type="button" onClick={onGetStarted} className="btn-primary" style={{ fontSize: 14, padding: "9px 20px" }}>
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

          {/* Left: Copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="animate-fade-up">
            <div className="badge-emerald">
              <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              BUILT FOR INDIAN TAX LAW FY 2026-27
            </div>

            <h1 className="text-display" style={{ margin: 0 }}>
              Orchestrate Wealth with Mathematical Certainty.
            </h1>

            <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--c-muted)", margin: 0, maxWidth: 460 }}>
              Abandon guesswork. FinResilience Pro deploys institutional-grade algorithms to optimize your debt payoff, tax strategy, and portfolio growth — precision engineered for the Indian market.
            </p>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button type="button" onClick={onGetStarted} className="btn-primary" style={{ fontSize: 16, padding: "14px 28px", borderRadius: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Start Your Optimization
              </button>
              <button type="button" className="btn-ghost" style={{ fontSize: 15, padding: "14px 24px", borderRadius: 6 }}>
                View Demo
              </button>
            </div>

            {/* Trust Signals */}
            <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
              {[
                { icon: "lock", text: "Bank-grade security" },
                { icon: "update", text: "Real-time analysis" },
                { icon: "gpp_good", text: "No data sold" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--c-muted)", fontWeight: 500 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

            {/* Dashboard Preview Card */}
            <div className="card animate-fade-up" style={{ padding: 0, overflow: "hidden", animationDelay: "0.1s" }}>
              {/* Card Header */}
              <div style={{ background: "var(--c-surface-alt, #FAFAF8)", borderBottom: "1px solid var(--c-border)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="text-label-caps">LIVE ALGORITHMIC OVERVIEW</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--c-emerald)" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--c-border)" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--c-border)" }} />
                </div>
              </div>

            <div style={{ padding: 24 }}>
              {/* Main Metric */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Projected Monthly Efficiency</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "var(--c-navy)", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(35000)}</span>
                  <span style={{ background: "var(--c-emerald-lt)", color: "var(--c-emerald)", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 4, display: "flex", alignItems: "center", gap: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>12.4%
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--c-muted)", margin: "4px 0 0" }}>Freed monthly via Avalanche Method</p>
              </div>

              {/* 2-Column Metric Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {/* Health Score */}
                <div style={{ background: "var(--c-surface-alt, #FAFAF8)", border: "1px solid var(--c-border)", borderRadius: 6, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--c-emerald)" }}>health_and_safety</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--c-muted)" }}>Health Score</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "var(--c-emerald)", letterSpacing: "-0.02em" }}>81.5<span style={{ fontSize: 14, color: "var(--c-muted)", fontWeight: 500 }}>/100</span></div>
                  <div className="progress-bar" style={{ marginTop: 8 }}>
                    <div className="progress-bar-fill" style={{ width: "81.5%" }} />
                  </div>
                </div>

                {/* Debt Freedom */}
                <div style={{ background: "var(--c-surface-alt, #FAFAF8)", border: "1px solid var(--c-border)", borderRadius: 6, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--c-text)" }}>timer</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--c-muted)" }}>Debt Freedom</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "var(--c-text)", letterSpacing: "-0.02em" }}>
                    14 <span style={{ fontSize: 14, fontWeight: 500, color: "var(--c-muted)" }}>mos</span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", margin: "4px 0 0" }}>Accelerated timeline</p>
                </div>
              </div>

              {/* Mini Chart */}
              <div style={{ border: "1px solid var(--c-border)", borderRadius: 6, overflow: "hidden", height: 100, position: "relative", background: "#FCFCFB" }}>
                <svg viewBox="0 0 300 100" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <path d="M0,90 Q50,70 90,75 T160,50 T230,30 T300,10 L300,100 L0,100 Z" fill="url(#chartGrad)" />
                  <path d="M0,90 Q50,70 90,75 T160,50 T230,30 T300,10" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div style={{ position: "absolute", top: 8, left: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--c-muted)" }}>
                  Debt Payoff Trajectory
                </div>
                <div style={{ position: "absolute", bottom: 8, right: 12, fontSize: 11, fontWeight: 700, color: "var(--c-emerald)" }}>
                  ₹0 ↗
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ── */}
      <section style={{ borderTop: "1px solid var(--c-border)", borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)", padding: "28px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, color: "var(--c-text)", letterSpacing: "-0.01em" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>gavel</span>
            Zero Hallucination Math
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, color: "var(--c-text)", letterSpacing: "-0.01em" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>code</span>
            100% Open Source
          </div>
          <a href="https://github.com/Harshit-925/FinReseilience_pro_CapStone_Project" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, color: "var(--c-text)", letterSpacing: "-0.01em", textDecoration: "none" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--c-emerald)", fontVariationSettings: "'FILL' 1" }}>menu_book</span>
            See Documentation
          </a>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span className="text-label-caps" style={{ display: "block", marginBottom: 12 }}>Platform Capabilities</span>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: "var(--c-navy)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Precision-Engineered for Every Rupee
          </h2>
          <p style={{ fontSize: 17, color: "var(--c-muted)", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
            Our mathematical models analyze your cashflow, debt structure, and tax liabilities to surface actionable insights that traditional banking hides.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            {
              icon: "snowing",
              title: "Avalanche Engine",
              desc: "Mathematically optimal debt repayment sequencing. Target high-interest liabilities first to minimize total interest paid over time.",
              stat: "₹4.2L", statLabel: "avg interest saved"
            },
            {
              icon: "psychology",
              title: "AI Insights",
              desc: "Predictive modeling for your cashflow. Anticipate shortfalls and automatically allocate surplus funds to wealth-generating assets.",
              stat: "2.3×", statLabel: "faster debt freedom"
            },
            {
              icon: "request_quote",
              title: "Tax Optimization",
              desc: "Automated Section 80C & 80CCD analysis. Maximize legal tax deductions within the Indian financial framework effortlessly.",
              stat: "₹52K", statLabel: "avg tax saved/yr"
            },
          ].map(({ icon, title, desc, stat, statLabel }) => (
            <div key={title} className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16, transition: "transform 0.2s, box-shadow 0.2s", cursor: "default" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)"; }}
            >
              <div style={{ width: 44, height: 44, background: "#F1F5F9", border: "1px solid var(--c-border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: "var(--c-navy)", fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "var(--c-navy)", letterSpacing: "-0.01em" }}>{title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--c-muted)", lineHeight: 1.6 }}>{desc}</p>
              </div>
              <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 14, display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "var(--c-emerald)", letterSpacing: "-0.02em" }}>{stat}</span>
                <span style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{statLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* ── CTA BANNER ── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ background: "var(--c-navy)", borderRadius: 12, padding: "56px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32 }}>
          <div>
            <h2 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 800, color: "var(--c-bg)", letterSpacing: "-0.02em" }}>
              Your financial freedom starts today.
            </h2>
            <p style={{ margin: 0, fontSize: 16, color: "var(--c-bg)", opacity: 0.8, lineHeight: 1.6 }}>
              No credit card. No commitment. Full access to every feature — free, forever.
            </p>
          </div>
          <button type="button" onClick={onGetStarted} className="btn-primary" style={{ fontSize: 16, padding: "14px 32px", borderRadius: 6, whiteSpace: "nowrap", flexShrink: 0 }}>
            Get Started Free →
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
