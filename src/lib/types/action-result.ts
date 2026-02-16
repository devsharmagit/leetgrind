// Flexible ActionResult type that supports:
// 1. Actions without data:       ActionResult                    → { success: true } | { success: false, error }
// 2. Actions with typed data:    ActionResult<Group>             → { success: true, data: Group } | …
// 3. Actions with typed metadata: ActionResult<Group, { currentUserId: number }>
//                                 → { success: true, data: Group, currentUserId: number } | { success: false, error, currentUserId?: number }
//
// Metadata appears on success (required) and on error (optional via Partial<M>),
// which matches patterns like getPublicLeaderboard that attach groupName even on errors.

export type ActionResult<
  T = void,
  M extends Record<string, unknown> = Record<string, unknown>,
> = T extends void
  ? ({ success: true } & M) | ({ success: false; error: string } & Partial<M>)
  : ({ success: true; data: T } & M) | ({ success: false; error: string } & Partial<M>);