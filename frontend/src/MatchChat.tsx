import { useLayoutEffect, useRef } from 'react'
import type { MatchChatMessage } from './useMatchChat'

type MatchChatProps = {
  messages: MatchChatMessage[]
  loadError: string | null
  input: string
  setInput: (v: string) => void
  send: () => void
  sending: boolean
  playerId: string | null
  title: string
  placeholder: string
  sendLabel: string
  emptyLabel: string
  errorLabel: string
  /** Добавить класс к контейнеру (например для модалки — уменьшенная высота) */
  containerClassName?: string
}

export function MatchChat({
  messages,
  loadError,
  input,
  setInput,
  send,
  sending,
  playerId,
  title,
  placeholder,
  sendLabel,
  emptyLabel,
  errorLabel,
  containerClassName = '',
}: MatchChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!messages.length) return
    const container = scrollRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [messages.length, messages])

  return (
    <section className={`lobby-chat ${containerClassName}`.trim()}>
      <h3 className="lobby-chat-title">{title}</h3>
      <div ref={scrollRef} className="lobby-chat-messages" role="log" aria-live="polite">
        {loadError && (
          <p className="panel-text small lobby-chat-empty lobby-chat-error">{errorLabel}</p>
        )}
        {!loadError && messages.length === 0 && (
          <p className="panel-text small lobby-chat-empty">{emptyLabel}</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`lobby-chat-msg ${msg.sender_id === playerId ? 'lobby-chat-msg--mine' : 'lobby-chat-msg--theirs'}`}
          >
            <span className="lobby-chat-msg-body">{msg.body}</span>
            <span className="lobby-chat-msg-time">
              {new Date(msg.created_at).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
        <div ref={endRef} className="lobby-chat-anchor" aria-hidden="true" />
      </div>
      <div className="lobby-chat-form">
        <input
          type="text"
          className="form-input lobby-chat-input"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button
          type="button"
          className="primary-button lobby-chat-send"
          disabled={sending || !input.trim()}
          onClick={send}
        >
          {sending ? '…' : sendLabel}
        </button>
      </div>
    </section>
  )
}
