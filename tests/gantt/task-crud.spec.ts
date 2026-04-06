import { test, expect, signInTestUser } from "../fixtures";

test.describe("Gantt Task CRUD", () => {
  test("can add a task to an empty project", async ({
    userWithOrg,
    page,
    projectCreatePage,
    ganttPage,
  }) => {
    // Sign in and navigate to the org dashboard
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);
    await page.waitForLoadState("networkidle");

    // Create a fresh project via UI
    const projectSlug = await projectCreatePage.createProject("CRUD Test Project");

    // Navigate to the new project's Gantt view
    await ganttPage.goto(userWithOrg.organization.slug, projectSlug);

    // Add a task
    await ganttPage.addTask();

    // Verify task appears
    const count = await ganttPage.getTaskCount();
    expect(count).toBeGreaterThanOrEqual(1);

    const taskName = await ganttPage.getTaskName(0);
    expect(taskName).toBe("New Task");
  });

  test("can rename a task", async ({
    userWithOrg,
    page,
    projectCreatePage,
    ganttPage,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);
    await page.waitForLoadState("networkidle");

    const projectSlug = await projectCreatePage.createProject("Rename Test Project");
    await ganttPage.goto(userWithOrg.organization.slug, projectSlug);

    // Add a task and rename it
    await ganttPage.addTask();
    await ganttPage.editTaskName(0, "Foundation Work");

    const taskName = await ganttPage.getTaskName(0);
    expect(taskName).toBe("Foundation Work");
  });

  test("can delete a task", async ({
    userWithOrg,
    page,
    projectCreatePage,
    ganttPage,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);
    await page.waitForLoadState("networkidle");

    const projectSlug = await projectCreatePage.createProject("Delete Test Project");
    await ganttPage.goto(userWithOrg.organization.slug, projectSlug);

    // Add a task then delete it
    await ganttPage.addTask();
    expect(await ganttPage.getTaskCount()).toBeGreaterThanOrEqual(1);

    await ganttPage.deleteTaskViaMenu(0);

    const count = await ganttPage.getTaskCount();
    expect(count).toBe(0);
  });

  test("task persists after page reload", async ({
    userWithOrg,
    page,
    projectCreatePage,
    ganttPage,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);
    await page.waitForLoadState("networkidle");

    const projectSlug = await projectCreatePage.createProject("Persist Test Project");
    await ganttPage.goto(userWithOrg.organization.slug, projectSlug);

    // Add and rename a task
    await ganttPage.addTask();
    await ganttPage.editTaskName(0, "Concrete Pour");

    // Wait for sync to complete
    await ganttPage.waitForSync();

    // Reload the page
    await page.reload();
    await ganttPage.waitForLoad();

    // Verify the task persisted
    const taskName = await ganttPage.getTaskName(0);
    expect(taskName).toBe("Concrete Pour");
  });
});
