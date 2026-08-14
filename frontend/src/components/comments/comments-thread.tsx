import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/shadcn/avatar';
import { useUsersQuery } from '@/hooks/api/use-users';
import {
  useCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from '@/hooks/api/use-comments';
import { useCommentEvents } from '@/hooks/websocket/use-comment-events';
import { useAuthStore } from '@/stores/auth-store';
import { formatISODateTime } from '@/utils/date';
import { parseMentions, extractMentionedUserIds, buildMentionToken } from '@/utils/mentions';
import type { Comment } from '@/types/comments';

interface CommentsThreadProps {
  /** Channel that scopes the thread (e.g. "alert:123"). Null disables input. */
  channel: string | null;
  /** Optional cap for the bubbles list height. */
  className?: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Detects an in-progress "@mention" being typed before the caret. */
function detectMentionQuery(
  value: string,
  caret: number,
): { query: string; start: number } | null {
  const upto = value.slice(0, caret);
  const m = /(?:^|\s)@([\p{L}0-9._-]*)$/u.exec(upto);
  if (!m) return null;
  return { query: m[1], start: caret - m[1].length - 1 };
}

/** Renders comment content with highlighted mentions. */
function CommentBody({ content, own }: { content: string; own: boolean }) {
  const segments = useMemo(() => parseMentions(content), [content]);
  return (
    <p className="text-xs whitespace-pre-wrap break-words">
      {segments.map((seg, i) =>
        seg.type === 'mention' ? (
          <span
            key={i}
            className={own ? 'font-semibold underline underline-offset-2' : 'font-semibold text-primary'}
          >
            @{seg.name}
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </p>
  );
}

/**
 * CommentsThread
 * Reusable, channel-based comments UI: WhatsApp-style bubbles, @mentions with
 * autocomplete, real-time updates. Used by ActivitiesTab and CommentsTab.
 */
export const CommentsThread = ({ channel, className }: CommentsThreadProps) => {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = (currentUser?.roles ?? []).includes('admin');

  const commentsQuery = useCommentsQuery(channel);
  const createComment = useCreateCommentMutation(channel);
  const deleteComment = useDeleteCommentMutation(channel);
  useCommentEvents(channel);

  const comments: Comment[] = commentsQuery.data?.data ?? [];
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // @mention autocomplete state
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(mention?.query ?? ''), 250);
    return () => clearTimeout(t);
  }, [mention?.query]);

  const mentionOpen = mention !== null;
  const usersQuery = useUsersQuery(
    { search: debouncedQuery, limit: 6 },
    { enabled: mentionOpen },
  );
  const suggestions = mentionOpen ? usersQuery.data?.data ?? [] : [];

  const syncMentionFromCaret = useCallback((value: string, caret: number) => {
    setMention(detectMentionQuery(value, caret));
  }, []);

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft(value);
    syncMentionFromCaret(value, e.target.selectionStart ?? value.length);
  };

  const selectMention = (user: { id: number; name: string }) => {
    if (!mention) return;
    const caret = textareaRef.current?.selectionStart ?? draft.length;
    const before = draft.slice(0, mention.start);
    const after = draft.slice(caret);
    const token = buildMentionToken(user.name, user.id);
    const next = `${before}${token} ${after}`;
    setDraft(next);
    setMention(null);
    requestAnimationFrame(() => {
      const pos = before.length + token.length + 1;
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const handlePost = () => {
    const content = draft.trim();
    if (!content || createComment.isPending) return;
    createComment.mutate(
      { content, mentionedUserIds: extractMentionedUserIds(content) },
      { onSuccess: () => { setDraft(''); setMention(null); } },
    );
  };

  const canDelete = (c: Comment) => isAdmin || c.author.id === currentUser?.id;

  return (
    <div>
      <div className={className ?? 'space-y-2 max-h-[320px] overflow-y-auto mb-3 pr-1'}>
        {commentsQuery.isLoading ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-3">{t('comments.empty')}</div>
        ) : (
          comments.map((c) => {
            const own = c.author.id === currentUser?.id;
            return (
              <div key={c.id} className={`flex gap-2 group ${own ? 'flex-row-reverse' : ''}`}>
                {!own && (
                  <Avatar className="h-7 w-7 shrink-0">
                    {c.author.photo && <AvatarImage src={c.author.photo} alt={c.author.name} />}
                    <AvatarFallback className="text-[10px]">{initialsOf(c.author.name)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col max-w-[80%] ${own ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      own
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    {!own && (
                      <span className="block text-[11px] font-semibold mb-0.5 truncate" title={c.author.email}>
                        {c.author.name || c.author.email}
                      </span>
                    )}
                    <CommentBody content={c.content} own={own} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatISODateTime(c.createdAt, undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                    {canDelete(c) && (
                      <button
                        type="button"
                        onClick={() => deleteComment.mutate(c.id)}
                        disabled={deleteComment.isPending}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity disabled:opacity-50"
                        title={t('comments.delete')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="relative">
        {mentionOpen && (
          <div className="absolute bottom-full mb-1 left-0 right-0 z-20 max-h-44 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center py-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">{t('comments.noUsers')}</div>
            ) : (
              suggestions.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectMention(u);
                  }}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-accent"
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    {u.photo && <AvatarImage src={u.photo} alt={u.name} />}
                    <AvatarFallback className="text-[9px]">{initialsOf(u.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{u.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={handleDraftChange}
          onClick={(e) => syncMentionFromCaret(draft, e.currentTarget.selectionStart ?? 0)}
          onKeyUp={(e) => {
            if (e.key === 'Escape') { setMention(null); return; }
            syncMentionFromCaret(draft, e.currentTarget.selectionStart ?? 0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handlePost();
            }
          }}
            placeholder={channel ? t('comments.placeholder') : t('comments.unavailable')}
          disabled={!channel || createComment.isPending}
          className="w-full min-h-[72px] p-2 text-xs border border-border rounded-md resize-none bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-60"
          rows={3}
        />
      </div>
      <div className="flex justify-end mt-2">
        <Button
          size="sm"
          className="text-xs h-7"
          onClick={handlePost}
          disabled={!channel || !draft.trim() || createComment.isPending}
        >
          {createComment.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              {t('comments.post')}
        </Button>
      </div>
    </div>
  );
};
