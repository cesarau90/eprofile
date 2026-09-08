import bcrypt from "bcryptjs";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Regla mínima de contraseña usada en cliente y servidor. */
export function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8) issues.push("Debe tener al menos 8 caracteres.");
  if (!/[A-Za-z]/.test(pw)) issues.push("Debe incluir al menos una letra.");
  if (!/[0-9]/.test(pw)) issues.push("Debe incluir al menos un número.");
  return issues;
}
