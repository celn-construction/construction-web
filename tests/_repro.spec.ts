import { test } from "@playwright/test";
import { createUserWithProject } from "./fixtures/test-user";
import { signInTestUser } from "./fixtures/auth";

test("repro something went wrong", async ({ page }) => {
  const { user, organization, project } = await createUserWithProject();
  await signInTestUser(page, user.email, user.password);

  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.stack));

  const paths = [
    `/${organization.slug}`,
    `/${organization.slug}/projects/${project.slug}`,
    `/${organization.slug}/projects/${project.slug}/gantt`,
  ];

  for (const p of paths) {
    await page.goto("http://localhost:3000" + p, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(1500);
    const hasError = await page.getByText("Something went wrong").count();
    console.log(`\n>>> ${p} | finalUrl=${page.url()} | errorBoundary=${hasError > 0}`);
  }

  console.log("\n===== CONSOLE ERRORS =====");
  errors.forEach((e) => console.log(e));
  console.log("===== END =====");
});
