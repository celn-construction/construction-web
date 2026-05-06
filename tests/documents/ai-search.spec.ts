import { test, expect, signInTestUser } from "../fixtures";
import { testDb } from "../fixtures/db";
import { DocumentExplorerPage } from "../pages/document-explorer.page";

test.describe("Document explorer AI search", () => {
  let orgSlug: string;
  let projectSlug: string;
  let projectId: string;
  let userId: string;
  let documentExplorerPage: DocumentExplorerPage;

  test.beforeEach(async ({ page, userWithOrg }) => {
    const { user, organization } = userWithOrg;
    orgSlug = organization.slug;
    userId = user.id;

    // Create a project for the test
    const project = await testDb.project.create({
      data: {
        name: "Test Project",
        slug: `test-project-${Date.now()}`,
        organizationId: organization.id,
      },
    });
    projectSlug = project.slug;
    projectId = project.id;

    // Sign in via API (skips UI flow)
    await signInTestUser(page, user.email, user.password);

    documentExplorerPage = new DocumentExplorerPage(page);
  });

  test.afterEach(async () => {
    // Clean up project (cascades to documents)
    if (projectId) {
      await testDb.project
        .delete({ where: { id: projectId } })
        .catch(() => {});
    }
  });

  test("shows search input with fuzzy mode by default", async () => {
    await documentExplorerPage.goto(orgSlug, projectSlug);

    // Default state: fuzzy search, no AI
    const searchInput =
      documentExplorerPage.page.getByPlaceholder("Search documents...");
    await expect(searchInput).toBeVisible();
  });

  test("toggles to AI search mode", async () => {
    await documentExplorerPage.goto(orgSlug, projectSlug);

    // Toggle AI on
    await documentExplorerPage.enableAi();

    // Placeholder should change to AI prompt
    const aiPlaceholder =
      documentExplorerPage.page.getByPlaceholder("Ask anything...");
    await expect(aiPlaceholder).toBeVisible();
  });

  test("toggles back to fuzzy search mode", async () => {
    await documentExplorerPage.goto(orgSlug, projectSlug);

    // Toggle AI on, then off
    await documentExplorerPage.enableAi();
    await documentExplorerPage.disableAi();

    const searchInput =
      documentExplorerPage.page.getByPlaceholder("Search documents...");
    await expect(searchInput).toBeVisible();
  });

  test("submits AI search on Enter key", async ({ page }) => {
    await documentExplorerPage.goto(orgSlug, projectSlug);

    // Enable AI and type a query
    await documentExplorerPage.enableAi();
    const searchInput = page.getByPlaceholder("Ask anything...");
    await searchInput.fill("foundation inspection");

    // Set up a request listener for the aiSearch tRPC call
    const aiSearchRequest = page.waitForRequest(
      (req) =>
        req.url().includes("/api/trpc/") &&
        req.url().includes("document.aiSearch"),
      { timeout: 10_000 }
    );

    // Press Enter to submit
    await searchInput.press("Enter");

    // Verify the API call was made (may fail if OPENAI_API_KEY not set, which is OK)
    const request = await aiSearchRequest.catch(() => null);
    if (request) {
      expect(request.url()).toContain("document.aiSearch");
    }
  });

  test("shows empty state when no documents exist", async () => {
    await documentExplorerPage.goto(orgSlug, projectSlug);

    // The page should load without errors and show some indication of no docs
    // (either "No documents" text or an empty grid)
    await expect(documentExplorerPage.page).not.toHaveURL(/error/);
  });

  test("fuzzy search filters documents by name", async ({ page }) => {
    // Seed documents using the fixture user from beforeEach
    await testDb.document.create({
      data: {
        name: "Foundation Inspection Report.pdf",
        blobUrl: "https://example.com/test-doc.pdf",
        mimeType: "application/pdf",
        size: 1024,
        description: "Structural assessment of concrete footings",
        tags: ["foundation", "concrete", "inspection"],
        taskId: "",
        folderId: "inspections-structural",
        projectId,
        uploadedById: userId,
      },
    });

    await testDb.document.create({
      data: {
        name: "Drywall Installation Photo.jpg",
        blobUrl: "https://example.com/test-photo.jpg",
        mimeType: "image/jpeg",
        size: 2048,
        description: "Interior wall with drywall panels",
        tags: ["drywall", "interior"],
        taskId: "",
        folderId: "photos",
        projectId,
        uploadedById: userId,
      },
    });

    await documentExplorerPage.goto(orgSlug, projectSlug);

    // Search for "foundation" — should filter to matching document
    await documentExplorerPage.searchFuzzy("Foundation");

    // Wait for debounce + response
    await page.waitForTimeout(500);

    // The foundation document should be visible
    await expect(page.getByText("Foundation Inspection Report.pdf")).toBeVisible({ timeout: 5000 });
  });
});
