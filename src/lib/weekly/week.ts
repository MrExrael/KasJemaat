import { endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { id } from "date-fns/locale";

// Definisi minggu: Senin–Minggu (CLAUDE.md keputusan #6).
const OPTS = { weekStartsOn: 1 } as const;

/** Tanggal Senin (yyyy-MM-dd) dari tanggal mana pun dalam minggu tersebut. */
export function mondayOf(dateStr: string): string {
  return format(startOfWeek(parseISO(dateStr), OPTS), "yyyy-MM-dd");
}

/** Label rentang, mis. "6 Jul – 12 Jul 2026", dari week_start_date (Senin). */
export function weekRangeLabel(weekStart: string): string {
  const start = parseISO(weekStart);
  const end = endOfWeek(start, OPTS);
  return `${format(start, "d MMM", { locale: id })} – ${format(end, "d MMM yyyy", { locale: id })}`;
}

/** Tanggal hari ini (yyyy-MM-dd) lokal. */
export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}
