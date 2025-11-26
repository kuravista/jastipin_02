/**
 * Order Code Generator
 * 
 * Generates secure, non-sequential order codes that are:
 * - Not easily guessable or enumerable
 * - Human-readable (avoids confusing characters)
 * - Includes checksum for validation
 * 
 * Format: JST-XXXXXX-XX
 * - JST: Prefix (Jastipin)
 * - XXXXXX: 6 random alphanumeric chars (base32-safe)
 * - XX: 2 char checksum
 * 
 * Example: JST-K7X9M2-4F
 */

import crypto from 'crypto'

// Safe alphabet - excludes confusing characters: 0,O,1,I,L
const SAFE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const ALPHABET_LENGTH = SAFE_ALPHABET.length // 31 characters

/**
 * Generate cryptographically secure random string
 */
function generateRandomPart(length: number): string {
  const bytes = crypto.randomBytes(length)
  let result = ''
  
  for (let i = 0; i < length; i++) {
    // Use modulo to map byte to alphabet index
    result += SAFE_ALPHABET[bytes[i] % ALPHABET_LENGTH]
  }
  
  return result
}

/**
 * Generate 2-character checksum from the random part
 * Uses simple hash-based checksum
 */
function generateChecksum(randomPart: string): string {
  const hash = crypto.createHash('sha256').update(randomPart).digest()
  
  // Take first 2 bytes and map to safe alphabet
  const char1 = SAFE_ALPHABET[hash[0] % ALPHABET_LENGTH]
  const char2 = SAFE_ALPHABET[hash[1] % ALPHABET_LENGTH]
  
  return `${char1}${char2}`
}

/**
 * Validate order code checksum
 */
export function validateOrderCode(orderCode: string): boolean {
  // Expected format: JST-XXXXXX-XX
  const pattern = /^JST-([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6})-([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{2})$/
  const match = orderCode.match(pattern)
  
  if (!match) return false
  
  const randomPart = match[1]
  const providedChecksum = match[2]
  const expectedChecksum = generateChecksum(randomPart)
  
  return providedChecksum === expectedChecksum
}

/**
 * Generate a new unique order code
 * Format: JST-XXXXXX-XX
 */
export function generateOrderCode(): string {
  const randomPart = generateRandomPart(6)
  const checksum = generateChecksum(randomPart)
  
  return `JST-${randomPart}-${checksum}`
}

/**
 * Extract the random part from order code (for display/short reference)
 */
export function getShortCode(orderCode: string): string {
  const match = orderCode.match(/^JST-([A-Z0-9]{6})-[A-Z0-9]{2}$/)
  return match ? match[1] : orderCode
}
