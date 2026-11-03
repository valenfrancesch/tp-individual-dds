import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(String(plain), String(hash));
}
