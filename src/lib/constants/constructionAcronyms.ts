/** Common construction industry acronyms mapped to their full terms for search expansion. */
export const CONSTRUCTION_ACRONYMS: Record<string, string> = {
  RFI: 'request for information',
  CO: 'change order',
  MEP: 'mechanical electrical plumbing',
  GC: 'general contractor',
  ASI: 'architect supplemental instruction',
  PCO: 'potential change order',
  OAC: 'owner architect contractor',
};

/**
 * Expands standalone construction acronyms in a search query for better keyword matching.
 * Only matches whole words surrounded by whitespace or string boundaries (not inside words like CO2).
 */
export function expandAcronyms(query: string): string {
  return query
    .split(/\s+/)
    .map((token) => {
      const expansion = CONSTRUCTION_ACRONYMS[token.toUpperCase()];
      return expansion ? `${token} ${expansion}` : token;
    })
    .join(' ');
}
