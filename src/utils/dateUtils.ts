const UKRAINIAN_WEEKDAYS = [
  "Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"
];

// Map Ukrainian and English names/abbreviations to Monday-based index (0 = Monday, 6 = Sunday)
const WEEKDAY_INDEX: Record<string, number> = {
  "понеділок": 0, "пн": 0, "monday": 0, "mon": 0,
  "вівторок": 1, "вт": 1, "tuesday": 1, "tue": 1,
  "середа": 2, "ср": 2, "wednesday": 2, "wed": 2,
  "четвер": 3, "чт": 3, "thursday": 3, "thu": 3,
  "п'ятниця": 4, "пятниця": 4, "пт": 4, "friday": 4, "fri": 4,
  "субота": 5, "сб": 5, "saturday": 5, "sat": 5,
  "неділя": 6, "нд": 6, "sunday": 6, "sun": 6,
};

export function getWeekdayName(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return UKRAINIAN_WEEKDAYS[date.getDay()] || "";
}

export function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split("-");
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
}

export function getActiveWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const targetMonday = new Date(now);

  if (day === 0) targetMonday.setDate(now.getDate() + 1);
  else if (day === 6) targetMonday.setDate(now.getDate() + 2);
  else targetMonday.setDate(now.getDate() - (day - 1));

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(targetMonday);
    d.setDate(targetMonday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dateStr = String(d.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${dateStr}`);
  }
  return dates;
}

export function parseUserInputToDate(input: string, activeWeekDates: string[]): string | null {
  const clean = input.trim().toLowerCase();

  // 1. Weekdays (Ukrainian / English)
  if (clean in WEEKDAY_INDEX) {
    return activeWeekDates[WEEKDAY_INDEX[clean]] || null;
  }

  // 2. DD-MM-YYYY or DD.MM.YYYY
  const full = clean.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (full) {
    return `${full[3]}-${full[2].padStart(2, "0")}-${full[1].padStart(2, "0")}`;
  }

  // 3. DD-MM or DD.MM (Assumes current year)
  const short = clean.match(/^(\d{1,2})[-./](\d{1,2})$/);
  if (short) {
    const year = new Date().getFullYear();
    return `${year}-${short[2].padStart(2, "0")}-${short[1].padStart(2, "0")}`;
  }

  // 4. ISO fallback (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  return null;
}