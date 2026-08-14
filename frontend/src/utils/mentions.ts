/**
 * Mention token utilities.
 * Comments store mentions inline as `@[Name](userId)` tokens.
 */

export interface MentionTextSegment {
  type: 'text';
  value: string;
}

export interface MentionSegment {
  type: 'mention';
  name: string;
  userId: number;
}

export type MentionParseSegment = MentionTextSegment | MentionSegment;

const MENTION_TOKEN = /@\[([^\]]+)\]\((\d+)\)/g;

/**
 * Splits content into plain-text and mention segments for rendering.
 */
export function parseMentions(content: string): MentionParseSegment[] {
  const segments: MentionParseSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MENTION_TOKEN.lastIndex = 0;
  while ((match = MENTION_TOKEN.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'mention', name: match[1], userId: Number(match[2]) });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return segments;
}

/**
 * Extracts the unique mentioned user IDs present in content.
 */
export function extractMentionedUserIds(content: string): number[] {
  const ids = new Set<number>();
  MENTION_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MENTION_TOKEN.exec(content)) !== null) {
    ids.add(Number(match[2]));
  }
  return Array.from(ids);
}

/** Builds a mention token for a user. */
export function buildMentionToken(name: string, userId: number): string {
  return `@[${name}](${userId})`;
}
