// D4: Parse @mentions in text and render them as styled spans

interface Props {
  text: string
  className?: string
}

// Matches @FirstName or @First Last (two words after @)
const MENTION_REGEX = /@([A-Za-z]+(?:\s[A-Za-z]+)?)/g

export default function MentionText({ text, className = '' }: Props) {
  if (!text) return null

  const parts: Array<{ type: 'text' | 'mention'; value: string }> = []
  let lastIndex = 0

  for (const match of text.matchAll(MENTION_REGEX)) {
    const matchIndex = match.index ?? 0
    // Add text before the mention
    if (matchIndex > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, matchIndex) })
    }
    parts.push({ type: 'mention', value: match[1] })
    lastIndex = matchIndex + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  // If no mentions found, just return plain text
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === 'mention' ? (
          <span
            key={i}
            className="inline-flex items-center px-1 py-px rounded bg-cult-gold/10 text-cult-gold font-mono text-inherit"
          >
            @{part.value}
          </span>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </span>
  )
}
