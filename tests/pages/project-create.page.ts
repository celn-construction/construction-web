import type { Page } from "@playwright/test";

/**
 * Page Object Model for creating a project via the UI.
 *
 * Flow: click project switcher → "Create new project" → fill form → submit.
 */
export class ProjectCreatePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Open the project creation dialog from the project switcher. */
  async openDialog() {
    // Click the project switcher button in the sidebar
    const switcher = this.page.locator("button").filter({
      has: this.page.locator("text=Select project"),
    });

    // If "Select project" isn't visible, the switcher shows a project name — click the
    // ButtonBase that contains the CaretUpDown icon (project switcher trigger)
    if (await switcher.isVisible()) {
      await switcher.click();
    } else {
      // Fallback: click the button that has a CaretUpDown svg (the project switcher)
      const switcherAlt = this.page
        .locator("button")
        .filter({ has: this.page.locator("svg") })
        .first();
      await switcherAlt.click();
    }

    // Click "Create new project" in the dropdown menu
    const createBtn = this.page.getByText("Create new project");
    await createBtn.waitFor({ state: "visible", timeout: 5_000 });
    await createBtn.click();

    // Wait for the dialog to appear
    await this.page
      .locator("#project-name-input")
      .waitFor({ state: "visible", timeout: 5_000 });
  }

  /** Fill the project name field. */
  async fillName(name: string) {
    await this.page.locator("#project-name-input").fill(name);
  }

  /** Fill the location field. */
  async fillLocation(location: string) {
    const locationInput = this.page.locator(
      'input[placeholder*="123 Main St"]'
    );
    await locationInput.fill(location);
  }

  /** Click the "Create Project" submit button. */
  async submit() {
    await this.page
      .getByRole("button", { name: /Create Project/i })
      .click();
  }

  /**
   * Full flow: open dialog → fill name & location → submit → wait for success toast.
   * Returns the generated project slug (derived from the name).
   */
  async createProject(
    name: string,
    location: string = "123 Test St, New York, NY"
  ): Promise<string> {
    await this.openDialog();
    await this.fillName(name);
    await this.fillLocation(location);
    await this.submit();

    // Wait for success toast
    await this.page
      .getByText(/created/)
      .waitFor({ state: "visible", timeout: 15_000 });

    // Derive slug from name (same logic as the backend)
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}
