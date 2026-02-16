// Unit tests for leaderboard sorting logic
import { sortLeaderboard, LeaderboardEntry } from '../leaderboard-sort'

describe('sortLeaderboard', () => {
  it('should sort by rankingPoints in descending order', () => {
    const entries: LeaderboardEntry[] = [
      { username: 'user1', rankingPoints: 100, ranking: 1000 },
      { username: 'user2', rankingPoints: 200, ranking: 500 },
      { username: 'user3', rankingPoints: 150, ranking: 750 },
    ]
    
    const sorted = sortLeaderboard(entries)
    
    expect(sorted[0].username).toBe('user2')
    expect(sorted[1].username).toBe('user3')
    expect(sorted[2].username).toBe('user1')
  })

  it('should use ranking as tie-breaker when rankingPoints are equal', () => {
    const entries: LeaderboardEntry[] = [
      { username: 'user1', rankingPoints: 100, ranking: 3000 },
      { username: 'user2', rankingPoints: 100, ranking: 1000 },
      { username: 'user3', rankingPoints: 100, ranking: 2000 },
    ]
    
    const sorted = sortLeaderboard(entries)
    
    expect(sorted[0].ranking).toBe(1000)
    expect(sorted[1].ranking).toBe(2000)
    expect(sorted[2].ranking).toBe(3000)
  })

  it('should use username as final tie-breaker alphabetically', () => {
    const entries: LeaderboardEntry[] = [
      { username: 'charlie', rankingPoints: 100, ranking: 1000 },
      { username: 'alice', rankingPoints: 100, ranking: 1000 },
      { username: 'bob', rankingPoints: 100, ranking: 1000 },
    ]
    
    const sorted = sortLeaderboard(entries)
    
    expect(sorted[0].username).toBe('alice')
    expect(sorted[1].username).toBe('bob')
    expect(sorted[2].username).toBe('charlie')
  })

  it('should handle empty array', () => {
    const entries: LeaderboardEntry[] = []
    const sorted = sortLeaderboard(entries)
    expect(sorted).toEqual([])
  })

  it('should handle single entry', () => {
    const entries: LeaderboardEntry[] = [
      { username: 'user1', rankingPoints: 100, ranking: 1000 },
    ]
    
    const sorted = sortLeaderboard(entries)
    
    expect(sorted).toHaveLength(1)
    expect(sorted[0].username).toBe('user1')
  })

  it('should apply all sorting rules correctly in complex scenario', () => {
    const entries: LeaderboardEntry[] = [
      { username: 'zara', rankingPoints: 200, ranking: 500 },
      { username: 'alice', rankingPoints: 200, ranking: 600 },
      { username: 'bob', rankingPoints: 200, ranking: 500 },
      { username: 'charlie', rankingPoints: 150, ranking: 400 },
      { username: 'dave', rankingPoints: 250, ranking: 300 },
    ]
    
    const sorted = sortLeaderboard(entries)
    
    // dave (250 points)
    // bob (200 points, ranking 500, alphabetically first)
    // zara (200 points, ranking 500, alphabetically second)
    // alice (200 points, ranking 600)
    // charlie (150 points)
    expect(sorted[0].username).toBe('dave')
    expect(sorted[1].username).toBe('bob')
    expect(sorted[2].username).toBe('zara')
    expect(sorted[3].username).toBe('alice')
    expect(sorted[4].username).toBe('charlie')
  })
})
