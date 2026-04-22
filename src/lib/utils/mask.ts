/**
 * Formats a raw numeric string or a partially formatted string into the Costa Rican
 * phone format with international prefix: +506 XXXX-XXXX
 */
export const formatCostaRicaPhone = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Extract only the relevant part (skip 506 if it was already typed/pasted)
  let cleanNumbers = numbers;
  if (numbers.startsWith('506') && numbers.length > 3) {
    cleanNumbers = numbers.slice(3);
  }
  
  // Limit to 8 digits (standard Costa Rican length)
  const truncated = cleanNumbers.slice(0, 8);
  
  // Build the masked string
  let masked = '+506 ';
  
  if (truncated.length > 0) {
    const part1 = truncated.slice(0, 4);
    masked += part1;
    
    if (truncated.length > 4) {
      const part2 = truncated.slice(4, 8);
      masked += '-' + part2;
    }
  }
  
  return masked;
};
