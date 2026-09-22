import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { repo } from '@/lib/data'
import { useIdeasStore } from '@/lib/state/ideas'
import { useAuthStore } from '@/lib/state/auth'
import { toastError } from '@/lib/state/toasts'
import { timeAgo } from '@/lib/utils/format'

interface Row {
  id: string
  user_id: string
  body: string
  created_at: string
  author: { id: string; name: string; emoji: string; color: string } | null
}

export function CommentsSection({ ideaId }: { ideaId: string }) {
  const [comments, setComments] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const listEndRef = useRef<HTMLDivElement>(null)

  const currentUser = useAuthStore((s) => s.currentUser)
  const bump = useIdeasStore((s) => s.bumpCommentsCount)

  useEffect(() => {
    let alive = true
    repo()
      .listComments(ideaId)
      .then((c) => alive && setComments(c as Row[]))
      .catch(() => alive && setComments([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [ideaId])

  const submit = async () => {
    const body = text.trim()
    if (!body || !currentUser || posting) return
    setPosting(true)
    try {
      const created = await repo().addComment(ideaId, currentUser.id, body)
      setComments((c) => [
        ...c,
        { ...created, author: { id: currentUser.id, name: currentUser.name, emoji: currentUser.emoji, color: currentUser.color } },
      ])
      setText('')
      bump(ideaId, 1)
      listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'No se pudo comentar')
    } finally {
      setPosting(false)
    }
  }

  if (loading) return null

  return (
    <div className="flex flex-col gap-3">
      {comments.length === 0 ? (
        <EmptyState
          emoji="👀"
          title="Sin comentarios"
          cta="¿Nadie tiene nada que decir sobre esto todavía?"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5">
              <Avatar user={c.author} size="sm" />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-ink/4 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-xs font-bold text-ink">{c.author?.name}</span>
                  <span className="text-xs font-medium text-ink-soft">{timeAgo(c.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-ink">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div ref={listEndRef} aria-hidden className="h-0" />

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <Avatar user={currentUser} size="sm" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          name="comment"
          autoComplete="off"
          placeholder="Decile algo al grupo…"
          aria-label="Nuevo comentario"
          className="h-11 flex-1 rounded-full border-2 border-ink/10 bg-white px-4 text-base font-medium outline-none transition-colors placeholder:text-ink/30 focus:border-coral focus-visible:ring-2 focus-visible:ring-coral/40"
        />
        <Button type="submit" size="md" disabled={!text.trim() || posting} loading={posting}>
          Enviar
        </Button>
      </form>
    </div>
  )
}