import { useState } from "react";
import { LogOut, LayoutDashboard, User } from "lucide-react";

interface UserProfileMenuProps {
  user: { email: string } | null;
  onLogout: () => void;
  onGoToDashboard?: () => void;
  showDashboardLink?: boolean;
}

export default function UserProfileMenu({
  user,
  onLogout,
  onGoToDashboard,
  showDashboardLink = false
}: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const email = user.email || "";
  const initial = email.charAt(0).toUpperCase() || "?";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--c-emerald) 0%, var(--c-navy) 100%)",
          color: "white",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          transition: "transform 0.15s",
          padding: 0
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User Profile Menu"
      >
        {initial}
      </button>

      {/* Backdrop for closing dropdown */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998,
            cursor: "default"
          }}
        />
      )}

      {/* Dropdown Card */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 44,
            width: 240,
            backgroundColor: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            padding: "8px 0",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            animation: "dropDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* User Email Info Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--c-border)",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 10
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: "var(--c-surface-alt)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--c-muted)"
              }}
            >
              <User size={14} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Signed in as</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--c-text)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden"
                }}
                title={email}
              >
                {email}
              </span>
            </div>
          </div>

          {/* Navigation to Dashboard */}
          {showDashboardLink && onGoToDashboard && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onGoToDashboard();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--c-text)",
                transition: "background-color 0.15s"
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--c-surface-alt)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <LayoutDashboard size={15} style={{ color: "var(--c-emerald)" }} />
              Go to Dashboard
            </button>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 16px",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--c-coral, #e53e3e)",
              transition: "background-color 0.15s"
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--c-surface-alt)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <LogOut size={15} />
            Log Out
          </button>
        </div>
      )}

      <style>{`
        @keyframes dropDownFade {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
