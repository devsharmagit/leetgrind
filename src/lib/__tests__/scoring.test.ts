// Unit tests for scoring calculation
import { calculateRankingPoints } from '../scoring'

describe('calculateRankingPoints', () => {
  it('should calculate points correctly for basic stats', () => {
    const stats = {
      totalSolved: 100,
      easySolved: 40,
      mediumSolved: 40,
      hardSolved: 20,
      ranking: 100000,
    }
    const points = calculateRankingPoints(stats)
    
    // Expected: 100*10 + 40*1 + 40*3 + 20*5 + (5000000-100000)/1000
    // = 1000 + 40 + 120 + 100 + 4900 = 6160
    expect(points).toBe(6160)
  })

  it('should handle zero values', () => {
    const stats = {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: 100000,
    }
    const points = calculateRankingPoints(stats)
    expect(points).toBeGreaterThanOrEqual(0)
  })

  it('should handle high ranking (poor performance)', () => {
    const stats = {
      totalSolved: 50,
      easySolved: 20,
      mediumSolved: 20,
      hardSolved: 10,
      ranking: 8000000,
    }
    const points = calculateRankingPoints(stats)
    
    // Ranking bonus should be 0 when ranking > 5000000
    // Expected: 50*10 + 20*1 + 20*3 + 10*5 = 500 + 20 + 60 + 50 = 630
    expect(points).toBe(630)
  })

  it('should handle low ranking (excellent performance)', () => {
    const stats = {
      totalSolved: 500,
      easySolved: 200,
      mediumSolved: 200,
      hardSolved: 100,
      ranking: 1000,
    }
    const points = calculateRankingPoints(stats)
    
    // Expected: 500*10 + 200*1 + 200*3 + 100*5 + (5000000-1000)/1000
    // = 5000 + 200 + 600 + 500 + 4999 = 11299
    expect(points).toBe(11299)
  })

  it('should return non-negative values', () => {
    const stats = {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: 10000000,
    }
    const points = calculateRankingPoints(stats)
    expect(points).toBeGreaterThanOrEqual(0)
  })

  it('should round the result', () => {
    const stats = {
      totalSolved: 1,
      easySolved: 1,
      mediumSolved: 0,
      hardSolved: 0,
      ranking: 9999,
    }
    const points = calculateRankingPoints(stats)
    expect(Number.isInteger(points)).toBe(true)
  })
})
