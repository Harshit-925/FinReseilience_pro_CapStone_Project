import React, { useState, useRef, useEffect } from "react";
import { postChatMessage } from "../api/chat";
import type { ChatResponsePayload, ToolResult } from "../api/chat";
import type { HouseholdInput } from "../types";
import { Send, Bot, User, Wrench, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  sessionId: string;
  profileSnapshot?: HouseholdInput;
}

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  toolCalls?: string[];
  toolResults?: ToolResult[];
}

export default function ChatPanel({ sessionId, profileSnapshot }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      text: "Hello! I'm your deterministic FinResilience agent. I can help you understand your financial health, simulate scenarios, or optimize your debt and tax strategies. What would you like to know?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response: ChatResponsePayload = await postChatMessage({
        message: userMsg.text,
        session_id: sessionId,
        profile_snapshot: profileSnapshot,
      });

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: response.reply,
        toolCalls: response.tool_calls_made,
        toolResults: response.tool_results,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "agent",
          text: "⚠️ Sorry, I encountered an error connecting to the engine. Please try again.",
        }
      ]);
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
    <div className="card" style={{ display: "flex", flexDirection: "column", height: 600, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border)", background: "var(--c-bg)", display: "flex", alignItems: "center", gap: 10 }}>
        <Bot size={20} color="var(--c-emerald)" />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--c-navy)" }}>Agentic Chat</h3>
      </div>

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
                background: msg.role === "user" ? "var(--c-emerald-lt)" : "var(--c-bg)",
                color: "var(--c-navy)",
                fontSize: 14,
                lineHeight: 1.5,
                border: msg.role === "user" ? "none" : "1px solid var(--c-border)",
              }}>
                <ReactMarkdown className="markdown-body" style={{ margin: 0 }}>{msg.text}</ReactMarkdown>
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

      {/* Disclaimer */}
      <div style={{ padding: "8px 20px", background: "#fff5f5", borderTop: "1px solid #ffe3e3", display: "flex", gap: 8, alignItems: "center", fontSize: 11, color: "#e03131" }}>
        <ShieldAlert size={14} style={{ flexShrink: 0 }} />
        <span style={{ lineHeight: 1.3 }}>Educational analysis only — not regulated financial advice under SEBI/RBI guidelines. Consult a SEBI-registered investment advisor for personalised guidance.</span>
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
      `}</style>
    </div>
  );
}
