import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import ChatPanel from "./ChatPanel";

interface FloatingChatWidgetProps {
  sessionId: string;
  profileSnapshot?: any;
}

export default function FloatingChatWidget({ sessionId, profileSnapshot }: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {/* The Chat Panel (Popover) */}
      {isOpen && (
        <div style={{
          position: "absolute",
          bottom: 70,
          right: 0,
          width: 380,
          maxWidth: "calc(100vw - 48px)",
          height: 600,
          maxHeight: "calc(100vh - 120px)",
          backgroundColor: "var(--c-white)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          // Reset internal card styles so it fits flush
        }}>
          <div style={{ flex: 1, overflow: "hidden", '& .card': { border: 'none', borderRadius: 0 } } as any}>
            <ChatPanel sessionId={sessionId} profileSnapshot={profileSnapshot} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: isOpen ? "var(--c-navy)" : "var(--c-emerald)",
          color: "white",
          border: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s, background-color 0.2s",
          transform: isOpen ? "scale(0.9)" : "scale(1)"
        }}
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
