/**
 * @jest-environment node
 */
// Database integration tests for GroupMember operations
import {
  getPrismaTestClient,
  cleanupTestData,
  createTestUser,
  createTestGroup,
  createTestProfile,
} from '../db-test-helpers'

const prisma = getPrismaTestClient()

describe('Database Integration - Group Members', () => {
  beforeEach(async () => {
    await cleanupTestData(prisma)
  })

  afterAll(async () => {
    await cleanupTestData(prisma)
    await prisma.$disconnect()
  })

  describe('LeetCode Profile Operations', () => {
    it('should create a LeetCode profile', async () => {
      const profile = await prisma.leetcodeProfile.create({
        data: {
          username: 'leetcode_user',
        },
      })

      expect(profile).toBeDefined()
      expect(profile.id).toBeGreaterThan(0)
      expect(profile.username).toBe('leetcode_user')
      expect(profile.createdAt).toBeInstanceOf(Date)
    })

    it('should not allow duplicate usernames', async () => {
      await createTestProfile(prisma, 'uniqueuser')

      await expect(
        createTestProfile(prisma, 'uniqueuser')
      ).rejects.toThrow()
    })

    it('should find profile by username', async () => {
      await createTestProfile(prisma, 'findme')

      const profile = await prisma.leetcodeProfile.findUnique({
        where: { username: 'findme' },
      })

      expect(profile).toBeDefined()
      expect(profile?.username).toBe('findme')
    })
  })

  describe('GroupMember Operations', () => {
    it('should add a member to a group', async () => {
      const user = await createTestUser(prisma)
      const group = await createTestGroup(prisma, user.id)
      const profile = await createTestProfile(prisma, 'member1')

      const member = await prisma.groupMember.create({
        data: {
          groupId: group.id,
          leetcodeProfileId: profile.id,
        },
      })

      expect(member).toBeDefined()
      expect(member.groupId).toBe(group.id)
      expect(member.leetcodeProfileId).toBe(profile.id)
    })

    it('should not allow duplicate members in same group', async () => {
      const user = await createTestUser(prisma)
      const group = await createTestGroup(prisma, user.id)
      const profile = await createTestProfile(prisma)

      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          leetcodeProfileId: profile.id,
        },
      })

      await expect(
        prisma.groupMember.create({
          data: {
            groupId: group.id,
            leetcodeProfileId: profile.id,
          },
        })
      ).rejects.toThrow()
    })

    it('should allow same profile in different groups', async () => {
      const user = await createTestUser(prisma)
      const group1 = await createTestGroup(prisma, user.id, 'Group 1')
      const group2 = await createTestGroup(prisma, user.id, 'Group 2')
      const profile = await createTestProfile(prisma)

      const member1 = await prisma.groupMember.create({
        data: {
          groupId: group1.id,
          leetcodeProfileId: profile.id,
        },
      })

      const member2 = await prisma.groupMember.create({
        data: {
          groupId: group2.id,
          leetcodeProfileId: profile.id,
        },
      })

      expect(member1.leetcodeProfileId).toBe(member2.leetcodeProfileId)
      expect(member1.groupId).not.toBe(member2.groupId)
    })

    it('should load group with all members', async () => {
      const user = await createTestUser(prisma)
      const group = await createTestGroup(prisma, user.id)
      const profile1 = await createTestProfile(prisma, 'member1')
      const profile2 = await createTestProfile(prisma, 'member2')
      const profile3 = await createTestProfile(prisma, 'member3')

      await prisma.groupMember.create({
        data: { groupId: group.id, leetcodeProfileId: profile1.id },
      })
      await prisma.groupMember.create({
        data: { groupId: group.id, leetcodeProfileId: profile2.id },
      })
      await prisma.groupMember.create({
        data: { groupId: group.id, leetcodeProfileId: profile3.id },
      })

      const groupWithMembers = await prisma.group.findUnique({
        where: { id: group.id },
        include: {
          members: {
            include: {
              leetcodeProfile: true,
            },
          },
        },
      })

      expect(groupWithMembers?.members).toHaveLength(3)
      expect(groupWithMembers?.members.map(m => m.leetcodeProfile.username)).toContain('member1')
      expect(groupWithMembers?.members.map(m => m.leetcodeProfile.username)).toContain('member2')
      expect(groupWithMembers?.members.map(m => m.leetcodeProfile.username)).toContain('member3')
    })

    it('should remove a member from a group', async () => {
      const user = await createTestUser(prisma)
      const group = await createTestGroup(prisma, user.id)
      const profile = await createTestProfile(prisma)

      const member = await prisma.groupMember.create({
        data: {
          groupId: group.id,
          leetcodeProfileId: profile.id,
        },
      })

      await prisma.groupMember.delete({
        where: { id: member.id },
      })

      const found = await prisma.groupMember.findUnique({
        where: { id: member.id },
      })

      expect(found).toBeNull()
    })

    it('should cascade delete members when group is deleted', async () => {
      const user = await createTestUser(prisma)
      const group = await createTestGroup(prisma, user.id)
      const profile = await createTestProfile(prisma)

      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          leetcodeProfileId: profile.id,
        },
      })

      await prisma.group.delete({
        where: { id: group.id },
      })

      const members = await prisma.groupMember.findMany({
        where: { groupId: group.id },
      })

      expect(members).toHaveLength(0)
    })

    it('should cascade delete members when profile is deleted', async () => {
      const user = await createTestUser(prisma)
      const group = await createTestGroup(prisma, user.id)
      const profile = await createTestProfile(prisma)

      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          leetcodeProfileId: profile.id,
        },
      })

      await prisma.leetcodeProfile.delete({
        where: { id: profile.id },
      })

      const members = await prisma.groupMember.findMany({
        where: { leetcodeProfileId: profile.id },
      })

      expect(members).toHaveLength(0)
    })

    it('should count members in a group', async () => {
      const user = await createTestUser(prisma)
      const group = await createTestGroup(prisma, user.id)

      for (let i = 1; i <= 5; i++) {
        const profile = await createTestProfile(prisma, `user${i}`)
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            leetcodeProfileId: profile.id,
          },
        })
      }

      const count = await prisma.groupMember.count({
        where: { groupId: group.id },
      })

      expect(count).toBe(5)
    })
  })

  describe('Complex Member Queries', () => {
    it('should find all groups a profile belongs to', async () => {
      const user = await createTestUser(prisma)
      const group1 = await createTestGroup(prisma, user.id, 'Group A')
      const group2 = await createTestGroup(prisma, user.id, 'Group B')
      await createTestGroup(prisma, user.id, 'Group C') // Not joined
      const profile = await createTestProfile(prisma, 'activeuser')

      await prisma.groupMember.create({
        data: { groupId: group1.id, leetcodeProfileId: profile.id },
      })
      await prisma.groupMember.create({
        data: { groupId: group2.id, leetcodeProfileId: profile.id },
      })

      const memberships = await prisma.groupMember.findMany({
        where: { leetcodeProfileId: profile.id },
        include: { group: true },
      })

      expect(memberships).toHaveLength(2)
      expect(memberships.map(m => m.group.name)).toContain('Group A')
      expect(memberships.map(m => m.group.name)).toContain('Group B')
    })
  })
})
