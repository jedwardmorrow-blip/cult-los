// G5: ICS file generation for calendar fallback
// Generates a downloadable .ics file for users without Google Calendar integration

export function generateICS(params: {
  title: string
  scheduledAt: string
  durationMinutes: number
  description?: string
  location?: string
}): string {
  const { title, scheduledAt, durationMinutes, description, location } = params
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const uid = `cult-los-${Date.now()}@cultcannabis.co`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CULT LOS//Meeting//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    description ? `DESCRIPTION:${escapeICS(description)}` : '',
    location ? `LOCATION:${escapeICS(location)}` : '',
    `DTSTAMP:${formatDate(new Date())}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return lines.join('\r\n')
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function downloadICS(params: {
  title: string
  scheduledAt: string
  durationMinutes: number
  description?: string
}) {
  const icsContent = generateICS(params)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${params.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
