import { randomUUID } from "crypto";
import { hashPassword } from "better-auth/crypto";
import { testDb } from "./db";

interface CreateTestUserOptions {
  name?: string;
  email?: string;
  password?: string;
  emailVerified?: boolean;
  onboardingComplete?: boolean;
}

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface TestUserWithOrg {
  user: TestUser;
  organization: { id: string; name: string; slug: string };
}

/**
 * Creates a test user with a credential account in the database.
 * Returns the user record with the plaintext password for sign-in tests.
 */
export async function createTestUser(
  options: CreateTestUserOptions = {}
): Promise<TestUser> {
  const uid = randomUUID().slice(0, 8);
  const name = options.name ?? `Test User ${uid}`;
  const email = options.email ?? `test-${uid}@e2e.local`;
  const password = options.password ?? "TestPass123!";
  const hashedPassword = await hashPassword(password);

  const user = await testDb.user.create({
    data: {
      name,
      email,
      emailVerified: options.emailVerified ?? false,
      onboardingComplete: options.onboardingComplete ?? false,
    },
  });

  await testDb.account.create({
    data: {
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: hashedPassword,
    },
  });

  return { id: user.id, name, email, password };
}

/**
 * Creates a verified test user (email verified, ready for onboarding).
 */
export async function createVerifiedUser(
  options: CreateTestUserOptions = {}
): Promise<TestUser> {
  return createTestUser({ ...options, emailVerified: true });
}

/**
 * Creates a verified user with an organization and owner membership.
 * Returns the user and organization details.
 */
export async function createUserWithOrg(
  options: CreateTestUserOptions & { orgName?: string } = {}
) {
  const user = await createTestUser({
    ...options,
    emailVerified: true,
    onboardingComplete: true,
  });

  const orgName = options.orgName ?? `Test Org ${randomUUID().slice(0, 8)}`;
  const slug = orgName.toLowerCase().replace(/\s+/g, "-");

  const organization = await testDb.organization.create({
    data: { name: orgName, slug },
  });

  await testDb.membership.create({
    data: {
      role: "owner",
      userId: user.id,
      organizationId: organization.id,
    },
  });

  await testDb.user.update({
    where: { id: user.id },
    data: { activeOrganizationId: organization.id },
  });

  return { user, organization: { id: organization.id, name: orgName, slug } };
}

/**
 * Generates a unique email address for test isolation.
 */
export function uniqueEmail(): string {
  return `test-${randomUUID().slice(0, 8)}@e2e.local`;
}

/**
 * Deletes a test user and all cascaded records (sessions, accounts, memberships, etc.).
 */
export async function cleanupUser(email: string): Promise<void> {
  const user = await testDb.user.findUnique({ where: { email } });
  if (!user) return;

  // Delete orgs where user is the only member (test orgs)
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
      });
    }
  }

  // Cascade deletes sessions, accounts, memberships, etc.
  await testDb.user.delete({ where: { id: user.id } });
}

/**
 * Cleans up any verification records for an email (OTP codes and password reset tokens).
 */
export async function cleanupVerifications(email: string): Promise<void> {
  const user = await testDb.user.findUnique({
    where: { email },
    select: { id: true },
  });

  await testDb.verification.deleteMany({
    where: {
      OR: [
        { identifier: { contains: email } },
        ...(user ? [{ identifier: `password-reset:${user.id}` }] : []),
      ],
    },
  });
}
