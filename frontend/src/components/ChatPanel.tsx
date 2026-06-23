import React, { useState, useRef, useEffect } from "react";
import { postChatMessage } from "../api/chat";
import type { ChatResponsePayload } from "../api/chat";
import type { HouseholdInput } from "../types";
import { Send, Bot, User, Wrench, History, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useChatStore } from "../store/useChatStore";
import type { ChatMessage } from "../store/useChatStore";
import { getChatSessions } from "../api/chat";
import type { ChatSession } from "../api/chat";

interface ChatPanelProps {
  sessionId: string;
  profileSnapshot?: HouseholdInput;
  onClose?: () => void;
  style?: React.CSSProperties;
}



export default function ChatPanel({ sessionId, profileSnapshot, onClose, style }: ChatPanelProps) {
  const { messages, setMessages, addMessage, sessionId: currentSessionId, setSessionId } = useChatStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Initialize session ID if not set
  useEffect(() => {
    if (currentSessionId === "anon" && sessionId !== "anon") {
      setSessionId(sessionId);
    }
  }, [sessionId, currentSessionId, setSessionId]);

  // Welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "agent",
          content: "Hello! I'm your deterministic FinResilience agent. I can help you understand your financial health, simulate scenarios, or optimize your debt and tax strategies. What would you like to know?",
        }
      ]);
    }
  }, [messages, setMessages]);

  const loadHistory = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory) {
      loadHistory();
    }
    setShowHistory(!showHistory);
  };

  const handleSelectSession = (id: string) => {
    setSessionId(id);
    setMessages([]); // We'd load actual history here if we had an endpoint to fetch messages, for now it clears to start fresh
    setShowHistory(false);
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    addMessage(userMsg);
    setInput("");
    setIsLoading(true);

    try {
      const response: ChatResponsePayload = await postChatMessage({
        message: userMsg.content,
        session_id: currentSessionId,
        profile_snapshot: profileSnapshot,
      });

      // The response.reply already handles the text.
      // We are just storing it in the store
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: response.reply,
        toolCalls: response.tool_calls_made,
        toolResults: response.tool_results,
      };

      addMessage(agentMsg);
    } catch (err) {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: "⚠️ Sorry, I encountered an error connecting to the engine. Please try again.",
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", ...style }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border)", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bot size={20} color="var(--c-emerald)" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--c-navy)" }}>Agentic Chat</h3>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleToggleHistory} title="Chat History" style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <History size={20} />
          </button>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, display: "flex", flexDirection: "column" }}>
          {/* Backdrop for click-outside */}
          <div 
            onClick={() => setShowHistory(false)} 
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(2px)", zIndex: -1 }} 
          />
          
          <div style={{ background: "var(--c-white)", width: "100%", height: "100%", display: "flex", flexDirection: "column", animation: "slideInTop 0.2s ease-out" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border)", background: "var(--c-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600, color: "var(--c-navy)", display: "flex", alignItems: "center", gap: 8 }}>
                <History size={18} />
                <span>Past Sessions</span>
              </div>
              <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
              {sessions.length === 0 ? (
                <div style={{ padding: 20, color: "var(--c-muted)", textAlign: "center", fontSize: 14 }}>No previous sessions found.</div>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {sessions.map(s => (
                    <li key={s.session_id}>
                      <button 
                        onClick={() => handleSelectSession(s.session_id)} 
                        className="history-session-btn"
                        style={{ width: "100%", padding: "12px 20px", background: "none", border: "none", borderBottom: "1px solid rgba(0,0,0,0.05)", textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}
                      >
                        <div style={{ fontWeight: 500, color: "var(--c-navy)", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                          <span>Session {s.session_id.slice(0,8)}</span>
                          <span style={{ fontSize: 12, color: "var(--c-emerald)", fontWeight: 600 }}>Resume</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{new Date(s.created).toLocaleString()}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.role === "user" ? "var(--c-emerald)" : "var(--c-navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white" }}>
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 8, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: msg.isError ? "var(--c-coral-lt)" : (msg.role === "user" ? "var(--c-emerald-lt)" : "var(--c-bg)"),
                color: msg.isError ? "var(--c-coral)" : "var(--c-navy)",
                fontSize: 14,
                lineHeight: 1.5,
                border: msg.role === "user" ? "none" : "1px solid var(--c-border)",
              }}>
                <div className="markdown-body" style={{ margin: 0 }}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>

              {/* Tool Calls Disclosure */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--c-muted)", background: "var(--c-bg)", padding: "4px 8px", borderRadius: 4, border: "1px solid var(--c-border)" }}>
                  <Wrench size={12} />
                  <span>Tools used: {msg.toolCalls.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--c-navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white" }}>
              <Bot size={16} />
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--c-bg)", border: "1px solid var(--c-border)", display: "flex", gap: 4, alignItems: "center" }}>
              <span className="dot-typing"></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: 16, borderTop: "1px solid var(--c-border)", background: "var(--c-white)", display: "flex", gap: 10 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your finances..."
          style={{ flex: 1, resize: "none", height: 44, padding: "12px 16px", borderRadius: 8, border: "1px solid var(--c-border)", fontSize: 14, fontFamily: "inherit" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="btn-primary"
          style={{ height: 44, width: 44, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`
        .dot-typing {
          display: inline-block;
          width: 24px;
          height: 12px;
        }
        .dot-typing::after {
          content: '...';
          animation: typing 1.5s infinite;
        }
        @keyframes typing {
          0% { content: '.'; }
          33% { content: '..'; }
          66% { content: '...'; }
        }
        .markdown-body p { margin-top: 0; margin-bottom: 0.5em; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body strong { font-weight: 600; color: var(--c-navy); }
        .history-session-btn:hover { background: var(--c-emerald-lt) !important; }
        @keyframes slideInTop {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
