import { PrismaClient } from "../generated/prisma/index.js";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

const EMAIL = process.env.SEED_EMAIL ?? "employee@example.com";
const PASSWORD = process.env.SEED_PASSWORD ?? "Password123!";
const NAME = process.env.SEED_NAME ?? "Test Employee";
const ORG_SLUG = process.env.SEED_ORG_SLUG ?? "lawrences";
const PROJECT_SLUG = process.env.SEED_PROJECT_SLUG ?? "cats";
const ROLE = process.env.SEED_ROLE ?? "member";

const db = new PrismaClient();

async function main() {
  const org = await db.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (!org) throw new Error(`Organization '${ORG_SLUG}' not found`);

  const project = await db.project.findFirst({
    where: { slug: PROJECT_SLUG, organizationId: org.id },
  });
  if (!project) throw new Error(`Project '${PROJECT_SLUG}' not found in '${ORG_SLUG}'`);

  const existing = await db.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log(`User ${EMAIL} already exists (id=${existing.id})`);
    return;
  }

  const hashed = await hashPassword(PASSWORD);
  const userId = randomUUID();
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        id: userId,
        email: EMAIL,
        name: NAME,
        emailVerified: true,
        onboardingComplete: true,
        activeOrganizationId: org.id,
        activeProjectId: project.id,
        createdAt: now,
        updatedAt: now,
      },
    });

    await tx.account.create({
      data: {
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: hashed,
        createdAt: now,
        updatedAt: now,
      },
    });

    await tx.membership.create({
      data: {
        userId,
        organizationId: org.id,
        role: ROLE,
      },
    });

    await tx.projectMember.create({
      data: {
        userId,
        projectId: project.id,
        role: ROLE,
      },
    });
  });

  console.log(JSON.stringify({
    ok: true,
    email: EMAIL,
    password: PASSWORD,
    userId,
    organization: { id: org.id, slug: org.slug, name: org.name },
    project: { id: project.id, slug: project.slug, name: project.name },
    role: ROLE,
  }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
