// Flexible ActionResult type that supports:
// 1. Actions with data: { success: true, data: T }
// 2. Actions without data: { success: true }
// 3. Actions with errors: { success: false, error: string }
// 4. Additional properties for backward compatibility (e.g., currentUserId, results, message, etc.)
export type ActionResult<T = void> = T extends void
  ? { success: true; [key: string]: any } | { success: false; error: string; [key: string]: any }
  : { success: true; data: T; [key: string]: any } | { success: false; error: string; [key: string]: any };