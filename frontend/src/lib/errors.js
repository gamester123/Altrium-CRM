const PATTERNS = [
  [/E11000|duplicate key/i, 'That email is already registered.'],
  [/validation failed/i, 'Some of those details are not valid. Check the fields and try again.'],
  [/cast to objectid/i, "We couldn't find that record."],
  [/jwt|token/i, 'Your session has ended. Sign in again.'],
  [/Management accounts must sign in through the management login/i, 'This account must use the Admin Login.'],
  [/Not authorized for management access/i, 'This account must use the regular login.'],
]

const GENERIC = 'Something went wrong. Try again.'

export function friendlyError(error) {
  const raw = (typeof error === 'string' ? error : error?.message) || ''
  if (!raw) return GENERIC

  const match = PATTERNS.find(([pattern]) => pattern.test(raw))
  if (match) return match[1]

  // Anything that looks like a stack trace, an object dump or a
  // database internal gets swallowed rather than shown.
  const looksInternal = raw.includes('{') || raw.includes('collection:') || raw.length > 140
  return looksInternal ? GENERIC : raw
}
