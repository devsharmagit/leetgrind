import { z } from "zod";

/**
 * ──────────────────────────────────────────────
 * Leaderboard Entry Schema
 * ──────────────────────────────────────────────
 * Represents a single member in the leaderboard snapshot.
 */
export const leaderboardEntrySchema = z.object({
  username: z.string().min(1, "Username is required"),

  ranking: z.number().int().min(0),

  totalSolved: z.number().int().min(0),
  easySolved: z.number().int().min(0),
  mediumSolved: z.number().int().min(0),
  hardSolved: z.number().int().min(0),

  contestRating: z.number().int().min(0),

  rankingPoints: z.number().min(0),

  // Date when stats were last updated (nullable allowed)
  lastUpdated: z.date().nullable(),
});

/**
 * Snapshot JSON Schema
 * Stored in leaderboardSnapshot.snapshotData (JSON column)
 */
export const snapshotDataSchema = z
  .array(leaderboardEntrySchema)
  .min(1, "Snapshot must contain at least one member");

/**
 * ──────────────────────────────────────────────
 * Gainer Entry Schema
 * ──────────────────────────────────────────────
 */
export const gainerEntrySchema = z.object({
  username: z.string().min(1),

  problemsGained: z.number().int().min(0),

  // Can be negative if rank worsened
  rankImproved: z.number().int(),

  currentSolved: z.number().int().min(0),
  currentRank: z.number().int().min(0),
});

/**
 * Top Gainers JSON Schema
 * Stored in leaderboardSnapshot.topGainers (JSON column)
 */
export const topGainersSchema = z
  .array(gainerEntrySchema)
  .nullable();

/**
 * ──────────────────────────────────────────────
 * Type Exports
 * ──────────────────────────────────────────────
 */

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type SnapshotData = z.infer<typeof snapshotDataSchema>;
export type GainerEntry = z.infer<typeof gainerEntrySchema>;
export type TopGainers = z.infer<typeof topGainersSchema>;