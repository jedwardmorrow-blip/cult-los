// D3: Reusable avatar stack for multi-assignee display

interface AvatarInfo {
  id: string
  full_name: string
  avatar_url?: string
}

interface Props {
  people: AvatarInfo[]
  maxShow?: number
  size?: 'sm' | 'md'
}

export default function AvatarStack({ people, maxShow = 3, size = 'sm' }: Props) {
  if (!people || people.length === 0) return null

  const shown = people.slice(0, maxShow)
  const overflow = people.length - maxShow

  const dims = size === 'sm'
    ? { w: 'w-5 h-5', text: 'text-[7px]', overlap: '-ml-1.5' }
    : { w: 'w-6 h-6', text: 'text-[8px]', overlap: '-ml-2' }

  return (
    <div className="flex items-center flex-shrink-0">
      {shown.map((person, i) => {
        const initials = person.full_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        return (
          <div
            key={person.id}
            className={`${dims.w} rounded-full bg-cult-gold/20 border border-cult-dark flex items-center justify-center
              ${i > 0 ? dims.overlap : ''}`}
            title={person.full_name}
            style={{ zIndex: shown.length - i }}
          >
            {person.avatar_url ? (
              <img
                src={person.avatar_url}
                alt={person.full_name}
                className={`${dims.w} rounded-full object-cover`}
              />
            ) : (
              <span className={`${dims.text} font-mono text-cult-gold font-medium`}>
                {initials}
              </span>
            )}
          </div>
        )
      })}
      {overflow > 0 && (
        <div
          className={`${dims.w} rounded-full bg-cult-muted border border-cult-border flex items-center justify-center ${dims.overlap}`}
          title={`${overflow} more`}
          style={{ zIndex: 0 }}
        >
          <span className={`${dims.text} font-mono text-cult-text`}>+{overflow}</span>
        </div>
      )}
    </div>
  )
}
