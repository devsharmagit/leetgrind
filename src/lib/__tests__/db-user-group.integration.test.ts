/**
 * @jest-environment node
 */
// Database integration tests for User and Group models
import { getPrismaTestClient, cleanupTestData, createTestUser, createTestGroup } from '../db-test-helpers'

const prisma = getPrismaTestClient()

describe('Database Integration - User & Group', () => {
  // Clean up before and after each test
  beforeEach(async () => {
    await cleanupTestData(prisma)
  })

  afterAll(async () => {
    await cleanupTestData(prisma)
    await prisma.$disconnect()
  })

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'john@example.com',
          name: 'John Doe',
        },
      })

      expect(user).toBeDefined()
      expect(user.id).toBeGreaterThan(0)
      expect(user.email).toBe('john@example.com')
      expect(user.name).toBe('John Doe')
      expect(user.createdAt).toBeInstanceOf(Date)
    })

    it('should find user by email', async () => {
      await createTestUser(prisma, 'find@example.com', 'Find Me')

      const user = await prisma.user.findUnique({
        where: { email: 'find@example.com' },
      })

      expect(user).toBeDefined()
      expect(user?.name).toBe('Find Me')
    })

    it('should not allow duplicate emails', async () => {
      await createTestUser(prisma, 'duplicate@example.com')

      await expect(
        prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            name: 'Another User',
          },
        })
      ).rejects.toThrow()
    })

    it('should update user information', async () => {
      const user = await createTestUser(prisma, 'update@example.com', 'Old Name')

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: 'New Name' },
      })

      expect(updated.name).toBe('New Name')
      expect(updated.email).toBe('update@example.com')
    })

    it('should delete user', async () => {
      const user = await createTestUser(prisma, 'delete@example.com')

      await prisma.user.delete({
        where: { id: user.id },
      })

      const found = await prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(found).toBeNull()
    })
  })

  describe('Group Operations', () => {
    it('should create a new group', async () => {
      const user = await createTestUser(prisma)

      const group = await prisma.group.create({
        data: {
          name: 'My Group',
          ownerId: user.id,
        },
      })

      expect(group).toBeDefined()
      expect(group.id).toBeGreaterThan(0)
      expect(group.name).toBe('My Group')
      expect(group.ownerId).toBe(user.id)
      expect(group.publicId).toBeDefined()
      expect(group.visibility).toBe('UNLISTED')
    })

    it('should generate unique publicId for each group', async () => {
      const user = await createTestUser(prisma)

      const group1 = await createTestGroup(prisma, user.id, 'Group 1')
      const group2 = await createTestGroup(prisma, user.id, 'Group 2')

      expect(group1.publicId).not.toBe(group2.publicId)
    })

    it('should find group by publicId', async () => {
      const user = await createTestUser(prisma)
      const group = await createTestGroup(prisma, user.id, 'Find Me')

      const found = await prisma.group.findUnique({
        where: { publicId: group.publicId },
      })

      expect(found).toBeDefined()
      expect(found?.name).toBe('Find Me')
    })

    it('should load group with owner', async () => {
      const user = await createTestUser(prisma, 'owner@example.com', 'Owner')
      const group = await createTestGroup(prisma, user.id, 'With Owner')

      const groupWithOwner = await prisma.group.findUnique({
        where: { id: group.id },
        include: { owner: true },
      })

      expect(groupWithOwner?.owner).toBeDefined()
      expect(groupWithOwner?.owner.email).toBe('owner@example.com')
      expect(groupWithOwner?.owner.name).toBe('Owner')
    })

    it('should cascade delete group when user is deleted', async () => {
      const user = await createTestUser(prisma)
      const group = await createTestGroup(prisma, user.id)

      await prisma.user.delete({
        where: { id: user.id },
      })

      const found = await prisma.group.findUnique({
        where: { id: group.id },
      })

      expect(found).toBeNull()
    })

    it('should list all groups for a user', async () => {
      const user = await createTestUser(prisma)
      await createTestGroup(prisma, user.id, 'Group 1')
      await createTestGroup(prisma, user.id, 'Group 2')
      await createTestGroup(prisma, user.id, 'Group 3')

      const groups = await prisma.group.findMany({
        where: { ownerId: user.id },
      })

      expect(groups).toHaveLength(3)
      expect(groups.map(g => g.name)).toContain('Group 1')
      expect(groups.map(g => g.name)).toContain('Group 2')
      expect(groups.map(g => g.name)).toContain('Group 3')
    })
  })

  describe('User-Group Relationships', () => {
    it('should query user with all their groups', async () => {
      const user = await createTestUser(prisma, 'multi@example.com')
      await createTestGroup(prisma, user.id, 'Group A')
      await createTestGroup(prisma, user.id, 'Group B')

      const userWithGroups = await prisma.user.findUnique({
        where: { email: 'multi@example.com' },
        include: { ownedGroups: true },
      })

      expect(userWithGroups?.ownedGroups).toHaveLength(2)
    })

    it('should handle multiple users with multiple groups', async () => {
      const user1 = await createTestUser(prisma, 'user1@example.com', 'User 1')
      const user2 = await createTestUser(prisma, 'user2@example.com', 'User 2')

      await createTestGroup(prisma, user1.id, 'User1 Group1')
      await createTestGroup(prisma, user1.id, 'User1 Group2')
      await createTestGroup(prisma, user2.id, 'User2 Group1')

      const allGroups = await prisma.group.findMany({
        include: { owner: true },
      })

      expect(allGroups).toHaveLength(3)
      expect(allGroups.filter(g => g.owner.email === 'user1@example.com')).toHaveLength(2)
      expect(allGroups.filter(g => g.owner.email === 'user2@example.com')).toHaveLength(1)
    })
  })
})
