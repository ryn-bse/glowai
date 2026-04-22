import { useState, useRef, useEffect } from 'react'
import apiClient from '../apiClient'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'What routine suits my skin type?',
  'How do I reduce dark spots?',
  'Best ingredients for acne?',
  'How often should I exfoliate?',
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your GlowAI skincare assistant ✨\n\nI know your skin profile and can give you personalized advice. What would you like to know?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setUnread(0) }
  }, [messages, open])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    const userMsg: Message = { role: 'user', content: msg }
    const updated = [...messages, userMsg]
    setMessages(updated); setInput(''); setLoading(true)
    try {
      const res = await apiClient.post('/chat/', { messages: updated.map(m => ({ role: m.role, content: m.content })) })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }])
    } finally { setLoading(false) }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const formatMessage = (text: string) => text.split('\n').map((line, i) => (
    <span key={i}>{line}{i < text.split('\n').length - 1 && <br />}</span>
  ))

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} aria-label="Open skincare chatbot"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: open ? 'var(--gray-700)' : 'var(--primary)',
          color: '#fff', border: 'none', fontSize: 22, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(192,57,43,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'var(--transition)',
        }}>
        {open ? '✕' : '💬'}
        {!open && unread > 0 && (
          <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
            {unread}
          </div>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fade-in" style={{
          position: 'fixed', bottom: 96, right: 28, zIndex: 1000,
          width: 360, height: 520,
          background: 'var(--white)', borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid var(--gray-200)',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, var(--primary), #922b21)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✨</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>GlowAI Assistant</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: 0 }}>Online · Powered by Groq</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>✨</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '10px 13px',
                  borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  background: m.role === 'user' ? 'var(--primary)' : 'var(--gray-100)',
                  color: m.role === 'user' ? '#fff' : 'var(--gray-800)',
                  fontSize: 13, lineHeight: 1.55,
                }}>
                  {formatMessage(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✨</div>
                <div style={{ background: 'var(--gray-100)', borderRadius: '14px 14px 14px 3px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gray-400)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{ fontSize: 11, padding: '5px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--gray-200)', background: 'var(--white)', color: 'var(--gray-600)', cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.color = 'var(--gray-600)' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask about your skin…" rows={1}
              style={{ flex: 1, resize: 'none', border: '1.5px solid var(--gray-200)', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', lineHeight: 1.5, maxHeight: 80, transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? 'var(--primary)' : 'var(--gray-200)', color: input.trim() ? '#fff' : 'var(--gray-400)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'var(--transition)' }}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  )
}
