/**
 * Parse a `yyyy-MM-dd` string as a date in the viewer's LOCAL timezone.
 *
 * `new Date("2026-06-15")` parses as UTC midnight, which then renders as the
 * previous day for negative-UTC offsets (all of the Americas). Date pickers in
 * this app store the picked LOCAL calendar day as `yyyy-MM-dd`, so the string
 * must be parsed back as local — not UTC — to round-trip and display correctly.
 */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}
