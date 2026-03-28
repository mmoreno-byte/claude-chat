import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './App.css'

const MODEL = 'llama-3.3-70b-versatile'

const SUGGESTIONS = [
  '¿Qué es la inteligencia artificial?',
  'Explícame cómo funciona React',
  'Dame ideas para un proyecto Python',
  'Ayúdame a escribir un email profesional'
]

const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span>{language || 'código'}</span>
        <button onClick={copy}>{copied ? '✓ Copiado' : 'Copiar'}</button>
      </div>
      <SyntaxHighlighter language={language} style={oneDark} PreTag="div">
        {children}
      </SyntaxHighlighter>
    </div>
  )
}

const MarkdownComponents = {
  code({ inline, className, children }) {
    const language = /language-(\w+)/.exec(className || '')?.[1]
    return !inline
      ? <CodeBlock language={language}>{String(children).replace(/\n$/, '')}</CodeBlock>
      : <code className="inline-code">{children}</code>
  }
}

export default function App() {
  const [chats, setChats] = useState([{ id: 1, title: 'Nueva conversación', messages: [] }])
  const [activeChatId, setActiveChatId] = useState(1)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)

  const activeChat = chats.find(c => c.id === activeChatId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages, loading])

  const sendMessage = async (text) => {
    const content = text || input
    if (!content.trim() || loading) return

    const userMessage = { role: 'user', content }
    const updatedMessages = [...activeChat.messages, userMessage]

    setChats(prev => prev.map(c =>
      c.id === activeChatId
        ? {
            ...c,
            title: c.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : c.title,
            messages: [...updatedMessages, { role: 'assistant', content: '' }]
          }
        : c
    ))
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.replace('data: ', '')
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.content) {
              fullContent += parsed.content
              setChats(prev => prev.map(c =>
                c.id === activeChatId
                  ? { ...c, messages: [...updatedMessages, { role: 'assistant', content: fullContent }] }
                  : c
              ))
            }
          } catch {}
        }
      }
    } catch {
      setChats(prev => prev.map(c =>
        c.id === activeChatId
          ? { ...c, messages: [...updatedMessages, { role: 'assistant', content: 'Error al conectar con el servidor.' }] }
          : c
      ))
    } finally {
      setLoading(false)
    }
  }

  const regenerate = () => {
    if (loading) return
    const messages = activeChat.messages
    if (messages.length < 2) return
    const withoutLast = messages.slice(0, -1)
    setChats(prev => prev.map(c =>
      c.id === activeChatId ? { ...c, messages: withoutLast } : c
    ))
    const lastUser = withoutLast[withoutLast.length - 1]
    if (lastUser?.role === 'user') sendMessage(lastUser.content)
  }

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
  }

  const exportChat = () => {
    const text = activeChat.messages
      .map(m => `${m.role === 'user' ? 'Tú' : 'Asistente'}: ${m.content}`)
      .join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeChat.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const newChat = () => {
    const id = Date.now()
    setChats(prev => [...prev, { id, title: 'Nueva conversación', messages: [] }])
    setActiveChatId(id)
  }

  const clearChat = () => {
    setChats(prev => prev.map(c =>
      c.id === activeChatId ? { ...c, messages: [] } : c
    ))
  }

  const deleteChat = (id) => {
    if (chats.length === 1) return
    const remaining = chats.filter(c => c.id !== id)
    setChats(remaining)
    if (activeChatId === id) setActiveChatId(remaining[0].id)
  }

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">✦ Claude Chat</div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
        <button className="new-chat-btn" onClick={newChat}>+ Nueva conversación</button>
        <div className="chat-list">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <span className="chat-item-title">{chat.title}</span>
              {chats.length > 1 && (
                <button className="chat-item-delete" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id) }}>×</button>
              )}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="model-badge">✦ {MODEL}</div>
        </div>
      </aside>

      <main className="main">
        <header className="chat-header">
          <div className="chat-header-left">
            {!sidebarOpen && (
              <button className="sidebar-toggle-mobile" onClick={() => setSidebarOpen(true)}>☰</button>
            )}
            <div>
              <h1>{activeChat?.title}</h1>
              <span className="chat-subtitle">Asistente de IA · {MODEL}</span>
            </div>
          </div>
          <div className="chat-header-actions">
            {activeChat?.messages.length > 0 && (
              <button className="export-btn" onClick={exportChat}>⬇ Exportar</button>
            )}
            <button className="clear-btn" onClick={clearChat}>🗑 Limpiar</button>
          </div>
        </header>

        <div className="messages">
          {activeChat?.messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <h2>¿En qué puedo ayudarte?</h2>
              <p>Pregúntame lo que quieras. Estoy aquí para ayudar.</p>
              <div className="suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="suggestion-btn" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {activeChat?.messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '✦'}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-role">{msg.role === 'user' ? 'Tú' : 'Asistente'}</span>
                  <div className="message-actions">
                    <button className="msg-action-btn" onClick={() => copyMessage(msg.content)} title="Copiar">⎘</button>
                    {msg.role === 'assistant' && i === activeChat.messages.length - 1 && (
                      <button className="msg-action-btn" onClick={regenerate} title="Regenerar">↺</button>
                    )}
                  </div>
                </div>
                <div className="message-bubble">
                  {msg.role === 'assistant'
                    ? <ReactMarkdown components={MarkdownComponents}>{msg.content}</ReactMarkdown>
                    : msg.content
                  }
                </div>
              </div>
            </div>
          ))}
          {loading && activeChat?.messages[activeChat.messages.length - 1]?.content === '' && (
            <div className="message assistant">
              <div className="message-avatar">✦</div>
              <div className="message-content">
                <span className="message-role">Asistente</span>
                <div className="message-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>↑</button>
          </div>
          <p className="input-hint">Claude Chat puede cometer errores. Verifica la información importante.</p>
        </div>
      </main>
    </div>
  )
}