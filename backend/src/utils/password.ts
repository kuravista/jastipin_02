/**
 * Password Hashing and Verification
 * Uses bcrypt with 10 salt rounds for secure password storage
 */

import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

/**
 * Hash password with bcrypt
 * @param password - Plaintext password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify password against hash
 * @param password - Plaintext password
 * @param hash - Hashed password
 * @returns True if match, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
