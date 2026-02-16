/**
 * @jest-environment node
 */
// Database integration tests for DailyStat operations
import { calculateRankingPoints } from '@/lib/scoring'
import {
  getPrismaTestClient,
  cleanupTestData,
  createTestProfile,
} from '../db-test-helpers'

const prisma = getPrismaTestClient()

describe('Database Integration - DailyStat', () => {
  beforeEach(async () => {
    await cleanupTestData(prisma)
  })

  afterAll(async () => {
    await cleanupTestData(prisma)
    await prisma.$disconnect()
  })

  describe('DailyStat CRUD Operations', () => {
    it('should create daily stat for a profile', async () => {
      const profile = await createTestProfile(prisma, 'statsuser')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const stat = await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: today,
          totalSolved: 100,
          easySolved: 40,
          mediumSolved: 40,
          hardSolved: 20,
          ranking: 50000,
          rankingPoints: calculateRankingPoints({
            totalSolved: 100,
            easySolved: 40,
            mediumSolved: 40,
            hardSolved: 20,
            ranking: 50000,
          }),
        },
      })

      expect(stat).toBeDefined()
      expect(stat.totalSolved).toBe(100)
      expect(stat.easySolved).toBe(40)
      expect(stat.mediumSolved).toBe(40)
      expect(stat.hardSolved).toBe(20)
      expect(stat.ranking).toBe(50000)
      expect(stat.rankingPoints).toBeGreaterThan(0)
    })

    it('should not allow duplicate stats for same profile and date', async () => {
      const profile = await createTestProfile(prisma)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: today,
          totalSolved: 50,
          rankingPoints: 500,
        },
      })

      await expect(
        prisma.dailyStat.create({
          data: {
            leetcodeProfileId: profile.id,
            date: today,
            totalSolved: 51,
            rankingPoints: 510,
          },
        })
      ).rejects.toThrow()
    })

    it('should allow stats for same profile on different dates', async () => {
      const profile = await createTestProfile(prisma)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const stat1 = await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: today,
          totalSolved: 100,
          rankingPoints: 1000,
        },
      })

      const stat2 = await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: yesterday,
          totalSolved: 99,
          rankingPoints: 990,
        },
      })

      expect(stat1.leetcodeProfileId).toBe(stat2.leetcodeProfileId)
      expect(stat1.date).not.toEqual(stat2.date)
    })

    it('should update daily stat', async () => {
      const profile = await createTestProfile(prisma)
      const today = new Date()

      const stat = await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: today,
          totalSolved: 100,
          easySolved: 40,
          mediumSolved: 40,
          hardSolved: 20,
          rankingPoints: 1000,
        },
      })

      const updated = await prisma.dailyStat.update({
        where: { id: stat.id },
        data: {
          totalSolved: 101,
          easySolved: 41,
          rankingPoints: 1010,
        },
      })

      expect(updated.totalSolved).toBe(101)
      expect(updated.easySolved).toBe(41)
      expect(updated.mediumSolved).toBe(40)
      expect(updated.rankingPoints).toBe(1010)
    })

    it('should delete daily stat', async () => {
      const profile = await createTestProfile(prisma)
      const today = new Date()

      const stat = await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: today,
          totalSolved: 100,
          rankingPoints: 1000,
        },
      })

      await prisma.dailyStat.delete({
        where: { id: stat.id },
      })

      const found = await prisma.dailyStat.findUnique({
        where: { id: stat.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('DailyStat Queries', () => {
    it('should get all stats for a profile', async () => {
      const profile = await createTestProfile(prisma, 'multistat')
      const today = new Date()

      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        await prisma.dailyStat.create({
          data: {
            leetcodeProfileId: profile.id,
            date: date,
            totalSolved: 100 + i,
            rankingPoints: 1000 + i * 10,
          },
        })
      }

      const stats = await prisma.dailyStat.findMany({
        where: { leetcodeProfileId: profile.id },
        orderBy: { date: 'desc' },
      })

      expect(stats).toHaveLength(7)
      expect(stats[0].totalSolved).toBe(100) // Most recent
      expect(stats[6].totalSolved).toBe(106) // Oldest
    })

    it('should get stats for a specific date range', async () => {
      const profile = await createTestProfile(prisma)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const fourteenDaysAgo = new Date(today)
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

      await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: today,
          totalSolved: 100,
          rankingPoints: 1000,
        },
      })

      await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: sevenDaysAgo,
          totalSolved: 95,
          rankingPoints: 950,
        },
      })

      await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: fourteenDaysAgo,
          totalSolved: 90,
          rankingPoints: 900,
        },
      })

      const recentStats = await prisma.dailyStat.findMany({
        where: {
          leetcodeProfileId: profile.id,
          date: {
            gte: sevenDaysAgo,
          },
        },
      })

      expect(recentStats).toHaveLength(2)
    })

    it('should calculate progress between dates', async () => {
      const profile = await createTestProfile(prisma, 'progress')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: yesterday,
          totalSolved: 95,
          easySolved: 40,
          mediumSolved: 35,
          hardSolved: 20,
          rankingPoints: 950,
        },
      })

      await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: today,
          totalSolved: 100,
          easySolved: 42,
          mediumSolved: 36,
          hardSolved: 22,
          rankingPoints: 1000,
        },
      })

      const stats = await prisma.dailyStat.findMany({
        where: { leetcodeProfileId: profile.id },
        orderBy: { date: 'asc' },
      })

      const progress = {
        totalSolved: stats[1].totalSolved - stats[0].totalSolved,
        easySolved: stats[1].easySolved - stats[0].easySolved,
        mediumSolved: stats[1].mediumSolved - stats[0].mediumSolved,
        hardSolved: stats[1].hardSolved - stats[0].hardSolved,
        rankingPoints: stats[1].rankingPoints - stats[0].rankingPoints,
      }

      expect(progress.totalSolved).toBe(5)
      expect(progress.easySolved).toBe(2)
      expect(progress.mediumSolved).toBe(1)
      expect(progress.hardSolved).toBe(2)
      expect(progress.rankingPoints).toBe(50)
    })

    it('should cascade delete stats when profile is deleted', async () => {
      const profile = await createTestProfile(prisma)
      const today = new Date()

      await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: today,
          totalSolved: 100,
          rankingPoints: 1000,
        },
      })

      await prisma.leetcodeProfile.delete({
        where: { id: profile.id },
      })

      const stats = await prisma.dailyStat.findMany({
        where: { leetcodeProfileId: profile.id },
      })

      expect(stats).toHaveLength(0)
    })

    it('should load stats with profile information', async () => {
      const profile = await createTestProfile(prisma, 'withinfo')
      const today = new Date()

      await prisma.dailyStat.create({
        data: {
          leetcodeProfileId: profile.id,
          date: today,
          totalSolved: 100,
          rankingPoints: 1000,
        },
      })

      const stat = await prisma.dailyStat.findFirst({
        where: { leetcodeProfileId: profile.id },
        include: { leetcodeProfile: true },
      })

      expect(stat?.leetcodeProfile).toBeDefined()
      expect(stat?.leetcodeProfile.username).toBe('withinfo')
    })
  })

  describe('Contest Rating and Advanced Stats', () => {
    it('should track contest rating changes', async () => {
      const profile = await createTestProfile(prisma, 'contestant')
      const dates = [0, 1, 2, 3].map(i => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        return date
      })

      const ratings = [1500, 1550, 1525, 1600]

      for (let i = 0; i < dates.length; i++) {
        await prisma.dailyStat.create({
          data: {
            leetcodeProfileId: profile.id,
            date: dates[i],
            totalSolved: 100 + i,
            contestRating: ratings[i],
            rankingPoints: 1000 + i * 50,
          },
        })
      }

      const stats = await prisma.dailyStat.findMany({
        where: { leetcodeProfileId: profile.id },
        orderBy: { date: 'desc' },
      })

      expect(stats[0].contestRating).toBe(1500)
      expect(stats[3].contestRating).toBe(1600)
    })
  })
})
