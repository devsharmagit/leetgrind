// src/app/actions/groups/validation.ts

export function validateUsernameFormat(
  username: string
): { valid: boolean; error?: string } {
  if (!username || username.length === 0) {
    return { valid: false, error: "Username cannot be empty" };
  }

  if (username.length < 3) {
    return { valid: false, error: "Username too short (min 3 characters)" };
  }

  if (username.length > 30) {
    return { valid: false, error: "Username too long (max 30 characters)" };
  }

  const validPattern = /^[a-zA-Z0-9_]+$/;
  if (!validPattern.test(username)) {
    return {
      valid: false,
      error:
        "Username contains invalid characters (only letters, numbers, _ allowed)",
    };
  }

  return { valid: true };
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}