import { test, expect, signInTestUser } from "../fixtures";

// Gantt tests involve heavy Bryntum rendering — give extra time in CI
test.setTimeout(60_000);

test.describe("Gantt Parent & Subtask", () => {
  test("can add a subtask via the row menu", async ({
    userWithOrg,
    page,
    projectCreatePage,
    ganttPage,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);
    await page.waitForLoadState("networkidle");

    const projectSlug = await projectCreatePage.createProject("Subtask Test Project");
    await ganttPage.goto(userWithOrg.organization.slug, projectSlug);

    // Add a parent task
    await ganttPage.addTask();
    await ganttPage.editTaskName(0, "Phase 1");

    // Add a subtask via the ⋮ menu
    await ganttPage.addSubtaskViaMenu(0);

    // Should now have 2 rows: parent + subtask
    const count = await ganttPage.getTaskCount();
    expect(count).toBe(2);

    // The subtask should have the default name
    const subtaskName = await ganttPage.getTaskName(1);
    expect(subtaskName).toBe("New Subtask");
  });

  test("parent duration auto-adjusts when subtask duration changes", async ({
    userWithOrg,
    page,
    projectCreatePage,
    ganttPage,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);
    await page.waitForLoadState("networkidle");

    const projectSlug = await projectCreatePage.createProject("AutoAdjust Test Project");
    await ganttPage.goto(userWithOrg.organization.slug, projectSlug);

    // Add a parent task
    await ganttPage.addTask();
    await ganttPage.editTaskName(0, "Phase 1");

    // Add a subtask
    await ganttPage.addSubtaskViaMenu(0);

    // Read the parent's initial duration
    const initialParentDuration = await ganttPage.getTaskDuration(0);

    // Edit the subtask duration to 5 days
    await ganttPage.editTaskDuration(1, "5");

    // Wait for scheduling engine to recalculate
    await page.waitForTimeout(2_000);

    // Parent duration should have auto-adjusted to encompass the subtask
    const updatedParentDuration = await ganttPage.getTaskDuration(0);

    // The parent should show at least 5 days (matching or exceeding the subtask)
    // Parse the numeric portion — Bryntum displays "5 days" or "5d" etc.
    const durationNum = parseFloat(updatedParentDuration.replace(/[^0-9.]/g, ""));
    expect(durationNum).toBeGreaterThanOrEqual(5);

    // Verify it actually changed from the initial value
    expect(updatedParentDuration).not.toBe(initialParentDuration);
  });
});
