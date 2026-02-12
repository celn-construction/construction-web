/**
 * Temporary utility function - bridge for cn() during Tailwind -> MUI migration
 * TODO: Remove this file once all components are converted to MUI sx props
 */
export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(' ');
}
