/**
 * @jest-environment node
 */
// Database test helpers
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

// Create a singleton PrismaClient for tests
let prisma: PrismaClient

export function getPrismaTestClient() {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not defined')
    }

    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
      log: ['error'],
    })
  }
  return prisma
}

// Cleanup helper to clear test data
export async function cleanupTestData(prisma: PrismaClient) {
  // Delete in correct order to respect foreign key constraints
  await prisma.leaderboardSnapshot.deleteMany({})
  await prisma.dailyStat.deleteMany({})
  await prisma.groupMember.deleteMany({})
  await prisma.group.deleteMany({})
  await prisma.leetcodeProfile.deleteMany({})
  await prisma.user.deleteMany({})
}

// Helper to create test user
export async function createTestUser(
  prisma: PrismaClient,
  email = 'test@example.com',
  name = 'Test User'
) {
  return await prisma.user.create({
    data: { email, name },
  })
}

// Helper to create test group
export async function createTestGroup(
  prisma: PrismaClient,
  ownerId: number,
  name = 'Test Group'
) {
  return await prisma.group.create({
    data: {
      name,
      ownerId,
    },
  })
}

// Helper to create test LeetCode profile
export async function createTestProfile(
  prisma: PrismaClient,
  username = 'testuser'
) {
  return await prisma.leetcodeProfile.create({
    data: { username },
  })
}
