const DIGITS_ONLY = /\D/g

/** Normalizes input to up to 10-digit Indian mobile (strips +91 / spaces). */
export function normalizeIndianMobile(input: string): string {
  const digits = input.replace(DIGITS_ONLY, '')
  if (digits.length >= 12 && digits.startsWith('91')) {
    return digits.slice(-10)
  }
  return digits.slice(-10)
}

export function isAuthorizedMobile(
  raw: string,
  authorized: ReadonlySet<string>
): boolean {
  const n = normalizeIndianMobile(raw)
  return n.length === 10 && authorized.has(n)
}
