export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasUpperAndLower: boolean;
  score: number;
  errors: string[];
  message: string;
}

/**
 * Validates that a password strictly satisfies all 5 required rules:
 * 1. At least 8 characters
 * 2. At least 1 capital letter (uppercase A-Z)
 * 3. At least 1 small letter (lowercase a-z)
 * 4. At least 1 number (0-9)
 * 5. At least 1 special character / symbol
 *
 * Applicable on the signup page and registration endpoints (exempt on login page).
 */
export function validatePassword(password: string): PasswordValidationResult {
  const p = typeof password === 'string' ? password : '';

  const hasMinLength = p.length >= 8;
  const hasUppercase = /[A-Z]/.test(p);
  const hasLowercase = /[a-z]/.test(p);
  const hasNumber = /\d/.test(p);
  const hasSymbol = /[^A-Za-z0-9]/.test(p);
  const hasUpperAndLower = hasUppercase && hasLowercase;

  const errors: string[] = [];
  if (!hasMinLength) errors.push('at least 8 characters');
  if (!hasUppercase) errors.push('at least 1 capital letter (A-Z)');
  if (!hasLowercase) errors.push('at least 1 small letter (a-z)');
  if (!hasNumber) errors.push('at least 1 number (0-9)');
  if (!hasSymbol) errors.push('at least 1 special character / symbol');

  const score = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  const isValid = score === 5;

  let message = '';
  if (!isValid) {
    message = `Password must contain ${errors.join(', ')}.`;
  }

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
    hasUpperAndLower,
    score,
    errors,
    message,
  };
}
