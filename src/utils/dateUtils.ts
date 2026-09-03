export function getActiveWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay(); 
  const targetMonday = new Date(now);

  // Determine Monday of the active schedule week
  if (day === 0) {
    targetMonday.setDate(now.getDate() + 1); // Sunday: Shift to next Monday
  } else if (day === 6) {
    targetMonday.setDate(now.getDate() + 2); // Saturday: Shift to next Monday
  } else {
    targetMonday.setDate(now.getDate() - (day - 1)); // Mon-Fri: Shift back to current Monday
  }

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(targetMonday);
    d.setDate(targetMonday.getDate() + i);
    
    // Format to YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateStr = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${dateStr}`);
  }
  return dates;
}

export function parseUserInputToDate(input: string, activeWeekDates: string[]): string | null {
  const cleanInput = input.trim().toLowerCase();
  
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = weekdays.indexOf(cleanInput);
  
  if (dayIndex !== -1) {
    // Map weekday index to activeWeekDates array index (where index 0 is Monday)
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; 
    return activeWeekDates[adjustedIndex] || null;
  }

  // YYYY-MM-DD format
  const fullDateMatch = cleanInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (fullDateMatch) {
    return cleanInput;
  }

  // MM/DD format
  const dateMatch = cleanInput.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (dateMatch) {
    const month = dateMatch[1].padStart(2, '0');
    const day = dateMatch[2].padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    return `${currentYear}-${month}-${day}`;
  }

  return null;
}

export function getWeekdayName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}