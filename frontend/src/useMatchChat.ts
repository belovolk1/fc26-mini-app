import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export type MatchChatMessage = {
  id: number
  sender_id: string
  body: string
  created_at: string
}

type LadderOptions = { type: 'ladder'; matchId: number }
type TournamentOptions = { type: 'tournament'; tournamentMatchId: string }
export type UseMatchChatOptions = (LadderOptions | TournamentOptions) & {
  playerId: string | null
  active: boolean
}

export function useMatchChat(options: UseMatchChatOptions) {
  const { playerId, active } = options
  const isLadder = options.type === 'ladder'
  const matchId = isLadder ? options.matchId : null
  const tournamentMatchId = !isLadder ? options.tournamentMatchId : null

  const [messages, setMessages] = useState<MatchChatMessage[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const channelId = isLadder
    ? `chat-ladder-${matchId}`
    : `chat-tournament-${tournamentMatchId}`

  useEffect(() => {
    if (!active || !playerId) {
      setMessages([])
      setLoadError(null)
      return
    }
    if (isLadder && (matchId == null || matchId === 0)) {
      setMessages([])
      return
    }
    if (!isLadder && !tournamentMatchId) {
      setMessages([])
      return
    }

    setLoadError(null)

    const load = async () => {
      if (isLadder && matchId != null) {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id, sender_id, body, created_at')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true })
        if (error) {
          setLoadError(error.message)
          setMessages([])
          return
        }
        setMessages((Array.isArray(data) ? data : []) as MatchChatMessage[])
      } else if (tournamentMatchId) {
        const { data, error } = await supabase
          .from('tournament_match_chat_messages')
          .select('id, sender_id, body, created_at')
          .eq('tournament_match_id', tournamentMatchId)
          .order('created_at', { ascending: true })
        if (error) {
          setLoadError(error.message)
          setMessages([])
          return
        }
        setMessages((Array.isArray(data) ? data : []) as MatchChatMessage[])
      }
    }

    void load()

    const filter = isLadder
      ? `match_id=eq.${matchId}`
      : `tournament_match_id=eq.${tournamentMatchId}`
    const table = isLadder ? 'chat_messages' : 'tournament_match_chat_messages'

    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table, filter },
        (payload) => {
          const row = payload.new as MatchChatMessage & { match_id?: number; tournament_match_id?: string }
          const msg: MatchChatMessage = {
            id: row.id,
            sender_id: row.sender_id,
            body: row.body,
            created_at: row.created_at,
          }
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [active, playerId, isLadder, matchId, tournamentMatchId, channelId])

  const send = async () => {
    const text = input.trim()
    if (!text || !playerId || sending) return
    if (isLadder && (matchId == null || matchId === 0)) return
    if (!isLadder && !tournamentMatchId) return

    setSending(true)
    if (isLadder && matchId != null) {
      const { data: inserted, error } = await supabase
        .from('chat_messages')
        .insert({ match_id: matchId, sender_id: playerId, body: text })
        .select('id, sender_id, body, created_at')
        .single()
      setSending(false)
      if (!error && inserted) {
        setInput('')
        const msg = inserted as MatchChatMessage
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      }
    } else if (tournamentMatchId) {
      const { data: inserted, error } = await supabase
        .from('tournament_match_chat_messages')
        .insert({ tournament_match_id: tournamentMatchId, sender_id: playerId, body: text })
        .select('id, sender_id, body, created_at')
        .single()
      setSending(false)
      if (!error && inserted) {
        setInput('')
        const msg = inserted as MatchChatMessage
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      }
    } else {
      setSending(false)
    }
  }

  return { messages, loadError, input, setInput, send, sending }
}
