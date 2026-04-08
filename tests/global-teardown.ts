import { testDb } from "./fixtures/db";

/**
 * Safety-net cleanup that runs after all tests complete.
 * Removes any orphaned test data in case individual test cleanup failed.
 */
export default async function globalTeardown() {
  try {
    // Delete all test users (identifiable by @e2e.local email pattern)
    const testUsers = await testDb.user.findMany({
      where: { email: { endsWith: "@e2e.local" } },
      select: { id: true, email: true },
    });

    for (const user of testUsers) {
      // Delete orgs where user is the only member
      const memberships = await testDb.membership.findMany({
        where: { userId: user.id },
        select: { organizationId: true },
      });

      for (const m of memberships) {
        const memberCount = await testDb.membership.count({
          where: { organizationId: m.organizationId },
        });
        if (memberCount === 1) {
          await testDb.organization.delete({
            where: { id: m.organizationId },
          }).catch(() => {});
        }
      }

      await testDb.user.delete({ where: { id: user.id } }).catch(() => {});
    }

    // Clean up orphaned verification records
    await testDb.verification.deleteMany({
      where: { identifier: { contains: "@e2e.local" } },
    });
  } finally {
    await testDb.$disconnect();
  }
}
