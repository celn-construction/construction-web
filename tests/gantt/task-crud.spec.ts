import { test, expect, signInTestUser } from "../fixtures";

// Gantt tests involve heavy Bryntum rendering — give extra time in CI
test.setTimeout(60_000);

test.describe("Gantt Task CRUD", () => {
  test("can add a task to an empty project", async ({
    userWithOrg,
    page,
    projectCreatePage,
    ganttPage,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);
    await page.waitForLoadState("networkidle");

    const projectSlug = await projectCreatePage.createProject("CRUD Test Project");
    await ganttPage.goto(userWithOrg.organization.slug, projectSlug);

    await ganttPage.addTask();

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

    await ganttPage.addTask();

    const countAfterAdd = await ganttPage.getTaskCount();
    expect(countAfterAdd).toBeGreaterThanOrEqual(1);

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

    await ganttPage.addTask();
    await ganttPage.editTaskName(0, "Concrete Pour");

    // Wait for sync to persist to server
    await ganttPage.waitForSync();

    await page.reload();
    await ganttPage.waitForLoad();

    const taskName = await ganttPage.getTaskName(0);
    expect(taskName).toBe("Concrete Pour");
  });
});
