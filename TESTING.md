# Testing Documentation

## Overview

This project uses Jest and React Testing Library for testing. Tests are organized into unit tests and integration tests.

## Test Scripts

- `npm test` - Run all unit tests and API integration tests
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run all integration tests (API + database)
- `npm run test:db` - Run only database integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Test Structure

### Unit Tests
Located in `src/lib/__tests__/`

- **scoring.test.ts** - Tests for the ranking points calculation
- **leaderboard-sort.test.ts** - Tests for leaderboard sorting logic  
- **utils.test.ts** - Tests for utility functions (className merging)

### Integration Tests

#### API Integration Tests
- **validation.integration.test.ts** - Tests for username validation flow
- **leetcode.integration.test.ts** - Tests for LeetCode API integration with mocked responses

#### Database Integration Tests
Located in `src/lib/__tests__/`

- **db-user-group.integration.test.ts** - Tests for User and Group database operations
- **db-members.integration.test.ts** - Tests for GroupMember and LeetCode Profile operations
- **db-dailystat.integration.test.ts** - Tests for DailyStat tracking and queries

**Note:** Database integration tests are skipped by default in `npm test`. They require:
- A valid `DATABASE_URL` environment variable
- Access to a PostgreSQL database
- Prisma schema to be generated

To run database tests:
```bash
# Make sure DATABASE_URL is set
export DATABASE_URL="postgresql://..."

# Run database tests
npm run test:db
```

## Running Tests

```bash
# Run all unit and API integration tests (default)
npm test

# Run only unit tests
npm run test:unit

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run database integration tests (requires database setup)
npm run test:db
```

## Test Coverage

Current test coverage includes:
- ✅ Utility functions (scoring, sorting, classnames)
- ✅ Username validation (format and normalization)
- ✅ LeetCode API integration (with retry logic and error handling)
- ✅ Database operations (User, Group, GroupMember, LeetCodeProfile, DailyStat)

## Adding New Tests

1. Create test files with `.test.ts` or `.test.tsx` extension
2. Place unit tests in `__tests__` folder next to the code being tested
3. Place integration tests in feature-specific directories
4. Use descriptive test names that explain the expected behavior

### Unit Test Example:
```typescript
describe('MyFeature', () => {
  it('should do something specific', () => {
    // Test implementation
  })
})
```

### Database Integration Test Example:
```typescript
/**
 * @jest-environment node
 */
import { getPrismaTestClient, cleanupTestData } from '@/lib/db-test-helpers'

const prisma = getPrismaTestClient()

describe('Database Operations', () => {
  beforeEach(async () => {
    await cleanupTestData(prisma)
  })

  afterAll(async () => {
    await cleanupTestData(prisma)
    await prisma.$disconnect()
  })

  it('should create a record', async () => {
    // Your test here
  })
})
```

## Test Helpers

Database test helpers are available in `src/lib/db-test-helpers.ts`:
- `getPrismaTestClient()` - Get a Prisma client instance for tests
- `cleanupTestData(prisma)` - Clean up all test data
- `createTestUser(prisma, email, name)` - Create a test user
- `createTestGroup(prisma, ownerId, name)` - Create a test group
- `createTestProfile(prisma, username)` - Create a test LeetCode profile

