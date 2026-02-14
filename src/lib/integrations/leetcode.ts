// src/lib/integrations/leetcode.ts

const LEETCODE_URL = "https://leetcode.com/graphql";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function validateLeetCodeUsername(
  username: string
): Promise<{ valid: boolean; error?: string }> {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 5000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(LEETCODE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Retry only for 5xx errors
      if (!response.ok) {
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          await sleep(500 * (attempt + 1));
          continue;
        }

        return { valid: false, error: "Failed to verify username" };
      }

      const data = await response.json();

      if (data.data?.matchedUser?.username) {
        return { valid: true };
      }

      return { valid: false, error: "Username not found on LeetCode" };
    } catch (error: any) {
      clearTimeout(timeout);

      const isTimeout = error.name === "AbortError";

      if (attempt < MAX_RETRIES) {
        await sleep(500 * (attempt + 1));
        continue;
      }

      return {
        valid: false,
        error: isTimeout
          ? "LeetCode request timed out"
          : "Failed to verify username",
      };
    }
  }

  return { valid: false, error: "Unknown error" };
}
