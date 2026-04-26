export function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deletion
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

export function findSubjectMatch(input: string, disciplines: string[]): { matchType: 'exact' | 'fuzzy' | 'none', matchName?: string } {
  const lowerInput = input.trim().toLowerCase();
  
  // 1. Check for exact match first
  const exactMatch = disciplines.find(d => d.toLowerCase() === lowerInput);
  if (exactMatch) return { matchType: 'exact', matchName: exactMatch };

  // 2. Check for fuzzy match
  let bestMatch = '';
  let lowestDistance = Infinity;

  for (const disc of disciplines) {
    const distance = levenshtein(lowerInput, disc.toLowerCase());
    if (distance < lowestDistance) {
      lowestDistance = distance;
      bestMatch = disc;
    }
  }

  // If the typo is minor (e.g., 1 or 2 letters off, depending on word length)
  const maxAllowedDistance = Math.max(1, Math.floor(input.length / 3)); 
  if (lowestDistance <= maxAllowedDistance) {
    return { matchType: 'fuzzy', matchName: bestMatch };
  }

  return { matchType: 'none' };
}