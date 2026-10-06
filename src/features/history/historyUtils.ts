export function dateKey(date: Date): string {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}
export function parseLocalDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
export function shiftDate(key: string, amount: number): string {
  const date = parseLocalDate(key);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}
export function startOfWeek(key: string): string {
  const date = parseLocalDate(key);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return dateKey(date);
}
export function startOfMonth(key: string): string { return key.slice(0, 7) + "-01"; }
export function endOfMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return dateKey(new Date(year, month, 0, 12));
}
export function startOfYear(key: string): string { return key.slice(0, 4) + "-01-01"; }
export function endOfYear(key: string): string { return key.slice(0, 4) + "-12-31"; }
export function formatShortDate(key: string, language: string): string {
  return parseLocalDate(key).toLocaleDateString(language, { month: "short", day: "numeric" });
}
export function formatPeriodRange(start: string, end: string, language: string): string {
  return formatShortDate(start, language) + " – " + formatShortDate(end, language);
}
