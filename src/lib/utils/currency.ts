/**
 * Formatea un número al estándar de GoShopping:
 * - Comas para separar miles
 * - Punto para decimales
 * - Siempre 2 decimales (ej: 1,000.00)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
