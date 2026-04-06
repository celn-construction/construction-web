import { test, expect, signInTestUser } from "../fixtures";

test.describe("No project prompt (inline)", () => {
  test("org with no projects shows create project prompt", async ({
    userWithOrg,
    page,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);

    // Should show the no-project prompt inline instead of redirecting
    await expect(page.getByText("Create Your First Project")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Create Project" })).toBeVisible();

    // Should NOT have redirected to /new-project
    expect(page.url()).toContain(userWithOrg.organization.slug);
    expect(page.url()).not.toContain("/new-project");
  });

  test("create project modal opens from no-project prompt", async ({
    userWithOrg,
    page,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);

    await expect(page.getByText("Create Your First Project")).toBeVisible({ timeout: 15000 });

    // Click Create Project button to open dialog
    await page.getByRole("button", { name: "Create Project" }).click();

    // AddProjectDialog should open
    await expect(page.getByText("New Project")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Set up a new construction project")).toBeVisible();
  });

  test("no redirect to /new-project when org has no projects", async ({
    userWithOrg,
    page,
  }) => {
    await signInTestUser(page, userWithOrg.user.email, userWithOrg.user.password);
    await page.goto(`/${userWithOrg.organization.slug}`);

    // Should stay on the org page showing the prompt, not redirect to /new-project
    await expect(page.getByText("Create Your First Project")).toBeVisible({ timeout: 15000 });
    expect(page.url()).not.toContain("/new-project");
  });
});
