import { useState, useRef, useEffect } from 'react'
import { useClaudeAI, ClaudeActionType, ClaudeAIResponse } from '../hooks/useClaudeAI'
import {
  Bot, Send, Sparkles, Activity, Calendar, ListChecks,
  AlertTriangle, RefreshCw, X, ChevronDown, Zap, Brain,
} from 'lucide-react'

// ── J2: Conversation message type ──
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  action: ClaudeActionType
  source?: string
  timestamp: Date
}

// ── Quick action cards for J3-J7 ──
const QUICK_ACTIONS: { action: ClaudeActionType; icon: typeof Activity; label: string; description: string; color: string }[] = [
  { action: 'health_summary', icon: Activity, label: 'Team Health', description: 'Weekly health summary with key metrics and trends', color: 'text-cult-green-bright' },
  { action: 'meeting_prep', icon: Calendar, label: 'Meeting Prep', description: 'Briefing notes and agenda suggestions for your next L10', color: 'text-blue-300' },
  { action: 'smart_todos', icon: ListChecks, label: 'Smart To-Dos', description: 'AI-suggested tasks based on rocks, issues, and goals', color: 'text-cult-amber-bright' },
  { action: 'anomaly_check', icon: AlertTriangle, label: 'Anomaly Scan', description: 'Detect overdue items, metric drops, and risk patterns', color: 'text-cult-red-bright' },
]

// ── Suggested queries for J2 ──
const SUGGESTED_QUERIES = [
  'How did our rocks perform this quarter?',
  'What are our biggest open issues right now?',
  'Summarize our V/TO core values and 10-year target',
  'Which team members have the most overdue todos?',
  'What patterns do you see in our meeting ratings?',
]

export default function ClaudeAIPage() {
  const { ask, loading } = useClaudeAI()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(action: ClaudeActionType = 'query', query?: string) {
    const text = query || input.trim()
    if (!text && action === 'query') return

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: action === 'query' ? text : QUICK_ACTIONS.find(a => a.action === action)?.label || action,
      action,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setShowSuggestions(false)

    // Get AI response
    const result = await ask(action, action === 'query' ? text : undefined)

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result?.response || 'Sorry, I couldn\'t generate a response. Please try again.',
      action,
      source: result?.source,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, aiMsg])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function clearChat() {
    setMessages([])
    setShowSuggestions(true)
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cult-gold/30 to-cult-gold/10 border border-cult-gold/30 flex items-center justify-center">
            <Brain size={20} className="text-cult-gold" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-wider text-cult-white">CLAUDE AI</h1>
            <p className="font-mono text-[10px] tracking-[0.3em] text-cult-gold/60 uppercase">Business Intelligence Assistant</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-cult-border text-cult-text text-xs font-mono hover:border-cult-gold/30 hover:text-cult-gold transition-colors">
            <RefreshCw size={11} />
            New Chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {/* Empty state with quick actions */}
        {messages.length === 0 && (
          <div className="space-y-8 animate-fade-in">
            {/* Welcome */}
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cult-gold/20 to-cult-gold/5 border border-cult-gold/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-cult-gold" />
              </div>
              <h2 className="font-display text-2xl tracking-wider text-cult-white mb-2">ASK CLAUDE ANYTHING</h2>
              <p className="text-sm text-cult-text max-w-md mx-auto">
                Query your business data with natural language. Get insights on rocks, todos, issues, meetings, and your V/TO.
              </p>
            </div>

            {/* J3-J7: Quick action cards */}
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-cult-text/60 uppercase mb-3">Quick Actions</div>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map(({ action, icon: Icon, label, description, color }) => (
                  <button
                    key={action}
                    onClick={() => handleSend(action)}
                    disabled={loading}
                    className="card p-4 text-left hover:border-cult-gold/30 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <Icon size={16} className={color} />
                      <span className="font-display text-sm tracking-wider text-cult-white group-hover:text-cult-gold transition-colors">
                        {label.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-cult-text leading-relaxed">{description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* J2: Suggested queries */}
            {showSuggestions && (
              <div>
                <div className="font-mono text-[10px] tracking-[0.3em] text-cult-text/60 uppercase mb-3">Try Asking</div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUERIES.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(q); inputRef.current?.focus() }}
                      className="px-3 py-1.5 rounded-full border border-cult-border text-xs text-cult-text hover:border-cult-gold/30 hover:text-cult-gold transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat messages */}
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-slide-up`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-md bg-cult-gold/15 border border-cult-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-cult-gold" />
              </div>
            )}
            <div className={`max-w-[80%] ${
              msg.role === 'user'
                ? 'bg-cult-gold/15 border border-cult-gold/25 rounded-xl rounded-br-sm px-4 py-2.5'
                : 'bg-cult-surface border border-cult-border rounded-xl rounded-bl-sm px-4 py-3'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="space-y-2">
                  <div className="text-sm text-cult-white leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  {msg.source && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-cult-border/50">
                      <Zap size={9} className="text-cult-gold/50" />
                      <span className="font-mono text-[9px] text-cult-text/40 tracking-wider">
                        {msg.source === 'claude' ? 'Claude AI' : 'Algorithmic Analysis'}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-cult-white">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="font-mono text-[10px] text-cult-gold font-medium">Y</span>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 animate-slide-up">
            <div className="w-7 h-7 rounded-md bg-cult-gold/15 border border-cult-gold/20 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-cult-gold animate-pulse" />
            </div>
            <div className="bg-cult-surface border border-cult-border rounded-xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-cult-gold/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-cult-gold/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-cult-gold/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-mono text-[10px] text-cult-text/50 tracking-wider">Analyzing your business data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-cult-border pt-4 pb-2">
        {/* Quick action pills (visible after first message) */}
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {QUICK_ACTIONS.map(({ action, icon: Icon, label, color }) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cult-border text-xs font-mono text-cult-text hover:border-cult-gold/30 hover:text-cult-gold transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <Icon size={11} className={color} />
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your rocks, todos, issues, meetings, V/TO..."
            className="flex-1 bg-cult-surface border border-cult-border rounded-lg px-4 py-2.5 text-sm text-cult-white placeholder-cult-text/40 focus:outline-none focus:border-cult-gold/40 transition-colors"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-cult-gold/20 text-cult-gold border border-cult-gold/30 rounded-lg hover:bg-cult-gold/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Bot size={9} className="text-cult-text/30" />
          <span className="font-mono text-[9px] text-cult-text/30 tracking-wider">
            Powered by Claude · Context-aware business intelligence
          </span>
        </div>
      </div>
    </div>
  )
}
