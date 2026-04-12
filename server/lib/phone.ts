const DIGITS_ONLY = /\D/g

export function normalizeIndianMobile(input: string): string {
  const digits = input.replace(DIGITS_ONLY, '')
  if (digits.length >= 12 && digits.startsWith('91')) {
    return digits.slice(-10)
  }
  return digits.slice(-10)
}
