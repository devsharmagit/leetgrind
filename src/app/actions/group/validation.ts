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

  // ✅ FIX: Allow hyphens in addition to letters, numbers, and underscores
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(username)) {
    return {
      valid: false,
      error:
        "Username contains invalid characters (only letters, numbers, _, - allowed)",
    };
  }

  return { valid: true };
}

// ✅ FIX: Only trim whitespace, preserve case
export function normalizeUsername(username: string): string {
  return username.trim();
}

// ✅ FIX: Validate and return the canonical username from LeetCode
export async function validateLeetCodeUsername(
  username: string
): Promise<{ valid: boolean; error?: string; canonicalUsername?: string }> {
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
      // ✅ Return the canonical username from LeetCode
      return { 
        valid: true, 
        canonicalUsername: data.data.matchedUser.username 
      };
    }
    
    return { valid: false, error: `Username "${username}" not found on LeetCode` };
  } catch (error) {
    console.error('Error validating LeetCode username:', error);
    return { valid: false, error: 'Failed to verify username' };
  }
}