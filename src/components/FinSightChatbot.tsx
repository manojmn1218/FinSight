import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Trash2, ShieldCheck, ChevronDown, Loader2, ArrowUpRight, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import { useFinance } from '../context/FinanceContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  provider?: string;
  isOutOfScope?: boolean;
}

const SUGGESTED_PROMPTS = [
  '💰 What is my current balance?',
  '📄 How do I upload a statement?',
  '🎯 What are my savings goals?',
  '👑 What features are in Enterprise?',
  '📊 How is my budget health calculated?',
];

export default function FinSightChatbot() {
  const { data } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        text: `Hello ${data.userName || 'there'}! 👋 I am **FinSight AI**, your dedicated personal finance assistant powered by Python.\n\nI can answer questions regarding the **FinSight platform** or your **personal account details** (balance, income, expenses, and goals).\n\n*Note: Questions outside FinSight or your account data will return "Cannot say".*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'FinSight Python Core',
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        text: m.text,
      }));

      const res = await api.sendChatbotMessage(query, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: res.reply || "I'm here to assist you with your FinSight account and finances. Please ask about your balances, transactions, or goals.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: res.provider,
        isOutOfScope: res.isOutOfScope,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: "I'm temporarily having trouble connecting to the AI co-pilot. You can still check your balances, transactions, or goals directly in FinSight.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'Connection Error',
        isOutOfScope: false,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: `Chat cleared. How can I assist you with FinSight or your finances today, ${data.userName || 'friend'}?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: 'FinSight Python Core',
      },
    ]);
  };

  // Helper to render basic markdown formatting
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      // Bold
      let parsed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline code
      parsed = parsed.replace(/`([^`]+)`/g, '<code class="code-chip">$1</code>');
      // Bullet point
      if (line.trim().startsWith('•') || line.trim().startsWith('*') || line.trim().startsWith('-')) {
        const bulletText = parsed.replace(/^[\s•*-]+/, '');
        return (
          <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 3, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--primary, #818cf8)', fontWeight: 'bold' }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: bulletText }} />
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: 6 }} />;
      }
      return (
        <div key={idx} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: parsed }} />
      );
    });
  };

  return (
    <>
      {/* Floating Action Launcher Button */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 28,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="chatbot-launcher-btn"
            style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(0,0,0,0.2)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              cursor: 'pointer',
              position: 'relative',
              outline: 'none',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open FinSight AI Assistant"
          >
            <Bot size={28} />
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                width: 15,
                height: 15,
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid var(--bg, #0f172a)',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            {/* Ambient Pulse Ring */}
            <span
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                border: '2px solid rgba(168, 85, 247, 0.5)',
                animation: 'pulse 2s infinite',
                pointerEvents: 'none',
              }}
            />
          </motion.button>
        )}

        {/* Chat Drawer Window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              style={{
                width: 'min(400px, calc(100vw - 32px))',
                height: 'min(600px, calc(100vh - 100px))',
                borderRadius: 20,
                background: 'var(--panel-bg, rgba(17, 24, 39, 0.94))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(129, 140, 248, 0.25)',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 10000,
              }}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.92 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.12))',
                  borderBottom: '1px solid rgba(129, 140, 248, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                        FinSight AI
                      </h3>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 99,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#34d399' }} />
                        Python Active
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', margin: '1px 0 0 0' }}>
                      Website & account advisor
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={clearChat}
                    className="btn-ghost"
                    title="Clear Chat History"
                    style={{ padding: 6, borderRadius: 8, color: 'var(--text3)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn-ghost"
                    title="Minimize"
                    style={{ padding: 6, borderRadius: 8, color: 'var(--text3)' }}
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              </div>

              {/* Guardrail Scope Notice Badge */}
              <div
                style={{
                  padding: '6px 14px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  borderBottom: '1px solid rgba(99, 102, 241, 0.12)',
                  fontSize: 10.5,
                  color: 'var(--text2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ShieldCheck size={13} color="#818cf8" />
                <span>Exclusively answers FinSight & your account data.</span>
              </div>

              {/* Messages Body */}
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background:
                          msg.role === 'user'
                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                            : msg.isOutOfScope
                            ? 'rgba(239, 68, 68, 0.08)'
                            : 'var(--bg3, rgba(255,255,255,0.06))',
                        color: msg.role === 'user' ? '#ffffff' : 'var(--text)',
                        border:
                          msg.role === 'user'
                            ? 'none'
                            : msg.isOutOfScope
                            ? '1px solid rgba(239, 68, 68, 0.25)'
                            : '1px solid var(--border)',
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.isOutOfScope && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#f87171',
                            fontSize: 10,
                            fontWeight: 700,
                            marginBottom: 4,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          <HelpCircle size={12} /> Out of Domain
                        </div>
                      )}
                      {renderFormattedText(msg.text)}
                    </div>
                    <span
                      style={{
                        fontSize: 9.5,
                        color: 'var(--text3)',
                        marginTop: 3,
                        padding: '0 4px',
                      }}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(129, 140, 248, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Loader2 size={14} className="spin-icon" color="#818cf8" />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>
                      FinSight Python AI is analyzing...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div
                style={{
                  padding: '8px 14px 4px 14px',
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                }}
              >
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    disabled={loading}
                    className="btn-ghost"
                    style={{
                      fontSize: 10.5,
                      padding: '4px 10px',
                      borderRadius: 99,
                      whiteSpace: 'nowrap',
                      background: 'rgba(129, 140, 248, 0.08)',
                      border: '1px solid rgba(129, 140, 248, 0.2)',
                      color: 'var(--text2)',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <div
                style={{
                  padding: '10px 14px 14px 14px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'var(--bg2)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--bg)',
                    borderRadius: 12,
                    padding: '4px 6px 4px 12px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about FinSight or your balance..."
                    disabled={loading}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text)',
                      fontSize: 12.5,
                    }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="btn-primary"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      opacity: !input.trim() || loading ? 0.4 : 1,
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
