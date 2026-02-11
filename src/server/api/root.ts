import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { onboardingRouter } from "~/server/api/routers/onboarding";
import { userRouter } from "~/server/api/routers/user";
import { organizationRouter } from "~/server/api/routers/organization";
import { invitationRouter } from "~/server/api/routers/invitation";
import { memberRouter } from "~/server/api/routers/member";
import { projectRouter } from "~/server/api/routers/project";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  onboarding: onboardingRouter,
  user: userRouter,
  organization: organizationRouter,
  invitation: invitationRouter,
  member: memberRouter,
  project: projectRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.example.hello();
 */
export const createCaller = createCallerFactory(appRouter);
