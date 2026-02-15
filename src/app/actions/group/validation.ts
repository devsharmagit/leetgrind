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

// Validate if a LeetCode username exists
export async function validateLeetCodeUsername(username: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(`https://leetcode.com/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query userPublicProfile($username: String!) {
            matchedUser(username: $username) {
              username
            }
          }
        `,
        variables: { username },
      }),
    });

    if (!response.ok) {
      return { valid: false, error: 'Failed to verify username' };
    }

    const data = await response.json();
    
    if (data.data?.matchedUser?.username) {
      return { valid: true };
    }
    
    return { valid: false, error: `Username "${username}" not found on LeetCode` };
  } catch (error) {
    console.error('Error validating LeetCode username:', error);
    return { valid: false, error: 'Failed to verify username' };
  }
}