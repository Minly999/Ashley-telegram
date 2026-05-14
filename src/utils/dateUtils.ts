export function getActiveWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const targetMonday = new Date(now);

  if (day === 0) {
    // Sunday: Next Monday is +1 day
    targetMonday.setDate(now.getDate() + 1);
  } else if (day === 6) {
    // Saturday: Next Monday is +2 days
    targetMonday.setDate(now.getDate() + 2);
  } else {
    // Mon-Fri: Current Monday is -(day - 1) days
    targetMonday.setDate(now.getDate() - (day - 1));
  }

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(targetMonday);
    d.setDate(targetMonday.getDate() + i);
    
    // Format to YYYY-MM-DD strictly
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateStr = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${dateStr}`);
  }
  return dates;
}

export function parseUserInputToDate(input: string, activeWeekDates: string[]): string | null {
  const cleanInput = input.trim().toLowerCase();
  
  // Try to match weekdays (Restricted to active week)
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = weekdays.indexOf(cleanInput);
  
  if (dayIndex !== -1) {
    // Return the corresponding date from the active week array
    // activeWeekDates[0] is Monday, so we adjust the index
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; 
    return activeWeekDates[adjustedIndex] || null;
  }

  // Try to match YYYY-MM-DD format directly (Any date)
  const fullDateMatch = cleanInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (fullDateMatch) {
    return cleanInput;
  }

  // Try to match MM/DD format (Any date)
  const dateMatch = cleanInput.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (dateMatch) {
    const month = dateMatch[1].padStart(2, '0');
    const day = dateMatch[2].padStart(2, '0');
    const currentYear = new Date().getFullYear();
    
    // Return the formatted string directly to allow ANY date in the database
    return `${currentYear}-${month}-${day}`;
  }

  return null;
}

export function getWeekdayName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}