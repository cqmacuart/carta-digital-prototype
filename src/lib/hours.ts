import type { OpeningHours } from '../models/db'

export type OpenStatus = { open: boolean; label: string }

const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const fmt = (hhmm: string) => hhmm.replace(/^0(\d)/, '$1')

// building an Intl formatter is costly: keep one per time zone
const formatters = new Map<string, Intl.DateTimeFormat>()
const formatterFor = (timezone: string) => {
  let f = formatters.get(timezone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    formatters.set(timezone, f)
  }
  return f
}

/** Day of week and minutes since midnight at `date`, in the branch's own time zone. */
function localNow(date: Date, timezone: string) {
  const parts = formatterFor(timezone).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

/**
 * "Abierto · hasta 21:00" while a span is running, otherwise "Cerrado · abre a las 7:00"
 * (or "abre mañana 7:00" / "abre lun 7:00"). Spans may close after midnight.
 */
export function openStatus(hours: OpeningHours[], timezone: string, date = new Date()): OpenStatus {
  if (!hours.length) return { open: false, label: 'Cerrado' }
  const { day, minutes } = localNow(date, timezone)
  const spans = (d: number) => hours.filter((h) => h.day === d).sort((a, b) => toMin(a.open) - toMin(b.open))

  // still inside yesterday's span that runs past midnight
  for (const h of spans((day + 6) % 7)) if (toMin(h.close) < toMin(h.open) && minutes < toMin(h.close)) return { open: true, label: `Abierto · hasta ${fmt(h.close)}` }
  for (const h of spans(day)) {
    const o = toMin(h.open), c = toMin(h.close)
    if (minutes >= o && (c <= o || minutes < c)) return { open: true, label: `Abierto · hasta ${fmt(h.close)}` }
  }
  const later = spans(day).find((h) => toMin(h.open) > minutes)
  if (later) return { open: false, label: `Cerrado · abre a las ${fmt(later.open)}` }
  for (let i = 1; i <= 7; i++) {
    const next = spans((day + i) % 7)[0]
    if (next) return { open: false, label: `Cerrado · abre ${i === 1 ? 'mañana' : DAYS[(day + i) % 7]} ${fmt(next.open)}` }
  }
  return { open: false, label: 'Cerrado' }
}
