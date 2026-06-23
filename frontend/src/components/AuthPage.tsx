/**
 * AuthPage — Split-screen animated auth UI inspired by animated_login_v4.html
 * Left panel: Orbiting financial icon chips with mouse repulsion + concentric rings
 * Right panel: Conic-glow field borders, sign-in / sign-up form
 * Supports both dark and light themes via CSS custom properties.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { authSchema } from "../utils/validation";
import { useThemeStore } from "../store/useThemeStore";

type AuthMode = "login" | "signup";

interface AuthPageProps {
  initialMode?: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
}

/* ─── Icon chips config ─── */
const CHIPS = [
  // orbit 1 — CW 12s
  { id: "c1_1", orbit: 1, r: 120, startAngle: -45, w: 62, h: 62, bg: "#1a6b3c",
    svg: <svg width={36} height={36} viewBox="0 0 24 24"><text x={4} y={20} fontSize={20} fontWeight={900} fill="#4ade80" fontFamily="Arial,sans-serif">₹</text></svg> },
  // orbit 2 — CCW 18s
  { id: "c2_1", orbit: 2, r: 200, startAngle: -135, w: 64, h: 64, bg: "#1a3a6b",
    svg: <svg width={36} height={36} viewBox="0 0 24 24"><text x={7} y={20} fontSize={20} fontWeight={900} fill="#60a5fa" fontFamily="Arial,sans-serif">$</text></svg> },
  { id: "c2_2", orbit: 2, r: 200, startAngle: 45, w: 60, h: 60, bg: "#3a1a6b",
    svg: <svg width={36} height={36} viewBox="0 0 24 24"><text x={5} y={20} fontSize={20} fontWeight={900} fill="#a78bfa" fontFamily="Arial,sans-serif">€</text></svg> },
  // orbit 3 — CW 24s
  { id: "c3_1", orbit: 3, r: 285, startAngle: -45, w: 62, h: 62, bg: "#3d1f08",
    svg: <svg width={32} height={32} viewBox="0 0 24 24"><path d="M15.5 9.5c0-1.4-1-2-2.5-2H9v4h4c1.5 0 2.5-.6 2.5-2zM13 14H9v4.5h4c1.6 0 2.7-.7 2.7-2.2S14.6 14 13 14z" fill="#fb923c"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.5 13.5c0 2-1.5 3-3.5 3H9v1.5H7.5V18.5H6.5V17H7.5V7H6.5V5.5H7.5V4H9v1.5h3.5c2 0 3.5 1 3.5 2.7 0 1.1-.5 2-1.4 2.5 1.2.4 2 1.4 2 2.8z" fill="#fb923c"/></svg> },
  { id: "c3_2", orbit: 3, r: 285, startAngle: 135, w: 60, h: 60, bg: "#1e3a10",
    svg: <svg width={30} height={30} viewBox="0 0 24 24" fill="none"><rect x={4} y={2} width={16} height={20} rx={2} stroke="#86efac" strokeWidth={1.8}/><line x1={8} y1={8} x2={16} y2={8} stroke="#86efac" strokeWidth={1.5}/><line x1={8} y1={12} x2={16} y2={12} stroke="#86efac" strokeWidth={1.5}/><text x={7} y={20} fontSize={7} fontWeight={900} fill="#86efac" fontFamily="Arial,sans-serif">TAX</text></svg> },
  { id: "c3_3", orbit: 3, r: 285, startAngle: -135, w: 58, h: 58, bg: "#3d3a10",
    svg: <svg width={32} height={32} viewBox="0 0 24 24" fill="none"><circle cx={12} cy={12} r={9} stroke="#fbbf24" strokeWidth={1.8}/><circle cx={12} cy={12} r={6} stroke="#fbbf24" strokeWidth={1}/><text x={9} y={16} fontSize={9} fontWeight={900} fill="#fbbf24" fontFamily="Arial,sans-serif">$</text></svg> },
  // orbit 4 — CCW 32s
  { id: "c4_1", orbit: 4, r: 370, startAngle: -45, w: 62, h: 62, bg: "#4a2a10",
    svg: <svg width={30} height={30} viewBox="0 0 24 24" fill="none"><rect x={2} y={6} width={20} height={14} rx={2} stroke="#fdba74" strokeWidth={1.8}/><path d="M16 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="#fdba74"/><path d="M2 10h20" stroke="#fdba74" strokeWidth={1.8}/></svg> },
  { id: "c4_2", orbit: 4, r: 370, startAngle: 135, w: 62, h: 62, bg: "#5a1a1a",
    svg: <svg width={30} height={30} viewBox="0 0 24 24" fill="none"><rect x={2} y={5} width={20} height={14} rx={2} stroke="#f87171" strokeWidth={1.8}/><line x1={2} y1={10} x2={22} y2={10} stroke="#f87171" strokeWidth={1.8}/><rect x={5} y={14} width={4} height={2} rx={0.5} fill="#f87171"/></svg> },
  { id: "c4_3", orbit: 4, r: 370, startAngle: 45, w: 58, h: 58, bg: "#1a1a5a",
    svg: <svg width={30} height={30} viewBox="0 0 24 24" fill="none"><path d="M12 2a10 10 0 0 1 10 10H12z" fill="#6366f1"/><path d="M12 12V2A10 10 0 0 0 2 12z" fill="#818cf8"/><path d="M12 12H2a10 10 0 0 0 10 10z" fill="#a5b4fc"/><path d="M12 12h10a10 10 0 0 1-10 10z" fill="#4f46e5"/></svg> },
];

const ORBIT_CONFIGS = [
  { orbit: 1, dir: +1, period: 12000 },
  { orbit: 2, dir: -1, period: 18000 },
  { orbit: 3, dir: +1, period: 24000 },
  { orbit: 4, dir: -1, period: 32000 },
];

const D = Math.PI / 180;
const REPULSE_R = 120;
const REPULSE_F = 60;
const LERP = 0.10;

/* ─── Conic glow field component ─── */
function GlowField({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const ang = Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI;
    el.style.setProperty("--mx", x + "%");
    el.style.setProperty("--my", y + "%");
    el.style.setProperty("--ang", ang + "deg");
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMouseMove}
      className={`auth-field-wrap${focused ? " focus" : ""} ${className}`}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      <div className="auth-field-inner">{children}</div>
    </div>
  );
}

/* ─── Left panel: orbit animation ─── */
function OrbitPanel() {
  const leftRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const repulsionRef = useRef<Map<string, { ox: number; oy: number }>>(new Map());
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  // init repulsion map
  useEffect(() => {
    CHIPS.forEach(c => repulsionRef.current.set(c.id, { ox: 0, oy: 0 }));
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseLeave = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999 };
  }, []);

  useEffect(() => {
    const el = leftRef.current;
    if (!el) return;
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [onMouseMove, onMouseLeave]);

  useEffect(() => {
    function animate(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;

      CHIPS.forEach(chip => {
        const cfg = ORBIT_CONFIGS.find(o => o.orbit === chip.orbit)!;
        const progress = (elapsed % cfg.period) / cfg.period;
        const orbitAngle = progress * 360 * cfg.dir;
        const totalAngle = (chip.startAngle + orbitAngle) * D;
        const cx = Math.cos(totalAngle) * chip.r;
        const cy = Math.sin(totalAngle) * chip.r;

        const el = chipRefs.current.get(chip.id);
        if (!el) return;

        el.style.left = (cx - chip.w / 2) + "px";
        el.style.top  = (cy - chip.h / 2) + "px";

        // repulsion
        const rep = repulsionRef.current.get(chip.id)!;
        const rect = el.getBoundingClientRect();
        const ecx = rect.left + rect.width / 2;
        const ecy = rect.top  + rect.height / 2;
        const dx = ecx - mouseRef.current.x;
        const dy = ecy - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetOx = 0, targetOy = 0;
        if (dist < REPULSE_R && dist > 0.5) {
          const force = (1 - dist / REPULSE_R) * REPULSE_F;
          targetOx = (dx / dist) * force;
          targetOy = (dy / dist) * force;
        }
        rep.ox += (targetOx - rep.ox) * LERP;
        rep.oy += (targetOy - rep.oy) * LERP;

        el.style.transform = `rotate(${-orbitAngle}deg) translate(${rep.ox.toFixed(2)}px,${rep.oy.toFixed(2)}px)`;
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div ref={leftRef} className="auth-left">
      {/* Rings */}
      <div className="auth-rings">
        <div className="auth-ring" style={{ width: 240, height: 240 }} />
        <div className="auth-ring" style={{ width: 400, height: 400 }} />
        <div className="auth-ring" style={{ width: 570, height: 570 }} />
        <div className="auth-ring" style={{ width: 740, height: 740 }} />
      </div>

      {/* Orbit anchor (centred) */}
      <div className="auth-orbit-anchor">
        {CHIPS.map(chip => (
          <div
            key={chip.id}
            ref={el => { if (el) chipRefs.current.set(chip.id, el); else chipRefs.current.delete(chip.id); }}
            className="auth-chip"
            style={{
              width: chip.w,
              height: chip.h,
              background: chip.bg,
              position: "absolute",
              borderRadius: 16,
              boxShadow: "0 6px 28px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              willChange: "transform",
            }}
          >
            {chip.svg}
          </div>
        ))}
      </div>

      {/* Headline */}
      <h1 className="auth-headline">FinResilience Pro</h1>
      <p className="auth-subline">Orchestrate Your Wealth</p>
    </div>
  );
}

/* ─── Main AuthPage ─── */
export default function AuthPage({ initialMode = "login", onSwitchMode }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const { login, signup, isLoading } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // keep mode in sync if parent changes it (e.g. query param)
  useEffect(() => { setMode(initialMode); }, [initialMode]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setEmail("");
    setPassword("");
    onSwitchMode(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      const msg = validation.error.format()._errors[0] || "Invalid input";
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await signup(email, password);
        toast.success("Account created — welcome!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : mode === "login" ? "Login failed" : "Signup failed";
      setError(msg);
      toast.error(msg);
    }
  };

  const isLogin = mode === "login";

  return (
    <>
      <style>{`
        /* ── Auth page layout ── */
        .auth-stage {
          display: flex;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        /* ── Left panel ── */
        .auth-left {
          position: relative;
          flex: 1.15;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 50%, rgba(91,140,255,0.07) 0%, transparent 62%),
            ${isDark ? "#070912" : "#f0f4ff"};
        }
        [data-theme="light"] .auth-left {
          background:
            radial-gradient(circle at 50% 50%, rgba(5,150,105,0.08) 0%, transparent 62%),
            #f0fdf4;
        }

        /* Rings */
        .auth-rings {
          position: absolute;
          width: 860px; height: 860px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .auth-ring {
          position: absolute;
          top: 50%; left: 50%;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          border: 1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(5,150,105,0.15)"};
        }

        .auth-orbit-anchor {
          position: absolute;
          top: 50%; left: 50%;
          width: 0; height: 0;
        }

        .auth-headline {
          position: relative;
          z-index: 10;
          font-size: 42px;
          font-weight: 800;
          letter-spacing: -1.5px;
          white-space: nowrap;
          background: ${isDark
            ? "linear-gradient(180deg,#e2e6f0 0%,#6b7280 100%)"
            : "linear-gradient(180deg,#0F172A 0%,#475569 100%)"};
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          pointer-events: none;
          user-select: none;
          margin-top: 8px;
        }
        .auth-subline {
          position: relative;
          z-index: 10;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: ${isDark ? "rgba(255,255,255,0.35)" : "rgba(5,150,105,0.7)"};
          margin-top: 6px;
        }

        /* ── Right panel ── */
        .auth-right {
          flex: 0.85;
          background: ${isDark ? "#0c0f1a" : "#ffffff"};
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid ${isDark ? "#14171f" : "#e2e8f0"};
          overflow-y: auto;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 40px;
        }
        .auth-card h2 {
          font-size: 34px;
          margin: 0 0 8px;
          font-weight: 800;
          letter-spacing: -1px;
          color: ${isDark ? "#f3f4f6" : "#0F172A"};
        }
        .auth-card .auth-sub {
          margin: 0 0 28px;
          color: ${isDark ? "#9aa1b1" : "#64748b"};
          font-size: 15px;
        }
        .auth-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          color: ${isDark ? "#d1d5db" : "#374151"};
        }
        .auth-label .req { color: #ff5d5d; margin-left: 3px; }

        /* Conic glow field */
        .auth-field-wrap {
          --mx: 50%; --my: 50%; --ang: 180deg;
          --accent-glow: ${isDark ? "rgba(91,140,255,0.85)" : "rgba(5,150,105,0.8)"};
          --accent-soft: ${isDark ? "rgba(91,140,255,0.45)" : "rgba(5,150,105,0.4)"};
          position: relative;
          margin-bottom: 20px;
          border-radius: 10px;
          padding: 1px;
          background: ${isDark ? "#2a2e3a" : "#e2e8f0"};
          isolation: isolate;
        }
        .auth-field-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: conic-gradient(
            from var(--ang) at var(--mx) var(--my),
            transparent 50deg,
            var(--accent-glow) 100deg,
            var(--accent-soft) 130deg,
            transparent 180deg
          );
          opacity: 0;
          transition: opacity .18s ease;
          pointer-events: none;
        }
        .auth-field-wrap:hover::before,
        .auth-field-wrap.focus::before { opacity: 1; }

        .auth-field-inner {
          position: relative;
          z-index: 1;
          border-radius: 9px;
          background: ${isDark ? "#131620" : "#f8fafc"};
          display: flex;
          align-items: center;
        }
        .auth-field-wrap.focus .auth-field-inner {
          box-shadow: 0 0 0 1.5px ${isDark ? "#5b8cff" : "#059669"},
                      0 0 16px 2px ${isDark ? "rgba(91,140,255,0.3)" : "rgba(5,150,105,0.25)"};
        }
        .auth-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: ${isDark ? "#f3f4f6" : "#0F172A"};
          font-size: 15px;
          padding: 14px 16px;
          font-family: inherit;
        }
        .auth-input::placeholder { color: ${isDark ? "#4b5563" : "#94a3b8"}; }

        /* Eye toggle */
        .auth-eye {
          background: none;
          border: none;
          color: ${isDark ? "#9aa1b1" : "#94a3b8"};
          cursor: pointer;
          padding: 0 14px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .auth-eye:hover { color: ${isDark ? "#ffffff" : "#0F172A"}; }

        /* Google button wrap */
        .auth-gbtn-wrap {
          --mx: 50%; --my: 50%; --ang: 180deg;
          --accent-glow: ${isDark ? "rgba(91,140,255,0.85)" : "rgba(5,150,105,0.8)"};
          --accent-soft: ${isDark ? "rgba(91,140,255,0.45)" : "rgba(5,150,105,0.4)"};
          position: relative;
          border-radius: 10px;
          padding: 1px;
          background: ${isDark ? "#2a2e3a" : "#e2e8f0"};
          margin-bottom: 20px;
          isolation: isolate;
        }
        .auth-gbtn-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: conic-gradient(
            from var(--ang) at var(--mx) var(--my),
            transparent 50deg,
            var(--accent-glow) 100deg,
            var(--accent-soft) 130deg,
            transparent 180deg
          );
          opacity: 0;
          transition: opacity .18s ease;
          pointer-events: none;
        }
        .auth-gbtn-wrap:hover::before { opacity: 1; }
        .auth-gbtn {
          width: 100%;
          padding: 13px 16px;
          border-radius: 9px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: ${isDark ? "#f3f4f6" : "#0F172A"};
          border: none;
          background: ${isDark ? "#131620" : "#f8fafc"};
          position: relative;
          z-index: 1;
          font-family: inherit;
          transition: background 0.15s;
        }
        .auth-gbtn:hover { background: ${isDark ? "#1b1e29" : "#f1f5f9"}; }

        /* Submit button */
        .auth-submit-wrap {
          --mx: 50%; --my: 50%; --ang: 180deg;
          --accent-glow: ${isDark ? "rgba(91,140,255,0.85)" : "rgba(5,150,105,0.85)"};
          --accent-soft: ${isDark ? "rgba(91,140,255,0.45)" : "rgba(5,150,105,0.45)"};
          position: relative;
          border-radius: 10px;
          padding: 1px;
          background: ${isDark ? "#2a2e3a" : "#e2e8f0"};
          margin-bottom: 20px;
          isolation: isolate;
        }
        .auth-submit-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: conic-gradient(
            from var(--ang) at var(--mx) var(--my),
            transparent 50deg,
            var(--accent-glow) 100deg,
            var(--accent-soft) 130deg,
            transparent 180deg
          );
          opacity: 0;
          transition: opacity .18s ease;
          pointer-events: none;
        }
        .auth-submit-wrap:hover::before { opacity: 1; }
        .auth-submit {
          width: 100%;
          padding: 14px 16px;
          border-radius: 9px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #ffffff;
          border: none;
          background: ${isDark ? "#15171f" : "#0F172A"};
          position: relative;
          z-index: 1;
          font-family: inherit;
          transition: background 0.15s, opacity 0.15s;
          letter-spacing: 0.02em;
        }
        .auth-submit:hover:not(:disabled) { background: ${isDark ? "#1b1e29" : "#1e293b"}; }
        .auth-submit:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 4px 0 22px;
          color: ${isDark ? "#9aa1b1" : "#94a3b8"};
          font-size: 13px;
        }
        .auth-divider .line { flex: 1; border-top: 1px dashed ${isDark ? "#2a2e3a" : "#cbd5e1"}; }

        /* Error */
        .auth-error {
          margin-bottom: 14px;
          padding: 10px 14px;
          background: ${isDark ? "rgba(239,68,68,0.12)" : "#fef2f2"};
          border: 1px solid ${isDark ? "rgba(239,68,68,0.3)" : "#fecaca"};
          border-radius: 8px;
          color: ${isDark ? "#f87171" : "#dc2626"};
          font-size: 13px;
          font-weight: 500;
        }

        /* Switch link */
        .auth-switch {
          text-align: center;
          font-size: 14px;
          color: ${isDark ? "#9aa1b1" : "#64748b"};
          margin-top: 4px;
        }
        .auth-switch button {
          font-weight: 700;
          color: ${isDark ? "#5b8cff" : "#059669"};
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-family: inherit;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: opacity 0.15s;
        }
        .auth-switch button:hover { opacity: 0.75; }

        /* Mode switcher pill at top of card */
        .auth-mode-switch {
          display: flex;
          background: ${isDark ? "#131620" : "#f1f5f9"};
          border: 1px solid ${isDark ? "#2a2e3a" : "#e2e8f0"};
          border-radius: 8px;
          padding: 3px;
          gap: 3px;
          margin-bottom: 28px;
        }
        .auth-mode-btn {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          background: transparent;
          color: ${isDark ? "#9aa1b1" : "#64748b"};
        }
        .auth-mode-btn.active {
          background: ${isDark ? "#5b8cff" : "#059669"};
          color: #ffffff;
        }

        @media (max-width: 860px) {
          .auth-left { display: none; }
          .auth-right { flex: 1; }
        }
      `}</style>

      <div className="auth-stage">
        <OrbitPanel />

        <div className="auth-right">
          <div className="auth-card">
            {/* Mode toggle pill */}
            <div className="auth-mode-switch" role="tablist">
              <button
                role="tab"
                aria-selected={isLogin}
                className={`auth-mode-btn${isLogin ? " active" : ""}`}
                onClick={() => switchMode("login")}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={!isLogin}
                className={`auth-mode-btn${!isLogin ? " active" : ""}`}
                onClick={() => switchMode("signup")}
              >
                Create Account
              </button>
            </div>

            <h2>{isLogin ? "Welcome back" : "Get started"}</h2>
            <p className="auth-sub">
              {isLogin
                ? "Sign in to your financial dashboard"
                : "Start optimizing your finances in under a minute"}
            </p>

            {/* Google SSO (UI only) */}
            <GlowFieldBtn onMouseMove={updateGlowFieldBtn}>
              <button className="auth-gbtn" type="button">
                <svg width={18} height={18} viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 13.8 4.5 5.5 12.8 5.5 23S13.8 41.5 24 41.5c10.2 0 18.5-8.3 18.5-18.5 0-1.2-.1-2.4-.4-3.4z"/>
                  <path fill="#FF3D00" d="M6.9 14.3l6.6 4.8C15.3 16 19.3 13.5 24 13.5c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5c-7.6 0-14.1 4.3-17.1 9.8z"/>
                  <path fill="#4CAF50" d="M24 41.5c5 0 9.6-1.9 13-5.1l-6-4.9c-1.9 1.3-4.3 2-7 2-5.3 0-9.7-3.6-11.3-8.4l-6.6 5.1C9.7 36.9 16.2 41.5 24 41.5z"/>
                  <path fill="#1976D2" d="M43.6 20.1H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6 4.9c3.5-3.2 5.6-7.9 5.6-13.5 0-1.2-.1-2.4-.4-3.4z"/>
                </svg>
                Continue with Google
              </button>
            </GlowFieldBtn>

            <div className="auth-divider">
              <span className="line" />or<span className="line" />
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label className="auth-label" htmlFor="auth-email">
                Email <span className="req">*</span>
              </label>
              <GlowField>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-required="true"
                />
              </GlowField>

              <label className="auth-label" htmlFor="auth-password">
                Password <span className="req">*</span>
              </label>
              <GlowField>
                <input
                  id="auth-password"
                  type={showPass ? "text" : "password"}
                  className="auth-input"
                  placeholder={isLogin ? "Enter your password" : "Min 8 characters"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  aria-required="true"
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPass(p => !p)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </GlowField>

              {error && (
                <div className="auth-error" role="alert" aria-live="assertive">
                  {error}
                </div>
              )}

              <GlowSubmitBtn>
                <button
                  type="submit"
                  className="auth-submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLogin
                    ? (isLoading ? "Signing in…" : "Sign in →")
                    : (isLoading ? "Creating account…" : "Create account →")}
                </button>
              </GlowSubmitBtn>
            </form>

            <div className="auth-switch">
              {isLogin ? (
                <>Don't have an account?{" "}
                  <button onClick={() => switchMode("signup")}>Sign up</button></>
              ) : (
                <>Already have an account?{" "}
                  <button onClick={() => switchMode("login")}>Sign in</button></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Helper: conic-glow wrappers for Google + Submit buttons ─── */
function updateGlowFieldBtn(e: React.MouseEvent, el: HTMLElement | null) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;
  const ang = Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI;
  el.style.setProperty("--mx", x + "%");
  el.style.setProperty("--my", y + "%");
  el.style.setProperty("--ang", ang + "deg");
}

function GlowFieldBtn({ children, onMouseMove }: {
  children: React.ReactNode;
  onMouseMove: (e: React.MouseEvent, el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="auth-gbtn-wrap" onMouseMove={e => onMouseMove(e, ref.current)}>
      {children}
    </div>
  );
}

function GlowSubmitBtn({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="auth-submit-wrap"
      onMouseMove={e => updateGlowFieldBtn(e, ref.current)}>
      {children}
    </div>
  );
}
